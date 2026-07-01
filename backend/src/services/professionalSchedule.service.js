/**
 * F2 — Agenda multi-tenant: CRUD por profesional del directorio.
 *
 * Aislamiento: TODA query DEBE filtrar por `profileId`. Los handlers de routes
 * obtienen el profileId desde el JWT del DirectoryAccount, nunca del request body.
 *
 * Feature gate: el plan del profesional debe incluir `agenda` (Plan 2+).
 * Use `assertAgendaFeature(profileId)` antes de cualquier mutación.
 */

const { PrismaClient } = require('@prisma/client');
const subService = require('./subscription.service');

const prisma = new PrismaClient();

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TIPOS_BLOQUEO = ['VACACIONES', 'ENFERMEDAD', 'PERSONAL', 'FERIADO', 'OTRO'];

function validHHMM(s) {
  return typeof s === 'string' && TIME_RE.test(s);
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

class AgendaError extends Error {
  constructor(message, { status = 400, code } = {}) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/**
 * Lanza si la suscripción del profesional NO incluye la feature `agenda`.
 * Devuelve { subscription, features } para reutilizar.
 */
async function assertAgendaFeature(profileId) {
  const sub = await prisma.subscription.findUnique({
    where: { profileId },
    include: { plan: true },
  });
  if (!sub) {
    throw new AgendaError('Sin suscripción activa', { status: 402, code: 'NO_SUBSCRIPTION' });
  }
  if (!subService.hasFeature(sub, subService.FEATURES.AGENDA)) {
    throw new AgendaError('El plan actual no incluye agenda. Actualiza al Plan 2 o Plan 3.', {
      status: 402, code: 'AGENDA_NOT_INCLUDED',
    });
  }
  return { subscription: sub, features: subService.getActiveFeatures(sub) };
}

// ─────────────────────────────────────────────────────────────
// ScheduleConfig (singleton por perfil)
// ─────────────────────────────────────────────────────────────

const CONFIG_DEFAULTS = {
  defaultSlotMinutes: 30,
  bufferMinutes: 0,
  bookingWindowDays: 60,
  minNoticeHours: 2,
  autoConfirm: true,
  timezone: 'America/Bogota',
  agendaActiva: false,
};

async function getConfig(profileId) {
  let cfg = await prisma.professionalScheduleConfig.findUnique({ where: { profileId } });
  if (!cfg) {
    cfg = await prisma.professionalScheduleConfig.create({
      data: { profileId, ...CONFIG_DEFAULTS },
    });
  }
  return cfg;
}

async function updateConfig(profileId, patch) {
  const allowed = ['defaultSlotMinutes', 'bufferMinutes', 'bookingWindowDays',
    'minNoticeHours', 'autoConfirm', 'timezone', 'agendaActiva'];
  const data = {};
  for (const k of allowed) if (patch[k] !== undefined) data[k] = patch[k];

  if (data.defaultSlotMinutes !== undefined && (data.defaultSlotMinutes < 5 || data.defaultSlotMinutes > 480)) {
    throw new AgendaError('defaultSlotMinutes debe estar entre 5 y 480');
  }
  if (data.bufferMinutes !== undefined && (data.bufferMinutes < 0 || data.bufferMinutes > 240)) {
    throw new AgendaError('bufferMinutes debe estar entre 0 y 240');
  }
  if (data.bookingWindowDays !== undefined && (data.bookingWindowDays < 1 || data.bookingWindowDays > 365)) {
    throw new AgendaError('bookingWindowDays debe estar entre 1 y 365');
  }
  if (data.minNoticeHours !== undefined && (data.minNoticeHours < 0 || data.minNoticeHours > 720)) {
    throw new AgendaError('minNoticeHours debe estar entre 0 y 720');
  }

  await getConfig(profileId); // garantiza existencia
  return prisma.professionalScheduleConfig.update({ where: { profileId }, data });
}

// ─────────────────────────────────────────────────────────────
// AppointmentType
// ─────────────────────────────────────────────────────────────

async function listAppointmentTypes(profileId, { includeInactive = false } = {}) {
  const where = { profileId };
  if (!includeInactive) where.activo = true;
  return prisma.appointmentType.findMany({
    where,
    orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
  });
}

async function createAppointmentType(profileId, payload) {
  const { nombre, descripcion, durationMinutes = 30, priceCOP, color, orden = 0 } = payload || {};
  if (!nombre || typeof nombre !== 'string') throw new AgendaError('nombre requerido');
  if (durationMinutes < 5 || durationMinutes > 480) throw new AgendaError('durationMinutes 5..480');
  if (priceCOP !== undefined && priceCOP !== null && (priceCOP < 0 || !Number.isInteger(priceCOP))) {
    throw new AgendaError('priceCOP debe ser entero >= 0');
  }
  return prisma.appointmentType.create({
    data: { profileId, nombre, descripcion: descripcion ?? null, durationMinutes,
            priceCOP: priceCOP ?? null, color: color ?? null, orden, activo: true },
  });
}

async function updateAppointmentType(profileId, id, patch) {
  // Verifica pertenencia antes de mutar (aislamiento)
  const existing = await prisma.appointmentType.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) {
    throw new AgendaError('Tipo de consulta no encontrado', { status: 404 });
  }
  const data = {};
  const allowed = ['nombre', 'descripcion', 'durationMinutes', 'priceCOP', 'color', 'orden', 'activo'];
  for (const k of allowed) if (patch[k] !== undefined) data[k] = patch[k];
  if (data.durationMinutes !== undefined && (data.durationMinutes < 5 || data.durationMinutes > 480)) {
    throw new AgendaError('durationMinutes 5..480');
  }
  return prisma.appointmentType.update({ where: { id }, data });
}

async function deleteAppointmentType(profileId, id) {
  const existing = await prisma.appointmentType.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) {
    throw new AgendaError('Tipo de consulta no encontrado', { status: 404 });
  }
  // Soft delete: marcar inactivo. Borrar duro rompería históricos de citas que lo referencien.
  return prisma.appointmentType.update({ where: { id }, data: { activo: false } });
}

