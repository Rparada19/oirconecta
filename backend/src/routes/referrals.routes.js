/**
 * T2-Gap4 — Rutas del sistema de referrals.
 *
 * Públicas:
 *   GET  /api/referrals/by-code/:code   → info del referidor (para landing /invita/:code)
 *
 * Autenticadas (CRM):
 *   POST /api/referrals/patients/:patientId/code   → asigna/devuelve código único
 */

const express = require('express');
const referrals = require('../services/referrals.service');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET público — para renderizar landing con nombre del referidor
router.get('/by-code/:code', async (req, res) => {
  try {
    const p = await referrals.findByCode(req.params.code);
    if (!p) return res.status(404).json({ success: false, error: 'Código no válido' });
    res.json({
      success: true,
      data: {
        referrerFirstName: (p.nombre || '').split(' ')[0] || null,
        code: p.referralCode,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST autenticado — asigna código a un paciente (idempotente)
router.post('/patients/:patientId/code', authenticate, async (req, res) => {
  try {
    const code = await referrals.ensureReferralCode(req.params.patientId);
    res.json({ success: true, data: { code, url: `https://oirconecta.com/invita/${code}` } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
