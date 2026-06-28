/**
 * One-shot: extiende todas las suscripciones TRIAL activas a 120 días totales
 * desde su trialStart (o currentPeriodStart si no hay trialStart).
 *
 * Idempotente: solo extiende; nunca acorta.
 *
 * Uso: node scripts/extend_trials_to_120.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TRIAL_DAYS = 120;
const MS_DAY = 24 * 3600 * 1000;

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

(async () => {
  // Actualiza plan
  const plan = await prisma.plan.update({
    where: { code: 'TRIAL_90D' },
    data: { duracionDias: TRIAL_DAYS, nombre: 'Prueba gratuita (120 días)' },
  }).catch(() => null);
  if (plan) console.log(`✓ Plan TRIAL_90D actualizado a ${TRIAL_DAYS} días`);

  // Encuentra suscripciones en trial
  const trials = await prisma.subscription.findMany({
    where: { status: 'TRIAL' },
    select: { id: true, currentPeriodStart: true, currentPeriodEnd: true, trialStart: true, trialEnd: true },
  });

  let extended = 0;
  for (const t of trials) {
    const baseStart = t.trialStart || t.currentPeriodStart;
    const target = addDays(baseStart, TRIAL_DAYS);
    if (target.getTime() > t.currentPeriodEnd.getTime()) {
      await prisma.subscription.update({
        where: { id: t.id },
        data: { currentPeriodEnd: target, trialEnd: target },
      });
      extended++;
    }
  }

  console.log(`✓ Extendidas ${extended} de ${trials.length} suscripciones TRIAL`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
