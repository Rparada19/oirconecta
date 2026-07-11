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
const booking = require('./professionalBooking.service');
const retailService = require('./retail.service');
const config = require('../config');

const prisma = new PrismaClient();

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const MAX_HISTORY_MESSAGES = 12; // últimos 12 turnos para contexto

// ─── C1 — Tools para que el bot agende en WhatsApp sin salir del chat ───
// Solo se usan en rama PACIENTE_BOGOTA y requieren RETAIL_PROFESSIONAL_ID
// configurado (el DirectoryProfile.id del consultorio propio de OírConecta).

const BOOKING_TOOLS = [
  {
    name: 'list_appointment_types',
    description: 'Lista los tipos de consulta que ofrece el centro (nombre, duración, precio COP si aplica).',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_availability',
    description: 'Devuelve los horarios disponibles del centro para una fecha específica. Devuelve un array "slots" con objetos {time: "HH:MM"}.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Fecha YYYY-MM-DD en zona horaria del centro (Bogotá).' },
        appointmentTypeId: { type: 'string', description: 'ID del tipo de consulta.' },
      },
      required: ['date', 'appointmentTypeId'],
    },
  },
  {
    name: 'create_appointment',
    description: 'Crea una cita CONFIRMADA. Antes de llamar SIEMPRE resume con el paciente: tipo + fecha + hora + su nombre y confirma que quiere agendar.',
    input_schema: {
      type: 'object',
      properties: {
        appointmentTypeId: { type: 'string' },
        scheduledAt: { type: 'string', description: 'YYYY-MM-DDTHH:MM (hora local Bogotá).' },
        patientName: { type: 'string' },
        patientEmail: { type: 'string', description: 'Opcional pero recomendado — se le envía la confirmación.' },
        notas: { type: 'string', description: 'Motivo o info adicional, opcional.' },
      },
      required: ['appointmentTypeId', 'scheduledAt', 'patientName'],
    },
  },
];

// Delegado a retail.service (misma resolución que /api/public/retail-config).
const retailProfileId = retailService.getRetailProfileId;

