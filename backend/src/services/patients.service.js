/**
 * Servicio de pacientes
 */

// Cliente Prisma único con extensión de AuditLog (Habeas Data)

const prisma = require('../db');

/**
 * Obtener todos los pacientes.
 * - Si appointmentProfessionalId está definido (audióloga con profesional asignado): solo pacientes con cita asignada a ese profesional.
 * - Si createdByUserId está definido (audióloga sin profesional de cita): solo pacientes con venta creada por ese usuario.
 */
const getAll = async ({ search, page = 1, limit = 50, createdByUserId, appointmentProfessionalId, includeProspectos = false }) => {
  const where = {};

  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { telefono: { contains: search } },
      { numeroDocumento: { contains: search } },
    ];
  }

  if (appointmentProfessionalId) {
    where.appointments = { some: { professionalId: appointmentProfessionalId } };
  } else if (createdByUserId) {
    where.sales = { some: { createdById: createdByUserId } };
  }

  // Por defecto solo pacientes REALES: creados manualmente, o que ya asistieron /
  // compraron / tienen consulta o mantenimiento. Con includeProspectos se traen
  // también los auto-creados al agendar que todavía no asisten, para poder
  // seguirles el rastro aunque no lleguen.
  const CONDICION_REAL = {
    OR: [
      { createdViaBooking: false },
      { appointments: { some: { estado: { in: ['COMPLETED', 'PATIENT'] } } } },
      { sales: { some: {} } },
      { consultations: { some: {} } },
      { maintenances: { some: {} } },
    ],
  };
  if (!includeProspectos) where.AND = [CONDICION_REAL];

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { appointments: true, sales: true, consultations: true } },
        appointments: { select: { estado: true, fecha: true }, orderBy: { fecha: 'desc' }, take: 100 },
      },
    }),
    prisma.patient.count({ where }),
  ]);

  // esProspecto: agendó pero todavía no asiste ni compró. La UI lo distingue
  // del paciente real sin tener que replicar la regla.
  const conFlag = patients.map((p) => {
    const asistio = (p.appointments || []).some((a) => ['COMPLETED', 'PATIENT'].includes(a.estado));
    const esProspecto = p.createdViaBooking && !asistio
      && p._count.sales === 0 && p._count.consultations === 0;
    // La última cita ATENDIDA es la que interesa en la lista de pacientes.
    const atendidas = (p.appointments || []).filter((a) => ['COMPLETED', 'PATIENT'].includes(a.estado));
    const { appointments, _count, ...rest } = p;
    return {
      ...rest,
      esProspecto,
      totalCitas: _count.appointments,
      citasAtendidas: atendidas.length,
      ultimaCita: atendidas[0]?.fecha || null,
    };
  });

  return {
    patients: conFlag,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Obtener estadísticas de pacientes
 */
const getStats = async () => {
  const [
    total,
    conPerdidaAuditiva,
    porProcedencia,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.patient.count({ where: { tienePerdidaAuditiva: true } }),
    prisma.patient.groupBy({
      by: ['procedencia'],
      _count: { id: true },
    }),
  ]);

  return {
    total,
    conPerdidaAuditiva,
    porProcedencia: porProcedencia.reduce((acc, p) => {
      acc[p.procedencia] = p._count.id;
      return acc;
    }, {}),
  };
};

/**
 * Obtener paciente por ID
 */
const getById = async (id) => {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      lead: true,
    },
  });
};

/**
 * Obtener perfil completo del paciente
 */
const getFullProfile = async (id) => {
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      lead: true,
      appointments: {
        orderBy: { fecha: 'desc' },
        take: 10,
      },
      quotes: {
        orderBy: { createdAt: 'desc' },
        include: { campaign: true },
      },
      sales: {
        orderBy: { createdAt: 'desc' },
        include: { campaign: true },
      },
      consultations: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return patient;
};

/**
 * Crear paciente
 */
const create = async (data) => {
  // Verificar si ya existe un paciente con ese email
  const existing = await prisma.patient.findFirst({
    where: { email: data.email.toLowerCase() },
  });

  if (existing) {
    const error = new Error('Ya existe un paciente con ese email');
    error.statusCode = 400;
    throw error;
  }

  return prisma.patient.create({
    data: {
      ...data,
      email: data.email.toLowerCase(),
    },
  });
};

/**
 * Actualizar paciente
 */
const update = async (id, data) => {
  return prisma.patient.update({
    where: { id },
    data: {
      ...data,
      email: data.email ? data.email.toLowerCase() : undefined,
    },
  });
};

