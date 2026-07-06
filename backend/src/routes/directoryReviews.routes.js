/**
 * Reseñas y reportes del directorio público.
 *
 * Rutas:
 *   POST   /api/directory/profiles/:profileId/reviews          (público)
 *   GET    /api/directory/profiles/:profileId/reviews          (público, solo APPROVED)
 *   POST   /api/directory/reviews/:reviewId/report             (público)
 *   POST   /api/directory/profiles/:profileId/report           (público)
 *   GET    /api/directory/admin/reviews                        (admin)
 *   PATCH  /api/directory/admin/reviews/:reviewId              (admin: APPROVE/REJECT)
 *   GET    /api/directory/admin/reports                        (admin)
 *   PATCH  /api/directory/admin/reports/:reportId              (admin: resolve/dismiss)
 *
 * Después de cada cambio de estado de review, recalcula `ratingAvg`/`reviewsCount`
 * del perfil afectado (cache).
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const { PrismaClient } = require('@prisma/client');

const { authenticate, authorize } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();
const prisma = new PrismaClient();

const VALID_MOTIVOS = [
  'informacion_incorrecta',
  'comportamiento_inapropiado',
  'spam',
  'suplantacion',
  'otro',
];

/**
 * Recalcula `ratingAvg` y `reviewsCount` de un perfil contando solo reviews APPROVED.
 * Llamar después de mover una review entre estados.
 */
async function recalcProfileRating(profileId) {
  const stats = await prisma.review.aggregate({
    where: { profileId, status: 'APPROVED' },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.directoryProfile.update({
    where: { id: profileId },
    data: {
      ratingAvg: stats._avg.rating || 0,
      reviewsCount: stats._count._all || 0,
    },
  });
}

// ── Público: enviar reseña ──
router.post(
  '/profiles/:profileId/reviews',
  [
    param('profileId').isUUID(),
    body('authorName').trim().notEmpty().withMessage('Nombre requerido'),
    body('authorEmail').isEmail().withMessage('Email inválido'),
    body('authorPhone').optional().isString().isLength({ max: 40 }),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating 1-5'),
    body('comment').optional().isString().isLength({ max: 4000 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const profile = await prisma.directoryProfile.findUnique({
        where: { id: req.params.profileId },
        select: { id: true, status: true },
      });
      if (!profile || profile.status !== 'APPROVED') {
        return res.status(404).json({ success: false, error: 'Perfil no disponible para reseñas' });
      }
      const { authorName, authorEmail, authorPhone, rating, comment } = req.body;
      const review = await prisma.review.create({
        data: {
          profileId: profile.id,
          authorName,
          authorEmail,
          authorPhone,
          rating,
          comment,
          status: 'PENDING',
        },
        select: { id: true, status: true, createdAt: true },
      });
      res.status(201).json({ success: true, data: review });
    } catch (e) {
      next(e);
    }
  }
);

// ── Público: listar reseñas APPROVED de un perfil ──
router.get(
  '/profiles/:profileId/reviews',
  [
    param('profileId').isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit || '20', 10);
      const offset = parseInt(req.query.offset || '0', 10);
      const where = { profileId: req.params.profileId, status: 'APPROVED' };
      const [items, total] = await Promise.all([
        prisma.review.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            rating: true,
            comment: true,
            authorName: true,
            createdAt: true,
          },
        }),
        prisma.review.count({ where }),
      ]);
      res.json({ success: true, data: { items, total, limit, offset } });
    } catch (e) {
      next(e);
    }
  }
);

