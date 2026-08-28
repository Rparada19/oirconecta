/**
 * Cliente Prisma único + extensión de auditoría.
 *
 * Habeas Data (Ley 1581/2012 art. 17) + Res. 1995/1999 exigen registrar TODA
 * mutación sobre datos sensibles de pacientes. Esta extensión escribe en
 * `audit_logs` cada create/update/delete/upsert sobre las entidades listadas
 * en AUDITED_MODELS, con el contexto del request (auditContext).
 *
 * Uso:
 *   const prisma = require('./db');
 *   await prisma.patient.update({ where: { id }, data: ... });
 *   // → emite AuditLog automático.
 *
 * Para acciones especiales (SIGN, ARCHIVE, EXPORT) usar:
 *   await emitAudit({ action: 'SIGN', entity: 'Consultation', entityId, before, after });
 */

const { PrismaClient } = require('@prisma/client');
const { getAuditContext } = require('./auditContext');
const { getTenant } = require('./tenantContext');

/// Modelos cuyas mutaciones siempre se auditan. Mantener corto y centrado en PHI/PII.
const AUDITED_MODELS = new Set([
  'Patient',
  'Lead',
  'Consultation',
  'Appointment',
  'Quote',
  'Sale',
  'Maintenance',
  'Interaction',
  'Consent',
  'OwnedDevice', // futuro Fase 3
]);

/// Modelos que pertenecen a un inquilino. Si hay contexto de inquilino activo,
/// ninguna consulta sobre estos puede salirse de él — ni leyendo ni escribiendo.
const TENANT_MODELS = new Set(['Patient', 'Lead']);

/// Operaciones de lectura a las que se les inyecta el filtro de dueño.
const LECTURAS = new Set(['findMany', 'findFirst', 'findFirstOrThrow', 'count', 'aggregate', 'groupBy']);
/// Operaciones que modifican y hay que acotar para no tocar datos ajenos.
const ESCRITURAS_MASIVAS = new Set(['updateMany', 'deleteMany']);

const ACTION_MAP = {
  create: 'CREATE',
  createMany: 'CREATE',
  update: 'UPDATE',
  updateMany: 'UPDATE',
  upsert: 'UPDATE', // se diferencia entre CREATE/UPDATE al leer "before"
  delete: 'DELETE',
  deleteMany: 'DELETE',
};

/** Resuelve modelo Prisma (camelCase) a nombre canónico del enum entity (PascalCase). */
function modelClient(client, model) {
  // Prisma expone client[camelCase]; ej. Patient -> client.patient
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  return client[key];
}

function nullSafe(v) {
  return v === undefined ? null : v;
}

const basePrisma = new PrismaClient({
  log: process.env.PRISMA_LOG === 'true' ? ['warn', 'error'] : ['error'],
});

/// Cliente "raw" para los inserts del audit log (evita recursión).
const rawAuditClient = basePrisma;

async function writeAuditLog({ action, entity, entityId, before, after }) {
  const ctx = getAuditContext();
  try {
    await rawAuditClient.auditLog.create({
      data: {
        userId: ctx.userId || null,
        userEmail: ctx.userEmail || null,
        action,
        entity,
        entityId: String(entityId),
        before: nullSafe(before),
        after: nullSafe(after),
        ip: ctx.ip || null,
        userAgent: ctx.userAgent || null,
        reason: ctx.reason || null,
      },
    });
  } catch (e) {
    // No tumbamos la operación de negocio si falla el log; lo registramos.
    console.error('[auditLog] no se pudo escribir:', e.message);
  }
}

/** Extracta el id de un payload de Prisma (data o where). */
function extractId(args) {
  if (args?.where?.id) return args.where.id;
  if (args?.data?.id) return args.data.id;
  return null;
}

