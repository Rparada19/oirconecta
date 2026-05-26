/**
 * Servicio de citas
 */

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { isColombianHoliday } = require('../utils/colombiaHolidays');

const prisma = new PrismaClient();

// Slots: 50 min de consulta + 10 min de buffer = 1 cita por hora
// Lun-Vie 08:00 – 16:00 (última cita; termina a las 16:50)
const DEFAULT_SLOTS = [
  '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00',
];

/** true si la fecha (YYYY-MM-DD) es inhábil (fin de semana o feriado CO) */
function isNonWorkingDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay(); // 0=dom, 6=sab
  if (dow === 0 || dow === 6) return true;
  return isColombianHoliday(dateStr);
}

/** Genera un token seguro para reagendamiento */
function generateRescheduleToken() {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Obtener todas las citas
 */
const getAll = async ({ fecha, estado, patientEmail, page = 1, limit = 50 }) => {
  const where = {};

  if (patientEmail) {
    where.patientEmail = (patientEmail || '').trim().toLowerCase();
  }

  if (fecha) {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);
    
    where.fecha = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  if (estado) {
    where.estado = estado;
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        patient: true,
      },
      orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    appointments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Obtener estadísticas de citas
 */
const getStats = async (periodo = 'month') => {
  const now = new Date();
  let startDate = new Date();

  switch (periodo) {
    case 'day':
      startDate.setDate(now.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate = new Date(0);
  }

  const stats = await prisma.appointment.groupBy({
    by: ['estado'],
    where: {
      fecha: { gte: startDate },
    },
    _count: { id: true },
  });

  const total = stats.reduce((sum, s) => sum + s._count.id, 0);

  const result = {
    total,
    confirmed: 0,
    completed: 0,
    noShow: 0,
    cancelled: 0,
    rescheduled: 0,
    patient: 0,
  };

  stats.forEach((s) => {
    const key = s.estado === 'NO_SHOW' ? 'noShow' : s.estado.toLowerCase();
    result[key] = s._count.id;
  });

  return result;
};

/**
 * Determinar si un slot cae dentro de un rango bloqueado
 */
const slotInBlockRange = (slot, horaInicio, horaFin) => {
  const toMin = (t) => {
    const [h, m] = (t || '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const slotMin = toMin(slot);
  const startMin = toMin(horaInicio);
  const endMin = toMin(horaFin);
  return slotMin >= startMin && slotMin < endMin;
};

/**
 * Obtener horarios disponibles para una fecha
 * Si professionalId se proporciona, solo excluye citas de ese profesional
 * Si no, excluye todas las citas (comportamiento anterior)
 */
const getAvailableSlots = async (fecha, professionalId = null) => {
  const dateStr = typeof fecha === 'string' ? fecha.split('T')[0] : fecha;

  // Rechazar días inhábiles (fin de semana o feriado colombiano)
  if (isNonWorkingDay(dateStr)) {
    return { fecha: dateStr, availableSlots: [], bookedSlots: [], nonWorking: true };
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
  const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);

  const whereClause = {
    fecha: { gte: startOfDay, lte: endOfDay },
    estado: { notIn: ['CANCELLED'] },
  };
  if (professionalId) {
    whereClause.professionalId = professionalId;
  }

  const bookedAppointments = await prisma.appointment.findMany({
    where: whereClause,
    select: { hora: true },
  });

  let approvedBlocks = [];
  try {
    const blockedSlotsService = require('./blockedSlots.service');
    approvedBlocks = await blockedSlotsService.getApprovedForDate(fecha);
  } catch (e) {
    console.warn('[getAvailableSlots] BlockedSlot no disponible, usando solo citas:', e.message);
  }

  const bookedSlots = new Set(bookedAppointments.map((a) => a.hora));

  const availableSlots = DEFAULT_SLOTS.filter((slot) => {
    if (bookedSlots.has(slot)) return false;
    const inBlock = approvedBlocks.some((b) =>
      slotInBlockRange(slot, b.horaInicio, b.horaFin)
    );
    return !inBlock;
  });

  return {
    fecha,
    availableSlots,
    bookedSlots: [...bookedSlots],
  };
};

/**
 * Obtener cita por ID
 */
const getById = async (id) => {
  return prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: true,
      consultation: true,
      createdBy: {
        select: { id: true, nombre: true, email: true },
      },
    },
  });
};

/**
 * Crear cita
 */
const create = async (data, createdById) => {
  const fecha = new Date(data.fecha);
  fecha.setHours(0, 0, 0, 0);

  let directoryProfileId = null;
  if (data.directoryProfileId != null && String(data.directoryProfileId).trim()) {
    const did = String(data.directoryProfileId).trim();
    const dp = await prisma.directoryProfile.findFirst({
      where: { id: did, status: 'APPROVED' },
      select: { id: true },
    });
    if (dp) directoryProfileId = dp.id;
  }

  const appointment = await prisma.appointment.create({
    data: {
      fecha,
      hora: data.hora,
      motivo: data.motivo,
      procedencia: data.procedencia || 'visita-medica',
      estado: 'CONFIRMED',
      notas: data.notas,
      tipoConsulta: data.tipoConsulta,
      durationMinutes: 50,
      professionalId: data.professionalId || null,
      directoryProfileId,
      professionalNotifyEmail: data.professionalNotifyEmail
        ? String(data.professionalNotifyEmail).trim().toLowerCase()
        : null,
      patientId: data.patientId,
      patientName: data.patientName,
      patientEmail: data.patientEmail?.toLowerCase(),
      patientPhone: data.patientPhone,
      createdById,
      rescheduleToken: generateRescheduleToken(),
    },
    include: {
      patient: true,
    },
  });

  // Envío de correos no debe bloquear la respuesta del POST. Si el SMTP cuelga
  // (ej. Render bloquea puerto 465), la cita igual queda registrada y el paciente
  // ve la confirmación inmediata; los emails se intentan en segundo plano.
  const { sendBookingConfirmations, sendBookingConfirmation } = require('./email.service');
  const config = require('../config');
  sendBookingConfirmations(appointment, {
    professionalName: data.professionalDisplayName || undefined,
  }).catch((e) => {
    console.error('[appointments.create] email notify:', e.message);
  });
  // Aviso al admin si está configurado y es diferente al profesional
  if (config.admin.email && config.admin.email !== appointment.professionalNotifyEmail) {
    const adminAppt = { ...appointment, patientEmail: null, professionalNotifyEmail: config.admin.email };
    sendBookingConfirmation(adminAppt, { professionalName: data.professionalDisplayName || undefined })
      .catch((e) => console.error('[appointments.create] admin email notify:', e.message));
  }

  return appointment;
};

/**
 * Actualizar cita
 */
const update = async (id, data) => {
  const updateData = { ...data };
  
  if (data.fecha) {
    const fecha = new Date(data.fecha);
    fecha.setHours(0, 0, 0, 0);
    updateData.fecha = fecha;
  }

  if (data.patientEmail) {
    updateData.patientEmail = data.patientEmail.toLowerCase();
  }

  return prisma.appointment.update({
    where: { id },
    data: updateData,
    include: {
      patient: true,
    },
  });
};

/**
 * Actualizar estado de cita
 */
const updateStatus = async (id, estado) => {
  return prisma.appointment.update({
    where: { id },
    data: { estado },
  });
};

/**
 * Cancelar cita
 */
const cancel = async (id) => {
  return prisma.appointment.update({
    where: { id },
    data: { estado: 'CANCELLED' },
  });
};

/** Obtener cita por rescheduleToken (público) */
const getByRescheduleToken = async (token) => {
  return prisma.appointment.findUnique({
    where: { rescheduleToken: token },
    select: {
      id: true, fecha: true, hora: true, motivo: true,
      patientName: true, estado: true, rescheduleToken: true,
    },
  });
};

/** Confirmar cita desde email (sin enviar correo) */
const confirmByToken = async (token) => {
  const apt = await prisma.appointment.findUnique({ where: { rescheduleToken: token } });
  if (!apt) throw Object.assign(new Error('Cita no encontrada'), { statusCode: 404 });
  if (apt.estado === 'CANCELLED') throw Object.assign(new Error('La cita fue cancelada'), { statusCode: 400 });
  return prisma.appointment.update({
    where: { rescheduleToken: token },
    data: { patientConfirmedAt: new Date() },
  });
};

/** Reagendar cita desde email */
const rescheduleByToken = async (token, newFecha, newHora) => {
  const apt = await prisma.appointment.findUnique({ where: { rescheduleToken: token } });
  if (!apt) throw Object.assign(new Error('Cita no encontrada'), { statusCode: 404 });
  if (apt.estado === 'CANCELLED') throw Object.assign(new Error('La cita fue cancelada'), { statusCode: 400 });

  const dateStr = String(newFecha).split('T')[0];
  if (isNonWorkingDay(dateStr)) throw Object.assign(new Error('Fecha no hábil'), { statusCode: 400 });

  const [y, m, d] = dateStr.split('-').map(Number);
  const fecha = new Date(y, m - 1, d, 0, 0, 0, 0);

  const updated = await prisma.appointment.update({
    where: { rescheduleToken: token },
    data: {
      fecha,
      hora: newHora,
      estado: 'RESCHEDULED',
      rescheduleToken: generateRescheduleToken(), // nuevo token tras reagendar
      reminder5dSentAt: null,
      reminder1dSentAt: null,
      reminder5hSentAt: null,
      patientConfirmedAt: null,
    },
  });

  // Notificar a audiologa y admin
  const emailService = require('./email.service');
  const config = require('../config');
  const recipients = [config.retail.professionalEmail, config.admin.email].filter(Boolean);
  for (const to of new Set(recipients)) {
    emailService.sendRescheduledNotification({
      to,
      patientName: apt.patientName,
      oldFecha: apt.fecha.toISOString().slice(0, 10),
      oldHora: apt.hora,
      newFecha: dateStr,
      newHora,
    }).catch((e) => console.error('[email] reagendamiento notif:', e?.message));
  }

  return updated;
};

/** Procesar recordatorios pendientes (llamado por cron externo) */
const processReminders = async () => {
  const now = new Date();
  const emailService = require('./email.service');
  const SITE_URL = 'https://oirconecta.com';
  let sent = 0;

  const upcoming = await prisma.appointment.findMany({
    where: {
      estado: { in: ['CONFIRMED', 'RESCHEDULED'] },
      fecha: { gte: new Date(now.getTime() - 60 * 60 * 1000) }, // desde hace 1h
    },
  });

  for (const apt of upcoming) {
    if (!apt.patientEmail) continue;

    const aptDateTime = new Date(apt.fecha);
    const [h, min] = (apt.hora || '00:00').split(':').map(Number);
    aptDateTime.setHours(h, min, 0, 0);

    const diffMs = aptDateTime.getTime() - now.getTime();
    const diffH = diffMs / (1000 * 60 * 60);
    const diffD = diffH / 24;

    const confirmUrl = `${SITE_URL}/agendar/confirmar?token=${apt.rescheduleToken}`;
    const rescheduleUrl = `${SITE_URL}/agendar/reagendar?token=${apt.rescheduleToken}`;
    const baseData = { email: apt.patientEmail, nombre: apt.patientName, fecha: apt.fecha.toISOString().slice(0, 10), hora: apt.hora, confirmUrl, rescheduleUrl };

    // 5 días antes (entre 5d+2h y 5d-2h)
    if (!apt.reminder5dSentAt && diffD >= 4.9 && diffD <= 5.1) {
      await emailService.sendAppointmentReminder({ ...baseData, tipo: '5d' }).catch(() => {});
      await prisma.appointment.update({ where: { id: apt.id }, data: { reminder5dSentAt: now } });
      sent++;
    }

    // 1 día antes (entre 26h y 22h)
    if (!apt.reminder1dSentAt && diffH >= 22 && diffH <= 26) {
      await emailService.sendAppointmentReminder({ ...baseData, tipo: '1d' }).catch(() => {});
      await prisma.appointment.update({ where: { id: apt.id }, data: { reminder1dSentAt: now } });
      sent++;
    }

    // 5 horas antes (entre 5.5h y 4.5h)
    if (!apt.reminder5hSentAt && diffH >= 4.5 && diffH <= 5.5) {
      await emailService.sendAppointmentReminder({ ...baseData, tipo: '5h' }).catch(() => {});
      await prisma.appointment.update({ where: { id: apt.id }, data: { reminder5hSentAt: now } });
      sent++;
    }
  }

  return { processed: upcoming.length, sent };
};

module.exports = {
  getAll,
  getStats,
  getAvailableSlots,
  getById,
  getByRescheduleToken,
  create,
  update,
  updateStatus,
  cancel,
  confirmByToken,
  rescheduleByToken,
  processReminders,
  isNonWorkingDay,
};
