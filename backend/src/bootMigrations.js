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

async function ensureSalesActivityDirection(prisma) {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "sales_activities" ADD COLUMN IF NOT EXISTS "direction" TEXT DEFAULT 'out';`);
    console.log('[boot-migrate] sales_activities.direction OK');
  } catch (e) {
    console.warn('[boot-migrate] ensureSalesActivityDirection falló:', e.message);
  }
}

async function ensureBlogPostStructure(prisma) {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "cierre" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ctaTexto" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "ctaUrl" TEXT;`);
    console.log('[boot-migrate] blog_posts structure OK');
  } catch (e) {
    console.warn('[boot-migrate] ensureBlogPostStructure falló:', e.message);
  }
}

/**
 * F1 nuevos planes (Plan 2 con agenda, Plan 3 con IA).
 * Agrega valores al enum PlanCode + columnas nuevas a plans y subscriptions.
 */
async function ensurePlanFeatureColumns(prisma) {
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "PlanCode" ADD VALUE IF NOT EXISTS 'PLAN_2_ANUAL'`);
    await prisma.$executeRawUnsafe(`ALTER TYPE "PlanCode" ADD VALUE IF NOT EXISTS 'PLAN_3_MENSUAL'`);

    await prisma.$executeRawUnsafe(`ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "features" JSONB NOT NULL DEFAULT '{}';`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "trialDays" INTEGER NOT NULL DEFAULT 0;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "minCommitmentMonths" INTEGER;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "monthlyConversationLimit" INTEGER;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 0;`);

    await prisma.$executeRawUnsafe(`ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "commitmentEnd" TIMESTAMP(3);`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "iaConversationsUsed" INTEGER NOT NULL DEFAULT 0;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "iaConversationsPeriodAt" TIMESTAMP(3);`);

    console.log('[boot-migrate] plan feature columns OK');
  } catch (e) {
    console.warn('[boot-migrate] ensurePlanFeatureColumns falló (no bloqueante):', e.message);
  }
}

/**
 * F2.1 — Schema multi-tenant de agenda por profesional del directorio.
 * Crea 5 tablas + índices. Idempotente.
 */
async function ensureMultiTenantAgendaSchema(prisma) {
  try {
    // 1) ProfessionalScheduleConfig (singleton por perfil)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "professional_schedule_config" (
        "id" TEXT PRIMARY KEY,
        "profileId" TEXT NOT NULL UNIQUE REFERENCES "directory_profiles"("id") ON DELETE CASCADE,
        "defaultSlotMinutes" INTEGER NOT NULL DEFAULT 30,
        "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
        "bookingWindowDays" INTEGER NOT NULL DEFAULT 60,
        "minNoticeHours" INTEGER NOT NULL DEFAULT 2,
        "autoConfirm" BOOLEAN NOT NULL DEFAULT true,
        "timezone" TEXT NOT NULL DEFAULT 'America/Bogota',
        "agendaActiva" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2) ProfessionalAvailability (horario semanal)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "professional_availability" (
        "id" TEXT PRIMARY KEY,
        "profileId" TEXT NOT NULL REFERENCES "directory_profiles"("id") ON DELETE CASCADE,
        "dayOfWeek" INTEGER NOT NULL,
        "startTime" TEXT NOT NULL,
        "endTime" TEXT NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "professional_availability_profileId_dayOfWeek_idx" ON "professional_availability"("profileId","dayOfWeek");`);

    // 3) AppointmentType (tipos de consulta)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "appointment_types" (
        "id" TEXT PRIMARY KEY,
        "profileId" TEXT NOT NULL REFERENCES "directory_profiles"("id") ON DELETE CASCADE,
        "nombre" TEXT NOT NULL,
        "descripcion" TEXT,
        "durationMinutes" INTEGER NOT NULL DEFAULT 30,
        "priceCOP" INTEGER,
        "color" TEXT,
        "activo" BOOLEAN NOT NULL DEFAULT true,
        "orden" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "appointment_types_profileId_activo_orden_idx" ON "appointment_types"("profileId","activo","orden");`);

    // 4) ProfessionalBlock (bloqueos, vacaciones)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "professional_blocks" (
        "id" TEXT PRIMARY KEY,
        "profileId" TEXT NOT NULL REFERENCES "directory_profiles"("id") ON DELETE CASCADE,
        "allDay" BOOLEAN NOT NULL DEFAULT false,
        "startAt" TIMESTAMP(3) NOT NULL,
        "endAt" TIMESTAMP(3) NOT NULL,
        "motivo" TEXT,
        "tipo" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "professional_blocks_profileId_range_idx" ON "professional_blocks"("profileId","startAt","endAt");`);

    // 5) PatientProfessionalRelation (expediente independiente)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "patient_professional_relations" (
        "id" TEXT PRIMARY KEY,
        "patientId" TEXT NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
        "profileId" TEXT NOT NULL REFERENCES "directory_profiles"("id") ON DELETE CASCADE,
        "notasPrivadas" TEXT,
        "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        "archivedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "patient_professional_relations_patientId_profileId_key" UNIQUE ("patientId","profileId")
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "patient_professional_relations_profileId_archivedAt_idx" ON "patient_professional_relations"("profileId","archivedAt");`);

    console.log('[boot-migrate] multi-tenant agenda schema OK');
  } catch (e) {
    console.warn('[boot-migrate] ensureMultiTenantAgendaSchema falló (no bloqueante):', e.message);
  }
}

/**
 * Tras crear columnas vía ensurePlanFeatureColumns, siembra/sincroniza las
 * filas de la tabla `plans` con PLAN_DEFAULTS. Sin esto, PLAN_2_ANUAL y
 * PLAN_3_MENSUAL no aparecen en `getMySubscription().plansDisponibles`.
 */
async function seedPlanDefaults(prisma) {
  try {
    // Carga perezosa: requiere que las migraciones de schema ya hayan corrido.
    const subService = require('./services/subscription.service');
    await subService.ensurePlans();
    console.log('[boot-migrate] plan defaults seeded');
  } catch (e) {
    console.warn('[boot-migrate] seedPlanDefaults falló (no bloqueante):', e.message);
  }
}

/**
 * F5.5 — Personalización agente IA (nombre + color por profesional). Idempotente.
 */
async function ensureIaAgentConfigSchema(prisma) {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ia_agent_config" (
        "id" TEXT PRIMARY KEY,
        "profileId" TEXT NOT NULL UNIQUE REFERENCES "directory_profiles"("id") ON DELETE CASCADE,
        "agentName" TEXT NOT NULL DEFAULT 'Asistente',
        "agentColor" TEXT NOT NULL DEFAULT '#6d28d9',
        "welcomeMessage" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Columna agentIcon agregada en F5.5b (galería). ADD COLUMN idempotente.
    await prisma.$executeRawUnsafe(`ALTER TABLE "ia_agent_config" ADD COLUMN IF NOT EXISTS "agentIcon" TEXT NOT NULL DEFAULT 'smart_toy';`);
    // F5.6 — Educación del asistente (persona + FAQs). ADD COLUMN idempotente.
    await prisma.$executeRawUnsafe(`ALTER TABLE "ia_agent_config" ADD COLUMN IF NOT EXISTS "personality" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "ia_agent_config" ADD COLUMN IF NOT EXISTS "expertise" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "ia_agent_config" ADD COLUMN IF NOT EXISTS "signature" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "ia_agent_config" ADD COLUMN IF NOT EXISTS "avoidTopics" TEXT`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ia_agent_faqs" (
        "id" TEXT PRIMARY KEY,
        "configId" TEXT NOT NULL REFERENCES "ia_agent_config"("id") ON DELETE CASCADE,
        "question" TEXT NOT NULL,
        "answer" TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ia_agent_faqs_configId_isActive_order_idx" ON "ia_agent_faqs" ("configId", "isActive", "order")`);
    console.log('[boot-migrate] ia agent config schema OK');
  } catch (e) {
    console.warn('[boot-migrate] ensureIaAgentConfigSchema falló (no bloqueante):', e.message);
  }
}

