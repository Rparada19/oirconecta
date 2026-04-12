/**
 * Servicio de mantenimientos (backend).
 * Resuelve paciente por email y persiste en PostgreSQL.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Formatea fecha DateTime a YYYY-MM-DD para el frontend
 */
const toDateOnly = (d) => (d ? (typeof d === 'string' ? d.slice(0, 10) : d.toISOString().slice(0, 10)) : null);

/**
 * Mapea registro de BD al formato esperado por el frontend
 */
const toFrontend = (m) => {
  if (!m) return null;
  return {
    id: m.id,
    patientEmail: m.patient?.email ?? null,
    type: m.type,
    productId: m.productId ?? null,
    scheduledDate: toDateOnly(m.scheduledDate) || m.scheduledDate,
    scheduledTime: m.scheduledTime ?? null,
    completedDate: m.completedDate ? toDateOnly(m.completedDate) : null,
    completedTime: m.completedTime ?? null,
    status: m.status ?? 'en_proceso',
    description: m.description ?? '',
    workPerformed: m.workPerformed ?? '',
    cost: Number(m.cost) ?? 0,
    notes: m.notes ?? '',
    nextMaintenanceDate: m.nextMaintenanceDate ? toDateOnly(m.nextMaintenanceDate) : null,
    relatedAppointmentId: m.relatedAppointmentId ?? null,
    processSteps: Array.isArray(m.processSteps) ? m.processSteps : (m.processSteps ? JSON.parse(JSON.stringify(m.processSteps)) : []),
    metadata: m.metadata && typeof m.metadata === 'object' ? m.metadata : {},
    createdAt: m.createdAt?.toISOString?.() ?? m.createdAt,
    updatedAt: m.updatedAt?.toISOString?.() ?? m.updatedAt,
  };
};

/**
 * Obtiene paciente por email. Lanza si no existe.
 */
const getPatientByEmail = async (email) => {
  const patient = await prisma.patient.findUnique({
    where: { email: (email || '').trim().toLowerCase() },
  });
  if (!patient) return null;
  return patient;
};

/**
 * Listar mantenimientos de un paciente por email
 */
const listByPatientEmail = async (patientEmail) => {
  const patient = await getPatientByEmail(patientEmail);
  if (!patient) return [];

  const list = await prisma.maintenance.findMany({
    where: { patientId: patient.id },
    orderBy: { scheduledDate: 'desc' },
  });
  return list.map(toFrontend);
};

/**
 * Crear mantenimiento (patientEmail en body)
 */
const create = async (body) => {
  const {
    patientEmail,
    type,
    productId,
    scheduledDate,
    scheduledTime,
    completedDate,
    completedTime,
    status,
    description,
    workPerformed,
    cost,
    notes,
    nextMaintenanceDate,
    relatedAppointmentId,
    processSteps,
    metadata,
  } = body;

  const patient = await getPatientByEmail(patientEmail);
  if (!patient) return { success: false, maintenance: null, error: 'Paciente no encontrado con ese email' };

  if (!type || !scheduledDate) {
    return { success: false, maintenance: null, error: 'Tipo y fecha programada son obligatorios' };
  }

  const scheduled = new Date(scheduledDate);
  if (isNaN(scheduled.getTime())) {
    return { success: false, maintenance: null, error: 'Fecha programada inválida' };
  }

  const payload = {
    patientId: patient.id,
    type: String(type).trim(),
    productId: productId || null,
    scheduledDate: scheduled,
    scheduledTime: scheduledTime || null,
    completedDate: completedDate ? new Date(completedDate) : null,
    completedTime: completedTime || null,
    status: (status || 'en_proceso').trim(),
    description: description || null,
    workPerformed: workPerformed || null,
    cost: Number(cost) || 0,
    notes: notes || null,
    nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
    relatedAppointmentId: relatedAppointmentId || null,
    processSteps: Array.isArray(processSteps) ? processSteps : [],
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
  };

  const created = await prisma.maintenance.create({
    data: payload,
    include: { patient: true },
  });
  return { success: true, maintenance: toFrontend(created), error: null };
};

