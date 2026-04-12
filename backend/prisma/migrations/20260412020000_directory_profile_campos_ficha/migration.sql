-- Ficha directorio: tipo persona, documento (no público), contacto público, banner, métricas, blog, chat, vínculo centro.

CREATE TYPE "DirectoryPersonaTipo" AS ENUM ('NATURAL', 'JURIDICA');

ALTER TABLE "directory_profiles" ADD COLUMN "personaTipo" "DirectoryPersonaTipo" NOT NULL DEFAULT 'NATURAL';
ALTER TABLE "directory_profiles" ADD COLUMN "documentoIdentidad" TEXT;
ALTER TABLE "directory_profiles" ADD COLUMN "direccionPublica" TEXT;
ALTER TABLE "directory_profiles" ADD COLUMN "telefonoPublico" TEXT;
ALTER TABLE "directory_profiles" ADD COLUMN "emailPublico" TEXT;
ALTER TABLE "directory_profiles" ADD COLUMN "bannerUrl" TEXT;
ALTER TABLE "directory_profiles" ADD COLUMN "perfilVisitas" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "directory_profiles" ADD COLUMN "estadisticasCitas" JSONB;
ALTER TABLE "directory_profiles" ADD COLUMN "blogMarkdown" TEXT;
ALTER TABLE "directory_profiles" ADD COLUMN "liveChatUrl" TEXT;
ALTER TABLE "directory_profiles" ADD COLUMN "titulosSecciones" JSONB;
ALTER TABLE "directory_profiles" ADD COLUMN "parentProfileId" TEXT;

CREATE INDEX "directory_profiles_parentProfileId_idx" ON "directory_profiles"("parentProfileId");

ALTER TABLE "directory_profiles" ADD CONSTRAINT "directory_profiles_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "directory_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
