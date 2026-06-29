/**
 * F1 — Lógica de suscripciones (sin pagos todavía).
 * F2 añadirá Wompi (capture, webhook, factura PDF).
 *
 * Reglas de negocio:
 *  - Profesional natural recibe TRIAL_90D (120 días reales) al crearse perfil.
 *  - Empresa (persona jurídica) paga $20.000 × sede × mes (sin descuento anual).
 *  - Independiente: $20.000/mes o $200.000/año (10 meses precio anual).
 *  - El status se recalcula on-read si no se ha materializado.
 *  - "días restantes" = ceil((currentPeriodEnd - now) / 1 día).
 *  - EXPIRING_SOON cuando faltan <=15 días; EXPIRED cuando ya pasó.
 *  - PAST_DUE cuando expired y han pasado >=1 día sin renovar.
 *  - SUSPENDED a los 30 días de mora (lo aplica el cron).
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const IVA_RATE = 0.19;
const TRIAL_DAYS = 120;

/**
 * Capacidades del producto. Usadas por `hasFeature()` y por gating de endpoints.
 * Cualquier feature nueva (telemedicina, HC, etc.) se añade aquí y se marca en `Plan.features`.
 */
const FEATURES = {
  MARKETING: 'marketing', // Directorio + visibilidad + campañas
  AGENDA: 'agenda',       // Sistema multi-tenant de agendamiento (Plan 2+)
  IA: 'ia',               // Agente virtual con tools de calendario (Plan 3)
};

const PLAN_DEFAULTS = [
  // ── Trial ──
  { code: 'TRIAL_90D', nombre: 'Prueba gratuita (120 días)', precioCOP: 0, duracionDias: TRIAL_DAYS,
    beneficios: ['Acceso completo al portal', 'Perfil visible en directorio', 'Recepción de solicitudes', 'Estadísticas'],
    features: { marketing: true }, trialDays: TRIAL_DAYS, displayOrder: 0 },

  // ── Plan 1: Directorio + Marketing (= ANUAL) ──
  { code: 'ANUAL', nombre: 'Plan 1 · Directorio + Marketing', precioCOP: 200000, duracionDias: 365,
    beneficios: ['Perfil verificado en el directorio', 'Aparición prioritaria en búsquedas', 'Paquetes de marketing', 'Prueba gratis de 120 días'],
    features: { marketing: true }, trialDays: TRIAL_DAYS, displayOrder: 1 },

  // ── Plan 2: + Agendamiento ──
  { code: 'PLAN_2_ANUAL', nombre: 'Plan 2 · Marketing + Agendamiento', precioCOP: 500000, duracionDias: 365,
    beneficios: ['Todo lo de Plan 1', 'Sistema de agendamiento propio', 'Reservas desde tu perfil público', 'Integración con Google Calendar', 'Recordatorios automáticos'],
    features: { marketing: true, agenda: true }, trialDays: TRIAL_DAYS, displayOrder: 2 },

  // ── Plan 3: + Agente IA ──
  { code: 'PLAN_3_MENSUAL', nombre: 'Plan 3 · Marketing + Agendamiento + Agente IA', precioCOP: 120000, duracionDias: 30,
    beneficios: ['Todo lo de Plan 2', 'Agente IA que agenda, reagenda y resuelve FAQ', 'Hasta 300 conversaciones/mes', 'Permanencia 12 meses'],
    features: { marketing: true, agenda: true, ia: true }, trialDays: 0,
    minCommitmentMonths: 12, monthlyConversationLimit: 300, displayOrder: 3 },

  // ── Legacy (mantenidos solo para suscripciones existentes; no se ofrecen a nuevos) ──
  { code: 'MENSUAL', nombre: 'Profesional independiente · mensual (legacy)', precioCOP: 20000, duracionDias: 30,
    beneficios: ['Perfil activo', 'Aparición en búsquedas', 'Recepción de solicitudes'],
    features: { marketing: true }, trialDays: 0, displayOrder: 90, activo: false },
  { code: 'EMPRESA', nombre: 'Empresa por sede (legacy)', precioCOP: 20000, duracionDias: 30,
    beneficios: ['Una ficha por sede', '$20.000 mensuales por cada sede'],
    features: { marketing: true }, trialDays: 0, displayOrder: 91, activo: false },
];

