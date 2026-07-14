-- Link marketing_advertisers to directory_profiles (profesional como anunciante).
-- Idempotente.

ALTER TABLE "marketing_advertisers"
  ADD COLUMN IF NOT EXISTS "profileId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "marketing_advertisers_profileId_key"
  ON "marketing_advertisers"("profileId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'marketing_advertisers_profileId_fkey'
  ) THEN
    ALTER TABLE "marketing_advertisers"
      ADD CONSTRAINT "marketing_advertisers_profileId_fkey"
      FOREIGN KEY ("profileId") REFERENCES "directory_profiles"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
