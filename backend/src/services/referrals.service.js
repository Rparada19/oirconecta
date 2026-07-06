/**
 * T2-Gap4 — Referrals con incentivo.
 *
 * Cada paciente tiene un `referralCode` único (asignado on-demand).
 * Cuando un nuevo lead usa el enlace /invita/:code, guardamos el
 * `referredByCode` en su Lead y (al convertir en Patient) en Patient.
 * Cuando el nuevo paciente completa su primera cita, notificamos al
 * paciente referidor por email.
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function generateCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/** Genera un código único para un paciente si no tiene. Idempotente. */
async function ensureReferralCode(patientId) {
  const p = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, referralCode: true },
  });
  if (!p) throw new Error('Paciente no encontrado');
  if (p.referralCode) return p.referralCode;

  // Bucle corto por si hay colisión (probabilidad muy baja con 8 hex chars).
  for (let i = 0; i < 5; i++) {
    const code = generateCode();
    try {
      await prisma.patient.update({
        where: { id: patientId },
        data: { referralCode: code },
      });
      return code;
    } catch (e) {
      if (e.code !== 'P2002') throw e;
    }
  }
  throw new Error('No se pudo generar código único de referido');
}

/** Busca el paciente dueño de un referralCode. */
async function findByCode(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return null;
  return prisma.patient.findFirst({
    where: { referralCode: normalized, archivedAt: null },
    select: { id: true, nombre: true, email: true, referralCode: true },
  });
}

/**
 * Se llama cuando un lead recién creado viene con referredByCode.
 * Solo valida y guarda; el email al referidor se envía al completar cita.
 */
async function attachReferralToLead(leadId, code) {
  const referrer = await findByCode(code);
  if (!referrer) return null;
  await prisma.lead.update({
    where: { id: leadId },
    data: { /* Lead no tiene referredByCode, dejamos que se propague al Patient */ notas: `Referido por código: ${referrer.referralCode}` },
  });
  return referrer;
}

/**
 * Trigger: al marcar una cita como COMPLETED, si es la 1ra del paciente
 * y tiene referredByCode, notificar al referidor.
 * Se llama desde professionalSchedule.updateAppointmentStatus (fire-and-forget).
 */
async function notifyReferrerIfFirstCompleted(patientId) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, nombre: true, referredByCode: true },
    });
    if (!patient?.referredByCode) return { skipped: 'no-code' };

    // Cuenta cuántas citas COMPLETED tiene. Si es 1, es la primera.
    const completedCount = await prisma.appointment.count({
      where: { patientId, estado: 'COMPLETED' },
    });
    if (completedCount !== 1) return { skipped: 'not-first' };

    const referrer = await findByCode(patient.referredByCode);
    if (!referrer?.email) return { skipped: 'no-referrer' };

    const email = require('./email.service');
    await email.sendReferralUsed({
      to: referrer.email,
      referrerName: referrer.nombre,
      newPatientName: patient.nombre,
    });
    return { notified: true, referrerId: referrer.id };
  } catch (e) {
    console.error('[referrals] notifyReferrer falló:', e.message);
    return { error: e.message };
  }
}

module.exports = {
  ensureReferralCode,
  findByCode,
  attachReferralToLead,
  notifyReferrerIfFirstCompleted,
};
