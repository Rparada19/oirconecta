/**
 * Migraciones idempotentes que corren al arrancar el backend.
 *
 * Cada función debe poderse correr N veces sin efecto colateral. Se usan
 * como sustituto del `node scripts/...` cuando no hay acceso a Shell de Render
 * (plan gratuito).
 */

const TRIAL_DAYS = 120;

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Extiende suscripciones TRIAL a 120 días desde su trialStart.
 * Solo extiende — nunca acorta.
 * Idempotente: si todo ya está bien, no hace cambios.
 */
async function extendTrialsTo120(prisma) {
  try {
    // 1) Actualiza plan TRIAL_90D a 120 días (idempotente vía update)
    await prisma.plan.update({
      where: { code: 'TRIAL_90D' },
      data: { duracionDias: TRIAL_DAYS, nombre: 'Prueba gratuita (120 días)' },
    }).catch(() => null);

    // 2) Extiende suscripciones TRIAL que terminan antes de trialStart+120d
    const trials = await prisma.subscription.findMany({
      where: { status: 'TRIAL' },
      select: { id: true, currentPeriodStart: true, currentPeriodEnd: true, trialStart: true },
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
    if (extended > 0) {
      console.log(`[boot-migrate] trials extendidos a 120d: ${extended}/${trials.length}`);
    } else {
      console.log(`[boot-migrate] trials ya estaban en 120d (${trials.length} revisados)`);
    }
  } catch (e) {
    // No bloqueamos el arranque por una migración
    console.warn('[boot-migrate] extendTrialsTo120 falló (no bloqueante):', e.message);
  }
}

/**
 * Punto único: corre todas las migraciones idempotentes.
 */
async function runBootMigrations(prisma) {
  await extendTrialsTo120(prisma);
}

module.exports = { runBootMigrations };
