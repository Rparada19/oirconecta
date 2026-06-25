/**
 * Rutas de auditoría. Solo ADMIN puede consultar.
 *
 * GET /api/audit/logs            ?entity=&entityId=&userId=&from=&to=&limit=&offset=
 * GET /api/audit/access          ?patientId=&userId=&from=&to=&limit=&offset=
 * GET /api/audit/summary         resumen últimos 30 días (cuenta por acción/entidad/usuario)
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Solo administradores' });
  }
  next();
}

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function clampLimit(n, def = 50, max = 500) {
  const x = parseInt(n, 10);
  if (!Number.isFinite(x) || x <= 0) return def;
  return Math.min(x, max);
}

router.use(authenticate, requireAdmin);

/** Mutaciones */
router.get('/logs', async (req, res, next) => {
  try {
    const { entity, entityId, userId, action, from, to } = req.query;
    const where = {};
    if (entity) where.entity = String(entity);
    if (entityId) where.entityId = String(entityId);
    if (userId) where.userId = String(userId);
    if (action) where.action = String(action).toUpperCase();
    const f = parseDate(from);
    const t = parseDate(to);
    if (f || t) where.at = { ...(f && { gte: f }), ...(t && { lte: t }) };

    const limit = clampLimit(req.query.limit, 50, 500);
    const offset = clampLimit(req.query.offset, 0, 100000);

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ success: true, data: { items, total, limit, offset } });
  } catch (e) {
    next(e);
  }
});

/** Lecturas de HC */
router.get('/access', async (req, res, next) => {
  try {
    const { patientId, userId, entity, action, from, to } = req.query;
    const where = {};
    if (patientId) where.patientId = String(patientId);
    if (userId) where.userId = String(userId);
    if (entity) where.entity = String(entity);
    if (action) where.action = String(action).toUpperCase();
    const f = parseDate(from);
    const t = parseDate(to);
    if (f || t) where.at = { ...(f && { gte: f }), ...(t && { lte: t }) };

    const limit = clampLimit(req.query.limit, 50, 500);
    const offset = clampLimit(req.query.offset, 0, 100000);

    const [items, total] = await Promise.all([
      prisma.dataAccessLog.findMany({
        where,
        orderBy: { at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.dataAccessLog.count({ where }),
    ]);

    res.json({ success: true, data: { items, total, limit, offset } });
  } catch (e) {
    next(e);
  }
});

/** Resumen últimos 30 días para dashboard admin. */
router.get('/summary', async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const [mutByEntity, mutByAction, readByUser, recentMut, recentRead] = await Promise.all([
      prisma.auditLog.groupBy({
        by: ['entity'],
        where: { at: { gte: since } },
        _count: { _all: true },
      }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { at: { gte: since } },
        _count: { _all: true },
      }),
      prisma.dataAccessLog.groupBy({
        by: ['userId'],
        where: { at: { gte: since } },
        _count: { _all: true },
      }),
      prisma.auditLog.findMany({
        where: { at: { gte: since } },
        orderBy: { at: 'desc' },
        take: 10,
      }),
      prisma.dataAccessLog.findMany({
        where: { at: { gte: since } },
        orderBy: { at: 'desc' },
        take: 10,
      }),
    ]);

    res.json({
      success: true,
      data: {
        windowDays: 30,
        mutationsByEntity: mutByEntity.map((x) => ({ entity: x.entity, count: x._count._all })),
        mutationsByAction: mutByAction.map((x) => ({ action: x.action, count: x._count._all })),
        readsByUser: readByUser.map((x) => ({ userId: x.userId, count: x._count._all })),
        recentMutations: recentMut,
        recentReads: recentRead,
      },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
