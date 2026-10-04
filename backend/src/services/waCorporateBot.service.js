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

// Se cambia en Render (WA_BOT_MODEL) sin tocar código.
const CLAUDE_MODEL = process.env.WA_BOT_MODEL || 'claude-haiku-4-5-20251001';
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
    description: 'Crea una cita CONFIRMADA. Llámala en cuanto el paciente eligió una hora que devolvió get_availability y dio su nombre: no pidas otra confirmación.',
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
  {
    name: 'reprogramar_cita',
    description: 'Mueve a otra fecha/hora la cita vigente de quien escribe (la que tiene este mismo WhatsApp). Antes: get_availability para el día nuevo y confirmar con él el día y la hora.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Fecha nueva YYYY-MM-DD.' },
        time: { type: 'string', description: 'Hora nueva HH:MM, tal cual viene en get_availability.' },
      },
      required: ['date', 'time'],
    },
  },
  {
    name: 'cancelar_cita',
    description: 'Cancela la cita vigente de quien escribe. Solo si él pidió cancelar y no quiso moverla a otro día.',
    input_schema: {
      type: 'object',
      properties: { motivo: { type: 'string', description: 'Lo que dijo, en pocas palabras.' } },
    },
  },
  {
    name: 'registrar_paciente_otra_ciudad',
    description: 'Pasa al equipo a alguien que vive fuera de Bogotá para que le busquen un profesional en su ciudad. Solo si aceptó que el equipo le escriba.',
    input_schema: {
      type: 'object',
      properties: {
        ciudad: { type: 'string' },
        nombre: { type: 'string', description: 'Si ya lo dijo.' },
        motivo: { type: 'string', description: 'Qué le pasa, en sus palabras y en una línea.' },
      },
      required: ['ciudad'],
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

// Toda rama que habla con un paciente agenda contra el consultorio. Antes solo
// dos tenían agenda: en las demás el bot ofrecía horas sin herramienta y caía
// en "se me cruzó un problema técnico".
const RAMAS_CON_AGENDA = ['PACIENTE_BOGOTA', 'REFERIDO_ALIADO', 'PACIENTE_EXISTENTE', 'INFO_GENERAL', 'OTROS'];

/** Qué herramientas ve el modelo según la rama de la conversación. */
function toolsFor(contactType) {
  // El aliado tiene su propio registro de otras ciudades, con el acuerdo comercial.
  if (contactType === 'REFERIDO_ALIADO') {
    return [...BOOKING_TOOLS.filter((t) => t.name !== 'registrar_paciente_otra_ciudad'), ...REFERIDO_TOOLS];
  }
  return BOOKING_TOOLS;
}

// Delegado a retail.service (misma resolución que /api/public/retail-config).
const retailProfileId = retailService.getRetailProfileId;

/**
 * De dónde viene quien escribe, en el vocabulario del embudo.
 *
 * Si tocó un anuncio es marketing digital, y punto: esa cita la pagó la pauta.
 * Sin anuncio, lo más honesto es "sitio web" — es el canal digital propio.
 * Lo que NO puede ser es "visita médica", que es donde caía todo por defecto:
 * le regalaba al trabajo comercial las citas que trajo la publicidad.
 */
async function procedenciaDeConversacion(conversationId) {
  if (!conversationId || conversationId === 'ensayo') return 'sitio-web';
  const conv = await prisma.whatsAppConversation.findUnique({
    where: { id: conversationId },
    select: { adSourceId: true, partnerId: true },
  }).catch(() => null);
  if (conv?.partnerId) return 'recomendacion';   // lo trajo un aliado
  if (conv?.adSourceId) return 'leads-marketing-digital';
  return 'sitio-web';
}

/**
 * Cuántos cupos quedan del beneficio de valoración sin costo.
 *
 * Son 50 por semana y se reinician cada lunes. Esa es la parte importante: un
 * contador que se reinicia a escondidas convierte el número en mentira —quien
 * vio "quedan 3" y al otro día ve "quedan 50" no vuelve a creer nada nuestro,
 * y basta una captura para quemarlo—. Un cupo semanal es verdad, se sostiene
 * si el paciente pregunta, y cuando se agota deja un cierre honesto: la
 * semana entrante entran otros.
 *
 * La cifra se cuenta, no se inventa: cada cita que agenda el bot consume uno.
 *
 * PROMO_CUPOS_TOTAL y PROMO_CUPOS_CICLO (semana | mes | siempre) se cambian en
 * Render sin desplegar.
 */
function inicioDelCiclo(ciclo) {
  // En hora de Bogotá: el lunes empieza el lunes de allá, no el de UTC.
  const ahora = new Date();
  const bogota = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  if (ciclo === 'mes') {
    return new Date(Date.UTC(bogota.getFullYear(), bogota.getMonth(), 1, 5, 0, 0));
  }
  if (ciclo === 'siempre') {
    const desde = process.env.PROMO_CUPOS_DESDE || '2026-09-08';
    const d = new Date(`${desde}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? new Date('2026-09-08T00:00:00.000Z') : d;
  }
  // Semana: desde el lunes 00:00 de Bogotá (05:00 UTC).
  const dia = bogota.getDay();                 // 0 domingo … 6 sábado
  const alLunes = dia === 0 ? 6 : dia - 1;
  const lunes = new Date(bogota);
  lunes.setDate(bogota.getDate() - alLunes);
  return new Date(Date.UTC(lunes.getFullYear(), lunes.getMonth(), lunes.getDate(), 5, 0, 0));
}

async function cuposDelBeneficio() {
  const total = parseInt(process.env.PROMO_CUPOS_TOTAL || '50', 10);
  if (!total || total < 1) return null;
  const ciclo = (process.env.PROMO_CUPOS_CICLO || 'semana').toLowerCase();

  const usados = await prisma.appointment.count({
    where: {
      canalRegistro: 'bot-whatsapp',
      createdAt: { gte: inicioDelCiclo(ciclo) },
      estado: { notIn: ['CANCELLED'] },
    },
  }).catch(() => 0);

  return { total, usados, quedan: Math.max(0, total - usados), ciclo };
}

/**
 * El horario real del centro, leído de la agenda.
 *
 * Estaba escrito a mano en el prompt —"lunes a viernes de 8:00 a 6:00"— y no
 * coincidía con la agenda: a un paciente el bot le dijo "de 7:30 a 5:00". Un
 * horario en dos sitios se desincroniza siempre, y el que manda es el de la
 * agenda, que es con el que se dan los cupos.
 */
async function horarioDelCentro(profileId) {
  if (!profileId) return null;
  const filas = await prisma.professionalAvailability.findMany({
    where: { profileId, active: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    select: { dayOfWeek: true, startTime: true, endTime: true },
  }).catch(() => []);
  if (filas.length === 0) return null;

  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const porDia = {};
  filas.forEach((f) => {
    (porDia[f.dayOfWeek] = porDia[f.dayOfWeek] || []).push(`${f.startTime} a ${f.endTime}`);
  });
  return Object.keys(porDia)
    .map(Number).sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
    .map((d) => `${DIAS[d]}: ${porDia[d].join(' y ')}`)
    .join(' · ');
}

/**
 * "jueves 10 de septiembre de 2026" — para que nadie tenga que deducirlo.
 *
 * Recibe un día de calendario, no un instante: `Appointment.fecha` se guarda
 * como la medianoche UTC del día de la cita. Convertirla a hora de Bogotá la
 * corría al día anterior: el paciente pidió el martes 29, la cita quedó el
 * martes 29 y el bot le confirmó "lunes, 28 de septiembre".
 */
function fechaLegible(valor) {
  let y; let m; let dia;
  const iso = typeof valor === 'string' && valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    [y, m, dia] = [Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])];
  } else {
    const d = valor instanceof Date ? valor : new Date(valor);
    if (Number.isNaN(d.getTime())) return String(valor || '');
    [y, m, dia] = [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()];
  }
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'UTC',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(Date.UTC(y, m, dia, 12)));
}

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
    // El día de la semana lo pone la herramienta. Cuando lo deducía el bot
    // ofrecía "el martes" y agendaba un jueves: le confirmó a un paciente
    // "martes 10 de septiembre" cuando el 10 era jueves.
    return { ...out, fechaLegible: fechaLegible(`${date}T12:00:00`) };
  },

  async create_appointment(ctx, input) {
    const { conversationId, waPhone, contactName } = ctx || {};
    const profileId = ctx?.profileId || await retailProfileId();
    if (!profileId) return { error: 'Agenda interna no encontrada (falta seed o env).' };

    // El teléfono lo tomamos del WA E.164 (573xxx). Reusamos como telefono.
    const res = await booking.createPublicAppointment(profileId, {
      appointmentTypeId: input.appointmentTypeId,
      scheduledAt: input.scheduledAt,
      procedencia: await procedenciaDeConversacion(conversationId),
      // Quién agendó, no de dónde viene. Es lo que permite contar los cupos
      // del beneficio sin adivinar.
      canalRegistro: 'bot-whatsapp',
      notas: input.notas || 'Agendado por WhatsApp (bot corporativo)',
      patient: {
        nombre: input.patientName || contactName || 'Paciente WhatsApp',
        telefono: waPhone,
        email: input.patientEmail || null,
      },
    });

    // El lead pasa a AGENDADO. Sin esto quedaría "NUEVO" para siempre y el
    // equipo lo llamaría para ofrecerle una cita que ya tiene.
    if (conversationId) {
      try {
        const last10 = String(waPhone || '').replace(/\D/g, '').slice(-10);
        if (last10) {
          await prisma.lead.updateMany({
            where: { telefono: { contains: last10 }, archivedAt: null, appointmentId: null },
            data: { estado: 'AGENDADO', appointmentId: res.id },
          });
        }
      } catch (e) {
        console.warn('[wa-lead] no pude marcar el lead como agendado:', e.message);
      }
    }

    // Cierra el loop del nudge A1: marca booked para que no envíe follow-up.
    // Y ata la conversación al paciente que se acaba de crear: sin ese vínculo
    // el bot no tenía cómo saber después que esta persona ya tiene cita, y se
    // la volvía a ofrecer al día siguiente como si nada.
    if (conversationId) {
      const appt = await prisma.appointment.findUnique({
        where: { id: res.id }, select: { patientId: true },
      }).catch(() => null);
      await prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: {
          agendarBookedAt: new Date(),
          ...(appt?.patientId ? { patientId: appt.patientId } : {}),
        },
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
      // Esto es lo que debe copiar el bot al confirmar, tal cual.
      fechaLegible: fechaLegible(res.fecha),
      hora: res.hora,
      durationMinutes: res.durationMinutes,
      rescheduleToken: res.rescheduleToken,
      mensaje: 'Cita creada. Al confirmarle al paciente, usa fechaLegible tal como viene: no la reescribas ni le pongas otro día de la semana.',
    };
  },

  // Luis pidió pasar su cita de 9:50 a 2:00; el bot le dijo "sí, te la muevo"
  // y luego lo mandó a llamar. Edilfredo pidió cancelar: "yo no puedo hacerlo
  // por acá". Si el bot promete "si necesitas moverla, me escribes por acá", lo
  // tiene que poder cumplir.
  async reprogramar_cita(ctx, { date, time }) {
    const cita = await citaVigentePorTelefono(ctx?.waPhone);
    if (!cita) return { error: 'No encontré una cita vigente con este WhatsApp. Pídele el día que tenía agendado y pásalo al equipo con [ESCALAR_HUMANO].' };
    if (!cita.rescheduleToken) return { error: 'Esta cita no se puede mover desde el chat. Dile que el equipo se la mueve y agrega [ESCALAR_HUMANO].' };

    const profileId = ctx?.profileId || await retailProfileId();
    const { slots } = await booking.computeSlotsForDay(profileId, date, {});
    if (!(slots || []).some((s) => s.time === time)) {
      return { error: `Las ${time} del ${fechaLegible(`${date}T12:00:00`)} no están libres. Llama get_availability y ofrécele otras.` };
    }

    const antes = `${fechaLegible(cita.fecha)} a las ${cita.hora}`;
    const updated = await require('./appointments.service').rescheduleByToken(cita.rescheduleToken, date, time);
    await prisma.appointment.update({
      where: { id: cita.id },
      data: { notas: `${cita.notas ? `${cita.notas}\n` : ''}Movida por WhatsApp (bot): antes ${antes}.` },
    }).catch(() => {});
    return {
      id: updated.id,
      fechaLegible: fechaLegible(`${date}T12:00:00`),
      hora: time,
      antes,
      mensaje: 'Cita movida. Confírmale usando fechaLegible y hora tal como vienen.',
    };
  },

  async cancelar_cita(ctx, { motivo } = {}) {
    const cita = await citaVigentePorTelefono(ctx?.waPhone);
    if (!cita) return { error: 'No encontré una cita vigente con este WhatsApp.' };
    if (!cita.rescheduleToken) return { error: 'Esta cita no se puede cancelar desde el chat. Dile que el equipo la cancela y agrega [ESCALAR_HUMANO].' };
    await require('./appointments.service').cancelByToken(cita.rescheduleToken, motivo || 'Cancelada por WhatsApp');
    return {
      cancelada: `${fechaLegible(cita.fecha)} a las ${cita.hora}`,
      mensaje: 'Cita cancelada. Díselo y ofrécele, una sola vez y sin insistir, agendar otro día.',
    };
  },

  // Fuera de Bogotá no hay a dónde mandarlo todavía: el directorio no tiene
  // profesionales en otras ciudades. Lo que funcionó fue lo que hizo el equipo a
  // mano —"conseguí una audióloga amiga en Manizales", "te agendo en Aural El
  // Poblado"—, así que el bot le pasa el caso al equipo en vez de insistirle
  // con un viaje que ya dijo que no puede hacer.
  async registrar_paciente_otra_ciudad(ctx, { ciudad, nombre, motivo }) {
    const quien = nombre || ctx?.contactName || 'Paciente WhatsApp';
    await prisma.task.create({
      data: {
        type: 'CALL',
        title: `Buscar profesional en ${ciudad} — ${quien}`,
        description: `Escribió al WhatsApp y vive en ${ciudad}, no puede venir a Bogotá.\nTeléfono: ${ctx?.waPhone || ''}\nQué le pasa: ${motivo || '(no lo dijo)'}\nSe le dijo que el equipo le escribe por el mismo chat.`,
        priority: 'HIGH',
        dueAt: siguienteDiaHabil(),
        createdBy: 'system',
        sourceEventCode: 'WA_PACIENTE_OTRA_CIUDAD',
      },
    });
    require('./alertaEquipo.service').avisar({
      titulo: `Paciente en ${ciudad} — buscarle profesional allá`,
      quien,
      telefono: ctx?.waPhone,
      texto: motivo || '',
    }).catch(() => {});
    return { mensaje: 'Pasado al equipo. Dile que le escriben por este mismo chat; no prometas nombre ni fecha.' };
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

/**
 * La próxima cita viva de quien escribe, por teléfono. Solo de hoy en adelante:
 * una cita de la semana pasada no se mueve ni se cancela.
 */
async function citaVigentePorTelefono(telefono) {
  const last10 = String(telefono || '').replace(/\D/g, '').slice(-10);
  if (!last10) return null;
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
  return prisma.appointment.findFirst({
    where: {
      estado: 'CONFIRMED',
      fecha: { gte: new Date(`${hoy}T00:00:00.000Z`) },
      OR: [
        { patientPhone: { contains: last10 } },
        { patient: { is: { telefono: { contains: last10 } } } },
      ],
    },
    orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
    select: { id: true, fecha: true, hora: true, notas: true, rescheduleToken: true },
  });
}

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

/**
 * El nombre del perfil de WhatsApp, solo si parece un nombre de persona.
 *
 * El perfil es lo que cada quien escribió ahí: "hectordiaz1748",
 * "luvianarenas1952@", "Casa Lote Umbita", "Mis Hijos Mi Fortaleza". Saludar
 * con "Quedé pendiente de ti, Casa 🙂" delata a la máquina peor que no decir
 * nombre. Devuelve '' cuando no sirve.
 */
const NO_SON_NOMBRES = new Set(['casa', 'mis', 'mi', 'solo', 'doña', 'don', 'dr', 'dra', 'el', 'la', 'los', 'las', 'tienda', 'hola', 'amor', 'familia', 'ing', 'hotel']);

function nombreParaSaludo(perfil) {
  const primero = String(perfil || '').trim().split(/\s+/)[0] || '';
  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3,12}$/.test(primero)) return '';
  if (NO_SON_NOMBRES.has(primero.toLowerCase())) return '';
  return primero[0].toUpperCase() + primero.slice(1).toLowerCase();
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
 * "¡Hola! Quiero más información" es el texto prellenado del anuncio: entra
 * así casi todo el mundo y la mayoría se iba después de la primera respuesta.
 * Esa respuesta es fija y la eligió el centro: formal, con quiénes somos, qué
 * hacemos y dónde estamos. Dejarla al modelo daba un mensaje distinto cada vez,
 * y a veces uno que abría con "los 49 cupos que quedan se agendan hoy".
 *
 * Solo aplica si el mensaje pide información y nada más: quien ya pregunta
 * por el precio o por una cita recibe respuesta a eso.
 */
function soloPideInformacion(texto) {
  const t = String(texto || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!/\binformacion\b|\binfo\b/.test(t)) return false;
  if (t.split(' ').length > 8) return false;
  return !/precio|cuanto|cuesta|valor|costo|cita|agendar|audifono|examen|audiometria|valoracion|donde|direccion|eps/.test(t);
}

/**
 * El primer mensaje solo pregunta el precio ("Precio", "¿cuánto cuesta?",
 * "info y precio"). Es la pregunta más repetida y la que más se respondía mal:
 * de 90, 38 se quedaron sin cifra. Se contesta con la bienvenida fija, que
 * lleva las cifras y los horarios de la agenda.
 */
function soloPidePrecio(texto) {
  const t = String(texto || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!/precio|cuanto (cuesta|vale|valen|cuestan|sale|es)|que valor|\bvalor\b|\bcostos?\b/.test(t)) return false;
  if (t.split(' ').length > 10) return false;
  return !/cita|agendar|examen|audiometria|donde|direccion|eps|pila|repara|limpieza|lavado|molde|plan|domicilio|vivo|ciudad/.test(t);
}

function saludoPorHora(fecha = new Date()) {
  const h = Number(new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota', hour: 'numeric', hourCycle: 'h23',
  }).format(fecha));
  if (h >= 5 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** "08:55" → "8:55 a.m." · "15:50" → "3:50 p.m." */
function hora12(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a.m.' : 'p.m.'}`;
}

/**
 * Tres horarios reales del día con cupo más cercano, de mañana en adelante.
 *
 * Salen de la agenda y no del modelo: sirven para la bienvenida, para la retoma
 * y para reemplazar una lista de horas que el modelo se inventó.
 */
async function proximosHorarios(profileId = null) {
  const pid = profileId || await retailProfileId();
  if (!pid) return null;
  const tipos = await booking.publicListTypes(pid);
  const tipo = tipos.find((t) => /valoraci/i.test(t.nombre)) || tipos[0];
  if (!tipo) return null;
  for (let i = 1; i <= 10; i++) {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })
      .format(new Date(Date.now() + i * 86400000));
    const { slots } = await booking.computeSlotsForDay(pid, date, { appointmentTypeId: tipo.id });
    const horas = (slots || []).map((s) => s.time);
    if (horas.length) {
      return {
        date,
        // "lunes, 5 de octubre de 2026" → "lunes 5 de octubre"
        dia: fechaLegible(`${date}T12:00:00`).replace(',', '').replace(/ de \d{4}$/, ''),
        horas: horas.length <= 3 ? horas : [horas[0], horas[Math.floor(horas.length / 2)], horas[horas.length - 1]],
      };
    }
  }
  return null;
}

function listaHorarios(h) {
  const n = ['1️⃣', '2️⃣', '3️⃣'];
  return `Tengo estos horarios el ${h.dia}:\n${h.horas.map((x, i) => `${n[i]} ${hora12(x)}`).join('\n')}`;
}

/**
 * Primer mensaje a quien solo pide información. Es fijo: dice dónde estamos,
 * que la valoración no cuesta y pone tres horas reales delante. Quien llega
 * por un anuncio de audífonos recibe primero el precio, que es a lo que vino.
 */
async function bienvenida(conv, fecha = new Date(), preguntaPrecio = '') {
  const anuncio = `${conv?.adHeadline || ''} ${conv?.adBody || ''}`;
  const deAudifonos = /aud[ií]fono|recargable|2x1/i.test(`${anuncio} ${preguntaPrecio}`);
  const conPromo = /2x1|promoci[oó]n/i.test(anuncio);
  const recargables = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(fecha) <= '2026-10-31';
  const nombre = nombreParaSaludo(conv?.contactName);

  const saludo = `${saludoPorHora(fecha)}${nombre ? `, ${nombre}` : ''}. Soy Aura, de OírConecta, centro auditivo en *Bogotá* (Cra. 10 #96-25, consultorio 320).`;
  const cuerpo = deAudifonos
    ? `Tenemos audífonos desde *$800.000 cada uno*${recargables ? ', y este mes recargables desde *$1.800.000 cada uno*' : ''}.${conPromo ? ' Las condiciones de la promoción del anuncio te las explican en la valoración.' : ''} Cuál te sirve se define en la valoración auditiva, que *no tiene costo*: una hora con audióloga y 4 exámenes.`
    : preguntaPrecio
      // Preguntó el precio sin decir de qué: van los dos.
      ? `La valoración auditiva *no tiene costo*; solo se pagan $150.000 si quieres llevarte los exámenes impresos. Los audífonos van desde *$800.000 cada uno*${recargables ? ', y este mes hay recargables desde *$1.800.000 cada uno*' : ''}: cuál te sirve se define en la valoración.`
      : 'La valoración auditiva *no tiene costo*: es una hora con audióloga e incluye 4 exámenes para establecer tu grado de pérdida auditiva y qué te conviene.';
  const h = await proximosHorarios().catch(() => null);
  const cierre = h
    ? `${listaHorarios(h)}\n\n¿Cuál te sirve? Si prefieres otro día o tienes una pregunta antes, cuéntame.`
    : '¿Qué día te queda bien para venir?';
  return `${saludo}\n\n${cuerpo}\n\n${cierre}`;
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
    require('./waCorporate.service').asegurarLead(conversationId)
      .catch((e) => console.warn('[wa-lead] intención:', e.message));
    // Por la cola de turnos: quien escribe dos renglones seguidos ("más
    // información" y luego "precio") recibe una sola respuesta a los dos.
    require('./waTurno.service').encolar(conversationId, incomingText, {}, (textoJunto) => (
      responder({ conversationId, incomingText: textoJunto })
    ));
    return { encolado: true };
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
`${saludo} Soy del equipo de *OírConecta*, centro auditivo en Bogotá.

Cuéntame en qué te puedo ayudar.`;

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

  // Tocó un botón de paciente: ya es un lead del embudo.
  if (['PACIENTE_BOGOTA', 'INFO_GENERAL'].includes(conv.contactType || contactType)) {
    require('./waCorporate.service').asegurarLead(conversationId)
      .catch((e) => console.warn('[wa-lead] botón:', e.message));
  }

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
  3. Ofrece SIEMPRE 3 horarios reales, numerados, y pide que conteste con el número:
     "Tengo estos horarios:\n  1️⃣ HH:MM a.m./p.m.\n  2️⃣ HH:MM a.m./p.m.\n  3️⃣ HH:MM a.m./p.m.\nContéstame con el número que te sirve, o dime otro día."
  4. Con el sí, llama create_appointment —pasando nombre, correo Y ciudad— y solo entonces confirmas con fecha, hora y dirección.

▸ Si dice *Cartagena, Barranquilla, Cali o Medellín*:
  NO agendes. No uses las herramientas de agenda. No mandes links de agenda.
  Llama registrar_referido_otra_ciudad con nombre, correo y ciudad, y responde:
  "Listo, {NOMBRE}. En tu ciudad la cita la coordina nuestro equipo: te llaman el *siguiente día hábil* para darte fecha y hora. Ya quedaste registrado."

▸ Si dice cualquier OTRA ciudad:
  Explica que por ahora la valoración con este beneficio está disponible en Bogotá, Cartagena, Barranquilla, Cali y Medellín, y compártele https://oirconecta.com/directorio para encontrar un profesional verificado cerca. No registres nada.

═══ LÍMITES ═══
- No des diagnósticos ni interpretes síntomas. Si describe molestias, valida en una línea y encadena con la cita.
- No des precios de audífonos. Qué audífono necesita se define después de la valoración.
- Si pregunta por sus protectores auditivos o quiere un reclamo del producto de {ALIADO}, aclara que eso lo maneja {ALIADO} directamente y vuelve a la valoración.
- Solo agregas [ESCALAR_HUMANO] si hay urgencia médica clara (dolor fuerte, sangrado, pérdida súbita de audición) o si insiste 3+ veces en hablar con una persona.

FORMATO WHATSAPP (obligatorio):
- Negrita con UN asterisco: *negrita*. NUNCA dos (**): WhatsApp los muestra literales.
- Máximo 1-2 emojis por mensaje. Mensajes de 2-4 líneas.
- Tono colombiano, tuteo, cálido.`,

  PACIENTE_BOGOTA:
`Eres *Aura*, de servicio al cliente de OírConecta, centro auditivo en Bogotá (Cra. 10 #96-25, Edificio Centro Ejecutivo, consultorio 320). Escribes por WhatsApp. Hoy es {HOY_PLACEHOLDER}.

═══ TU OBJETIVO ═══
Que cada persona que vive en Bogotá o la Sabana termine la conversación con su *valoración auditiva agendada*. Ese es tu trabajo y así se mide.
Lo logras diciendo la verdad: respondes lo que preguntan, quitas las dudas y pones la cita fácil. Nunca presionas con miedo, culpa ni urgencia inventada, y nunca inventas un dato.

═══ CÓMO SE GANA UNA CITA ═══
1. PRIMERO RESPONDE lo que preguntó, en la primera línea y con el dato concreto: precio, dirección, horario. Contestar otra cosa es perder a la persona.
2. ENSEGUIDA OFRECE LA CITA con horarios reales de la agenda. No preguntes "¿quieres que te muestre horarios?" ni "¿qué día te sirve?": muéstralos.
3. SI DUDA, resuelve la duda y vuelve a ofrecer una vez. Si dice que no o se despide, despídete bien y para: no insistas.
· Todo mensaje tuyo termina con un paso concreto hacia la cita, salvo que la persona ya haya cerrado.
· No hagas preguntas de diagnóstico antes de ofrecer la cita ("¿qué vienes notando?", "¿desde cuándo?", "¿es para ti o para un familiar?"). Si la persona cuenta lo que le pasa, reconócelo en una línea con sus propias palabras y pasa a los horarios.
· Máximo una pregunta por mensaje. Nunca repitas una pregunta que ya hiciste ni un mensaje que ya enviaste.

═══ LO QUE OFRECEMOS ═══
· *Valoración auditiva*: con audióloga, dura una hora e incluye 4 exámenes: otoscopia (conducto auditivo y tímpano), audiometría (cuánto oye cada oído), logoaudiometría (qué tan bien entiende las palabras) e impedanciometría (oído medio). Con ella se establece el grado de pérdida auditiva y qué le conviene a la persona.
· *La valoración no tiene costo.* Lo único que se paga es si el paciente quiere llevarse los exámenes impresos: $150.000.
· *Audífonos*: desde $800.000 cada uno. El valor sube por la tecnología (qué tan bien ayuda a entender con ruido, en una reunión o en la calle), no por qué tan fuerte sea la pérdida. Es por oído: si es en los dos, son dos. Cuál le sirve y su valor exacto se definen en la valoración.
· Por chat no se elige ni se cotiza un audífono específico. No hables de "planes". De marcas, solo lo que diga el conocimiento del centro.
· Si ya tiene exámenes o audífonos de otro lugar: que los traiga a la valoración; la audióloga los revisa y le dice qué le conviene.
· Los sábados también atendemos cuando la agenda tiene cupos ese día: consúltala antes de ofrecer un sábado o de decir que no hay.

═══ CUANDO PREGUNTAN EL PRECIO ═══
La cifra va en la primera línea. Siempre.
· De la valoración o la consulta: "La valoración no tiene costo. Solo se pagan $150.000 si quieres llevarte los exámenes impresos."
· De los audífonos: "Tenemos audífonos desde $800.000 cada uno"; después, por qué sube el valor y que es por oído; y cierras con que el primer paso para saber cuál le sirve es la valoración, que no cuesta.
· "Precio" a secas: si viene de un anuncio de audífonos o ya habló de audífonos, es el de los audífonos. Si no está claro, da los dos en dos líneas.
· "¿Y el más caro?" o un valor exacto: no tienes ese dato y no lo inventes; depende de la tecnología y se lo muestran en la valoración.
· Si vuelve a preguntar, repite la cifra sin rodeos.

═══ CÓMO AGENDAS ═══
Tienes herramientas: list_appointment_types, get_availability, create_appointment, reprogramar_cita y cancelar_cita.
1. Llama get_availability ANTES de escribir cualquier hora. Solo puedes ofrecer horas que la herramienta devolvió en este mismo turno; una hora que no venga de ahí no existe. Si el día que pide no tiene cupos, díselo y ofrece el siguiente que sí.
2. Ofrece 3 horarios del día con cupo más cercano, numerados y con el día y la fecha:
"El martes 6 de octubre tengo:
1️⃣ 8:55 a.m.
2️⃣ 10:45 a.m.
3️⃣ 3:50 p.m.
¿Cuál te sirve?"
   Di "mañana" solo si el CALENDARIO marca esa fecha como (mañana).
3. Cuando elija ("2", "la de las 10:45", "en la tarde"), pide SOLO el nombre completo de quien viene. El correo es opcional y el teléfono ya lo tienes.
4. Con la hora y el nombre, llama create_appointment de una vez. No pidas otra confirmación: ya eligió.
5. Confirma con la fecha y la hora que devuelve la herramienta, la dirección, que llegue 10 minutos antes y que puede mover la cita por este mismo chat.
REGLA DURA: la cita la crea la herramienta, no tu mensaje. Está prohibido escribir que quedó agendada si create_appointment no respondió bien. Si falla, dilo y vuelve a intentarlo tú.
Mover o cancelar una cita también lo haces tú, con reprogramar_cita y cancelar_cita. Nunca mandes a la persona a llamar.

═══ CUANDO DUDAN ═══
· "Lo voy a pensar" / "después te escribo": "Claro. Si quieres te la dejo agendada de una vez: no tiene costo y la puedes mover o cancelar por acá." Si dice que no, te despides.
· "No tengo plata" / "está caro": la valoración no cuesta y no compromete a comprar nada; sale sabiendo qué tiene y qué opciones hay.
· "Es para mi mamá / mi papá": la cita se agenda a nombre de quien viene; ofrece horarios.
· "Queda lejos" (dentro de Bogotá o la Sabana): da la dirección y ofrece el horario que mejor le quede.
· "No tengo tiempo": es una hora; ofrece el primer horario de la mañana o el último de la tarde.
· "Estoy comparando": bien hecho; la valoración no cuesta y le sirve para comparar con datos.

═══ SI VIVE FUERA DE BOGOTÁ ═══
El consultorio está solo en Bogotá. La Sabana cuenta como cerca (Chía, Cajicá, Soacha, Cota, Mosquera, Funza, La Calera, Facatativá, Zipaquirá).
· En cuanto diga que vive en otra ciudad, deja de ofrecer horarios. Una sola vez puedes decirle que si viaja, con gusto lo atendemos.
· Ofrécele que el equipo le busque un profesional de confianza en su ciudad. Si acepta, llama registrar_paciente_otra_ciudad y dile que el equipo le escribe por este chat. No prometas nombre, fecha ni hora.
· No lo mandes a oirconecta.com/directorio.

═══ CUÁNDO PASAS A UNA PERSONA DEL EQUIPO ═══
Agrega [ESCALAR_HUMANO] al final del mensaje solo si:
a) describe una urgencia: dolor fuerte, sangre o secreción por el oído, pérdida de audición de un día para otro o mareo fuerte. Dile con claridad y sin asustar que eso lo debe ver un otorrino;
b) tiene cita hoy y escribe que no encuentra el sitio, que va tarde o que no lo dejan entrar;
c) no puede salir de la casa (cama, oxígeno, accidente): dile que el equipo revisa cómo atenderla;
d) es un reclamo de un paciente;
e) insiste por segunda vez en hablar con otra persona.
Si solo pide "un asesor" una vez, respóndele que con gusto le ayudas por acá y resuelve lo que necesita.
Con niños, personas muy mayores o casos médicos complejos no opines sobre el diagnóstico: escucha, ofrece la valoración y, si el caso lo pide, escala.

