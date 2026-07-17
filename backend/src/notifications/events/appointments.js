/**
 * Hooks de notificaciones para Appointments.
 * Encolan los Reminders apenas se crea/actualiza una cita.
 *
 * Variables expuestas a las plantillas:
 *   nombre, fechaCita ("lun 21 ene"), horaCita ("10:30"),
 *   tipoConsulta, linkConfirm, linkReagendar, sede
 */

const { scheduleReminder } = require('../index');

const TZ = 'America/Bogota';
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'https://oirconecta.com';
const RETAIL_PROFILE_ID = process.env.RETAIL_PROFESSIONAL_ID || null;

/**
 * Decide si una cita pertenece al CRM del centro propio (OírConecta) o
 * al directorio de profesionales adscritos.
 *
 * Regla: si no hay directoryProfileId → CRM (compat histórica).
 *        si directoryProfileId === RETAIL_PROFILE_ID → CRM (retail).
 *        de lo contrario → directorio.
 */
function isCrmAppointment(appointment) {
  const pid = appointment?.directoryProfileId || null;
  if (!pid) return true;
  if (RETAIL_PROFILE_ID && pid === RETAIL_PROFILE_ID) return true;
  return false;
}

/** Prefija el templateCode según el origen de la cita. */
function pickTemplate(base, appointment) {
  const prefix = isCrmAppointment(appointment) ? 'crm_' : 'directorio_';
  return `${prefix}${base}`;
}

function formatFechaLarga(date) {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short',
  }).format(new Date(date));
}

function subMinutes(dateLike, mins) {
  return new Date(new Date(dateLike).getTime() - mins * 60_000);
}

function citaStartDate(appointment) {
  // appointment.fecha es DateTime con hora 00; hora es "HH:mm"
  const f = new Date(appointment.fecha);
  const [h, m] = (appointment.hora || '00:00').split(':').map(Number);
  const local = new Date(f);
  local.setHours(h, m, 0, 0);
  return local;
}

function buildVars(appointment) {
  const start = citaStartDate(appointment);
  return {
    nombre: appointment.patient?.nombre || appointment.patientName || 'paciente',
    fechaCita: formatFechaLarga(start),
    horaCita: appointment.hora || '',
    tipoConsulta: appointment.tipoConsulta || 'consulta',
    linkConfirm: `${PUBLIC_BASE}/agendar/confirmar?token=${appointment.rescheduleToken}`,
    linkReagendar: `${PUBLIC_BASE}/agendar/reagendar?token=${appointment.rescheduleToken}`,
    // Encuesta post-cita reutiliza el flow F6 /dejar-resena/:reviewToken
    // (endpoint /api/directory/reviews/by-token). El reviewToken se genera
    // al marcar COMPLETED en appointments.service.updateStatus.
    linkEncuesta: appointment.reviewToken
      ? `${PUBLIC_BASE}/dejar-resena/${appointment.reviewToken}`
      : `${PUBLIC_BASE}/dejar-resena/${appointment.rescheduleToken}`,
    sede: 'OÍR Conecta',
  };
}

/**
 * Encola las 3 notificaciones de una cita recién creada.
 * - CITA_AGENDADA (WhatsApp + Email) inmediato
 * - RECORDATORIO_24H (WhatsApp + Email) a T-24h
 * - RECORDATORIO_2H  (WhatsApp + SMS)   a T-2h
 *
 * Solo encola para citas con patientId real (no para registros sueltos sin paciente).
 */
async function onAppointmentCreated(appointment) {
  if (!appointment?.patientId) return { skipped: 'sin patientId' };

  const vars = buildVars(appointment);
  const start = citaStartDate(appointment);
  const now = new Date();

  const targetType = 'Appointment';
  const targetId = appointment.id;
  const patientId = appointment.patientId;
  const payload = vars;

  const results = [];

  // CITA_AGENDADA — inmediato
  for (const channel of ['WHATSAPP', 'EMAIL']) {
    results.push(await scheduleReminder({
      patientId, eventCode: 'CITA_AGENDADA', channel,
      templateCode: pickTemplate('cita_agendada', appointment),
      targetType, targetId, payload,
      scheduledFor: now,
    }));
  }

  // RECORDATORIO_24H — solo si la cita es >24h en el futuro
  const t24 = subMinutes(start, 24 * 60);
  if (t24.getTime() > now.getTime()) {
    for (const channel of ['WHATSAPP', 'EMAIL']) {
      results.push(await scheduleReminder({
        patientId, eventCode: 'RECORDATORIO_24H', channel,
        templateCode: pickTemplate('recordatorio_24h', appointment),
        targetType, targetId, payload,
        scheduledFor: t24,
      }));
    }
  }

  // RECORDATORIO_2H — solo si la cita es >2h en el futuro
  const t2 = subMinutes(start, 2 * 60);
  if (t2.getTime() > now.getTime()) {
    for (const channel of ['WHATSAPP', 'SMS']) {
      results.push(await scheduleReminder({
        patientId, eventCode: 'RECORDATORIO_2H', channel,
        templateCode: pickTemplate('recordatorio_2h', appointment),
        targetType, targetId, payload,
        scheduledFor: t2,
      }));
    }
  }

  return { scheduled: results.filter(Boolean).length };
}

