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
        ciudad: { type: 'string', description: 'Ciudad de residencia, si la persona ya la dijo.' },
        notas: { type: 'string', description: 'Motivo o info adicional, opcional.' },
      },
      required: ['appointmentTypeId', 'scheduledAt', 'patientName'],
    },
  },
];

// Solo para la rama REFERIDO_ALIADO: fuera de Bogotá no hay agenda propia, así
// que el bot cierra dejando el lead y la tarea para servicio al cliente.
const REFERIDO_TOOLS = [
  {
    name: 'registrar_referido_otra_ciudad',
    description: 'Registra a un referido que NO está en Bogotá para que servicio al cliente lo llame. Llama esto SOLO cuando ya tengas nombre, correo y ciudad confirmados.',
    input_schema: {
      type: 'object',
      properties: {
        nombre: { type: 'string' },
        email: { type: 'string' },
        telefono: { type: 'string', description: 'Si la persona dio otro número distinto al de WhatsApp. Opcional.' },
        ciudad: { type: 'string', description: 'Cartagena, Barranquilla, Cali o Medellín.' },
      },
      required: ['nombre', 'email', 'ciudad'],
    },
  },
];

/** Qué herramientas ve el modelo según la rama de la conversación. */
function toolsFor(contactType) {
  if (contactType === 'REFERIDO_ALIADO') return [...BOOKING_TOOLS, ...REFERIDO_TOOLS];
  return BOOKING_TOOLS;
}

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

    // Ciudad y atribución al aliado. Va después de crear la cita para no
    // arriesgar la reserva si algo de esto falla.
    // De qué anuncio salió esta cita. Se guarda en la ficha del paciente para
    // que la campaña se pueda medir por citas, no solo por conversaciones.
    if (ctx?.adSourceId) {
      try {
        const appt = await prisma.appointment.findUnique({
          where: { id: res.id }, select: { patientId: true },
        });
        if (appt?.patientId) {
          await prisma.patient.updateMany({
            where: { id: appt.patientId, OR: [{ procedencia: null }, { procedencia: '' }] },
            data: { procedencia: `anuncio-wa:${ctx.adSourceId}` },
          });
        }
      } catch (e) {
        console.error('[wa-ads] atribución de la cita falló:', e.message);
      }
    }

    if (ctx?.partnerId || input.ciudad) {
      try {
        const appt = await prisma.appointment.findUnique({
          where: { id: res.id },
          select: { patientId: true },
        });
        if (appt?.patientId) {
          if (ctx?.partnerId) {
            await require('./referralPartners.service').atribuirPaciente(appt.patientId, ctx.partnerId);
          }
          // Solo si está vacía: lo que diga la historia clínica manda sobre lo
          // que se recogió de pasada en un chat.
          if (input.ciudad) {
            await prisma.patient.updateMany({
              where: { id: appt.patientId, OR: [{ ciudad: null }, { ciudad: '' }] },
              data: { ciudad: String(input.ciudad).trim() },
            });
          }
          // El referido entra al newsletter. Se le avisó en el primer mensaje.
          if (ctx?.partnerId && input.patientEmail) {
            await require('./referralPartners.service').suscribirAlNewsletter({
              nombre: input.patientName || contactName,
              email: input.patientEmail,
              telefono: waPhone,
              ciudad: input.ciudad || null,
            });
          }
        }
      } catch (e) {
        console.error('[wa-bot] ciudad/atribución falló:', e.message);
      }
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

  async registrar_referido_otra_ciudad(ctx, input) {
    const { conversationId, waPhone, partnerId } = ctx || {};
    const ciudad = String(input.ciudad || '').trim();
    const referrals = require('./referralPartners.service');
    const ciudadNorm = referrals.normalizar(ciudad);
    if (!CIUDADES_SIN_AGENDA.some((c) => referrals.normalizar(c) === ciudadNorm)) {
      return {
        error: `"${ciudad}" no es una de las ciudades del convenio. Solo Cartagena, Barranquilla, Cali y Medellín se registran por aquí; Bogotá se agenda con create_appointment y cualquier otra ciudad va al directorio.`,
      };
    }

    const lead = await prisma.lead.create({
      data: {
        nombre: String(input.nombre || '').trim(),
        email: String(input.email || '').trim().toLowerCase(),
        telefono: String(input.telefono || waPhone || '').trim(),
        ciudad,
        procedencia: 'aliado-qr',
        interes: 'Valoración auditiva',
        estado: 'NUEVO',
        partnerId: partnerId || null,
        notas: `Referido por QR de aliado. Fuera de Bogotá (${ciudad}): servicio al cliente debe llamar para agendar.`,
      },
    });

    await prisma.task.create({
      data: {
        type: 'CALL',
        title: `Agendar referido de aliado — ${lead.nombre} (${ciudad})`,
        description: `Llegó por el QR de un aliado.\nTeléfono: ${lead.telefono}\nCorreo: ${lead.email}\nCiudad: ${ciudad}\nSe le prometió llamada al siguiente día hábil.`,
        priority: 'HIGH',
        dueAt: siguienteDiaHabil(),
        createdBy: 'system',
        sourceEventCode: 'ALIADO_QR_FUERA_BOGOTA',
      },
    });

    if (conversationId) {
      await prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: { intent: 'CITA_PACIENTE' },
      }).catch(() => {});
    }

    await referrals.suscribirAlNewsletter({
      nombre: lead.nombre,
      email: lead.email,
      telefono: lead.telefono,
      ciudad,
    });

    require('./alertaEquipo.service').avisar({
      titulo: `Referido de aliado en ${ciudad} — hay que llamarlo`,
      quien: lead.nombre,
      telefono: lead.telefono,
      texto: `Correo: ${lead.email}. Se le prometió llamada al siguiente día hábil.`,
    }).catch(() => {});

    return {
      leadId: lead.id,
      mensaje: 'Registrado. Servicio al cliente lo llama el siguiente día hábil.',
    };
  },
};

