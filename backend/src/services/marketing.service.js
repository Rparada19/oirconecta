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
const { campaignMatchesPath } = require('../utils/pageTypes');

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

// Lista de marcas (para selector frontend)
const BRANDS = [
  'Phonak', 'Oticon', 'Signia', 'ReSound', 'Widex', 'Starkey', 'Unitron',
  'Bernafon', 'Audio Service', 'Rexton', 'Hansaton', 'Sonic', 'Philips HearLink',
  'Cochlear', 'Advanced Bionics', 'MED-EL', 'Oticon Medical', 'Neurelec', 'SYNCHRONY',
].sort((a, b) => a.localeCompare(b, 'es'));

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
  const { contacts, activities, ...rest } = data || {};
  return prisma.marketingAdvertiser.create({
    data: {
      ...rest,
      ...(Array.isArray(contacts) && contacts.length > 0 && {
        contacts: { create: contacts.map((c) => ({
          nombre: c.nombre, cargo: c.cargo, email: c.email,
          telefono: c.telefono, esPrincipal: !!c.esPrincipal,
        })) },
      }),
    },
    include: { contacts: true },
  });
}

/** Detalle completo del anunciante con relaciones y resumen de campañas. */
async function getAdvertiserById(id) {
  const adv = await prisma.marketingAdvertiser.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: [{ esPrincipal: 'desc' }, { createdAt: 'asc' }] },
      activities: { orderBy: { fecha: 'desc' }, take: 50 },
      campaigns: {
        orderBy: { startDate: 'desc' },
        include: { metrics: { select: { impressions: true, clicks: true, leads: true } } },
      },
    },
  });
  if (!adv) return null;

  const totalInvertidoCOP = adv.campaigns.reduce((s, c) => s + (c.priceCOP || 0), 0);
  const activas = adv.campaigns.filter((c) => c.isActive && c.status === 'ACTIVE').length;

  const totalImp = adv.campaigns.reduce(
    (s, c) => s + c.metrics.reduce((a, m) => a + (m.impressions || 0), 0), 0);
  const totalClk = adv.campaigns.reduce(
    (s, c) => s + c.metrics.reduce((a, m) => a + (m.clicks || 0), 0), 0);
  const ctrGlobal = totalImp > 0 ? Math.round((totalClk / totalImp) * 10000) / 100 : 0;

  // Strip metrics from campaigns for transport (ya agregamos)
  adv.campaigns = adv.campaigns.map(({ metrics, ...c }) => c);

  return {
    ...adv,
    resumen: {
      totalCampanas: adv.campaigns.length,
      campanasActivas: activas,
      totalInvertidoCOP,
      totalImpresiones: totalImp,
      totalClics: totalClk,
      ctrGlobal,
    },
  };
}
async function updateAdvertiser(id, data) {
  // Ignora relaciones (contactos/actividades) que se manejan en sus propios endpoints
  const { contacts, activities, campaigns, _count, ...clean } = data || {};
  if (clean.presupuestoAnualCOP !== undefined) {
    clean.presupuestoAnualCOP = clean.presupuestoAnualCOP === null || clean.presupuestoAnualCOP === ''
      ? null : parseInt(clean.presupuestoAnualCOP);
  }
  if (clean.nextFollowUpAt) clean.nextFollowUpAt = new Date(clean.nextFollowUpAt);
  return prisma.marketingAdvertiser.update({
    where: { id }, data: clean,
    include: { contacts: true },
  });
}

// ─── Contactos del anunciante ───
async function addContact(advertiserId, data) {
  return prisma.marketingAdvertiserContact.create({
    data: { advertiserId, ...data },
  });
}
async function updateContact(contactId, data) {
  return prisma.marketingAdvertiserContact.update({ where: { id: contactId }, data });
}
async function deleteContact(contactId) {
  return prisma.marketingAdvertiserContact.delete({ where: { id: contactId } });
}

// ─── Actividades / timeline ───
async function addActivity(advertiserId, data, autorEmail) {
  return prisma.marketingAdvertiserActivity.create({
    data: {
      advertiserId,
      tipo: data.tipo,
      descripcion: data.descripcion,
      fecha: data.fecha ? new Date(data.fecha) : new Date(),
      reminderAt: data.reminderAt ? new Date(data.reminderAt) : null,
      autorEmail,
    },
  });
}
async function deleteActivity(activityId) {
  return prisma.marketingAdvertiserActivity.delete({ where: { id: activityId } });
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
    pagesConfig = null, positionConfig = null,
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
      pagesConfig, positionConfig,
      status: 'DRAFT', isActive: false,
    },
    include: { advertiser: true },
  });
}

