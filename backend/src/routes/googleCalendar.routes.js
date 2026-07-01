/**
 * C9 — Endpoints Google Calendar del profesional.
 *
 * Requiere ENV:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   GOOGLE_OAUTH_REDIRECT_URI  (ej: https://oirconecta-api.onrender.com/api/google-calendar/oauth/callback)
 */

const express = require('express');
const gcal = require('../services/googleCalendar.service');
const { authenticateDirectoryAccount } = require('../middleware/directoryAuth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();
const SITE_URL = process.env.SITE_URL || 'https://oirconecta.com';

async function withProfile(req, res, next) {
  try {
    const profile = await prisma.directoryProfile.findUnique({
      where: { accountId: req.directoryAccount.id },
      select: { id: true },
    });
    if (!profile) return res.status(404).json({ success: false, error: 'Perfil no encontrado' });
    req.profileId = profile.id;
    next();
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
}

// Estado del canal
router.get('/me/status', authenticateDirectoryAccount, withProfile, async (req, res) => {
  try {
    const data = await gcal.getStatus(req.profileId);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Inicia OAuth: devuelve URL a redirigir en el navegador
router.get('/me/authorize-url', authenticateDirectoryAccount, withProfile, (req, res) => {
  try {
    const url = gcal.buildAuthUrl(req.profileId);
    res.json({ success: true, data: { url } });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Desconectar
router.post('/me/disconnect', authenticateDirectoryAccount, withProfile, async (req, res) => {
  try {
    await gcal.disconnect(req.profileId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Callback OAuth (PÚBLICO — Google redirige aquí)
router.get('/oauth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const backTo = `${SITE_URL}/portal-profesional/agenda`;
  if (error) return res.redirect(`${backTo}?gcal=error&reason=${encodeURIComponent(error)}`);
  if (!code || !state) return res.redirect(`${backTo}?gcal=error&reason=missing`);
  try {
    await gcal.connectFromCallback(state, code);
    res.redirect(`${backTo}?gcal=ok`);
  } catch (e) {
    res.redirect(`${backTo}?gcal=error&reason=${encodeURIComponent(e.message.slice(0, 120))}`);
  }
});

module.exports = router;
