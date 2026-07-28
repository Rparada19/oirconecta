/**
 * Cerebro comercial editable del bot de captación, para el portal comercial.
 * Montado bajo /api/sales (hereda authenticate + authorize ADMIN/EJECUTIVO_COMERCIAL).
 */
const express = require('express');
const cfgService = require('../services/captacionBotConfig.service');

const router = express.Router();

router.get('/', async (req, res) => {
  try { res.json({ success: true, data: await cfgService.get() }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.put('/', async (req, res) => {
  try { res.json({ success: true, data: await cfgService.update(req.body || {}) }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