// ── Público: reportar una reseña ──
router.post(
  '/reviews/:reviewId/report',
  [
    param('reviewId').isUUID(),
    body('motivo').isIn(VALID_MOTIVOS),
    body('detalle').optional().isString().isLength({ max: 2000 }),
    body('reporterName').optional().isString().isLength({ max: 120 }),
    body('reporterEmail').optional().isEmail(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const review = await prisma.review.findUnique({ where: { id: req.params.reviewId } });
      if (!review) return res.status(404).json({ success: false, error: 'Reseña no encontrada' });

      const { motivo, detalle, reporterName, reporterEmail } = req.body;
      await prisma.$transaction([
        prisma.report.create({
          data: {
            reviewId: review.id,
            profileId: review.profileId,
            motivo,
            detalle,
            reporterName,
            reporterEmail,
          },
        }),
        prisma.review.update({
          where: { id: review.id },
          data: {
            reportCount: { increment: 1 },
            reportedAt: review.reportedAt || new Date(),
            // 3 reportes => moverla a REPORTED automáticamente para revisión admin
            ...(review.reportCount + 1 >= 3 && review.status === 'APPROVED'
              ? { status: 'REPORTED' }
              : {}),
          },
        }),
      ]);
      // Si la reseña se marcó REPORTED y estaba APPROVED, ya no cuenta al ranking.
      await recalcProfileRating(review.profileId);
      res.status(201).json({ success: true });
    } catch (e) {
      next(e);
    }
  }
);

// ── Público: reportar un perfil ──
router.post(
  '/profiles/:profileId/report',
  [
    param('profileId').isUUID(),
    body('motivo').isIn(VALID_MOTIVOS),
    body('detalle').optional().isString().isLength({ max: 2000 }),
    body('reporterName').optional().isString().isLength({ max: 120 }),
    body('reporterEmail').optional().isEmail(),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const profile = await prisma.directoryProfile.findUnique({
        where: { id: req.params.profileId },
        select: { id: true },
      });
      if (!profile) return res.status(404).json({ success: false, error: 'Perfil no encontrado' });
      const { motivo, detalle, reporterName, reporterEmail } = req.body;
      const report = await prisma.report.create({
        data: { profileId: profile.id, motivo, detalle, reporterName, reporterEmail },
        select: { id: true, createdAt: true },
      });
      res.status(201).json({ success: true, data: report });
    } catch (e) {
      next(e);
    }
  }
);

// ── Admin: listar reseñas (todos los estados) ──
router.get(
  '/admin/reviews',
  authenticate,
  authorize('ADMIN'),
  [
    query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'REPORTED']),
    query('profileId').optional().isUUID(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit || '50', 10);
      const offset = parseInt(req.query.offset || '0', 10);
      const where = {};
      if (req.query.status) where.status = req.query.status;
      if (req.query.profileId) where.profileId = req.query.profileId;
      const [items, total] = await Promise.all([
        prisma.review.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            profile: {
              select: { id: true, nombreConsultorio: true, profesion: true },
            },
          },
        }),
        prisma.review.count({ where }),
      ]);
      res.json({ success: true, data: { items, total, limit, offset } });
    } catch (e) {
      next(e);
    }
  }
);

// ── Admin: moderar una reseña ──
router.patch(
  '/admin/reviews/:reviewId',
  authenticate,
  authorize('ADMIN'),
  [
    param('reviewId').isUUID(),
    body('status').isIn(['APPROVED', 'REJECTED', 'PENDING']),
    body('moderationNote').optional().isString().isLength({ max: 2000 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const existing = await prisma.review.findUnique({ where: { id: req.params.reviewId } });
      if (!existing) return res.status(404).json({ success: false, error: 'Reseña no encontrada' });
      const updated = await prisma.review.update({
        where: { id: req.params.reviewId },
        data: {
          status: req.body.status,
          moderationNote: req.body.moderationNote,
          moderatedAt: new Date(),
          moderatedByCrmUserId: req.user.id,
        },
      });
      await recalcProfileRating(existing.profileId);
      res.json({ success: true, data: updated });
    } catch (e) {
      next(e);
    }
  }
);

// ── Admin: listar reportes ──
router.get(
  '/admin/reports',
  authenticate,
  authorize('ADMIN'),
  [
    query('status').optional().isIn(['NEW', 'IN_REVIEW', 'RESOLVED', 'DISMISSED']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit || '50', 10);
      const offset = parseInt(req.query.offset || '0', 10);
      const where = req.query.status ? { status: req.query.status } : {};
      const [items, total] = await Promise.all([
        prisma.report.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            profile: { select: { id: true, nombreConsultorio: true } },
            review: { select: { id: true, rating: true, comment: true, status: true } },
          },
        }),
        prisma.report.count({ where }),
      ]);
      res.json({ success: true, data: { items, total, limit, offset } });
    } catch (e) {
      next(e);
    }
  }
);

