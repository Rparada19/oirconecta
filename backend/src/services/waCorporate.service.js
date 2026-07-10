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
const { sendWhatsAppText, sendWhatsAppTemplate } = require('../notifications/channels/whatsapp');
const catalog = require('./waTemplates.catalog');

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

/**
 * Inicia una conversación nueva con un contacto (nombre + teléfono) enviando una
 * plantilla HSM aprobada por Meta. Es la única forma de escribir "en frío" a
 * alguien que nunca nos ha escrito.
 *
 * @param {object} p
 * @param {string} p.phone            número E.164 sin '+' (ej. 573001234567)
 * @param {string} p.contactName
 * @param {string} p.templateKey      key del catálogo (ej. 'saludo_paciente_bogota')
 * @param {object} p.variables        valores de las variables (ej. { nombre: 'María' })
 * @param {string} [p.businessLine='CRM']
 * @param {string} [p.sentByUserId]
 */
async function startNewConversation({
  phone, contactName, templateKey, variables = {}, contactType = null, sentByUserId = null,
}) {
  const phoneClean = String(phone || '').replace(/\D/g, '');
  if (!phoneClean || phoneClean.length < 10) {
    const err = new Error('Teléfono inválido — debe incluir código de país (ej. 573001234567)');
    err.code = 'INVALID_PHONE';
    throw err;
  }

  const template = catalog.getByKey(templateKey);
  if (!template) {
    const err = new Error(`Plantilla "${templateKey}" no existe en el catálogo`);
    err.code = 'TEMPLATE_NOT_FOUND';
    throw err;
  }

  // Deriva contactType desde la plantilla si no lo pasaron explícito
  const finalContactType = contactType || template.contactType || 'OTROS';
  const typeMeta = catalog.getContactType(finalContactType);
  const businessLine = typeMeta?.businessLine || 'CRM';

  // Verifica coherencia plantilla ↔ contactType
  if (template.contactType && template.contactType !== finalContactType) {
    const err = new Error(`La plantilla "${template.label}" es para "${template.contactType}", no para "${finalContactType}"`);
    err.code = 'TEMPLATE_TYPE_MISMATCH';
    throw err;
  }

  // Construye positional params (throw si falta alguna variable)
  const bodyParams = catalog.buildBodyParams(template, variables);
  const preview = catalog.renderPreview(template, variables);

  // Find-or-create conversación
  let conversation = await prisma.whatsAppConversation.findUnique({ where: { phone: phoneClean } });

  const patientLink = await (async () => {
    const last10 = phoneClean.slice(-10);
    if (!last10) return null;
    const patient = await prisma.patient.findFirst({
      where: { telefono: { contains: last10 } },
      select: { id: true },
    });
    return patient?.id || null;
  })();

  if (!conversation) {
    conversation = await prisma.whatsAppConversation.create({
      data: {
        phone: phoneClean,
        contactName: contactName || null,
        businessLine,
        contactType: finalContactType,
        intent: 'SIN_CLASIFICAR',
        status: 'HUMAN',
        patientId: patientLink,
      },
    });
  } else {
    // Actualiza tipificación y contactName si no estaban
    const patch = {};
    if (contactName && !conversation.contactName) patch.contactName = contactName;
    if (!conversation.contactType && finalContactType) patch.contactType = finalContactType;
    if (Object.keys(patch).length > 0) {
      conversation = await prisma.whatsAppConversation.update({
        where: { id: conversation.id }, data: patch,
      });
    }
  }

  // Envía a Meta
  const phoneNumberId = process.env.META_CORPORATE_PHONE_NUMBER_ID
    || process.env.WHATSAPP_PHONE_NUMBER_ID;

  let providerId = null;
  let deliveryStatus = 'sent';
  let errorMessage = null;
  try {
    // sendWhatsAppTemplate usa WHATSAPP_PHONE_NUMBER_ID por env; para forzar el corporativo
    // usamos ese mismo env. En este flujo asumimos que WHATSAPP_PHONE_NUMBER_ID = corporativo.
    if (phoneNumberId && phoneNumberId !== process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.warn('[wa-corp] atención: sendWhatsAppTemplate usa WHATSAPP_PHONE_NUMBER_ID, no META_CORPORATE_PHONE_NUMBER_ID');
    }
    const result = await sendWhatsAppTemplate({
      to: phoneClean,
      metaTemplateName: template.metaName,
      locale: template.locale || 'es_CO',
      bodyParams,
    });
    providerId = result?.providerMessageId || null;
  } catch (e) {
    deliveryStatus = 'failed';
    errorMessage = (e.message || 'Error desconocido').slice(0, 500);
    console.error('[wa-corp] sendTemplate falló:', e.message);
  }

  const msg = await prisma.whatsAppMessage.create({
    data: {
      conversationId: conversation.id,
      wamid: providerId,
      direction: 'OUTBOUND',
      type: 'template',
      body: preview,
      sentByBot: false,
      sentByUserId,
      deliveryStatus,
      errorMessage,
      timestamp: new Date(),
    },
  });

  await prisma.whatsAppConversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: msg.timestamp,
      lastMessagePreview: `Tú: ${preview.slice(0, 140)}`,
    },
  });

  if (deliveryStatus === 'failed') {
    const err = new Error(errorMessage);
    err.code = 'SEND_FAILED';
    err.conversationId = conversation.id;
    err.messageId = msg.id;
    throw err;
  }

  return { conversationId: conversation.id, messageId: msg.id, providerId };
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
  startNewConversation,
  persistDeliveryUpdate,
  markConversationRead,
};