═══ NO INVENTES ═══
Si un dato no está en estas instrucciones, en el conocimiento del centro o en lo que devuelve una herramienta, no lo digas. "Eso te lo confirma el equipo" es una respuesta válida.
· No tienes información de convenios con EPS, prepagadas ni seguros. Nunca digas que atendemos con EPS, con todas las aseguradoras ni en todo el país.
· No describas la zona ni cómo llegar más allá de la dirección: no digas barrio, estaciones ni rutas.
· No abras enlaces ni digas que los viste. No digas "vi que tocaste el anuncio".
· No adivines el grado de pérdida ni interpretes exámenes o síntomas por chat.

═══ CÓMO ESCRIBES ═══
· En tu primer mensaje saludas por el nombre y te presentas una sola vez: "Hola, soy Aura, de servicio al cliente de OírConecta". Si en la conversación ya hay una bienvenida tuya, no te vuelvas a presentar ni repitas lo que ya dijo.
· Máximo 4 líneas por mensaje, sin contar la lista de horarios. Frases cortas, de persona que habla, no de folleto.
· Español correcto, sin errores de ortografía. Tuteo cercano.
· Negrita con UN asterisco: *así*. Nunca dos. Sin Markdown. Máximo 2 emojis por mensaje.
· Eres Aura. No digas que eres una inteligencia artificial; si te preguntan directamente si eres un bot, no lo niegues: di que eres la asistente virtual de OírConecta y sigue ayudando.