/**
 * Actualizar mantenimiento (por id). Acepta addProcessStep: { action, note }
 */
const update = async (id, body) => {
  const existing = await prisma.maintenance.findUnique({
    where: { id },
    include: { patient: true },
  });
  if (!existing) return { success: false, maintenance: null, error: 'Mantenimiento no encontrado' };

  const { addProcessStep, processSteps: updatesProcessSteps, ...rest } = body;
  const nextProcessSteps = updatesProcessSteps !== undefined
    ? updatesProcessSteps
    : addProcessStep
      ? [...(Array.isArray(existing.processSteps) ? existing.processSteps : []), {
          date: new Date().toISOString(),
          action: addProcessStep.action || '',
          note: addProcessStep.note || '',
        }]
      : existing.processSteps;

  const data = {};
  if (rest.type !== undefined) data.type = rest.type;
  if (rest.productId !== undefined) data.productId = rest.productId;
  if (rest.scheduledDate !== undefined) data.scheduledDate = new Date(rest.scheduledDate);
  if (rest.scheduledTime !== undefined) data.scheduledTime = rest.scheduledTime;
  if (rest.completedDate !== undefined) data.completedDate = rest.completedDate ? new Date(rest.completedDate) : null;
  if (rest.completedTime !== undefined) data.completedTime = rest.completedTime;
  if (rest.status !== undefined) data.status = rest.status;
  if (rest.description !== undefined) data.description = rest.description;
  if (rest.workPerformed !== undefined) data.workPerformed = rest.workPerformed;
  if (rest.cost !== undefined) data.cost = Number(rest.cost);
  if (rest.notes !== undefined) data.notes = rest.notes;
  if (rest.nextMaintenanceDate !== undefined) data.nextMaintenanceDate = rest.nextMaintenanceDate ? new Date(rest.nextMaintenanceDate) : null;
  if (rest.relatedAppointmentId !== undefined) data.relatedAppointmentId = rest.relatedAppointmentId;
  data.processSteps = nextProcessSteps;
  if (rest.metadata !== undefined) data.metadata = rest.metadata;

  const updated = await prisma.maintenance.update({
    where: { id },
    data,
    include: { patient: true },
  });
  return { success: true, maintenance: toFrontend(updated), error: null };
};

/**
 * Eliminar mantenimiento
 */
const remove = async (id) => {
  const existing = await prisma.maintenance.findUnique({ where: { id } });
  if (!existing) return { success: false, error: 'Mantenimiento no encontrado' };
  await prisma.maintenance.delete({ where: { id } });
  return { success: true, error: null };
};

const isProcessClosed = (m) => {
  const steps = m.processSteps;
  if (!steps || !Array.isArray(steps)) return false;
  return steps.some((s) => s && s.action === 'entregado_paciente');
};

/**
 * Próximos mantenimientos (por patientEmail opcional, días hacia adelante).
 * Incluye en_proceso, scheduled, rescheduled y enviado_a_garantia/revision no cerrados.
 */
const getUpcoming = async (patientEmail = null, daysAhead = 30) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = new Date(today);
  future.setDate(future.getDate() + daysAhead);

  const where = {
    scheduledDate: { gte: today, lte: future },
  };
  if (patientEmail) {
    const patient = await getPatientByEmail(patientEmail);
    if (!patient) return [];
    where.patientId = patient.id;
  }

  const list = await prisma.maintenance.findMany({
    where,
    include: { patient: true },
    orderBy: { scheduledDate: 'asc' },
  });

  const pending = list.filter((m) => {
    const s = m.status || '';
    if (['en_proceso', 'scheduled', 'rescheduled'].includes(s)) return true;
    if (['enviado_a_garantia', 'enviado_a_revision'].includes(s) && !isProcessClosed(m)) return true;
    return false;
  });
  return pending.map(toFrontend);
};

module.exports = {
  listByPatientEmail,
  create,
  update,
  remove,
  getUpcoming,
};
