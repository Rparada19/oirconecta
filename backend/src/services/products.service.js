/**
 * Servicio de productos (cotizaciones y ventas)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


/**
 * Adaptación registrada → gracias y reseña, como con una cita asistida.
 *
 * El día que alguien se lleva puestos sus audífonos es el momento más alto de
 * todo el proceso, y hasta ahora no disparaba nada: el agradecimiento colgaba
 * solo de marcar una cita como asistida, así que si la entrega no quedaba
 * registrada como cita, el paciente no recibía nada.
 *
 * Se usa la misma plantilla de la cita asistida (aprobada en Meta) y se
 * dispara una sola vez por venta.
 */
async function programarGraciasPorAdaptacion(sale) {
  if (!sale || sale.categoria !== 'HEARING_AID') return;
  if (!sale.fechaAdaptacion || !sale.patientId) return;

  const meta = sale.metadata && typeof sale.metadata === 'object' ? sale.metadata : {};
  if (meta.graciasAdaptacionAt) return;   // ya se programó para esta venta

  const adaptacion = new Date(sale.fechaAdaptacion);
  const ahora = new Date();
  const dias = (ahora - adaptacion) / 86400000;
  // Una adaptación cargada semanas después es un registro histórico, no algo
  // que acaba de pasar: escribirle "hoy fue un gusto acompañarte" sería falso.
  if (dias > 2) return;

  // Si la adaptación es hoy, tres horas después: alcanza a llegar a casa y a
  // estrenarlos. Si está agendada a futuro, ese mismo día por la tarde.
  const scheduledFor = dias >= 0
    ? new Date(ahora.getTime() + 3 * 3600 * 1000)
    : new Date(new Date(adaptacion).setUTCHours(20, 0, 0, 0));

  const paciente = await prisma.patient.findUnique({
    where: { id: sale.patientId },
    select: { nombre: true },
  }).catch(() => null);

  const linkGoogle = process.env.GOOGLE_REVIEW_URL !== undefined
    ? process.env.GOOGLE_REVIEW_URL
    : 'https://g.page/r/CW2QxMBq6uFtEBM/review';
  const templateCode = linkGoogle ? 'resena_google' : 'agradecimiento_post_cita';

  const { scheduleReminder } = require('../notifications');
  for (const channel of ['WHATSAPP', 'EMAIL']) {
    await scheduleReminder({
      patientId: sale.patientId,
      eventCode: linkGoogle ? 'RESENA_GOOGLE' : 'AGRADECIMIENTO_POST_CITA',
      channel,
      templateCode,
      targetType: 'Sale',
      targetId: sale.id,
      payload: {
        nombre: paciente?.nombre || 'paciente',
        link_google: linkGoogle,
      },
      scheduledFor,
    }).catch((e) => console.warn('[venta] gracias por adaptación:', e.message));
  }

  await prisma.sale.update({
    where: { id: sale.id },
    data: { metadata: { ...meta, graciasAdaptacionAt: new Date().toISOString() } },
  }).catch(() => {});
}

/**
 * Convierte a Date una fecha que viene del formulario.
 *
 * `new Date('2026-09-03')` es medianoche UTC, que en Bogotá (UTC-5) es el 2 de
 * septiembre a las 7 p.m. Al releerla, el CRM mostraba el día anterior y
 * parecía que la edición no se había guardado. Fijándola al mediodía UTC, la
 * fecha se lee igual en cualquier huso del continente.
 *
 * Las fechas con hora (ISO completo) se respetan tal cual: ahí el instante sí
 * importa.
 */
