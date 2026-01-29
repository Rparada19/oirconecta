/**
 * Servicio de campañas de marketing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Obtener todas las campañas
 */
const getAll = async ({ estado, fabricante }) => {
  const where = {};

  if (estado) {
    where.estado = estado;
  }

  if (fabricante) {
    where.fabricante = fabricante;
  }

  return prisma.campaign.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Obtener campañas activas (para selects en cotización/venta)
 */
const getActive = async (fabricante) => {
  const where = {
    estado: 'ACTIVA',
    fechaFin: { gte: new Date() },
  };

  if (fabricante) {
    where.fabricante = fabricante;
  }

  return prisma.campaign.findMany({
    where,
    orderBy: { nombre: 'asc' },
  });
};

/**
 * Obtener campaña por ID
 */
const getById = async (id) => {
  return prisma.campaign.findUnique({
    where: { id },
    include: {
      quotes: { take: 10 },
      sales: { take: 10 },
    },
  });
};

/**
 * Crear campaña
 */
const create = async (data) => {
  return prisma.campaign.create({
    data: {
      nombre: data.nombre,
      tipo: data.tipo,
      estado: data.estado || 'ACTIVA',
      fechaInicio: new Date(data.fechaInicio),
      fechaFin: new Date(data.fechaFin),
      fabricante: data.fabricante,
      descuentoAprobado: data.descuentoAprobado || 0,
      destinatarios: data.destinatarios || 0,
      abiertos: data.abiertos || 0,
      clicks: data.clicks || 0,
    },
  });
};

/**
 * Actualizar campaña
 */
const update = async (id, data) => {
  const updateData = { ...data };

  if (data.fechaInicio) {
    updateData.fechaInicio = new Date(data.fechaInicio);
  }

  if (data.fechaFin) {
    updateData.fechaFin = new Date(data.fechaFin);
  }

  return prisma.campaign.update({
    where: { id },
    data: updateData,
  });
};

/**
 * Eliminar campaña
 */
const remove = async (id) => {
  return prisma.campaign.delete({ where: { id } });
};

module.exports = {
  getAll,
  getActive,
  getById,
  create,
  update,
  remove,
};
