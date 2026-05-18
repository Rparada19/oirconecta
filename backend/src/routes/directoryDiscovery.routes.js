/**
 * Descubrimiento del directorio público (estilo Airbnb).
 *
 * Rutas:
 *   GET /api/directory/featured                 destacados generales
 *   GET /api/directory/featured/by-city/:slug   destacados por ciudad
 *   GET /api/directory/featured/by-profession/:slug  destacados por profesión
 *   GET /api/directory/sponsored                placements pagados activos
 *   GET /api/directory/search-v2                búsqueda con filtros + sort
 *   GET /api/directory/professions              catálogo de profesiones
 *   GET /api/directory/cities                   catálogo de ciudades
 *   POST /api/directory/profiles/:profileId/views  log de visita (para ranking)
 *
 * Solo perfiles con `status = APPROVED` aparecen en cualquier endpoint público.
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const validateRequest = require('../middleware/validateRequest');
const { normalizeProfesion } = require('../utils/normalizeProfesion');

const router = express.Router();
const prisma = new PrismaClient();

const PUBLIC_PROFILE_SELECT = {
  id: true,
  nombreConsultorio: true,
  profesion: true,
  professionId: true,
  cityId: true,
  fotoPerfilUrl: true,
  bannerUrl: true,
  direccionPublica: true,
  telefonoPublico: true,
  emailPublico: true,
  polizasAceptadas: true,
  ratingAvg: true,
  reviewsCount: true,
  rankingScore: true,
  isFeatured: true,
  isSponsored: true,
  generoFicha: true,
  profession: { select: { slug: true, nombre: true, nombreFemenino: true } },
  city: { select: { slug: true, nombre: true, departamento: true } },
  workplaces: {
    select: { id: true, nombreCentro: true, ciudad: true, esPrincipal: true },
    take: 3,
  },
};

// ── Catálogo de profesiones (público) ──
router.get('/professions', async (_req, res, next) => {
  try {
    const items = await prisma.profession.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        slug: true,
        nombre: true,
        nombreFemenino: true,
        descripcion: true,
        iconUrl: true,
      },
    });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

// ── Catálogo de departamentos (público) ──
router.get('/departments', async (_req, res, next) => {
  try {
    const items = await prisma.department.findMany({
      where: { activo: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
      select: {
        id: true,
        slug: true,
        nombre: true,
        codigoDane: true,
        capital: true,
        region: true,
      },
    });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

// ── Catálogo de ciudades / municipios (público; opcionalmente filtrado por departamento) ──
router.get(
  '/cities',
  [
    query('departmentSlug').optional().isString().isLength({ max: 80 }),
    query('categoria')
      .optional()
      .isIn(['capital_departamento', 'ciudad_grande', 'municipio', 'corregimiento']),
    query('limit').optional().isInt({ min: 1, max: 2000 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const where = { activo: true };
      if (req.query.departmentSlug) {
        const dep = await prisma.department.findUnique({ where: { slug: req.query.departmentSlug } });
        if (dep) where.departmentId = dep.id;
      }
      if (req.query.categoria) where.categoria = req.query.categoria;
      const items = await prisma.city.findMany({
        where,
        orderBy: [{ categoria: 'asc' }, { orden: 'asc' }, { nombre: 'asc' }],
        take: parseInt(req.query.limit || '500', 10),
        select: {
          id: true,
          slug: true,
          nombre: true,
          departamento: true,
          departmentId: true,
          categoria: true,
          codigoDane: true,
        },
      });
      res.json({ success: true, data: items });
    } catch (e) {
      next(e);
    }
  }
);

// ── Destacados generales (mezcla isFeatured + top rankingScore) ──
router.get(
  '/featured',
  [query('limit').optional().isInt({ min: 1, max: 50 })],
  validateRequest,
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit || '12', 10);
      const items = await prisma.directoryProfile.findMany({
        where: { status: 'APPROVED', isFeatured: true },
        orderBy: [{ rankingScore: 'desc' }, { updatedAt: 'desc' }],
        take: limit,
        select: PUBLIC_PROFILE_SELECT,
      });
      // Si hay menos featureds que `limit`, rellenamos con los de mejor rankingScore.
      let extras = [];
      if (items.length < limit) {
        const featuredIds = items.map((p) => p.id);
        extras = await prisma.directoryProfile.findMany({
          where: {
            status: 'APPROVED',
            isFeatured: false,
            id: featuredIds.length ? { notIn: featuredIds } : undefined,
          },
          orderBy: [{ rankingScore: 'desc' }],
          take: limit - items.length,
          select: PUBLIC_PROFILE_SELECT,
        });
      }
      res.json({ success: true, data: [...items, ...extras] });
    } catch (e) {
      next(e);
    }
  }
);

// ── Destacados por ciudad ──
router.get(
  '/featured/by-city/:slug',
  [param('slug').isString().isLength({ min: 1, max: 80 }), query('limit').optional().isInt({ min: 1, max: 50 })],
  validateRequest,
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit || '12', 10);
      const city = await prisma.city.findUnique({ where: { slug: req.params.slug } });
      if (!city) return res.status(404).json({ success: false, error: 'Ciudad no encontrada' });
      const items = await prisma.directoryProfile.findMany({
        where: { status: 'APPROVED', cityId: city.id },
        orderBy: [{ isFeatured: 'desc' }, { rankingScore: 'desc' }],
        take: limit,
        select: PUBLIC_PROFILE_SELECT,
      });
      res.json({ success: true, data: { city, items } });
    } catch (e) {
      next(e);
    }
  }
);

// ── Destacados por profesión ──
router.get(
  '/featured/by-profession/:slug',
  [param('slug').isString().isLength({ min: 1, max: 80 }), query('limit').optional().isInt({ min: 1, max: 50 })],
  validateRequest,
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit || '12', 10);
      const profession = await prisma.profession.findUnique({ where: { slug: req.params.slug } });
      if (!profession) return res.status(404).json({ success: false, error: 'Profesión no encontrada' });
      const items = await prisma.directoryProfile.findMany({
        where: { status: 'APPROVED', professionId: profession.id },
        orderBy: [{ isFeatured: 'desc' }, { rankingScore: 'desc' }],
        take: limit,
        select: PUBLIC_PROFILE_SELECT,
      });
      res.json({ success: true, data: { profession, items } });
    } catch (e) {
      next(e);
    }
  }
);

// ── Sponsored placements (pago) ──
router.get('/sponsored', async (_req, res, next) => {
  try {
    const now = new Date();
    const items = await prisma.directoryProfile.findMany({
      where: {
        status: 'APPROVED',
        isSponsored: true,
        OR: [{ sponsoredUntil: null }, { sponsoredUntil: { gt: now } }],
      },
      orderBy: [{ rankingScore: 'desc' }],
      take: 6,
      select: PUBLIC_PROFILE_SELECT,
    });
    res.json({ success: true, data: items });
  } catch (e) {
    next(e);
  }
});

// ── Búsqueda mejorada v2 (filtros + sort) ──
router.get(
  '/search-v2',
  [
    query('q').optional().isString().isLength({ max: 200 }),
    query('professionSlug').optional().isString().isLength({ max: 80 }),
    query('profesion').optional().isString().isLength({ max: 80 }),
    query('citySlug').optional().isString().isLength({ max: 80 }),
    query('ciudad').optional().isString().isLength({ max: 80 }),
    query('modalidad').optional().isIn(['presencial', 'virtual', 'ambos']),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    query('poliza').optional().isString().isLength({ max: 80 }),
    query('sort').optional().isIn(['ranking', 'rating', 'reviews', 'recent']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit || '20', 10);
      const offset = parseInt(req.query.offset || '0', 10);

      // Mapea `profesion` (texto libre) al slug canónico si se pasó.
      let professionId;
      if (req.query.professionSlug) {
        const p = await prisma.profession.findUnique({ where: { slug: req.query.professionSlug } });
        if (p) professionId = p.id;
      } else if (req.query.profesion) {
        const p = await normalizeProfesion(req.query.profesion, prisma);
        if (p) professionId = p.id;
      }

      // Ciudad por slug, o lookup por texto contra `cities.nombre`.
      let cityId;
      if (req.query.citySlug) {
        const c = await prisma.city.findUnique({ where: { slug: req.query.citySlug } });
        if (c) cityId = c.id;
      } else if (req.query.ciudad) {
        const c = await prisma.city.findFirst({
          where: { nombre: { equals: req.query.ciudad, mode: 'insensitive' } },
        });
        if (c) cityId = c.id;
      }

      const where = { status: 'APPROVED' };
      if (professionId) where.professionId = professionId;
      if (cityId) where.cityId = cityId;
      if (req.query.minRating) where.ratingAvg = { gte: parseFloat(req.query.minRating) };
      if (req.query.poliza) where.polizasAceptadas = { has: req.query.poliza };

      if (req.query.q) {
        const term = req.query.q.trim();
        where.OR = [
          { nombreConsultorio: { contains: term, mode: 'insensitive' } },
          { profesion: { contains: term, mode: 'insensitive' } },
          { account: { is: { nombre: { contains: term, mode: 'insensitive' } } } },
        ];
      }

      let orderBy;
      switch (req.query.sort) {
        case 'rating':
          orderBy = [{ ratingAvg: 'desc' }, { reviewsCount: 'desc' }];
          break;
        case 'reviews':
          orderBy = [{ reviewsCount: 'desc' }, { ratingAvg: 'desc' }];
          break;
        case 'recent':
          orderBy = [{ updatedAt: 'desc' }];
          break;
        default:
          orderBy = [{ isSponsored: 'desc' }, { isFeatured: 'desc' }, { rankingScore: 'desc' }];
      }

      const [items, total] = await Promise.all([
        prisma.directoryProfile.findMany({
          where,
          orderBy,
          take: limit,
          skip: offset,
          select: PUBLIC_PROFILE_SELECT,
        }),
        prisma.directoryProfile.count({ where }),
      ]);

      res.json({ success: true, data: { items, total, limit, offset } });
    } catch (e) {
      next(e);
    }
  }
);

// ── Registrar visita (rate-limit aplicable; el front llama una sola vez por sesión) ──
router.post(
  '/profiles/:profileId/views',
  [
    param('profileId').isUUID(),
    body('source')
      .optional()
      .isIn(['search', 'direct', 'featured', 'city_listing', 'profession_listing', 'sponsored']),
    body('referrer').optional().isString().isLength({ max: 500 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const exists = await prisma.directoryProfile.findUnique({
        where: { id: req.params.profileId },
        select: { id: true },
      });
      if (!exists) return res.status(404).json({ success: false, error: 'Perfil no encontrado' });
      await prisma.$transaction([
        prisma.profileView.create({
          data: {
            profileId: req.params.profileId,
            ip: req.ip,
            userAgent: req.get('user-agent') || null,
            referrer: req.body.referrer || null,
            source: req.body.source || null,
          },
        }),
        prisma.directoryProfile.update({
          where: { id: req.params.profileId },
          data: { perfilVisitas: { increment: 1 } },
        }),
      ]);
      res.status(201).json({ success: true });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
