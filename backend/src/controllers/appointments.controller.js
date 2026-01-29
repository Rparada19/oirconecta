/**
 * Controlador de citas
 */

const appointmentsService = require('../services/appointments.service');

const getAll = async (req, res, next) => {
  try {
    const { fecha, estado, page = 1, limit = 50 } = req.query;
    const result = await appointmentsService.getAll({ fecha, estado, page: parseInt(page), limit: parseInt(limit) });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const { periodo } = req.query;
    const stats = await appointmentsService.getStats(periodo);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const getAvailableSlots = async (req, res, next) => {
  try {
    const { fecha } = req.query;
    const slots = await appointmentsService.getAvailableSlots(fecha);
    
    res.json({
      success: true,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const appointment = await appointmentsService.getById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Cita no encontrada',
      });
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const appointment = await appointmentsService.create(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const appointment = await appointmentsService.update(req.params.id, req.body);
    
    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { estado } = req.body;
    const appointment = await appointmentsService.updateStatus(req.params.id, estado);
    
    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

const cancel = async (req, res, next) => {
  try {
    await appointmentsService.cancel(req.params.id);
    
    res.json({
      success: true,
      message: 'Cita cancelada',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getStats,
  getAvailableSlots,
  getById,
  create,
  update,
  updateStatus,
  cancel,
};