═══ SI QUIEN ESCRIBE ES UN PROFESIONAL O UN PROVEEDOR ═══
Señales: dice que es audiólogo, otorrino o fonoaudiólogo, o que quiere entrar al directorio, pautar, ser aliado o venderles algo. Agradece, aclara en una línea que esta línea atiende a los pacientes del centro y comparte https://oirconecta.com/precios. No pidas datos ni escales.`,

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
};

// La línea es del consultorio: quien entra por "tengo una duda" o sin tipo es
// un paciente como cualquier otro, con el mismo objetivo y la misma agenda.
SYSTEM_PROMPTS.INFO_GENERAL = SYSTEM_PROMPTS.PACIENTE_BOGOTA;
SYSTEM_PROMPTS.OTROS = SYSTEM_PROMPTS.PACIENTE_BOGOTA;

const ESCALATE_TAG = '[ESCALAR_HUMANO]';

/** Carga historial reciente de la conversación en formato Anthropic. */
async function loadHistory(conversationId) {
  const rows = await prisma.whatsAppMessage.findMany({
    where: { conversationId, type: { in: ['text', 'interactive', 'audio'] } },
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
    } else {
      // Lo que escribió una persona del equipo también cuenta: sin eso el bot
      // retomaba como si nadie hubiera hablado, y repetía o contradecía.
      messages.push({ role: 'assistant', content: m.body });
    }
  }
  while (messages.length && messages[0].role !== 'user') messages.shift();
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
    where: { conversationId, type: { in: ['text', 'interactive', 'audio'] } },
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

/**
 * La cita próxima de quien escribe, si la hay.
 *
 * Se busca por paciente vinculado y, si no lo hay, por teléfono: la cita pudo
 * crearse desde la web o desde el CRM, sin pasar por esta conversación.
 */
async function citaVigenteDeConversacion(conv) {
  const desde = new Date(); desde.setHours(0, 0, 0, 0);
  const last10 = String(conv?.phone || '').replace(/\D/g, '').slice(-10);
  if (!conv?.patientId && !last10) return null;

  const cita = await prisma.appointment.findFirst({
    where: {
      fecha: { gte: desde },
      estado: { notIn: ['CANCELLED', 'NO_SHOW'] },
      ...(conv.patientId
        ? { patientId: conv.patientId }
        : { patient: { telefono: { contains: last10 } } }),
    },
    orderBy: { fecha: 'asc' },
    select: { fecha: true, hora: true, tipoConsulta: true, estado: true },
  }).catch(() => null);
  if (!cita) return null;

  // La hora vive en `hora`; `fecha` es solo el día.
  const cuando = `${fechaLegible(cita.fecha)}${cita.hora ? ` a las ${cita.hora}` : ''}`;
  return `Tiene cita el ${cuando}${cita.tipoConsulta ? ` — ${cita.tipoConsulta}` : ''}.`;
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
    select: { id: true, phone: true, contactName: true, contactType: true, adHeadline: true, adBody: true },
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

  // Vino de una campaña: existe como lead desde el primer mensaje.
  require('./waCorporate.service').asegurarLead(conversationId)
    .catch((e) => console.warn('[wa-lead] anuncio:', e.message));

  // Con texto, contesta lo que preguntó (el prompt ya sabe de qué anuncio
  // viene). Sin texto —abrió el chat desde el anuncio y no escribió— el saludo
  // lo damos nosotros.
  if (incomingText && incomingText.trim()) {
    // Por la cola de turnos, igual que cualquier otro mensaje: antes el primero
    // se contestaba de inmediato y el segundo renglón recibía otra respuesta.
    require('./waTurno.service').encolar(conversationId, incomingText, {}, (textoJunto) => (
      responder({ conversationId, incomingText: textoJunto })
    ));
    return { encolado: true };
  }

  const texto = await bienvenida(conv);

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
        lastMessagePreview: `Bot: ${texto.slice(0, 140)}`,
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
/**
 * WhatsApp usa UN asterisco para negrita. El modelo, entrenado en Markdown, a
 * veces manda ** y entonces el paciente ve los asteriscos en pantalla. Se
 * corrige aquí y no solo en el prompt: una instrucción se desobedece, esto no.
 */
/**
 * Frases con las que el bot da una cita por hecha.
 *
 * Solo las de "ya está", nunca las de proponer: "te agendo el martes a las
 * 10, ¿te sirve?" es una propuesta y no debe disparar nada. Las dos últimas
 * —llegar 10 minutos antes, traer la cédula— son las más confiables: el
 * prompt las pide justo después de crear la cita, y no aparecen antes.
 */
/**
 * Después de una corrección el modelo contestaba "Perfecto. Ahora voy con el
 * mensaje correcto: ---" y eso le llegaba al paciente, 12 veces en un mes.
 */
const SOLO_EL_MENSAJE =
`Escribe SOLO el mensaje para el paciente, como si fuera el primero. Sin "ahora sí", sin "respondo bien", sin "mensaje correcto", sin separadores "---" y sin comentar esta corrección: él no sabe que existió.`;

const PROMESA_DE_CITA =/nos vemos el |qued(aste|ó|o) agendad|ya qued(ó|o) (tu |la )?cita|tu cita qued|te (esper[aá]bamos|esperamos) el |llega(r)? 10 minutos antes|trae tu c[ée]dula/i;

/**
 * Lo que se le devuelve al modelo cuando confirmó una cita que no creó.
 *
 * Va como turno del usuario porque es el único canal que queda abierto dentro
 * del loop, pero no lo lee el paciente: su mensaje ya no se envía hasta que la
 * cita exista de verdad.
 */
const CORRECCION_AGENDA =
`ALTO — esto no lo ve el paciente.

Acabas de escribirle como si la cita ya estuviera hecha, pero NO llamaste create_appointment: en la agenda no hay nada. Si ese mensaje sale, esa persona se presenta a una cita que no existe.

Hazlo ahora, en este turno:
1. Llama create_appointment con el tipo, la fecha y la hora que ya acordaron y el nombre que te dio. Todo eso está en la conversación de arriba; no se lo vuelvas a preguntar.
2. Si te falta la disponibilidad, llama get_availability primero y usa un cupo real.
3. Solo cuando la herramienta responda bien, escribe la confirmación.

Si la herramienta devuelve error, NO confirmes: dile que se te cruzó un problema técnico agendando y pídele que te confirme el día y la hora para intentarlo de nuevo.

${SOLO_EL_MENSAJE}`;

/**
 * Lo que se le dice al paciente cuando de verdad no se pudo agendar.
 *
 * Es la verdad y deja la puerta abierta: la persona vuelve a decir el día y el
 * bot lo intenta otra vez. Mejor eso que una confirmación de una cita que no
 * existe — y mucho mejor que dejarla sin respuesta.
 */
const FALLO_AGENDANDO =
`Se me cruzó un problema técnico justo al dejar tu cita registrada 😕

¿Me confirmas otra vez el día y la hora que quieres y lo intento de una?`;

/**
 * "Te la moví para el miércoles" sin haber llamado reprogramar_cita.
 *
 * A Olmes le pasó: pidió pasar su cita del martes al miércoles, el chat le
 * dijo que sí y en la agenda la cita seguía el martes. El control de la
 * confirmación falsa no lo vio porque solo miraba si la persona tenía alguna
 * cita, y Olmes tenía una: la vieja.
 */
const PROMESA_DE_MOVER = /(te la|la|tu cita) (mov[ií]|cambi[eé]|pas[eé]|reagend[eé])|(qued[oó]|queda) (movida|reagendada|cambiada)|ya (la )?(mov[ií]|cambi[eé]|reagend[eé])|reagendad[ao] para|(ahora|nueva fecha)[^.\n]{0,20}(es|queda|qued[oó]) (el|para)/i;

const CORRECCION_REPROGRAMAR =
`ALTO — esto no lo ve el paciente.

Acabas de decirle que su cita quedó movida, pero NO llamaste reprogramar_cita: en la agenda la cita sigue en la fecha vieja. Si ese mensaje sale, esa persona llega el día que no es.

Hazlo ahora, en este turno:
1. Si te falta la disponibilidad del día nuevo, llama get_availability y usa un cupo real.
2. Llama reprogramar_cita con la fecha y la hora que ya acordaron. Están en la conversación de arriba; no se las vuelvas a preguntar.
3. Solo cuando la herramienta responda bien, escribe la confirmación con la fecha y la hora que devuelve.

Si la herramienta devuelve error, NO confirmes: dile que no alcanzaste a moverla, que sigue en la fecha vieja, y pregúntale si intentas con otro horario.

${SOLO_EL_MENSAJE}`;

/**
 * ¿Está preguntando "¿qué día?" en vez de ofrecer horas?
 *
 * A Edilma y a Edgar, que escribieron "quiero agendar una cita", el bot les
 * contestó "¿te gustaría mañana, o algún día de esta semana?". Eso es
 * devolverle el trabajo al paciente: el prompt pide horarios REALES, sacados
 * de la agenda. Se dispara solo si además NO hay ninguna hora en el mensaje —
 * "si prefieres otro día, dime cuál" después de ofrecer tres horas está bien.
 */
// Frases que solo se dicen cuando se está proponiendo un día. No se exige que
// el mensaje diga "cita": a Edgar le escribió "¿Mañana lunes te viene bien, o
// prefieres otro día?" — ni una palabra de agenda, y es justo el caso.
const PROPONE_UN_DIA = /te vienen? bien|que te muestre|qu[ée] d[íi]a|prefieres otro d[íi]a|alg[úu]n d[íi]a|cu[áa]ndo te (sirve|queda|viene|gustar[íi]a)|cu[áa]ndo (quieres|puedes|podr[íi]as) venir|te gustar[íi]a (ma[ñn]ana|el |alguno)|quieres que te (muestre|busque|comparta|pase)|te (busco|muestro) (un |los |unos )?horarios?/i;
// Anunciar los horarios en vez de ponerlos: "déjame traerte los horarios",
// "veo los horarios exactos para ti". Con el Ensayo del 4-oct salió dos veces.
const PROMETE_HORARIOS = /(veo|reviso|miro|busco|traigo|muestro|consulto)\s+(los |tus |unos |el |la )?(horarios?|cupos?|agenda|disponibilidad)|d[ée]jame (traerte|mostrarte|revisar|consultar|mirar|buscarte)|cu[áa]l de los (dos |tres )?(s[áa]bados|d[íi]as)/i;

function preguntaElDiaSinOfrecerHoras(texto) {
  const t = String(texto || '');
  if (horasOfrecidas(t).length) return false;
  return (t.includes('?') && PROPONE_UN_DIA.test(t)) || PROMETE_HORARIOS.test(t);
}

const CORRECCION_HORARIOS =
`ALTO — esto no lo ve el paciente.

Le estás preguntando qué día le sirve en vez de ofrecerle horas. Eso le devuelve a él un trabajo que es tuyo: tú tienes la agenda, él no.

Llama get_availability ahora y vuelve a escribir el mensaje COMPLETO: conserva la respuesta a lo que él preguntó (precio, dirección, lo que sea) y agrega 3 HORAS concretas de un día concreto. Si ese día no tiene cupo, díselo y ofrécele el siguiente que sí tenga. Puedes cerrar con "si prefieres otro día, dime cuál y lo miro" — pero después de poner las horas, nunca en lugar de ellas.

Y si es tu primer mensaje de la conversación, salúdalo por su nombre antes. Le acaba de escribir a un centro de salud, no a una máquina expendedora.

${SOLO_EL_MENSAJE}`;

/**
 * Las horas que el mensaje ofrece en lista numerada, en 24 h ("08:55").
 *
 * Solo la lista: "atendemos de 7:30 a.m. a 5:00 p.m." es un horario de
 * atención, no una oferta de cupo.
 */
const LINEA_DE_HORARIO = /^\s*(?:[1-9]️?⃣|[1-9][.)])[^\n]*?(\d{1,2}):(\d{2})\s?\*?\s?([ap])\.?\s?m/gim;

function horasOfrecidas(texto) {
  return [...String(texto || '').matchAll(LINEA_DE_HORARIO)].map(([, h, m, ap]) => {
    const hora = (Number(h) % 12) + (ap.toLowerCase() === 'p' ? 12 : 0);
    return `${String(hora).padStart(2, '0')}:${m}`;
  });
}

/**
 * De 122 listas de horarios, 24 traían horas que la agenda no tiene (10:30,
 * 8:30, 9:00) y 6 eran en sábado o domingo. Quien elige una de esas no queda
 * agendado: el bot se devuelve con otra lista y la persona se va.
 */
const CORRECCION_HORAS_INVENTADAS =
`ALTO — esto no lo ve el paciente.

En tu mensaje ofreces horas que la agenda no te devolvió en este turno. Una hora que no salió de get_availability no existe: si la persona la elige, no se puede agendar.

Llama get_availability para el día que quieres ofrecer y vuelve a escribir el mensaje COMPLETO —conservando lo demás que le respondías— solo con horas que devuelva la herramienta. Si ese día no hay cupos, díselo y ofrece el siguiente día que sí tenga.

${SOLO_EL_MENSAJE}`;

/** ¿Esta persona ya tiene una cita viva en la agenda? Se compara por teléfono. */
/**
 * ¿El mensaje nombra el día en que YA está la cita vigente? Entonces decir
 * "quedó para el miércoles 30" es cierto aunque no se haya movido en este
 * turno (se movió antes).
 */
async function citaYaEstaEnLaFechaDicha(telefono, texto) {
  const vigente = await citaVigentePorTelefono(telefono);
  if (!vigente) return { vigente: null, coincide: false };
  const dia = (fechaLegible(vigente.fecha).match(/(\d{1,2}) de/) || [])[1];
  const nombrados = [
    ...String(texto || '').matchAll(/(?:lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado|domingo)\s+(\d{1,2})|(\d{1,2}) de (?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi),
  ].map((m) => m[1] || m[2]);
  return { vigente, coincide: Boolean(dia) && nombrados.includes(dia) };
}

async function tieneCitaVigente(telefono) {
  const last10 = String(telefono || '').replace(/\D/g, '').slice(-10);
  if (!last10) return false;
  const cita = await prisma.appointment.findFirst({
    where: {
      patientPhone: { contains: last10 },
      estado: { in: ['CONFIRMED', 'COMPLETED', 'PATIENT'] },
    },
    select: { id: true },
  }).catch(() => null);
  return Boolean(cita);
}

/**
 * El voseo no llega hasta el paciente.
 *
 * El prompt ya lo prohíbe, pero una instrucción se desobedece: a un lead le
 * salió "¿es algo que vos venís notando con tu audición?" — voseo caleño
 * firmado por un centro de Bogotá, en el primer mensaje. Cuando el registro
 * cambia de un mensaje a otro, quien lee no piensa "qué raro": piensa que del
 * otro lado no hay nadie.
 *
 * La lista es corta y cerrada a propósito: solo formas que en español no son
 * otra cosa. Las que se escriben igual en tuteo —estás, vas, das— no se tocan.
 */
const VOSEO = [
  ['vos', 'tú'],
  ['venís', 'vienes'],
  ['tenés', 'tienes'],
  ['querés', 'quieres'],
  ['podés', 'puedes'],
  ['sabés', 'sabes'],
  ['hacés', 'haces'],
  ['decís', 'dices'],
  ['necesitás', 'necesitas'],
  ['esperás', 'esperas'],
  ['contame', 'cuéntame'],
  ['decime', 'dime'],
  ['mirá', 'mira'],
  ['vení', 'ven'],
  ['escribime', 'escríbeme'],
  // Lo que se coló en septiembre: voseo que faltaba, regionalismos de otros
  // países ("te late", "al tiro") y palabras sin tilde o mal escritas.
  ['salís', 'sales'],
  ['vivís', 'vives'],
  ['sentís', 'sientes'],
  ['escribís', 'escribes'],
  ['seguís', 'sigues'],
  ['preferís', 'prefieres'],
  ['pedís', 'pides'],
  ['o[íi]s', 'oyes'],
  ['notás', 'notas'],
  ['evitás', 'evitas'],
  ['recibís', 'recibes'],
  ['llegás', 'llegas'],
  ['avísas', 'avisas'],
  ['dejame', 'déjame'],
  ['confirmame', 'confírmame'],
  ['escribeme', 'escríbeme'],
  ['viens', 'vienes'],
  ['resolvertelo', 'resolvértelo'],
  ['deja confirmo', 'déjame confirmar'],
  ['de metemos', 'de meternos'],
  ['te late', 'te parece'],
  ['al tiro', 'de una'],
].map(([voseo, tuteo]) => [reglaDePalabra(voseo, 'gi'), tuteo]);

// 'sos' solo es voseo en minúscula; SOS en mayúscula es otra cosa y se respeta.
VOSEO.push([reglaDePalabra('sos', 'g'), 'eres']);

/**
 * \b no sirve con tildes: es ASCII, así que en "mirá los horarios" no ve
 * frontera entre la á y el espacio y la palabra se escapaba entera. El corte
 * lo hacemos contra las letras del español, acentos incluidos.
 */
function reglaDePalabra(palabra, flags) {
  return new RegExp(`(?<![\\wáéíóúüñÁÉÍÓÚÜÑ])${palabra}(?![\\wáéíóúüñÁÉÍÓÚÜÑ])`, flags);
}

/** Mantiene la mayúscula inicial: "Contame" no puede volver "cuéntame". */
function tuteoBogotano(texto) {
  return VOSEO.reduce(
    (acc, [patron, reemplazo]) => acc.replace(patron, (match) => (
      match[0] === match[0].toUpperCase()
        ? reemplazo[0].toUpperCase() + reemplazo.slice(1)
        : reemplazo
    )),
    String(texto || ''),
  );
}

/**
 * El preámbulo que el modelo le escribe a quien lo corrigió, no al paciente:
 * "Perfecto. Ahora voy con el mensaje correcto: ---". Casi siempre viene
 * separado por "---"; si no, por una frase de ese estilo al arranque.
 */
const PREAMBULO_INTERNO = /^(perfecto|listo|ok|bueno|tienes raz[oó]n)?[.,!]?\s*(ahora|voy a|te escribo|le escribo)[^\n]{0,80}(bien|correcto|como debe ser|concretas|concretos|reales)[.:!]?\s*\n+/i;

function sinPreambulo(texto) {
  let t = String(texto || '');
  const corte = t.match(/^([\s\S]{0,200}?)\n\s*[-—_]{3,}\s*\n/);
  if (corte) t = t.slice(corte[0].length);
  return t.replace(PREAMBULO_INTERNO, '');
}

/**
 * El día de la semana lo pone el calendario, no el modelo. Con la lista de
 * catorce días en el prompt igual le escribió a Zulay "miércoles 24 de
 * septiembre" (era jueves) y a Adriana "jueves 24" cuando su cita era el
 * viernes 25. Si el mensaje trae "<día> <número> de <mes>", el día se corrige.
 */
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const FECHA_CON_DIA = new RegExp(
  `(?<![\\wáéíóúñ])(lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado|domingo)(,?\\s+)(\\d{1,2})(\\s+de\\s+)(${MESES.join('|')})(\\s+de\\s+(\\d{4}))?`,
  'gi',
);

function diaDeSemanaCorrecto(texto, hoy = new Date()) {
  const hoyBogota = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(hoy);
  const [anioHoy, mesHoy] = hoyBogota.split('-').map(Number);
  return String(texto || '').replace(FECHA_CON_DIA, (todo, dia, sep, num, de, mes, conAnio, anio) => {
    const m = MESES.indexOf(mes.toLowerCase());
    // Sin año: el de hoy, salvo que el mes ya haya quedado muy atrás (en
    // diciembre se agenda para enero).
    const y = anio ? Number(anio) : (m + 1 < mesHoy - 2 ? anioHoy + 1 : anioHoy);
    const d = new Date(Date.UTC(y, m, Number(num)));
    if (d.getUTCMonth() !== m) return todo; // 31 de septiembre: mejor no tocar
    let real = DIAS_SEMANA[d.getUTCDay()];
    if (dia[0] === dia[0].toUpperCase()) real = real[0].toUpperCase() + real.slice(1);
    return `${real}${sep}${num}${de}${mes}${conAnio || ''}`;
  });
}

/**
 * "Mañana, miércoles 30" escrito un lunes 28. El día y el número estaban bien
 * (la agenda no tenía cupo el martes y ofreció el miércoles), pero el
 * "mañana" lo puso el modelo copiando la forma del ejemplo, y la persona lee
 * "mañana" antes que el número. Se busca la fecha en los próximos 14 días y,
 * si el hoy/mañana/pasado mañana no le corresponde, se cambia por el que sí o
 * se quita ("El miércoles 30").
 */
const RELATIVO_CON_DIA = new RegExp(
  '(?<![\\wáéíóúñ])(pasado\\s+ma[ñn]ana|ma[ñn]ana|hoy)(,?\\s+(?:el\\s+)?)(lunes|martes|mi[ée]rcoles|jueves|viernes|s[áa]bado|domingo)(\\s+)(\\d{1,2})(?!\\d)',
  'gi',
);

function relativoCorrecto(texto, hoy = new Date()) {
  const proximos = [];
  for (let i = 0; i < 15; i++) {
    const iso = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })
      .format(new Date(hoy.getTime() + i * 86400000));
    proximos.push(Number(iso.slice(8, 10)));
  }
  const PALABRA = ['hoy', 'mañana', 'pasado mañana'];
  return String(texto || '').replace(RELATIVO_CON_DIA, (todo, rel, sep, dia, esp, num) => {
    const offset = proximos.indexOf(Number(num));
    if (offset === -1) return todo; // fecha lejana o rara: mejor no tocar
    const dicho = rel.toLowerCase().replace(/\s+/g, ' ').replace('manana', 'mañana');
    if (dicho === PALABRA[offset]) return todo;
    // Al corregir solo se usa hoy o mañana; más allá, el nombre del día se entiende mejor.
    const correcto = offset <= 1 ? PALABRA[offset] : null;
    const mayus = rel[0] === rel[0].toUpperCase();
    if (!correcto) return `${mayus ? 'El' : 'el'} ${dia}${esp}${num}`;
    const palabra = mayus ? correcto[0].toUpperCase() + correcto.slice(1) : correcto;
    return `${palabra}${sep}${dia}${esp}${num}`;
  });
}

