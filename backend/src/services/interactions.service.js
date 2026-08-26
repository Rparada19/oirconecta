/**
 * Servicio de interacciones CRM (llamadas, mensajes, correos, visitas, seguimiento consumibles)
 */

// Cliente Prisma único con extensión de AuditLog (Habeas Data)

const prisma = require('../db');

const getPatientByEmail = async (email) => {
  if (!email || !String(email).trim()) return null;
  // findFirst, no findUnique: el índice único de patients.email se eliminó en la
  // migración fase1_crm_clinico (hay pacientes sin correo y correos repetidos).
  return prisma.patient.findFirst({
    where: { email: String(email).trim().toLowerCase() },
    orderBy: { createdAt: 'asc' },
  });
};

/** Resuelve el paciente por id (llave estable) o, en su defecto, por email. */
const resolvePatient = async ({ patientId, patientEmail }) => {
  if (patientId) return prisma.patient.findUnique({ where: { id: String(patientId) } });
  return getPatientByEmail(patientEmail);
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

/** Interacciones por patientId (llave estable). */
const listByPatientId = async (patientId) => {
  if (!patientId) return [];
  const list = await prisma.interaction.findMany({
    where: { patientId },
    orderBy: { occurredAt: 'desc' },
  });
  return list.map(toFrontend);
};

/**
 * Métricas CRM para un paciente: totales y últimas fechas por tipo
 */
const CONTACT_TYPES = ['call', 'message', 'email', 'visit'];

/** Métricas CRM de un paciente. Acepta id (llave estable) o email (legacy). */
const getMetricsByPatient = async ({ patientId, patientEmail }) => {
  const patient = await resolvePatient({ patientId, patientEmail });
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

  // Último contacto real con el paciente (cualquier canal). Es el dato que
  // dice si el paciente está abandonado, no el total de llamadas.
  const contactos = interactions.filter((i) => CONTACT_TYPES.includes(i.type));
  const ultimoContacto = contactos[0]?.occurredAt ? new Date(contactos[0].occurredAt).toISOString() : null;
  const diasSinContacto = ultimoContacto
    ? Math.floor((Date.now() - new Date(ultimoContacto).getTime()) / 86400000)
    : null;

  // Próxima acción pendiente: lo agendado que aún no ocurre.
  const ahora = new Date();
  const pendientes = interactions
    .filter((i) => i.scheduledDate && new Date(i.scheduledDate) >= new Date(ahora.toDateString())
      && !(i.metadata && typeof i.metadata === 'object' && i.metadata.resolvedAt))
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  const proxima = pendientes[0] || null;

  return {
    totalLlamadas: byType('call').length,
    totalMensajes: byType('message').length,
    totalCorreos: byType('email').length,
    totalVisitas: byType('visit').length,
    totalRecordatorios: byType('reminder').length,
    totalSeguimientoConsumibles: byType('follow_up_consumables').length,
    totalSeguimientoGarantias: byType('follow_up_garantia').length,
    totalContactos: contactos.length,
    ultimaLlamada: lastByType('call'),
    ultimoMensaje: lastByType('message'),
    ultimoCorreo: lastByType('email'),
    ultimaVisita: lastByType('visit'),
    ultimoContacto,
    diasSinContacto,
    proximaAccion: proxima
      ? {
          id: proxima.id,
          title: proxima.title,
          type: proxima.type,
          scheduledDate: new Date(proxima.scheduledDate).toISOString(),
          scheduledTime: proxima.scheduledTime || null,
        }
      : null,
  };
};

/** @deprecated usar getMetricsByPatient. Se mantiene por compatibilidad. */
const getMetricsByPatientEmail = async (patientEmail) => getMetricsByPatient({ patientEmail });

/**
 * Crear interacción
 */
const create = async (body) => {
  const { patientId, patientEmail, type, channel, title, description, status, direction, duration, occurredAt, scheduledDate, scheduledTime, relatedAppointmentId, relatedMaintenanceId, metadata } = body;

  // patientId manda: hay pacientes sin correo y el CRM debe poder registrarles
  // actividad igual. El email queda como respaldo para llamadas antiguas.
  const patient = await resolvePatient({ patientId, patientEmail });
  if (!patient) return { success: false, interaction: null, error: 'Paciente no encontrado' };
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
  const { daysAhead = 7, patientEmail: filterPatientEmail, patientId: filterPatientId } = options;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = new Date(today);
  future.setDate(future.getDate() + (daysAhead || 0));
  future.setHours(23, 59, 59, 999);

  const list = await prisma.interaction.findMany({
    where: {
      type: { in: ['follow_up_consumables', 'follow_up_garantia', 'reminder'] },
      ...(filterPatientId
        ? { patientId: String(filterPatientId) }
        : filterPatientEmail
          ? { patient: { email: String(filterPatientEmail).trim().toLowerCase() } }
          : {}),
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


/**
 * Vista CRM de pacientes: una fila por paciente con el estado de su seguimiento.
 * Es lo que alimenta la página "CRM · Seguimiento" (buscar paciente → entrar a
 * sus acciones) sin tener que abrir la ficha uno por uno.
 *
 * @param {{ search?: string, filtro?: string, limit?: number, daysAhead?: number }} opts
 * filtro: 'todos' | 'vencidas' | 'sin-contacto' | 'nunca' | 'proximas'
 */
const getCrmOverview = async ({ search = '', filtro = 'todos', limit = 300, daysAhead = 7 } = {}) => {
  const where = { archivedAt: null };
  const term = String(search || '').trim();
  if (term) {
    where.OR = [
      { nombre: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { telefono: { contains: term } },
      { numeroDocumento: { contains: term } },
    ];
  }

  const patients = await prisma.patient.findMany({
    where,
    take: Math.min(Number(limit) || 300, 1000),
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, nombre: true, email: true, telefono: true, numeroDocumento: true,
      procedencia: true,
    },
  });
  if (patients.length === 0) return { rows: [], total: 0 };

  const ids = patients.map((p) => p.id);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [interactions, appointments, actions] = await Promise.all([
    prisma.interaction.findMany({
      where: { patientId: { in: ids } },
      select: { patientId: true, type: true, occurredAt: true, scheduledDate: true, scheduledTime: true, title: true, metadata: true },
      orderBy: { occurredAt: 'desc' },
    }),
    prisma.appointment.findMany({
      where: { patientId: { in: ids } },
      select: { patientId: true, fecha: true, hora: true, estado: true },
      orderBy: { fecha: 'desc' },
    }),
    getDailyActions({ daysAhead }),
  ]);

  const porPaciente = new Map(ids.map((id) => [id, {
    contactos: [], programadas: [], citasAtendidas: [], proximaCita: null,
    alertasActivas: 0, alertasVencidas: 0,
  }]));

  interactions.forEach((i) => {
    const acc = porPaciente.get(i.patientId);
    if (!acc) return;
    if (CONTACT_TYPES.includes(i.type)) acc.contactos.push(i);
    const meta = i.metadata && typeof i.metadata === 'object' ? i.metadata : {};
    if (i.scheduledDate && !meta.resolvedAt && new Date(i.scheduledDate) >= hoy) acc.programadas.push(i);
  });

  appointments.forEach((a) => {
    const acc = porPaciente.get(a.patientId);
    if (!acc || !a.fecha) return;
    if (['COMPLETED', 'PATIENT'].includes(a.estado)) acc.citasAtendidas.push(a);
    else if (new Date(a.fecha) >= hoy && a.estado !== 'CANCELLED') {
      if (!acc.proximaCita || new Date(a.fecha) < new Date(acc.proximaCita.fecha)) acc.proximaCita = a;
    }
  });

  actions.forEach((a) => {
    const acc = porPaciente.get(a.patientId);
    if (!acc || a.resolvedAt) return;
    const vencida = a.dueDate && new Date(a.dueDate).setHours(0, 0, 0, 0) < hoy.getTime();
    if (vencida) acc.alertasVencidas += 1;
    else acc.alertasActivas += 1;
  });

  const rows = patients.map((p) => {
    const acc = porPaciente.get(p.id);
    const ultimoContacto = acc.contactos[0]?.occurredAt || null;
    const diasSinContacto = ultimoContacto
      ? Math.floor((Date.now() - new Date(ultimoContacto).getTime()) / 86400000)
      : null;
    const programada = acc.programadas.sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))[0] || null;
    const ultimaCita = acc.citasAtendidas[0] || null;
    // Riesgo: el paciente que nadie ha tocado en 90 días está perdido, el de 30
    // todavía se recupera. Es la señal que ordena la lista.
    let riesgo = 'ok';
    if (acc.alertasVencidas > 0) riesgo = 'alto';
    else if (diasSinContacto == null || diasSinContacto > 90) riesgo = 'alto';
    else if (diasSinContacto > 30) riesgo = 'medio';

    return {
      id: p.id,
      nombre: p.nombre,
      email: p.email,
      telefono: p.telefono,
      numeroDocumento: p.numeroDocumento,
      procedencia: p.procedencia,
      totalContactos: acc.contactos.length,
      ultimoContacto: ultimoContacto ? new Date(ultimoContacto).toISOString() : null,
      diasSinContacto,
      alertasActivas: acc.alertasActivas,
      alertasVencidas: acc.alertasVencidas,
      proximaAccion: programada
        ? { id: programada.id, title: programada.title, type: programada.type, scheduledDate: new Date(programada.scheduledDate).toISOString(), scheduledTime: programada.scheduledTime || null }
        : null,
      proximaCita: acc.proximaCita ? { fecha: new Date(acc.proximaCita.fecha).toISOString(), hora: acc.proximaCita.hora || null } : null,
      ultimaCitaAsistida: ultimaCita ? new Date(ultimaCita.fecha).toISOString() : null,
      citasAtendidas: acc.citasAtendidas.length,
      riesgo,
    };
  });

  const filtrados = rows.filter((r) => {
    if (filtro === 'vencidas') return r.alertasVencidas > 0;
    if (filtro === 'sin-contacto') return r.diasSinContacto == null || r.diasSinContacto > 30;
    if (filtro === 'nunca') return r.totalContactos === 0;
    if (filtro === 'proximas') return !!r.proximaAccion || !!r.proximaCita;
    return true;
  });

  const orden = { alto: 0, medio: 1, ok: 2 };
  filtrados.sort((a, b) => (orden[a.riesgo] - orden[b.riesgo])
    || ((b.diasSinContacto ?? 9999) - (a.diasSinContacto ?? 9999)));

  return { rows: filtrados, total: rows.length };
};

module.exports = {
  listByPatientEmail,
  getMetricsByPatient,
  getCrmOverview,
  listByPatientId,
  getMetricsByPatientEmail,
  getById,
  create,
  update,
  remove,
  getDailyActions,
  getDailyActionsMetrics,
};
