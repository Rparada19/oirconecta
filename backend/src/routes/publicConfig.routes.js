/**
 * Endpoints públicos de configuración del sitio (sin auth).
 * Mantener mínimo: solo lo que el front público necesita conocer.
 */

const express = require('express');
const config = require('../config');

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

module.exports = router;
