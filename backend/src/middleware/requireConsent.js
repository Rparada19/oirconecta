/**
 * Middleware que bloquea operaciones si el paciente no tiene consent vigente
 * del tipo requerido.
 *
 * Uso:
 *   router.post(
 *     '/',
 *     authenticate,
 *     requireConsent('CLINICAL', (req) => req.body.patientId),
 *     consultations.create
 *   );
 *
 * - `type`: tipo del consent obligatorio (CLINICAL, TELEMEDICINE, ...).
 * - `extractPatientId`: función que recibe req y devuelve el patientId; si no
 *   se pasa, intenta `req.body.patientId`.
 *
 * Devuelve 412 (Precondition Failed) cuando falta el consent.
 */

const { hasActiveConsent } = require('../services/consent.service');

function requireConsent(type, extractPatientId) {
  return async (req, res, next) => {
    try {
      const patientId = typeof extractPatientId === 'function'
        ? extractPatientId(req)
        : req.body?.patientId || req.params?.patientId;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          error: 'No se pudo determinar el paciente para validar consent',
        });
      }
      const ok = await hasActiveConsent(patientId, type);
      if (!ok) {
        return res.status(412).json({
          success: false,
          error: `Falta consent vigente de tipo ${type} para este paciente`,
          code: 'CONSENT_REQUIRED',
          consentType: type,
        });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = requireConsent;
