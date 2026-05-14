-- Productos del catálogo (IDs en config CRM) asociados a la campaña
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "catalogProductIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
