/**
 * Resolución del DirectoryProfile interno del COMERCIAL de captación de OírConecta.
 *
 * El comercial (por ahora el propio admin) coordina reuniones con profesionales
 * prospecto para el directorio. Su agenda se materializa como un DirectoryProfile
 * interno (`listedPublic = false` → NO aparece en el directorio público) que
 * reutiliza todo el motor de agenda (professionalSchedule.service + booking +
 * Google Calendar + bloqueos), igual que el retail.
 *
 * Prioridad de resolución:
 *   1. env COMERCIAL_PROFESSIONAL_ID (si existe en DB).
 *   2. env COMERCIAL_PROFESSIONAL_EMAIL → lookup DirectoryAccount → profile.id.
 *   3. Email fijo por convención (comercial@oirconecta.com), creado por
 *      scripts/seed_oirconecta_comercial.js.
 *
 * Cachea in-memory tras el primer hit exitoso.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const COMERCIAL_EMAIL_DEFAULT = 'comercial@oirconecta.com';

let _cached = null;

async function getComercialProfileId() {
  if (_cached) return _cached;

  const envId = process.env.COMERCIAL_PROFESSIONAL_ID || null;
  if (envId) {
    const exists = await prisma.directoryProfile.findUnique({
      where: { id: envId }, select: { id: true },
    });
    if (exists) { _cached = envId; return envId; }
    console.warn('[comercial] COMERCIAL_PROFESSIONAL_ID', envId, 'no existe en DB; caigo a lookup por email.');
  }

  const email = (process.env.COMERCIAL_PROFESSIONAL_EMAIL || COMERCIAL_EMAIL_DEFAULT).toLowerCase();
  const account = await prisma.directoryAccount.findUnique({
    where: { email },
    select: { profile: { select: { id: true } } },
  });
  const id = account?.profile?.id || null;
  if (id) _cached = id;
  return id;
}

/** Sólo tests. */
function _resetCache() { _cached = null; }

module.exports = { getComercialProfileId, COMERCIAL_EMAIL_DEFAULT, _resetCache };
