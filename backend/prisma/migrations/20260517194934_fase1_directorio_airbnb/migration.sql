-- ===========================================
-- Fase 1: Directorio Airbnb-grade
-- - Catálogo de profesiones y ciudades
-- - Reseñas y reportes con moderación
-- - Log de visitas para ranking
-- - Campos cache (rating, reviews, views, ranking) en directory_profiles
-- - Estado NEEDS_CHANGES para flujo admin "pedir ajustes"
--
-- Esta migración solo AGREGA. No mueve ni borra datos existentes.
-- ===========================================

-- ── Enum: nuevo estado NEEDS_CHANGES ──
ALTER TYPE "DirectoryProfileStatus" ADD VALUE IF NOT EXISTS 'NEEDS_CHANGES';

-- ── Enums nuevos ──
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REPORTED');
CREATE TYPE "ReportStatus" AS ENUM ('NEW', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- ── Tabla professions ──
CREATE TABLE "professions" (
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
CREATE UNIQUE INDEX "professions_slug_key" ON "professions"("slug");

-- ── Tabla cities ──
CREATE TABLE "cities" (
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
CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");

-- ── Tabla reviews ──
CREATE TABLE "reviews" (
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
CREATE INDEX "reviews_profileId_status_idx" ON "reviews"("profileId", "status");
CREATE INDEX "reviews_profileId_createdAt_idx" ON "reviews"("profileId", "createdAt");
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "directory_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Tabla reports ──
CREATE TABLE "reports" (
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
CREATE INDEX "reports_profileId_status_idx" ON "reports"("profileId", "status");
CREATE INDEX "reports_reviewId_status_idx" ON "reports"("reviewId", "status");
ALTER TABLE "reports" ADD CONSTRAINT "reports_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "directory_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Tabla profile_views (log) ──
CREATE TABLE "profile_views" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "source" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "profile_views_profileId_viewedAt_idx" ON "profile_views"("profileId", "viewedAt");
ALTER TABLE "profile_views" ADD CONSTRAINT "profile_views_profileId_fkey"
  FOREIGN KEY ("profileId") REFERENCES "directory_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Campos nuevos en directory_profiles ──
ALTER TABLE "directory_profiles" ADD COLUMN "professionId" TEXT;
ALTER TABLE "directory_profiles" ADD COLUMN "cityId" TEXT;
ALTER TABLE "directory_profiles" ADD COLUMN "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "directory_profiles" ADD COLUMN "reviewsCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "directory_profiles" ADD COLUMN "viewsCount30d" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "directory_profiles" ADD COLUMN "completeness" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "directory_profiles" ADD COLUMN "rankingScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "directory_profiles" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "directory_profiles" ADD COLUMN "isSponsored" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "directory_profiles" ADD COLUMN "sponsoredUntil" TIMESTAMP(3);
ALTER TABLE "directory_profiles" ADD COLUMN "needsChangesNote" TEXT;

ALTER TABLE "directory_profiles" ADD CONSTRAINT "directory_profiles_professionId_fkey"
  FOREIGN KEY ("professionId") REFERENCES "professions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "directory_profiles" ADD CONSTRAINT "directory_profiles_cityId_fkey"
  FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "directory_profiles_professionId_idx" ON "directory_profiles"("professionId");
CREATE INDEX "directory_profiles_cityId_idx" ON "directory_profiles"("cityId");
CREATE INDEX "directory_profiles_status_rankingScore_idx" ON "directory_profiles"("status", "rankingScore");
CREATE INDEX "directory_profiles_isFeatured_rankingScore_idx" ON "directory_profiles"("isFeatured", "rankingScore");
CREATE INDEX "directory_profiles_isSponsored_sponsoredUntil_idx" ON "directory_profiles"("isSponsored", "sponsoredUntil");