/** Siguiente día hábil a las 9:00 (hora Bogotá, guardada en UTC). */
function siguienteDiaHabil() {
  const d = new Date();
  d.setUTCHours(14, 0, 0, 0); // 09:00 en Bogotá (UTC-5)
  do {
    d.setUTCDate(d.getUTCDate() + 1);
  } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d;
}

// Ciudades del acuerdo con aliados donde NO hay centro propio: no se agenda
// en el chat, se promete llamada del equipo al siguiente día hábil.
const CIUDADES_SIN_AGENDA = ['CARTAGENA', 'BARRANQUILLA', 'CALI', 'MEDELLIN'];

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
 * ¿El primer mensaje es solo un saludo, o ya trae intención?
 *
 * Importa porque decide si mandamos el menú. Alguien que escribe "quiero más
 * información" ya dijo a qué viene; devolverle "¿en qué te ayudamos?" es
 * hacerle repetir lo que acaba de escribir, y así arranca frío.
 */
function esSoloSaludo(texto) {
  const t = String(texto || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // tildes
    .replace(/[^a-z\s]/g, ' ')                          // emojis y puntuación
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return true;                                   // sin texto → menú
  const SALUDOS = [
    'hola', 'holi', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'dia',
    'hey', 'hi', 'hello', 'saludos', 'que', 'tal', 'como', 'estan', 'esta',
    'señor', 'senores', 'senor', 'senora', 'alo', 'buen',
  ];
  const palabras = t.split(' ');
  if (palabras.length > 5) return false;
  return palabras.every((w) => SALUDOS.includes(w));
}

/**
 * Envía el handshake inicial con botones de intención — pero solo cuando hace
 * falta. Si el primer mensaje ya dice a qué viene, se responde a eso.
 *
 * Se dispara si:
 *   - Es el primer mensaje INBOUND de la conversación (sin mensajes OUTBOUND previos).
 *   - La conversación aún no tiene contactType.
 *   - El bot está habilitado por env.
 */
async function maybeSendHandshake(conversationId, incomingText = null) {
  if (!botEnabled()) return { skipped: 'bot-disabled' };

  const conv = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, phone: true, contactName: true, contactType: true, status: true, patientId: true },
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

  // Ya dijo a qué viene → nada de menú: se le contesta.
  // Esta línea es del consultorio, así que quien escribe es paciente mientras
  // no diga lo contrario; el prompt de PACIENTE_BOGOTA ya sabe reencaminar al
  // profesional o al proveedor que se cuele.
  if (!esSoloSaludo(incomingText)) {
    const tipo = conv.patientId ? 'PACIENTE_EXISTENTE' : 'PACIENTE_BOGOTA';
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { contactType: tipo, businessLine: 'CRM', status: 'BOT' },
    });
    console.log('[wa-bot] primer mensaje con intención — sin menú, contesto como', tipo);
    return handleTextForBot({ conversationId, incomingText });
  }

  // El nombre de la historia clínica manda sobre el del perfil de WhatsApp,
  // que puede ser un apodo o estar vacío.
  let nombre = conv.contactName;
  if (conv.patientId) {
    const p = await prisma.patient.findUnique({
      where: { id: conv.patientId }, select: { nombre: true },
    }).catch(() => null);
    if (p?.nombre) nombre = p.nombre;
  }
  const saludo = nombre ? `¡Hola, ${firstName(nombre)}! 👋` : '¡Hola! 👋';

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
  // Rama del QR de las tarjetas de aliados (plug-e y los que sigan). Llega
  // gente que compró protectores auditivos, no gente que buscaba audiología:
  // el orden de los datos lo fija el acuerdo comercial, no la conversación.
  REFERIDO_ALIADO:
