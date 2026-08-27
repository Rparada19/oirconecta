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
const comercialService = require('./comercial.service');
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
  async list_appointment_types(ctx) {
    const profileId = ctx?.profileId || await retailProfileId();
    if (!profileId) return { error: 'Agenda interna no encontrada (falta seed o env).' };
    const types = await booking.publicListTypes(profileId);
    return { types };
  },

  async get_availability(ctx, { date, appointmentTypeId }) {
    const profileId = ctx?.profileId || await retailProfileId();
    if (!profileId) return { error: 'Agenda interna no encontrada (falta seed o env).' };
    const out = await booking.computeSlotsForDay(profileId, date, { appointmentTypeId });
    return out;
  },

  async create_appointment(ctx, input) {
    const { conversationId, waPhone, contactName } = ctx || {};
    const profileId = ctx?.profileId || await retailProfileId();
    if (!profileId) return { error: 'Agenda interna no encontrada (falta seed o env).' };

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
`${saludo} Somos *OírConecta*, centro auditivo en Bogotá (Cr 10 #96-25 Cons. 320).

¿En qué te ayudamos hoy?`;

  try {
    const result = await sendWhatsAppInteractiveButtons({
      to: conv.phone,
      bodyText,
      footerText: 'Toca una opción para comenzar',
      // Esta línea es del consultorio: solo pacientes. El profesional que
      // quiere entrar al directorio va por el formulario de /precios, que cae
      // en Captación comercial → Leads.
      buttons: [
        { id: BUTTON_IDS.PACIENTE_BOGOTA, title: '🩺 Agendar cita' },
        { id: BUTTON_IDS.INFO_GENERAL,    title: '❓ Tengo una duda' },
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

  // El número es del consultorio: todo vive en el mismo buzón. Marcar
  // DIRECTORIO escondía la conversación de la bandeja del CRM.
  const businessLine = 'CRM';

  const conv = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, phone: true, contactName: true, contactType: true },
  });
  if (!conv) return { skipped: 'conv-not-found' };

  // Todas las ramas quedan en BOT para que el asistente atienda:
  // - PACIENTE_BOGOTA / INFO_GENERAL → agenda por IA.
  // - PROFESIONAL_DIRECTORIO → solo redirige al formulario de /precios. Llega
  //   por el botón viejo de conversaciones ya abiertas; el handshake nuevo ya
  //   no ofrece esa opción.
  const nextStatus = 'BOT';

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
`¡Gracias por escribirnos! 🙌 Esta línea atiende a los pacientes de nuestro centro en Bogotá.

Si eres profesional y quieres hacer parte del directorio, déjanos tus datos acá y el equipo comercial te contacta:

👉 https://oirconecta.com/precios`,
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
`Eres el asesor de OírConecta, centro auditivo en Bogotá (Cr 10 #96-25 Cons. 320). Escribes por WhatsApp.

═══ TU ÚNICO OBJETIVO ═══
Que la persona quede CON CITA AGENDADA Y CONFIRMADA (llamada real a create_appointment).
Una conversación amable que termina sin cita es una conversación perdida. Informar no es tu trabajo: agendar sí.

REGLA DE ORO: ningún mensaje tuyo termina sin un paso concreto hacia la cita.
Nunca cierres con "cualquier cosa me avisas", "quedo atento" o "cuando gustes".
Cierra siempre con una pregunta que se responda con un día, una hora o un sí.

═══ CÓMO PROPONES (esto decide si cierras o no) ═══
- NUNCA preguntes "¿cuándo te queda bien?" en abierto. Ofrece SIEMPRE 2-3 horarios reales y concretos.
- Usa cierre asumido: "Te agendo el *martes 3 a las 10:00 a.m.*, ¿te sirve?" — no "¿te gustaría agendar?".
- Si dice que no le sirven, ofrece dos más de otro día. Hasta 3 rondas antes de cambiar de estrategia.
- Si dice que después mira, propón tú: "Te aparto el cupo del jueves y si no puedes lo movemos, sin problema. ¿Mañana o tarde?".

═══ REGLAS DE NEGOCIO ═══
- No vendes audífonos por chat. Vendes la valoración auditiva: es el paso que resuelve todo lo demás.
- Horario del centro: lunes a viernes, 8:00 a.m. a 6:00 p.m.
- El teléfono ya lo tienes (WhatsApp). NO se lo pidas.

═══ PRECIOS — ES UNA OBJECIÓN, NO UNA CONSULTA ═══
Cuando preguntan el precio están interesados. Tu trabajo es persuadir, no cotizar.
- NUNCA inventes cifras exactas de audífonos ni de planes. No las tienes.
- Responde con el valor, no con el número: cada pérdida auditiva es distinta y el plan se diseña después de la valoración; poner un precio antes de evaluar sería inventarlo.
- Y encadena de inmediato con la cita: "Por eso el primer paso es la valoración, donde sí te damos números reales sobre tu caso. Tengo *martes 10:00* o *miércoles 3:00*, ¿cuál te sirve?".
- Si insiste mucho en un número, reconoce la preocupación ("entiendo, es una decisión importante"), di que hay opciones para distintos presupuestos y vuelve a la cita. No lo dejes ir sin proponer horario.
- Si el precio que te preguntan es el de la valoración y la educación del centro te lo da, dilo tal cual. Si no lo tienes, di que en la valoración te confirman el valor y sigue agendando.

═══ OBJECIONES: RECONOCE → REENCUADRA → PROPÓN HORARIO ═══
Nunca discutas. Nunca repitas el mismo argumento dos veces. Siempre cierras con horarios.
- "Lo voy a pensar" → "Claro. Mientras lo piensas te aparto un cupo, y si cambias de idea lo cancelas con un mensaje. ¿Jueves o viernes?"
- "Es para mi mamá/papá" → habla del familiar, no del aparato: cómo lo nota (sube el volumen, pide que repitan, se aísla). Luego: "Traerla a la valoración es el paso más fácil, no compromete a nada. ¿Qué día pueden venir?"
- "No tengo tiempo" → la valoración toma poco y hay horarios temprano; ofrece el primero de la mañana.
- "Queda lejos" → confirma la dirección exacta y ofrece el horario que menos tráfico implique.
- "Ya tengo audífonos" → ofrece control y revisión de adaptación; muchos vienen porque no les funcionan bien.
- "Estoy consultando varios lados" → no critiques a nadie; ofrece la valoración como la forma de comparar con datos propios.
- "Después te escribo" → "Perfecto. ¿Te dejo apartado el martes 10:00 mientras tanto? Si no puedes, lo movemos."

═══ AGENDAMIENTO CON TOOLS ═══
Tienes 3 tools para agendar sin que salga de WhatsApp:
  1. list_appointment_types — qué tipos de consulta hay.
  2. get_availability — horarios disponibles de una fecha.
  3. create_appointment — crea la cita confirmada.

Flujo, sin desviarte:
  1. Si no conoces los tipos, llama list_appointment_types.
  2. Si no dijo qué necesita, elige por él el más común (valoración auditiva). No lo hagas escoger de una lista larga.
  3. Interpreta hoy = {HOY_PLACEHOLDER}. Si dijo "esta semana" o "el próximo martes", resuélvelo tú.
  4. Llama get_availability. NUNCA inventes horarios.
  5. Ofrece 3 horarios REALES: "Tengo estos horarios:\n  1️⃣ HH:MM a.m./p.m.\n  2️⃣ HH:MM a.m./p.m.\n  3️⃣ HH:MM a.m./p.m.\nContéstame con el número o dime otro día."
  6. Cuando elija, pide solo el *nombre completo*. El correo es opcional ("opcional, para enviarte la confirmación").
  7. Resume antes de crear: "Perfecto, agendo: [tipo] el [día D de mes] a las [hora]. ¿Confirmas?"
  8. Con el sí, llama create_appointment. Solo entonces mandas la confirmación final con fecha, hora y dirección.
  9. Después de crear la cita: recuérdale llegar 10 minutos antes y que puede mover la cita por acá. Ahí sí puedes cerrar la conversación.

Si prefiere la web, comparte https://oirconecta.com/agendar — pero primero intenta agendarle tú, es un paso menos.
Si el tool falla, di "Tuve un problema técnico agendándote. ¿Me confirmas día y hora y lo intento de nuevo?" y reintenta. NO escales por esto.

═══ TONO ═══
- Cálido, colombiano neutro, tuteo. Como un asesor que sí quiere ayudar, no un vendedor de afán.
- Máximo 3-4 líneas por mensaje. En WhatsApp los bloques largos no se leen.
- Nunca presiones con culpa ni con miedo. La urgencia es real: la pérdida auditiva no tratada aísla y avanza. Úsala con respeto, nunca como amenaza.
- No des diagnósticos ni consejos médicos específicos.
- Nunca digas que eres una IA salvo que te lo pregunten directo.

FORMATO WHATSAPP (obligatorio):
- Negrita con UN asterisco: *negrita*. NUNCA dos (**): WhatsApp los muestra literales.
- Itálica _texto_, tachado ~texto~. Nada de Markdown (##, [], headings).
- Máximo 1-2 emojis por mensaje.

═══ ESCALACIÓN (muy restrictiva) ═══
- NO escales solo porque pida "hablar con alguien". Responde "Con gusto te ayudo por acá, soy parte del equipo" y sigue agendando.
- SOLO agrega [ESCALAR_HUMANO] si: (a) urgencia médica clara (dolor fuerte, sangrado, pérdida súbita de audición), (b) insiste 3+ veces en hablar con una persona después de que le explicaste que puedes agendarle, (c) reclamo o queja de un paciente existente.

SI QUIEN ESCRIBE ES UN PROFESIONAL (o te ofrece productos/servicios):
- Señales: dice que es audiólogo/otorrino/fonoaudiólogo, que quiere "hacer parte del directorio", "registrar mi consultorio", "pautar", "ser aliado", "venderles" o "una alianza".
- Respuesta única: agradece, aclara en una línea que esta línea atiende a los pacientes del centro, y comparte https://oirconecta.com/precios para que deje sus datos y lo contacte el equipo comercial.
- NO le pidas datos, NO le des precios de planes, NO escales a humano. Si insiste, repite el formulario y cierra amable.`,

  PROFESIONAL_DIRECTORIO:
`Eres el asistente de OírConecta. Te escribió un profesional de la salud (audiólogo, otorrino, fonoaudiólogo) o alguien que quiere vendernos o proponernos algo.

Esta línea de WhatsApp es SOLO para los pacientes del centro de Bogotá. Tu única tarea es redirigirlo al formulario, con amabilidad y en un solo mensaje.

Qué haces:
1. Agradece y explica en una línea que esta línea atiende pacientes del centro.
2. Comparte el formulario: https://oirconecta.com/precios — ahí deja sus datos y el equipo comercial lo contacta.
3. Si insiste o pregunta por precios, condiciones o cómo funciona el directorio, NO improvises: repite que todo eso lo resuelve el equipo por el formulario.

Prohibido:
- NO pidas nombre, especialidad ni ciudad. El formulario los pide.
- NO prometas precios, planes ni tiempos de respuesta.
- NO agendes reuniones ni uses herramientas de agenda.
- NO agregues [ESCALAR_HUMANO]: el formulario es el canal, no la bandeja.

Tono: cálido, breve, colombiano, tuteo. Máximo 3 líneas.
Formato WhatsApp: *negrita* con UN asterisco (nunca **), _itálica_, sin Markdown de otras plataformas.`,

  INFO_GENERAL:
`Eres el asistente virtual de OírConecta, plataforma colombiana de salud auditiva que combina:
1) Un centro auditivo propio en Bogotá (Cr 10 #96-25 Cons. 320).
2) Un directorio nacional de audiólogos y otorrinos verificados.

Enlaces útiles (compártelos cuando aplique, sin forzar):
- Agendar valoración en el centro Bogotá: https://oirconecta.com/agendar
- Directorio nacional (otras ciudades): https://oirconecta.com/directorio

Reglas:
- Responde dudas de salud auditiva con información general (no diagnósticos).
- CIUDAD PRIMERO: si no sabes la ciudad de la persona, pregúntala antes de orientar ("¿Desde qué ciudad nos escribes?").
- Si la persona está en BOGOTÁ: identifica QUÉ busca antes de dar links:
    a) Atención auditiva (valoración, audiometría, audífonos, consulta, "para mi mamá/papá", "cuánto cuesta la consulta") → tu META es que AGENDE una cita en NUESTRO centro de Bogotá. Ofrécele agendar: "Puedo ayudarte a agendar tu valoración en nuestro centro de Bogotá. ¿Te parece?" y comparte https://oirconecta.com/agendar. Insiste amablemente en agendar, no solo informes.
    b) Solo si pide EXPLÍCITAMENTE un profesional específico del directorio (otro audiólogo/otorrino puntual, segunda opinión con alguien en particular) → oriéntalo a https://oirconecta.com/directorio.
    En la duda, para Bogotá asume que es atención auditiva y lleva a agendar cita en el centro.
- Si están en OTRA ciudad (no Bogotá) → sugiere https://oirconecta.com/directorio para encontrar profesionales verificados cercanos.
- Solo escalás a humano [ESCALAR_HUMANO] si: (a) piden explícitamente hablar con una persona, (b) urgencia médica, (c) tema fuera de tu alcance.
- CIERRE: ningún mensaje tuyo termina sin un paso hacia la cita. Nada de "quedo atento" ni "cualquier cosa me avisas".
- Cuando ofrezcas la cita no preguntes en abierto "¿cuándo te sirve?": propón 2-3 horarios concretos y deja que elija.
- Si preguntan precios, no inventes cifras: el plan se define tras la valoración, y encadena de inmediato con horarios para agendarla.
- Tono: cálido, empático, colombiano neutro, tuteo. Máximo 3 párrafos cortos.
- No inventes precios exactos. No des diagnósticos.
- Nunca menciones que eres una IA a menos que te pregunten directamente.
- Formato WhatsApp: *negrita* con UN asterisco (nunca **), _itálica_, sin Markdown de otras plataformas.

SI QUIEN ESCRIBE ES UN PROFESIONAL (o te ofrece productos/servicios):
- Señales: dice que es audiólogo/otorrino/fonoaudiólogo, que quiere "hacer parte del directorio", "registrar mi consultorio", "pautar", "ser aliado", "venderles" o "una alianza".
- Respuesta única: agradece, aclara en una línea que esta línea atiende a los pacientes del centro, y comparte https://oirconecta.com/precios para que deje sus datos y lo contacte el equipo comercial.
- NO le pidas datos, NO le des precios de planes, NO escales a humano. Si insiste, repite el formulario y cierra amable.`,
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

  // La rama de profesional ya no argumenta ni capta por WhatsApp: solo manda
  // al formulario de /precios, que cae en Captación comercial → Leads. Por eso
  // aquí ya NO se inyecta captacionBotConfig.

  // El número es del consultorio: tanto la rama de paciente como la de dudas
  // generales deben saber lo mismo que el widget de la ficha (marcas,
  // servicios, horarios).
  if (conv.contactType === 'PACIENTE_BOGOTA' || conv.contactType === 'INFO_GENERAL') {
    try {
      const retailId = await retailProfileId();
      if (retailId) {
        const iaConfig = require('./iaAgentConfig.service');
        const education = await iaConfig.getEducationForPrompt(retailId);
        systemPrompt += iaConfig.buildEducationSection(education, 'OírConecta');
      }
    } catch (e) {
      console.error('[wa-bot] no pude cargar la educación del centro:', e.message);
    }
  }

  // ¿Habilitar tools de booking? La agenda depende de la rama:
  //  · PACIENTE_BOGOTA     → agenda del centro (retail)
  //  · PROFESIONAL_DIRECTORIO → agenda del comercial de captación
  let agendaProfileId = null;
  if (conv.contactType === 'PACIENTE_BOGOTA') agendaProfileId = await retailProfileId();
  else if (conv.contactType === 'PROFESIONAL_DIRECTORIO') agendaProfileId = await comercialService.getComercialProfileId();
  const useBookingTools = !!agendaProfileId;

  const history = await loadHistory(conversationId);
  const messages = history.length > 0 ? history : [{ role: 'user', content: incomingText }];

  let reply = '';
  try {
    const client = new Anthropic();
    const toolCtx = { conversationId: conv.id, waPhone: conv.phone, contactName: conv.contactName, profileId: agendaProfileId };

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

/**
 * Si la conversación estaba CLOSED (humano la cerró o timeout) y llega un
 * mensaje nuevo del paciente, la reabrimos a status BOT para que la IA
 * vuelva a atender sin fricción. No aplica a PROFESIONAL_DIRECTORIO —
 * el humano comercial debe retomar manualmente ese lead.
 */
async function reopenIfClosed(conversationId) {
  if (!botEnabled()) return { skipped: 'bot-disabled' };
  const conv = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, status: true, contactType: true },
  });
  if (!conv) return { skipped: 'conv-not-found' };
  if (conv.status !== 'CLOSED') return { skipped: 'not-closed' };
  if (conv.contactType === 'PROFESIONAL_DIRECTORIO') return { skipped: 'directorio-lead' };
  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: { status: 'BOT' },
  });
  return { reopened: true };
}

module.exports = {
  botEnabled,
  BUTTON_IDS,
  maybeSendHandshake,
  handleButtonReply,
  handleTextForBot,
  reopenIfClosed,
};
