/**
 * F5.3 — Webhook Meta WhatsApp (público).
 *
 *  GET  /api/webhooks/meta-whatsapp  → verificación de Meta (responde hub.challenge)
 *  POST /api/webhooks/meta-whatsapp  → recibe mensajes entrantes
 *
 * Configurar en Meta Business → WhatsApp → Webhooks:
 *  - Callback URL: https://oirconecta-api.onrender.com/api/webhooks/meta-whatsapp
 *  - Verify token: el valor de META_WEBHOOK_VERIFY_TOKEN
 *  - Suscribir a campo "messages"
 */

const express = require('express');
const wa = require('../services/whatsappAgent.service');

const router = express.Router();

router.get('/meta-whatsapp', (req, res) => {
  const result = wa.verifyWebhook({
    mode: req.query['hub.mode'],
    token: req.query['hub.verify_token'],
    challenge: req.query['hub.challenge'],
  });
  if (result == null) return res.status(403).send('forbidden');
  // Meta espera 200 con el challenge tal cual (texto plano)
  res.status(200).send(String(result));
});

router.post('/meta-whatsapp', async (req, res) => {
  // Responder rápido SIEMPRE — Meta reintenta si tardamos > pocos segundos.
  res.status(200).send('ok');
  try {
    await wa.processIncomingEvent(req.body || {});
  } catch (e) {
    console.error('[wa-webhook] processIncomingEvent falló:', e.message);
  }
});

module.exports = router;