/** Códigos de los planes ofrecidos a nuevos profesionales (Plan 1/2/3). */
const OFFERED_PLAN_CODES = ['ANUAL', 'PLAN_2_ANUAL', 'PLAN_3_MENSUAL'];

/** Lee features del plan asociado a una suscripción. Devuelve {marketing,agenda,ia} normalizado. */
function getActiveFeatures(sub) {
  const raw = sub?.plan?.features || {};
  return {
    marketing: !!raw.marketing,
    agenda: !!raw.agenda,
    ia: !!raw.ia,
  };
}

function hasFeature(sub, feature) {
  if (!sub) return false;
  // Estados que NO dan acceso: SUSPENDED, CANCELED. PAST_DUE conserva acceso (gracia).
  if (sub.status === 'SUSPENDED' || sub.status === 'CANCELED') return false;
  return getActiveFeatures(sub)[feature] === true;
}

/**
 * Precio mensual de empresa = $20.000 × (#sedes o 1).
 * Devuelve { unitCOP, sedeCount, totalCOP }.
 */
function priceEmpresa(profile) {
  const sedeCount = Math.max(1, (profile?.workplaces?.length || 0));
  const unitCOP = 20000;
  return { unitCOP, sedeCount, totalCOP: unitCOP * sedeCount };
}

/** Asegura que existan todos los planes en BD. Idempotente. Sincroniza features/precios. */
async function ensurePlans() {
  for (const p of PLAN_DEFAULTS) {
    const payload = {
      nombre: p.nombre,
      precioCOP: p.precioCOP,
      duracionDias: p.duracionDias,
      beneficios: p.beneficios,
      features: p.features || {},
      trialDays: p.trialDays ?? 0,
      minCommitmentMonths: p.minCommitmentMonths ?? null,
      monthlyConversationLimit: p.monthlyConversationLimit ?? null,
      displayOrder: p.displayOrder ?? 0,
      activo: p.activo !== false,
    };
    await prisma.plan.upsert({
      where: { code: p.code },
      update: payload,
      create: { code: p.code, ...payload },
    });
  }
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a, b) {
  return Math.ceil((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calcula y persiste el status correcto basado en fechas.
 * No envía emails (eso lo hace el cron / hooks dedicados).
 */
async function recomputeStatus(sub) {
  const now = new Date();
  const end = new Date(sub.currentPeriodEnd);
  const diff = daysBetween(end, now); // positivo = futuro

  let nextStatus = sub.status;
  let diasMora = 0;

  const isTrialPlan = sub.plan?.code === 'TRIAL_90D';
  const wasPaid = sub.status === 'ACTIVE' || sub.status === 'EXPIRING_SOON';

  if (sub.status === 'CANCELED' || sub.status === 'SUSPENDED') {
    // Estados terminales — solo recálculo de mora si suspendido
    if (sub.status === 'SUSPENDED') diasMora = Math.max(0, -diff);
    return { ...sub, diasMora };
  }

  if (diff > 15) {
    nextStatus = isTrialPlan ? 'TRIAL' : 'ACTIVE';
  } else if (diff >= 0) {
    nextStatus = 'EXPIRING_SOON';
  } else {
    // ya venció
    diasMora = -diff;
    if (diasMora >= 30 && !isTrialPlan) nextStatus = 'SUSPENDED';
    else if (diasMora >= 1 && !isTrialPlan) nextStatus = 'PAST_DUE';
    else nextStatus = 'EXPIRED';
  }

  if (nextStatus !== sub.status || diasMora !== sub.diasMora) {
    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: nextStatus, diasMora },
      include: { plan: true },
    });
    await prisma.subscriptionEvent.create({
      data: {
        subscriptionId: sub.id,
        tipo: 'STATUS_RECOMPUTED',
        fromStatus: sub.status,
        toStatus: nextStatus,
        notas: `Auto. diasMora=${diasMora}, diasRestantes=${diff}`,
      },
    }).catch(() => {});
    return updated;
  }
  return sub;
}

