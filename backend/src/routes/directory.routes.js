/**
 * Directorio público: registro de profesionales y moderación (ADMIN).
 * Rutas públicas y de cuenta: reflejadas en `oirconecta/src/config/directoryApi.js` (front).
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();

const directoryController = require('../controllers/directory.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { authenticateDirectoryAccount } = require('../middleware/directoryAuth');
const validateRequest = require('../middleware/validateRequest');
const storage = require('../services/storage.service');

const profileUploader = storage.makeUploader({ folder: 'directorio/perfiles', maxSizeMB: 8 });

router.get(
  '/search',
  [
    query('q').optional().isString().isLength({ max: 200 }),
    query('profesion').optional().isString().isLength({ max: 80 }),
    query('poliza').optional().isString().isLength({ max: 80 }),
    query('ciudad').optional().isString().isLength({ max: 80 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  directoryController.publicSearch
);

router.get(
  '/profiles/:profileId',
  [param('profileId').isUUID()],
  validateRequest,
  directoryController.publicProfileById
);

router.post(
  '/profiles/:profileId/inquiry',
  [
    param('profileId').isUUID(),
    body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('telefono').trim().notEmpty().withMessage('Teléfono requerido'),
    body('mensaje').optional().isString().isLength({ max: 2000 }),
  ],
  validateRequest,
  directoryController.submitProfileInquiry
);

router.post(
  '/profiles/:profileId/stats/whatsapp',
  [param('profileId').isUUID()],
  validateRequest,
  directoryController.recordPublicWhatsappClick
);

router.post(
  '/profiles/:profileId/stats/call',
  [param('profileId').isUUID()],
  validateRequest,
  directoryController.recordPublicCallClick
);

router.post(
  '/profiles/:profileId/stats/email',
  [param('profileId').isUUID()],
  validateRequest,
  directoryController.recordPublicEmailClick
);

router.post(
  '/profiles/:profileId/stats/agendar',
  [param('profileId').isUUID()],
  validateRequest,
  directoryController.recordPublicAgendarClick
);

router.post(
  '/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('nombre').trim().notEmpty(),
    body('personaTipo').optional({ values: 'falsy' }).isIn(['NATURAL', 'JURIDICA']),
    body('documentoIdentidad').optional().isString().isLength({ max: 32 }),
    body('nombreConsultorio').optional().isString().isLength({ max: 200 }),
  ],
  validateRequest,
  directoryController.register
);

router.post(
  '/auth/login',
  [body('email').isEmail(), body('password').notEmpty()],
  validateRequest,
  directoryController.directoryLogin
);

router.get('/me', authenticateDirectoryAccount, directoryController.getMe);
router.get('/me/stats', authenticateDirectoryAccount, directoryController.getMyStats);
router.post('/me/change-password', authenticateDirectoryAccount, directoryController.changeMyPassword);

// Upload de imagen del profesional (foto perfil, banner, galería)
router.post('/me/upload', authenticateDirectoryAccount, (req, res) => {
  if (!storage.isConfigured) {
    return res.status(503).json({ success: false, error: 'Storage no configurado en el servidor.' });
  }
  profileUploader.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: 'Sin archivo' });
    res.json({
      success: true,
      data: {
        url: req.file.path,
        publicId: req.file.filename,
        width: req.file.width,
        height: req.file.height,
        format: req.file.format,
        bytes: req.file.size,
      },
    });
  });
});

router.get(
  '/me/inquiries',
  authenticateDirectoryAccount,
  [
    query('status').optional().isIn(['NEW', 'READ', 'ARCHIVED']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  directoryController.listMyInquiries
);

router.patch(
  '/me/inquiries/:inquiryId',
  authenticateDirectoryAccount,
  [
    param('inquiryId').isUUID(),
    body('status').optional().isIn(['NEW', 'READ', 'ARCHIVED']),
    body('ownerNote').optional().isString().isLength({ max: 4000 }),
    body('markRead').optional().isBoolean(),
    body('markResponded').optional().isBoolean(),
  ],
  validateRequest,
  directoryController.patchMyInquiry
);

router.patch(
  '/me',
  authenticateDirectoryAccount,
  [
    body('videoUrls').optional().isArray(),
    body('photoUrls').optional().isArray(),
    body('nombreConsultorio').optional().isString().isLength({ max: 200 }),
    body('profesion').optional().isString().isLength({ max: 80 }),
    body('polizasAceptadas').optional().isArray(),
    body('profesionesAdicionales').optional().isArray(),
    body('workplaces').optional().isArray(),
    body('allies').optional().custom((v) => v == null || typeof v === 'object'),
    body('studies').optional().custom((v) => v == null || typeof v === 'object'),
    body('availability').optional().custom((v) => v == null || typeof v === 'object'),
    body('consultation').optional().custom((v) => v == null || typeof v === 'object'),
    body('personaTipo').optional({ values: 'falsy' }).isIn(['NATURAL', 'JURIDICA']),
    body('documentoIdentidad').optional().isString().isLength({ max: 32 }),
    body('direccionPublica').optional().isString().isLength({ max: 500 }),
    body('telefonoPublico').optional().isString().isLength({ max: 40 }),
    body('emailPublico').optional().isString().isLength({ max: 120 }),
    body('bannerUrl').optional().isString().isLength({ max: 2000 }),
    body('fotoPerfilUrl').optional().isString().isLength({ max: 2000 }),
    body('googleMapsEmbedUrl').optional().isString().isLength({ max: 12000 }),
    body('googleMapsLugarUrl').optional().isString().isLength({ max: 2000 }),
    body('blogMarkdown').optional().isString().isLength({ max: 120000 }),
    body('liveChatUrl').optional().isString().isLength({ max: 2000 }),
    body('titulosSecciones').optional().custom((v) => v == null || typeof v === 'object'),
    body('estadisticasCitas').optional().custom((v) => v == null || typeof v === 'object'),
    body('parentProfileId').optional({ values: 'falsy' }).isUUID(),
    body('generoFicha').optional({ values: 'falsy' }).isIn(['MASCULINO', 'FEMENINO']),
  ],
  validateRequest,
  directoryController.patchMe
);

router.get(
  '/admin/stats',
  authenticate,
  authorize('ADMIN'),
  directoryController.getAdminStats
);

router.get(
  '/admin/profiles',
  authenticate,
  authorize('ADMIN'),
  [query('status').optional().isIn(['DRAFT', 'PENDING', 'NEEDS_CHANGES', 'APPROVED', 'REJECTED'])],
  validateRequest,
  directoryController.adminList
);

router.patch(
  '/admin/profiles/:accountId',
  authenticate,
  authorize('ADMIN'),
  [
    param('accountId').isUUID(),
    body('status').isIn(['DRAFT', 'PENDING', 'NEEDS_CHANGES', 'APPROVED', 'REJECTED']),
    body('rejectionReason').optional().isString().isLength({ max: 4000 }),
    body('needsChangesNote').optional().isString().isLength({ max: 4000 }),
  ],
  validateRequest,
  directoryController.adminSetStatus
);

module.exports = router;
