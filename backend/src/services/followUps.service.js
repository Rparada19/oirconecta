/**
 * F8 — Funnel de controles post-adaptación (CRM centros propios OírConecta).
 *
 * Se dispara al guardar/editar una Sale de audífono con fechaAdaptacion.
 * Genera 9 rows PatientFollowUp con dueDate = fechaAdaptacion + offset.
 *
 * Steps:
 *   D10 (10d), M1 (30d), M3 (90d), M6 (180d),
 *   Y1 (365d), Y1_5 (545d), Y2 (730d), Y2_5 (910d), Y3 (1095d — renovación)
 *
 * Toda mutación importante crea una Interaction en la HC del paciente.
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

// Cronograma post-adaptación de audífonos (definido por negocio):
// semana 1, mes 1, 3, 6, 12, 18, 24, 30, 36.
// El código 'W1' reemplazó al legacy 'D10' (10 días). PatientFollowUp filas
// antiguas con step='D10' siguen válidas — solo cambia el timing para nuevas.
// `minGarantia` = años de garantía mínimos para que el hito aplique. Antes se
// generaban los 9 sin mirar la garantía, así que a un paciente con 2 años se le
// programaban controles hasta el mes 36 — fuera de cobertura.
//
// `mantenimiento` = en esa visita además se hace mantenimiento técnico del
// audífono. El mantenimiento va cada 6 meses y los controles caen en 6, 12, 18,
// 24… así que coinciden SIEMPRE: no se genera un calendario paralelo que luego
// haya que fusionar, se marca el control y se cita una sola vez.
const STEPS = [
  { step: 'W1',   offsetDays: 7,    label: 'Control 1 semana',            minGarantia: 2 },
  { step: 'M1',   offsetDays: 30,   label: 'Control 1 mes',               minGarantia: 2 },
  { step: 'M3',   offsetDays: 90,   label: 'Control 3 meses',             minGarantia: 2 },
  { step: 'M6',   offsetDays: 180,  label: 'Control 6 meses',             minGarantia: 2, mantenimiento: true },
  { step: 'Y1',   offsetDays: 365,  label: 'Control 12 meses',            minGarantia: 2, mantenimiento: true },
  { step: 'Y1_5', offsetDays: 545,  label: 'Control 18 meses',            minGarantia: 2, mantenimiento: true },
  { step: 'Y2',   offsetDays: 730,  label: 'Control 24 meses',            minGarantia: 2, mantenimiento: true },
  { step: 'Y2_5', offsetDays: 910,  label: 'Control 30 meses',            minGarantia: 3, mantenimiento: true },
  { step: 'Y3',   offsetDays: 1095, label: 'Control 36 meses',            minGarantia: 3, mantenimiento: true },
  { step: 'Y3_5', offsetDays: 1277, label: 'Control 42 meses',            minGarantia: 5, mantenimiento: true },
  { step: 'Y4',   offsetDays: 1460, label: 'Control 48 meses',            minGarantia: 5, mantenimiento: true },
  { step: 'Y4_5', offsetDays: 1642, label: 'Control 54 meses',            minGarantia: 5, mantenimiento: true },
  { step: 'Y5',   offsetDays: 1825, label: 'Control 60 meses (renovación)', minGarantia: 5, mantenimiento: true },
];

/// Garantía por defecto cuando la venta no la registró. 2 años es el piso
/// comercial: si nos equivocamos, es programando de menos, no de más.
const GARANTIA_DEFECTO = 2;

/** Hitos que caben dentro de la garantía contratada. */
function stepsParaGarantia(anos) {
  const g = Number(anos) > 0 ? Number(anos) : GARANTIA_DEFECTO;
  return STEPS.filter((s) => g >= s.minGarantia);
}

function stepLabel(step) {
  return STEPS.find((s) => s.step === step)?.label || step;
}

/** ¿Esta visita incluye mantenimiento técnico? */
function incluyeMantenimiento(step) {
  return !!STEPS.find((s) => s.step === step)?.mantenimiento;
}

