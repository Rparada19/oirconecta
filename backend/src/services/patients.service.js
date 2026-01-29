/**
 * Servicio de pacientes
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Obtener todos los pacientes
 */
const getAll = async ({ search, page = 1, limit = 50 }) => {
  const where = {};

  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { telefono: { contains: search } },
      { numeroDocumento: { contains: search } },
    ];
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

module.exports = {
  getAll,
  getStats,
  getById,
  getFullProfile,
  create,
  update,
};
