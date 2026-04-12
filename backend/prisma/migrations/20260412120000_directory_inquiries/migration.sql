-- Buzón de mensajes desde la ficha pública del directorio

CREATE TYPE "DirectoryInquiryStatus" AS ENUM ('NEW', 'READ', 'ARCHIVED');

CREATE TABLE "directory_inquiries" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "mensaje" TEXT,
    "status" "DirectoryInquiryStatus" NOT NULL DEFAULT 'NEW',
    "readAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "ownerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "directory_inquiries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "directory_inquiries_profileId_createdAt_idx" ON "directory_inquiries"("profileId", "createdAt");

CREATE INDEX "directory_inquiries_profileId_status_idx" ON "directory_inquiries"("profileId", "status");

ALTER TABLE "directory_inquiries" ADD CONSTRAINT "directory_inquiries_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "directory_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
