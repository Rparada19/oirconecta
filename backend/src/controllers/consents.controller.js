/**
 * Controlador de Consentimientos.
 */

const consentService = require('../services/consent.service');
const { CONSENT_TEXTS } = require('../services/consent.service');

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || null;
}

/** POST /api/consents — firma un consent */
const create = async (req, res, next) => {
  try {
    const { patientId, type, method } = req.body;
    if (!patientId || !type || !method) {
      return res.status(400).json({
        success: false,
        error: 'patientId, type y method son requeridos',
      });
    }
    const result = await consentService.createConsent({
      patientId,
      type,
      method,
      signedAt: req.body.signedAt,
      ip: clientIp(req),
      userAgent: req.headers['user-agent'] || null,
    });
    res.status(201).json({ success: true, data: result });
  } catch (e) {
    if (e.statusCode) return res.status(e.statusCode).json({ success: false, error: e.message });
    next(e);
  }
};

/** GET /api/consents/:patientId — vigentes por tipo */
const getActive = async (req, res, next) => {
  try {
    const active = await consentService.getActiveConsents(req.params.patientId);
    res.json({ success: true, data: active });
  } catch (e) { next(e); }
};

/** GET /api/consents/:patientId/all — historial completo */
const list = async (req, res, next) => {
  try {
    const items = await consentService.listConsents(req.params.patientId);
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

/** POST /api/consents/:id/revoke */
const revoke = async (req, res, next) => {
  try {
    const updated = await consentService.revokeConsent({
      id: req.params.id,
      reason: req.body?.reason,
    });
    res.json({ success: true, data: updated });
  } catch (e) {
    if (e.statusCode) return res.status(e.statusCode).json({ success: false, error: e.message });
    next(e);
  }
};

module.exports = { create, getActive, list, revoke };
