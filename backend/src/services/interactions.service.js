/**
 * Servicio de interacciones CRM (llamadas, mensajes, correos, visitas, seguimiento consumibles)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const getPatientByEmail = async (email) => {
  if (!email || !String(email).trim()) return null;
  return prisma.patient.findUnique({
    where: { email: String(email).trim().toLowerCase() },
  });
};

const toFrontend = (i) => {
  if (!i) return null;
  return {
    id: i.id,
    patientEmail: i.patient?.email ?? null,
    type: i.type,
    channel: i.channel ?? null,
    title: i.title,
    description: i.description ?? '',
    status: i.status ?? 'completed',
    direction: i.direction ?? null,
    duration: i.duration ?? null,
    occurredAt: i.occurredAt?.toISOString?.() ?? i.occurredAt,
    scheduledDate: i.scheduledDate?.toISOString?.() ?? i.scheduledDate,
    scheduledTime: i.scheduledTime ?? null,
    relatedAppointmentId: i.relatedAppointmentId ?? null,
    relatedMaintenanceId: i.relatedMaintenanceId ?? null,
    metadata: i.metadata && typeof i.metadata === 'object' ? i.metadata : {},
    createdAt: i.createdAt?.toISOString?.() ?? i.createdAt,
    updatedAt: i.updatedAt?.toISOString?.() ?? i.updatedAt,
  };
};

/**
 * Listar interacciones de un paciente por email
 */
const listByPatientEmail = async (patientEmail) => {
  const patient = await getPatientByEmail(patientEmail);
  if (!patient) return [];
  const list = await prisma.interaction.findMany({
    where: { patientId: patient.id },
    orderBy: { occurredAt: 'desc' },
  });
  return list.map(toFrontend);
};

/**
 * Métricas CRM para un paciente: totales y últimas fechas por tipo
 */
const getMetricsByPatientEmail = async (patientEmail) => {
  const patient = await getPatientByEmail(patientEmail);
  if (!patient) return null;

  const interactions = await prisma.interaction.findMany({
    where: { patientId: patient.id },
    orderBy: { occurredAt: 'desc' },
  });

  const byType = (type) => interactions.filter((i) => i.type === type);
  const lastByType = (type) => {
    const list = byType(type);
    if (list.length === 0) return null;
    const d = list[0].occurredAt;
    return d ? new Date(d).toISOString() : null;
  };

  return {
    totalLlamadas: byType('call').length,
    totalMensajes: byType('message').length,
    totalCorreos: byType('email').length,
    totalVisitas: byType('visit').length,
    totalRecordatorios: byType('reminder').length,
    totalSeguimientoConsumibles: byType('follow_up_consumables').length,
    totalSeguimientoGarantias: byType('follow_up_garantia').length,
    ultimaLlamada: lastByType('call'),
    ultimoMensaje: lastByType('message'),
    ultimoCorreo: lastByType('email'),
    ultimaVisita: lastByType('visit'),
  };
};

/**
 * Crear interacción
 */
const create = async (body) => {
  const { patientEmail, type, channel, title, description, status, direction, duration, occurredAt, scheduledDate, scheduledTime, relatedAppointmentId, relatedMaintenanceId, metadata } = body;

  const patient = await getPatientByEmail(patientEmail);
  if (!patient) return { success: false, interaction: null, error: 'Paciente no encontrado con ese email' };
  if (!type || !title) return { success: false, interaction: null, error: 'Tipo y título son obligatorios' };

  const payload = {
    patientId: patient.id,
    type: String(type).trim(),
    channel: channel || null,
    title: String(title).trim(),
    description: description || null,
    status: status || 'completed',
    direction: direction || null,
    duration: duration != null ? parseInt(duration, 10) : null,
    occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
    scheduledTime: scheduledTime || null,
    relatedAppointmentId: relatedAppointmentId || null,
    relatedMaintenanceId: relatedMaintenanceId || null,
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
  };

  const created = await prisma.interaction.create({
    data: payload,
    include: { patient: true },
  });
  return { success: true, interaction: toFrontend(created), error: null };
};

/**
 * Obtener una interacción por ID
 */
const getById = async (id) => {
  const i = await prisma.interaction.findUnique({
    where: { id },
    include: { patient: true },
  });
  return i ? toFrontend(i) : null;
};

/**
 * Actualizar interacción
 */
const update = async (id, body) => {
  const existing = await prisma.interaction.findUnique({
    where: { id },
    include: { patient: true },
  });
  if (!existing) return { success: false, interaction: null, error: 'Interacción no encontrada' };

  const allowed = ['type', 'channel', 'title', 'description', 'status', 'direction', 'duration', 'occurredAt', 'scheduledDate', 'scheduledTime', 'relatedAppointmentId', 'relatedMaintenanceId', 'metadata'];
  const data = {};
  allowed.forEach((k) => {
    if (body[k] !== undefined) {
      if (k === 'occurredAt' || k === 'scheduledDate') data[k] = body[k] ? new Date(body[k]) : null;
      else if (k === 'duration') data[k] = body[k] != null ? parseInt(body[k], 10) : null;
      else data[k] = body[k];
    }
  });

  const updated = await prisma.interaction.update({
    where: { id },
    data,
    include: { patient: true },
  });
  return { success: true, interaction: toFrontend(updated), error: null };
};

/**
 * Eliminar interacción
 */
