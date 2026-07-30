const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const brandInfo = require('../services/brandInfo.service');

// Público: contenido editorial de una marca para su landing.
router.get('/:slug', async (req, res) => {
  try {
    const rec = await brandInfo.get(req.params.slug);
    if (!rec) return res.status(404).json({ success: false, error: 'Sin contenido' });
    res.json({ success: true, data: rec });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Admin: lista de marcas con estado (para el panel).
router.get('/', authenticate, async (req, res) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Solo ADMIN' });
  try {
    res.json({ success: true, data: await brandInfo.list(), known: brandInfo.BRANDS });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Admin: regenera una marca ahora.
router.post('/:slug/regenerate', authenticate, async (req, res) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ success: false, error: 'Solo ADMIN' });
  try {
    const rec = await brandInfo.generate(req.params.slug);
    res.status(201).json({ success: true, data: rec });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
