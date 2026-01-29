/**
 * Servicio de leads
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Obtener todos los leads
 */
const getAll = async ({ estado, page = 1, limit = 50, search }) => {
  const where = {};

  if (estado) {
    where.estado = estado;
  }

  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { telefono: { contains: search } },
    ];
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: {
        appointment: true,
        patient: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.lead.count({ where }),
  ]);

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Obtener estadísticas de leads (para funnel)
 */
const getStats = async () => {
  const stats = await prisma.lead.groupBy({
    by: ['estado'],
    _count: { id: true },
  });

  const total = stats.reduce((sum, s) => sum + s._count.id, 0);

  const funnel = {
    nuevo: 0,
    contactado: 0,
    agendado: 0,
    calificado: 0,
    convertido: 0,
    perdido: 0,
    paciente: 0,
    total,
  };

  stats.forEach((s) => {
    const key = s.estado.toLowerCase();
    funnel[key] = s._count.id;
  });

  // Calcular porcentajes
  Object.keys(funnel).forEach((key) => {
    if (key !== 'total') {
      funnel[`${key}Pct`] = total > 0 ? ((funnel[key] / total) * 100).toFixed(1) : 0;
    }
  });

  return funnel;
};

/**
 * Obtener lead por ID
 */
const getById = async (id) => {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      appointment: true,
      patient: true,
      createdBy: {
        select: { id: true, nombre: true, email: true },
      },
    },
  });
};

/**
 * Crear lead
 */
const create = async (data, createdById) => {
  return prisma.lead.create({
    data: {
      nombre: data.nombre,
      email: data.email.toLowerCase(),
      telefono: data.telefono,
      direccion: data.direccion,
      ciudad: data.ciudad,
      usuarioAudifonosMedicados: data.usuarioAudifonosMedicados || 'NO',
      procedencia: data.procedencia || 'visita-medica',
      interes: data.interes || 'Consulta General',
      notas: data.notas,
      estado: 'NUEVO',
      medicoReferente: data.medicoReferente,
      redSocial: data.redSocial,
      campanaMarketingOffline: data.campanaMarketingOffline,
      personaRecomendacion: data.personaRecomendacion,
      agendamientoManualTipo: data.agendamientoManualTipo,
      createdById,
    },
  });
};

/**
 * Actualizar lead
 */
const update = async (id, data) => {
  // Verificar si el lead existe
  const existing = await prisma.lead.findUnique({ where: { id } });
  
  if (!existing) {
    const error = new Error('Lead no encontrado');
    error.statusCode = 404;
    throw error;
  }

  // Bloquear cambio de estado si ya es PACIENTE
  if (existing.estado === 'PACIENTE' && data.estado && data.estado !== 'PACIENTE') {
    const error = new Error('No se puede cambiar el estado de un lead que ya es paciente');
    error.statusCode = 400;
    throw error;
  }

  return prisma.lead.update({
    where: { id },
    data: {
      ...data,
      email: data.email ? data.email.toLowerCase() : undefined,
    },
  });
};

/**
 * Eliminar lead
 */
const remove = async (id) => {
  return prisma.lead.delete({ where: { id } });
};

/**
 * Convertir lead a paciente
 */
const convertToPatient = async (id, additionalData = {}) => {
  const lead = await prisma.lead.findUnique({ where: { id } });

  if (!lead) {
    const error = new Error('Lead no encontrado');
    error.statusCode = 404;
    throw error;
  }

  // Crear paciente
  const patient = await prisma.patient.create({
    data: {
      nombre: lead.nombre,
      email: lead.email,
      telefono: lead.telefono,
      direccion: lead.direccion,
      ciudad: lead.ciudad,
      usuarioAudifonosMedicados: lead.usuarioAudifonosMedicados,
      procedencia: lead.procedencia,
      notas: additionalData.notas || lead.notas,
      tienePerdidaAuditiva: additionalData.tienePerdidaAuditiva || false,
      leadId: lead.id,
    },
  });

  // Actualizar lead a estado PACIENTE
  await prisma.lead.update({
    where: { id },
    data: { estado: 'PACIENTE' },
  });

  return { lead, patient };
};

/**
 * Buscar lead por email o teléfono (para detectar duplicados)
 */
const findByEmailOrPhone = async (email, telefono, excludeId) => {
  const where = {
    OR: [],
  };

  if (email) {
    where.OR.push({ email: email.toLowerCase() });
  }

  if (telefono) {
    // Normalizar teléfono (solo dígitos)
    const normalizedPhone = telefono.replace(/\D/g, '');
    where.OR.push({ telefono: { contains: normalizedPhone } });
  }

  if (where.OR.length === 0) return null;

  if (excludeId) {
    where.NOT = { id: excludeId };
  }

  return prisma.lead.findFirst({ where });
};

module.exports = {
  getAll,
  getStats,
  getById,
  create,
  update,
  remove,
  convertToPatient,
  findByEmailOrPhone,
};