`Eres el asesor de OírConecta, centro auditivo en Bogotá (Cr 10 #96-25 Cons. 320). Escribes por WhatsApp.

Quien te escribe escaneó el QR de la tarjeta de *{ALIADO}*, que recibió al comprar sus protectores auditivos. Viene por una *valoración auditiva*. No sabe casi nada de nosotros y no estaba buscando un audiólogo: sé breve, cálido y no lo abrumes.

Hoy es {HOY_PLACEHOLDER}.

═══ LOS 4 DATOS (en este orden, uno por mensaje) ═══
1. Nombre completo
2. Teléfono de contacto (si es el mismo de este WhatsApp, basta con que diga "este mismo")
3. Correo electrónico
4. Ciudad de residencia

Reglas de la toma de datos:
- UN dato por mensaje. Nunca pidas los cuatro de golpe.
- Si ya te dio uno sin que lo pidieras, no lo vuelvas a pedir: sigue con el siguiente.
- No avances a la ciudad sin tener nombre, teléfono y correo.
- Si se niega a dar el correo, insiste una vez ("es donde te llega la confirmación de la cita"); si vuelve a negarse, sigue sin él.

═══ DESPUÉS DE LA CIUDAD, SE PARTE EN DOS ═══

▸ Si dice *Bogotá* (o municipio del área: Chía, Cajicá, Soacha, Cota, Mosquera, Funza, La Calera):
  Agendas TÚ MISMO, en este chat, con las herramientas.
  1. list_appointment_types → identifica la valoración auditiva.
  2. get_availability → mira horarios reales. Nunca inventes fechas ni horas.
  3. Ofrece 2-3 horarios concretos. Cierre asumido: "Te agendo el *martes 3 a las 10:00 a.m.*, ¿te sirve?".
  4. Con el sí, llama create_appointment —pasando nombre, correo Y ciudad— y solo entonces confirmas con fecha, hora y dirección.

▸ Si dice *Cartagena, Barranquilla, Cali o Medellín*:
  NO agendes. No uses las herramientas de agenda. No mandes links de agenda.
  Llama registrar_referido_otra_ciudad con nombre, correo y ciudad, y responde:
  "Listo, {NOMBRE}. En tu ciudad la cita la coordina nuestro equipo: te llaman el *siguiente día hábil* para darte fecha y hora. Ya quedaste registrado."

▸ Si dice cualquier OTRA ciudad:
  Explica que por ahora la valoración con este beneficio está disponible en Bogotá, Cartagena, Barranquilla, Cali y Medellín, y compártele https://oirconecta.com/directorio para encontrar un profesional verificado cerca. No registres nada.

═══ LÍMITES ═══
- No des diagnósticos ni interpretes síntomas. Si describe molestias, valida en una línea y encadena con la cita.
- No des precios de audífonos. El plan se define después de la valoración.
- Si pregunta por sus protectores auditivos o quiere un reclamo del producto de {ALIADO}, aclara que eso lo maneja {ALIADO} directamente y vuelve a la valoración.
- Solo agregas [ESCALAR_HUMANO] si hay urgencia médica clara (dolor fuerte, sangrado, pérdida súbita de audición) o si insiste 3+ veces en hablar con una persona.

FORMATO WHATSAPP (obligatorio):
- Negrita con UN asterisco: *negrita*. NUNCA dos (**): WhatsApp los muestra literales.
- Máximo 1-2 emojis por mensaje. Mensajes de 2-4 líneas.
- Tono colombiano, tuteo, cálido.`,

  PACIENTE_BOGOTA:
