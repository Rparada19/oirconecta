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
  const now = new Date();
  const where = {
    estado: 'ACTIVA',
    fechaFin: { gte: now },
    fechaInicio: { lte: now },
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
      tipo: data.tipo || 'Audífonos',
      estado: data.estado || 'ACTIVA',
      fechaInicio: new Date(data.fechaInicio),
      fechaFin: new Date(data.fechaFin),
      fabricante: data.fabricante || null,
      descuentoAprobado: data.descuentoAprobado ?? 0,
      proveedorNombre: data.proveedorNombre || null,
      referenciaDescuento: data.referenciaDescuento || null,
      tecnologiaDescuento: data.tecnologiaDescuento || null,
      alimentacionAudifono: data.alimentacionAudifono || null,
      validezCantidadAudifonos: data.validezCantidadAudifonos || null,
      aplicacionDescuento: data.aplicacionDescuento || 'TOTAL_VENTA',
      catalogProductIds: Array.isArray(data.catalogProductIds)
        ? data.catalogProductIds.map((x) => String(x || '').trim()).filter(Boolean)
        : [],
      plataformaCampana: (() => {
        const s = data.plataformaCampana != null ? String(data.plataformaCampana).trim() : '';
        if (!s || s === 'TODAS') return null;
        return s;
      })(),
      descripcion: data.descripcion || null,
      incluye: data.incluye || null,
      noIncluye: data.noIncluye || null,
      destinatarios: data.destinatarios || 0,
      abiertos: data.abiertos || 0,
      clicks: data.clicks || 0,
    },
  });
};

/**
 * Actualizar campaña
 */
const ALLOWED_UPDATE = new Set([
  'nombre',
  'tipo',
  'estado',
  'fechaInicio',
  'fechaFin',
  'fabricante',
  'descuentoAprobado',
  'proveedorNombre',
  'referenciaDescuento',
  'tecnologiaDescuento',
  'alimentacionAudifono',
  'validezCantidadAudifonos',
  'aplicacionDescuento',
  'catalogProductIds',
  'plataformaCampana',
  'descripcion',
  'incluye',
  'noIncluye',
  'destinatarios',
  'abiertos',
  'clicks',
]);

