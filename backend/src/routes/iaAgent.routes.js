/**
 * F5.1 — Endpoints públicos del agente IA del profesional (Plan 3).
 *
 *  GET  /api/ia/public/:profileId/info   — verifica disponibilidad + cuota visible
 *  POST /api/ia/public/:profileId/chat   — { conversationId?, message } → { conversationId, reply, quota }
 */

const express = require('express');
const ia = require('../services/iaAgent.service');

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

module.exports = router;
