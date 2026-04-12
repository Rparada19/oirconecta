/**
 * Servicio de pacientes
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Obtener todos los pacientes.
 * - Si appointmentProfessionalId está definido (audióloga con profesional asignado): solo pacientes con cita asignada a ese profesional.
 * - Si createdByUserId está definido (audióloga sin profesional de cita): solo pacientes con venta creada por ese usuario.
 */
const getAll = async ({ search, page = 1, limit = 50, createdByUserId, appointmentProfessionalId }) => {
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

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ]);

  return {
    patients,
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
  const existing = await prisma.patient.findUnique({
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

module.exports = {
  getAll,
  getStats,
  getById,
  getFullProfile,
  create,
  update,
  patientHasSalesByUser,
  patientHasAppointmentsForProfessional,
  reassignToProfessional,
};
