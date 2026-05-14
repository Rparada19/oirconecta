-- Válido para 1 audífono, 2 audífonos o ambos casos
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "validezCantidadAudifonos" TEXT;