/**
 * Crea suscripción TRIAL para un perfil. Si ya tiene una, devuelve la existente.
 */
async function createTrialForProfile(profileId, { trialDays = TRIAL_DAYS } = {}) {
  const existing = await prisma.subscription.findUnique({ where: { profileId }, include: { plan: true } });
  if (existing) return existing;

  await ensurePlans();
  const trialPlan = await prisma.plan.findUnique({ where: { code: 'TRIAL_90D' } });
  const now = new Date();
  const end = addDays(now, trialDays);

  const sub = await prisma.subscription.create({
    data: {
      profileId,
      planId: trialPlan.id,
      status: 'TRIAL',
      currentPeriodStart: now,
      currentPeriodEnd: end,
      trialStart: now,
      trialEnd: end,
      nextChargeAt: end,
    },
    include: { plan: true },
  });

  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: sub.id,
      tipo: 'TRIAL_STARTED',
      toStatus: 'TRIAL',
      notas: `Trial ${trialDays}d. Vence ${end.toISOString()}`,
    },
  });
  return sub;
}

/**
 * Devuelve datos para "Mi Suscripción" del profesional.
 */
async function getMySubscription(profileId) {
  let sub = await prisma.subscription.findUnique({
    where: { profileId },
    include: { plan: true },
  });
  if (!sub) sub = await createTrialForProfile(profileId);
  sub = await recomputeStatus(sub);

  const profile = await prisma.directoryProfile.findUnique({
    where: { id: profileId },
    select: {
      personaTipo: true,
      workplaces: { select: { id: true, nombreCentro: true } },
    },
  });

  const now = new Date();
  const diasRestantes = Math.max(0, daysBetween(new Date(sub.currentPeriodEnd), now));

  const payments = await prisma.payment.findMany({
    where: { subscriptionId: sub.id, status: 'APPROVED' },
    orderBy: { paidAt: 'desc' },
    take: 12,
    select: { id: true, totalCOP: true, metodo: true, paidAt: true, gatewayRef: true },
  });

  // Plan 1/2/3 son la oferta canónica para todos los profesionales nuevos.
  // EMPRESA sigue visible si el profesional ya es JURIDICA (legacy).
  const isEmpresa = profile?.personaTipo === 'JURIDICA';
  const planCodes = isEmpresa ? [...OFFERED_PLAN_CODES, 'EMPRESA'] : OFFERED_PLAN_CODES;
  const plans = await prisma.plan.findMany({
    where: { code: { in: planCodes } },
    orderBy: { displayOrder: 'asc' },
  });

  const empresa = isEmpresa ? priceEmpresa(profile) : null;

  const plansDisponibles = plans.map((p) => {
    let baseCOP = p.precioCOP;
    let detalle = null;
    if (p.code === 'EMPRESA' && empresa) {
      baseCOP = empresa.totalCOP;
      detalle = { sedeCount: empresa.sedeCount, unitCOP: empresa.unitCOP };
    }
    const iva = Math.round(baseCOP * IVA_RATE);
    return {
      ...p,
      precioCOP: baseCOP,
      ivaCOP: iva,
      totalCOP: baseCOP + iva,
      detalle,
    };
  });

  const features = getActiveFeatures(sub);
  const commitmentActive = sub.commitmentEnd && new Date(sub.commitmentEnd) > now;

  return {
    perfil: { personaTipo: profile?.personaTipo || 'NATURAL', sedes: profile?.workplaces || [] },
    subscription: {
      id: sub.id,
      status: sub.status,
      plan: sub.plan,
      features,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      diasRestantes,
      diasMora: sub.diasMora,
      lastPaymentAt: sub.lastPaymentAt,
      nextChargeAt: sub.nextChargeAt,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      commitmentEnd: sub.commitmentEnd,
      commitmentActive,
      iaConversationsUsed: sub.iaConversationsUsed || 0,
      iaConversationsLimit: sub.plan?.monthlyConversationLimit || null,
    },
    payments,
    plansDisponibles,
  };
}

