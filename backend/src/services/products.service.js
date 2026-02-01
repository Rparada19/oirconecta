/**
 * Servicio de productos (cotizaciones y ventas)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ===========================================
// COTIZACIONES
// ===========================================

const getAllQuotes = async ({ patientId, estado }) => {
  const where = {};

  if (patientId) where.patientId = patientId;
  if (estado) where.estado = estado;

  return prisma.quote.findMany({
    where,
    include: {
      patient: true,
      campaign: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getQuoteById = async (id) => {
  return prisma.quote.findUnique({
    where: { id },
    include: {
      patient: true,
      campaign: true,
    },
  });
};

const createQuote = async (data) => {
  return prisma.quote.create({
    data: {
      patientId: data.patientId,
      marca: data.marca,
      cantidad: data.cantidad || 1,
      tecnologia: data.tecnologia,
      plataforma: data.plataforma,
      recargable: data.recargable || 'NO',
      anosGarantia: data.anosGarantia || 1,
      seguroPerdida: data.seguroPerdida || 'NO',
      seguroRotura: data.seguroRotura || 'NO',
      valorUnitario: data.valorUnitario,
      descuento: data.descuento || 0,
      valorPorUnidad: data.valorPorUnidad,
      valorTotal: data.valorTotal,
      campaignId: data.campaignId,
      metadata: data.metadata,
      notas: data.notas,
    },
    include: {
      patient: true,
      campaign: true,
    },
  });
};

const updateQuote = async (id, data, updatedById = null) => {
  const existing = await prisma.quote.findUnique({
    where: { id },
    include: { patient: true, campaign: true },
  });
  if (!existing) {
    const err = new Error('Cotización no encontrada');
    err.statusCode = 404;
    throw err;
  }
  await prisma.quoteHistory.create({
    data: {
      quoteId: id,
      snapshot: {
        marca: existing.marca,
        cantidad: existing.cantidad,
        tecnologia: existing.tecnologia,
        plataforma: existing.plataforma,
        recargable: existing.recargable,
        anosGarantia: existing.anosGarantia,
        seguroPerdida: existing.seguroPerdida,
        seguroRotura: existing.seguroRotura,
        valorUnitario: existing.valorUnitario,
        descuento: existing.descuento,
        valorPorUnidad: existing.valorPorUnidad,
        valorTotal: existing.valorTotal,
        campaignId: existing.campaignId,
        metadata: existing.metadata,
        notas: existing.notas,
        estado: existing.estado,
        updatedAt: existing.updatedAt,
        patientEmail: existing.patient?.email,
        patientName: existing.patient?.nombre,
      },
    },
  });
  return prisma.quote.update({
    where: { id },
    data,
    include: { patient: true, campaign: true },
  });
};

const getQuoteHistory = async (quoteId) => {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { patient: true, campaign: true },
  });
  if (!quote) {
    const err = new Error('Cotización no encontrada');
    err.statusCode = 404;
    throw err;
  }
  const history = await prisma.quoteHistory.findMany({
    where: { quoteId },
    orderBy: { createdAt: 'desc' },
  });
  return { quote, history };
};

const convertQuoteToSale = async (quoteId, additionalData = {}, createdById) => {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { campaign: true },
  });

  if (!quote) {
    const error = new Error('Cotización no encontrada');
    error.statusCode = 404;
    throw error;
  }

  // Crear venta desde cotización
  const sale = await prisma.sale.create({
    data: {
      patientId: quote.patientId,
      categoria: 'HEARING_AID',
      marca: quote.marca,
      modelo: `${quote.tecnologia} - ${quote.plataforma}`,
      cantidad: quote.cantidad,
      tecnologia: quote.tecnologia,
      plataforma: quote.plataforma,
      recargable: quote.recargable,
      valorUnitario: quote.valorUnitario,
      descuento: quote.descuento,
      valorTotal: quote.valorTotal,
      anosGarantia: quote.anosGarantia,
      seguroPerdida: quote.seguroPerdida,
      seguroRotura: quote.seguroRotura,
      campaignId: quote.campaignId,
      fechaAdaptacion: additionalData.fechaAdaptacion ? new Date(additionalData.fechaAdaptacion) : null,
      fechaFinGarantia: additionalData.fechaFinGarantia ? new Date(additionalData.fechaFinGarantia) : null,
      fechaPrimerControl: additionalData.fechaPrimerControl ? new Date(additionalData.fechaPrimerControl) : null,
      fechaPrimerMantenimiento: additionalData.fechaPrimerMantenimiento ? new Date(additionalData.fechaPrimerMantenimiento) : null,
      metadata: quote.metadata,
      notas: additionalData.notas || quote.notas,
      createdById,
    },
  });

  // Actualizar estado de la cotización
  await prisma.quote.update({
    where: { id: quoteId },
    data: { estado: 'CONVERTED' },
  });

  return sale;
};

// ===========================================
// VENTAS
// ===========================================

const getAllSales = async ({ patientId, categoria }) => {
  const where = {};

  if (patientId) where.patientId = patientId;
  if (categoria) where.categoria = categoria;

  return prisma.sale.findMany({
    where,
    include: {
      patient: true,
      campaign: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getSalesStats = async () => {
  const [
    totalSales,
    salesByCategory,
    totalRevenue,
  ] = await Promise.all([
    prisma.sale.count(),
    prisma.sale.groupBy({
      by: ['categoria'],
      _count: { id: true },
      _sum: { valorTotal: true },
    }),
    prisma.sale.aggregate({
      _sum: { valorTotal: true },
    }),
  ]);

  const stats = {
    totalVentas: totalSales,
    valorTotalFacturado: totalRevenue._sum.valorTotal || 0,
    facturacionAudifonos: 0,
    facturacionConsultas: 0,
    facturacionAccesorios: 0,
    unidadesAudifonos: 0,
  };

  salesByCategory.forEach((s) => {
    switch (s.categoria) {
      case 'HEARING_AID':
        stats.facturacionAudifonos = s._sum.valorTotal || 0;
        stats.unidadesAudifonos = s._count.id;
        break;
      case 'SERVICE':
        stats.facturacionConsultas = s._sum.valorTotal || 0;
        break;
      case 'ACCESSORY':
        stats.facturacionAccesorios = s._sum.valorTotal || 0;
        break;
    }
  });

  // Calcular porcentajes
  const totalFact = stats.facturacionAudifonos + stats.facturacionConsultas + stats.facturacionAccesorios;
  stats.pctAudifonos = totalFact > 0 ? ((stats.facturacionAudifonos / totalFact) * 100).toFixed(1) : 0;
  stats.pctConsultas = totalFact > 0 ? ((stats.facturacionConsultas / totalFact) * 100).toFixed(1) : 0;
  stats.pctAccesorios = totalFact > 0 ? ((stats.facturacionAccesorios / totalFact) * 100).toFixed(1) : 0;

  return stats;
};

const getSaleById = async (id) => {
  return prisma.sale.findUnique({
    where: { id },
    include: {
      patient: true,
      campaign: true,
      createdBy: {
        select: { id: true, nombre: true, email: true },
      },
    },
  });
};

const createSale = async (data, createdById) => {
  return prisma.sale.create({
    data: {
      patientId: data.patientId,
      categoria: data.categoria,
      marca: data.marca,
      modelo: data.modelo,
      cantidad: data.cantidad || 1,
      tecnologia: data.tecnologia,
      plataforma: data.plataforma,
      recargable: data.recargable,
      valorUnitario: data.valorUnitario,
      descuento: data.descuento || 0,
      valorTotal: data.valorTotal,
      anosGarantia: data.anosGarantia,
      seguroPerdida: data.seguroPerdida,
      seguroRotura: data.seguroRotura,
      fechaAdaptacion: data.fechaAdaptacion ? new Date(data.fechaAdaptacion) : null,
      fechaFinGarantia: data.fechaFinGarantia ? new Date(data.fechaFinGarantia) : null,
      fechaPrimerControl: data.fechaPrimerControl ? new Date(data.fechaPrimerControl) : null,
      fechaPrimerMantenimiento: data.fechaPrimerMantenimiento ? new Date(data.fechaPrimerMantenimiento) : null,
      campaignId: data.campaignId,
      descripcionConsulta: data.descripcionConsulta,
      fechaConsulta: data.fechaConsulta ? new Date(data.fechaConsulta) : null,
      accesoriosItems: data.accesoriosItems,
      metadata: data.metadata,
      notas: data.notas,
      createdById,
    },
    include: {
      patient: true,
      campaign: true,
    },
  });
};

const updateSale = async (id, data) => {
  const updateData = { ...data };

  // Convertir fechas si vienen
  ['fechaAdaptacion', 'fechaFinGarantia', 'fechaPrimerControl', 'fechaPrimerMantenimiento', 'fechaConsulta'].forEach((field) => {
    if (data[field]) {
      updateData[field] = new Date(data[field]);
    }
  });

  return prisma.sale.update({
    where: { id },
    data: updateData,
  });
};

module.exports = {
  getAllQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  getQuoteHistory,
  convertQuoteToSale,
  getAllSales,
  getSalesStats,
  getSaleById,
  createSale,
  updateSale,
};
