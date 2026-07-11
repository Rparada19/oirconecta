/**
 * Asegura extensiones Postgres necesarias antes de que Prisma db push
 * intente crear tablas que las requieren (ej. vector para pgvector).
 *
 * Corre en el `start` script del backend, ANTES de `prisma db push`.
 * Neon plan Free archiva branches por inactividad y el CREATE EXTENSION
 * hecho a mano en el SQL editor a veces no persiste como esperado en
 * el contexto del deploy, así que lo forzamos en cada arranque.
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('[ensure_pg_extensions] vector OK');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('[ensure_pg_extensions] ERROR:', e.message);
  process.exit(1);
});
