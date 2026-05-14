-- Campos extendidos de campañas (marketing / CRM admin)
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "proveedorNombre" TEXT;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "referenciaDescuento" TEXT;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "tecnologiaDescuento" TEXT;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "alimentacionAudifono" TEXT;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "descripcion" TEXT;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "incluye" TEXT;
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "noIncluye" TEXT;

-- Al eliminar campaña: conservar cotizaciones/ventas sin FK rota
ALTER TABLE "quotes" DROP CONSTRAINT IF EXISTS "quotes_campaignId_fkey";
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales" DROP CONSTRAINT IF EXISTS "sales_campaignId_fkey";
ALTER TABLE "sales" ADD CONSTRAINT "sales_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
