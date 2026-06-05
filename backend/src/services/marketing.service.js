/**
 * Marketing & Ventas — M1 (cimientos).
 *
 * Responsabilidades en M1:
 *  - CRUD anunciantes
 *  - CRUD campañas con auto-generación de slug y UTMs
 *  - KPIs agregados básicos (sin tracking todavía)
 *
 * M2 añadirá: tracking impresiones/clics, distribución server-side de variantes.
 * M3 añadirá: A/B testing con cron, métricas por variante.
 */

const { PrismaClient } = require('@prisma/client');
const { CATALOG, BY_CODE } = require('../config/marketingCatalog');

const prisma = new PrismaClient();

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar tildes
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

async function uniqueSlug(base) {
  let slug = base;
  let i = 2;
  while (await prisma.marketingCampaign.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

/** Calcula UTMs desde nombre + tipo de acción. */
function computeUtms({ slug, actionType, especialidad }) {
  return {
    utmSource:   'oirconecta',
    utmMedium:   (actionType || '').toLowerCase(),
    utmCampaign: slug,
    utmContent:  null,
    utmTerm:     especialidad || null,
  };
}

// ─── Anunciantes ───
async function listAdvertisers({ q, limit = 100, offset = 0 } = {}) {
  const where = q
    ? { OR: [
        { nombre: { contains: q, mode: 'insensitive' } },
        { contactoEmail: { contains: q, mode: 'insensitive' } },
        { nit: { contains: q, mode: 'insensitive' } },
      ] }
    : {};
  const [items, total] = await Promise.all([
    prisma.marketingAdvertiser.findMany({
      where, orderBy: { createdAt: 'desc' },
      take: parseInt(limit), skip: parseInt(offset),
      include: { _count: { select: { campaigns: true } } },
    }),
    prisma.marketingAdvertiser.count({ where }),
  ]);
  return { items, total };
}

async function createAdvertiser(data) {
  return prisma.marketingAdvertiser.create({ data });
}
async function updateAdvertiser(id, data) {
  return prisma.marketingAdvertiser.update({ where: { id }, data });
}
async function deleteAdvertiser(id) {
  // Restrict: si tiene campañas, falla y debe responderse claro.
  return prisma.marketingAdvertiser.delete({ where: { id } });
}

// ─── Campañas ───
async function listCampaigns({ q, advertiserId, actionType, status, isActive, limit = 100, offset = 0 } = {}) {
  const where = {};
  if (advertiserId) where.advertiserId = advertiserId;
  if (actionType) where.actionType = actionType;
  if (status) where.status = status;
  if (isActive !== undefined && isActive !== '') where.isActive = isActive === 'true' || isActive === true;
  if (q) {
    where.OR = [
      { nombre: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.marketingCampaign.findMany({
      where, orderBy: { createdAt: 'desc' },
      take: parseInt(limit), skip: parseInt(offset),
      include: { advertiser: { select: { id: true, nombre: true, tipo: true } } },
    }),
    prisma.marketingCampaign.count({ where }),
  ]);
  // Métricas del mes en curso por campaña (1 query agregada)
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const metrics = items.length === 0 ? [] : await prisma.marketingMetric.groupBy({
    by: ['campaignId'],
    where: { campaignId: { in: items.map((c) => c.id) }, date: { gte: monthStart } },
    _sum: { impressions: true, clicks: true, leads: true },
  });
  const metricsBy = Object.fromEntries(metrics.map((m) => [m.campaignId, m._sum]));

  const enriched = items.map((c) => {
    const m = metricsBy[c.id] || {};
    const imp = m.impressions || 0;
    const clk = m.clicks || 0;
    return {
      ...c,
      actionLabel: BY_CODE[c.actionType]?.label || c.actionType,
      actionCategory: BY_CODE[c.actionType]?.categoria || null,
      monthImpressions: imp,
      monthClicks: clk,
      monthLeads: m.leads || 0,
      monthCTR: imp > 0 ? Math.round((clk / imp) * 10000) / 100 : 0,
    };
  });
  return { items: enriched, total };
}

async function createCampaign(input) {
  const {
    advertiserId, nombre, actionType,
    startDate, endDate, priceCOP = 0,
    destinationUrl, internalNotes, especialidad,
    abTestMode = false, autoOptimize = false, config = null,
  } = input;

  if (!BY_CODE[actionType]) throw new Error(`Tipo de acción inválido: ${actionType}`);

  const base = slugify(nombre);
  const slug = await uniqueSlug(base || `campaign-${Date.now()}`);
  const utms = computeUtms({ slug, actionType, especialidad });

  return prisma.marketingCampaign.create({
    data: {
      advertiserId, nombre, slug, actionType,
      startDate: new Date(startDate), endDate: new Date(endDate),
      priceCOP: parseInt(priceCOP) || 0,
      destinationUrl, internalNotes,
      ...utms,
      abTestMode, autoOptimize, config,
      status: 'DRAFT', isActive: false,
    },
    include: { advertiser: true },
  });
}

async function updateCampaign(id, data) {
  // Si cambia nombre, no regenero slug (rompe URLs); slug es estable.
  const allowed = ['nombre', 'startDate', 'endDate', 'priceCOP', 'destinationUrl',
    'internalNotes', 'status', 'isActive', 'abTestMode', 'autoOptimize', 'config',
    'creativeUrl', 'creativePublicId', 'creativeType', 'creativeWidth', 'creativeHeight'];
  const clean = {};
  for (const k of allowed) if (data[k] !== undefined) clean[k] = data[k];
  if (clean.startDate) clean.startDate = new Date(clean.startDate);
  if (clean.endDate) clean.endDate = new Date(clean.endDate);
  if (clean.priceCOP !== undefined) clean.priceCOP = parseInt(clean.priceCOP) || 0;
  return prisma.marketingCampaign.update({
    where: { id }, data: clean,
    include: { advertiser: true },
  });
}

async function toggleCampaignActive(id, isActive) {
  return prisma.marketingCampaign.update({
    where: { id },
    data: {
      isActive: !!isActive,
      // Si se enciende y está en DRAFT, pasa a ACTIVE; si se apaga manualmente, queda PAUSED.
      status: isActive ? 'ACTIVE' : 'PAUSED',
    },
    include: { advertiser: true },
  });
}

async function deleteCampaign(id) {
  return prisma.marketingCampaign.delete({ where: { id } });
}

/**
 * Devuelve la campaña activa para un tipo de acción dado (uso público).
 * Si hay varias (caso raro), retorna la más reciente.
 */
async function getActiveCampaignByActionType(actionType) {
  const now = new Date();
  const camp = await prisma.marketingCampaign.findFirst({
    where: {
      actionType,
      isActive: true,
      status: 'ACTIVE',
      startDate: { lte: now },
      endDate: { gte: now },
      creativeUrl: { not: null },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!camp) return null;
  return {
    id: camp.id,
    slug: camp.slug,
    actionType: camp.actionType,
    creativeUrl: camp.creativeUrl,
    creativeType: camp.creativeType,
    creativeWidth: camp.creativeWidth,
    creativeHeight: camp.creativeHeight,
    destinationUrl: camp.destinationUrl,
    config: camp.config,
    utm: {
      source: camp.utmSource,
      medium: camp.utmMedium,
      campaign: camp.utmCampaign,
    },
  };
}

/** Agrega impresión/clic al bucket diario UTC de la campaña. */
async function recordEvent(campaignId, type) {
  if (!campaignId || !['impression', 'click'].includes(type)) return null;
  const exists = await prisma.marketingCampaign.findUnique({ where: { id: campaignId }, select: { id: true } });
  if (!exists) return null;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const field = type === 'impression' ? 'impressions' : 'clicks';
  return prisma.marketingMetric.upsert({
    where: { campaignId_date: { campaignId, date: today } },
    create: { campaignId, date: today, [field]: 1 },
    update: { [field]: { increment: 1 } },
  });
}

// ─── KPIs ───
async function getDashboardStats() {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalAdvertisers,
    activeCampaigns,
    upcomingExpiring,
    monthIncome,
    monthMetrics,
  ] = await Promise.all([
    prisma.marketingAdvertiser.count(),
    prisma.marketingCampaign.count({ where: { isActive: true, status: 'ACTIVE' } }),
    prisma.marketingCampaign.count({
      where: { isActive: true, endDate: { lte: in30Days, gte: now } },
    }),
    prisma.marketingCampaign.aggregate({
      _sum: { priceCOP: true },
      where: { startDate: { lte: now }, endDate: { gte: monthStart } },
    }),
    prisma.marketingMetric.aggregate({
      _sum: { impressions: true, clicks: true, leads: true },
      where: { date: { gte: monthStart } },
    }),
  ]);

  const impresionesMes = monthMetrics._sum.impressions || 0;
  const clicsMes = monthMetrics._sum.clicks || 0;
  const leadsMes = monthMetrics._sum.leads || 0;
  const ctrPromedio = impresionesMes > 0
    ? Math.round((clicsMes / impresionesMes) * 10000) / 100  // 2 decimales en %
    : 0;

  return {
    anunciantesActivos: totalAdvertisers,
    campanasActivasAhora: activeCampaigns,
    campanasPorVencer30d: upcomingExpiring,
    ingresosMesCOP: monthIncome._sum.priceCOP || 0,
    impresionesMes,
    clicsMes,
    leadsMes,
    ctrPromedio,
  };
}

module.exports = {
  slugify,
  computeUtms,
  listAdvertisers,
  createAdvertiser,
  updateAdvertiser,
  deleteAdvertiser,
  listCampaigns,
  createCampaign,
  updateCampaign,
  toggleCampaignActive,
  deleteCampaign,
  getDashboardStats,
  getActiveCampaignByActionType,
  recordEvent,
};