`Eres el asesor de OírConecta, centro auditivo en Bogotá (Cr 10 #96-25 Cons. 320). Escribes por WhatsApp.

═══ TU ÚNICO OBJETIVO ═══
Que la persona quede CON CITA AGENDADA Y CONFIRMADA (llamada real a create_appointment).
Una conversación amable que termina sin cita es una conversación perdida. Informar no es tu trabajo: agendar sí.

REGLA DE ORO: ningún mensaje tuyo termina sin un paso concreto hacia la cita.
Nunca cierres con "cualquier cosa me avisas", "quedo atento" o "cuando gustes".
Cierra siempre con una pregunta que se responda con un día, una hora o un sí.
(La única excepción es tu primer mensaje — ver abajo. Ahí el paso hacia la cita es entender para quién es.)

═══ TU PRIMER MENSAJE NO AGENDA ═══
Antes de proponer un horario tienes que saber para quién es. Quien escribe a un centro auditivo casi nunca escribe por sí mismo: escribe por su mamá, por su papá, por su pareja. Empujar agenda sin preguntarlo es hablarle a la persona equivocada.

En tu PRIMERA respuesta, solo tres cosas y en este orden:
1. Saluda por su nombre si lo tienes.
2. Contesta en UNA línea lo que preguntó. Si no preguntó nada concreto, di en una línea qué hacemos.
3. Haz UNA sola pregunta, la que abre todo: "¿Es para ti o para un familiar?" — o, si ya sabes para quién, "¿qué has notado?".

En ese primer mensaje NO propongas horarios, NO mandes links y NO enumeres servicios.
Desde tu segunda respuesta en adelante aplicas todo lo que sigue.

EXCEPCIÓN: si en su primer mensaje ya pide cita ("quiero agendar", "necesito una cita", "¿tienen cupo mañana?"), no lo interrogues. Propón horarios de una: ya te dijo lo que necesitaba.

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


  PACIENTE_EXISTENTE:
`Eres el asistente del centro auditivo OírConecta en Bogotá (Cr 10 #96-25 Cons. 320). Hablas con alguien que YA es paciente nuestro.

Tu prioridad no es venderle nada: es resolverle. Ya confió en nosotros, y lo que hagas acá decide si vuelve y si nos recomienda.

QUÉ SUELE NECESITAR, y qué haces:
- *Algo no le funciona* (no suena, pita, se oye distorsionado, se descargó): no diagnostiques por chat. Pregunta qué pasa exactamente y desde cuándo, y agéndale una cita de revisión — no una valoración, es paciente nuevo eso.
- *Garantía o reparación*: recoge qué producto es y qué le pasa, dile que el equipo revisa el estado de la garantía y confirma, y agrega [ESCALAR_HUMANO].
- *Control o mantenimiento*: agéndaselo con las tools, igual que una cita normal.
- *Pilas, filtros, tubos o accesorios*: puede comprarlos en https://oirconecta.com/ecommerce o pedirlos cuando venga al control.
- *Solo saluda o pregunta algo suelto*: respóndele y ofrécele el control si hace rato no viene.

REGLAS:
- Trátalo por su nombre desde el primer mensaje.
- NUNCA le ofrezcas una "valoración auditiva inicial": ya pasó por ahí. Suena a que no lo conocemos.
- No prometas cobertura de garantía ni tiempos de reparación: eso lo confirma el equipo.
- Escalas con [ESCALAR_HUMANO] si: hay reclamo o molestia, hay garantía de por medio, o pide hablar con su audióloga.

Tono: cálido, cercano, colombiano, tuteo. Máximo 3-4 líneas.
Texto plano. Negrita con UN asterisco: *así*. Nunca dos.`,

  ALIADO_PROVEEDOR:
`Eres el asistente de OírConecta. Te escribe un aliado, proveedor o alguien con una propuesta comercial.

Esta línea atiende a los pacientes del centro. Tu tarea es recibir con cortesía y encaminar, en pocos mensajes:
1. Agradece y pregunta brevemente de qué se trata, si no lo dijo.
2. Dile que lo pasas al equipo para que lo contacten.
3. Agrega [ESCALAR_HUMANO].

Prohibido: negociar, hablar de precios o condiciones, comprometer reuniones, dar datos de proveedores actuales o de volúmenes.
Tono: cordial y breve. Máximo 3 líneas. Texto plano.`,

  OTROS:
`Eres el asistente del centro auditivo OírConecta en Bogotá (Cr 10 #96-25 Cons. 320). No sabes todavía qué necesita quien escribe.

Tu primera tarea es entenderlo, con UNA pregunta abierta y amable: "Cuéntame en qué te puedo ayudar."

Según lo que responda:
- Busca atención auditiva para sí mismo o un familiar → ayúdale a agendar la valoración con las tools.
- Ya es paciente y algo no le funciona → recoge qué pasa y agéndale revisión.
- Pregunta por un pedido de la tienda → pide el número de pedido o el correo con que compró y agrega [ESCALAR_HUMANO].
- Es profesional y quiere entrar al directorio → mándalo a https://oirconecta.com/precios.
- Ofrece productos o servicios → agradece y agrega [ESCALAR_HUMANO].

Nunca inventes. Si no encaja en nada de lo anterior, responde lo que puedas y agrega [ESCALAR_HUMANO].
Tono: cálido, colombiano, tuteo. Máximo 3 líneas. Texto plano.`,

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

/**
 * Ficha corta del paciente para el prompt: quién es y en qué va.
 *
 * Deliberadamente SIN datos clínicos. El teléfono no es identidad verificada:
 * puede escribir el hijo desde el celular de la mamá, o el número puede haber
 * cambiado de dueño. Saludar por el nombre y saber que es paciente del centro
 * es seguro; soltar diagnósticos o audiometrías a quien tenga el aparato en la
 * mano, no. Eso es dato de salud bajo Habeas Data.
 */
const RESUMIR_CADA = 10; // mensajes nuevos antes de refrescar el resumen

/**
 * Resumen rodante de la conversación.
 *
 * El prompt solo carga los últimos 12 mensajes. Un paciente que vuelve a los
 * seis meses tiene su ficha, pero el bot no recuerda de qué hablaron: qué le
 * ofrecieron, qué objetó, qué quedó pendiente. Esto lo guarda condensado.
 *
 * Corre después de responder, sin bloquear la respuesta. Sin datos clínicos,
 * por la misma razón que la ficha: el teléfono no prueba identidad.
 */
async function actualizarResumen(conversationId) {
  if (!process.env.ANTHROPIC_API_KEY) return { skipped: 'no-key' };
  const conv = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, botSummary: true, botSummaryCount: true },
  });
  if (!conv) return { skipped: 'no-conv' };

  const total = await prisma.whatsAppMessage.count({ where: { conversationId } });
  if (total - (conv.botSummaryCount || 0) < RESUMIR_CADA) return { skipped: 'sin-novedad' };

  // Solo lo que aún no está resumido, en orden.
  const nuevos = await prisma.whatsAppMessage.findMany({
    where: { conversationId, type: { in: ['text', 'interactive'] } },
    orderBy: { timestamp: 'asc' },
    skip: conv.botSummaryCount || 0,
    select: { direction: true, body: true },
  });
  const transcripcion = nuevos
    .filter((m) => m.body)
    .map((m) => `${m.direction === 'INBOUND' ? 'Paciente' : 'Centro'}: ${m.body}`)
    .join('\n')
    .slice(0, 12000);
  if (!transcripcion) return { skipped: 'sin-texto' };

  try {
    const anthropic = new Anthropic();
    const r = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      system: `Resumes conversaciones de WhatsApp de un centro auditivo para que el asistente recuerde a un paciente que vuelve semanas o meses después.

Escribe máximo 6 líneas, en tercera persona, español. Prioriza en este orden:
1. Qué buscaba y para quién (él mismo, su mamá, su papá).
2. Qué se le ofreció o coordinó, y si quedó cita agendada, movida o cancelada.
3. Qué objetó o qué le preocupaba (precio, tiempo, distancia, dudas del familiar).
4. Qué quedó pendiente.

Reglas:
- NO incluyas diagnósticos, resultados de audiometría ni detalles clínicos.
- No inventes nada que no esté en la transcripción.
- Si hay un resumen previo, intégralo con lo nuevo en un solo texto, sin repetir.
- Texto plano, sin Markdown ni viñetas con asteriscos.`,
      messages: [{
        role: 'user',
        content: conv.botSummary
          ? `Resumen previo:\n${conv.botSummary}\n\nMensajes nuevos:\n${transcripcion}`
          : `Mensajes:\n${transcripcion}`,
      }],
    });
    const texto = (r.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    if (!texto) return { skipped: 'vacio' };
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { botSummary: texto.slice(0, 2000), botSummaryAt: new Date(), botSummaryCount: total },
    });
    return { updated: true };
  } catch (e) {
    console.warn('[wa-bot] resumen falló:', e.message);
    return { error: e.message };
  }
}


/** Compras en la tienda de quien escribe. ShopCustomer es un modelo aparte de
 *  Patient: quien compró accesorios en línea puede no ser paciente, y hasta
 *  ahora era un desconocido para el bot. */
async function fichaTienda(phone) {
  const last10 = String(phone || '').replace(/\D/g, '').slice(-10);
  if (!last10) return null;
  const cliente = await prisma.shopCustomer.findFirst({
    where: { telefono: { contains: last10 } },
    select: {
      nombre: true,
      orders: {
        select: { numero: true, estado: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  });
  if (!cliente || cliente.orders.length === 0) return null;
  const ESTADO = {
    PENDIENTE_PAGO: 'pendiente de pago', PAGADO: 'pagado, aún sin despachar',
    EN_PREPARACION: 'en preparación', ENVIADO: 'enviado', ENTREGADO: 'entregado',
    CANCELADO: 'cancelado',
  };
  const fmt = (d) => new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' });
  return `Ha comprado en nuestra tienda en línea (a nombre de ${cliente.nombre}). Últimos pedidos:\n`
    + cliente.orders.map((o) => `· Pedido #${o.numero} del ${fmt(o.createdAt)} — ${ESTADO[o.estado] || o.estado}`).join('\n')
    + '\nSi pregunta por su pedido, responde con esto. No prometas fechas de entrega que no tengas.';
}

async function fichaPaciente(patientId) {
  if (!patientId) return null;
  const p = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      nombre: true,
      appointments: {
        select: { fecha: true, estado: true, tipoConsulta: true },
        orderBy: { fecha: 'desc' },
        take: 40,
      },
      _count: { select: { sales: true } },
    },
  });
  if (!p) return null;

  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const asistidas = (p.appointments || []).filter((a) => ['COMPLETED', 'PATIENT'].includes(a.estado));
  const proxima = (p.appointments || [])
    .filter((a) => a.fecha && new Date(a.fecha) >= hoy && a.estado !== 'CANCELLED')
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))[0] || null;

  const fmt = (d) => new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  const lineas = [`Nombre: ${p.nombre}`];
  if (asistidas.length) {
    lineas.push(`Ya es paciente del centro. Última visita: ${fmt(asistidas[0].fecha)} (${asistidas.length} en total).`);
  } else {
    lineas.push('Está registrado pero todavía no ha asistido a ninguna cita.');
  }
  if (p._count.sales > 0) lineas.push('Ya usa audífonos adaptados por nosotros. Si escribe por un problema, es soporte, no una venta nueva.');
  if (proxima) lineas.push(`Tiene cita agendada para el ${fmt(proxima.fecha)}. Si escribe por eso, ayúdale a confirmarla, moverla o resolver dudas.`);

  return lineas.join('\n');
}