/**
 * Cuando se le ofrecen días u horas a alguien, siempre se le deja la salida
 * de pedir otro día: "¿miércoles 30 o jueves 1°?" a quien trabaja esos dos
 * días es un callejón, y la persona no contesta en vez de decir "ninguno".
 * El prompt lo pide; esto lo garantiza cuando el modelo lo olvida.
 */
const YA_DEJA_OTRO_DIA = /otro d[ií]a|otra fecha|otro horario|otra hora|qu[ée] d[ií]a te (queda|sirve|funciona|viene)|ninguno te (sirve|funciona|queda)/i;
const OTRO_DIA = 'Si ninguno te funciona, dime qué día te queda bien y te busco espacio.';

function conPuertaAOtroDia(texto) {
  const t = String(texto || '');
  if (!t.includes('?') || YA_DEJA_OTRO_DIA.test(t)) return t;
  // Solo cuando hay una lista de horarios de verdad. Contando cualquier hora o
  // día del texto, la frase se pegaba al horario de atención ("de 7:30 a.m. a
  // 5:00 p.m.") y a mensajes que no ofrecían nada.
  if (horasOfrecidas(t).length < 2) return t;
  return `${t.trimEnd()}\n\n${OTRO_DIA}`;
}

/**
 * A Adriana la agenda la dejó el viernes 25 y el mensaje le dijo "jueves 24".
 * Cuando la herramienta acaba de crear o mover la cita, la fecha que manda es
 * la suya: si la confirmación trae una sola fecha y no es esa, se reemplaza.
 */
