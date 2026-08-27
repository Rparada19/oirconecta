/**
 * F5.3 — Dispatcher de WhatsApp al agente IA del profesional.
 *
 * Flujo:
 *  1. Webhook Meta llama processIncomingEvent(body).
 *  2. Para cada mensaje:
 *     a) Identifica profesional por phoneNumberId → ProfessionalWhatsAppChannel.
 *     b) Idempotencia: si IaMessage.externalMessageId ya existe, salta.
 *     c) Find-or-create Patient por número WhatsApp del paciente (fromWaId).
 *     d) Reutiliza IaConversation activa (channel=whatsapp, profileId, patientId)
 *        o crea una nueva (cuenta cuota).
 *     e) Llama iaAgent.chat() con conversationId + message.
 *     f) Persiste el wamid del mensaje entrante como externalMessageId.
 *     g) Envía la respuesta vía channels/whatsapp.sendWhatsAppText desde el
 *        phoneNumberId del profesional.
 *
 * Verificación de webhook (Meta lo pide al registrar):
 *   GET /webhooks/meta-whatsapp?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 *   Devolvemos el challenge si el token coincide con META_WEBHOOK_VERIFY_TOKEN.
 */

const { PrismaClient } = require('@prisma/client');
const ia = require('./iaAgent.service');
const { sendWhatsAppText } = require('../notifications/channels/whatsapp');

const prisma = new PrismaClient();

class WaError extends Error {
  constructor(message, { status = 400, code } = {}) {
    super(message);
    this.status = status; this.code = code;
  }
}

/** Verifica el handshake inicial del webhook de Meta. */
function verifyWebhook({ mode, token, challenge }) {
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN;
  if (!expected) {
    console.warn('[wa-webhook] META_WEBHOOK_VERIFY_TOKEN no configurado — rechazando verify');
    return null;
  }
  if (mode === 'subscribe' && token === expected) return challenge;
  return null;
}

/** Find-or-create Patient global por número WhatsApp. */
async function findOrCreatePatientByPhone(fromWaId, contactName) {
  const phone = String(fromWaId || '').trim();
  if (!phone) throw new WaError('fromWaId vacío');
  const existing = await prisma.patient.findFirst({
    where: { telefono: { contains: phone.slice(-10) } }, // últimos 10 dígitos
  });
  if (existing) return existing;
  return prisma.patient.create({
    data: {
      nombre: (contactName && String(contactName).trim()) || `Paciente WhatsApp +${phone}`,
      telefono: phone,
      procedencia: 'whatsapp-ia',
    },
  });
}

/** Reusa una IaConversation reciente (mismas 24h) o crea una nueva. */
async function findOrCreateConversation(profileId, patientId, fromWaId) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const active = await prisma.iaConversation.findFirst({
    where: {
      profileId, patientId, channel: 'whatsapp', status: 'ACTIVE',
      lastMessageAt: { gte: since },
    },
    orderBy: { lastMessageAt: 'desc' },
  });
  if (active) return { conversation: active, isNew: false };
  const created = await prisma.iaConversation.create({
    data: {
      profileId, patientId, channel: 'whatsapp', status: 'ACTIVE',
      metadata: { fromWaId },
    },
  });
  return { conversation: created, isNew: true };
}

/**
 * Procesa un mensaje individual: dispatch al agente, envía respuesta.
 * Retorna { skipped:true } si dedup, { reply } en éxito.
 */
