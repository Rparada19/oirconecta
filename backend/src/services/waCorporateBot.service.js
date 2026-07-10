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
const Anthropic = require('@anthropic-ai/sdk');
const { sendWhatsAppText, sendWhatsAppInteractiveButtons } = require('../notifications/channels/whatsapp');

const prisma = new PrismaClient();

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const MAX_HISTORY_MESSAGES = 12; // últimos 12 turnos para contexto

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

// ─── F9b.2 — Ramas conversacionales con Claude Haiku 4.5 ─────────

const SYSTEM_PROMPTS = {
  PACIENTE_BOGOTA:
`Eres el asistente virtual del centro auditivo OírConecta en Bogotá (Cr 10 #96-25 Cons. 320).

Reglas:
- No vendes audífonos; diseñan planes de audición a la medida.
- Horario: Lunes a Viernes 8:00 - 18:00.
- Cuando alguien pregunte precios, di rangos amplios y ofrece agendar valoración.
- Si el paciente da nombre + edad + necesidad → di "un asesor te contacta en breve para agendar" y agrega la etiqueta [ESCALAR_HUMANO] al final del mensaje.
- Si preguntan por urgencias médicas graves (dolor fuerte, sangrado) → recomienda ir a urgencias y agrega [ESCALAR_HUMANO].
- Tono: cálido, colombiano neutro, tuteo. No robótico. Máximo 3 párrafos cortos por respuesta.
- Solo hablas de salud auditiva. No des consejos médicos específicos.
- Nunca menciones que eres una IA a menos que te pregunten directamente.`,

  PROFESIONAL_DIRECTORIO:
`Eres asistente del equipo comercial de OírConecta. Estás recopilando información de audiólogos y otorrinos interesados en unirse al directorio nacional.

Reglas:
- Recopila: nombre completo, especialidad, ciudad, años de experiencia, sitio web o Instagram profesional.
- No prometas planes ni precios específicos. Di que el ejecutivo comercial se los presenta.
- Cuando tengas los datos mínimos (nombre + especialidad + ciudad) → di "gracias, nuestro ejecutivo comercial te contacta en las próximas horas" y agrega [ESCALAR_HUMANO] al final.
- Si el interlocutor no es profesional de salud auditiva (audiólogo, otorrinolaringólogo, fonoaudiólogo) → informa amablemente que el directorio es solo para esas especialidades y agrega [ESCALAR_HUMANO].
- Tono: profesional, cálido, colombiano neutro, tuteo.
- Máximo 2 párrafos cortos por respuesta.`,

  INFO_GENERAL:
`Eres el asistente virtual de OírConecta, plataforma colombiana de salud auditiva que combina:
1) Un centro auditivo propio en Bogotá (Cr 10 #96-25 Cons. 320).
2) Un directorio nacional de audiólogos y otorrinos verificados.

Reglas:
- Responde dudas de salud auditiva con información general (no diagnósticos).
- Si mencionan Bogotá o quieren agendar → sugiere el centro propio y agrega [ESCALAR_HUMANO].
- Si están en otra ciudad → sugiere buscar en oirconecta.com/directorio.
- Si preguntan algo que requiere un especialista → invita a buscar en el directorio o el centro.
- Tono: cálido, empático, colombiano neutro, tuteo. Máximo 3 párrafos cortos.
- No inventes precios exactos. No des diagnósticos.
- Nunca menciones que eres una IA a menos que te pregunten directamente.`,
};

const ESCALATE_TAG = '[ESCALAR_HUMANO]';

/** Carga historial reciente de la conversación en formato Anthropic. */
async function loadHistory(conversationId) {
  const rows = await prisma.whatsAppMessage.findMany({
    where: { conversationId, type: { in: ['text', 'interactive'] } },
    orderBy: { timestamp: 'desc' },
    take: MAX_HISTORY_MESSAGES,
    select: { direction: true, body: true, sentByBot: true, sentByUserId: true, type: true },
  });
  // Reordena cronológico
  const chronological = rows.reverse();
  const messages = [];
  for (const m of chronological) {
    if (!m.body) continue;
    if (m.direction === 'INBOUND') {
      messages.push({ role: 'user', content: m.body });
    } else if (m.sentByBot || (!m.sentByUserId && m.direction === 'OUTBOUND')) {
      messages.push({ role: 'assistant', content: m.body });
    }
    // Mensajes outbound de humano se omiten del contexto Claude para no confundir
  }
  return messages;
}

/**
 * Genera respuesta con Claude para un mensaje entrante en una conversación
 * BOT que ya tiene contactType. Envía la respuesta por WhatsApp y persiste.
 * Si la respuesta contiene [ESCALAR_HUMANO], marca la conversación como ESCALATED.
 */
async function handleTextForBot({ conversationId, incomingText }) {
  if (!botEnabled()) return { skipped: 'bot-disabled' };
  if (!process.env.ANTHROPIC_API_KEY) return { skipped: 'no-anthropic-key' };

  const conv = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, phone: true, contactType: true, status: true, contactName: true },
  });
  if (!conv) return { skipped: 'conv-not-found' };
  if (conv.status !== 'BOT') return { skipped: 'not-bot-status' };
  if (!conv.contactType) return { skipped: 'no-contact-type' };

  const systemPrompt = SYSTEM_PROMPTS[conv.contactType];
  if (!systemPrompt) return { skipped: 'no-prompt-for-type' };

  const history = await loadHistory(conversationId);

  let reply = '';
  try {
    const client = new Anthropic();
    const resp = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system: systemPrompt,
      messages: history.length > 0 ? history : [{ role: 'user', content: incomingText }],
    });
    const block = (resp.content || []).find((b) => b.type === 'text');
    reply = block?.text?.trim() || '';
  } catch (e) {
    console.error('[wa-bot] claude falló:', e.message);
    return { error: e.message };
  }

  if (!reply) return { skipped: 'empty-reply' };

  // Detecta tag de escalada
  const shouldEscalate = reply.includes(ESCALATE_TAG);
  const cleanReply = reply.replace(ESCALATE_TAG, '').trim();

  try {
    const result = await sendWhatsAppText({ to: conv.phone, text: cleanReply });
    await prisma.whatsAppMessage.create({
      data: {
        conversationId,
        wamid: result?.providerMessageId || null,
        direction: 'OUTBOUND',
        type: 'text',
        body: cleanReply,
        sentByBot: true,
        deliveryStatus: 'sent',
        timestamp: new Date(),
      },
    });
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: `Bot: ${cleanReply.slice(0, 140)}`,
        status: shouldEscalate ? 'ESCALATED' : 'BOT',
        unreadCount: shouldEscalate ? { increment: 1 } : undefined,
      },
    });
    return { sent: true, escalated: shouldEscalate };
  } catch (e) {
    console.error('[wa-bot] envío texto falló:', e.message);
    return { error: e.message };
  }
}

module.exports = {
  botEnabled,
  BUTTON_IDS,
  maybeSendHandshake,
  handleButtonReply,
  handleTextForBot,
};
