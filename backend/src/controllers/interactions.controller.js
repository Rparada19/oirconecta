/**
 * Controlador de interacciones CRM
 */

const interactionsService = require('../services/interactions.service');

const listByPatientEmail = async (req, res, next) => {
  try {
    const { patientEmail, patientId } = req.query;
    if (!patientEmail && !patientId) {
      return res.status(400).json({ success: false, error: 'patientEmail o patientId es requerido' });
    }
    const list = patientId
      ? await interactionsService.listByPatientId(patientId)
      : await interactionsService.listByPatientEmail(patientEmail);
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

const getMetrics = async (req, res, next) => {
  try {
    const { patientEmail, patientId } = req.query;
    if (!patientEmail && !patientId) {
      return res.status(400).json({ success: false, error: 'patientEmail o patientId es requerido' });
    }
    const metrics = await interactionsService.getMetricsByPatient({ patientId, patientEmail });
    if (metrics == null) {
      return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
    }
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

/** Vista CRM: una fila por paciente con el estado de su seguimiento. */
const getCrmOverview = async (req, res, next) => {
  try {
    const { search, filtro, limit, daysAhead } = req.query;
    const data = await interactionsService.getCrmOverview({
      search,
      filtro,
      limit: limit ? parseInt(limit, 10) : undefined,
      daysAhead: daysAhead ? parseInt(daysAhead, 10) : 7,
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const interaction = await interactionsService.getById(req.params.id);
    if (!interaction) {
      return res.status(404).json({ success: false, error: 'Interacción no encontrada' });
    }
    res.json({ success: true, data: interaction });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await interactionsService.create(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    res.status(201).json({ success: true, data: result.interaction });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await interactionsService.update(req.params.id, req.body);
    if (!result.success) {
      return res.status(404).json({ success: false, error: result.error });
    }
    res.json({ success: true, data: result.interaction });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await interactionsService.remove(req.params.id);
    if (!result.success) {
      return res.status(404).json({ success: false, error: result.error });
    }
    res.json({ success: true, message: 'Interacción eliminada' });
  } catch (error) {
    next(error);
  }
};

const getDailyActions = async (req, res, next) => {
  try {
    const daysAhead = req.query.daysAhead ? parseInt(req.query.daysAhead, 10) : 7;
    const actions = await interactionsService.getDailyActions({ daysAhead });
    res.json({ success: true, data: actions });
  } catch (error) {
    next(error);
  }
};

const getDailyActionsMetrics = async (req, res, next) => {
  try {
    const daysAhead = req.query.daysAhead ? parseInt(req.query.daysAhead, 10) : 7;
    const patientEmail = req.query.patientEmail && String(req.query.patientEmail).trim() ? String(req.query.patientEmail).trim() : undefined;
    const metrics = await interactionsService.getDailyActionsMetrics({ daysAhead, patientEmail });
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listByPatientEmail,
  getMetrics,
  getCrmOverview,
  getById,
  create,
  update,
  remove,
  getDailyActions,
  getDailyActionsMetrics,
};
