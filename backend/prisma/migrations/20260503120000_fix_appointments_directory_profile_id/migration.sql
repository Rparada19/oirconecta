-- Idempotente: bases sin la migración 20260412140000 (o a medias) no tenían `directoryProfileId` en `appointments`.

ALTER TABLE "directory_profiles" ADD COLUMN IF NOT EXISTS "whatsappClickCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "directoryProfileId" TEXT;

CREATE INDEX IF NOT EXISTS "appointments_directoryProfileId_idx" ON "appointments"("directoryProfileId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    INNER JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'appointments'
      AND c.conname = 'appointments_directoryProfileId_fkey'
  ) THEN
    ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_directoryProfileId_fkey"
      FOREIGN KEY ("directoryProfileId") REFERENCES "directory_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
