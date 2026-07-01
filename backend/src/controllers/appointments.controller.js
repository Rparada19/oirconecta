/**
 * Controlador de citas
 */

const appointmentsService = require('../services/appointments.service');

const getAll = async (req, res, next) => {
  try {
    const { fecha, estado, patientEmail, page = 1, limit = 50 } = req.query;
    const result = await appointmentsService.getAll({ fecha, estado, patientEmail, page: parseInt(page), limit: parseInt(limit) });
    
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
    const { fecha, professionalId } = req.query;
    const slots = await appointmentsService.getAvailableSlots(fecha, professionalId || null);
    
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

/**
 * Crear cita (público o con usuario)
 * Usado por /agendar (sin login) y por CRM (con login)
 */
const createPublic = async (req, res, next) => {
  try {
    const createdById = req.user?.id || null;
    const appointment = await appointmentsService.create(req.body, createdById);
    
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

const getRescheduleInfo = async (req, res, next) => {
  try {
    const apt = await appointmentsService.getByRescheduleToken(req.params.token);
    if (!apt) return res.status(404).json({ success: false, error: 'Token inválido' });
    res.json({ success: true, data: apt });
  } catch (e) { next(e); }
};

const confirmByToken = async (req, res, next) => {
  try {
    await appointmentsService.confirmByToken(req.params.token);
    res.json({ success: true, message: 'Cita confirmada' });
  } catch (e) { next(e); }
};

const rescheduleByToken = async (req, res, next) => {
  try {
    const { fecha, hora } = req.body;
    const updated = await appointmentsService.rescheduleByToken(req.params.token, fecha, hora);
    res.json({ success: true, data: updated });
  } catch (e) {
    // Cuando el slot ya no está disponible, respondemos 409 con mensaje claro
    if (e.statusCode) return res.status(e.statusCode).json({ success: false, error: e.message });
    next(e);
  }
};

const getRescheduleSlots = async (req, res, next) => {
  try {
    const result = await appointmentsService.getRescheduleSlots(req.params.token, req.query.date);
    res.json({ success: true, data: result });
  } catch (e) {
    if (e.statusCode) return res.status(e.statusCode).json({ success: false, error: e.message });
    next(e);
  }
};

const processReminders = async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers['x-cron-secret'] !== secret) {
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }
    const result = await appointmentsService.processReminders();
    res.json({ success: true, ...result });
  } catch (e) { next(e); }
};

module.exports = {
  getAll,
  getStats,
  getAvailableSlots,
  getById,
  create,
  createPublic,
  update,
  updateStatus,
  cancel,
  getRescheduleInfo,
  getRescheduleSlots,
  confirmByToken,
  rescheduleByToken,
  processReminders,
};
