/**
 * Contexto de auditoría por request, via AsyncLocalStorage.
 *
 * Cada request del API carga aquí { userId, userEmail, ip, userAgent, reason? }
 * para que el cliente Prisma extendido (db.js) pueda emitir AuditLog con quién
 * y desde dónde ocurrió cada mutación.
 *
 * Fuera de request (workers, scripts, seeds): getAuditContext() retorna {} y los
 * audit logs quedan con userId=null → "system".
 */

const { AsyncLocalStorage } = require('node:async_hooks');

const storage = new AsyncLocalStorage();

/** Corre `fn` con el contexto dado. Express middleware lo usa para envolver next(). */
function runWithAuditContext(ctx, fn) {
  return storage.run(ctx || {}, fn);
}

/** Devuelve el contexto activo o {}. */
function getAuditContext() {
  return storage.getStore() || {};
}

/** Mutar campos del contexto en mid-request (ej. añadir `reason` antes de un export). */
function setAuditReason(reason) {
  const ctx = storage.getStore();
  if (ctx) ctx.reason = reason;
}

module.exports = { runWithAuditContext, getAuditContext, setAuditReason };
