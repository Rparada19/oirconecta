/**
 * F5.1 — Endpoints públicos del agente IA del profesional (Plan 3).
 *
 *  GET  /api/ia/public/:profileId/info   — verifica disponibilidad + cuota visible
 *  POST /api/ia/public/:profileId/chat   — { conversationId?, message } → { conversationId, reply, quota }
 */

const express = require('express');
const ia = require('../services/iaAgent.service');
const iaAdmin = require('../services/iaAdmin.service');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

function send(res, fn) {
  return Promise.resolve(fn()).then(
    (data) => res.json({ success: true, data }),
    (e) => res.status(e.status || 500).json({ success: false, error: e.message, code: e.code }),
  );
}

router.get('/public/:profileId/info', (req, res) =>
  send(res, () => ia.getIaInfo(req.params.profileId)));

router.post('/public/:profileId/chat', (req, res) => {
  // Captura mínima de metadata sin PII: IP truncada + user-agent corto
  const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
  const ipMasked = ip.replace(/\.\d+$/, '.X'); // anonimiza octeto final IPv4
  const ua = (req.headers['user-agent'] || '').toString().slice(0, 80);
  send(res, () => ia.chat(req.params.profileId, {
    conversationId: req.body?.conversationId,
    message: req.body?.message,
    metadata: { ipMasked, ua },
  }));
});

// ─── Admin (F4) ───
router.get('/admin/stats', authenticate, authorize('ADMIN'), (req, res) =>
  send(res, () => iaAdmin.getGlobalStats()));

router.get('/admin/conversations', authenticate, authorize('ADMIN'), (req, res) =>
  send(res, () => iaAdmin.listConversations({
    profileId: req.query.profileId,
    status: req.query.status,
    from: req.query.from, to: req.query.to,
    limit: req.query.limit, offset: req.query.offset,
  })));

router.get('/admin/conversations/:id', authenticate, authorize('ADMIN'), (req, res) =>
  send(res, () => iaAdmin.getConversationDetail(req.params.id)));

module.exports = router;
