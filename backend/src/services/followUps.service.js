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
// ── Los tres calendarios del seguimiento ──────────────────────────────────
//
// No son uno solo con distinto ritmo: son tres cosas distintas que el paciente
// recibe, y cada plan define CUÁNTAS de cada una le tocan. Dos planes con la
// misma garantía de 2 años pueden traer 4 controles o 2.
//
// La ficha comercial lo dice en la letra pequeña y es lo que le da fuerza a los
// recordatorios: los controles y la audiometría anual son OBLIGATORIOS para
// mantener la cobertura. Quien no viene pierde el seguro.

/// Controles de adaptación. La secuencia es SIEMPRE la misma; el plan dice
/// cuántos entran, empezando por el primero.
const CONTROLES = [
  { step: 'W1',   offsetDays: 7,   label: 'Control 1 semana' },
  { step: 'M1',   offsetDays: 30,  label: 'Control 1 mes' },
  { step: 'M3',   offsetDays: 90,  label: 'Control 3 meses' },
  { step: 'M6',   offsetDays: 180, label: 'Control 6 meses' },
  { step: 'Y1',   offsetDays: 365, label: 'Control 12 meses' },
  { step: 'Y1_5', offsetDays: 545, label: 'Control 18 meses' },
];

/// Meses → días, en la misma rejilla que usan los controles. Sin esto el
/// mantenimiento del mes 12 caería a 360 días y el control a 365: cinco días de
/// diferencia que obligan a citar dos veces al paciente para lo mismo.
const MES = { 0.25: 7, 1: 30, 3: 90, 6: 180, 12: 365, 18: 545, 24: 730, 30: 910, 36: 1095, 42: 1277, 48: 1460, 54: 1642, 60: 1825 };
const mesADias = (m) => MES[m] ?? Math.round(m * 30.44);

/// Audiometría anual de control, una por año cumplido.
const audiometrias = (n) => Array.from({ length: n }, (_, i) => ({
  step: `AUD${i + 1}`,
  offsetDays: mesADias(12 * (i + 1)),
  label: `Audiometría anual ${i + 1}`,
}));

/// Controles de garantía: revisión del equipo mientras dura la cobertura.
const controlesGarantia = (cadaMeses, anos) => {
  if (!anos || !cadaMeses) return [];
  const total = Math.floor((anos * 12) / cadaMeses);
  return Array.from({ length: total }, (_, i) => ({
    step: `GAR${i + 1}`,
    offsetDays: mesADias(cadaMeses * (i + 1)),
    label: `Control de garantía ${i + 1}`,
  }));
};

// Los mantenimientos NO se agendan aparte: los programados son exactamente los
// controles de garantía. El resto del cupo es voluntario — el paciente pasa a
// cambiar filtros cuando quiera— y por definición no se puede calendarizar.

/// Garantía por defecto cuando la venta no la registró. 2 años es el piso
/// comercial: si nos equivocamos, es programando de menos, no de más.
const GARANTIA_DEFECTO = 2;

/**
 * Cómo se reparte el cupo de mantenimientos de un plan.
 * Los programados son los controles de garantía; el resto queda a disposición
 * del paciente para cuando pase por el centro.
 */
function repartoMantenimientos(plan) {
  const total = plan?.mantenimientos || 0;
  const programados = (plan?.garantiaAnos && plan?.garantiaCadaMeses)
    ? Math.floor((plan.garantiaAnos * 12) / plan.garantiaCadaMeses)
    : 0;
  return { total, programados, voluntarios: Math.max(0, total - programados) };
}

/**
 * Calendario de un plan de adaptación: sus cupos, cada uno con su ritmo.
 * @param {{controlesAdaptacion:number, audiometrias:number, mantenimientos:number}} plan
 */
function stepsParaPlan(plan) {
  // Cada plan elige en qué meses caen sus controles: no es un prefijo de una
  // secuencia común. Preludio salta el mes 3; Sonata arranca en el mes 3.
  const controles = (plan?.controlesMeses || []).map((mes) => {
    const enSecuencia = CONTROLES.find((c) => c.offsetDays === mesADias(mes));
    return enSecuencia || {
      step: `C${String(mes).replace('.', '_')}`,
      offsetDays: mesADias(mes),
      label: mes < 1 ? 'Control 1 semana' : `Control ${mes} ${mes === 1 ? 'mes' : 'meses'}`,
    };
  });
  return [
    ...controles,
    ...audiometrias(plan?.audiometrias || 0),
    ...controlesGarantia(plan?.garantiaCadaMeses || 0, plan?.garantiaAnos || 0),
  ].sort((a, b) => a.offsetDays - b.offsetDays);
}

/**
 * Calendario de una venta de audífono suelto, sin plan. Solo controles: lo que
 * cabe dentro de la garantía. No hay cupos de audiometría ni mantenimiento
 * porque esos los trae el plan, no el aparato.
 */
function stepsParaGarantia(anos) {
  const g = Number(anos) > 0 ? Number(anos) : GARANTIA_DEFECTO;
  const tope = g * 365;
  return CONTROLES.filter((c) => c.offsetDays <= tope);
}

