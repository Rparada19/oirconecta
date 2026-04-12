-- Ficha directorio: foto de perfil dedicada y enlaces de mapa Google (embed + lugar).

ALTER TABLE "directory_profiles" ADD COLUMN "fotoPerfilUrl" TEXT;
ALTER TABLE "directory_profiles" ADD COLUMN "googleMapsEmbedUrl" TEXT;
ALTER TABLE "directory_profiles" ADD COLUMN "googleMapsLugarUrl" TEXT;