/**
 * Verificar si el paciente tiene al menos una venta creada por el usuario (para acceso de audióloga).
 */
const patientHasSalesByUser = async (patientId, userId) => {
  const count = await prisma.sale.count({
    where: { patientId, createdById: userId },
  });
  return count > 0;
};

/**
 * Verificar si el paciente tiene al menos una cita asignada al profesional (para acceso de audióloga por cita).
 */
const patientHasAppointmentsForProfessional = async (patientId, professionalId) => {
  const count = await prisma.appointment.count({
    where: { patientId, professionalId },
  });
  return count > 0;
};

/**
 * Reasignar paciente a otro profesional (todas sus ventas pasan a createdById = newProfessionalId).
 * Solo ADMIN.
 */
const reassignToProfessional = async (patientId, newProfessionalId) => {
  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) {
    const err = new Error('Paciente no encontrado');
    err.statusCode = 404;
    throw err;
  }
  const result = await prisma.sale.updateMany({
    where: { patientId },
    data: { createdById: newProfessionalId },
  });
  return { patient, updatedSalesCount: result.count };
};

/**
 * Asigna el código de historia clínica si el paciente aún no lo tiene.
 * Formato OC-<año>-<consecutivo de 4 dígitos>, consecutivo por año.
 *
 * El consecutivo se calcula sobre el máximo existente del año en curso; ante
 * una colisión (dos consultas simultáneas) reintenta con el siguiente.
 */
const ensureCodigoHC = async (patientId) => {
  if (!patientId) return null;
  const actual = await prisma.patient.findUnique({
    where: { id: patientId }, select: { codigoHC: true },
  });
  if (!actual) return null;
  if (actual.codigoHC) return actual.codigoHC;

  const anio = new Date().getFullYear();
  const prefijo = `OC-${anio}-`;

  for (let intento = 0; intento < 5; intento++) {
    const ultimo = await prisma.patient.findFirst({
      where: { codigoHC: { startsWith: prefijo } },
      orderBy: { codigoHC: 'desc' },
      select: { codigoHC: true },
    });
    const consecutivo = (ultimo ? parseInt(ultimo.codigoHC.slice(prefijo.length), 10) : 0) + 1 + intento;
    const codigo = `${prefijo}${String(consecutivo).padStart(4, '0')}`;
    try {
      const upd = await prisma.patient.update({
        where: { id: patientId }, data: { codigoHC: codigo }, select: { codigoHC: true },
      });
      return upd.codigoHC;
    } catch (e) {
      if (e.code !== 'P2002') throw e; // P2002 = choque de único: reintenta
    }
  }
  console.warn('[patients] no pude asignar codigoHC tras 5 intentos:', patientId);
  return null;
};

/**
 * Conversación de WhatsApp del paciente (entrante y saliente). Suele ser el
 * primer contacto, antes de que exista cita: sin esto el CRM arranca la
 * historia a la mitad. Se busca por patientId y, si no está vinculada, por
 * teléfono.
 */
const getWhatsAppMessages = async (patientId) => {
  if (!patientId) return [];
  const paciente = await prisma.patient.findUnique({
    where: { id: patientId }, select: { telefono: true },
  });
  const telefono = (paciente?.telefono || '').replace(/\D/g, '');
  const posibles = telefono
    ? [telefono, telefono.length === 10 ? `57${telefono}` : telefono.replace(/^57/, '')]
    : [];

  const conv = await prisma.whatsAppConversation.findFirst({
    where: { OR: [{ patientId }, ...(posibles.length ? [{ phone: { in: posibles } }] : [])] },
    select: { id: true },
  });
  if (!conv) return [];

  return prisma.whatsAppMessage.findMany({
    where: { conversationId: conv.id },
    orderBy: { timestamp: 'desc' },
    select: {
      id: true, direction: true, type: true, body: true,
      sentByBot: true, deliveryStatus: true, timestamp: true,
    },
    take: 200,
  });
};

/** Mensajes enviados al paciente (Notification): WhatsApp/email/SMS + estado. */
const getMessages = async (patientId) => {
  if (!patientId) return [];
  return prisma.notification.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, channel: true, eventCode: true, templateCode: true,
      status: true, toAddress: true, createdAt: true,
      deliveredAt: true, readAt: true, failedAt: true, errorMessage: true,
    },
    take: 200,
  });
};

module.exports = {
  getAll,
  ensureCodigoHC,
  getWhatsAppMessages,
  getStats,
  getById,
  getFullProfile,
  getMessages,
  create,
  update,
  patientHasSalesByUser,
  patientHasAppointmentsForProfessional,
  reassignToProfessional,
};
