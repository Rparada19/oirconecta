-- Plataforma de alcance de la campaña (TODAS o valor del catálogo)
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "plataformaCampana" TEXT;
