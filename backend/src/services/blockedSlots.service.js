/**
 * Servicio de bloqueos de horario (requieren aprobación admin)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Solicitar bloqueo de horario (estado PENDING)
 * Cualquier usuario autenticado puede solicitar
 */
const requestBlock = async (data, requestedById) => {
  const { fecha, horaInicio, horaFin, motivo } = data;

  if (!fecha || !horaInicio || !horaFin || !motivo || !motivo.trim()) {
    throw new Error('Fecha, hora inicio, hora fin y motivo son obligatorios');
  }

  const dateObj = new Date(fecha);
  dateObj.setHours(0, 0, 0, 0);

  return prisma.blockedSlot.create({
    data: {
      fecha: dateObj,
      horaInicio: horaInicio.trim(),
      horaFin: horaFin.trim(),
      motivo: motivo.trim(),
      estado: 'PENDING',
      requestedById,
    },
    include: {
      requestedBy: {
        select: { id: true, nombre: true, email: true },
      },
    },
  });
};

/**
 * Listar bloqueos
 * - Admin: ve todos (pendientes, aprobados, rechazados)
 * - Otros: solo aprobados (para ver horarios bloqueados) + sus propias solicitudes
 */
const getAll = async (userId, userRole, { estado, fecha } = {}) => {
  const where = {};

  if (estado) where.estado = estado;
  if (fecha) {
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);
    where.fecha = { gte: startOfDay, lte: endOfDay };
  }

  if (userRole !== 'ADMIN') {
    where.OR = [
      { estado: 'APPROVED' },
      { requestedById: userId },
    ];
  }

  return prisma.blockedSlot.findMany({
    where,
    include: {
      requestedBy: {
        select: { id: true, nombre: true, email: true },
      },
      approvedBy: {
        select: { id: true, nombre: true, email: true },
      },
    },
    orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
  });
};

/**
 * Obtener solo bloqueos pendientes de aprobación (para admin)
 */
const getPending = async () => {
  return prisma.blockedSlot.findMany({
    where: { estado: 'PENDING' },
    include: {
      requestedBy: {
        select: { id: true, nombre: true, email: true },
      },
    },
    orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }],
  });
};

/**
 * Aprobar bloqueo (solo ADMIN)
 */
const approve = async (id, approvedById) => {
  const block = await prisma.blockedSlot.findUnique({ where: { id } });
  if (!block) throw new Error('Bloqueo no encontrado');
  if (block.estado !== 'PENDING') throw new Error('Solo se pueden aprobar solicitudes pendientes');

  return prisma.blockedSlot.update({
    where: { id },
    data: {
      estado: 'APPROVED',
      approvedById,
    },
    include: {
      requestedBy: { select: { id: true, nombre: true, email: true } },
      approvedBy: { select: { id: true, nombre: true, email: true } },
    },
  });
};

/**
 * Rechazar bloqueo (solo ADMIN)
 */
const reject = async (id, approvedById) => {
  const block = await prisma.blockedSlot.findUnique({ where: { id } });
  if (!block) throw new Error('Bloqueo no encontrado');
  if (block.estado !== 'PENDING') throw new Error('Solo se pueden rechazar solicitudes pendientes');

  return prisma.blockedSlot.update({
    where: { id },
    data: {
      estado: 'REJECTED',
      approvedById,
    },
    include: {
      requestedBy: { select: { id: true, nombre: true, email: true } },
    },
  });
};

/**
 * Obtener bloques aprobados para una fecha (para excluir de slots disponibles)
 */
const getApprovedForDate = async (fecha) => {
  const startOfDay = new Date(fecha);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(fecha);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.blockedSlot.findMany({
    where: {
      estado: 'APPROVED',
      fecha: { gte: startOfDay, lte: endOfDay },
    },
  });
};

module.exports = {
  requestBlock,
  getAll,
  getPending,
  approve,
  reject,
  getApprovedForDate,
};