/**
 * Primer mensaje de alguien que escaneó el QR de la tarjeta de un aliado.
 * Reemplaza al handshake de botones: aquí ya sabemos a qué viene, así que
 * arrancamos la toma de datos de una vez.
 *
 * El aviso de tratamiento de datos va en este mensaje a propósito: es el
 * único momento en que la persona todavía no ha entregado nada.
 */
async function iniciarFlujoAliado(conversationId, partner) {
  if (!botEnabled()) return { skipped: 'bot-disabled' };

  const conv = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, phone: true, contactName: true },
  });
  if (!conv) return { skipped: 'conv-not-found' };

  // Antes se abortaba si ya había respuestas nuestras, para no saludar dos
  // veces. Ya no aplica: quien escanea el QR puede llevar meses escribiéndonos,
  // y ese saludo es justo lo que necesita ver. La garantía de no repetirlo la
  // da marcarConversacion, que solo devuelve primeraVez una vez por aliado.

  const saludo = conv.contactName ? `¡Hola, ${firstName(conv.contactName)}! 👋` : '¡Hola! 👋';
  const texto =
`${saludo} 🤝 *OírConecta* y *${partner.nombre}* nos unimos para cuidar tu audición de ahora en adelante.

Gracias por comprar tus protectores, y gracias por querer cuidar tu audición con nosotros.

Desde hoy tienes tu *audiometría de control gratis cada año, durante 5 años*. No es una foto de un día: es ver cómo evoluciona tu oído en el tiempo, que es lo que permite actuar a tiempo.

Te pido cuatro datos y te dejo la cita agendada hoy mismo. Le contaremos a ${partner.nombre} que te atendimos —nunca tus resultados ni tu historia clínica— y te enviaremos consejos de audición de vez en cuando, con enlace para darte de baja cuando quieras. Si prefieres que no, dímelo y listo.

¿Cuál es tu *nombre completo*?`;

  try {
    const result = await sendWhatsAppText({ to: conv.phone, text: texto });
    await prisma.whatsAppMessage.create({
      data: {
        conversationId,
        wamid: result?.providerMessageId || null,
        direction: 'OUTBOUND',
        type: 'text',
        body: texto,
        sentByBot: true,
        deliveryStatus: 'sent',
        timestamp: new Date(),
      },
    });
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        contactType: 'REFERIDO_ALIADO',
        businessLine: 'CRM',
        intent: 'CITA_PACIENTE',
        status: 'BOT',
        lastMessageAt: new Date(),
        lastMessagePreview: `Bot: referido de ${partner.nombre} — pidiendo datos`,
      },
    });
    return { sent: true };
  } catch (e) {
    console.error('[wa-bot] arranque de flujo aliado falló:', e.message);
    return { error: e.message };
  }
}