/**
 * F5.4 — Paquetes de conversaciones IA (compra adicional al Plan 3). Idempotente.
 */
async function ensureIaPacksSchema(prisma) {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ia_conversation_packs" (
        "id" TEXT PRIMARY KEY,
        "subscriptionId" TEXT NOT NULL REFERENCES "subscriptions"("id") ON DELETE CASCADE,
        "totalConversations" INTEGER NOT NULL,
        "usedConversations" INTEGER NOT NULL DEFAULT 0,
        "priceCOP" INTEGER NOT NULL,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "paymentId" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ia_conversation_packs_sub_status_exp_idx" ON "ia_conversation_packs"("subscriptionId","status","expiresAt");`);
    console.log('[boot-migrate] ia packs schema OK');
  } catch (e) {
    console.warn('[boot-migrate] ensureIaPacksSchema falló (no bloqueante):', e.message);
  }
}

/**
 * F5.3 — Canal WhatsApp por profesional + columna externalMessageId en ia_messages
 * para idempotencia de webhook. Idempotente.
 */
async function ensureWhatsAppChannelSchema(prisma) {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "ia_messages" ADD COLUMN IF NOT EXISTS "externalMessageId" TEXT;`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ia_messages_externalMessageId_key" ON "ia_messages"("externalMessageId");`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "professional_whatsapp_channels" (
        "id" TEXT PRIMARY KEY,
        "profileId" TEXT NOT NULL UNIQUE REFERENCES "directory_profiles"("id") ON DELETE CASCADE,
        "phoneNumberId" TEXT NOT NULL UNIQUE,
        "phoneNumberE164" TEXT NOT NULL,
        "wabaId" TEXT,
        "displayName" TEXT,
        "active" BOOLEAN NOT NULL DEFAULT false,
        "verifiedAt" TIMESTAMP(3),
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "professional_whatsapp_channels_phoneNumberId_idx" ON "professional_whatsapp_channels"("phoneNumberId");`);

    console.log('[boot-migrate] whatsapp channel schema OK');
  } catch (e) {
    console.warn('[boot-migrate] ensureWhatsAppChannelSchema falló (no bloqueante):', e.message);
  }
}

/**
 * F5 — Schema IA (conversaciones + mensajes). Idempotente.
 */
async function ensureIaSchema(prisma) {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ia_conversations" (
        "id" TEXT PRIMARY KEY,
        "profileId" TEXT NOT NULL REFERENCES "directory_profiles"("id") ON DELETE CASCADE,
        "patientId" TEXT REFERENCES "patients"("id") ON DELETE SET NULL,
        "channel" TEXT NOT NULL DEFAULT 'web',
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "totalTokens" INTEGER NOT NULL DEFAULT 0,
        "resultedInAppointmentId" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ia_conversations_profileId_startedAt_idx" ON "ia_conversations"("profileId","startedAt");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ia_conversations_profileId_status_idx" ON "ia_conversations"("profileId","status");`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ia_messages" (
        "id" TEXT PRIMARY KEY,
        "conversationId" TEXT NOT NULL REFERENCES "ia_conversations"("id") ON DELETE CASCADE,
        "role" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "toolName" TEXT,
        "tokens" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ia_messages_conversationId_createdAt_idx" ON "ia_messages"("conversationId","createdAt");`);

    console.log('[boot-migrate] ia schema OK');
  } catch (e) {
    console.warn('[boot-migrate] ensureIaSchema falló (no bloqueante):', e.message);
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
  await ensureSalesActivityDirection(prisma);
  await ensureBlogPostStructure(prisma);
  await ensurePlanFeatureColumns(prisma);
  await ensureMultiTenantAgendaSchema(prisma);
  await ensureIaSchema(prisma);
  await ensureWhatsAppChannelSchema(prisma);
  await ensureIaPacksSchema(prisma);
  await ensureIaAgentConfigSchema(prisma);
  await ensureAppointmentCancellationColumns(prisma);
  await ensureGoogleCalendarSchema(prisma);
  await ensureAnalyticsSchema(prisma);
  await seedPlanDefaults(prisma);
}

async function ensureAnalyticsSchema(prisma) {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "analytics_events" (
        "id" TEXT PRIMARY KEY,
        "eventType" TEXT NOT NULL,
        "eventName" TEXT,
        "sessionId" TEXT NOT NULL,
        "visitorId" TEXT NOT NULL,
        "userId" TEXT,
        "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "path" TEXT,
        "pageType" TEXT,
        "referrer" TEXT,
        "utmSource" TEXT,
        "utmMedium" TEXT,
        "utmCampaign" TEXT,
        "utmContent" TEXT,
        "utmTerm" TEXT,
        "campaignId" TEXT,
        "entityType" TEXT,
        "entityId" TEXT,
        "ipMasked" TEXT,
        "city" TEXT,
        "region" TEXT,
        "country" TEXT,
        "device" TEXT,
        "os" TEXT,
        "browser" TEXT,
        "screenWidth" INTEGER,
        "screenHeight" INTEGER,
        "language" TEXT,
        "properties" JSONB,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "analytics_events_eventType_timestamp_idx" ON "analytics_events" ("eventType", "timestamp")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "analytics_events_sessionId_idx" ON "analytics_events" ("sessionId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "analytics_events_visitorId_idx" ON "analytics_events" ("visitorId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "analytics_events_campaignId_timestamp_idx" ON "analytics_events" ("campaignId", "timestamp")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "analytics_events_entityType_entityId_idx" ON "analytics_events" ("entityType", "entityId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "analytics_events_city_timestamp_idx" ON "analytics_events" ("city", "timestamp")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "analytics_events_device_timestamp_idx" ON "analytics_events" ("device", "timestamp")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "analytics_events_timestamp_idx" ON "analytics_events" ("timestamp")`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "analytics_sessions" (
        "id" TEXT PRIMARY KEY,
        "visitorId" TEXT NOT NULL,
        "userId" TEXT,
        "startedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "endedAt" TIMESTAMP(3),
        "durationSec" INTEGER,
        "pageCount" INTEGER DEFAULT 0 NOT NULL,
        "eventCount" INTEGER DEFAULT 0 NOT NULL,
        "entryPath" TEXT,
        "exitPath" TEXT,
        "utmSource" TEXT,
        "utmMedium" TEXT,
        "utmCampaign" TEXT,
        "ipMasked" TEXT,
        "city" TEXT,
        "region" TEXT,
        "country" TEXT,
        "device" TEXT,
        "os" TEXT,
        "browser" TEXT,
        "isNewVisitor" BOOLEAN DEFAULT TRUE NOT NULL,
        "isBounce" BOOLEAN DEFAULT FALSE NOT NULL,
        "hadLead" BOOLEAN DEFAULT FALSE NOT NULL,
        "hadBooking" BOOLEAN DEFAULT FALSE NOT NULL,
        "hadPurchase" BOOLEAN DEFAULT FALSE NOT NULL,
        "hadSubscription" BOOLEAN DEFAULT FALSE NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "analytics_sessions_visitorId_idx" ON "analytics_sessions" ("visitorId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "analytics_sessions_city_startedAt_idx" ON "analytics_sessions" ("city", "startedAt")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "analytics_sessions_device_startedAt_idx" ON "analytics_sessions" ("device", "startedAt")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "analytics_sessions_startedAt_idx" ON "analytics_sessions" ("startedAt")`);
    console.log('[boot-migrate] analytics schema OK');
  } catch (e) {
    console.warn('[boot-migrate] ensureAnalyticsSchema falló (no bloqueante):', e.message);
  }
}

async function ensureGoogleCalendarSchema(prisma) {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "google_calendar_channels" (
        "id" TEXT PRIMARY KEY,
        "profileId" TEXT UNIQUE NOT NULL,
        "refreshToken" TEXT NOT NULL,
        "accessToken" TEXT,
        "expiresAt" TIMESTAMP(3),
        "calendarId" TEXT DEFAULT 'primary' NOT NULL,
        "scopes" TEXT,
        "email" TEXT,
        "lastSyncAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);
    await prisma.$executeRawUnsafe(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "googleEventId" TEXT`);
    console.log('[boot-migrate] google calendar schema OK');
  } catch (e) {
    console.warn('[boot-migrate] ensureGoogleCalendarSchema falló (no bloqueante):', e.message);
  }
}

/**
 * C8.1 — Cancelación por paciente + seguimiento profesional.
 * Idempotente: usa ADD COLUMN IF NOT EXISTS.
 */
async function ensureAppointmentCancellationColumns(prisma) {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "cancelledByPatientAt" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "cancelReason" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "followUpDoneAt" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "followUpNotes" TEXT`);
    // F6 — solicitud de reseña post-cita
    await prisma.$executeRawUnsafe(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "reviewToken" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "reviewRequestedAt" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "reviewSubmittedAt" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "appointments_reviewToken_key" ON "appointments" ("reviewToken") WHERE "reviewToken" IS NOT NULL`);
    // T2-Gap3 — Control 15d post-cita
    await prisma.$executeRawUnsafe(`ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "control15SentAt" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "appointments_control15_scan_idx" ON "appointments" ("estado", "control15SentAt", "fecha")`);
    // T2-Gap1 — Nurture 7d de leads sin cita
    await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "nurture1SentAt" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "nurture3SentAt" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "nurture7SentAt" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "nurtureOptOut" BOOLEAN NOT NULL DEFAULT FALSE`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "leads_nurture_scan_idx" ON "leads" ("estado", "appointmentId", "nurture1SentAt")`);
    // T2-Gap4 — Cumpleaños + Referrals
    await prisma.$executeRawUnsafe(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "birthdayLastSentAt" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "referralCode" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "referredByCode" TEXT`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "patients_referralCode_key" ON "patients" ("referralCode") WHERE "referralCode" IS NOT NULL`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "patients_referredByCode_idx" ON "patients" ("referredByCode") WHERE "referredByCode" IS NOT NULL`);
    // T5 — Tabla de templates de notificaciones (buzón admin)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "notification_templates" (
        "id" TEXT PRIMARY KEY,
        "code" TEXT NOT NULL,
        "channel" TEXT NOT NULL,
        "locale" TEXT NOT NULL DEFAULT 'es-CO',
        "subject" TEXT,
        "body" TEXT NOT NULL,
        "metaTemplateName" TEXT,
        "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "category" TEXT NOT NULL DEFAULT 'TRANSACTIONAL',
        "optOutAllowed" BOOLEAN NOT NULL DEFAULT FALSE,
        "activo" BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "notification_templates_code_channel_locale_key" ON "notification_templates" ("code", "channel", "locale")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "notification_templates_channel_activo_idx" ON "notification_templates" ("channel", "activo")`);
    // F8 — Funnel controles post-adaptación
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "patient_follow_ups" (
        "id" TEXT PRIMARY KEY,
        "patientId" TEXT NOT NULL,
        "saleId" TEXT,
        "step" TEXT NOT NULL,
        "offsetDays" INTEGER NOT NULL,
        "dueDate" TIMESTAMP(3) NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "scheduledAppointmentId" TEXT,
        "reminder7dSentAt" TIMESTAMP(3),
        "reminder1dSentAt" TIMESTAMP(3),
        "overdueSentAt" TIMESTAMP(3),
        "completedAt" TIMESTAMP(3),
        "completedById" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "patient_follow_ups_patientId_step_key" ON "patient_follow_ups" ("patientId", "step")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "patient_follow_ups_status_dueDate_idx" ON "patient_follow_ups" ("status", "dueDate")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "patient_follow_ups_patientId_idx" ON "patient_follow_ups" ("patientId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "patient_follow_ups_saleId_idx" ON "patient_follow_ups" ("saleId")`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "patient_follow_ups" ADD COLUMN IF NOT EXISTS "scheduleToken" TEXT`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "patient_follow_ups_scheduleToken_key" ON "patient_follow_ups" ("scheduleToken") WHERE "scheduleToken" IS NOT NULL`);
    // F9 — WhatsApp corporativo (independiente del ProfessionalWhatsAppChannel del directorio)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "whatsapp_conversations" (
        "id" TEXT PRIMARY KEY,
        "phone" TEXT NOT NULL,
        "contactName" TEXT,
        "businessLine" TEXT NOT NULL DEFAULT 'CRM',
        "intent" TEXT NOT NULL DEFAULT 'SIN_CLASIFICAR',
        "status" TEXT NOT NULL DEFAULT 'HUMAN',
        "assignedToId" TEXT,
        "patientId" TEXT,
        "windowExpiresAt" TIMESTAMP(3),
        "unreadCount" INTEGER NOT NULL DEFAULT 0,
        "lastMessageAt" TIMESTAMP(3),
        "lastMessagePreview" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_conversations_phone_key" ON "whatsapp_conversations" ("phone")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "whatsapp_conversations_businessLine_status_updatedAt_idx" ON "whatsapp_conversations" ("businessLine", "status", "updatedAt")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "whatsapp_conversations_assignedToId_status_idx" ON "whatsapp_conversations" ("assignedToId", "status")`);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "whatsapp_messages" (
        "id" TEXT PRIMARY KEY,
        "conversationId" TEXT NOT NULL,
        "wamid" TEXT,
        "direction" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'text',
        "body" TEXT,
        "mediaUrl" TEXT,
        "mediaMimeType" TEXT,
        "sentByBot" BOOLEAN NOT NULL DEFAULT FALSE,
        "sentByUserId" TEXT,
        "deliveryStatus" TEXT,
        "errorMessage" TEXT,
        "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_messages_wamid_key" ON "whatsapp_messages" ("wamid") WHERE "wamid" IS NOT NULL`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "whatsapp_messages_conversationId_timestamp_idx" ON "whatsapp_messages" ("conversationId", "timestamp")`);
    // F9a.2 — Tipificación granular de contactos
    await prisma.$executeRawUnsafe(`ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "contactType" TEXT`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "whatsapp_conversations_contactType_idx" ON "whatsapp_conversations" ("contactType") WHERE "contactType" IS NOT NULL`);
    // F9d.1 — Vinculación con pipeline comercial
    await prisma.$executeRawUnsafe(`ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "salesLeadId" TEXT`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "whatsapp_conversations_salesLeadId_idx" ON "whatsapp_conversations" ("salesLeadId") WHERE "salesLeadId" IS NOT NULL`);
    console.log('[boot-migrate] appointment + review + nurture + birthday + referrals + notification_templates + follow_ups + whatsapp_conversations OK');
  } catch (e) {
    console.warn('[boot-migrate] ensureAppointmentCancellationColumns falló (no bloqueante):', e.message);
  }
}

module.exports = { runBootMigrations };