async function processIncomingMessage({
  phoneNumberId, fromWaId, messageId, text, contactName,
}) {
  if (!phoneNumberId || !fromWaId || !messageId || !text) {
    return { skipped: true, reason: 'PAYLOAD_INCOMPLETO' };
  }

  // 1) Identifica profesional por número
  const channel = await prisma.professionalWhatsAppChannel.findUnique({
    where: { phoneNumberId },
    select: { profileId: true, active: true, phoneNumberId: true },
  });
  if (!channel || !channel.active) {
    console.warn('[wa-dispatch] sin canal activo para phoneNumberId', phoneNumberId);
    return { skipped: true, reason: 'CHANNEL_INACTIVE' };
  }

  // 2) Dedup por wamid
  const dup = await prisma.iaMessage.findUnique({ where: { externalMessageId: messageId } });
  if (dup) return { skipped: true, reason: 'DUPLICATE' };

  // 3) Patient
  const patient = await findOrCreatePatientByPhone(fromWaId, contactName);

  // 4) Conversación
  const { conversation, isNew } = await findOrCreateConversation(channel.profileId, patient.id, fromWaId);

  // 5) Llamar agente
  let agentResult;
  try {
    agentResult = await ia.chat(channel.profileId, {
      conversationId: conversation.id,
      message: text,
      metadata: { channel: 'whatsapp', fromWaId },
    });
  } catch (e) {
    // Si quota agotada, responder al paciente
    if (e.code === 'QUOTA_EXCEEDED') {
      await sendWhatsAppText({
        to: fromWaId,
        text: 'Hemos alcanzado el límite mensual de respuestas automáticas. Una persona del consultorio se pondrá en contacto pronto.',
        phoneNumberId,
      }).catch((err) => console.error('[wa-dispatch] send error:', err.message));
    } else {
      console.error('[wa-dispatch] iaAgent.chat error:', e.message);
    }
    return { skipped: true, reason: e.code || 'AGENT_ERROR' };
  }

  // 6) Marcar el wamid en el último IaMessage role=user (que iaAgent acaba de crear)
  //    Buscamos el mensaje de user más reciente sin externalMessageId.
  await prisma.iaMessage.updateMany({
    where: { conversationId: conversation.id, role: 'user', externalMessageId: null },
    data: { externalMessageId: messageId },
  }).catch(() => {});

  // 7) Envía respuesta
  try {
    await sendWhatsAppText({ to: fromWaId, text: agentResult.reply, phoneNumberId });
  } catch (e) {
    console.error('[wa-dispatch] sendWhatsAppText falló:', e.message);
    return { sent: false, reply: agentResult.reply, error: e.message };
  }
  return { sent: true, isNew, reply: agentResult.reply };
}

/**
 * Procesa el cuerpo completo del webhook Meta (puede traer múltiples entry/messages).
 */