async function updateCampaign(id, data) {
  // Si cambia nombre, no regenero slug (rompe URLs); slug es estable.
  const allowed = ['nombre', 'startDate', 'endDate', 'priceCOP', 'destinationUrl',
    'internalNotes', 'status', 'isActive', 'abTestMode', 'autoOptimize', 'config',
    'pagesConfig', 'positionConfig',
    'creativeUrl', 'creativePublicId', 'creativeType', 'creativeWidth', 'creativeHeight',
    'creativeUrlMobile', 'creativeMobilePublicId', 'creativeMobileWidth', 'creativeMobileHeight'];
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
  const now = new Date();
  return prisma.marketingCampaign.update({
    where: { id },
    data: {
      isActive: !!isActive,
      status: isActive ? 'ACTIVE' : 'PAUSED',
      ...(isActive ? { activatedAt: now } : { deactivatedAt: now }),
    },
    include: { advertiser: true },
  });
}

/**
 * Lista campañas activas de un tipo dado (uso público). Devuelve datos
 * mínimos para renderizar tarjetas en el portal sin exponer info interna.
 */
async function getActiveCampaignsByType(actionType, { limit = 12, path = null } = {}) {
  const now = new Date();
  const rows = await prisma.marketingCampaign.findMany({
    where: {
      actionType,
      isActive: true,
      status: 'ACTIVE',
      startDate: { lte: now },
      endDate: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { advertiser: { select: { nombre: true, logoUrl: true, sitioWeb: true } } },
  });
  const filtered = path ? rows.filter((c) => campaignMatchesPath(c, path)) : rows;
  return filtered.map((c) => ({
    creativeUrlMobile: c.creativeUrlMobile,
    creativeMobileWidth: c.creativeMobileWidth,
    creativeMobileHeight: c.creativeMobileHeight,
    id: c.id,
    slug: c.slug,
    actionType: c.actionType,
    nombre: c.nombre,
    creativeUrl: c.creativeUrl,
    creativeType: c.creativeType,
    destinationUrl: c.destinationUrl,
    positionConfig: c.positionConfig,
    config: c.config,
    advertiser: c.advertiser,
    utm: { source: c.utmSource, medium: c.utmMedium, campaign: c.utmCampaign },
  }));
}

async function deleteCampaign(id) {
  return prisma.marketingCampaign.delete({ where: { id } });
}

/**
 * Devuelve la campaña activa para un tipo de acción dado (uso público).
 * Si hay varias (caso raro), retorna la más reciente.
 */
async function getActiveCampaignByActionType(actionType, path = null) {
  const now = new Date();
  // Si nos pasan path, buscamos varios candidatos y devolvemos el primero que
  // cumpla con su pagesConfig. Si no, devolvemos la más reciente.
  const candidates = await prisma.marketingCampaign.findMany({
    where: {
      actionType,
      isActive: true,
      status: 'ACTIVE',
      startDate: { lte: now },
      endDate: { gte: now },
      creativeUrl: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  const camp = path
    ? candidates.find((c) => campaignMatchesPath(c, path))
    : candidates[0];
  if (!camp) return null;
  return {
    id: camp.id,
    slug: camp.slug,
    actionType: camp.actionType,
    creativeUrl: camp.creativeUrl,
    creativeType: camp.creativeType,
    creativeWidth: camp.creativeWidth,
    creativeHeight: camp.creativeHeight,
    creativeUrlMobile: camp.creativeUrlMobile,
    creativeMobileWidth: camp.creativeMobileWidth,
    creativeMobileHeight: camp.creativeMobileHeight,
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

// Cache simple en memoria para analytics (~30s) — evita recalcular agregados
// pesados en cada navegación al dashboard. Reset al expirar.
let _analyticsCache = { ts: 0, data: null };
const ANALYTICS_TTL_MS = 30 * 1000;

/**
 * Analytics ejecutivo: panel de "mejores/peores campañas" y agregados
 * que ayudan a tomar decisiones (cuáles renovar, cuáles renegociar).
 */
async function getCampaignAnalytics() {
  if (_analyticsCache.data && (Date.now() - _analyticsCache.ts) < ANALYTICS_TTL_MS) {
    return _analyticsCache.data;
  }
  const data = await _computeCampaignAnalytics();
  _analyticsCache = { ts: Date.now(), data };
  return data;
}

async function _computeCampaignAnalytics() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    createdThisMonth,
    activatedThisMonth,
    expiredThisMonth,
    allCampaignsWithMetrics,
    byActionTypeAgg,
    topAdvertisers,
  ] = await Promise.all([
    prisma.marketingCampaign.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.marketingCampaign.count({ where: { activatedAt: { gte: monthStart } } }),
    prisma.marketingCampaign.count({
      where: { endDate: { gte: monthStart, lt: now }, isActive: false },
    }),
    prisma.marketingCampaign.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: monthStart },
      },
      include: {
        advertiser: { select: { nombre: true } },
        metrics: { where: { date: { gte: monthStart } } },
      },
    }),
    prisma.marketingCampaign.groupBy({
      by: ['actionType'],
      where: { isActive: true, status: 'ACTIVE' },
      _count: { _all: true },
      _sum: { priceCOP: true },
    }),
    prisma.marketingCampaign.groupBy({
      by: ['advertiserId'],
      where: { startDate: { gte: monthStart } },
      _sum: { priceCOP: true },
      _count: { _all: true },
      orderBy: { _sum: { priceCOP: 'desc' } },
      take: 5,
    }),
  ]);

  // Enriquecer campañas con totales del mes y CTR
  const enriched = allCampaignsWithMetrics.map((c) => {
    const imp = c.metrics.reduce((a, m) => a + (m.impressions || 0), 0);
    const clk = c.metrics.reduce((a, m) => a + (m.clicks || 0), 0);
    const led = c.metrics.reduce((a, m) => a + (m.leads || 0), 0);
    return {
      id: c.id,
      nombre: c.nombre,
      actionType: c.actionType,
      advertiserNombre: c.advertiser?.nombre,
      priceCOP: c.priceCOP,
      isActive: c.isActive,
      status: c.status,
      monthImpressions: imp,
      monthClicks: clk,
      monthLeads: led,
      monthCTR: imp > 0 ? Math.round((clk / imp) * 10000) / 100 : 0,
      // CPL para ranking: COP por lead. null si sin leads.
      cpl: led > 0 ? Math.round(c.priceCOP / led) : null,
    };
  });

  const withMetrics = enriched.filter((c) => c.monthImpressions > 0);
  const withoutMetrics = enriched.filter((c) => c.monthImpressions === 0);

  // Top CTR: exige al menos 10 impresiones para que el % sea significativo
  const topByCTR = [...withMetrics]
    .filter((c) => c.monthImpressions >= 10)
    .sort((a, b) => b.monthCTR - a.monthCTR).slice(0, 5);
  const bottomByCTR = [...withMetrics]
    .filter((c) => c.monthImpressions >= 50) // mínimo significativo
    .sort((a, b) => a.monthCTR - b.monthCTR).slice(0, 5);
  const topByImpressions = [...enriched].sort((a, b) => b.monthImpressions - a.monthImpressions).slice(0, 5);
  const topByLeads = [...enriched].sort((a, b) => b.monthLeads - a.monthLeads)
    .filter((c) => c.monthLeads > 0).slice(0, 5);

  // Promedios
  const totalImp = enriched.reduce((a, c) => a + c.monthImpressions, 0);
  const totalClk = enriched.reduce((a, c) => a + c.monthClicks, 0);
  const totalLed = enriched.reduce((a, c) => a + c.monthLeads, 0);
  const totalInversion = enriched.reduce((a, c) => a + (c.priceCOP || 0), 0);
  const ctrPromedio = totalImp > 0 ? Math.round((totalClk / totalImp) * 10000) / 100 : 0;
  const cplPromedio = totalLed > 0 ? Math.round(totalInversion / totalLed) : null;
  const conversion = totalClk > 0 ? Math.round((totalLed / totalClk) * 10000) / 100 : 0;

  // Distribución por actionType
  const distribucion = byActionTypeAgg.map((b) => ({
    actionType: b.actionType,
    label: BY_CODE[b.actionType]?.label || b.actionType,
    activas: b._count._all,
    inversionCOP: b._sum.priceCOP || 0,
  })).sort((a, b) => b.activas - a.activas);

  // Top anunciantes con nombres
  const advIds = topAdvertisers.map((a) => a.advertiserId);
  const advs = advIds.length === 0 ? [] : await prisma.marketingAdvertiser.findMany({
    where: { id: { in: advIds } },
    select: { id: true, nombre: true, marcaPrincipal: true },
  });
  const advsBy = Object.fromEntries(advs.map((a) => [a.id, a]));
  const topAnunciantes = topAdvertisers.map((t) => ({
    advertiserId: t.advertiserId,
    nombre: advsBy[t.advertiserId]?.nombre,
    marcaPrincipal: advsBy[t.advertiserId]?.marcaPrincipal,
    campanasMes: t._count._all,
    inversionMesCOP: t._sum.priceCOP || 0,
  }));

  return {
    resumen: {
      campanasCreadasMes: createdThisMonth,
      campanasActivadasMes: activatedThisMonth,
      campanasVencidasMes: expiredThisMonth,
      campanasConMetricas: withMetrics.length,
      campanasSinMetricas: withoutMetrics.length,
      promedioImpresionesPorCampana: enriched.length > 0 ? Math.round(totalImp / enriched.length) : 0,
      ctrPromedio,
      cplPromedio,
      conversion,
      inversionTotalCOP: totalInversion,
      // Totales del mes exponen "hubo tráfico" al frontend (distinguir 0 vs "sin data")
      totalImpresionesMes: totalImp,
      totalClicsMes: totalClk,
      totalLeadsMes: totalLed,
    },
    rankings: { topByCTR, bottomByCTR, topByImpressions, topByLeads },
    distribucion,
    topAnunciantes,
  };
}

