/**
 * PageRegistry — inventario vivo de URLs publicables del portal.
 *
 * Cada entidad (blog post, perfil de directorio, ficha de marca, etc.)
 * llama a upsert() al publicarse y a deactivate() al despublicarse.
 * Si una entidad nueva aparece sin haber pasado por el hook, el endpoint
 * /admin/pages/sync la registra retroactivamente.
 */

const { PrismaClient } = require('@prisma/client');
const { pathToPageType, PAGE_TYPES } = require('../utils/pageTypes');

const prisma = new PrismaClient();

/**
 * Devuelve el pathPattern del tipo (si está en el catálogo) o el path
 * completo como pattern (para `pagina_estatica`).
 */
function patternFor(type, path) {
  const known = {
    home: '/',
    busqueda: '/buscar',
    directorio: '/directorio',
    directorio_profesion: '/directorio/profesion/:slug',
    directorio_ciudad: '/directorio/ciudad/:slug',
    perfil_profesional: '/profesional/:id',
    blog_listado: '/blog',
    blog_categoria: '/blog/categoria/:slug',
    blog_articulo: '/blog/:slug',
    blog_tag: '/blog/tag/:tag',
    audifonos_listado: '/audifonos',
    audifonos_marca: '/audifonos/:slug',
    implantes_listado: '/implantes',
    implantes_marca: '/implantes/:slug',
    comparador: '/comparador-ia',
    marketplace: '/ecommerce',
    marketplace_producto: '/ecommerce/:slug',
    agendar: '/agendar',
    nosotros: '/nosotros',
    servicios: '/servicios',
    contacto: '/contacto',
  };
  return known[type] || path;
}

/**
 * Upsert idempotente. `pageKey` es un slug estable.
 * Si la página existe pero estaba inactiva, se reactiva.
 */
async function upsert({ type, name, path, entityId = null, entityType = null, pageKey }) {
  if (!path || !type) throw new Error('upsert requiere path y type');
  const cleanPath = String(path).split('?')[0];
  const key = pageKey || `${type}__${cleanPath.replace(/[^a-z0-9]/gi, '-').slice(0, 100)}`;
  return prisma.marketingPage.upsert({
    where: { pageKey: key },
    create: {
      pageKey: key,
      type, name, path: cleanPath,
      pathPattern: patternFor(type, cleanPath),
      entityId, entityType,
      active: true,
    },
    update: {
      type, name, path: cleanPath,
      pathPattern: patternFor(type, cleanPath),
      entityId, entityType,
      active: true,
      deactivatedAt: null,
    },
  });
}

/** Desactiva por path (mantiene la fila para histórico). */
async function deactivate(path) {
  if (!path) return null;
  const cleanPath = String(path).split('?')[0];
  return prisma.marketingPage.updateMany({
    where: { path: cleanPath, active: true },
    data: { active: false, deactivatedAt: new Date() },
  });
}

async function deactivateByEntity(entityType, entityId) {
  return prisma.marketingPage.updateMany({
    where: { entityType, entityId, active: true },
    data: { active: false, deactivatedAt: new Date() },
  });
}

/**
 * Sync completo: registra todas las entidades publicadas + páginas
 * estáticas conocidas del catálogo. Idempotente.
 */