async function processIncomingEvent(body) {
  console.log('[wa-debug] processIncomingEvent object=', body?.object, 'entries=', body?.entry?.length);
  if (body?.object !== 'whatsapp_business_account') {
    console.log('[wa-debug] IGNORED object mismatch');
    return { ok: true, ignored: 'OBJECT_MISMATCH' };
  }
  const corp = require('./waCorporate.service');
  const entries = body.entry || [];
  let processed = 0, skipped = 0;
  for (const entry of entries) {
    for (const change of (entry.changes || [])) {
      if (change.field !== 'messages') continue;
      const value = change.value || {};
      const phoneNumberId = value.metadata?.phone_number_id;

      // Statuses (delivered/read/failed) del outbound — actualizan estado del mensaje
      for (const st of (value.statuses || [])) {
        const errorText = st.errors?.[0]?.message || st.errors?.[0]?.title || null;
        try {
          if (corp.isCorporatePhoneNumberId(phoneNumberId)) {
            await corp.persistDeliveryUpdate({ wamid: st.id, status: st.status, errorText });
          }
        } catch (e) { console.error('[wa] delivery update (corp) falló:', e.message); }
        try {
          // Notificaciones al paciente (confirmaciones y recordatorios): salen del
          // número clínico, así que se actualizan siempre, no solo en el corporativo.
          const { applyDeliveryStatus } = require('../notifications');
          await applyDeliveryStatus({
            wamid: st.id, status: st.status, errorText, timestamp: st.timestamp,
          });
        } catch (e) { console.error('[wa] delivery update (notif) falló:', e.message); }
      }

      const contacts = value.contacts || [];
      const contactByWaId = Object.fromEntries(contacts.map((c) => [c.wa_id, c.profile?.name]));

      // F9 — Si es el número corporativo, persiste en whatsapp_conversations y no
      // pasa por el agente IA del directorio. La respuesta es manual desde la
      // bandeja del CRM (Fase 9a) o vía bot corporativo (Fase 9b).
      console.log('[wa-debug] phoneNumberId=', phoneNumberId, 'isCorporate=', corp.isCorporatePhoneNumberId(phoneNumberId), 'messages=', (value.messages || []).length);
      if (corp.isCorporatePhoneNumberId(phoneNumberId)) {
        const bot = require('./waCorporateBot.service');
        for (const msg of (value.messages || [])) {
          try {
            // Extrae texto según el tipo del mensaje
            let textBody = null;
            let btnPayload = null;
            let mediaId = null;
            let mediaMime = null;
            if (msg.type === 'text') {
              textBody = msg.text?.body || null;
            } else if (msg.type === 'interactive') {
              // Botón interactivo (respuesta a los botones del bot)
              btnPayload = msg.interactive?.button_reply
                ? { id: msg.interactive.button_reply.id, title: msg.interactive.button_reply.title }
                : msg.interactive?.list_reply
                ? { id: msg.interactive.list_reply.id, title: msg.interactive.list_reply.title }
                : null;
              textBody = btnPayload?.title || msg.interactive?.body?.text || null;
            } else if (msg.type === 'image' || msg.type === 'document') {
              // El paciente mandó un archivo — típicamente su audiometría.
              const media = msg[msg.type] || {};
              mediaId = media.id || null;
              mediaMime = media.mime_type || null;
              textBody = media.caption || (msg.type === 'image' ? '[imagen]' : `[documento] ${media.filename || ''}`.trim());
            } else if (msg.type === 'button') {
              // Botón de plantilla (quick reply) — trae payload + texto
              textBody = msg.button?.text || null;
              btnPayload = msg.button?.payload
                ? { id: msg.button.payload, title: msg.button?.text || '' }
                : null;
            }

            const r = await corp.persistIncomingMessage({
              phoneNumberId,
              fromWaId: msg.from,
              wamid: msg.id,
              type: msg.type || 'text',
              textBody,
              contactName: contactByWaId[msg.from],
              tsSeconds: msg.timestamp,
              mediaId,
              mediaMime,
            });
            if (r.persisted) {
              processed++;
            } else {
              // Antes esto era mudo: un descarte por duplicado no dejaba rastro
              // y el mensaje simplemente no aparecía en la bandeja.
              console.warn('[wa-corp] mensaje NO persistido', msg.id, 'de', msg.from,
                'motivo=', r.skipped || 'desconocido', 'conv=', r.conversationId || '-');
              skipped++;
              continue;
            }

            // Confirmación de asistencia desde el recordatorio (botón "Confirmar").
            if (btnPayload?.id && String(btnPayload.id).startsWith('confirm_appt:')) {
              const token = String(btnPayload.id).split(':')[1];
              try {
                const appointmentsService = require('./appointments.service');
                await appointmentsService.confirmByToken(token);
                await corp.sendTextToConversation({
                  conversationId: r.conversationId,
                  text: '¡Gracias! Confirmaste tu asistencia. Te esperamos. 🙌',
                  sentByBot: true,
                });
              } catch (ce) {
                console.error('[wa] confirm_appt falló:', ce.message);
              }
              continue; // no pasar al bot
            }

            // Adjunto: se descarga, se lee y se responde orientando a la cita.
            if (mediaId && corp.botHabilitado()) {
              try {
                const waMedia = require('./waMedia.service');
                const archivo = await waMedia.descargar(mediaId);
                const lectura = archivo
                  ? await require('./waExamRead.service').leerExamen(archivo, msg[msg.type]?.caption || '')
                  : null;
                if (lectura) {
                  await corp.sendTextToConversation({
                    conversationId: r.conversationId,
                    text: lectura.texto,
                    sentByBot: true,
                  });
                  if (lectura.urgente) {
                    await prisma.whatsAppConversation.update({
                      where: { id: r.conversationId },
                      data: { status: 'ESCALATED', unreadCount: { increment: 1 } },
                    });
                  }
                  continue; // ya se le respondió al adjunto
                }
              } catch (me) {
                console.error('[wa-examen] falló:', me.message);
              }
            }

            // F9b — Dispatcher del bot corporativo (solo si WA_BOT_ENABLED=true)
            try {
              if (btnPayload) {
                // Respuesta a botones interactivos del handshake → tipifica y escala
                await bot.handleButtonReply({
                  conversationId: r.conversationId,
                  buttonId: btnPayload.id,
                  buttonTitle: btnPayload.title,
                });
              } else if (r.isNew) {
                // Primer mensaje entrante en la conversación → handshake con botones
                await bot.maybeSendHandshake(r.conversationId);
              } else if (textBody) {
                // Si la conversación estaba CLOSED (humano cerró o timeout) y
                // llega un mensaje nuevo del paciente, reabrimos a BOT para que
                // la IA vuelva a atender. Excepción: PROFESIONAL_DIRECTORIO
                // (funnel comercial) se deja CLOSED para que el equipo retome.
                await bot.reopenIfClosed(r.conversationId);
                // Mensaje siguiente (después del handshake) → Claude Haiku responde
                // según la rama (contactType). Solo actúa si status=BOT.
                await bot.handleTextForBot({
                  conversationId: r.conversationId,
                  incomingText: textBody,
                });
                // Memoria larga: se refresca aparte para no demorar la respuesta
                // al paciente. Solo trabaja cada N mensajes nuevos.
                bot.actualizarResumen(r.conversationId)
                  .catch((e) => console.warn('[wa-bot] resumen:', e.message));
              }
            } catch (be) {
              console.error('[wa-bot] dispatcher falló:', be.message);
            }
          } catch (e) {
            console.error('[wa-corp] error persistiendo msg', msg.id, e.message);
            skipped++;
          }
        }
        continue;
      }

      // Multi-tenant directorio (comportamiento original)
      for (const msg of (value.messages || [])) {
        if (msg.type !== 'text') {
          skipped++;
          continue;
        }
        try {
          const r = await processIncomingMessage({
            phoneNumberId,
            fromWaId: msg.from,
            messageId: msg.id,
            text: msg.text?.body || '',
            contactName: contactByWaId[msg.from],
          });
          if (r.skipped) skipped++; else processed++;
        } catch (e) {
          console.error('[wa-dispatch] error procesando msg', msg.id, e.message);
          skipped++;
        }
      }
    }
  }
  return { ok: true, processed, skipped };
}

