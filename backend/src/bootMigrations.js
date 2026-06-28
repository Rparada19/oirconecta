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
 * Sales CRM — agrega el valor de enum 'EJECUTIVO_COMERCIAL' y crea las tablas
 * sales_leads / sales_activities / sales_tasks si no existen. Idempotente.
 */
async function ensureSalesCrmSchema(prisma) {
  try {
    // 1) Agregar valor al enum Role (postgres soporta IF NOT EXISTS desde 9.6)
    await prisma.$executeRawUnsafe(`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'EJECUTIVO_COMERCIAL'`);

    // 2) Enums propios del módulo Sales
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "SalesLeadStatus" AS ENUM ('NUEVO','CONTACTADO','INTERESADO','DEMO_AGENDADA','EN_PRUEBA','CONVERTIDO','PERDIDO');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "SalesActivityType" AS ENUM ('CALL','EMAIL','WHATSAPP','MEETING','NOTE');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "SalesTaskType" AS ENUM ('CALL','EMAIL','WHATSAPP','MEETING','FOLLOWUP');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      CREATE TYPE "SalesTaskStatus" AS ENUM ('PENDING','DONE','MISSED','CANCELED');
    EXCEPTION WHEN duplicate_object THEN null; END $$;`);

    // 3) Tablas
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "sales_leads" (
        "id" TEXT PRIMARY KEY,
        "nombre" TEXT NOT NULL,
        "email" TEXT,
        "telefono" TEXT,
        "profesion" TEXT,
        "empresa" TEXT,
        "ciudad" TEXT,
        "source" TEXT,
        "status" "SalesLeadStatus" NOT NULL DEFAULT 'NUEVO',
        "score" INTEGER NOT NULL DEFAULT 0,
        "ownerId" TEXT REFERENCES "users"("id") ON DELETE SET NULL,
        "convertedAccountId" TEXT,
        "convertedAt" TIMESTAMP(3),
        "notes" TEXT,
        "lastActivityAt" TIMESTAMP(3),
        "nextActionAt" TIMESTAMP(3),
        "doNotContact" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "sales_leads_status_ownerId_idx" ON "sales_leads"("status","ownerId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "sales_leads_nextActionAt_idx" ON "sales_leads"("nextActionAt");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "sales_leads_lastActivityAt_idx" ON "sales_leads"("lastActivityAt");`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "sales_activities" (
        "id" TEXT PRIMARY KEY,
        "leadId" TEXT NOT NULL REFERENCES "sales_leads"("id") ON DELETE CASCADE,
        "userId" TEXT NOT NULL REFERENCES "users"("id"),
        "type" "SalesActivityType" NOT NULL,
        "outcome" TEXT,
        "subject" TEXT,
        "body" TEXT,
        "durationSec" INTEGER,
        "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "externalRef" TEXT,
        "status" TEXT
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "sales_activities_leadId_ts_idx" ON "sales_activities"("leadId","ts");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "sales_activities_userId_ts_idx" ON "sales_activities"("userId","ts");`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "sales_tasks" (
        "id" TEXT PRIMARY KEY,
        "leadId" TEXT NOT NULL REFERENCES "sales_leads"("id") ON DELETE CASCADE,
        "assigneeId" TEXT NOT NULL REFERENCES "users"("id"),
        "type" "SalesTaskType" NOT NULL,
        "status" "SalesTaskStatus" NOT NULL DEFAULT 'PENDING',
        "dueAt" TIMESTAMP(3) NOT NULL,
        "doneAt" TIMESTAMP(3),
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "sales_tasks_assignee_status_due_idx" ON "sales_tasks"("assigneeId","status","dueAt");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "sales_tasks_leadId_status_idx" ON "sales_tasks"("leadId","status");`);

    console.log('[boot-migrate] sales CRM schema OK');
  } catch (e) {
    console.warn('[boot-migrate] ensureSalesCrmSchema falló (no bloqueante):', e.message);
  }
}

/**
 * Agrega campos a directory_accounts: mustChangePassword (clave temporal
 * cuando la cuenta nace por captación) + createdByUserId (quién la creó).
 */
async function ensureDirectoryAccountColumns(prisma) {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "directory_accounts" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "directory_accounts" ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT;`);
    console.log('[boot-migrate] directory_accounts columns OK');
  } catch (e) {
    console.warn('[boot-migrate] ensureDirectoryAccountColumns falló (no bloqueante):', e.message);
  }
}

async function ensureSalesGoalsColumn(prisma) {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "salesGoals" JSONB;`);
    console.log('[boot-migrate] users.salesGoals OK');
  } catch (e) {
    console.warn('[boot-migrate] ensureSalesGoalsColumn falló (no bloqueante):', e.message);
  }
}

/**
 * Punto único: corre todas las migraciones idempotentes.
 */
async function runBootMigrations(prisma) {
  await extendTrialsTo120(prisma);
  await ensureSalesCrmSchema(prisma);
  await ensureDirectoryAccountColumns(prisma);
  await ensureSalesGoalsColumn(prisma);
}

module.exports = { runBootMigrations };