function conFechaDeLaAgenda(texto, fechaLegibleReal) {
  const real = String(fechaLegibleReal || '').match(/(\d{1,2}) de ([a-záéíóú]+)/i);
  if (!real) return texto;
  const patron = new RegExp(`(\\d{1,2}) de (${MESES.join('|')})`, 'gi');
  const fechas = String(texto || '').match(patron) || [];
  if (fechas.length !== 1) return texto;
  return texto.replace(patron, `${real[1]} de ${real[2]}`);
}

function formatoWhatsApp(texto) {
  return relativoCorrecto(diaDeSemanaCorrecto(tuteoBogotano(sinPreambulo(texto))))
    // El modelo a veces envuelve la respuesta en etiquetas del andamiaje
    // (<response>…</response>) y al paciente le llegaba el cierre escrito en
    // el chat, debajo de la confirmación de su cita. Se quitan aquí.
    .replace(/<\/?(response|answer|respuesta|mensaje|message|output)>/gi, '')
    .replace(/\*\*\*(.+?)\*\*\*/gs, '*$1*')   // ***negrita cursiva***
    .replace(/\*\*(.+?)\*\*/gs, '*$1*')         // **negrita**
    .replace(/^#{1,6}\s+/gm, '')                 // ## títulos
    .replace(/^[ \t]*[-•]\s+/gm, '· ')           // viñetas de Markdown
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '$1: $2'); // [texto](url)
}