function fechaDelFormulario(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T12:00:00.000Z`);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ===========================================
// COTIZACIONES
// ===========================================

const getAllQuotes = async ({ patientId, estado, createdByUserId }) => {
  const where = {};

  if (patientId) where.patientId = patientId;
  if (estado) where.estado = estado;
  if (createdByUserId) {
    const patientIds = await prisma.sale.findMany({
      where: { createdById: createdByUserId },
      select: { patientId: true },
      distinct: ['patientId'],
    }).then((rows) => rows.map((r) => r.patientId));
    where.patientId = { in: patientIds.length ? patientIds : [] };
  }

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
      hearingPlanId: data.hearingPlanId || null,
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
      hearingPlanId: quote.hearingPlanId || null,
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

  // Comisión del referidor. Solo prende si la venta nace ya recaudada.
  await require('./partnerCommissions.service').causarPorVenta(sale.id);

  // F8 — Si la venta ya trae fechaAdaptacion, dispara el funnel de controles
  if (sale.categoria === 'HEARING_AID' && sale.fechaAdaptacion) {
    await programarGraciasPorAdaptacion(sale)
      .catch((e) => console.warn('[venta] gracias por adaptación:', e.message));
    try {
      const followUps = require('./followUps.service');
      await followUps.ensureFunnel({
        patientId: sale.patientId,
        adaptationDate: sale.fechaAdaptacion,
        saleId: sale.id,
      });
    } catch (e) {
      console.warn('[products/convertQuote] followUps.ensureFunnel falló:', e.message);
    }
  }

  return sale;
};

// ===========================================
// VENTAS
// ===========================================

const getAllSales = async ({ patientId, categoria, createdByUserId }) => {
  const where = {};

  if (patientId) where.patientId = patientId;
  if (categoria) where.categoria = categoria;
  if (createdByUserId) where.createdById = createdByUserId;

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
      // Comisión del referidor: la ficha de la venta es donde el equipo la
      // consulta y la ajusta, así que tiene que venir con la venta.
      partnerCommission: true,
      comisionPartner: { select: { id: true, nombre: true, comisionPct: true } },
      followUps: {
        select: { id: true, step: true, dueDate: true, status: true },
        orderBy: { dueDate: 'asc' },
      },
    },
  });
};

const createSale = async (data, createdById) => {
  const sale = await prisma.sale.create({
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
      // Recaudo y comisión pactada. Sin fechaRecaudo la comisión no se causa.
      fechaRecaudo: data.fechaRecaudo ? fechaDelFormulario(data.fechaRecaudo) : null,
      comisionPartnerId: data.comisionPartnerId || null,
      comisionPct: data.comisionPct === undefined || data.comisionPct === null || data.comisionPct === ''
        ? null
        : Number(data.comisionPct),
      // Servicios: 100% margen por definición del negocio.
      costoUnitario: data.categoria === 'SERVICE' ? 0 : (data.costoUnitario ?? null),
      anosGarantia: data.anosGarantia,
      // Plan de adaptación vendido. Null = audífono suelto.
      hearingPlanId: data.hearingPlanId || null,
      seguroPerdida: data.seguroPerdida,
      seguroRotura: data.seguroRotura,
      fechaAdaptacion: data.fechaAdaptacion ? fechaDelFormulario(data.fechaAdaptacion) : null,
      fechaFinGarantia: data.fechaFinGarantia ? fechaDelFormulario(data.fechaFinGarantia) : null,
      fechaPrimerControl: data.fechaPrimerControl ? fechaDelFormulario(data.fechaPrimerControl) : null,
      fechaPrimerMantenimiento: data.fechaPrimerMantenimiento ? fechaDelFormulario(data.fechaPrimerMantenimiento) : null,
      campaignId: data.campaignId,
      descripcionConsulta: data.descripcionConsulta,
      fechaConsulta: data.fechaConsulta ? fechaDelFormulario(data.fechaConsulta) : null,
      accesoriosItems: data.accesoriosItems,
      metadata: data.metadata,
      notas: data.notas,
      createdById,
    },
    include: {
      patient: true,
      campaign: true,
      hearingPlan: { select: { id: true, nombre: true, code: true } },
    },
  });

  // Comisión del referidor. Solo prende si la venta nace ya recaudada.
  await require('./partnerCommissions.service').causarPorVenta(sale.id);

  // F8 — Dispara el funnel de controles si es venta de audífono con fechaAdaptacion
  if (sale.categoria === 'HEARING_AID' && sale.fechaAdaptacion) {
    await programarGraciasPorAdaptacion(sale)
      .catch((e) => console.warn('[venta] gracias por adaptación:', e.message));
    try {
      const followUps = require('./followUps.service');
      await followUps.ensureFunnel({
        patientId: sale.patientId,
        adaptationDate: sale.fechaAdaptacion,
        saleId: sale.id,
      });
    } catch (e) {
      console.warn('[products/createSale] followUps.ensureFunnel falló:', e.message);
    }
  }

  return sale;
};

const updateSale = async (id, data) => {
  const updateData = { ...data };

  // Convertir fechas si vienen
  ['fechaAdaptacion', 'fechaFinGarantia', 'fechaPrimerControl', 'fechaPrimerMantenimiento', 'fechaConsulta', 'fechaRecaudo'].forEach((field) => {
    if (data[field]) {
      updateData[field] = fechaDelFormulario(data[field]);
    }
  });

  // Fusionar metadata con la existente para no perder datos (ej. renovationHandledAt, renovationBought)
  if (data.metadata && typeof data.metadata === 'object') {
    const existing = await prisma.sale.findUnique({ where: { id }, select: { metadata: true } });
    const existingMeta = existing?.metadata && typeof existing.metadata === 'object' ? existing.metadata : {};
    updateData.metadata = { ...existingMeta, ...data.metadata };
  }

  const updated = await prisma.sale.update({
    where: { id },
    data: updateData,
  });

  // Comisión del referidor. El orden importa: primero se intenta causar (por
  // si acaban de marcar el recaudo), luego se anula si el recaudo se deshizo,
  // y por último se reajusta si cambió el valor o el % pactado.
  const comisiones = require('./partnerCommissions.service');
  if (updated.fechaRecaudo) {
    await comisiones.causarPorVenta(updated.id);
    await comisiones.recalcularPorVenta(updated.id);
  } else {
    await comisiones.anularSiNoRecaudada(updated.id);
  }

  // F8 — Si la edición trae fechaAdaptacion en una venta de audífono, dispara/ajusta el funnel
  if (updated.categoria === 'HEARING_AID' && updated.fechaAdaptacion) {
    await programarGraciasPorAdaptacion(updated)
      .catch((e) => console.warn('[products/updateSale] gracias por adaptación:', e.message));
    try {
      const followUps = require('./followUps.service');
      await followUps.ensureFunnel({
        patientId: updated.patientId,
        adaptationDate: updated.fechaAdaptacion,
        saleId: updated.id,
      });
    } catch (e) {
      console.warn('[products/updateSale] followUps.ensureFunnel falló:', e.message);
    }
  }

  return updated;
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