// ─────────────────────────────────────────────────────────────
// CRUD del canal (profesional + admin)
// ─────────────────────────────────────────────────────────────

async function getMyChannel(profileId) {
  const ch = await prisma.professionalWhatsAppChannel.findUnique({ where: { profileId } });
  return ch || null;
}

async function upsertMyChannel(profileId, payload) {
  const { phoneNumberId, phoneNumberE164, wabaId, displayName, active = false } = payload || {};
  if (!phoneNumberId || !phoneNumberE164) {
    throw new WaError('phoneNumberId y phoneNumberE164 son requeridos');
  }
  // Verifica que el número no esté tomado por otro profesional
  const taken = await prisma.professionalWhatsAppChannel.findUnique({ where: { phoneNumberId } });
  if (taken && taken.profileId !== profileId) {
    throw new WaError('Ese phoneNumberId ya está vinculado a otro profesional', { status: 409, code: 'PHONE_TAKEN' });
  }
  return prisma.professionalWhatsAppChannel.upsert({
    where: { profileId },
    update: { phoneNumberId, phoneNumberE164, wabaId: wabaId ?? null, displayName: displayName ?? null, active: !!active },
    create: { profileId, phoneNumberId, phoneNumberE164, wabaId: wabaId ?? null, displayName: displayName ?? null, active: !!active },
  });
}

async function deleteMyChannel(profileId) {
  await prisma.professionalWhatsAppChannel.delete({ where: { profileId } }).catch(() => {});
  return { deleted: true };
}

async function adminVerifyChannel(profileId) {
  return prisma.professionalWhatsAppChannel.update({
    where: { profileId },
    data: { verifiedAt: new Date(), active: true },
  });
}

module.exports = {
  WaError,
  verifyWebhook,
  processIncomingEvent,
  getMyChannel,
  upsertMyChannel,
  deleteMyChannel,
  adminVerifyChannel,
};