/// Compatibilidad: algún código viejo importa STEPS.
const STEPS = CONTROLES;

/** Etiqueta legible de cualquier hito, sea control, audiometría o mantenimiento. */
function stepLabel(step) {
  const enControles = CONTROLES.find((s) => s.step === step);
  if (enControles) return enControles.label;
  const aud = /^AUD(\d+)$/.exec(step);
  if (aud) return `Audiometría anual ${aud[1]}`;
  const man = /^MANT(\d+)$/.exec(step);
  if (man) return `Mantenimiento ${man[1]}`;
  const gar = /^GAR(\d+)$/.exec(step);
  if (gar) return `Control de garantía ${gar[1]}`;
  return step;
}

/// Se conserva el nombre porque lo usan el cron y las rutas del paciente.
const stepLabelCompleto = stepLabel;

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

  // Dos formas de vender, dos calendarios:
  //  · Con plan de adaptación → los cupos del plan mandan (controles,
  //    audiometrías y mantenimientos, cada uno con su ritmo).
  //  · Audífono suelto → solo los controles que caben en la garantía.
  let garantia = anosGarantia;
  let plan = null;
  if (saleId) {
    const venta = await prisma.sale.findUnique({
      where: { id: saleId },
      select: {
        anosGarantia: true,
        hearingPlan: {
          select: {
            nombre: true, controlesAdaptacion: true, audiometrias: true,
            mantenimientos: true, anosGarantia: true,
          },
        },
      },
    }).catch(() => null);
    plan = venta?.hearingPlan || null;
    garantia = garantia || plan?.anosGarantia || venta?.anosGarantia || null;
  }
  const pasos = plan ? stepsParaPlan(plan) : stepsParaGarantia(garantia);

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
          description: plan
            ? `Se programaron ${created} hitos del plan ${plan.nombre} a partir de la adaptación del ${base.toISOString().slice(0, 10)}: ${plan.controlesAdaptacion} controles, ${plan.audiometrias} audiometrías y ${plan.mantenimientos} mantenimientos.`
            : `Se programaron ${created} controles a partir de la adaptación del ${base.toISOString().slice(0, 10)}, según la garantía de ${garantia || GARANTIA_DEFECTO} años.`,
          status: 'completed',
          metadata: { source: 'ensureFunnel', saleId, created, updated, skipped, plan: plan?.nombre || null, anosGarantia: garantia || GARANTIA_DEFECTO },
        },
      });
    } catch (e) {
      console.warn('[followUps] no pude registrar Interaction:', e.message);
    }
  }

  return { created, updated, skipped };
}

/**
 * Audiometría anual por 5 años para el referido de un aliado.
 *
 * Es un beneficio del convenio, no un control clínico de adaptación: le toca a
 * TODO referido, tenga o no pérdida auditiva y haya comprado o no. Por eso el
 * reloj arranca en la fecha del referido y no en una adaptación que quizá
 * nunca ocurra.
 *
 * Reusa PatientFollowUp con los mismos steps AUD1..AUD5 que ya usan los planes.
 * Eso resuelve solo el cruce más molesto: quien compró audífonos ya tiene sus
 * audiometrías del plan, y como la llave es (patientId, step), aquí solo se
 * crean las que le faltan. Nadie recibe dos recordatorios de lo mismo.
 *
 * @returns {Promise<{ created: number, existing: number }>}
 */
async function ensureFunnelReferido({ patientId, desde, anos = 5 }) {
  if (!patientId) throw new Error('patientId requerido');
  const base = new Date(desde);
  if (isNaN(base.getTime())) throw new Error('fecha de referido inválida');

  let created = 0;
  let existing = 0;

  for (const s of audiometrias(anos)) {
    const ya = await prisma.patientFollowUp.findUnique({
      where: { patientId_step: { patientId, step: s.step } },
      select: { id: true },
    });
    if (ya) { existing++; continue; }

    await prisma.patientFollowUp.create({
      data: {
        patientId,
        step: s.step,
        offsetDays: s.offsetDays,
        dueDate: addDays(base, s.offsetDays),
        status: 'PENDING',
        scheduleToken: generateToken(),
        // Sin saleId: este seguimiento no nace de una venta.
        notes: 'Audiometría anual incluida en el convenio con el aliado referidor.',
      },
    });
    created++;
  }

  if (created > 0) {
    try {
      await prisma.interaction.create({
        data: {
          patientId,
          type: 'follow_up_control',
          channel: 'system',
          title: 'Audiometrías del convenio programadas',
          description: `Se programaron ${created} audiometrías anuales a partir del ${base.toISOString().slice(0, 10)}, `
            + `por el convenio con el aliado que lo refirió.`
            + (existing ? ` Otras ${existing} ya existían por su plan y no se duplicaron.` : ''),
          status: 'completed',
          metadata: { source: 'ensureFunnelReferido', created, existing, anos },
        },
      });
    } catch (e) {
      console.warn('[followUps] no pude registrar Interaction del referido:', e.message);
    }
  }

  return { created, existing };
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
  ensureFunnelReferido,
  STEPS,
  CONTROLES,
  stepsParaGarantia,
  stepsParaPlan,
  repartoMantenimientos,
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
