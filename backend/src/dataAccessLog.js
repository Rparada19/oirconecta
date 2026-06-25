/**
 * Registro de ACCESOS (lecturas) a datos sensibles de pacientes.
 *
 * Habeas Data (Ley 1581/2012) y Circular SIC 002/2022 exigen registrar quién
 * accede a HC, no solo quién la modifica. Este helper debe envolver/disparar
 * en todo handler que devuelve datos de Patient, Consultation, MedicalRecord,
 * Audiometry, etc.
 *
 * Uso típico (controller):
 *   const patient = await patientsService.getById(req.params.id);
 *   await logPatientRead({ patientId: patient.id, entity: 'Patient' });
 *   res.json({ success: true, data: patient });
 *
 * Para exports (PDF, CSV) o impresiones, llamar con action='EXPORT' o 'PRINT'
 * y reason (motivo declarado del usuario).
 */

const { PrismaClient } = require('@prisma/client');
const { getAuditContext } = require('./auditContext');

// Cliente separado del extendido (db.js) para evitar que las inserciones de
// DataAccessLog disparen el middleware de AuditLog.
const prismaRaw = new PrismaClient({ log: ['error'] });

/**
 * @param {object} p
 * @param {string} p.patientId   id del paciente accedido
 * @param {string} p.entity      'Patient' | 'Consultation' | 'MedicalRecord' | 'Audiometry' | ...
 * @param {'READ'|'EXPORT'|'PRINT'|'DOWNLOAD'} [p.action='READ']
 * @param {string} [p.reason]    motivo declarado (puede ser requerido para EXPORT)
 */
async function logPatientRead({ patientId, entity, action = 'READ', reason = null }) {
  if (!patientId || !entity) return;
  const ctx = getAuditContext();
  try {
    await prismaRaw.dataAccessLog.create({
      data: {
        userId: ctx.userId || null,
        userEmail: ctx.userEmail || null,
        patientId: String(patientId),
        entity,
        action,
        reason: reason || ctx.reason || null,
        ip: ctx.ip || null,
        userAgent: ctx.userAgent || null,
      },
    });
  } catch (e) {
    // No tumbamos la respuesta si falla el log; lo registramos.
    console.error('[dataAccessLog] no se pudo escribir:', e.message);
  }
}

/**
 * Versión batch: registra acceso a una lista de pacientes (ej. listados).
 * Útil cuando un endpoint devuelve N pacientes y queremos saber a cuáles.
 */
async function logPatientReadBatch({ patientIds, entity, action = 'READ' }) {
  if (!Array.isArray(patientIds) || patientIds.length === 0) return;
  const ctx = getAuditContext();
  const at = new Date();
  const rows = patientIds.map((id) => ({
    userId: ctx.userId || null,
    userEmail: ctx.userEmail || null,
    patientId: String(id),
    entity,
    action,
    reason: ctx.reason || null,
    ip: ctx.ip || null,
    userAgent: ctx.userAgent || null,
    at,
  }));
  try {
    await prismaRaw.dataAccessLog.createMany({ data: rows, skipDuplicates: false });
  } catch (e) {
    console.error('[dataAccessLog] batch no se pudo escribir:', e.message);
  }
}

module.exports = { logPatientRead, logPatientReadBatch };