/**
 * Listado admin con filtros y agregados.
 */
async function listForAdmin({ ciudad, profesionSlug, status, plan, limit = 50, offset = 0 } = {}) {
  const where = {};
  if (status) where.status = status;
  if (plan) where.plan = { code: plan };

  const profileFilter = {};
  if (ciudad) profileFilter.city = { is: { nombre: { equals: ciudad, mode: 'insensitive' } } };
  if (profesionSlug) profileFilter.profession = { is: { slug: profesionSlug } };
  if (Object.keys(profileFilter).length > 0) where.profile = { is: profileFilter };

  const [items, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: {
        plan: true,
        profile: {
          include: {
            account: { select: { email: true, nombre: true } },
            profession: { select: { nombre: true, slug: true } },
            city: { select: { nombre: true } },
          },
        },
      },
      orderBy: { currentPeriodEnd: 'asc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    }),
    prisma.subscription.count({ where }),
  ]);

  // Recompute on-the-fly para los que se muestran (no graba si no cambia)
  const recomputed = await Promise.all(items.map(recomputeStatus));

  return {
    items: recomputed.map((s) => ({
      id: s.id,
      profileId: s.profileId,
      nombre: s.profile?.account?.nombre || s.profile?.nombreConsultorio,
      email: s.profile?.account?.email,
      especialidad: s.profile?.profession?.nombre,
      especialidadSlug: s.profile?.profession?.slug,
      ciudad: s.profile?.city?.nombre,
      fechaRegistro: s.profile?.createdAt,
      trialStart: s.trialStart,
      trialEnd: s.trialEnd,
      currentPeriodStart: s.currentPeriodStart,
      currentPeriodEnd: s.currentPeriodEnd,
      planCode: s.plan?.code,
      planNombre: s.plan?.nombre,
      status: s.status,
      diasRestantes: Math.max(0, daysBetween(new Date(s.currentPeriodEnd), new Date())),
      diasMora: s.diasMora,
      lastPaymentAt: s.lastPaymentAt,
      nextChargeAt: s.nextChargeAt,
    })),
    total,
  };
}

/**
 * Resumen ejecutivo (dashboard admin).
 */
async function getAdminStats() {
  const ACTIVE_STATUSES = ['ACTIVE', 'EXPIRING_SOON'];
  const [byStatus, monthlyActive, annualActive, empresasActivas] = await Promise.all([
    prisma.subscription.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.subscription.count({ where: { status: { in: ACTIVE_STATUSES }, plan: { is: { code: 'MENSUAL' } } } }),
    prisma.subscription.count({ where: { status: { in: ACTIVE_STATUSES }, plan: { is: { code: 'ANUAL' } } } }),
    prisma.subscription.findMany({
      where: { status: { in: ACTIVE_STATUSES }, plan: { is: { code: 'EMPRESA' } } },
      select: { profile: { select: { workplaces: { select: { id: true } } } } },
    }),
  ]);

  const counts = Object.fromEntries(byStatus.map((b) => [b.status, b._count._all]));
  const total = byStatus.reduce((a, b) => a + b._count._all, 0);

  const [planMensual, planAnual, planEmpresa] = await Promise.all([
    prisma.plan.findUnique({ where: { code: 'MENSUAL' } }),
    prisma.plan.findUnique({ where: { code: 'ANUAL' } }),
    prisma.plan.findUnique({ where: { code: 'EMPRESA' } }),
  ]);

  // Empresa: $20.000 × total sedes activas
  const totalSedesEmpresa = empresasActivas.reduce((acc, s) => acc + Math.max(1, s.profile?.workplaces?.length || 0), 0);
  const mrrEmpresa = totalSedesEmpresa * (planEmpresa?.precioCOP || 0);

  // MRR: mensuales activas + (anuales / 12) + empresa por sede. Sin IVA.
  const mrr = (monthlyActive * (planMensual?.precioCOP || 0))
            + Math.round((annualActive * (planAnual?.precioCOP || 0)) / 12)
            + mrrEmpresa;
  const arr = mrr * 12;

  return {
    totalProfesionales: total,
    enPrueba: counts.TRIAL || 0,
    activos: (counts.ACTIVE || 0) + (counts.EXPIRING_SOON || 0),
    vencidos: counts.EXPIRED || 0,
    enMora: counts.PAST_DUE || 0,
    suspendidos: counts.SUSPENDED || 0,
    cancelados: counts.CANCELED || 0,
    mrrCOP: mrr,
    arrCOP: arr,
    suscripcionesMensualActivas: monthlyActive,
    suscripcionesAnualActivas: annualActive,
    suscripcionesEmpresaActivas: empresasActivas.length,
    totalSedesEmpresa,
  };
}