/**
 * Cuánto esperar antes de contestar.
 *
 * Contestar en medio segundo delata a la máquina y, peor, atropella: la
 * persona todavía está leyendo lo que escribió. Se simula el tiempo de alguien
 * que lee y responde — un poco por lo que le dijeron y un poco por lo que va a
 * escribir, con un techo para no dejar a nadie esperando.
 */
function pausaHumana(entrante, respuesta) {
  const leer = Math.min(2500, String(entrante || '').length * 25);
  const escribir = Math.min(6000, String(respuesta || '').length * 22);
  const ruido = 400 + Math.random() * 900;
  return Math.round(Math.min(9000, 1200 + leer + escribir + ruido));
}

async function construirPrompt(conv, consulta = null) {
  let firma = null;
  // Antes, un contactType sin prompt dejaba al bot mudo sin dejar rastro:
  // pasaba con PACIENTE_EXISTENTE y ALIADO_PROVEEDOR, que tienen plantillas
  // activas. Ahora cualquier tipo desconocido cae en OTROS, que pregunta.
  let systemPrompt = SYSTEM_PROMPTS[conv.contactType];
  if (!systemPrompt) {
    console.warn('[wa-bot] sin prompt para contactType', conv.contactType, '— uso OTROS');
    systemPrompt = SYSTEM_PROMPTS.OTROS;
  }

  // Cómo se trata a la persona. Va en TODAS las ramas y no como una línea de
  // tono más, porque el tono se desobedece y esto no puede desobedecerse: el
  // bot le escribió a un lead "¿es algo que vos venís notando?" — voseo caleño
  // saliendo de un centro de Bogotá. Cada mensaje de esa conversación lo firma
  // una persona distinta, y ahí se acabó la confianza.
  systemPrompt += `\n\n═══ CÓMO LO TRATAS (no negociable) ═══
Tuteo bogotano, el mismo de la primera línea a la última. Tú, tienes, quieres, vienes, estás, cuéntame.
PROHIBIDO el voseo: vos, venís, tenés, querés, sos, podés, decime, contame, mirá. Ni una vez, ni "para sonar cercano".
PROHIBIDO el "usted" y el "ustedes" para dirigirte a la persona. Si ella te habla de usted, tú sigues en tú: es lo cálido, no lo distante.
Colombiano neutro de Bogotá. Nada de regionalismos de otra parte —ni caleños, ni paisas, ni costeños— ni de españolismos (vale, venga, estupendo, ¿de acuerdo?).
═══════════════════════════════════`;

  // Rellena la fecha de hoy en el prompt (solo aplica al de PACIENTE_BOGOTA).
  const hoyLocal = new Date().toLocaleString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Bogota',
  });
  systemPrompt = systemPrompt.split('{HOY_PLACEHOLDER}').join(hoyLocal);

  // Los próximos catorce días, con nombre y número. Pedirle a un modelo que
  // calcule "el martes" es pedirle que se equivoque: ya le confirmó a un
  // paciente "martes 10 de septiembre" cuando el 10 era jueves, y la cita
  // quedó el día equivocado.
  const dias = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const iso = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(d);
    const nombre = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota', weekday: 'long', day: 'numeric', month: 'long',
    }).format(d);
    dias.push(`${iso} = ${nombre}${i === 0 ? ' (HOY)' : i === 1 ? ' (mañana)' : ''}`);
  }
  systemPrompt += `\n\n═══ CALENDARIO ═══
No calcules fechas: están aquí. Cuando alguien diga "el martes" o "esta semana", busca el día en esta lista y usa esa fecha exacta con las herramientas.
${dias.join('\n')}
Si el día que pide no aparece o no tiene cupo, DÍSELO —"el martes no tengo nada"— antes de ofrecerle otro. Cambiarle el día sin avisarle es como no agendarlo.
═══════════════════`;

  // Rama del QR: el nombre del aliado se nombra varias veces en el prompt.
  let partner = null;
  if (conv.partnerId) {
    partner = await prisma.referralPartner.findUnique({
      where: { id: conv.partnerId },
      select: { id: true, nombre: true },
    }).catch(() => null);
  }
  systemPrompt = systemPrompt.split('{ALIADO}').join(partner?.nombre || 'nuestro aliado');
  // Hasta aquí el prompt es igual para toda la rama durante el día: se cachea.
  const corte = systemPrompt.length;

  // La rama de profesional ya no argumenta ni capta por WhatsApp: solo manda
  // al formulario de /precios, que cae en Captación comercial → Leads. Por eso
  // aquí ya NO se inyecta captacionBotConfig.

  // Quién está del otro lado. Sin esto el bot trata como desconocido a alguien
  // que lleva dos años con nosotros.
  // El nombre del perfil de WhatsApp. Antes solo llegaba al prompt si la
  // persona ya era paciente registrado — o sea, nunca en quien llega por un
  // anuncio. Meta nos lo da desde el primer mensaje y lo estábamos botando:
  // saludar sin nombre es la mitad de la frialdad.
  if (conv.contactName && !conv.patientId) {
    const nombre = nombreParaSaludo(conv.contactName);
    systemPrompt += nombre
      ? `\n\nSe llama ${nombre}. Llámalo así desde el saludo, con naturalidad.`
      : `\n\nSu perfil de WhatsApp dice "${conv.contactName}", pero eso no es un nombre de persona. NO lo uses para llamarlo: saluda sin nombre hasta que te lo diga.`;
  }

  // Si ya hay cita, el prompt tiene que decirlo con fecha y hora. Antes esto
  // solo vivía en el historial del chat: cuando el resumen lo comía, el bot
  // volvía a proponer horarios a quien ya estaba agendado.
  const citaVigente = await citaVigenteDeConversacion(conv).catch(() => null);
  if (citaVigente) {
    systemPrompt += `\n\n═══ ESTA PERSONA YA TIENE CITA ═══
${citaVigente}
· NO le ofrezcas agendar, NO le propongas horarios y NO llames create_appointment otra vez.
· Si escribe por otra cosa, respóndele eso y ya. La cita solo se menciona si él la menciona.
· Si quiere cambiarla, la mueves TÚ: get_availability del día que pide, le ofreces horas, y con su sí llamas reprogramar_cita. Nunca le digas "sí, te la muevo" sin haber llamado la herramienta, ni lo mandes a llamar.
· Si quiere cancelarla, pregúntale una vez si prefiere moverla a otro día. Si dice que no, cancelar_cita.
· Si la herramienta devuelve error, dile la verdad y agrega [ESCALAR_HUMANO].
═══════════════════════════════`;
  }

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

Cómo usarlo:
· El anuncio es contexto TUYO, no algo que le recuerdas a él. NUNCA escribas "vi que tocaste nuestro anuncio", "veo que vienes por", "noté que hiciste clic" ni nada que suene a que lo estabas mirando. Incomoda.
· Lo que haces es dar por sentado el tema: si el anuncio hablaba de audiometría, hablas de audiometría, sin explicar cómo lo sabes.
· NO prometas nada que el anuncio no diga, y NO inventes descuentos, promociones ni precios. Si el anuncio ofrece algo puntual, respétalo tal cual está escrito arriba.
· Si el anuncio habla de audífonos (precio, recargables, 2x1) y la persona pregunta "precio" o pide información, habla primero de los audífonos y de su precio; después, de la valoración.
· Si el anuncio ofrece una promoción, confírmala como está escrita arriba y dile que las condiciones exactas se las explican en la valoración.
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
  // El cerebro (nodos, FAQs verificadas y documentos) va a
  // TODA rama que hable con un paciente. Faltaban dos, y una de ellas es la
  // peor de olvidar: el paciente que ya es nuestro preguntaba por la
  // diferencia entre exámenes y valoración y el bot improvisaba, mientras que
  // a un desconocido sí le contestaba con la FAQ aprobada.
  if (['PACIENTE_BOGOTA', 'PACIENTE_EXISTENTE', 'INFO_GENERAL', 'REFERIDO_ALIADO', 'OTROS'].includes(conv.contactType)) {
    try {
      const retailId = await retailProfileId();
      if (retailId) {
        const iaConfig = require('./iaAgentConfig.service');
        const education = await iaConfig.getEducationForPrompt(retailId);
        systemPrompt += iaConfig.buildEducationSection(education, 'OírConecta');
        firma = education?.signature || null;

        // Los documentos que se le cargaron al agente. El bot del consultorio
        // los ignoraba: se entrenaba el cerebro en /portal-profesional/ia y
        // esta línea, que es la que atiende pacientes, no lo leía.
        if (consulta) {
          try {
            const cfg = await prisma.iaAgentConfig.findUnique({
              where: { profileId: retailId }, select: { id: true },
            });
            if (cfg?.id) {
              const ingestion = require('./documentIngestion.service');
              const chunks = await ingestion.retrieveTopKChunks({ configId: cfg.id, query: consulta, k: 3 });
              if (chunks.length > 0) {
                const contexto = chunks.map((c) => c.content).join('\n\n---\n\n');
                systemPrompt += `\n\n═══ MATERIAL DEL CENTRO (referencia autorizada) ═══\n${contexto}\n
Úsalo como fuente confiable antes de improvisar. No lo cites como documento: habla como quien ya sabe.
═══════════════════════════════════`;
              }
            }
          } catch (e) {
            console.warn('[wa-bot] retrieval de documentos falló:', e.message);
          }
        }
      }
    } catch (e) {
      console.error('[wa-bot] no pude cargar la educación del centro:', e.message);
    }
  }

  // El horario real, no el que alguien escribió una vez.
  if (['PACIENTE_BOGOTA', 'PACIENTE_EXISTENTE', 'INFO_GENERAL', 'REFERIDO_ALIADO', 'OTROS'].includes(conv.contactType)) {
    try {
      const horario = await horarioDelCentro(await retailProfileId());
      if (horario) {
        systemPrompt += `\n\n═══ HORARIO DE ATENCIÓN ═══\n${horario}\nEs el horario real de la agenda. Si te preguntan, di esto y nada más — los cupos concretos los da get_availability.\n═══════════════════`;
      }
    } catch (e) {
      console.warn('[wa-bot] no pude leer el horario:', e.message);
    }
  }

  // Campaña viva: a esta gente le acabamos de ofrecer algo. Si el bot no lo
  // sabe, contesta con el catálogo de siempre y desmiente la oferta que le
  // acaba de llegar por el mismo chat. Se apaga borrando PROMO_ACTIVA en Render.
  if (process.env.PROMO_ACTIVA && ['PACIENTE_BOGOTA', 'INFO_GENERAL', 'OTROS'].includes(conv.contactType)) {
    systemPrompt += `\n\n═══ PROMOCIÓN QUE LES ACABAMOS DE ENVIAR ═══
${process.env.PROMO_ACTIVA}
· Si preguntan por ella, confírmala con naturalidad: es real y se la enviamos nosotros.
· Los detalles que NO están escritos arriba —a qué aplica, hasta cuándo va, qué incluye exactamente— no los tienes. Dilo así: "esos detalles te los confirma el equipo en la valoración", y ofrece el horario. NO los inventes: esta promoción existe.
═══════════════════════════════════`;
  }

  // Promoción del mes (decisión del dueño, 2-oct-2026). Se apaga sola el 1-nov:
  // una promo vencida que el bot sigue ofreciendo es una promesa que alguien
  // tiene que desmentir en el consultorio.
  const hoyPromo = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
  if (hoyPromo <= '2026-10-31' && ['PACIENTE_BOGOTA', 'INFO_GENERAL', 'OTROS', 'PACIENTE_EXISTENTE'].includes(conv.contactType)) {
    systemPrompt += `\n\n═══ PROMOCIÓN DE OCTUBRE ═══
Todo octubre: *audífonos recargables desde $1.800.000 cada uno*. Recargable = sin pilas: se cargan de noche, como el celular.
Cuándo la dices:
· Cuando pregunten cuánto vale un audífono: después de "desde $800.000 cada uno", en una sola frase: "y este mes tenemos audífonos recargables desde $1.800.000 cada uno". No reemplaza la cifra de $800.000, se suma.
· Cuando pregunten por promociones, descuentos, audífonos recargables o pilas.
· NO la uses para abrir la conversación ni la repitas en cada mensaje: es un dato, no un volante.
· Es por oído, igual que el otro precio.
· Lo que no está aquí —marcas, modelos, qué incluye, si aplica con financiación— no lo tienes: "esos detalles te los muestran en la valoración".
═══════════════════════════════════`;
  }

  // Lo que el equipo aprobó en 🧠 Aprendizaje, sacado de cómo terminaron
  // chats reales. Va antes del beneficio, que tiene que seguir siendo lo último.
  if (['PACIENTE_BOGOTA', 'INFO_GENERAL', 'OTROS', 'PACIENTE_EXISTENTE'].includes(conv.contactType)) {
    systemPrompt += await require('./botAprendizaje.service').leccionesParaElPrompt();
  }

  // Va de últimas a propósito: lo último que lee es lo que más pesa, y el nodo
  // de PRECIOS del cerebro todavía puede traer el valor viejo de la valoración.
  // Ya no hay "cupos de la semana" ni "si agendas hoy": la valoración no cuesta
  // nunca, y anunciar un cupo limitado que no existe es mentirle al paciente.
  if (['PACIENTE_BOGOTA', 'INFO_GENERAL', 'OTROS'].includes(conv.contactType)) {
    systemPrompt += `\n\n═══ PRECIO DE LA VALORACIÓN (esto manda sobre cualquier otra cifra de arriba) ═══
La valoración auditiva no tiene costo. Lo único que se paga es si el paciente quiere llevarse los exámenes impresos: $150.000.
No existe ninguna oferta de "cupos sin costo de la semana" ni condición de "agendar hoy": no las menciones. Si el conocimiento del centro o una lección dicen otra cosa sobre el precio de la valoración, ignóralo.
═══════════════════════════════════`;
  }

  return { systemPrompt, adVigente, firma, corte };
}

