-- ===========================================
-- Fase 1: Directorio Airbnb-grade (idempotente)
--
-- Esta versión envuelve cada CREATE TYPE / CREATE TABLE / ALTER TABLE
-- en bloques que no fallan si el objeto ya existe. Útil cuando el
-- histórico de migraciones del repo está desfasado del estado real
-- de la base (algunas migraciones marcadas como aplicadas sin haber
-- ejecutado su SQL).
-- ===========================================

-- ── Enum DirectoryProfileStatus: garantizar existencia y agregar NEEDS_CHANGES ──
DO $$ BEGIN
  CREATE TYPE "DirectoryProfileStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "DirectoryProfileStatus" ADD VALUE IF NOT EXISTS 'NEEDS_CHANGES';

-- ── Otros enums base que el resto del proyecto asume (idempotentes) ──
DO $$ BEGIN
  CREATE TYPE "DirectoryPersonaTipo" AS ENUM ('NATURAL', 'JURIDICA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DirectoryInquiryStatus" AS ENUM ('NEW', 'READ', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Enums nuevos F1 ──
DO $$ BEGIN
  CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REPORTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ReportStatus" AS ENUM ('NEW', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tabla professions ──
CREATE TABLE IF NOT EXISTS "professions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreFemenino" TEXT,
    "sinonimos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "descripcion" TEXT,
    "iconUrl" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "professions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "professions_slug_key" ON "professions"("slug");

-- ── Tabla cities ──
CREATE TABLE IF NOT EXISTS "cities" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "departamento" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'CO',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "cities_slug_key" ON "cities"("slug");

-- ── Tabla reviews ──
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "authorPhone" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "moderatedAt" TIMESTAMP(3),
    "moderatedByCrmUserId" TEXT,
    "moderationNote" TEXT,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "reportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "reviews_profileId_status_idx" ON "reviews"("profileId", "status");
CREATE INDEX IF NOT EXISTS "reviews_profileId_createdAt_idx" ON "reviews"("profileId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "directory_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tabla reports ──
CREATE TABLE IF NOT EXISTS "reports" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "reviewId" TEXT,
    "reporterName" TEXT,
    "reporterEmail" TEXT,
    "motivo" TEXT NOT NULL,
    "detalle" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'NEW',
    "resolvedAt" TIMESTAMP(3),
    "resolvedByCrmUserId" TEXT,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "reports_profileId_status_idx" ON "reports"("profileId", "status");
CREATE INDEX IF NOT EXISTS "reports_reviewId_status_idx" ON "reports"("reviewId", "status");
DO $$ BEGIN
  ALTER TABLE "reports" ADD CONSTRAINT "reports_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "directory_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewId_fkey"
    FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tabla profile_views (log) ──
CREATE TABLE IF NOT EXISTS "profile_views" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "source" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "profile_views_profileId_viewedAt_idx" ON "profile_views"("profileId", "viewedAt");
DO $$ BEGIN
  ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "directory_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Campos nuevos en directory_profiles ──
ALTER TABLE "directory_profiles" ADD COLUMN IF NOT EXISTS "professionId" TEXT;
ALTER TABLE "directory_profiles" ADD COLUMN IF NOT EXISTS "cityId" TEXT;
ALTER TABLE "directory_profiles" ADD COLUMN IF NOT EXISTS "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "directory_profiles" ADD COLUMN IF NOT EXISTS "reviewsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "directory_profiles" ADD COLUMN IF NOT EXISTS "viewsCount30d" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "directory_profiles" ADD COLUMN IF NOT EXISTS "completeness" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "directory_profiles" ADD COLUMN IF NOT EXISTS "rankingScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "directory_profiles" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "directory_profiles" ADD COLUMN IF NOT EXISTS "isSponsored" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "directory_profiles" ADD COLUMN IF NOT EXISTS "sponsoredUntil" TIMESTAMP(3);
ALTER TABLE "directory_profiles" ADD COLUMN IF NOT EXISTS "needsChangesNote" TEXT;

DO $$ BEGIN
  ALTER TABLE "directory_profiles" ADD CONSTRAINT "directory_profiles_professionId_fkey"
    FOREIGN KEY ("professionId") REFERENCES "professions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "directory_profiles" ADD CONSTRAINT "directory_profiles_cityId_fkey"
    FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "directory_profiles_professionId_idx" ON "directory_profiles"("professionId");
CREATE INDEX IF NOT EXISTS "directory_profiles_cityId_idx" ON "directory_profiles"("cityId");
CREATE INDEX IF NOT EXISTS "directory_profiles_status_rankingScore_idx" ON "directory_profiles"("status", "rankingScore");
CREATE INDEX IF NOT EXISTS "directory_profiles_isFeatured_rankingScore_idx" ON "directory_profiles"("isFeatured", "rankingScore");
CREATE INDEX IF NOT EXISTS "directory_profiles_isSponsored_sponsoredUntil_idx" ON "directory_profiles"("isSponsored", "sponsoredUntil");