/** Etiqueta para el paciente: dice si en esa visita también se le hace mantenimiento. */
function stepLabelCompleto(step) {
  const base = stepLabel(step);
  return incluyeMantenimiento(step) ? `${base} + mantenimiento` : base;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Crea/actualiza los 9 rows del funnel para un paciente a partir de una fecha
 * de adaptación. Idempotente por (patientId, step): no duplica y solo actualiza
 * la dueDate si el step aún está PENDING/REMINDED (nunca sobrescribe uno cerrado).
 *
 * @param {object} args
 * @param {string} args.patientId
 * @param {Date}   args.adaptationDate
 * @param {string} [args.saleId] — vínculo opcional a la venta origen
 * @returns {Promise<{ created: number, updated: number, skipped: number }>}
 */
async function ensureFunnel({ patientId, adaptationDate, saleId = null, anosGarantia = null }) {
  if (!patientId) throw new Error('patientId requerido');
  if (!adaptationDate) throw new Error('adaptationDate requerido');
  const base = new Date(adaptationDate);
  if (isNaN(base.getTime())) throw new Error('adaptationDate inválido');

  // Si no vino la garantía, se lee de la venta que originó el funnel.
  let garantia = anosGarantia;
  if (!garantia && saleId) {
    const venta = await prisma.sale.findUnique({
      where: { id: saleId }, select: { anosGarantia: true },
    }).catch(() => null);
    garantia = venta?.anosGarantia || null;
  }
  const pasos = stepsParaGarantia(garantia);

  let created = 0, updated = 0, skipped = 0;

  for (const s of pasos) {
    const dueDate = addDays(base, s.offsetDays);
    const existing = await prisma.patientFollowUp.findUnique({
      where: { patientId_step: { patientId, step: s.step } },
      select: { id: true, status: true, dueDate: true },
    });

    if (!existing) {
      await prisma.patientFollowUp.create({
        data: {
          patientId,
          saleId,
          step: s.step,
          offsetDays: s.offsetDays,
          dueDate,
          status: 'PENDING',
          scheduleToken: generateToken(),
        },
      });
      created++;
    } else if (['PENDING', 'REMINDED', 'OVERDUE'].includes(existing.status)) {
      // Reajusta dueDate si la venta cambió la fecha de adaptación
      if (existing.dueDate.getTime() !== dueDate.getTime()) {
        await prisma.patientFollowUp.update({
          where: { id: existing.id },
          data: { dueDate, saleId: saleId || undefined },
        });
        updated++;
      } else {
        skipped++;
      }
    } else {
      // COMPLETED / SKIPPED — no tocar
      skipped++;
    }
  }

  // Registro en HC del paciente
  if (created > 0) {
    try {
      await prisma.interaction.create({
        data: {
          patientId,
          type: 'follow_up_control',
          channel: 'system',
          title: 'Funnel de controles activado',
          description: `Se programaron ${created} controles a partir de la adaptación del ${base.toISOString().slice(0, 10)}, según la garantía de ${garantia || GARANTIA_DEFECTO} años.`,
          status: 'completed',
          metadata: { source: 'ensureFunnel', saleId, created, updated, skipped, anosGarantia: garantia || GARANTIA_DEFECTO },
        },
      });
    } catch (e) {
      console.warn('[followUps] no pude registrar Interaction:', e.message);
    }
  }

  return { created, updated, skipped };
}

/** Asegura scheduleToken en un follow-up (backfill idempotente). */
async function ensureToken(followUpId) {
  const fu = await prisma.patientFollowUp.findUnique({
    where: { id: followUpId },
    select: { id: true, scheduleToken: true },
  });
  if (!fu) return null;
  if (fu.scheduleToken) return fu.scheduleToken;
  const token = generateToken();
  await prisma.patientFollowUp.update({
    where: { id: fu.id },
    data: { scheduleToken: token },
  });
  return token;
}

/** Busca un follow-up por su token público. */
async function findByToken(token) {
  if (!token) return null;
  return prisma.patientFollowUp.findUnique({
    where: { scheduleToken: token },
    include: {
      patient: {
        select: { id: true, nombre: true, email: true, telefono: true },
      },
    },
  });
}

/** Marca un control como completado (por profesional o CRM). */
async function markCompleted({ followUpId, completedById = null, notes = null }) {
  const fu = await prisma.patientFollowUp.findUnique({
    where: { id: followUpId },
    select: { id: true, patientId: true, step: true, status: true },
  });
  if (!fu) throw new Error('Follow-up no encontrado');
  if (fu.status === 'COMPLETED') return fu;

  const updated = await prisma.patientFollowUp.update({
    where: { id: followUpId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      completedById,
      notes: notes || undefined,
    },
  });

  try {
    await prisma.interaction.create({
      data: {
        patientId: fu.patientId,
        type: 'follow_up_control',
        channel: 'in_person',
        title: `${stepLabel(fu.step)} — realizado`,
        description: notes || 'Control marcado como realizado.',
        status: 'completed',
        metadata: { followUpId: fu.id, step: fu.step },
      },
    });
  } catch (e) {
    console.warn('[followUps] no pude registrar Interaction completed:', e.message);
  }
  return updated;
}

/** Marca un control como SKIPPED (paciente declinó, cambió centro, etc.). */
async function markSkipped({ followUpId, reason = null, byUserId = null }) {
  const fu = await prisma.patientFollowUp.findUnique({
    where: { id: followUpId },
    select: { id: true, patientId: true, step: true },
  });
  if (!fu) throw new Error('Follow-up no encontrado');

  const updated = await prisma.patientFollowUp.update({
    where: { id: followUpId },
    data: { status: 'SKIPPED', notes: reason, completedById: byUserId },
  });

  try {
    await prisma.interaction.create({
      data: {
        patientId: fu.patientId,
        type: 'follow_up_control',
        channel: 'system',
        title: `${stepLabel(fu.step)} — omitido`,
        description: reason || 'Control marcado como omitido.',
        status: 'completed',
        metadata: { followUpId: fu.id, step: fu.step },
      },
    });
  } catch {}
  return updated;
}

/** Vincula una cita a un follow-up cuando el paciente agenda un control. */
async function attachAppointment({ followUpId, appointmentId }) {
  const updated = await prisma.patientFollowUp.update({
    where: { id: followUpId },
    data: { status: 'SCHEDULED', scheduledAppointmentId: appointmentId },
  });
  try {
    const fu = await prisma.patientFollowUp.findUnique({
      where: { id: followUpId },
      select: { patientId: true, step: true },
    });
    if (fu) {
      await prisma.interaction.create({
        data: {
          patientId: fu.patientId,
          type: 'follow_up_control',
          channel: 'system',
          title: `${stepLabel(fu.step)} — cita agendada`,
          description: 'El paciente agendó el control desde el enlace del email.',
          status: 'completed',
          relatedAppointmentId: appointmentId,
          metadata: { followUpId },
        },
      });
    }
  } catch {}
  return updated;
}

/**
 * Encuentra el follow-up más relevante para vincular con una cita nueva.
 * Reglas: mismo paciente, status PENDING/REMINDED/OVERDUE, dueDate más cercano
 * a la fecha de la cita (dentro de ±30 días).
 */
async function findClosestForAppointment({ patientId, apptDate }) {
  const target = new Date(apptDate);
  const from = addDays(target, -30);
  const to = addDays(target, 30);
  return prisma.patientFollowUp.findFirst({
    where: {
      patientId,
      status: { in: ['PENDING', 'REMINDED', 'OVERDUE'] },
      dueDate: { gte: from, lte: to },
    },
    orderBy: [{ dueDate: 'asc' }],
  });
}

/** Listados para el dashboard CRM. */
async function listOverdue({ limit = 100 } = {}) {
  return prisma.patientFollowUp.findMany({
    where: { status: 'OVERDUE' },
    select: {
      id: true, step: true, offsetDays: true, dueDate: true, status: true,
      scheduleToken: true, scheduledAppointmentId: true,
      patient: {
        select: { id: true, nombre: true, telefono: true, email: true, ciudad: true },
      },
    },
    orderBy: [{ dueDate: 'asc' }],
    take: limit,
  });
}

async function listUpcoming({ withinDays = 7, limit = 100 } = {}) {
  const now = new Date();
  const horizon = addDays(now, withinDays);
  return prisma.patientFollowUp.findMany({
    where: {
      status: { in: ['PENDING', 'REMINDED'] },
      dueDate: { gte: now, lte: horizon },
    },
    select: {
      id: true, step: true, offsetDays: true, dueDate: true, status: true,
      scheduleToken: true, scheduledAppointmentId: true,
      patient: {
        select: { id: true, nombre: true, telefono: true, email: true, ciudad: true },
      },
    },
    orderBy: [{ dueDate: 'asc' }],
    take: limit,
  });
}

async function summary() {
  const now = new Date();
  const in7 = addDays(now, 7);
  const [overdue, upcoming7d, scheduled, totalPending] = await Promise.all([
    prisma.patientFollowUp.count({ where: { status: 'OVERDUE' } }),
    prisma.patientFollowUp.count({
      where: {
        status: { in: ['PENDING', 'REMINDED'] },
        dueDate: { gte: now, lte: in7 },
      },
    }),
    prisma.patientFollowUp.count({ where: { status: 'SCHEDULED' } }),
    prisma.patientFollowUp.count({ where: { status: { in: ['PENDING', 'REMINDED', 'OVERDUE'] } } }),
  ]);
  return { overdue, upcoming7d, scheduled, totalPending };
}

module.exports = {
  STEPS,
  stepsParaGarantia,
  incluyeMantenimiento,
  stepLabelCompleto,
  STEPS,
  stepLabel,
  ensureFunnel,
  ensureToken,
  findByToken,
  markCompleted,
  markSkipped,
  attachAppointment,
  findClosestForAppointment,
  listOverdue,
  listUpcoming,
  summary,
};
