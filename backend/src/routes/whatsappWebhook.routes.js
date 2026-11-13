/**
 * F5.3 — Webhook Meta WhatsApp (público).
 *
 *  GET  /api/webhooks/meta-whatsapp  → verificación de Meta (responde hub.challenge)
 *  POST /api/webhooks/meta-whatsapp  → recibe mensajes entrantes (firmado)
 *
 * Configurar en Meta Business → WhatsApp → Webhooks:
 *  - Callback URL: https://oirconecta-api.onrender.com/api/webhooks/meta-whatsapp
 *  - Verify token: el valor de META_WEBHOOK_VERIFY_TOKEN
 *  - Además: META_APP_SECRET (App Secret de la app de Meta) para validar la
 *    firma de cada POST. Sin esa variable el webhook acepta cualquier origen.
 *  - Suscribir a campo "messages"
 *
 * Instagram y Facebook (Messenger + comentarios) usan la misma URL o, si se
 * prefiere separarla, /api/webhooks/meta-social. Mismo verify token y misma
 * firma. Ver services/socialWebhook.service.js.
 */

const express = require('express');
const wa = require('../services/whatsappAgent.service');
const verifyMetaSignature = require('../middleware/verifyMetaSignature');

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

router.post('/meta-whatsapp', verifyMetaSignature, async (req, res) => {
  // Responder rápido SIEMPRE — Meta reintenta si tardamos > pocos segundos.
  res.status(200).send('ok');
  try {
    await wa.processIncomingEvent(req.body || {});
  } catch (e) {
    console.error('[wa-webhook] processIncomingEvent falló:', e.message);
  }
});

// Instagram y Messenger: mismo handshake, mismo procesamiento (despacha por `object`).
router.get('/meta-social', (req, res) => {
  const result = wa.verifyWebhook({
    mode: req.query['hub.mode'],
    token: req.query['hub.verify_token'],
    challenge: req.query['hub.challenge'],
  });
  if (result == null) return res.status(403).send('forbidden');
  res.status(200).send(String(result));
});

router.post('/meta-social', verifyMetaSignature, async (req, res) => {
  res.status(200).send('ok');
  try {
    await wa.processIncomingEvent(req.body || {});
  } catch (e) {
    console.error('[social-webhook] falló:', e.message);
  }
});

// Fotos y video de Aura en una URL pública: Instagram no acepta subir el
// archivo al mandarlo, solo un enlace. Solo sale lo de la lista, nada más.
router.get('/aura-material/:archivo', (req, res) => {
  const social = require('../services/socialChannel.service');
  const archivo = String(req.params.archivo || '');
  if (!social.MATERIAL_PUBLICO.has(archivo)) return res.status(404).send('not found');
  res.set('Cache-Control', 'public, max-age=86400');
  res.sendFile(require('path').join(social.CARPETA_MATERIAL, archivo));
});

module.exports = router;