/**
 * Prompt caching: el tramo fijo (rama + trato + calendario) y el prompt
 * completo quedan en caché 5 min. Las vueltas del tool loop y los mensajes
 * seguidos del mismo paciente pagan esa parte al 10%.
 */
function bloquesSystem(texto, corte) {
  const cache = { type: 'ephemeral' };
  if (!corte || corte >= texto.length) return [{ type: 'text', text: texto, cache_control: cache }];
  return [
    { type: 'text', text: texto.slice(0, corte), cache_control: cache },
    { type: 'text', text: texto.slice(corte), cache_control: cache },
  ];
}

/**
 * La frase de cierre del centro ("Recuerda que hablaste con Aura…") se dice
 * una vez por conversación. Salía en cada despedida —13 veces en un mes, dos
 * seguidas en el mismo chat— y una firma repetida suena a plantilla.
 */
async function sinFirmaRepetida(texto, firma, conversationId) {
  const inicio = String(firma || '').trim().slice(0, 25);
  if (inicio.length < 10) return texto;
  const patron = new RegExp(`${inicio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.!\\n]*[.!]?`, 'i');
  if (!patron.test(texto)) return texto;
  const yaDicha = await prisma.whatsAppMessage.findFirst({
    where: { conversationId, direction: 'OUTBOUND', body: { contains: inicio, mode: 'insensitive' } },
    select: { id: true },
  }).catch(() => null);
  return yaDicha ? texto.replace(patron, '').replace(/\n{3,}/g, '\n\n').trim() : texto;
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
/**
 * El último recurso cuando el modelo gastó todas las vueltas llamando
 * herramientas y no escribió nada. Sin esto el paciente ve dos palomitas y
 * ninguna respuesta —"es para un familiar" y silencio—, que es peor que
 * cualquier respuesta imperfecta.
 */
async function respuestaSinTools(client, systemPrompt, messages, corte, model = CLAUDE_MODEL) {
  try {
    const resp = await client.messages.create({
      model,
      max_tokens: 800,
      system: [...bloquesSystem(systemPrompt, corte), { type: 'text', text: `ESCRIBE AHORA el mensaje para el paciente, con lo que ya sabes. No tienes herramientas en este turno: si te faltaba mirar la agenda, dile que ya le confirmas los horarios y pregúntale qué día le sirve.` }],
      messages,
    });
    return (resp.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  } catch (e) {
    console.error('[wa-bot] respuesta sin tools falló:', e.message);
    return '';
  }
}

// Con esto arranca cuando vuelve de la agenda sin repetir lo que ya había dicho.
const MULETILLA = /^(perfecto|listo|ahora s[íi]|ahora|claro|entendido|muy bien|bien|excelente)[.,!:]?\s+/i;

/**
 * Un turno del bot: el modelo, sus herramientas y las correcciones. Lo usan el
 * chat real y el Ensayo. Antes el Ensayo tenía su propio ciclo, sin las
 * correcciones: mostraba respuestas que al paciente nunca le llegaban así, y
 * lo que se probaba ahí no era lo que salía por WhatsApp.
 */
async function turnoConHerramientas({
  client, model = CLAUDE_MODEL, systemPrompt, corte, tools, messages, impls, toolCtx, telefono, etiqueta,
}) {
  const r = {
    texto: '', citaCreada: false, citaMovida: false, fechaDeLaCita: null,
    // Las horas que la agenda devolvió en este turno: las únicas que se pueden ofrecer.
    horasDeAgenda: new Set(), trazas: [], workingMessages: [...messages],
  };
  let disponibilidadConsultada = false;
  let correcciones = 0;
  // Lo que ya le había contestado al paciente (el precio, la dirección) antes
  // de ir a la agenda. Al volver con los horarios el modelo rápido arranca con
  // "Perfecto. Mañana tengo…" y bota esa parte: así se quedaron sin cifra
  // preguntas de precio que sí se habían respondido.
  let respuestaPrevia = '';
  const corregir = (resp, texto) => {
    correcciones++;
    r.workingMessages.push({ role: 'assistant', content: resp.content });
    r.workingMessages.push({ role: 'user', content: [{ type: 'text', text: texto }] });
  };

  // Las iteraciones de más son para que se corrija solo.
  for (let iter = 0; iter < 8; iter++) {
    const resp = await client.messages.create({
      model,
      max_tokens: 1024,
      system: bloquesSystem(systemPrompt, corte),
      tools,
      messages: r.workingMessages,
    });
    const toolUses = resp.content.filter((b) => b.type === 'tool_use');
    r.texto = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();

    if (toolUses.length === 0) {
      const puede = correcciones < 2;
      // Escribió la confirmación sin haber creado la cita. No se le manda:
      // se le devuelve para que llame la herramienta y agende de verdad.
      if (puede && PROMESA_DE_CITA.test(r.texto) && !r.citaCreada && !(await tieneCitaVigente(telefono))) {
        console.warn('[wa-bot] confirmó cita sin crearla — lo devuelvo a agendar.', etiqueta);
        corregir(resp, CORRECCION_AGENDA);
        continue;
      }
      // Dijo que movió la cita sin llamar reprogramar_cita.
      if (
        puede && PROMESA_DE_MOVER.test(r.texto) && !r.citaMovida && !r.citaCreada
        && !(await citaYaEstaEnLaFechaDicha(telefono, r.texto)).coincide
      ) {
        console.warn('[wa-bot] dijo que movió la cita sin moverla — lo devuelvo a reprogramar.', etiqueta);
        corregir(resp, CORRECCION_REPROGRAMAR);
        continue;
      }
      // Preguntó "¿qué día?" o prometió horarios sin haber mirado la agenda.
      if (puede && !disponibilidadConsultada && preguntaElDiaSinOfrecerHoras(r.texto)) {
        console.warn('[wa-bot] preguntó el día sin ofrecer horarios — lo devuelvo a la agenda.', etiqueta);
        respuestaPrevia = r.texto.split(/\n{2,}/)
          .filter((p) => !PROPONE_UN_DIA.test(p) && !PROMETE_HORARIOS.test(p)).join('\n\n').trim();
        corregir(resp, CORRECCION_HORARIOS);
        continue;
      }
      // Ofreció horas que la agenda no le dio.
      const inventadas = horasOfrecidas(r.texto).filter((h) => !r.horasDeAgenda.has(h));
      if (puede && inventadas.length) {
        console.warn('[wa-bot] ofreció horas que no salieron de la agenda:', inventadas.join(', '), etiqueta);
        corregir(resp, CORRECCION_HORAS_INVENTADAS);
        continue;
      }
      break;
    }

    if (r.texto.length > 80 && !PROMETE_HORARIOS.test(r.texto)) respuestaPrevia = r.texto;
    r.workingMessages.push({ role: 'assistant', content: resp.content });
    const toolResults = [];
    for (const tu of toolUses) {
      let output, isError = false;
      try {
        const impl = impls[tu.name];
        if (!impl) throw new Error(`Tool desconocida: ${tu.name}`);
        output = await impl(toolCtx, tu.input || {});
        if (tu.name === 'create_appointment' && output && !output.error) r.citaCreada = true;
        if (tu.name === 'reprogramar_cita' && output && !output.error) r.citaMovida = true;
        if (['create_appointment', 'reprogramar_cita'].includes(tu.name) && output?.fechaLegible) {
          r.fechaDeLaCita = output.fechaLegible;
        }
        if (tu.name === 'get_availability') {
          disponibilidadConsultada = true;
          (output?.slots || []).forEach((s) => r.horasDeAgenda.add(s.time));
        }
      } catch (e) {
        console.error('[wa-bot] tool', tu.name, 'falló:', e.message);
        output = { error: e.message };
        isError = true;
      }
      r.trazas.push({ tool: tu.name, input: tu.input, output });
      toolResults.push({
        type: 'tool_result',
        tool_use_id: tu.id,
        content: typeof output === 'string' ? output : JSON.stringify(output),
        is_error: isError,
      });
    }
    r.workingMessages.push({ role: 'user', content: toolResults });
  }
  // Gastó las vueltas en herramientas y no escribió: no lo dejamos mudo.
  if (!r.texto) r.texto = await respuestaSinTools(client, systemPrompt, r.workingMessages, corte, model);
  if (respuestaPrevia && MULETILLA.test(r.texto) && horasOfrecidas(r.texto).length) {
    const resto = r.texto.replace(MULETILLA, '');
    r.texto = `${respuestaPrevia}\n\n${resto.charAt(0).toUpperCase()}${resto.slice(1)}`;
  }
  return r;
}

/** Última malla: una hora que no está en la agenda no sale. */
async function soloHorasDeAgenda(reply, horasDeAgenda, agendaProfileId) {
  if (!horasOfrecidas(reply).some((h) => !horasDeAgenda.has(h))) return reply;
  const reales = await proximosHorarios(agendaProfileId).catch(() => null);
  return reales
    ? `${listaHorarios(reales)}\n\n¿Cuál te sirve? Si prefieres otro día, dime cuál y lo reviso.`
    : `En este momento no veo cupos en la agenda para los próximos días. Le paso tu caso al equipo para que te confirme un horario. ${ESCALATE_TAG}`;
}

async function ensayar({ contactType = 'PACIENTE_BOGOTA', messages = [], contactName = null, adHeadline = null, adBody = null, model = null }) {
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

  const ultima = [...messages].reverse().find((m) => m.role === 'user');
  // Igual que en el chat: el primer mensaje que solo pide información o precio
  // recibe la bienvenida fija, sin pasar por el modelo.
  const primero = messages.length === 1 && typeof messages[0].content === 'string' ? messages[0].content : '';
  if (contactType === 'PACIENTE_BOGOTA' && primero && (soloPidePrecio(primero) || soloPideInformacion(primero))) {
    return {
      texto: await bienvenida(conv, new Date(), soloPidePrecio(primero) ? primero : ''),
      escala: false, trazas: [], promptChars: 0, model: 'bienvenida fija',
    };
  }
  const { systemPrompt, corte } = await construirPrompt(
    conv,
    typeof ultima?.content === 'string' ? ultima.content : null,
  );

  let agendaProfileId = null;
  if (RAMAS_CON_AGENDA.includes(contactType)) {
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
    async reprogramar_cita(ctx, input) {
      return { simulado: true, fechaLegible: fechaLegible(`${input.date}T12:00:00`), hora: input.time, mensaje: '[ENSAYO] Aquí se habría movido la cita.' };
    },
    async cancelar_cita() {
      return { simulado: true, mensaje: '[ENSAYO] Aquí se habría cancelado la cita.' };
    },
    async registrar_paciente_otra_ciudad(ctx, input) {
      return { simulado: true, mensaje: `[ENSAYO] Caso pasado al equipo (${input.ciudad}).` };
    },
  };

  const client = new Anthropic();
  const ctx = { conversationId: null, waPhone: conv.phone, contactName, profileId: agendaProfileId };
  const modelo = /^claude-[a-z0-9-]+$/.test(String(model || '')) ? model : CLAUDE_MODEL;
  let texto = '';
  let trazas = [];
  let fechaDeLaCita = null;

  if (useBookingTools) {
    const t = await turnoConHerramientas({
      client, model: modelo, systemPrompt, corte, tools, messages, impls,
      toolCtx: ctx, telefono: conv.phone, etiqueta: 'ensayo',
    });
    ({ trazas, fechaDeLaCita } = t);
    texto = await soloHorasDeAgenda(t.texto, t.horasDeAgenda, agendaProfileId);
  } else {
    const resp = await client.messages.create({
      model: modelo, max_tokens: 800, system: bloquesSystem(systemPrompt, corte), messages,
    });
    texto = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  }

  const escala = texto.includes(ESCALATE_TAG);
  return {
    texto: (fechaDeLaCita ? (x) => x : conPuertaAOtroDia)(
      formatoWhatsApp(conFechaDeLaAgenda(texto.split(ESCALATE_TAG).join(''), fechaDeLaCita)),
    ).trim(),
    escala,
    trazas,
    promptChars: systemPrompt.length,
    model: modelo,
  };
}

async function handleTextForBot({ conversationId, incomingText, desdeAudio = false }) {
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

  let { systemPrompt, adVigente, firma, corte } = await construirPrompt(conv, incomingText);

  // Lo que vas a leer lo dijo hablando, no escribiendo.
  if (desdeAudio) {
    systemPrompt += `\n\nEste último mensaje llegó como NOTA DE VOZ y lo que lees es la transcripción.
Reconócelo una sola vez, al principio y en pocas palabras ("escuché tu nota"), para que sepa que sí llegó — si no, la gente repite el audio creyendo que se perdió.
La transcripción puede traer errores: si algo no cuadra, pregunta en vez de dar por sentado. Y no le pidas que escriba: si le queda más cómodo hablar, que hable.`;
  }

  // ¿Habilitar tools de booking? La agenda depende de la rama:
  //  · PACIENTE_BOGOTA     → agenda del centro (retail)
  //  · PROFESIONAL_DIRECTORIO → agenda del comercial de captación
  let agendaProfileId = null;
  if (RAMAS_CON_AGENDA.includes(conv.contactType)) {
    agendaProfileId = await retailProfileId();
  } else if (conv.contactType === 'PROFESIONAL_DIRECTORIO') {
    agendaProfileId = await comercialService.getComercialProfileId();
  }
  // La rama del aliado necesita tools aunque falte la agenda: fuera de Bogotá
  // solo registra el lead, y eso no depende del perfil retail.
  const tools = toolsFor(conv.contactType);
  const useBookingTools = !!agendaProfileId || conv.contactType === 'REFERIDO_ALIADO';

  const history = await loadHistory(conversationId);
  // Las notas de voz van transcritas en body. Antes el historial las dejaba
  // por fuera y terminaba en el saludo del bot: Claude no tenía qué contestar
  // y el paciente quedaba sin respuesta.
  let messages = history.length > 0 ? history : [{ role: 'user', content: incomingText }];
  if (messages[messages.length - 1].role !== 'user') messages = [...messages, { role: 'user', content: incomingText }];

  let reply = '';
  let citaCreadaEnEsteTurno = false;
  let citaMovidaEnEsteTurno = false;
  let fechaDeLaCita = null;
  let horasDeAgenda = new Set();
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
      const t = await turnoConHerramientas({
        client, systemPrompt, corte, tools, messages, impls: bookingToolImpls,
        toolCtx, telefono: conv.phone, etiqueta: `conversación: ${conversationId}`,
      });
      reply = t.texto;
      citaCreadaEnEsteTurno = t.citaCreada;
      citaMovidaEnEsteTurno = t.citaMovida;
      ({ fechaDeLaCita, horasDeAgenda } = t);
    } else {
      // Path simple sin tools (INFO_GENERAL, PROFESIONAL_DIRECTORIO, etc.)
      const resp = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 800,
        system: bloquesSystem(systemPrompt, corte),
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

  // ─── Última malla: una hora que no está en la agenda no sale ───
  if (useBookingTools) {
    const revisado = await soloHorasDeAgenda(reply, horasDeAgenda, agendaProfileId);
    if (revisado !== reply) console.error('[wa-bot] HORAS INVENTADAS — se cambian por las de la agenda. conversación:', conversationId);
    reply = revisado;
  }

  // ─── Última malla: la confirmación falsa no sale ───
  //
  // A Hellen le escribió "valoración auditiva, viernes 11 a las 2:00 p.m.,
  // llega 10 minutos antes y trae tu cédula, ¡nos vemos el viernes!" sin haber
  // llamado create_appointment. Llegó el viernes a una cita que no existía.
  //
  // Arriba el bot ya tuvo dos oportunidades de corregirse y agendar él mismo.
  // Si aun así el mensaje da la cita por hecha y en la agenda no hay nada, lo
  // que NO puede pasar es que salga: se cambia por la verdad, que además deja
  // la conversación donde el bot puede retomarla.
  let citaFantasma = false;
  if (PROMESA_DE_CITA.test(reply) && !citaCreadaEnEsteTurno) {
    citaFantasma = !(await tieneCitaVigente(conv.phone));
    if (citaFantasma) {
      console.error(
        '[wa-bot] CITA FANTASMA — confirmó sin crear y no se corrigió.',
        'conversación:', conversationId, 'teléfono:', conv.phone,
        '— mensaje bloqueado:', reply.slice(0, 200),
      );
      reply = FALLO_AGENDANDO;
    }
  }

  // Lo mismo con una cita movida: si el mensaje dice que quedó en otra fecha
  // y la agenda la tiene en la vieja, no sale. Se le dice la verdad.
  let citaNoMovida = false;
  if (PROMESA_DE_MOVER.test(reply) && !citaMovidaEnEsteTurno && !citaCreadaEnEsteTurno) {
    const { vigente, coincide } = await citaYaEstaEnLaFechaDicha(conv.phone, reply);
    if (vigente && !coincide) {
      citaNoMovida = true;
      console.error(
        '[wa-bot] CITA NO MOVIDA — dijo que la movió y sigue en la fecha vieja.',
        'conversación:', conversationId, 'teléfono:', conv.phone,
        '— mensaje bloqueado:', reply.slice(0, 200),
      );
      reply = `Perdón, no alcancé a mover tu cita: sigue el ${fechaLegible(vigente.fecha)} a las ${vigente.hora}.

¿Me confirmas a qué día y hora la quieres pasar y la muevo ya mismo?`;
      require('./alertaEquipo.service').avisar({
        titulo: 'El bot no logró mover una cita (la sigue intentando él)',
        quien: conv.contactName || 'Paciente',
        telefono: conv.phone,
        texto: 'Dijo que la movía y reprogramar_cita no corrió. Revisar la cita en la agenda.',
      }).catch(() => {});
    }
  }

  // Detecta tag de escalada. Una cita que no se pudo crear NO escala: el bot
  // se queda a cargo y la reintenta con la persona.
  const shouldEscalate = reply.includes(ESCALATE_TAG);
  const cleanReply = await sinFirmaRepetida(
    // Si en este turno se creó o movió la cita, el mensaje es una confirmación: no se ofrece otro día.
    (fechaDeLaCita ? (x) => x : conPuertaAOtroDia)(
      formatoWhatsApp(conFechaDeLaAgenda(reply.replace(ESCALATE_TAG, ''), fechaDeLaCita)),
    ).trim(),
    firma, conversationId,
  );

  try {
    // El webhook ya respondió 200 hace rato: esperar aquí no le cuesta nada a
    // Meta y hace que del otro lado se sienta una persona, no un autoresponder.
    await new Promise((r) => setTimeout(r, pausaHumana(incomingText, cleanReply)));
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
        lastMessagePreview: citaFantasma || citaNoMovida
          ? `⚠️ No pudo ${citaNoMovida ? 'mover la cita' : 'agendar'} — ${cleanReply.slice(0, 100)}`
          : `Bot: ${cleanReply.slice(0, 140)}`,
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
    // Nadie tiene que atender esto: el bot sigue a cargo y lo reintenta con la
    // persona. El aviso es para saber que la herramienta está fallando, no
    // para que alguien entre a la conversación.
    if (citaFantasma) {
      require('./alertaEquipo.service').avisar({
        titulo: 'El bot no logró crear una cita (la sigue intentando él)',
        quien: conv.contactName || 'Paciente',
        telefono: conv.phone,
        texto: 'create_appointment no corrió pese a dos correcciones. Revisar cupos y tipos de consulta de la agenda.',
      }).catch(() => {});
    }
    return { sent: true, escalated: shouldEscalate, citaFantasma };
  } catch (e) {
    console.error('[wa-bot] envío texto falló:', e.message);
    return { error: e.message };
  }
}

/**
 * La entrada única para contestarle a un paciente.
 *
 * Si es nuestra primera respuesta y solo pidió información, va la bienvenida
 * fija; en cualquier otro caso responde el modelo. Antes la bienvenida vivía
 * solo en la ruta sin anuncio, y quien llegaba por un anuncio —casi todos—
 * recibía un mensaje improvisado.
 */
async function responder({ conversationId, incomingText, desdeAudio = false }) {
  if (!botEnabled()) return { skipped: 'bot-disabled' };
  const pidePrecio = soloPidePrecio(incomingText);
  if (!desdeAudio && (pidePrecio || soloPideInformacion(incomingText))) {
    const [conv, yaRespondimos] = await Promise.all([
      prisma.whatsAppConversation.findUnique({
        where: { id: conversationId },
        select: { status: true, contactType: true, contactName: true, adHeadline: true, adBody: true },
      }),
      prisma.whatsAppMessage.count({ where: { conversationId, direction: 'OUTBOUND' } }),
    ]);
    if (conv?.status === 'BOT' && conv.contactType === 'PACIENTE_BOGOTA' && yaRespondimos === 0) {
      const texto = await bienvenida(conv, new Date(), pidePrecio ? incomingText : '');
      await require('./waCorporate.service').sendTextToConversation({
        conversationId, text: texto, sentByBot: true,
      });
      await prisma.whatsAppConversation.update({
        where: { id: conversationId },
        data: { lastMessagePreview: `Bot: ${texto.slice(0, 140)}` },
      });
      return { sent: true, bienvenida: true };
    }
  }
  return handleTextForBot({ conversationId, incomingText, desdeAudio });
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
  cuposDelBeneficio,
  nombreParaSaludo,
  ensayar,
  actualizarResumen,
  handleButtonReply,
  handleTextForBot,
  responder,
  proximosHorarios,
  listaHorarios,
  reopenIfClosed,
  instruccionesVigentes: () => SYSTEM_PROMPTS.PACIENTE_BOGOTA,
};
