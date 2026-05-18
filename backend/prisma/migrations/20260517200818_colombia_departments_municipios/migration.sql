-- ===========================================
-- Catálogo Colombia: Departments + ampliación de Cities (idempotente)
-- ===========================================

CREATE TABLE IF NOT EXISTS "departments" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigoDane" TEXT,
    "capital" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'CO',
    "region" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "departments_slug_key" ON "departments"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "departments_codigoDane_key" ON "departments"("codigoDane");

ALTER TABLE "cities" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;
ALTER TABLE "cities" ADD COLUMN IF NOT EXISTS "codigoDane" TEXT;
ALTER TABLE "cities" ADD COLUMN IF NOT EXISTS "categoria" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "cities_codigoDane_key" ON "cities"("codigoDane");
CREATE INDEX IF NOT EXISTS "cities_departmentId_idx" ON "cities"("departmentId");
CREATE INDEX IF NOT EXISTS "cities_categoria_idx" ON "cities"("categoria");

DO $$ BEGIN
  ALTER TABLE "cities" ADD CONSTRAINT "cities_departmentId_fkey"
    FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
