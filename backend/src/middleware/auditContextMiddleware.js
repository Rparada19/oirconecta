/**
 * Express middleware: monta el contexto de auditoría para toda la request.
 * Captura userId/userEmail desde req.user (lo deja el middleware de auth),
 * más IP y user-agent.
 *
 * Debe ir DESPUÉS del middleware de auth y ANTES de los controllers.
 * Como casi todas las rutas autenticadas pasan por authMiddleware, este se
 * monta a nivel app y solo lee `req.user` si existe.
 */

const { runWithAuditContext } = require('../auditContext');

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || null;
}

function auditContextMiddleware(req, res, next) {
  const ctx = {
    userId: req.user?.id || null,
    userEmail: req.user?.email || null,
    ip: clientIp(req),
    userAgent: req.headers['user-agent'] || null,
  };
  runWithAuditContext(ctx, () => next());
}

module.exports = auditContextMiddleware;