/**
 * Aislamiento multiinquilino.
 *
 * Antes esto dependía de que cada consulta recordara filtrar por dueño, y basta
 * una que se olvide para que los pacientes de un cliente aparezcan en el CRM de
 * otro. Aquí deja de ser cuestión de memoria.
 *
 * Solo actúa si hay contexto de inquilino: sin él (crons, admin, notificaciones)
 * el cliente se comporta como siempre.
 */
const tenantScoped = basePrisma.$extends({
  name: 'tenant-scope',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const tenant = getTenant();
        if (!tenant || !TENANT_MODELS.has(model)) return query(args);

        const filtro = { ownerProfileId: tenant };

        if (LECTURAS.has(operation) || ESCRITURAS_MASIVAS.has(operation)) {
          return query({ ...args, where: { AND: [args?.where || {}, filtro] } });
        }

        // findUnique no admite campos no únicos en el where, así que se
        // comprueba la propiedad después: si el registro es de otro, no existe.
        if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
          const row = await query(args);
          if (row && row.ownerProfileId && row.ownerProfileId !== tenant) return null;
          return row;
        }

        if (operation === 'create' || operation === 'createMany') {
          const marcar = (d) => ({ ...d, ownerProfileId: d?.ownerProfileId ?? tenant });
          const data = Array.isArray(args?.data) ? args.data.map(marcar) : marcar(args?.data || {});
          return query({ ...args, data });
        }

        // update / delete / upsert apuntan a un id: se verifica antes de tocar.
        if (['update', 'delete', 'upsert'].includes(operation)) {
          const id = args?.where?.id;
          if (id) {
            const actual = await modelClient(basePrisma, model)
              .findUnique({ where: { id }, select: { ownerProfileId: true } })
              .catch(() => null);
            if (actual && actual.ownerProfileId && actual.ownerProfileId !== tenant) {
              throw new Error(`Acceso denegado: ese ${model} pertenece a otro inquilino.`);
            }
          }
          if (operation === 'upsert' && args?.create) {
            args = { ...args, create: { ...args.create, ownerProfileId: args.create.ownerProfileId ?? tenant } };
          }
          return query(args);
        }

        return query(args);
      },
    },
  },
});

const prisma = tenantScoped.$extends({
  name: 'audit-log',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const action = ACTION_MAP[operation];
        if (!action || !AUDITED_MODELS.has(model)) {
          return query(args);
        }

        // Capturar estado previo cuando aplica.
        let before = null;
        const client = modelClient(basePrisma, model);
        const id = extractId(args);

        try {
          if ((operation === 'update' || operation === 'delete' || operation === 'upsert') && id) {
            before = await client.findUnique({ where: { id } });
          }
        } catch {
          /* lectura previa no debe romper el flujo */
        }

        const result = await query(args);

        // Resolver el id final (create devuelve el objeto con id; updateMany no).
        let finalId = id;
        let after = null;
        if (operation === 'create' || operation === 'upsert') {
          finalId = result?.id || finalId;
          after = result;
        } else if (operation === 'update') {
          finalId = result?.id || finalId;
          after = result;
        } else if (operation === 'delete') {
          after = null;
        } else if (operation === 'createMany' || operation === 'updateMany' || operation === 'deleteMany') {
          // Lote: registramos un solo audit con conteo en `after`.
          finalId = `batch:${operation}`;
          after = { count: result?.count ?? null, where: args?.where ?? null };
        }

        // Diferencias upsert: si no había `before`, es CREATE.
        const realAction =
          operation === 'upsert' && before == null ? 'CREATE' : action;

        await writeAuditLog({
          action: realAction,
          entity: model,
          entityId: finalId || 'unknown',
          before,
          after,
        });

        return result;
      },
    },
  },
});

/// Emisor manual para acciones especiales (SIGN, ARCHIVE, RESTORE, EXPORT).
async function emitAudit({ action, entity, entityId, before = null, after = null }) {
  return writeAuditLog({ action, entity, entityId, before, after });
}

module.exports = prisma;
module.exports.emitAudit = emitAudit;
module.exports.AUDITED_MODELS = AUDITED_MODELS;
