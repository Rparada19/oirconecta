/**
 * Marketplace publicitario para profesionales.
 *
 *  GET  /api/professional/ads/products             — catálogo filtrado
 *  GET  /api/professional/ads/me/campaigns         — mis campañas
 *  GET  /api/professional/ads/me/metrics?days=30   — métricas agregadas
 *  POST /api/professional/ads/me/request           — solicitar producto
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateDirectoryAccount } = require('../middleware/directoryAuth');
const svc = require('../services/professionalAds.service');

const prisma = new PrismaClient();
const router = express.Router();

async function resolveProfileId(req, res, next) {
  try {
    const profile = await prisma.directoryProfile.findUnique({
      where: { accountId: req.directoryAccount.id },
      select: { id: true },
    });
    if (!profile) return res.status(404).json({ success: false, error: 'Perfil no encontrado' });
    req.profileId = profile.id;
    next();
  } catch (e) { next(e); }
}

function send(res, fn) {
  return Promise.resolve()
    .then(fn)
    .then((data) => res.json({ success: true, data }))
    .catch((e) => res.status(400).json({ success: false, error: e.message }));
}

// Catálogo público-para-profesional (requiere solo auth de directorio)
router.get('/products', authenticateDirectoryAccount, (req, res) =>
  send(res, () => svc.listProducts())
);

router.use(authenticateDirectoryAccount, resolveProfileId);

router.get('/me/campaigns', (req, res) => send(res, () => svc.listMyCampaigns(req.profileId)));
router.get('/me/metrics', (req, res) =>
  send(res, () => svc.getMyMetrics(req.profileId, { days: Math.min(90, parseInt(req.query.days) || 30) }))
);
router.post('/me/request', (req, res) =>
  send(res, () => svc.requestProduct(req.profileId, req.body || {}))
);

module.exports = router;
