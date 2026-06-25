-- ═══════════════════════════════════════════════════════════════════
-- FASE 1 — CRM CLÍNICO OÍR CONECTA
-- Sede, Consent, AuditLog, DataAccessLog, Reminder, Notification,
-- NotificationTemplate, PatientPreferences, Task.
-- + ajustes a patients, leads, appointments.
--
-- IDEMPOTENTE donde es razonable. Revisa antes de aplicar en Neon.
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- ENUMS
-- ───────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "ConsentType" AS ENUM (
    'DATA_TREATMENT', 'CLINICAL', 'TELEMEDICINE', 'MARKETING', 'IMAGE_USE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AuditAction" AS ENUM (
    'CREATE', 'UPDATE', 'DELETE', 'ARCHIVE', 'RESTORE',
    'SIGN', 'EXPORT', 'LOGIN', 'LOGOUT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ReminderStatus" AS ENUM (
    'PENDING', 'QUEUED', 'SENT', 'FAILED', 'CANCELLED', 'SKIPPED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TaskStatus" AS ENUM (
    'OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ───────────────────────────────────────────────────────────────────
-- SEDES (multi-sede preparado; arranca con 1)
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE "sedes" (
  "id"         TEXT PRIMARY KEY,
  "slug"       TEXT NOT NULL UNIQUE,
  "nombre"     TEXT NOT NULL,
  "direccion"  TEXT,
  "ciudad"     TEXT,
  "telefono"   TEXT,
  "email"      TEXT,
  "repsCodigo" TEXT,
  "horario"    JSONB,
  "activo"     BOOLEAN NOT NULL DEFAULT true,
  "orden"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL
);

-- Sede semilla (la única hoy)
INSERT INTO "sedes" ("id", "slug", "nombre", "ciudad", "activo", "updatedAt")
VALUES (gen_random_uuid()::text, 'oirconecta-principal', 'OÍR Conecta — Sede Principal', 'Bogotá', true, CURRENT_TIMESTAMP);

-- ───────────────────────────────────────────────────────────────────
-- PATIENTS — soltar @unique email, agregar sedeId, archivedAt,
--            unicidad por (tipoDocumento, numeroDocumento)
-- ───────────────────────────────────────────────────────────────────

-- Soltar el unique sobre email. Nombre real del índice puede variar;
-- borramos por nombre estándar de Prisma.
DROP INDEX IF EXISTS "patients_email_key";

ALTER TABLE "patients" ALTER COLUMN "email" DROP NOT NULL;

ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "sedeId"     TEXT;
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "patients_tipoDocumento_numeroDocumento_key"
  ON "patients" ("tipoDocumento", "numeroDocumento");

CREATE INDEX IF NOT EXISTS "patients_sedeId_idx"     ON "patients" ("sedeId");
CREATE INDEX IF NOT EXISTS "patients_archivedAt_idx" ON "patients" ("archivedAt");

ALTER TABLE "patients"
  ADD CONSTRAINT "patients_sedeId_fkey"
  FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ───────────────────────────────────────────────────────────────────
-- LEADS — sedeId, archivedAt
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "sedeId"     TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "leads_sedeId_idx"     ON "leads" ("sedeId");
CREATE INDEX IF NOT EXISTS "leads_archivedAt_idx" ON "leads" ("archivedAt");

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_sedeId_fkey"
  FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ───────────────────────────────────────────────────────────────────
-- APPOINTMENTS — sedeId, needsAssignment
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "sedeId"          TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "needsAssignment" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "appointments_sedeId_idx"          ON "appointments" ("sedeId");
CREATE INDEX IF NOT EXISTS "appointments_needsAssignment_idx" ON "appointments" ("needsAssignment");

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_sedeId_fkey"
  FOREIGN KEY ("sedeId") REFERENCES "sedes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ───────────────────────────────────────────────────────────────────
-- CONSENTS (Ley 1581, Res. 2003/2014, Res. 2654/2019)
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE "consents" (
  "id"            TEXT PRIMARY KEY,
  "patientId"     TEXT NOT NULL,
  "type"          "ConsentType" NOT NULL,
  "version"       TEXT NOT NULL,
  "signedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "method"        TEXT NOT NULL,
  "ip"            TEXT,
  "userAgent"     TEXT,
  "pdfUrl"        TEXT,
  "pdfHash"       TEXT,
  "revokedAt"     TIMESTAMP(3),
  "revokedReason" TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "consents_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "consents_patientId_type_idx" ON "consents" ("patientId", "type");
CREATE INDEX "consents_type_version_idx"   ON "consents" ("type", "version");
CREATE INDEX "consents_signedAt_idx"       ON "consents" ("signedAt");

-- ───────────────────────────────────────────────────────────────────
-- AUDIT LOG (mutaciones sobre entidades sensibles)
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE "audit_logs" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT,
  "userEmail" TEXT,
  "action"    "AuditAction" NOT NULL,
  "entity"    TEXT NOT NULL,
  "entityId"  TEXT NOT NULL,
  "before"    JSONB,
  "after"     JSONB,
  "ip"        TEXT,
  "userAgent" TEXT,
  "reason"    TEXT,
  "at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs" ("entity", "entityId");
CREATE INDEX "audit_logs_userId_at_idx"        ON "audit_logs" ("userId", "at");
CREATE INDEX "audit_logs_action_at_idx"        ON "audit_logs" ("action", "at");
CREATE INDEX "audit_logs_at_idx"               ON "audit_logs" ("at");

-- ───────────────────────────────────────────────────────────────────
-- DATA ACCESS LOG (lecturas de HC)
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE "data_access_logs" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT,
  "userEmail" TEXT,
  "patientId" TEXT NOT NULL,
  "entity"    TEXT NOT NULL,
  "action"    TEXT NOT NULL DEFAULT 'READ',
  "reason"    TEXT,
  "ip"        TEXT,
  "userAgent" TEXT,
  "at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "data_access_logs_patientId_at_idx" ON "data_access_logs" ("patientId", "at");
CREATE INDEX "data_access_logs_userId_at_idx"    ON "data_access_logs" ("userId", "at");
CREATE INDEX "data_access_logs_at_idx"           ON "data_access_logs" ("at");

-- ───────────────────────────────────────────────────────────────────
-- NOTIFICACIONES
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE "notification_templates" (
  "id"               TEXT PRIMARY KEY,
  "code"             TEXT NOT NULL,
  "channel"          TEXT NOT NULL,
  "locale"           TEXT NOT NULL DEFAULT 'es-CO',
  "subject"          TEXT,
  "body"             TEXT NOT NULL,
  "metaTemplateName" TEXT,
  "variables"        TEXT[] NOT NULL DEFAULT '{}',
  "category"         TEXT NOT NULL DEFAULT 'TRANSACTIONAL',
  "optOutAllowed"    BOOLEAN NOT NULL DEFAULT false,
  "activo"           BOOLEAN NOT NULL DEFAULT true,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "notification_templates_code_channel_locale_key"
  ON "notification_templates" ("code", "channel", "locale");
CREATE INDEX "notification_templates_channel_activo_idx"
  ON "notification_templates" ("channel", "activo");

CREATE TABLE "notifications" (
  "id"                TEXT PRIMARY KEY,
  "patientId"         TEXT NOT NULL,
  "templateCode"      TEXT NOT NULL,
  "channel"           TEXT NOT NULL,
  "eventCode"         TEXT NOT NULL,
  "toAddress"         TEXT NOT NULL,
  "renderedPayload"   JSONB,
  "provider"          TEXT NOT NULL,
  "providerMessageId" TEXT,
  "status"            TEXT NOT NULL DEFAULT 'SENT',
  "errorCode"         TEXT,
  "errorMessage"      TEXT,
  "costCOP"           INTEGER,
  "sentAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveredAt"       TIMESTAMP(3),
  "readAt"            TIMESTAMP(3),
  "failedAt"          TIMESTAMP(3),
  "webhookEvents"     JSONB,
  CONSTRAINT "notifications_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "notifications_patientId_sentAt_idx"   ON "notifications" ("patientId", "sentAt");
CREATE INDEX "notifications_providerMessageId_idx"  ON "notifications" ("providerMessageId");
CREATE INDEX "notifications_eventCode_sentAt_idx"   ON "notifications" ("eventCode", "sentAt");
CREATE INDEX "notifications_status_idx"             ON "notifications" ("status");

CREATE TABLE "reminders" (
  "id"             TEXT PRIMARY KEY,
  "patientId"      TEXT NOT NULL,
  "templateCode"   TEXT NOT NULL,
  "channel"        TEXT NOT NULL,
  "targetType"     TEXT,
  "targetId"       TEXT,
  "eventCode"      TEXT NOT NULL,
  "payload"        JSONB,
  "scheduledFor"   TIMESTAMP(3) NOT NULL,
  "status"         "ReminderStatus" NOT NULL DEFAULT 'PENDING',
  "attempts"       INTEGER NOT NULL DEFAULT 0,
  "lastError"      TEXT,
  "sentAt"         TIMESTAMP(3),
  "notificationId" TEXT UNIQUE,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reminders_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "reminders_status_scheduledFor_idx"
  ON "reminders" ("status", "scheduledFor");
CREATE INDEX "reminders_patientId_eventCode_idx"
  ON "reminders" ("patientId", "eventCode");
CREATE INDEX "reminders_target_event_idx"
  ON "reminders" ("targetType", "targetId", "eventCode");

CREATE TABLE "patient_preferences" (
  "patientId"        TEXT PRIMARY KEY,
  "channelPreferred" TEXT NOT NULL DEFAULT 'WHATSAPP',
  "marketingOptIn"   BOOLEAN NOT NULL DEFAULT false,
  "quietHoursStart"  TEXT DEFAULT '20:00',
  "quietHoursEnd"    TEXT DEFAULT '07:00',
  "locale"           TEXT NOT NULL DEFAULT 'es-CO',
  "hardOptOutAt"     TIMESTAMP(3),
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "patient_preferences_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ───────────────────────────────────────────────────────────────────
-- TASKS (trabajo humano: recepción/audiólogas)
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE "tasks" (
  "id"               TEXT PRIMARY KEY,
  "patientId"        TEXT,
  "type"             TEXT NOT NULL,
  "title"            TEXT NOT NULL,
  "description"      TEXT,
  "assignedToId"     TEXT,
  "createdBy"        TEXT,
  "dueAt"            TIMESTAMP(3),
  "status"           "TaskStatus" NOT NULL DEFAULT 'OPEN',
  "priority"         TEXT NOT NULL DEFAULT 'NORMAL',
  "sourceEventCode"  TEXT,
  "sourceReminderId" TEXT,
  "resolvedAt"       TIMESTAMP(3),
  "resolution"       TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "tasks_patientId_fkey"
    FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "tasks_assignedToId_status_idx" ON "tasks" ("assignedToId", "status");
CREATE INDEX "tasks_patientId_status_idx"     ON "tasks" ("patientId", "status");
CREATE INDEX "tasks_dueAt_idx"                ON "tasks" ("dueAt");
CREATE INDEX "tasks_status_priority_idx"      ON "tasks" ("status", "priority");

-- ═══════════════════════════════════════════════════════════════════
-- BACKFILL SUGERIDO (NO ejecutado automático — descomentar tras revisar)
-- ═══════════════════════════════════════════════════════════════════

-- UPDATE "patients"
-- SET "sedeId" = (SELECT "id" FROM "sedes" WHERE "slug" = 'oirconecta-principal')
-- WHERE "sedeId" IS NULL;

-- UPDATE "appointments"
-- SET "sedeId" = (SELECT "id" FROM "sedes" WHERE "slug" = 'oirconecta-principal')
-- WHERE "sedeId" IS NULL;

-- INSERT INTO "patient_preferences" ("patientId", "updatedAt")
-- SELECT "id", CURRENT_TIMESTAMP FROM "patients"
-- WHERE "id" NOT IN (SELECT "patientId" FROM "patient_preferences");
