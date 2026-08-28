/**
 * Contexto de inquilino por request, vía AsyncLocalStorage.
 *
 * Mismo patrón que auditContext: el middleware de cada portal declara a qué
 * inquilino pertenece lo que se va a leer y escribir, y el cliente Prisma
 * extendido (db.js) se encarga de que ninguna consulta se salga de ahí.
 *
 * La clave del diseño es que **es opcional**. Si no hay contexto, el cliente se
 * comporta como siempre: los crons, las notificaciones y el panel admin
 * necesitan ver todo y seguirían funcionando aunque nadie declare nada. Solo
 * las rutas que sí pertenecen a un inquilino lo declaran, y ahí el aislamiento
 * pasa a ser imposible de olvidar.
 */

const { AsyncLocalStorage } = require('node:async_hooks');

const storage = new AsyncLocalStorage();

/** Corre `fn` con todas las consultas acotadas a un inquilino. */
function runWithTenant(ownerProfileId, fn) {
  if (!ownerProfileId) return fn();
  return storage.run({ ownerProfileId: String(ownerProfileId) }, fn);
}

/** Inquilino activo, o null si la consulta es global (cron, admin, sistema). */
function getTenant() {
  return storage.getStore()?.ownerProfileId || null;
}

/**
 * Escapa del aislamiento a propósito, para operaciones que legítimamente
 * cruzan inquilinos (métricas globales, mantenimiento). Debe ser explícito:
 * si aparece en un sitio raro, es una señal de alarma en revisión de código.
 */
function runSinAislamiento(fn) {
  return storage.run({ ownerProfileId: null }, fn);
}

module.exports = { runWithTenant, getTenant, runSinAislamiento };
