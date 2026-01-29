/**
 * Servicio de citas
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Horarios disponibles por defecto
const DEFAULT_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '14:00', '14:30', '15:00',
  '15:30', '16:00', '16:30', '17:00', '17:30',
];

/**
 * Obtener todas las citas
 */
const getAll = async ({ fecha, estado, page = 1, limit = 50 }) => {
  const where = {};

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
 * Obtener horarios disponibles para una fecha
 */
const getAvailableSlots = async (fecha) => {
  const startOfDay = new Date(fecha);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(fecha);
  endOfDay.setHours(23, 59, 59, 999);

  // Obtener citas del día que no estén canceladas
  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      fecha: {
        gte: startOfDay,
        lte: endOfDay,
      },
      estado: {
        notIn: ['CANCELLED'],
      },
    },
    select: { hora: true },
  });

  const bookedSlots = bookedAppointments.map((a) => a.hora);
  const availableSlots = DEFAULT_SLOTS.filter((slot) => !bookedSlots.includes(slot));

  return {
    fecha,
    availableSlots,
    bookedSlots,
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

  return prisma.appointment.create({
    data: {
      fecha,
      hora: data.hora,
      motivo: data.motivo,
      procedencia: data.procedencia || 'visita-medica',
      estado: 'CONFIRMED',
      notas: data.notas,
      tipoConsulta: data.tipoConsulta,
      patientId: data.patientId,
      patientName: data.patientName,
      patientEmail: data.patientEmail?.toLowerCase(),
      patientPhone: data.patientPhone,
      createdById,
    },
    include: {
      patient: true,
    },
  });
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

module.exports = {
  getAll,
  getStats,
  getAvailableSlots,
  getById,
  create,
  update,
  updateStatus,
  cancel,
};