/**
 * Arranque de la rama de campaña: la persona tocó un anuncio de
 * click-to-WhatsApp. Meta manda qué anuncio fue en el objeto `referral`, y eso
 * ya quedó guardado en la conversación.
 *
 * No se le muestran los botones del handshake: quien toca un anuncio ya dijo a
 * qué viene, y devolverle un menú es hacerle repetir lo que acaba de decir.
 */
async function iniciarFlujoAnuncio(conversationId, incomingText) {
  if (!botEnabled()) return { skipped: 'bot-disabled' };

  const conv = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, phone: true, contactName: true, contactType: true, adHeadline: true },
  });
  if (!conv) return { skipped: 'conv-not-found' };

  // La campaña es del centro: quien llega por ahí es paciente, no aliado ni
  // proveedor. Si ya venía tipificado como referido de aliado, se respeta —
  // ese flujo tiene su propio beneficio prometido.
  const respetar = ['REFERIDO_ALIADO', 'PACIENTE_EXISTENTE'];
  await prisma.whatsAppConversation.update({
    where: { id: conversationId },
    data: {
      contactType: respetar.includes(conv.contactType) ? conv.contactType : 'PACIENTE_BOGOTA',
      businessLine: 'CRM',
      intent: 'CITA_PACIENTE',
      status: 'BOT',
    },
  });

  // Con texto, contesta lo que preguntó (el prompt ya sabe de qué anuncio
  // viene). Sin texto —abrió el chat desde el anuncio y no escribió— el saludo
  // lo damos nosotros.
  if (incomingText && incomingText.trim()) {
    return handleTextForBot({ conversationId, incomingText });
  }

  const saludo = conv.contactName ? `¡Hola, ${firstName(conv.contactName)}! 👋` : '¡Hola! 👋';
  const gancho = conv.adHeadline
    ? `Veo que vienes por *${conv.adHeadline}*.`
    : 'Veo que vienes por nuestro anuncio.';
  const texto =
`${saludo} Somos *OírConecta*, centro auditivo en Bogotá (Cr 10 #96-25, Cons. 320).

${gancho}

Con gusto te agendo tu *valoración auditiva* — dura cerca de una hora y sales sabiendo exactamente cómo está tu oído.

¿Te sirve mejor en la mañana o en la tarde?`;

  try {
    const result = await sendWhatsAppText({ to: conv.phone, text: texto });
    await prisma.whatsAppMessage.create({
      data: {
        conversationId,
        wamid: result?.providerMessageId || null,
        direction: 'OUTBOUND',
        type: 'text',
        body: texto,
        sentByBot: true,
        deliveryStatus: 'sent',
        timestamp: new Date(),
      },
    });
    await prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: 'Bot: llegó por anuncio — proponiendo horario',
      },
    });
    return { sent: true };
  } catch (e) {
    console.error('[wa-bot] arranque de flujo de anuncio falló:', e.message);
    return { error: e.message };
  }
}

/**
 * Arma el prompt del sistema para una conversación. Vive aparte de
 * handleTextForBot para que el ensayo del CRM pueda ver exactamente el mismo
 * prompt que corre en producción — si se copia, se desincroniza y ensayar deja
 * de servir.
 */
