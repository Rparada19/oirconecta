/**
 * F2.3 — Reserva pública desde el perfil del profesional.
 *
 * Dos responsabilidades:
 *  1. Calcular slots disponibles para un profesional y una fecha (o rango),
 *     combinando ProfessionalScheduleConfig + ProfessionalAvailability +
 *     ProfessionalBlock + Appointments existentes.
 *  2. Crear una cita pública (paciente del directorio): valida slot, hace
 *     find-or-create del Patient (por documento o email) y del
 *     PatientProfessionalRelation, y delega en appointments.service.create
 *     para reusar notificaciones/email/rescheduleToken.
 *
 * Convenciones de tiempo:
 *  - Todas las horas (config.startTime/endTime, slot, hora de cita) son
 *    strings "HH:MM" en la zona horaria del profesional.
 *  - La fecha del slot es "YYYY-MM-DD" interpretada en la TZ del profesional.
 *  - Para queries de citas existentes usamos un rango UTC que cubre el día
 *    local con margen, y filtramos en JS por igualdad de fecha local.
 */

const { PrismaClient } = require('@prisma/client');
const subService = require('./subscription.service');
const appointmentsService = require('./appointments.service');

const prisma = new PrismaClient();

class BookingError extends Error {
  constructor(message, { status = 400, code } = {}) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function toMin(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** "2026-07-01" → Date (medianoche UTC). Sirve para indexar en Appointment.fecha. */
function dayStartUTC(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function addDaysStr(yyyyMmDd, n) {
  const d = dayStartUTC(yyyyMmDd);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Devuelve el día de semana (0=domingo..6=sábado) interpretando la fecha
 * "YYYY-MM-DD" como local en la TZ dada.
 */
function dayOfWeekInTz(yyyyMmDd, timezone) {
  // Construye un Date que represente medianoche local en esa TZ. Truco:
  // formatear el día con Intl y mapear.
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  // Usamos UTC noon para evitar saltos de día por DST (Colombia no aplica DST).
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: timezone })
    .format(probe);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? 0;
}

/** "HH:MM local" + minutos → "HH:MM local". Sin manejo de cruce de día. */
function addMinutesHHMM(hhmm, mins) {
  return toHHMM(toMin(hhmm) + mins);
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

/** Carga el contexto del profesional (config + perfil) y valida feature agenda. */
async function loadContext(profileId) {
  const profile = await prisma.directoryProfile.findUnique({
    where: { id: profileId },
    select: { id: true, status: true, nombreConsultorio: true, account: { select: { nombre: true, email: true } } },
  });
  if (!profile) throw new BookingError('Profesional no encontrado', { status: 404 });
  if (profile.status !== 'APPROVED') {
    throw new BookingError('Perfil no disponible para reservas', { status: 403, code: 'PROFILE_NOT_APPROVED' });
  }
  await subService.ensurePlans(); // garantiza filas Plan
  const sub = await prisma.subscription.findUnique({
    where: { profileId },
    include: { plan: true },
  });
  if (!sub || !subService.hasFeature(sub, subService.FEATURES.AGENDA)) {
    throw new BookingError('Este profesional no tiene agenda en línea activa.', { status: 402, code: 'AGENDA_NOT_INCLUDED' });
  }
  let config = await prisma.professionalScheduleConfig.findUnique({ where: { profileId } });
  if (!config) {
    // Defaults razonables; el profesional debe configurar para realmente recibir reservas.
    config = { defaultSlotMinutes: 30, bufferMinutes: 0, bookingWindowDays: 60,
               minNoticeHours: 2, autoConfirm: true, timezone: 'America/Bogota', agendaActiva: false };
  }
  if (!config.agendaActiva) {
    throw new BookingError('La agenda en línea está pausada por el profesional.', { status: 409, code: 'AGENDA_PAUSED' });
  }
  return { profile, subscription: sub, config };
}

// ─────────────────────────────────────────────────────────────
// Tipos de consulta (público; solo activos)
// ─────────────────────────────────────────────────────────────

async function publicListTypes(profileId) {
  await loadContext(profileId); // valida feature + agendaActiva
  const types = await prisma.appointmentType.findMany({
    where: { profileId, activo: true },
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    select: { id: true, nombre: true, descripcion: true, durationMinutes: true, priceCOP: true, color: true },
  });
  return types;
}

// ─────────────────────────────────────────────────────────────
// Cálculo de slots disponibles
// ─────────────────────────────────────────────────────────────

/**
 * Devuelve [{ time: 'HH:MM', endTime: 'HH:MM' }] para una fecha local en la TZ
 * del profesional, considerando availability semanal, bloques, citas existentes,
 * buffer entre citas y minNoticeHours.
 */
async function computeSlotsForDay(profileId, yyyyMmDd, { appointmentTypeId } = {}) {
  const { config } = await loadContext(profileId);

  // 1) Determina duración del slot
  let durationMinutes = config.defaultSlotMinutes;
  if (appointmentTypeId) {
    const type = await prisma.appointmentType.findUnique({ where: { id: appointmentTypeId } });
    if (!type || type.profileId !== profileId || !type.activo) {
      throw new BookingError('Tipo de consulta inválido', { status: 400 });
    }
    durationMinutes = type.durationMinutes;
  }

  // 2) Validación de ventana de reserva (booking window + min notice)
  const todayLocalStr = new Date().toLocaleString('en-CA', { timeZone: config.timezone })
    .slice(0, 10); // YYYY-MM-DD en TZ profesional
  const daysAhead = Math.round((dayStartUTC(yyyyMmDd) - dayStartUTC(todayLocalStr)) / 86400000);
  if (daysAhead < 0) return { fecha: yyyyMmDd, slots: [], reason: 'PAST' };
  if (daysAhead > config.bookingWindowDays) return { fecha: yyyyMmDd, slots: [], reason: 'OUT_OF_WINDOW' };

  // 3) Availability del día de semana
  const dow = dayOfWeekInTz(yyyyMmDd, config.timezone);
  const windows = await prisma.professionalAvailability.findMany({
    where: { profileId, dayOfWeek: dow, active: true },
    orderBy: { startTime: 'asc' },
  });
  if (windows.length === 0) return { fecha: yyyyMmDd, slots: [], reason: 'DAY_OFF' };

  // 4) Bloques que tocan el día (rango UTC amplio para cubrir TZ)
  const dayStart = dayStartUTC(yyyyMmDd);
  const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const blocks = await prisma.professionalBlock.findMany({
    where: {
      profileId,
      AND: [{ endAt: { gte: dayStart } }, { startAt: { lt: dayEnd } }],
    },
  });

  // 5) Citas existentes del profesional ese día
  const apptsRaw = await prisma.appointment.findMany({
    where: {
      directoryProfileId: profileId,
      fecha: { gte: dayStart, lt: dayEnd },
      estado: { notIn: ['CANCELLED'] },
    },
    select: { hora: true, durationMinutes: true },
  });
  const apptsMins = apptsRaw.map((a) => {
    const s = toMin(a.hora || '00:00');
    const dur = a.durationMinutes || config.defaultSlotMinutes;
    return [s, s + dur];
  });

  // 6) "Ahora" en TZ profesional → minutos del día si es hoy
  const isToday = (yyyyMmDd === todayLocalStr);
  let earliestMin = -Infinity;
  if (isToday) {
    const nowLocal = new Date().toLocaleString('en-US', { timeZone: config.timezone, hour12: false });
    // nowLocal ej: "6/29/2026, 18:30:00"
    const timePart = nowLocal.split(', ')[1] || '00:00:00';
    const [h, m] = timePart.split(':').map(Number);
    earliestMin = h * 60 + m + (config.minNoticeHours * 60);
  }

  // 7) Genera slots iterando ventanas
  const step = durationMinutes + config.bufferMinutes; // cadencia entre inicios
  const slots = [];
  for (const w of windows) {
    let cursor = toMin(w.startTime);
    const wEnd = toMin(w.endTime);
    while (cursor + durationMinutes <= wEnd) {
      const slotStart = cursor;
      const slotEnd = cursor + durationMinutes;
      cursor += step;

      if (slotStart < earliestMin) continue;

      // Conflicto con cita existente
      const hitsAppt = apptsMins.some(([s, e]) => overlaps(slotStart, slotEnd, s, e));
      if (hitsAppt) continue;

      // Conflicto con bloque (interpretamos startAt/endAt en TZ profesional)
      const hitsBlock = blocks.some((b) => {
        if (b.allDay) return true;
        const bStartLocal = new Date(b.startAt).toLocaleString('en-US', { timeZone: config.timezone, hour12: false });
        const bEndLocal   = new Date(b.endAt).toLocaleString('en-US', { timeZone: config.timezone, hour12: false });
        const bDateStart  = new Date(b.startAt).toLocaleString('en-CA', { timeZone: config.timezone }).slice(0, 10);
        const bDateEnd    = new Date(b.endAt).toLocaleString('en-CA', { timeZone: config.timezone }).slice(0, 10);
        // Día completo dentro del rango del bloque
        if (yyyyMmDd > bDateStart && yyyyMmDd < bDateEnd) return true;
        let bStart = 0, bEnd = 24 * 60;
        if (yyyyMmDd === bDateStart) {
          const t = bStartLocal.split(', ')[1] || '00:00:00';
          const [h, m] = t.split(':').map(Number);
          bStart = h * 60 + m;
        }
        if (yyyyMmDd === bDateEnd) {
          const t = bEndLocal.split(', ')[1] || '00:00:00';
          const [h, m] = t.split(':').map(Number);
          bEnd = h * 60 + m;
        }
        return overlaps(slotStart, slotEnd, bStart, bEnd);
      });
      if (hitsBlock) continue;

      slots.push({ time: toHHMM(slotStart), endTime: toHHMM(slotEnd) });
    }
  }

  return { fecha: yyyyMmDd, durationMinutes, slots };
}

async function computeSlotsForRange(profileId, fromYmd, toYmd, opts = {}) {
  if (!fromYmd || !toYmd) throw new BookingError('from y to requeridos (YYYY-MM-DD)');
  if (fromYmd > toYmd) throw new BookingError('from debe ser <= to');
  const maxDays = 60;
  let days = 0;
  let cursor = fromYmd;
  const out = [];
  while (cursor <= toYmd && days < maxDays) {
    out.push(await computeSlotsForDay(profileId, cursor, opts));
    cursor = addDaysStr(cursor, 1);
    days++;
  }
  return { from: fromYmd, to: toYmd, days: out };
}

// ─────────────────────────────────────────────────────────────
// Creación de cita pública
// ─────────────────────────────────────────────────────────────

function normPhone(p) {
  return String(p || '').replace(/\s+/g, '').trim();
}

function normEmail(e) {
  return e ? String(e).trim().toLowerCase() : null;
}

/**
 * Find-or-create Patient por (tipoDocumento, numeroDocumento) si vienen,
 * sino por email (si viene), sino crea uno nuevo. Idempotente para evitar
 * que el mismo paciente reservando 2 veces aparezca duplicado.
 */
async function findOrCreatePatient({ nombre, telefono, email, tipoDocumento, numeroDocumento, referredByCode = null }) {
  if (!nombre || !telefono) throw new BookingError('nombre y telefono requeridos');
  const emailNorm = normEmail(email);
  const tel = normPhone(telefono);

  if (tipoDocumento && numeroDocumento) {
    const existing = await prisma.patient.findFirst({
      where: { tipoDocumento, numeroDocumento },
    });
    if (existing) return existing;
  }
  if (emailNorm) {
    const byEmail = await prisma.patient.findFirst({ where: { email: emailNorm } });
    if (byEmail) return byEmail;
  }

  // T2-Gap4 — solo aplica al Patient nuevo. Validamos que el código exista y
  // no permitimos auto-referencia (mismo email que dueño del código).
  let referredByNormalized = null;
  if (referredByCode) {
    const normalized = String(referredByCode).trim().toUpperCase();
    if (normalized) {
      const owner = await prisma.patient.findFirst({
        where: { referralCode: normalized, archivedAt: null },
        select: { id: true, email: true },
      });
      if (owner && (!emailNorm || owner.email !== emailNorm)) {
        referredByNormalized = normalized;
      }
    }
  }

  return prisma.patient.create({
    data: {
      nombre: String(nombre).trim(),
      telefono: tel,
      email: emailNorm,
      tipoDocumento: tipoDocumento || null,
      numeroDocumento: numeroDocumento || null,
      procedencia: 'directorio-publico',
      referredByCode: referredByNormalized,
    },
  });
}

/**
 * Garantiza la relación N-N paciente↔profesional. La unicidad la enforce
 * el índice @@unique([patientId, profileId]) del schema.
 */
async function ensureRelation(patientId, profileId) {
  try {
    return await prisma.patientProfessionalRelation.upsert({
      where: { patientId_profileId: { patientId, profileId } },
      update: {},
      create: { patientId, profileId },
    });
  } catch (e) {
    // Si la BD no tiene aún la tabla (migración pendiente), no rompemos la reserva.
    console.warn('[booking] ensureRelation falló (no bloqueante):', e.message);
    return null;
  }
}

/**
 * Crea la cita pública. Re-valida el slot dentro de una transacción ligera
 * (find de conflictos + create) para reducir double-booking en condiciones
 * de carrera. No es 100% atómico contra escrituras paralelas, pero mitiga
 * el caso común.
 */
async function createPublicAppointment(profileId, payload) {
  const ctx = await loadContext(profileId);
  const { appointmentTypeId, scheduledAt, notas, patient, referredByCode } = payload || {};
  if (!appointmentTypeId) throw new BookingError('appointmentTypeId requerido');
  if (!scheduledAt) throw new BookingError('scheduledAt requerido (ISO local o "YYYY-MM-DD HH:MM")');

  const type = await prisma.appointmentType.findUnique({ where: { id: appointmentTypeId } });
  if (!type || type.profileId !== profileId || !type.activo) {
    throw new BookingError('Tipo de consulta inválido', { status: 400 });
  }

  // Parse scheduledAt como local profesional: aceptamos "YYYY-MM-DDTHH:MM" o "YYYY-MM-DD HH:MM"
  const m = String(scheduledAt).match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (!m) throw new BookingError('scheduledAt debe ser YYYY-MM-DDTHH:MM');
  const [, dateStr, timeStr] = m;

  // Re-cálculo de slots para esa fecha y verificación de que el horario esté disponible
  const { slots } = await computeSlotsForDay(profileId, dateStr, { appointmentTypeId });
  const hit = slots.find((s) => s.time === timeStr);
  if (!hit) {
    throw new BookingError('El horario ya no está disponible. Elige otro slot.', {
      status: 409, code: 'SLOT_TAKEN',
    });
  }

  // Find-or-create patient + relación
  const patientRow = await findOrCreatePatient({ ...(patient || {}), referredByCode });
  await ensureRelation(patientRow.id, profileId);

  // Delegamos en appointments.service.create para reutilizar email/notifications/token.
  // createdById null → cita creada por flujo público.
  const appt = await appointmentsService.create({
    fecha: dateStr,           // service hace setHours(0,0,0,0)
    hora: timeStr,
    motivo: notas || `Reserva pública: ${type.nombre}`,
    procedencia: 'directorio-publico',
    tipoConsulta: type.nombre,
    durationMinutes: type.durationMinutes,
    directoryProfileId: profileId,
    professionalNotifyEmail: ctx.profile.account?.email || null,
    professionalDisplayName: ctx.profile.nombreConsultorio || ctx.profile.account?.nombre || null,
    patientId: patientRow.id,
    patientName: patientRow.nombre,
    patientEmail: patientRow.email,
    patientPhone: patientRow.telefono,
    notas: notas || null,
  }, null);

  return {
    id: appt.id,
    fecha: appt.fecha,
    hora: appt.hora,
    durationMinutes: appt.durationMinutes,
    estado: appt.estado,
    rescheduleToken: appt.rescheduleToken,
    professionalNombre: ctx.profile.account?.nombre || null,
  };
}

module.exports = {
  BookingError,
  loadContext,
  publicListTypes,
  computeSlotsForDay,
  computeSlotsForRange,
  findOrCreatePatient,
  ensureRelation,
  createPublicAppointment,
};
