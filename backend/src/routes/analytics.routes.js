/**
 * D1 — Endpoint público de ingesta de eventos analytics.
 *  POST /api/analytics/track      { eventType, sessionId, visitorId, ... }
 *  POST /api/analytics/track-batch { events: [ {...}, {...} ] }
 *
 * Rate limit simple por sessionId+eventType: 60 eventos/min de un mismo
 * tipo desde la misma sesión (evita bucles/abuso). page_view exento del
 * throttle porque puede haber SPAs con rutas dinámicas.
 */

const express = require('express');
const analytics = require('../services/analytics.service');
const insights = require('../services/analyticsInsights.service');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

function send(res, fn) {
  return Promise.resolve(fn()).then(
    (data) => res.json({ success: true, data }),
    (e) => res.status(e.status || 500).json({ success: false, error: e.message }),
  );
}
function range(req) { return { from: req.query.from, to: req.query.to }; }

// ─── Rate limit en memoria ───
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 60;
const rateStore = new Map(); // key → { count, resetAt }

function rateOk(sessionId, eventType) {
  if (eventType === 'page_view') return true;
  const key = `${sessionId}:${eventType}`;
  const now = Date.now();
  const cur = rateStore.get(key);
  if (!cur || cur.resetAt < now) {
    rateStore.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  cur.count++;
  return cur.count <= RATE_MAX;
}

// Limpieza periódica del rate store
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateStore.entries()) if (v.resetAt < now) rateStore.delete(k);
}, 5 * 60 * 1000).unref();

router.post('/track', async (req, res) => {
  const body = req.body || {};
  if (!rateOk(body.sessionId, body.eventType)) {
    return res.json({ success: true, throttled: true });
  }
  try {
    await analytics.trackEvent(body, req);
    res.json({ success: true });
  } catch (e) {
    const status = e.statusCode || 500;
    res.status(status).json({ success: false, error: e.message });
  }
});

router.post('/track-batch', async (req, res) => {
  const events = Array.isArray(req.body?.events) ? req.body.events : [];
  if (events.length === 0) return res.json({ success: true, processed: 0 });
  if (events.length > 50) return res.status(413).json({ success: false, error: 'Máximo 50 eventos por batch' });
  let processed = 0;
  for (const ev of events) {
    if (!rateOk(ev.sessionId, ev.eventType)) continue;
    try {
      await analytics.trackEvent(ev, req);
      processed++;
    } catch (e) {
      // No abortar el batch por un evento inválido
      console.warn('[analytics/batch] evento fallido:', e.message);
    }
  }
  res.json({ success: true, processed });
});

// ─── Admin insights ───
router.get('/admin/overview',         authenticate, authorize('ADMIN'), (req, res) => send(res, () => insights.getOverview(range(req))));
router.get('/admin/timeseries',       authenticate, authorize('ADMIN'), (req, res) => send(res, () => insights.getTimeseries(range(req))));
router.get('/admin/by-city',          authenticate, authorize('ADMIN'), (req, res) => send(res, () => insights.getByCity(range(req))));
router.get('/admin/by-device',        authenticate, authorize('ADMIN'), (req, res) => send(res, () => insights.getByDevice(range(req))));
router.get('/admin/traffic-sources',  authenticate, authorize('ADMIN'), (req, res) => send(res, () => insights.getTrafficSources(range(req))));
router.get('/admin/top-pages',        authenticate, authorize('ADMIN'), (req, res) => send(res, () => insights.getTopPages(range(req))));
router.get('/admin/funnel',           authenticate, authorize('ADMIN'), (req, res) => send(res, () => insights.getFunnel(range(req))));
router.get('/admin/top-events',       authenticate, authorize('ADMIN'), (req, res) => send(res, () => insights.getTopEvents(range(req))));

module.exports = router;
