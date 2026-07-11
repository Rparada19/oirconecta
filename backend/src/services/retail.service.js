/**
 * Resolución del DirectoryProfile del consultorio propio de OírConecta.
 *
 * OírConecta es a la vez:
 *   1) Directorio de profesionales adscritos (portal-profesional).
 *   2) Centro auditivo propio en Bogotá (CRM).
 *
 * El centro propio consume el pipeline del directorio como un tenant premium
 * (Plan 3 siempre activo). Ese tenant se materializa como un DirectoryProfile
 * que TODAS estas superficies deben resolver al mismo id:
 *   · Bot WhatsApp corporativo (tools de agendamiento en waCorporateBot.service.js).
 *   · Página pública /agendar del sitio (usa /api/public/retail-config).
 *   · Cualquier futuro consumer del "espacio del CRM en el directorio".
 *
 * Prioridad de resolución:
 *   1. env RETAIL_PROFESSIONAL_ID (compat con configuraciones antiguas).
 *   2. env RETAIL_PROFESSIONAL_EMAIL → lookup DirectoryAccount → profile.id.
 *   3. Email fijo por convención (centro.bogota@oirconecta.com) creado por
 *      scripts/seed_oirconecta_retail.js.
 *
 * Cachea in-memory tras el primer hit exitoso (el id no cambia en runtime).
 */

const { PrismaClient } = require('@prisma/client');
const config = require('../config');

const prisma = new PrismaClient();

const RETAIL_EMAIL_DEFAULT = 'centro.bogota@oirconecta.com';

let _cached = null;

async function getRetailProfileId() {
  if (_cached) return _cached;

  const envId = config.retail?.professionalId || null;
  if (envId) {
    _cached = envId;
    return envId;
  }

  const email = (config.retail?.professionalEmail || RETAIL_EMAIL_DEFAULT).toLowerCase();
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

module.exports = { getRetailProfileId, RETAIL_EMAIL_DEFAULT, _resetCache };
