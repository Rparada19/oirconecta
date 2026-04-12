-- Tablas del directorio público (DirectoryAccount / DirectoryProfile / DirectoryWorkplace).
-- Corrige entornos donde solo existía el fragmento anterior de `directory_workplaces` sin `directory_accounts`.

-- Quitar workplaces antiguos si apuntaban a otro esquema (se recrean abajo con FK correcta)
DROP TABLE IF EXISTS "directory_workplaces" CASCADE;

-- Enum de estado de ficha (idempotente si ya existía por un push previo)
DO $$ BEGIN
    CREATE TYPE "DirectoryProfileStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE "directory_accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "directory_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "directory_accounts_email_key" ON "directory_accounts"("email");

CREATE TABLE "directory_profiles" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" "DirectoryProfileStatus" NOT NULL DEFAULT 'PENDING',
    "nombreConsultorio" TEXT,
    "profesion" TEXT,
    "polizasAceptadas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allies" JSONB,
    "studies" JSONB,
    "videoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "availability" JSONB,
    "consultation" JSONB,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByCrmUserId" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "directory_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "directory_profiles_accountId_key" ON "directory_profiles"("accountId");

ALTER TABLE "directory_profiles" ADD CONSTRAINT "directory_profiles_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "directory_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "directory_workplaces" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "nombreCentro" TEXT NOT NULL,
    "direccion" TEXT,
    "ciudad" TEXT,
    "telefono" TEXT,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "directory_workplaces_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "directory_workplaces_profileId_idx" ON "directory_workplaces"("profileId");

CREATE INDEX "directory_workplaces_ciudad_idx" ON "directory_workplaces"("ciudad");

ALTER TABLE "directory_workplaces" ADD CONSTRAINT "directory_workplaces_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "directory_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