// ── Admin: resolver / desestimar reporte ──
router.patch(
  '/admin/reports/:reportId',
  authenticate,
  authorize('ADMIN'),
  [
    param('reportId').isUUID(),
    body('status').isIn(['IN_REVIEW', 'RESOLVED', 'DISMISSED']),
    body('resolutionNote').optional().isString().isLength({ max: 2000 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const updated = await prisma.report.update({
        where: { id: req.params.reportId },
        data: {
          status: req.body.status,
          resolutionNote: req.body.resolutionNote,
          resolvedAt:
            req.body.status === 'RESOLVED' || req.body.status === 'DISMISSED' ? new Date() : null,
          resolvedByCrmUserId: req.user.id,
        },
      });
      res.json({ success: true, data: updated });
    } catch (e) {
      next(e);
    }
  }
);

// ── F6 — Rutas públicas por reviewToken (post-cita) ──

// GET contexto para renderizar la página /dejar-resena/:token
router.get(
  '/reviews/by-token/:token',
  [param('token').isString().isLength({ min: 20, max: 100 })],
  validateRequest,
  async (req, res, next) => {
    try {
      const appt = await prisma.appointment.findUnique({
        where: { reviewToken: req.params.token },
        select: {
          id: true, patientName: true, patientEmail: true,
          fecha: true, tipoConsulta: true, estado: true,
          reviewSubmittedAt: true, directoryProfileId: true,
        },
      });
      if (!appt) return res.status(404).json({ success: false, error: 'Link inválido o expirado' });
      const profile = appt.directoryProfileId
        ? await prisma.directoryProfile.findUnique({
            where: { id: appt.directoryProfileId },
            select: { id: true, nombreConsultorio: true, profesion: true, fotoPerfilUrl: true, account: { select: { nombre: true } } },
          })
        : null;
      const professionalName = profile?.nombreConsultorio || profile?.account?.nombre || null;
      res.json({
        success: true,
        data: {
          alreadySubmitted: !!appt.reviewSubmittedAt,
          patientName: appt.patientName,
          patientEmail: appt.patientEmail,
          fecha: appt.fecha,
          tipoConsulta: appt.tipoConsulta,
          profileId: appt.directoryProfileId,
          professionalName,
          profesion: profile?.profesion || null,
          fotoPerfilUrl: profile?.fotoPerfilUrl || null,
        },
      });
    } catch (e) { next(e); }
  }
);

// POST enviar reseña usando el token único (autovalida a APPROVED)
router.post(
  '/reviews/by-token/:token',
  [
    param('token').isString().isLength({ min: 20, max: 100 }),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating 1-5'),
    body('comment').optional().isString().isLength({ max: 2000 }),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const appt = await prisma.appointment.findUnique({
        where: { reviewToken: req.params.token },
        select: {
          id: true, patientName: true, patientEmail: true, patientPhone: true,
          reviewSubmittedAt: true, directoryProfileId: true,
        },
      });
      if (!appt) return res.status(404).json({ success: false, error: 'Link inválido o expirado' });
      if (appt.reviewSubmittedAt) return res.status(409).json({ success: false, error: 'Ya enviaste una reseña con este link' });

      const { rating, comment } = req.body;
      const review = await prisma.review.create({
        data: {
          profileId: appt.directoryProfileId,
          authorName: appt.patientName || 'Paciente',
          authorEmail: appt.patientEmail || 'anonimo@oirconecta.com',
          authorPhone: appt.patientPhone,
          rating,
          comment: comment || null,
          // Autovalidada porque viene de una cita real verificada por el flow
          status: 'APPROVED',
        },
        select: { id: true, status: true, createdAt: true },
      });
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reviewSubmittedAt: new Date() },
      });
      await recalcProfileRating(appt.directoryProfileId);
      res.status(201).json({ success: true, data: review });
    } catch (e) { next(e); }
  }
);

module.exports = router;
