/**
 * Marketing & Ventas — M1.
 * Todas las rutas son admin (JWT ADMIN). El catálogo es público (read-only)
 * para que el front del catálogo pueda renderizar sin auth si más adelante
 * se expone una vitrina pública.
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const svc = require('../services/marketing.service');
const storage = require('../services/storage.service');
const { CATALOG, CATEGORIES } = require('../config/marketingCatalog');

const router = express.Router();
const uploader = storage.makeUploader({ folder: 'marketing/creativos', maxSizeMB: 10 });

// ─── Upload de creatividades ───
router.post('/admin/upload', authenticate, authorize('ADMIN'), (req, res) => {
  if (!storage.isConfigured) {
    return res.status(503).json({ success: false, error: 'Cloudinary no configurado (CLOUDINARY_URL faltante).' });
  }
  uploader.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: 'Sin archivo' });
    res.json({
      success: true,
      data: {
        url: req.file.path,           // URL pública CDN
        publicId: req.file.filename,  // para borrar luego
        format: req.file.format,
        bytes: req.file.size,
        width: req.file.width,
        height: req.file.height,
        resourceType: req.file.resource_type,
      },
    });
  });
});

router.delete('/admin/upload/:publicId(*)', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { resourceType = 'image' } = req.query;
    await storage.destroy(req.params.publicId, { resourceType });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Catálogo ───
router.get('/catalog', (req, res) => {
  res.json({ success: true, data: { items: CATALOG, categories: CATEGORIES } });
});

// ─── Público: campaña activa por tipo + tracking ───
// Rate limit en memoria por sessionId+campaña (1 impresión/hora, 3 clics/hora)
const seen = new Map(); // key: `${sessionId}:${campaignId}:${type}` → count + ts
const RATE_WINDOW_MS = 60 * 60 * 1000;
const LIMITS = { impression: 1, click: 3 };

function rateOk(sessionId, campaignId, type) {
  if (!sessionId || !campaignId) return true; // si no hay sessionId, dejamos pasar
  const key = `${sessionId}:${campaignId}:${type}`;
  const now = Date.now();
  const rec = seen.get(key);
  if (!rec || (now - rec.ts) > RATE_WINDOW_MS) {
    seen.set(key, { count: 1, ts: now });
    return true;
  }
  if (rec.count >= LIMITS[type]) return false;
  rec.count++;
  return true;
}

// Limpieza periódica del Map (cada 30 min)
setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [k, v] of seen.entries()) if (v.ts < cutoff) seen.delete(k);
}, 30 * 60 * 1000).unref();

router.get('/public/active', async (req, res) => {
  try {
    const { actionType } = req.query;
    if (!actionType) return res.json({ success: true, data: null });
    const data = await svc.getActiveCampaignByActionType(actionType);
    res.set('Cache-Control', 'public, max-age=30'); // CDN 30s
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/tracking/impression', async (req, res) => {
  try {
    const { campaignId, sessionId } = req.body || {};
    if (!rateOk(sessionId, campaignId, 'impression')) return res.json({ success: true, throttled: true });
    await svc.recordEvent(campaignId, 'impression');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/tracking/click', async (req, res) => {
  try {
    const { campaignId, sessionId } = req.body || {};
    if (!rateOk(sessionId, campaignId, 'click')) return res.json({ success: true, throttled: true });
    await svc.recordEvent(campaignId, 'click');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─── Dashboard ───
router.get('/admin/stats', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = await svc.getDashboardStats();
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// ─── Anunciantes ───
router.get('/admin/advertisers', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = await svc.listAdvertisers(req.query);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
router.post('/admin/advertisers', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = await svc.createAdvertiser(req.body);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
router.patch('/admin/advertisers/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = await svc.updateAdvertiser(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
// Detalle hoja de cuenta
router.get('/admin/advertisers/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = await svc.getAdvertiserById(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'No encontrado' });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Lista de marcas para el selector
router.get('/admin/brands', authenticate, authorize('ADMIN'), (req, res) => {
  res.json({ success: true, data: svc.BRANDS });
});

// Contactos
router.post('/admin/advertisers/:id/contacts', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = await svc.addContact(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
router.patch('/admin/contacts/:contactId', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = await svc.updateContact(req.params.contactId, req.body);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
router.delete('/admin/contacts/:contactId', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await svc.deleteContact(req.params.contactId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Actividades / timeline
router.post('/admin/advertisers/:id/activities', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const autor = req.user?.email || null;
    const data = await svc.addActivity(req.params.id, req.body, autor);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
router.delete('/admin/activities/:activityId', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await svc.deleteActivity(req.params.activityId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/admin/advertisers/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await svc.deleteAdvertiser(req.params.id);
    res.json({ success: true });
  } catch (e) {
    // Foreign key restrict
    if (e.code === 'P2003') {
      return res.status(409).json({ success: false, error: 'No se puede eliminar: tiene campañas asociadas.' });
    }
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Campañas ───
router.get('/admin/campaigns', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = await svc.listCampaigns(req.query);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
router.post('/admin/campaigns', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = await svc.createCampaign(req.body);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
router.patch('/admin/campaigns/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = await svc.updateCampaign(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
router.post('/admin/campaigns/:id/toggle', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const data = await svc.toggleCampaignActive(req.params.id, req.body.isActive);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
router.delete('/admin/campaigns/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    await svc.deleteCampaign(req.params.id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
