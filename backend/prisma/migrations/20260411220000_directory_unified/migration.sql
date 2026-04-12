-- CreateTable
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "directory_workplaces_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "professional_directory_profiles" ADD COLUMN     "nombreConsultorio" TEXT,
ADD COLUMN     "profesion" TEXT,
ADD COLUMN     "polizasAceptadas" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "directory_workplaces_profileId_idx" ON "directory_workplaces"("profileId");

-- CreateIndex
CREATE INDEX "directory_workplaces_ciudad_idx" ON "directory_workplaces"("ciudad");

-- AddForeignKey
ALTER TABLE "directory_workplaces" ADD CONSTRAINT "directory_workplaces_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "professional_directory_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
