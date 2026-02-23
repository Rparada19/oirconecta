/**
 * Rutas de bloqueos de horario
 */

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const blockedSlotsController = require('../controllers/blockedSlots.controller');

const router = express.Router();

router.use(authenticate);

// Cualquier usuario autenticado puede solicitar bloqueo
router.post('/', blockedSlotsController.requestBlock);

// Listar bloqueos (cada usuario ve según su rol)
router.get('/', blockedSlotsController.getAll);

// Solo admin: ver pendientes y aprobar/rechazar
router.get('/pending', authorize('ADMIN'), blockedSlotsController.getPending);
router.patch('/:id/approve', authorize('ADMIN'), blockedSlotsController.approve);
router.patch('/:id/reject', authorize('ADMIN'), blockedSlotsController.reject);

module.exports = router;
