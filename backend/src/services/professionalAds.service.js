/**
 * Marketplace publicitario del profesional.
 *
 * El profesional del directorio actúa como anunciante:
 *  - navega un subconjunto del catálogo (los formatos que aplican a "perfil")
 *  - solicita activación de un producto (crea/actualiza MarketingAdvertiser
 *    vinculado a su profileId, deja una actividad tipo=SOLICITUD)
 *  - un admin luego confirma cotización, crea la MarketingCampaign real
 *  - el profesional ve las métricas agregadas de sus campañas
 */

const { PrismaClient } = require('@prisma/client');
const { CATALOG, BY_CODE } = require('../config/marketingCatalog');

const prisma = new PrismaClient();

/** Códigos del catálogo que aplican a la venta a profesionales. */
const PROFESSIONAL_PRODUCT_CODES = [
  'SEARCH_DESTACADO',
  'SPONSORED_PROFESSIONAL',
  'SEARCH_INLINE_AD',
  'BANNER_HERO',
  'BANNER_SIDEBAR',
  'BLOG_PATROCINADOR',
];

function listProducts() {
  return PROFESSIONAL_PRODUCT_CODES
    .map((code) => BY_CODE[code])
    .filter(Boolean)
    .filter((p) => p.disponible !== false);
}

/**
 * Devuelve (o crea) el MarketingAdvertiser vinculado a este profileId.
 * Se llena con datos básicos del DirectoryProfile+DirectoryAccount.
 */
async function ensureAdvertiserForProfile(profileId) {
  const existing = await prisma.marketingAdvertiser.findUnique({ where: { profileId } });
  if (existing) return existing;

  const profile = await prisma.directoryProfile.findUnique({
    where: { id: profileId },
    include: { account: true, city: true },
  });
  if (!profile) throw new Error('Perfil no encontrado');

  return prisma.marketingAdvertiser.create({
    data: {
      profileId,
      nombre: profile.account?.nombre || profile.nombreConsultorio || 'Profesional del directorio',
      tipo: 'PROFESIONAL',
      contactoNombre: profile.account?.nombre || null,
      contactoEmail: profile.emailPublico || profile.account?.email || null,
      contactoTelefono: profile.telefonoPublico || profile.whatsappPublico || null,
      ciudad: profile.city?.nombre || null,
      pipelineStage: 'PROSPECT',
    },
  });
}

/** El profesional solicita activación de un producto. */
async function requestProduct(profileId, { productCode, notas = '' }) {
  const product = BY_CODE[productCode];
  if (!product || !PROFESSIONAL_PRODUCT_CODES.includes(productCode)) {
    throw new Error('Producto inválido');
  }
  const advertiser = await ensureAdvertiserForProfile(profileId);

  const activity = await prisma.marketingAdvertiserActivity.create({
    data: {
      advertiserId: advertiser.id,
      tipo: 'NOTA',
      descripcion: `SOLICITUD desde portal profesional: ${product.label} (${product.code}). ${notas || ''}`.trim(),
      autorEmail: null,
    },
  });

  return { advertiser, activity, product };
}

/** Lista campañas de este profesional (advertiser vinculado a su perfil). */
async function listMyCampaigns(profileId) {
  const advertiser = await prisma.marketingAdvertiser.findUnique({ where: { profileId } });
  if (!advertiser) return [];

  const campaigns = await prisma.marketingCampaign.findMany({
    where: { advertiserId: advertiser.id },
    orderBy: { createdAt: 'desc' },
  });
  return campaigns.map((c) => ({
    ...c,
    actionLabel: BY_CODE[c.actionType]?.label || c.actionType,
  }));
}

/** Métricas agregadas de todas las campañas del profesional (últimos 30 días). */
async function getMyMetrics(profileId, { days = 30 } = {}) {
  const advertiser = await prisma.marketingAdvertiser.findUnique({ where: { profileId } });
  if (!advertiser) {
    return { totals: { impressions: 0, clicks: 0, leads: 0, ctr: 0 }, byCampaign: [], activeCount: 0 };
  }

  const campaigns = await prisma.marketingCampaign.findMany({
    where: { advertiserId: advertiser.id },
    select: { id: true, nombre: true, actionType: true, status: true, isActive: true },
  });
  if (!campaigns.length) {
    return { totals: { impressions: 0, clicks: 0, leads: 0, ctr: 0 }, byCampaign: [], activeCount: 0 };
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const metrics = await prisma.marketingMetric.groupBy({
    by: ['campaignId'],
    where: { campaignId: { in: campaigns.map((c) => c.id) }, date: { gte: since } },
    _sum: { impressions: true, clicks: true, leads: true },
  });
  const byId = new Map(metrics.map((m) => [m.campaignId, m._sum]));

  const byCampaign = campaigns.map((c) => {
    const s = byId.get(c.id) || { impressions: 0, clicks: 0, leads: 0 };
    const impressions = s.impressions || 0;
    const clicks = s.clicks || 0;
    return {
      id: c.id,
      nombre: c.nombre,
      actionType: c.actionType,
      actionLabel: BY_CODE[c.actionType]?.label || c.actionType,
      status: c.status,
      isActive: c.isActive,
      impressions,
      clicks,
      leads: s.leads || 0,
      ctr: impressions > 0 ? +(100 * clicks / impressions).toFixed(2) : 0,
    };
  });

  const totals = byCampaign.reduce(
    (acc, r) => ({
      impressions: acc.impressions + r.impressions,
      clicks: acc.clicks + r.clicks,
      leads: acc.leads + r.leads,
    }),
    { impressions: 0, clicks: 0, leads: 0 }
  );
  totals.ctr = totals.impressions > 0 ? +(100 * totals.clicks / totals.impressions).toFixed(2) : 0;

  return {
    totals,
    byCampaign,
    activeCount: byCampaign.filter((c) => c.isActive).length,
  };
}

module.exports = {
  PROFESSIONAL_PRODUCT_CODES,
  listProducts,
  ensureAdvertiserForProfile,
  requestProduct,
  listMyCampaigns,
  getMyMetrics,
};
