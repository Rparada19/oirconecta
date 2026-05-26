/**
 * Endpoints públicos de configuración del sitio (sin auth).
 * Mantener mínimo: solo lo que el front público necesita conocer.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const config = require('../config');
const emailService = require('../services/email.service');

const router = express.Router();

// GET /api/public/retail-config
// Devuelve el professionalId del consultorio propio de OírConecta para que
// /agendar consulte y agende contra la agenda real de ese profesional.
router.get('/retail-config', (req, res) => {
  res.json({
    success: true,
    data: {
      professionalId: config.retail.professionalId,
    },
  });
});

// POST /api/public/contact
router.post('/contact',
  body('nombre').trim().notEmpty(),
  body('email').isEmail(),
  body('mensaje').trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const { nombre, email, telefono, asunto, mensaje } = req.body;
    emailService.sendContactFormNotification({ nombre, email, telefono, asunto, mensaje })
      .catch((e) => console.error('[contact] email error:', e.message));
    res.json({ success: true });
  }
);

module.exports = router;