// ═══════════════════════════════════════════════════════════════════
// D5 — Métricas full por campaña individual (cruce MarketingMetric +
// analytics_events con campaignId → desglose por ciudad, device, fuente,
// tendencia diaria + derivados CPM/CPC/CPL/ritmo/proyección).
// ═══════════════════════════════════════════════════════════════════
async function getCampaignFullMetrics(campaignId, { from, to } = {}) {
  const camp = await prisma.marketingCampaign.findUnique({
    where: { id: campaignId },
    include: {
      advertiser: { select: { id: true, nombre: true, marcaPrincipal: true } },
      metrics: { orderBy: { date: 'asc' } },
    },
  });
  if (!camp) throw Object.assign(new Error('Campaña no encontrada'), { status: 404 });

  const now = new Date();
  const rangeFrom = from ? new Date(from) : new Date(camp.startDate);
  const rangeTo = to ? new Date(to) : now;

  // Agregados MarketingMetric del rango
  const metricsInRange = (camp.metrics || []).filter((m) => m.date >= rangeFrom && m.date <= rangeTo);
  const totalImp = metricsInRange.reduce((a, m) => a + (m.impressions || 0), 0);
  const totalClk = metricsInRange.reduce((a, m) => a + (m.clicks || 0), 0);
  const totalLed = metricsInRange.reduce((a, m) => a + (m.leads || 0), 0);

  // Duración de campaña
  const daysTotal = Math.max(1, Math.round((camp.endDate - camp.startDate) / 86400000));
  const daysElapsed = Math.max(0, Math.round((Math.min(now, camp.endDate) - camp.startDate) / 86400000));
  const daysRemaining = Math.max(0, Math.round((camp.endDate - now) / 86400000));
  const progressPct = Math.round((daysElapsed / daysTotal) * 100);

  // KPIs derivados
  const ctr = totalImp > 0 ? (totalClk / totalImp) * 100 : 0;
  const conversion = totalClk > 0 ? (totalLed / totalClk) * 100 : 0;
  const cpm = totalImp > 0 ? (camp.priceCOP / totalImp) * 1000 : null;
  const cpc = totalClk > 0 ? camp.priceCOP / totalClk : null;
  const cpl = totalLed > 0 ? camp.priceCOP / totalLed : null;
  const dailyPace = daysElapsed > 0 ? Math.round(totalImp / daysElapsed) : 0;
  const projectedImp = daysElapsed > 0 ? Math.round(dailyPace * daysTotal) : 0;

  // Tendencia diaria completa (MarketingMetric)
  const dailyTrend = metricsInRange.map((m) => ({
    date: m.date.toISOString().slice(0, 10),
    impressions: m.impressions || 0,
    clicks: m.clicks || 0,
    leads: m.leads || 0,
  }));

  // Segmentación por ciudad/device/fuente desde analytics_events
  const [byCity, byDevice, bySource, uniqueVisitors] = await Promise.all([
    prisma.$queryRawUnsafe(`
      SELECT
        COALESCE("city", '(Desconocida)') AS city,
        COUNT(*) FILTER (WHERE "eventType" = 'ad_impression')::int AS impressions,
        COUNT(*) FILTER (WHERE "eventType" = 'ad_click')::int      AS clicks
      FROM "analytics_events"
      WHERE "campaignId" = $1 AND "timestamp" BETWEEN $2 AND $3
      GROUP BY 1
      ORDER BY 2 DESC
      LIMIT 20
    `, campaignId, rangeFrom, rangeTo),
    prisma.$queryRawUnsafe(`
      SELECT
        COALESCE("device", '(otros)') AS device,
        COUNT(*) FILTER (WHERE "eventType" = 'ad_impression')::int AS impressions,
        COUNT(*) FILTER (WHERE "eventType" = 'ad_click')::int      AS clicks
      FROM "analytics_events"
      WHERE "campaignId" = $1 AND "timestamp" BETWEEN $2 AND $3
      GROUP BY 1
      ORDER BY 2 DESC
    `, campaignId, rangeFrom, rangeTo),
    prisma.$queryRawUnsafe(`
      SELECT
        CASE
          WHEN LOWER(COALESCE("utmSource", '')) IN ('meta','facebook','ig','instagram') THEN 'Meta Ads'
          WHEN LOWER(COALESCE("utmSource", '')) IN ('google','gads','adwords')          THEN 'Google Ads'
          WHEN COALESCE("utmSource", '') = 'oirconecta'                                  THEN 'Interna'
          WHEN LOWER(COALESCE("referrer", '')) LIKE '%google.%'                          THEN 'Orgánico Google'
          WHEN LOWER(COALESCE("referrer", '')) LIKE '%facebook.com%'                     THEN 'Facebook'
          WHEN LOWER(COALESCE("referrer", '')) LIKE '%instagram.com%'                    THEN 'Instagram'
          WHEN LOWER(COALESCE("referrer", '')) LIKE '%whatsapp.com%'                     THEN 'WhatsApp'
          WHEN COALESCE("referrer", '') = ''                                             THEN 'Directo'
          ELSE 'Referido'
        END AS source,
        COUNT(*) FILTER (WHERE "eventType" = 'ad_impression')::int AS impressions,
        COUNT(*) FILTER (WHERE "eventType" = 'ad_click')::int      AS clicks
      FROM "analytics_events"
      WHERE "campaignId" = $1 AND "timestamp" BETWEEN $2 AND $3
      GROUP BY 1
      ORDER BY 2 DESC
    `, campaignId, rangeFrom, rangeTo),
    prisma.$queryRawUnsafe(`
      SELECT COUNT(DISTINCT "visitorId")::int AS c
      FROM "analytics_events"
      WHERE "campaignId" = $1 AND "eventType" = 'ad_impression'
        AND "timestamp" BETWEEN $2 AND $3
    `, campaignId, rangeFrom, rangeTo),
  ]);

  // Alcance y frecuencia
  const reach = uniqueVisitors[0]?.c || 0;
  const frequency = reach > 0 ? Math.round((totalImp / reach) * 100) / 100 : 0;

  return {
    campaign: {
      id: camp.id, nombre: camp.nombre, slug: camp.slug, actionType: camp.actionType,
      status: camp.status, isActive: camp.isActive, priceCOP: camp.priceCOP,
      startDate: camp.startDate, endDate: camp.endDate,
      destinationUrl: camp.destinationUrl,
      creativeUrl: camp.creativeUrl,
      advertiser: camp.advertiser,
    },
    range: { from: rangeFrom, to: rangeTo },
    resumen: {
      impressions: totalImp,
      clicks: totalClk,
      leads: totalLed,
      ctr: Math.round(ctr * 100) / 100,
      conversion: Math.round(conversion * 100) / 100,
      cpm: cpm != null ? Math.round(cpm) : null,
      cpc: cpc != null ? Math.round(cpc) : null,
      cpl: cpl != null ? Math.round(cpl) : null,
      inversionTotalCOP: camp.priceCOP,
      reach,
      frequency,
    },
    tiempo: {
      daysTotal, daysElapsed, daysRemaining, progressPct,
      dailyPace, projectedImpressions: projectedImp,
      finished: now > camp.endDate,
    },
    dailyTrend,
    byCity, byDevice, bySource,
  };
}

module.exports = {
  slugify,
  computeUtms,
  BRANDS,
  listAdvertisers,
  createAdvertiser,
  updateAdvertiser,
  deleteAdvertiser,
  getAdvertiserById,
  addContact,
  updateContact,
  deleteContact,
  addActivity,
  deleteActivity,
  listCampaigns,
  createCampaign,
  updateCampaign,
  toggleCampaignActive,
  deleteCampaign,
  getDashboardStats,
  getCampaignAnalytics,
  getCampaignFullMetrics,
  getActiveCampaignByActionType,
  getActiveCampaignsByType,
  recordEvent,
};