async function construirPrompt(conv) {
  // Antes, un contactType sin prompt dejaba al bot mudo sin dejar rastro:
  // pasaba con PACIENTE_EXISTENTE y ALIADO_PROVEEDOR, que tienen plantillas
  // activas. Ahora cualquier tipo desconocido cae en OTROS, que pregunta.
  let systemPrompt = SYSTEM_PROMPTS[conv.contactType];
  if (!systemPrompt) {
    console.warn('[wa-bot] sin prompt para contactType', conv.contactType, '— uso OTROS');
    systemPrompt = SYSTEM_PROMPTS.OTROS;
  }

  // Rellena la fecha de hoy en el prompt (solo aplica al de PACIENTE_BOGOTA).
  const hoyLocal = new Date().toLocaleString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Bogota',
  });
  systemPrompt = systemPrompt.replace('{HOY_PLACEHOLDER}', hoyLocal);

  // Rama del QR: el nombre del aliado se nombra varias veces en el prompt.
  let partner = null;
  if (conv.partnerId) {
    partner = await prisma.referralPartner.findUnique({
      where: { id: conv.partnerId },
      select: { id: true, nombre: true },
    }).catch(() => null);
  }
  systemPrompt = systemPrompt.split('{ALIADO}').join(partner?.nombre || 'nuestro aliado');

  // La rama de profesional ya no argumenta ni capta por WhatsApp: solo manda
  // al formulario de /precios, que cae en Captación comercial → Leads. Por eso
  // aquí ya NO se inyecta captacionBotConfig.

  // Quién está del otro lado. Sin esto el bot trata como desconocido a alguien
  // que lleva dos años con nosotros.
  const [ficha, tienda] = await Promise.all([
    fichaPaciente(conv.patientId).catch(() => null),
    fichaTienda(conv.phone).catch(() => null),
  ]);
  if (tienda) {
    systemPrompt += `\n\n═══ COMPRAS EN LA TIENDA ═══\n${tienda}\n═══════════════════════════`;
  }
  if (ficha) {
    systemPrompt += `\n\n═══ CON QUIÉN ESTÁS HABLANDO ═══\n${ficha}\n
Trátalo por su nombre desde el primer mensaje, con naturalidad — no anuncies que "lo tienes registrado".
NO menciones diagnósticos, resultados de audiometría ni detalles clínicos: el número de teléfono no prueba identidad y puede escribir un familiar. Si te piden datos clínicos, ofrece agendar o pasar con el equipo.
═══════════════════════════════`;
  }

  // Vino de una campaña. Saber por cuál anuncio entró cambia el arranque: la
  // promesa del anuncio es lo que la persona tiene en la cabeza, y el bot debe
  // recogerla en vez de empezar de cero.
  const AD_VIGENCIA_MS = 7 * 24 * 60 * 60 * 1000;
  const adVigente = conv.adSeenAt && (Date.now() - new Date(conv.adSeenAt).getTime()) < AD_VIGENCIA_MS;
  if (adVigente && (conv.adHeadline || conv.adBody)) {
    systemPrompt += `\n\n═══ VIENE DE UN ANUNCIO NUESTRO ═══
Tocó este anuncio en Facebook/Instagram hace poco:
· Titular: ${conv.adHeadline || '(sin titular)'}
${conv.adBody ? `· Texto: ${String(conv.adBody).slice(0, 400)}` : ''}

Cómo usarlo, en este orden:
1. Reconoce por qué vino, con las palabras del anuncio, en tu primera frase. Una sola vez — después no lo vuelvas a mencionar.
2. Responde lo que preguntó.
3. Propón la valoración con día y hora concretos.
NO prometas nada que el anuncio no diga, y NO inventes descuentos, promociones ni precios. Si el anuncio ofrece algo puntual, respétalo tal cual está escrito arriba.
═══════════════════════════════════`;
  }

  if (conv.botSummary) {
    systemPrompt += `\n\n═══ LO QUE YA HABLARON ANTES ═══\n${conv.botSummary}\n
Retoma desde ahí con naturalidad. No repitas preguntas que ya le hiciste ni le pidas datos que ya dio.
═══════════════════════════════`;
  }

  // El número es del consultorio: tanto la rama de paciente como la de dudas
  // generales deben saber lo mismo que el widget de la ficha (marcas,
  // servicios, horarios).
  if (['PACIENTE_BOGOTA', 'INFO_GENERAL', 'REFERIDO_ALIADO'].includes(conv.contactType)) {
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

  return { systemPrompt, adVigente };
}

/**
 * Ensayo: conversar con el bot sin gastar un mensaje de WhatsApp ni tocar la
 * bandeja. Corre el MISMO prompt, las MISMAS tools y el mismo modelo que
 * producción — la única diferencia es que crear la cita se simula, porque
 * ensayar no puede ocupar un cupo real de la agenda.
 *
 * @param {object} p
 * @param {string} p.contactType   rama a ensayar
 * @param {Array}  p.messages      [{role:'user'|'assistant', content:'…'}]
 * @param {string} [p.contactName] nombre del supuesto paciente
 * @param {string} [p.adHeadline]  titular del anuncio, para ensayar campañas
 * @param {string} [p.adBody]
 */
