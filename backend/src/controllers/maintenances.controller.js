/**
 * Controlador de mantenimientos
 */

const maintenancesService = require('../services/maintenances.service');

const listByPatientEmail = async (req, res, next) => {
  try {
    const { patientEmail } = req.query;
    if (!patientEmail) {
      return res.status(400).json({
        success: false,
        error: 'patientEmail es requerido',
      });
    }
    const list = await maintenancesService.listByPatientEmail(patientEmail);
    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await maintenancesService.create(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
    res.status(201).json({
      success: true,
      data: result.maintenance,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await maintenancesService.update(req.params.id, req.body);
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error,
      });
    }
    res.json({
      success: true,
      data: result.maintenance,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await maintenancesService.remove(req.params.id);
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error,
      });
    }
    res.json({
      success: true,
      message: 'Mantenimiento eliminado',
    });
  } catch (error) {
    next(error);
  }
};

const getUpcoming = async (req, res, next) => {
  try {
    const patientEmail = req.query.patientEmail || null;
    const daysAhead = parseInt(req.query.daysAhead, 10) || 30;
    const list = await maintenancesService.getUpcoming(patientEmail, daysAhead);
    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listByPatientEmail,
  create,
  update,
  remove,
  getUpcoming,
};
