-- Métricas automáticas directorio: clics WhatsApp + citas vinculadas a la ficha

ALTER TABLE "directory_profiles" ADD COLUMN "whatsappClickCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "appointments" ADD COLUMN "directoryProfileId" TEXT;

CREATE INDEX "appointments_directoryProfileId_idx" ON "appointments"("directoryProfileId");

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_directoryProfileId_fkey" FOREIGN KEY ("directoryProfileId") REFERENCES "directory_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
