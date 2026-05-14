-- Cómo se aplica el porcentaje de descuento aprobado en cotización/venta
ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "aplicacionDescuento" TEXT DEFAULT 'TOTAL_VENTA';
UPDATE "campaigns" SET "aplicacionDescuento" = 'TOTAL_VENTA' WHERE "aplicacionDescuento" IS NULL;