// ─────────────────────────────────────────────────────────────
// ProfessionalAvailability (horario semanal)
// ─────────────────────────────────────────────────────────────

async function listAvailability(profileId) {
  return prisma.professionalAvailability.findMany({
    where: { profileId },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

function validateAvailabilityRow({ dayOfWeek, startTime, endTime }) {
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new AgendaError('dayOfWeek debe ser 0..6');
  }
  if (!validHHMM(startTime) || !validHHMM(endTime)) {
    throw new AgendaError('startTime/endTime deben tener formato HH:MM');
  }
  if (toMinutes(endTime) <= toMinutes(startTime)) {
    throw new AgendaError('endTime debe ser posterior a startTime');
  }
}

async function createAvailability(profileId, payload) {
  const { dayOfWeek, startTime, endTime, active = true } = payload || {};
  validateAvailabilityRow({ dayOfWeek, startTime, endTime });
  return prisma.professionalAvailability.create({
    data: { profileId, dayOfWeek, startTime, endTime, active },
  });
}

async function updateAvailability(profileId, id, patch) {
  const existing = await prisma.professionalAvailability.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) {
    throw new AgendaError('Franja no encontrada', { status: 404 });
  }
  const merged = { ...existing, ...patch };
  validateAvailabilityRow(merged);
  const allowed = ['dayOfWeek', 'startTime', 'endTime', 'active'];
  const data = {};
  for (const k of allowed) if (patch[k] !== undefined) data[k] = patch[k];
  return prisma.professionalAvailability.update({ where: { id }, data });
}

async function deleteAvailability(profileId, id) {
  const existing = await prisma.professionalAvailability.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) {
    throw new AgendaError('Franja no encontrada', { status: 404 });
  }
  await prisma.professionalAvailability.delete({ where: { id } });
  return { deleted: true };
}

/**
 * Reemplazo atómico del horario semanal completo. Útil para UI tipo grilla
 * donde el usuario edita toda la semana y guarda una vez.
 */
async function replaceWeeklyAvailability(profileId, rows) {
  if (!Array.isArray(rows)) throw new AgendaError('rows debe ser array');
  for (const r of rows) validateAvailabilityRow(r);
  return prisma.$transaction(async (tx) => {
    await tx.professionalAvailability.deleteMany({ where: { profileId } });
    if (rows.length === 0) return { count: 0 };
    await tx.professionalAvailability.createMany({
      data: rows.map((r) => ({
        profileId,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        active: r.active !== false,
      })),
    });
    return { count: rows.length };
  });
}

// ─────────────────────────────────────────────────────────────
// ProfessionalBlock (bloqueos, vacaciones)
// ─────────────────────────────────────────────────────────────

async function listBlocks(profileId, { from, to } = {}) {
  const where = { profileId };
  if (from || to) {
    where.AND = [];
    if (from) where.AND.push({ endAt: { gte: new Date(from) } });
    if (to)   where.AND.push({ startAt: { lte: new Date(to) } });
  }
  return prisma.professionalBlock.findMany({ where, orderBy: { startAt: 'asc' } });
}

function validateBlockPayload({ startAt, endAt, allDay, tipo }) {
  const s = new Date(startAt);
  const e = new Date(endAt);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) throw new AgendaError('startAt/endAt inválidos');
  if (e <= s) throw new AgendaError('endAt debe ser posterior a startAt');
  if (tipo && !TIPOS_BLOQUEO.includes(tipo)) {
    throw new AgendaError(`tipo debe ser uno de: ${TIPOS_BLOQUEO.join(', ')}`);
  }
  return { startAt: s, endAt: e, allDay: !!allDay };
}

async function createBlock(profileId, payload) {
  const { motivo, tipo } = payload || {};
  const v = validateBlockPayload(payload || {});
  return prisma.professionalBlock.create({
    data: { profileId, motivo: motivo ?? null, tipo: tipo ?? null, ...v },
  });
}

async function updateBlock(profileId, id, patch) {
  const existing = await prisma.professionalBlock.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) {
    throw new AgendaError('Bloqueo no encontrado', { status: 404 });
  }
  const merged = { ...existing, ...patch };
  const v = validateBlockPayload(merged);
  const data = { ...v };
  if (patch.motivo !== undefined) data.motivo = patch.motivo;
  if (patch.tipo !== undefined) data.tipo = patch.tipo;
  return prisma.professionalBlock.update({ where: { id }, data });
}

