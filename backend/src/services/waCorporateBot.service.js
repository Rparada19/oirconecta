/**
 * F9b — Bot del WhatsApp corporativo OírConecta.
 *
 * ⚠️ IMPORTANTE: Este código es INTERNO. NO es el bot que se vende a
 * profesionales del directorio (ese es iaAgent.service). Este bot atiende
 * la línea corporativa +57 317 150 3944 y solo tiene sentido para el
 * negocio interno (centro Bogotá + captación al directorio).
 *
 * Fase 9b.1 — Handshake inicial:
 *  · Cuando llega un mensaje INBOUND a una conversación sin contactType,
 *    el bot responde con botones interactivos (Paciente/Profesional/Info).
 *  · Cuando el cliente presiona un botón, se tipifica la conversación
 *    y el bot manda un mensaje puente (siguiente acción) antes de escalar
 *    a humano.
 *  · Después de tipificar, la conversación queda en status ESCALATED
 *    (humano ve el badge y toma). En 9b.2 el bot seguirá conversando con
 *    Claude Haiku dentro de la rama.
 *
 * Se activa con env WA_BOT_ENABLED=true. Sin esa env, el bot no hace nada
 * y la conversación queda en HUMAN desde el primer mensaje (bandeja manual).
 */

const { PrismaClient } = require('@prisma/client');
const { sendWhatsAppText, sendWhatsAppInteractiveButtons } = require('../notifications/channels/whatsapp');

const prisma = new PrismaClient();

const BUTTON_IDS = {
  PACIENTE_BOGOTA: 'wa_intent_paciente',
  PROFESIONAL_DIRECTORIO: 'wa_intent_profesional',
  INFO_GENERAL: 'wa_intent_info',
};

function botEnabled() {
  return process.env.WA_BOT_ENABLED === 'true';
}

/** Formatea el nombre corto para el saludo. */
function firstName(fullName) {
  return String(fullName || '').split(/\s+/)[0] || '';
}

/**
 * Envía el handshake inicial con 3 botones de intención.
 * Solo se dispara si:
 *   - Es el primer mensaje INBOUND de la conversación (sin mensajes OUTBOUND previos).
 *   - La conversación aún no tiene contactType.
 *   - El bot está habilitado por env.
 */
async function maybeSendHandshake(conversationId) {
  if (!botEnabled()) return { skipped: 'bot-disabled' };

  const conv = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, phone: true, contactName: true, contactType: true, status: true },
  });
  if (!conv) return { skipped: 'conv-not-found' };
  if (conv.contactType) return { skipped: 'already-typed' };
  if (conv.status === 'HUMAN') {
    // Ya hay humano atendiendo → no interrumpir con bot
    // (esto se refina en 9b.3 cuando permitimos toggle explícito)
  }

  // Verifica si ya hemos enviado algo antes (evita reenvíos)
  const prevOutbound = await prisma.whatsAppMessage.count({
    where: { conversationId, direction: 'OUTBOUND' },
  });
  if (prevOutbound > 0) return { skipped: 'already-answered' };

  const saludo = conv.contactName
    ? `¡Hola, ${firstName(conv.contactName)}! 👋`
    : '¡Hola! 👋';

  const bodyText =
`${saludo} Somos OírConecta, centro auditivo en Bogotá y directorio nacional de audiólogos.

Para atenderte mejor cuéntanos: ¿qué te trae por aquí?`;

  try {
    const result = await sendWhatsAppInteractiveButtons({
      to: conv.phone,
      bodyText,
      footerText: 'Toca una opción para comenzar',
      buttons: [
        { id: BUTTON_IDS.PACIENTE_BOGOTA,       title: '🩺 Agendar cita' },
        { id: BUTTON_IDS.PROFESIONAL_DIRECTORIO, title: '👩‍⚕️ Soy profesional' },
        { id: BUTTON_IDS.INFO_GENERAL,           title: 'ℹ️ Solo tengo una duda' },
      ],
    });

    await prisma.whatsAppMessage.create({
      data: {
        conversationId,
        wamid: result?.providerMessageId || null,
        direction: 'OUTBOUND',
        type: 'interactive',
        body: bodyText,
        sentByBot: true,
        deliveryStatus: 'sent',
        timestamp: new Date(),
      },
    });
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        status: 'BOT',
        lastMessagePreview: 'Bot: ¿Qué te trae por aquí? (opciones)',
        lastMessageAt: new Date(),
      },
    });

    return { sent: true };
  } catch (e) {
    console.error('[wa-bot] handshake falló:', e.message);
    return { error: e.message };
  }
}

/**
 * Procesa la respuesta del cliente cuando toca un botón interactivo.
 * Tipifica la conversación y manda mensaje puente.
 */
async function handleButtonReply({ conversationId, buttonId, buttonTitle }) {
  if (!botEnabled()) return { skipped: 'bot-disabled' };

  const contactTypeByBtn = {
    [BUTTON_IDS.PACIENTE_BOGOTA]: 'PACIENTE_BOGOTA',
    [BUTTON_IDS.PROFESIONAL_DIRECTORIO]: 'PROFESIONAL_DIRECTORIO',
    [BUTTON_IDS.INFO_GENERAL]: 'INFO_GENERAL',
  };
  const contactType = contactTypeByBtn[buttonId];
  if (!contactType) return { skipped: 'unknown-button' };

  const businessLine = contactType === 'PROFESIONAL_DIRECTORIO' ? 'DIRECTORIO' : 'CRM';

  const conv = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, phone: true, contactName: true, contactType: true },
  });
  if (!conv) return { skipped: 'conv-not-found' };

  // Actualiza tipificación
  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      contactType: conv.contactType || contactType,
      businessLine,
      status: 'ESCALATED',
      unreadCount: { increment: 1 }, // para que el humano vea que hay algo nuevo
    },
  });

  // Mensaje puente según rama
  const bridge = {
    PACIENTE_BOGOTA:
`¡Perfecto! Estamos en Cr 10 #96-25 Cons. 320, Bogotá.

Un miembro del equipo te contacta en breve para agendar tu valoración. Mientras tanto, puedes contarnos:

• Tu nombre completo
• Tu edad (aprox)
• ¿Ya usas audífonos?`,
    PROFESIONAL_DIRECTORIO:
`¡Genial! En OírConecta estamos armando el directorio de audiólogos y otorrinos verificados del país.

Cuéntanos:
• Tu especialidad
• Ciudad donde ejerces
• Años de experiencia

Un miembro del equipo comercial te contacta hoy mismo.`,
    INFO_GENERAL:
`Con gusto te ayudamos. Cuéntanos brevemente qué necesitas saber y en un momento te respondemos con la mejor información.`,
  }[contactType];

  try {
    const result = await sendWhatsAppText({
      to: conv.phone,
      text: bridge,
    });
    await prisma.whatsAppMessage.create({
      data: {
        conversationId,
        wamid: result?.providerMessageId || null,
        direction: 'OUTBOUND',
        type: 'text',
        body: bridge,
        sentByBot: true,
        deliveryStatus: 'sent',
        timestamp: new Date(),
      },
    });
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        lastMessagePreview: `Bot: ${bridge.slice(0, 100)}`,
        lastMessageAt: new Date(),
      },
    });
    return { sent: true, contactType, businessLine };
  } catch (e) {
    console.error('[wa-bot] bridge falló:', e.message);
    return { error: e.message };
  }
}

module.exports = {
  botEnabled,
  BUTTON_IDS,
  maybeSendHandshake,
  handleButtonReply,
};
