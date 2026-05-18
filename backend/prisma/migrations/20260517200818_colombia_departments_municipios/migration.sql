-- ===========================================
-- Catálogo Colombia: Departments + ampliación de Cities
-- Esta migración va encima de la F1 (que crea cities sin departmentId).
-- Solo AGREGA: tabla departments + columnas en cities + índices/FKs.
-- ===========================================

CREATE TABLE "departments" (
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
CREATE UNIQUE INDEX "departments_slug_key" ON "departments"("slug");
CREATE UNIQUE INDEX "departments_codigoDane_key" ON "departments"("codigoDane");

ALTER TABLE "cities" ADD COLUMN "departmentId" TEXT;
ALTER TABLE "cities" ADD COLUMN "codigoDane" TEXT;
ALTER TABLE "cities" ADD COLUMN "categoria" TEXT;

CREATE UNIQUE INDEX "cities_codigoDane_key" ON "cities"("codigoDane");
CREATE INDEX "cities_departmentId_idx" ON "cities"("departmentId");
CREATE INDEX "cities_categoria_idx" ON "cities"("categoria");

ALTER TABLE "cities" ADD CONSTRAINT "cities_departmentId_fkey"
  FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