/**
 * Backfill: todos los DirectoryProfile sin Subscription reciben TRIAL desde HOY.
 */
async function backfillTrialsAll() {
  await ensurePlans();
  const profiles = await prisma.directoryProfile.findMany({
    where: { subscription: { is: null } },
    select: { id: true },
  });
  let created = 0;
  for (const p of profiles) {
    await createTrialForProfile(p.id);
    created++;
  }
  return { created, totalScanned: profiles.length };
}

/**
 * Cancela una suscripción. Dos modos:
 *  - immediate=true  → status CANCELED y currentPeriodEnd = ahora (sale del directorio ya)
 *  - immediate=false → cancelAtPeriodEnd=true, conserva acceso hasta vencer
 */
async function cancelSubscription(subscriptionId, { motivo, immediate = false, canceledByAdmin = false } = {}) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true, profile: { include: { account: true } } },
  });
  if (!sub) throw new Error('Suscripción no encontrada');
  if (sub.status === 'CANCELED') return sub;

  // Plan 3 (u otros con compromiso): el profesional no puede cancelar auto-servicio
  // antes de commitmentEnd. Admin sí puede (con motivo en metadata).
  if (!canceledByAdmin && sub.commitmentEnd && new Date(sub.commitmentEnd) > new Date()) {
    const err = new Error(`No es posible cancelar antes de la permanencia mínima (hasta ${sub.commitmentEnd.toISOString().slice(0,10)}). Contacta soporte.`);
    err.code = 'COMMITMENT_ACTIVE';
    throw err;
  }

  const now = new Date();
  const data = immediate
    ? { status: 'CANCELED', canceledAt: now, currentPeriodEnd: now, cancelAtPeriodEnd: false }
    : { cancelAtPeriodEnd: true, canceledAt: now };
  if (motivo) data.metadata = { ...(sub.metadata || {}), motivoCancelacion: motivo };

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data,
    include: { plan: true, profile: { include: { account: true } } },
  });

  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId,
      tipo: 'CANCELED',
      fromStatus: sub.status,
      toStatus: immediate ? 'CANCELED' : sub.status,
      notas: `${canceledByAdmin ? 'Admin' : 'Self'} · ${immediate ? 'inmediato' : 'al final del periodo'}${motivo ? ` · ${motivo}` : ''}`,
      metadata: { motivo, canceledByAdmin },
    },
  });

  // Email de despedida (no bloquea)
  try {
    const emailService = require('./email.service');
    const email = updated.profile?.account?.email;
    const nombre = updated.profile?.account?.nombre;
    if (email) {
      emailService.sendSubscriptionCanceled({
        email,
        nombre,
        motivo,
        vigenteHasta: immediate ? null : updated.currentPeriodEnd,
      }).catch((e) => console.error('[email] despedida:', e?.message));
    }
  } catch (e) {
    console.error('[cancel] email error:', e.message);
  }

  return updated;
}

/**
 * Reactiva una suscripción CANCELED → crea nuevo periodo de 30 días por defecto.
 * Útil para admin que quiera revertir la baja.
 */
