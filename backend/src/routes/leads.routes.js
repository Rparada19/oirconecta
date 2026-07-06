/**
 * Rutas de leads
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const leadsController = require('../controllers/leads.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// T2-Gap1 — Endpoint público de opt-out del nurture (link en cada email).
// Sin auth: el token es el propio leadId (basta para dar de baja voluntariamente).
router.get('/nurture/opt-out', async (req, res) => {
  const token = String(req.query.token || '').trim();
  if (!token) return res.status(400).send('Token requerido');
  try {
    await prisma.lead.updateMany({
      where: { id: token, nurtureOptOut: false },
      data: { nurtureOptOut: true },
    });
    // Respuesta HTML simple y editorial (evita SPA para no cargar bundle)
    res.set('Content-Type', 'text/html; charset=utf-8').send(`
<!doctype html><html lang="es"><head><meta charset="utf-8" />
<title>Suscripción actualizada · OírConecta</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fafbfc;color:#0F2A4A;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}.card{background:#fff;border:1px solid #eef0f3;border-radius:16px;padding:40px;max-width:480px;text-align:center}h1{font-family:'Playfair Display',Georgia,serif;font-weight:600;font-size:28px;letter-spacing:-0.02em;margin:0 0 12px}p{color:#475569;line-height:1.6;margin:0 0 24px}a{background:#0F2A4A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;display:inline-block}</style>
</head><body>
<div class="card">
<div style="width:56px;height:56px;border-radius:50%;background:#ecfdf5;color:#059669;display:inline-flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px;">✓</div>
<h1>Listo, no te escribimos más</h1>
<p>Tu email fue removido de la lista de seguimiento. Si algún día quieres agendar, la puerta queda abierta.</p>
<a href="https://oirconecta.com/">Volver al sitio</a>
</div>
</body></html>`);
  } catch (e) {
    console.error('[nurture opt-out]', e.message);
    res.status(500).send('Error');
  }
});

// Todas las rutas siguientes requieren autenticación
router.use(authenticate);

// GET /api/leads - Listar leads
router.get(
  '/',
  [
    query('estado').optional().isIn(['NUEVO', 'CONTACTADO', 'AGENDADO', 'CALIFICADO', 'CONVERTIDO', 'PERDIDO', 'PACIENTE']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  leadsController.getAll
);

// GET /api/leads/stats - Estadísticas de leads (para funnel)
router.get('/stats', leadsController.getStats);

// GET /api/leads/check-duplicate - Verificar duplicados (antes de /:id)
router.get(
  '/check-duplicate',
  [
    query('email').optional().isEmail(),
    query('telefono').optional(),
    query('excludeId').optional().isUUID(),
  ],
  validateRequest,
  leadsController.checkDuplicate
);

// GET /api/leads/:id - Obtener lead por ID
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  leadsController.getById
);

// POST /api/leads - Crear lead
router.post(
  '/',
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('telefono').notEmpty().withMessage('Teléfono requerido'),
    body('procedencia').optional(),
    body('interes').optional(),
  ],
  validateRequest,
  leadsController.create
);

// PUT /api/leads/:id - Actualizar lead
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('nombre').optional().notEmpty(),
    body('email').optional().isEmail(),
    body('telefono').optional().notEmpty(),
    body('estado').optional().isIn(['NUEVO', 'CONTACTADO', 'AGENDADO', 'CALIFICADO', 'CONVERTIDO', 'PERDIDO', 'PACIENTE']),
  ],
  validateRequest,
  leadsController.update
);

// DELETE /api/leads/:id - Eliminar lead
router.delete(
  '/:id',
  authorize('ADMIN'),
  [param('id').isUUID()],
  validateRequest,
  leadsController.remove
);

// POST /api/leads/:id/convert-to-patient - Convertir lead a paciente
router.post(
  '/:id/convert-to-patient',
  [param('id').isUUID()],
  validateRequest,
  leadsController.convertToPatient
);

module.exports = router;