const bookingToolImpls = {
  async list_appointment_types() {
    const profileId = await retailProfileId();
    if (!profileId) return { error: 'Perfil retail interno no encontrado (falta seed o env).' };
    const types = await booking.publicListTypes(profileId);
    return { types };
  },

  async get_availability(_ctx, { date, appointmentTypeId }) {
    const profileId = await retailProfileId();
    if (!profileId) return { error: 'Perfil retail interno no encontrado (falta seed o env).' };
    const out = await booking.computeSlotsForDay(profileId, date, { appointmentTypeId });
    return out;
  },

  async create_appointment({ conversationId, waPhone, contactName }, input) {
    const profileId = await retailProfileId();
    if (!profileId) return { error: 'Perfil retail interno no encontrado (falta seed o env).' };

    // El teléfono lo tomamos del WA E.164 (573xxx). Reusamos como telefono.
    const res = await booking.createPublicAppointment(profileId, {
      appointmentTypeId: input.appointmentTypeId,
      scheduledAt: input.scheduledAt,
      notas: input.notas || 'Agendado por WhatsApp (bot corporativo)',
      patient: {
        nombre: input.patientName || contactName || 'Paciente WhatsApp',
        telefono: waPhone,
        email: input.patientEmail || null,
      },
    });

    // Cierra el loop del nudge A1: marca booked para que no envíe follow-up.
    if (conversationId) {
      await prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: { agendarBookedAt: new Date() },
      }).catch(() => {});
    }

    return {
      id: res.id,
      fecha: res.fecha,
      hora: res.hora,
      durationMinutes: res.durationMinutes,
      rescheduleToken: res.rescheduleToken,
      mensaje: `Cita confirmada. Recibirás email con detalles y enlace para reagendar.`,
    };
  },
};

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

  // Regla del negocio (2026-07-11):
  // - PACIENTE_BOGOTA / INFO_GENERAL → status='BOT' para que el flow de agendar
  //   por IA continúe sin necesidad de humano.
  // - PROFESIONAL_DIRECTORIO → status='ESCALATED' porque va al funnel de
  //   captación del directorio (humano comercial toma el lead).
  const nextStatus = contactType === 'PROFESIONAL_DIRECTORIO' ? 'ESCALATED' : 'BOT';

  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      contactType: conv.contactType || contactType,
      businessLine,
      status: nextStatus,
      ...(nextStatus === 'ESCALATED' ? { unreadCount: { increment: 1 } } : {}),
    },
  });

  // Mensaje puente según rama
  const bridge = {
    PACIENTE_BOGOTA:
`¡Perfecto! Puedes agendar tu valoración auditiva directamente en 2 minutos aquí:

👉 https://oirconecta.com/agendar

Estamos en Cr 10 #96-25 Cons. 320, Bogotá.

Si prefieres coordinar por acá o tienes alguna duda antes de agendar, cuéntame y con gusto te ayudo.`,
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
    // A1 — Si el bridge incluyó el link /agendar (rama PACIENTE_BOGOTA),
    // arma el trigger de follow-up automático.
    const bridgeHasAgendarLink = /oirconecta\.com\/agendar/i.test(bridge);
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        lastMessagePreview: `Bot: ${bridge.slice(0, 100)}`,
        lastMessageAt: new Date(),
        ...(bridgeHasAgendarLink ? { agendarLinkSentAt: new Date() } : {}),
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

Reglas de negocio:
- No vendes audífonos; diseñan planes de audición a la medida de cada paciente.
- Horario del centro: Lunes a Viernes 8:00 - 18:00.

═══ AGENDAMIENTO POR WHATSAPP (PRIORIDAD ALTA) ═══

Tienes 3 tools para AGENDAR CITAS SIN QUE EL PACIENTE SALGA DE WHATSAPP:
  1. list_appointment_types — para saber qué tipos de consulta hay.
  2. get_availability — para conocer horarios disponibles de una fecha.
  3. create_appointment — para crear la cita confirmada.

CUANDO EL PACIENTE QUIERA AGENDAR (menciona "cita", "valoración", "agendar", "cuándo puedo ir", "quiero ir"), SIGUE ESTE FLUJO SIN DESVIARTE:

  1. Si aún no conoces los tipos, llama list_appointment_types.
  2. Si el paciente no dijo qué necesita, ofrece los tipos que existen y elige por él el más común (valoración auditiva) si dice cosas como "quiero una cita" sin más contexto.
  3. Pregunta la fecha tentativa (día de la semana, "esta semana", "el próximo martes"). Interpreta hoy = ${'{HOY_PLACEHOLDER}'}.
  4. Llama get_availability con esa fecha y el appointmentTypeId. NUNCA inventes horarios.
  5. Ofrece 3 horarios REALES devueltos por get_availability (los más cercanos posibles). Formato: "Tengo estos horarios:\\n  1️⃣ HH:MM AM/PM\\n  2️⃣ HH:MM AM/PM\\n  3️⃣ HH:MM AM/PM\\nContéstame con el número o dime otro día."
  6. Cuando el paciente elija, PIDE solo estos datos mínimos: nombre completo. El email es opcional (pídelo con "opcional para enviarte confirmación por correo").
  7. RESUMEN antes de bookear: "Perfecto, agendo entonces: [tipo] el [día D de mes] a las [hora]. ¿Confirmas?"
  8. Cuando el paciente confirme, llama create_appointment. Solo entonces envía el mensaje final de confirmación con la fecha, hora y que le llegará correo si dio email.

REGLAS EXTRA:
- El teléfono del paciente ya lo tienes (WhatsApp). NO se lo pidas.
- Si el paciente prefiere agendar por la web, comparte https://oirconecta.com/agendar y no insistas.
- Solo escalás a humano [ESCALAR_HUMANO] si: (a) pide explícitamente hablar con una persona, (b) urgencia médica (dolor fuerte, sangrado, pérdida súbita), (c) algo que no puedes resolver con las tools.

Reglas de tono:
- Cálido, colombiano neutro, tuteo. Nunca robótico.
- Máximo 3-4 líneas por respuesta.
- Solo hablas de salud auditiva. No des consejos médicos específicos ni diagnósticos.
- Nunca menciones que eres una IA a menos que te pregunten directamente.
- Rangos de precios: puedes dar rangos amplios (ej. "los planes con audífonos van desde X hasta Y millones según tecnología"), pero recalca que la valoración es gratuita y personalizada.

FORMATO WHATSAPP (obligatorio):
- Para negrita usa UN asterisco: *negrita*. NUNCA uses ** (dos asteriscos): WhatsApp los muestra literalmente.
- Para itálica usa _texto_. Para tachado ~texto~.
- No uses Markdown de otras plataformas (nada de ##, [], sintaxis de headings).
- Emojis con moderación (máx 1-2 por respuesta).

ESCALACIÓN (rama PACIENTE_BOGOTA — muy restrictiva):
- NUNCA agregues [ESCALAR_HUMANO] solo porque el paciente pida "hablar con alguien" o "conectar con el equipo". En ese caso responde: "Con gusto te ayudo directamente por acá — soy parte del equipo. Sigamos con tu agendamiento." y continúa el flow de agendar.
- SOLO escalás con [ESCALAR_HUMANO] si hay urgencia médica clara (dolor fuerte, sangrado, pérdida súbita de audición) o si el paciente insiste 3+ veces en hablar con humano después de que le explicaste que puedes agendarle tú.
- Si el tool de agendar falla técnicamente, dile "Tuve un problema técnico agendándote. ¿Podrías escribirme el día y la hora que prefieres y lo intento de nuevo?" — NO escales.`,

  PROFESIONAL_DIRECTORIO:
`Eres asistente del equipo comercial de OírConecta. Estás recopilando información de audiólogos y otorrinos interesados en unirse al directorio nacional.

Reglas:
- Recopila: nombre completo, especialidad, ciudad, años de experiencia, sitio web o Instagram profesional.
- No prometas planes ni precios específicos. Di que el ejecutivo comercial se los presenta.
- Cuando tengas los datos mínimos (nombre + especialidad + ciudad) → di "gracias, nuestro ejecutivo comercial te contacta en las próximas horas" y agrega [ESCALAR_HUMANO] al final.
- Si el interlocutor no es profesional de salud auditiva (audiólogo, otorrinolaringólogo, fonoaudiólogo) → informa amablemente que el directorio es solo para esas especialidades y agrega [ESCALAR_HUMANO].
- Tono: profesional, cálido, colombiano neutro, tuteo.
- Máximo 2 párrafos cortos por respuesta.
- Formato WhatsApp: *negrita* con UN asterisco (nunca **), _itálica_, sin Markdown de otras plataformas.`,

  INFO_GENERAL:
`Eres el asistente virtual de OírConecta, plataforma colombiana de salud auditiva que combina:
1) Un centro auditivo propio en Bogotá (Cr 10 #96-25 Cons. 320).
2) Un directorio nacional de audiólogos y otorrinos verificados.

Enlaces útiles (compártelos cuando aplique, sin forzar):
- Agendar valoración en el centro Bogotá: https://oirconecta.com/agendar
- Directorio nacional (otras ciudades): https://oirconecta.com/directorio

Reglas:
- Responde dudas de salud auditiva con información general (no diagnósticos).
- Si mencionan Bogotá o quieren agendar → comparte https://oirconecta.com/agendar como acción principal. NO escales a humano solo para agendar, la persona puede hacerlo sola con el link.
- Si están en otra ciudad → sugiere https://oirconecta.com/directorio para encontrar profesionales cercanos.
- Solo escalás a humano [ESCALAR_HUMANO] si: (a) piden explícitamente hablar con una persona, (b) urgencia médica, (c) tema fuera de tu alcance.
- Tono: cálido, empático, colombiano neutro, tuteo. Máximo 3 párrafos cortos.
- No inventes precios exactos. No des diagnósticos.
- Nunca menciones que eres una IA a menos que te pregunten directamente.
- Formato WhatsApp: *negrita* con UN asterisco (nunca **), _itálica_, sin Markdown de otras plataformas.`,
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
 *
 * C1 — Para rama PACIENTE_BOGOTA y RETAIL_PROFESSIONAL_ID configurado, corre
 * un tool loop de hasta 5 iteraciones para permitir que Claude agende directo
 * en WhatsApp (list_types → get_availability → create_appointment).
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

  let systemPrompt = SYSTEM_PROMPTS[conv.contactType];
  if (!systemPrompt) return { skipped: 'no-prompt-for-type' };

  // Rellena la fecha de hoy en el prompt (solo aplica al de PACIENTE_BOGOTA).
  const hoyLocal = new Date().toLocaleString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Bogota',
  });
  systemPrompt = systemPrompt.replace('{HOY_PLACEHOLDER}', hoyLocal);

  // ¿Habilitar tools de booking? Solo si es PACIENTE_BOGOTA y retail resuelto.
  const useBookingTools = conv.contactType === 'PACIENTE_BOGOTA' && !!(await retailProfileId());

  const history = await loadHistory(conversationId);
  const messages = history.length > 0 ? history : [{ role: 'user', content: incomingText }];

  let reply = '';
  try {
    const client = new Anthropic();
    const toolCtx = { conversationId: conv.id, waPhone: conv.phone, contactName: conv.contactName };

    if (useBookingTools) {
      // Tool loop: hasta 5 iteraciones.
      let finalText = '';
      const workingMessages = [...messages];
      for (let iter = 0; iter < 5; iter++) {
        const resp = await client.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          tools: BOOKING_TOOLS,
          messages: workingMessages,
        });
        const toolUses = resp.content.filter((b) => b.type === 'tool_use');
        const textBlocks = resp.content.filter((b) => b.type === 'text');
        finalText = textBlocks.map((b) => b.text).join('\n').trim();

        if (toolUses.length === 0) break;

        workingMessages.push({ role: 'assistant', content: resp.content });
        const toolResults = [];
        for (const tu of toolUses) {
          let output, isError = false;
          try {
            const impl = bookingToolImpls[tu.name];
            if (!impl) throw new Error(`Tool desconocida: ${tu.name}`);
            output = await impl(toolCtx, tu.input || {});
          } catch (e) {
            console.error('[wa-bot] tool', tu.name, 'falló:', e.message);
            output = { error: e.message };
            isError = true;
          }
          toolResults.push({
            type: 'tool_result',
            tool_use_id: tu.id,
            content: typeof output === 'string' ? output : JSON.stringify(output),
            is_error: isError,
          });
        }
        workingMessages.push({ role: 'user', content: toolResults });
      }
      reply = finalText;
    } else {
      // Path simple sin tools (INFO_GENERAL, PROFESIONAL_DIRECTORIO, etc.)
      const resp = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 800,
        system: systemPrompt,
        messages,
      });
      const block = (resp.content || []).find((b) => b.type === 'text');
      reply = block?.text?.trim() || '';
    }
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
    // A1 — Si la respuesta contiene el link /agendar y aún no hemos armado
    // el trigger, marcamos la conversación para que el cron haga follow-up.
    // Solo lo hacemos para rama PACIENTE_BOGOTA (INFO_GENERAL también puede
    // mandar el link pero la tratamos igual: si vio el link, sigue el mismo flow).
    const replyHasAgendarLink = /oirconecta\.com\/agendar/i.test(cleanReply);
    const armAgendarTrigger = replyHasAgendarLink
      && ['PACIENTE_BOGOTA', 'INFO_GENERAL'].includes(conv.contactType);
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: `Bot: ${cleanReply.slice(0, 140)}`,
        status: shouldEscalate ? 'ESCALATED' : 'BOT',
        unreadCount: shouldEscalate ? { increment: 1 } : undefined,
        // Solo marca si no está ya armado (primera vez que menciona el link).
        ...(armAgendarTrigger ? { agendarLinkSentAt: new Date() } : {}),
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