async function deleteBlock(profileId, id) {
  const existing = await prisma.professionalBlock.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profileId) {
    throw new AgendaError('Bloqueo no encontrado', { status: 404 });
  }
  await prisma.professionalBlock.delete({ where: { id } });
  return { deleted: true };
}

// ─────────────────────────────────────────────────────────────
// Citas del profesional (lectura para "Próximas citas")
// ─────────────────────────────────────────────────────────────

/**
 * Devuelve las citas del profesional dentro del rango (default: hoy +30 días).
 * Filtros opcionales: from/to (YYYY-MM-DD), status (CONFIRMED|CANCELLED|...).
 */
async function listAppointments(profileId, { from, to, status, limit = 200 } = {}) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const defaultEnd = new Date(today); defaultEnd.setDate(defaultEnd.getDate() + 30);
  const fechaGte = from ? new Date(from) : today;
  const fechaLte = to ? new Date(to) : defaultEnd;
  fechaGte.setHours(0, 0, 0, 0);
  fechaLte.setHours(23, 59, 59, 999);

  const where = {
    directoryProfileId: profileId,
    fecha: { gte: fechaGte, lte: fechaLte },
  };
  if (status) where.estado = status;

  const items = await prisma.appointment.findMany({
    where,
    orderBy: [{ fecha: 'asc' }, { hora: 'asc' }],
    take: parseInt(limit),
    select: {
      id: true, fecha: true, hora: true, durationMinutes: true, estado: true,
      tipoConsulta: true, motivo: true, notas: true, procedencia: true,
      patientName: true, patientEmail: true, patientPhone: true,
      rescheduleToken: true, createdAt: true,
      patient: { select: { id: true, nombre: true, email: true, telefono: true, tipoDocumento: true, numeroDocumento: true } },
    },
  });

  // Stats rápidos para badge en UI (CONFIRMED + RESCHEDULED cuentan como próximas)
  const upcoming = items.filter((a) => ['CONFIRMED', 'RESCHEDULED'].includes(a.estado) && new Date(a.fecha) >= today).length;
  return { items, upcoming, total: items.length };
}

/**
 * Cambia el estado de una cita (CONFIRMED → CANCELLED|COMPLETED|NO_SHOW).
 * Multi-tenant safe: verifica que la cita pertenezca al directoryProfileId.
 */
async function updateAppointmentStatus(profileId, appointmentId, { estado, notas }) {
  const VALID = ['CONFIRMED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'];
  if (!VALID.includes(estado)) throw new AgendaError(`estado debe ser uno de: ${VALID.join(', ')}`);
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, directoryProfileId: true, notas: true, estado: true },
  });
  if (!appt || appt.directoryProfileId !== profileId) {
    throw new AgendaError('Cita no encontrada', { status: 404 });
  }
  const data = { estado };
  if (notas) data.notas = `${appt.notas || ''}\n${notas}`.trim();
  return prisma.appointment.update({ where: { id: appointmentId }, data });
}

/**
 * Cancelaciones por paciente pendientes de que el profesional haga llamada de seguimiento.
 * Solo cuenta las que canceló el paciente por link (cancelledByPatientAt != null) y
 * que aún no tienen followUpDoneAt.
 */
async function listCancellationsPending(profileId) {
  const items = await prisma.appointment.findMany({
    where: {
      directoryProfileId: profileId,
      estado: 'CANCELLED',
      cancelledByPatientAt: { not: null },
      followUpDoneAt: null,
    },
    orderBy: { cancelledByPatientAt: 'desc' },
    take: 100,
    select: {
      id: true, fecha: true, hora: true, tipoConsulta: true,
      patientName: true, patientEmail: true, patientPhone: true,
      cancelledByPatientAt: true, cancelReason: true,
    },
  });
  return { items, count: items.length };
}

/**
 * Marca la llamada de seguimiento como hecha para una cancelación puntual.
 * Multi-tenant safe.
 */
async function markFollowUpDone(profileId, appointmentId, { notes } = {}) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, directoryProfileId: true, followUpNotes: true },
  });
  if (!appt || appt.directoryProfileId !== profileId) {
    throw new AgendaError('Cita no encontrada', { status: 404 });
  }
  return prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      followUpDoneAt: new Date(),
      followUpNotes: notes ? String(notes).trim().slice(0, 1000) : null,
    },
    select: { id: true, followUpDoneAt: true, followUpNotes: true },
  });
}

module.exports = {
  AgendaError,
  TIPOS_BLOQUEO,
  assertAgendaFeature,
  listAppointments,
  updateAppointmentStatus,
  listCancellationsPending,
  markFollowUpDone,

  getConfig,
  updateConfig,

  listAppointmentTypes,
  createAppointmentType,
  updateAppointmentType,
  deleteAppointmentType,

  listAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  replaceWeeklyAvailability,

  listBlocks,
  createBlock,
  updateBlock,
  deleteBlock,
};
