/**
 * Rutas de pacientes
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const patientsController = require('../controllers/patients.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/patients - Listar pacientes
router.get(
  '/',
  [
    query('search').optional(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 500 }),
  ],
  validateRequest,
  patientsController.getAll
);

// GET /api/patients/stats - Estadísticas de pacientes
router.get('/stats', patientsController.getStats);

// GET /api/patients/:id - Obtener paciente por ID
router.get(
  '/:id',
  [param('id').isUUID()],
  validateRequest,
  patientsController.getById
);

// GET /api/patients/:id/profile - Perfil completo del paciente
router.get(
  '/:id/profile',
  [param('id').isUUID()],
  validateRequest,
  patientsController.getProfile
);

// GET /api/patients/:id/messages - Mensajes enviados (WhatsApp/email/SMS) al paciente
router.get(
  '/:id/messages',
  [param('id').isUUID()],
  validateRequest,
  patientsController.getMessages
);

// GET /api/patients/:id/whatsapp - Conversación de WhatsApp del paciente
router.get(
  '/:id/whatsapp',
  [param('id').isUUID()],
  validateRequest,
  patientsController.getWhatsApp
);

// POST /api/patients - Crear paciente
router.post(
  '/',
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('telefono').notEmpty().withMessage('Teléfono requerido'),
  ],
  validateRequest,
  patientsController.create
);

// PUT /api/patients/:id - Actualizar paciente
router.put(
  '/:id',
  [
    param('id').isUUID(),
    body('nombre').optional().notEmpty(),
    body('email').optional().isEmail(),
  ],
  validateRequest,
  patientsController.update
);

/**
 * GET /api/patients/meta/aliados — aliados activos, para el selector de la ficha.
 * Devuelve solo id y nombre: el código de invitación es secreto y vive en
 * /api/aliados-admin, que sí es solo de ADMIN.
 */
router.get('/meta/aliados', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const aliados = await prisma.referralPartner.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
    res.json({ success: true, data: aliados });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * PATCH /api/patients/:id/aliado — atribuye el paciente a un aliado, o se la
 * quita con partnerId: null.
 *
 * Existe porque el QR no atrapa todos los casos: alguien llega al consultorio
 * con la tarjeta de plug-e en la mano sin haberla escaneado, y sin esto ese
 * paciente nunca comisiona.
 *
 * Al atribuir se causan las comisiones de las ventas de audífonos que el
 * paciente ya tuviera. Es deliberado: la atribución no caduca, así que marcar
 * a alguien tarde debe rendir lo mismo que haberlo marcado a tiempo. Si fue un
 * error, la comisión se anula desde la sección de Aliados.
 */
router.patch('/:id/aliado', [param('id').isUUID()], validateRequest, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const partnerId = req.body?.partnerId || null;

    if (partnerId) {
      const existe = await prisma.referralPartner.findUnique({ where: { id: partnerId } });
      if (!existe) return res.status(400).json({ success: false, error: 'Aliado no encontrado' });
    }

    await prisma.patient.update({ where: { id: req.params.id }, data: { partnerId } });

    let comisionadas = 0;
    if (partnerId) {
      const comisiones = require('../services/partnerCommissions.service');
      const ventas = await prisma.sale.findMany({
        where: { patientId: req.params.id, categoria: comisiones.CATEGORIA_COMISIONABLE },
        select: { id: true },
      });
      for (const v of ventas) {
        if (await comisiones.causarPorVenta(v.id)) comisionadas++;
      }
    }

    res.json({ success: true, data: { partnerId, comisionadas } });
  } catch (e) {
    console.error('[patients] asignar aliado falló:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/patients/:id/reassign - Reasignar paciente a otro profesional (solo ADMIN)
router.post(
  '/:id/reassign',
  authorize('ADMIN'),
  [
    param('id').isUUID(),
    body('newProfessionalId').notEmpty().trim().withMessage('newProfessionalId requerido'),
  ],
  validateRequest,
  patientsController.reassign
);

module.exports = router;