/**
 * Cita reprogramada → mensaje inmediato + reset de futuros.
 * Por simplicidad en F1: cancela todos los Reminder PENDING de esta cita y
 * vuelve a encolar 24h/2h. El "cita_agendada" no se reenvía; va `reprogramacion`.
 */
async function onAppointmentRescheduled(appointment, prisma) {
  if (!appointment?.patientId) return { skipped: 'sin patientId' };

  // Cancelar pendientes anteriores
  await prisma.reminder.updateMany({
    where: {
      targetType: 'Appointment',
      targetId: appointment.id,
      status: { in: ['PENDING', 'QUEUED'] },
    },
    data: { status: 'CANCELLED', lastError: 'reprogramada' },
  });

  const vars = buildVars(appointment);
  const start = citaStartDate(appointment);
  const now = new Date();
  const targetType = 'Appointment';
  const targetId = appointment.id;
  const patientId = appointment.patientId;

  for (const channel of ['WHATSAPP', 'EMAIL']) {
    await scheduleReminder({
      patientId, eventCode: 'REPROGRAMACION', channel,
      templateCode: pickTemplate('reprogramacion', appointment),
      targetType, targetId, payload: vars,
      scheduledFor: now,
    });
  }
  const t24 = subMinutes(start, 24 * 60);
  if (t24.getTime() > now.getTime()) {
    for (const channel of ['WHATSAPP', 'EMAIL']) {
      await scheduleReminder({
        patientId, eventCode: 'RECORDATORIO_24H', channel,
        templateCode: pickTemplate('recordatorio_24h', appointment),
        targetType, targetId, payload: vars, scheduledFor: t24,
      });
    }
  }
  const t2 = subMinutes(start, 2 * 60);
  if (t2.getTime() > now.getTime()) {
    for (const channel of ['WHATSAPP', 'SMS']) {
      await scheduleReminder({
        patientId, eventCode: 'RECORDATORIO_2H', channel,
        templateCode: pickTemplate('recordatorio_2h', appointment),
        targetType, targetId, payload: vars, scheduledFor: t2,
      });
    }
  }
  return { ok: true };
}

/**
 * Cita completada → agradecimiento a T+18h (WA + Email) + encuesta a T+3d.
 * Se dispara cuando el CRM marca la cita como COMPLETED.
 */
async function onAppointmentCompleted(appointment) {
  if (!appointment?.patientId) return { skipped: 'sin patientId' };
  const vars = buildVars(appointment);
  const now = new Date();
  const t18h = new Date(now.getTime() + 18 * 3600 * 1000);
  const t3d = new Date(now.getTime() + 3 * 24 * 3600 * 1000);
  const targetType = 'Appointment';
  const targetId = appointment.id;

  for (const channel of ['WHATSAPP', 'EMAIL']) {
    await scheduleReminder({
      patientId: appointment.patientId,
      eventCode: 'AGRADECIMIENTO_POST_CITA',
      channel,
      templateCode: 'agradecimiento_post_cita',
      targetType, targetId, payload: vars,
      scheduledFor: t18h,
    });
  }
  // Encuesta post-cita (CRM-4). El link real /encuesta/:token se resuelve al enviar.
  for (const channel of ['WHATSAPP', 'EMAIL']) {
    await scheduleReminder({
      patientId: appointment.patientId,
      eventCode: 'ENCUESTA_POST_CITA',
      channel,
      templateCode: 'encuesta_post_cita',
      targetType, targetId, payload: vars,
      scheduledFor: t3d,
    });
  }
  return { ok: true };
}

async function onAppointmentCancelled(appointment, prisma) {
  if (!appointment?.patientId) return { skipped: 'sin patientId' };
  await prisma.reminder.updateMany({
    where: {
      targetType: 'Appointment',
      targetId: appointment.id,
      status: { in: ['PENDING', 'QUEUED'] },
    },
    data: { status: 'CANCELLED', lastError: 'cancelada' },
  });
  const vars = buildVars(appointment);
  for (const channel of ['WHATSAPP', 'EMAIL']) {
    await scheduleReminder({
      patientId: appointment.patientId,
      eventCode: 'CANCELACION',
      channel,
      templateCode: pickTemplate('cancelacion', appointment),
      targetType: 'Appointment',
      targetId: appointment.id,
      payload: vars,
      scheduledFor: new Date(),
    });
  }
  return { ok: true };
}

module.exports = {
  onAppointmentCreated,
  onAppointmentRescheduled,
  onAppointmentCancelled,
  onAppointmentCompleted,
};
