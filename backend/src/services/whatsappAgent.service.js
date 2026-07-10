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
  if (body?.object !== 'whatsapp_business_account') return { ok: true, ignored: 'OBJECT_MISMATCH' };
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
        try {
          if (corp.isCorporatePhoneNumberId(phoneNumberId)) {
            await corp.persistDeliveryUpdate({
              wamid: st.id,
              status: st.status,
              errorText: st.errors?.[0]?.message,
            });
          }
        } catch (e) { console.error('[wa] delivery update falló:', e.message); }
      }

      const contacts = value.contacts || [];
      const contactByWaId = Object.fromEntries(contacts.map((c) => [c.wa_id, c.profile?.name]));

      // F9 — Si es el número corporativo, persiste en whatsapp_conversations y no
      // pasa por el agente IA del directorio. La respuesta es manual desde la
      // bandeja del CRM (Fase 9a) o vía bot corporativo (Fase 9b).
      if (corp.isCorporatePhoneNumberId(phoneNumberId)) {
        const bot = require('./waCorporateBot.service');
        for (const msg of (value.messages || [])) {
          try {
            // Extrae texto según el tipo del mensaje
            let textBody = null;
            let btnPayload = null;
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
            } else if (msg.type === 'button') {
              // Botón de plantilla (no interactivo)
              textBody = msg.button?.text || null;
            }

            const r = await corp.persistIncomingMessage({
              phoneNumberId,
              fromWaId: msg.from,
              wamid: msg.id,
              type: msg.type || 'text',
              textBody,
              contactName: contactByWaId[msg.from],
              tsSeconds: msg.timestamp,
            });
            if (r.persisted) processed++; else { skipped++; continue; }

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
                // Mensaje siguiente (después del handshake) → Claude Haiku responde
                // según la rama (contactType). Solo actúa si status=BOT.
                await bot.handleTextForBot({
                  conversationId: r.conversationId,
                  incomingText: textBody,
                });
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