async function reactivateSubscription(subscriptionId, { extendDays = 30 } = {}) {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true, profile: { include: { account: true } } },
  });
  if (!sub) throw new Error('Suscripción no encontrada');

  const now = new Date();
  const end = addDays(now, extendDays);
  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: sub.plan?.code === 'TRIAL_90D' ? 'TRIAL' : 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: end,
      nextChargeAt: end,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      diasMora: 0,
    },
    include: { plan: true, profile: { include: { account: true } } },
  });

  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId,
      tipo: 'REACTIVATED',
      fromStatus: sub.status,
      toStatus: updated.status,
      notas: `Reactivada por ${extendDays} días`,
    },
  });

  try {
    const emailService = require('./email.service');
    const email = updated.profile?.account?.email;
    const nombre = updated.profile?.account?.nombre;
    if (email) {
      emailService.sendSubscriptionReactivated({ email, nombre })
        .catch((e) => console.error('[email] reactivada:', e?.message));
    }
  } catch (e) {
    console.error('[reactivate] email error:', e.message);
  }

  return updated;
}

/**
 * Cambia de plan una suscripción existente. Sin pasarela aún: deja el nuevo
 * periodo como PENDING (pago a confirmar) — la integración real lo pasará a ACTIVE
 * al recibir webhook del proveedor.
 *
 * Reglas:
 *  - No permite downgrade auto-servicio si el plan actual tiene compromiso vigente.
 *  - Setea commitmentEnd cuando el plan destino tiene minCommitmentMonths.
 *  - Resetea contador IA al cambiar a/desde Plan 3.
 */
async function changePlan(profileId, targetPlanCode, { changedByAdmin = false } = {}) {
  await ensurePlans();
  const [sub, targetPlan] = await Promise.all([
    prisma.subscription.findUnique({ where: { profileId }, include: { plan: true } }),
    prisma.plan.findUnique({ where: { code: targetPlanCode } }),
  ]);
  if (!sub) throw new Error('Suscripción no encontrada');
  if (!targetPlan || !targetPlan.activo) throw new Error('Plan destino inválido o inactivo');
  if (sub.planId === targetPlan.id) return sub;

  if (!changedByAdmin && sub.commitmentEnd && new Date(sub.commitmentEnd) > new Date()) {
    const err = new Error(`No es posible cambiar de plan antes de la permanencia mínima (hasta ${sub.commitmentEnd.toISOString().slice(0,10)}).`);
    err.code = 'COMMITMENT_ACTIVE';
    throw err;
  }

  const now = new Date();
  const end = addDays(now, targetPlan.duracionDias);
  let commitmentEnd = null;
  if (targetPlan.minCommitmentMonths) {
    commitmentEnd = new Date(now);
    commitmentEnd.setMonth(commitmentEnd.getMonth() + targetPlan.minCommitmentMonths);
  }

  const data = {
    planId: targetPlan.id,
    status: 'PENDING', // pago pendiente; webhook lo pasa a ACTIVE
    currentPeriodStart: now,
    currentPeriodEnd: end,
    nextChargeAt: end,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    diasMora: 0,
    commitmentEnd,
    iaConversationsUsed: 0,
    iaConversationsPeriodAt: targetPlan.monthlyConversationLimit ? now : null,
  };

  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data,
    include: { plan: true },
  });

  await prisma.subscriptionEvent.create({
    data: {
      subscriptionId: sub.id,
      tipo: 'PLAN_CHANGED',
      fromStatus: sub.status,
      toStatus: 'PENDING',
      notas: `${sub.plan?.code || '—'} → ${targetPlan.code}${changedByAdmin ? ' (admin)' : ''}`,
      metadata: { fromPlanCode: sub.plan?.code, toPlanCode: targetPlan.code, changedByAdmin },
    },
  });

  return updated;
}

module.exports = {
  IVA_RATE,
  TRIAL_DAYS,
  FEATURES,
  PLAN_DEFAULTS,
  OFFERED_PLAN_CODES,
  priceEmpresa,
  ensurePlans,
  createTrialForProfile,
  getMySubscription,
  listForAdmin,
  getAdminStats,
  backfillTrialsAll,
  recomputeStatus,
  cancelSubscription,
  reactivateSubscription,
  changePlan,
  hasFeature,
  getActiveFeatures,
};
