/**
 * Controlador de bloqueos de horario
 */

const blockedSlotsService = require('../services/blockedSlots.service');

const requestBlock = async (req, res, next) => {
  try {
    const block = await blockedSlotsService.requestBlock(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: block,
      message: 'Solicitud de bloqueo enviada. Un administrador la revisará.',
    });
  } catch (error) {
    if (error.message?.includes('obligatorios')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { estado, fecha } = req.query;
    const blocks = await blockedSlotsService.getAll(req.user.id, req.user.role, {
      estado,
      fecha,
    });
    res.json({ success: true, data: blocks });
  } catch (error) {
    next(error);
  }
};

const getPending = async (req, res, next) => {
  try {
    const blocks = await blockedSlotsService.getPending();
    res.json({ success: true, data: blocks });
  } catch (error) {
    next(error);
  }
};

const approve = async (req, res, next) => {
  try {
    const block = await blockedSlotsService.approve(req.params.id, req.user.id);
    res.json({
      success: true,
      data: block,
      message: 'Bloqueo aprobado. El horario ya no está disponible para agendar.',
    });
  } catch (error) {
    if (error.message?.includes('no encontrado') || error.message?.includes('pendientes')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

const reject = async (req, res, next) => {
  try {
    const block = await blockedSlotsService.reject(req.params.id, req.user.id);
    res.json({
      success: true,
      data: block,
      message: 'Solicitud de bloqueo rechazada.',
    });
  } catch (error) {
    if (error.message?.includes('no encontrado') || error.message?.includes('pendientes')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

module.exports = {
  requestBlock,
  getAll,
  getPending,
  approve,
  reject,
};