async function syncAll() {
  let registered = 0, unchanged = 0, deactivated = 0;

  // 1) Páginas estáticas conocidas (home, nosotros, blog index, etc.)
  const STATIC = [
    { type: 'home', name: 'Inicio', path: '/' },
    { type: 'busqueda', name: 'Búsqueda directorio', path: '/buscar' },
    { type: 'directorio', name: 'Directorio (índice)', path: '/directorio' },
    { type: 'directorio_profesion', name: 'Audiología', path: '/directorio/profesion/audiologia' },
    { type: 'directorio_profesion', name: 'Fonoaudiología', path: '/directorio/profesion/fonoaudiologia' },
    { type: 'directorio_profesion', name: 'Otorrinolaringología', path: '/directorio/profesion/otorrinolaringologia' },
    { type: 'directorio_profesion', name: 'Otología', path: '/directorio/profesion/otologia' },
    { type: 'blog_listado', name: 'Blog (índice)', path: '/blog' },
    { type: 'audifonos_listado', name: 'Audífonos (índice)', path: '/audifonos' },
    { type: 'implantes_listado', name: 'Implantes (índice)', path: '/implantes' },
    { type: 'comparador', name: 'Comparador IA', path: '/comparador-ia' },
    { type: 'marketplace', name: 'Marketplace', path: '/ecommerce' },
    { type: 'agendar', name: 'Agendar cita', path: '/agendar' },
    { type: 'nosotros', name: 'Nosotros', path: '/nosotros' },
    { type: 'servicios', name: 'Servicios', path: '/servicios' },
    { type: 'contacto', name: 'Contacto', path: '/contacto' },
  ];
  for (const s of STATIC) {
    const before = await prisma.marketingPage.findUnique({ where: { pageKey: `${s.type}__${s.path.replace(/[^a-z0-9]/gi, '-').slice(0, 100)}` } });
    await upsert(s);
    if (before) unchanged++; else registered++;
  }

  // 2) Blog: artículos publicados
  const blogPosts = await prisma.blogPost.findMany({
    where: { estado: 'PUBLICADO' },
    select: { id: true, slug: true, titulo: true },
  });
  for (const p of blogPosts) {
    const before = await prisma.marketingPage.findFirst({ where: { entityType: 'BlogPost', entityId: p.id } });
    await upsert({
      type: 'blog_articulo',
      name: `Blog: ${p.titulo || p.slug}`,
      path: `/blog/${p.slug}`,
      entityId: p.id, entityType: 'BlogPost',
    });
    if (before?.active) unchanged++; else registered++;
  }
  // Desactivar posts que existen en registry pero ya no son publicados
  const allBlogIds = new Set(blogPosts.map((p) => p.id));
  const orphanBlog = await prisma.marketingPage.findMany({
    where: { entityType: 'BlogPost', active: true, entityId: { notIn: Array.from(allBlogIds) } },
  });
  for (const o of orphanBlog) {
    await deactivate(o.path);
    deactivated++;
  }

  // 3) Perfiles de directorio aprobados
  const profiles = await prisma.directoryProfile.findMany({
    where: { status: 'APPROVED' },
    select: { id: true, nombreConsultorio: true, account: { select: { nombre: true } } },
  });
  for (const p of profiles) {
    const before = await prisma.marketingPage.findFirst({ where: { entityType: 'DirectoryProfile', entityId: p.id } });
    await upsert({
      type: 'perfil_profesional',
      name: `Profesional: ${p.nombreConsultorio || p.account?.nombre || p.id.slice(0, 8)}`,
      path: `/profesional/${p.id}`,
      entityId: p.id, entityType: 'DirectoryProfile',
    });
    if (before?.active) unchanged++; else registered++;
  }
  const allProfileIds = new Set(profiles.map((p) => p.id));
  const orphanProfile = await prisma.marketingPage.findMany({
    where: { entityType: 'DirectoryProfile', active: true, entityId: { notIn: Array.from(allProfileIds) } },
  });
  for (const o of orphanProfile) {
    await deactivate(o.path);
    deactivated++;
  }

  return { registered, deactivated, unchanged };
}

/**
 * Lista con filtros para el admin.
 */
async function list({ type, active, search, limit = 200, offset = 0 } = {}) {
  const where = {};
  if (type) where.type = type;
  if (active !== undefined && active !== '') where.active = active === true || active === 'true';
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { path: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [items, total] = await Promise.all([
    prisma.marketingPage.findMany({
      where, orderBy: [{ type: 'asc' }, { name: 'asc' }],
      take: parseInt(limit), skip: parseInt(offset),
    }),
    prisma.marketingPage.count({ where }),
  ]);
  // Conteo por tipo (resumen)
  const byTypeAgg = await prisma.marketingPage.groupBy({
    by: ['type'], where: { active: true }, _count: { _all: true },
  });
  const byType = Object.fromEntries(byTypeAgg.map((b) => [b.type, b._count._all]));
  return { items, total, byType };
}

/** Cobertura publicitaria: % de páginas activas con al menos 1 campaña activa. */
async function getCoverage() {
  const now = new Date();
  const allPages = await prisma.marketingPage.findMany({
    where: { active: true },
    select: { type: true, path: true },
  });
  const totalPages = allPages.length;

  const allCampaigns = await prisma.marketingCampaign.findMany({
    where: { isActive: true, status: 'ACTIVE',
      startDate: { lte: now }, endDate: { gte: now } },
    select: { id: true, actionType: true, pagesConfig: true },
  });

  const { campaignMatchesPath } = require('../utils/pageTypes');
  let covered = 0;
  const coveredByType = {};
  const uncoveredPaths = [];
  for (const pg of allPages) {
    const hit = allCampaigns.some((c) => campaignMatchesPath(c, pg.path));
    if (hit) {
      covered++;
      coveredByType[pg.type] = (coveredByType[pg.type] || 0) + 1;
    } else {
      uncoveredPaths.push({ type: pg.type, path: pg.path });
    }
  }
  // Conteo total por tipo
  const totalByType = {};
  for (const pg of allPages) totalByType[pg.type] = (totalByType[pg.type] || 0) + 1;
  const types = Object.keys(totalByType).map((t) => ({
    type: t, total: totalByType[t], covered: coveredByType[t] || 0,
  })).sort((a, b) => b.total - a.total);

  return {
    totalPages, covered,
    coveragePct: totalPages > 0 ? Math.round((covered / totalPages) * 1000) / 10 : 0,
    activeCampaigns: allCampaigns.length,
    types,
    uncoveredSample: uncoveredPaths.slice(0, 12),
  };
}

module.exports = {
  upsert,
  deactivate,
  deactivateByEntity,
  syncAll,
  list,
  getCoverage,
};