async function ensayar({ contactType = 'PACIENTE_BOGOTA', messages = [], contactName = null, adHeadline = null, adBody = null }) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('Falta ANTHROPIC_API_KEY');
  if (!messages.length) throw new Error('Sin mensajes');

  // Conversación de mentira, con la misma forma que la real. patientId va en
  // null a propósito: la ficha clínica de alguien no se mete en un ensayo.
  const conv = {
    id: 'ensayo', phone: '573000000000', contactType, contactName,
    patientId: null, botSummary: null, partnerId: null,
    adSourceId: adHeadline ? 'ensayo' : null,
    adHeadline, adBody, adSeenAt: adHeadline ? new Date() : null,
  };

  const { systemPrompt } = await construirPrompt(conv);

  let agendaProfileId = null;
  if (['PACIENTE_BOGOTA', 'REFERIDO_ALIADO'].includes(contactType)) {
    agendaProfileId = await retailProfileId();
  } else if (contactType === 'PROFESIONAL_DIRECTORIO') {
    agendaProfileId = await comercialService.getComercialProfileId();
  }
  const tools = toolsFor(contactType);
  const useBookingTools = !!agendaProfileId || contactType === 'REFERIDO_ALIADO';

  // Las tools que LEEN son las de verdad (tipos de consulta y disponibilidad
  // real): un ensayo con horarios inventados no prueba nada. Las que ESCRIBEN
  // se simulan.
  const impls = {
    ...bookingToolImpls,
    async create_appointment(ctx, input) {
      return {
        id: 'ensayo', simulado: true,
        mensaje: `[ENSAYO] Aquí se habría creado la cita: ${input.scheduledAt}`,
      };
    },
    async registrar_referido_otra_ciudad(ctx, input) {
      return { leadId: 'ensayo', simulado: true, mensaje: `[ENSAYO] Lead registrado en ${input.ciudad}` };
    },
  };

  const client = new Anthropic();
  const ctx = { conversationId: null, waPhone: conv.phone, contactName, profileId: agendaProfileId };
  const trazas = [];
  const working = [...messages];
  let texto = '';

  for (let iter = 0; iter < (useBookingTools ? 5 : 1); iter++) {
    const resp = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      ...(useBookingTools ? { tools } : {}),
      messages: working,
    });
    texto = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    const toolUses = resp.content.filter((b) => b.type === 'tool_use');
    if (!toolUses.length) break;

    working.push({ role: 'assistant', content: resp.content });
    const results = [];
    for (const tu of toolUses) {
      let output;
      try {
        output = impls[tu.name] ? await impls[tu.name](ctx, tu.input) : { error: `Tool ${tu.name} no existe` };
      } catch (e) {
        output = { error: e.message };
      }
      trazas.push({ tool: tu.name, input: tu.input, output });
      results.push({ type: 'tool_result', tool_use_id: tu.id, content: JSON.stringify(output) });
    }
    working.push({ role: 'user', content: results });
  }

  const escala = texto.includes(ESCALATE_TAG);
  return {
    texto: texto.split(ESCALATE_TAG).join('').trim(),
    escala,
    trazas,
    promptChars: systemPrompt.length,
  };
}

async function handleTextForBot({ conversationId, incomingText }) {
  if (!botEnabled()) return { skipped: 'bot-disabled' };
  if (!process.env.ANTHROPIC_API_KEY) return { skipped: 'no-anthropic-key' };

  const conv = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true, phone: true, contactType: true, status: true, contactName: true,
      patientId: true, botSummary: true, partnerId: true,
      adSourceId: true, adHeadline: true, adBody: true, adSeenAt: true,
    },
  });
  if (!conv) return { skipped: 'conv-not-found' };
  if (conv.status !== 'BOT') return { skipped: 'not-bot-status' };
  // Sin tipo asignado tampoco se queda callado: pregunta y se tipifica solo.
  if (!conv.contactType) conv.contactType = 'OTROS';

  const { systemPrompt, adVigente } = await construirPrompt(conv);

  // ¿Habilitar tools de booking? La agenda depende de la rama:
  //  · PACIENTE_BOGOTA     → agenda del centro (retail)
  //  · PROFESIONAL_DIRECTORIO → agenda del comercial de captación
  let agendaProfileId = null;
  if (conv.contactType === 'PACIENTE_BOGOTA' || conv.contactType === 'REFERIDO_ALIADO') {
    agendaProfileId = await retailProfileId();
  } else if (conv.contactType === 'PROFESIONAL_DIRECTORIO') {
    agendaProfileId = await comercialService.getComercialProfileId();
  }
  // La rama del aliado necesita tools aunque falte la agenda: fuera de Bogotá
  // solo registra el lead, y eso no depende del perfil retail.
  const tools = toolsFor(conv.contactType);
  const useBookingTools = !!agendaProfileId || conv.contactType === 'REFERIDO_ALIADO';

  const history = await loadHistory(conversationId);
  const messages = history.length > 0 ? history : [{ role: 'user', content: incomingText }];

  let reply = '';
  try {
    const client = new Anthropic();
    const toolCtx = {
      conversationId: conv.id,
      waPhone: conv.phone,
      contactName: conv.contactName,
      profileId: agendaProfileId,
      partnerId: conv.partnerId || null,
      adSourceId: adVigente ? conv.adSourceId : null,
    };

    if (useBookingTools) {
      // Tool loop: hasta 5 iteraciones.
      let finalText = '';
      const workingMessages = [...messages];
      for (let iter = 0; iter < 5; iter++) {
        const resp = await client.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          tools,
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
    // El bot se rindió: aquí hace falta una persona, y nadie la va a ver si
    // no le avisamos al teléfono.
    if (shouldEscalate) {
      require('./alertaEquipo.service').avisar({
        titulo: 'El bot escaló — necesita una persona',
        quien: conv.contactName || 'Paciente',
        telefono: conv.phone,
        texto: incomingText,
      }).catch(() => {});
    }
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
  // Ya no se deja cerrada a nadie: el número es del consultorio y quien
  // escribe merece respuesta. Antes PROFESIONAL_DIRECTORIO quedaba cerrada
  // para siempre, así que sus mensajes no aparecían en la bandeja.
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
  iniciarFlujoAliado,
  iniciarFlujoAnuncio,
  ensayar,
  actualizarResumen,
  handleButtonReply,
  handleTextForBot,
  reopenIfClosed,
};