const update = async (id, data) => {
  const updateData = {};
  for (const k of Object.keys(data || {})) {
    if (!ALLOWED_UPDATE.has(k)) continue;
    updateData[k] = data[k];
  }

  if (updateData.fechaInicio) {
    updateData.fechaInicio = new Date(updateData.fechaInicio);
  }

  if (updateData.fechaFin) {
    updateData.fechaFin = new Date(updateData.fechaFin);
  }

  if (updateData.catalogProductIds !== undefined) {
    updateData.catalogProductIds = Array.isArray(updateData.catalogProductIds)
      ? updateData.catalogProductIds.map((x) => String(x || '').trim()).filter(Boolean)
      : [];
  }

  if (updateData.plataformaCampana !== undefined) {
    const s = updateData.plataformaCampana == null ? '' : String(updateData.plataformaCampana).trim();
    updateData.plataformaCampana = !s || s === 'TODAS' ? null : s;
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

/**
 * Informe: cotizaciones por marca y ventas por mes y marca para una campaña.
 */
const getStats = async (id) => {
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return null;

  const quotes = await prisma.quote.findMany({
    where: { campaignId: id },
    select: { id: true, marca: true, valorTotal: true, estado: true, createdAt: true },
  });

  const sales = await prisma.sale.findMany({
    where: { campaignId: id },
    select: { id: true, marca: true, valorTotal: true, fechaVenta: true },
  });

  const quotesByMarca = {};
  for (const q of quotes) {
    const m = (q.marca || 'Sin marca').trim() || 'Sin marca';
    if (!quotesByMarca[m]) {
      quotesByMarca[m] = { marca: m, count: 0, totalValor: 0 };
    }
    quotesByMarca[m].count += 1;
    quotesByMarca[m].totalValor += Number(q.valorTotal) || 0;
  }

  const salesByMonthAndMarca = {};
  for (const s of sales) {
    const d = new Date(s.fechaVenta);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const m = (s.marca || 'Sin marca').trim() || 'Sin marca';
    const key = `${ym}||${m}`;
    if (!salesByMonthAndMarca[key]) {
      salesByMonthAndMarca[key] = { yearMonth: ym, marca: m, count: 0, totalValor: 0 };
    }
    salesByMonthAndMarca[key].count += 1;
    salesByMonthAndMarca[key].totalValor += Number(s.valorTotal) || 0;
  }

  const salesList = Object.values(salesByMonthAndMarca).sort((a, b) => {
    const c = a.yearMonth.localeCompare(b.yearMonth);
    if (c !== 0) return c;
    return a.marca.localeCompare(b.marca);
  });

  return {
    campaign,
    quotesByMarca: Object.values(quotesByMarca).sort((a, b) => a.marca.localeCompare(b.marca)),
    quotesTotal: quotes.length,
    salesByMonthAndMarca: salesList,
    salesTotal: sales.length,
  };
};

/**
 * Panel CRM: KPI globales y desglose por alimentación, recargable y categoría de venta.
 */
const getDashboard = async () => {
  const now = new Date();

  const campaignVigenteActiva = {
    estado: 'ACTIVA',
    fechaInicio: { lte: now },
    fechaFin: { gte: now },
  };

  const pastCampaignWhere = {
    OR: [
      { estado: { in: ['FINALIZADA', 'PAUSADA'] } },
      { fechaFin: { lt: now } },
    ],
  };

  const [
    activeCampaignsCount,
    activeQuotesCount,
    salesTotalCount,
    pastCampaignQuotesCount,
    quotesActiveWithCampaignCount,
    ventasConCampañaTotal,
    activeCampaignsRows,
    qByRecAll,
    qByRecActive,
    qByEstado,
    sByCat,
  ] = await Promise.all([
    prisma.campaign.count({ where: campaignVigenteActiva }),
    prisma.quote.count({ where: { estado: { in: ['PENDING', 'APPROVED'] } } }),
    prisma.sale.count(),
    prisma.quote.count({
      where: {
        campaignId: { not: null },
        campaign: pastCampaignWhere,
      },
    }),
    prisma.quote.count({
      where: {
        campaignId: { not: null },
        estado: { in: ['PENDING', 'APPROVED'] },
      },
    }),
    prisma.sale.count({ where: { campaignId: { not: null } } }),
    prisma.campaign.findMany({
      where: campaignVigenteActiva,
      select: { alimentacionAudifono: true, tipo: true },
    }),
    prisma.quote.groupBy({
      by: ['recargable'],
      where: { campaignId: { not: null } },
      _count: { _all: true },
    }),
    prisma.quote.groupBy({
      by: ['recargable'],
      where: {
        campaignId: { not: null },
        estado: { in: ['PENDING', 'APPROVED'] },
      },
      _count: { _all: true },
    }),
    prisma.quote.groupBy({
      by: ['estado'],
      where: { campaignId: { not: null } },
      _count: { _all: true },
    }),
    prisma.sale.groupBy({
      by: ['categoria'],
      where: { campaignId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const campaignsActiveByAlimentacion = {
    BATERIA: 0,
    RECARGABLE: 0,
    AMBOS: 0,
    SIN_ESPECIFICAR: 0,
  };
  let campanasTipoAccesorio = 0;
  let campanasTipoOtros = 0;
  for (const c of activeCampaignsRows) {
    const a = String(c.alimentacionAudifono || '').trim().toUpperCase();
    if (a === 'BATERIA') campaignsActiveByAlimentacion.BATERIA += 1;
    else if (a === 'RECARGABLE') campaignsActiveByAlimentacion.RECARGABLE += 1;
    else if (a === 'AMBOS') campaignsActiveByAlimentacion.AMBOS += 1;
    else campaignsActiveByAlimentacion.SIN_ESPECIFICAR += 1;

    const t = String(c.tipo || '').toLowerCase();
    if (t.includes('accesorio')) campanasTipoAccesorio += 1;
    else campanasTipoOtros += 1;
  }

  const toMap = (rows) => {
    const o = {};
    for (const r of rows) {
      const k = String(r.recargable ?? 'NO').trim() || 'NO';
      o[k] = (o[k] || 0) + r._count._all;
    }
    return o;
  };

  const cotizacionesConCampañaPorRecargable = toMap(qByRecAll);
  const cotizacionesActivasConCampañaPorRecargable = toMap(qByRecActive);

  const cotizacionesConCampañaPorEstado = {};
  for (const r of qByEstado) {
    cotizacionesConCampañaPorEstado[r.estado] = r._count._all;
  }

  const ventasConCampañaPorCategoria = { HEARING_AID: 0, ACCESSORY: 0, SERVICE: 0 };
  for (const r of sByCat) {
    const k = r.categoria;
    if (ventasConCampañaPorCategoria[k] !== undefined) {
      ventasConCampañaPorCategoria[k] = r._count._all;
    }
  }

  return {
    generatedAt: now.toISOString(),
    summary: {
      activeCampaignsCount,
      activeQuotesCount,
      salesTotalCount,
      pastCampaignQuotesCount,
      quotesActiveWithCampaignCount,
      ventasConCampañaTotal,
    },
    campaignsActiveByAlimentacion,
    campaignsActiveTipo: {
      accesorioPorTipoCampana: campanasTipoAccesorio,
      resto: campanasTipoOtros,
    },
    cotizacionesConCampañaPorRecargable,
    cotizacionesActivasConCampañaPorRecargable,
    cotizacionesConCampañaPorEstado,
    ventasConCampañaPorCategoria,
  };
};

module.exports = {
  getAll,
  getActive,
  getById,
  getStats,
  getDashboard,
  create,
  update,
  remove,
};
