/**
 * F9 — WhatsApp corporativo OírConecta (número único +57 317 150 3944).
 *
 * Independiente del ProfessionalWhatsAppChannel (que es multi-tenant del directorio).
 * Este número maneja 3 flujos en un solo canal:
 *   1. Captación de profesionales para el directorio (businessLine = DIRECTORIO)
 *   2. Pacientes del centro Bogotá (businessLine = CRM)
 *   3. Personas buscando info (businessLine = CRM por defecto, se refina en 9b)
 *
 * Fase 9a: solo persiste mensajes entrantes + envío manual desde bandeja.
 * NO hay bot ni auto-respuesta — el equipo humano responde desde /portal-crm/whatsapp.
 */

const { PrismaClient } = require('@prisma/client');
const { sendWhatsAppText } = require('../notifications/channels/whatsapp');

const prisma = new PrismaClient();

const WINDOW_MS = 24 * 60 * 60 * 1000;

/** ¿Este phone_number_id corresponde al número corporativo? */
function isCorporatePhoneNumberId(phoneNumberId) {
  const corporate = process.env.META_CORPORATE_PHONE_NUMBER_ID;
  if (!corporate) return false;
  return String(phoneNumberId) === String(corporate);
}

/** Find-or-create conversación por número del cliente. */
async function findOrCreateConversation({ phone, contactName }) {
  const phoneClean = String(phone || '').replace(/\D/g, '');
  if (!phoneClean) throw new Error('phone requerido');

  const existing = await prisma.whatsAppConversation.findUnique({ where: { phone: phoneClean } });
  if (existing) return { conversation: existing, isNew: false };

  // Intento vincular a un Patient existente por los últimos 10 dígitos
  const last10 = phoneClean.slice(-10);
  let patientId = null;
  if (last10) {
    const patient = await prisma.patient.findFirst({
      where: { telefono: { contains: last10 } },
      select: { id: true },
    });
    if (patient) patientId = patient.id;
  }

  const created = await prisma.whatsAppConversation.create({
    data: {
      phone: phoneClean,
      contactName: contactName || null,
      businessLine: 'CRM',
      intent: 'SIN_CLASIFICAR',
      status: 'HUMAN',
      patientId,
    },
  });
  return { conversation: created, isNew: true };
}

/** Persiste un mensaje entrante y actualiza contadores/ventana. */
async function persistIncomingMessage({
  phoneNumberId, fromWaId, wamid, type, textBody, contactName, tsSeconds,
}) {
  const { conversation, isNew } = await findOrCreateConversation({
    phone: fromWaId,
    contactName,
  });

  // Dedup por wamid
  if (wamid) {
    const dup = await prisma.whatsAppMessage.findFirst({
      where: { wamid },
      select: { id: true },
    });
    if (dup) return { skipped: 'duplicate', conversationId: conversation.id };
  }

  const timestamp = tsSeconds ? new Date(Number(tsSeconds) * 1000) : new Date();

  const preview = (textBody || `[${type}]`).slice(0, 140);

  await prisma.$transaction([
    prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        wamid: wamid || null,
        direction: 'INBOUND',
        type: type || 'text',
        body: textBody || null,
        timestamp,
      },
    }),
    prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: timestamp,
        lastMessagePreview: preview,
        unreadCount: { increment: 1 },
        windowExpiresAt: new Date(Date.now() + WINDOW_MS),
        contactName: conversation.contactName || contactName || undefined,
      },
    }),
  ]);

  return { persisted: true, conversationId: conversation.id, isNew };
}

/**
 * Persiste un mensaje saliente (nosotros al cliente) y lo envía por Meta.
 * @param {object} p
 * @param {string} p.conversationId
 * @param {string} p.text
 * @param {string} [p.sentByUserId] - null si lo manda el bot
 * @param {boolean} [p.sentByBot=false]
 */
async function sendTextToConversation({ conversationId, text, sentByUserId = null, sentByBot = false }) {
  const conv = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, phone: true, windowExpiresAt: true },
  });
  if (!conv) throw new Error('Conversación no encontrada');

  // Verifica ventana 24h (para text libre — HSM sería otro flujo)
  const now = new Date();
  if (conv.windowExpiresAt && conv.windowExpiresAt < now) {
    const err = new Error('Ventana 24h cerrada — usa plantilla HSM');
    err.code = 'WINDOW_CLOSED';
    throw err;
  }

  const phoneNumberId = process.env.META_CORPORATE_PHONE_NUMBER_ID
    || process.env.WHATSAPP_PHONE_NUMBER_ID;

  let providerId = null;
  let deliveryStatus = 'sent';
  let errorMessage = null;
  try {
    const result = await sendWhatsAppText({
      to: conv.phone,
      text,
      phoneNumberId,
    });
    providerId = result?.providerMessageId || null;
  } catch (e) {
    deliveryStatus = 'failed';
    errorMessage = (e.message || 'Error desconocido').slice(0, 500);
    console.error('[wa-corp] sendText falló:', e.message);
  }

  const msg = await prisma.whatsAppMessage.create({
    data: {
      conversationId: conv.id,
      wamid: providerId,
      direction: 'OUTBOUND',
      type: 'text',
      body: text,
      sentByBot,
      sentByUserId: sentByUserId || null,
      deliveryStatus,
      errorMessage,
      timestamp: new Date(),
    },
  });

  const preview = String(text).slice(0, 140);
  await prisma.whatsAppConversation.update({
    where: { id: conv.id },
    data: {
      lastMessageAt: msg.timestamp,
      lastMessagePreview: `Tú: ${preview}`,
    },
  });

  if (deliveryStatus === 'failed') {
    const err = new Error(errorMessage);
    err.code = 'SEND_FAILED';
    err.messageId = msg.id;
    throw err;
  }

  return { messageId: msg.id, providerId };
}

/** Procesa update de estado de delivery (delivered/read/failed) que manda Meta. */
async function persistDeliveryUpdate({ wamid, status, errorText }) {
  if (!wamid) return { skipped: 'no-wamid' };
  const updated = await prisma.whatsAppMessage.updateMany({
    where: { wamid },
    data: {
      deliveryStatus: status,
      errorMessage: errorText ? String(errorText).slice(0, 500) : undefined,
    },
  });
  return { updated: updated.count };
}

/** Marca todos los mensajes inbound de la conversación como leídos (unreadCount=0). */
async function markConversationRead(conversationId) {
  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: { unreadCount: 0 },
  });
  return { ok: true };
}

module.exports = {
  isCorporatePhoneNumberId,
  findOrCreateConversation,
  persistIncomingMessage,
  sendTextToConversation,
  persistDeliveryUpdate,
  markConversationRead,
};