const remove = async (id) => {
  const existing = await prisma.interaction.findUnique({ where: { id } });
  if (!existing) return { success: false, error: 'Interacción no encontrada' };
  await prisma.interaction.delete({ where: { id } });
  return { success: true, error: null };
};

/**
 * Acciones del día: interacciones que requieren atención (consumibles con próx. recomendación vencida o próxima,
 * garantías en reclamación, recordatorios programados para hoy).
 * @param {Object} options - { daysAhead: number } para consumibles (días hacia adelante para "próximo")
 */
const getDailyActions = async (options = {}) => {
  const { daysAhead = 7, patientEmail: filterPatientEmail } = options;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = new Date(today);
  future.setDate(future.getDate() + (daysAhead || 0));
  future.setHours(23, 59, 59, 999);

  const list = await prisma.interaction.findMany({
    where: {
      type: { in: ['follow_up_consumables', 'follow_up_garantia', 'reminder'] },
      ...(filterPatientEmail && { patient: { email: String(filterPatientEmail).trim().toLowerCase() } }),
    },
    include: { patient: true },
    orderBy: { occurredAt: 'desc' },
  });

  const actions = [];
  for (const i of list) {
    const meta = i.metadata && typeof i.metadata === 'object' ? i.metadata : {};
    const patientEmail = i.patient?.email || null;
    const patientName = i.patient?.nombre || i.patient?.email || '';
    const patientPhone = i.patient?.telefono || null;

    if (i.type === 'follow_up_consumables') {
      const nextRec = meta.nextRecommendationDate;
      if (nextRec) {
        const d = new Date(nextRec);
        if (!Number.isNaN(d.getTime())) {
          d.setHours(0, 0, 0, 0);
          if (d <= future) {
            actions.push({
              id: i.id,
              type: 'consumibles',
              kind: d < today ? 'vencido' : 'proximo',
              dueDate: meta.nextRecommendationDate,
              title: i.title,
              description: i.description,
              patientId: i.patientId,
              patientEmail,
              patientName,
              patientPhone,
              responsibleName: meta.responsibleName || null,
              resolvedAt: meta.resolvedAt || null,
              comments: Array.isArray(meta.comments) ? meta.comments : [],
              metadata: { tipo: meta.tipo, cantidad: meta.cantidad },
            });
          }
        }
      } else {
        // Sin fecha de próxima recomendación: se cuenta como activa
        actions.push({
          id: i.id,
          type: 'consumibles',
          kind: 'activa',
          dueDate: null,
          title: i.title,
          description: i.description,
          patientId: i.patientId,
          patientEmail,
          patientName,
          patientPhone,
          responsibleName: meta.responsibleName || null,
          resolvedAt: meta.resolvedAt || null,
          comments: Array.isArray(meta.comments) ? meta.comments : [],
          metadata: { tipo: meta.tipo, cantidad: meta.cantidad },
        });
      }
    } else if (i.type === 'follow_up_garantia' && (meta.status === 'reclamacion' || meta.status === 'vencida')) {
      const actionDueDate = meta.warrantyEndDate ? new Date(meta.warrantyEndDate) : null;
      const dueValid = !actionDueDate || Number.isNaN(actionDueDate.getTime()) || actionDueDate <= future;
      if (dueValid) {
        actions.push({
          id: i.id,
          type: 'garantia',
          kind: meta.status === 'reclamacion' ? 'reclamacion' : 'vencida',
          dueDate: meta.warrantyEndDate || null,
          title: i.title,
          description: i.description,
          patientId: i.patientId,
          patientEmail,
          patientName,
          patientPhone,
          responsibleName: meta.responsibleName || null,
          resolvedAt: meta.resolvedAt || null,
          comments: Array.isArray(meta.comments) ? meta.comments : [],
          metadata: { productRef: meta.productRef, warrantyEndDate: meta.warrantyEndDate },
        });
      }
    } else if (i.type === 'reminder' && i.scheduledDate) {
      const d = new Date(i.scheduledDate);
      if (Number.isNaN(d.getTime())) continue;
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === today.getTime()) {
        actions.push({
          id: i.id,
          type: 'reminder',
          kind: 'hoy',
          dueDate: i.scheduledDate,
          title: i.title,
          description: i.description,
          patientId: i.patientId,
          patientEmail,
          patientName,
          patientPhone,
          responsibleName: meta.responsibleName || null,
          resolvedAt: meta.resolvedAt || null,
          comments: Array.isArray(meta.comments) ? meta.comments : [],
        });
      }
    }
  }
  return actions;
};

/**
 * Métricas de acciones del día: activas, vencidas, cumplidas
 */
const getDailyActionsMetrics = async (options = {}) => {
  const actions = await getDailyActions(options);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let activas = 0;
  let vencidas = 0;
  let cumplidas = 0;
  actions.forEach((a) => {
    if (a.resolvedAt) {
      cumplidas += 1;
    } else if (a.dueDate && new Date(a.dueDate).setHours(0, 0, 0, 0) < today.getTime()) {
      vencidas += 1;
    } else {
      activas += 1;
    }
  });
  return { activas, vencidas, cumplidas, total: actions.length };
};

module.exports = {
  listByPatientEmail,
  getMetricsByPatientEmail,
  getById,
  create,
  update,
  remove,
  getDailyActions,
  getDailyActionsMetrics,
};
