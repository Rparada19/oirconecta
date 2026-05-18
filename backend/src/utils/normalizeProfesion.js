/**
 * Normalización canónica de profesiones del directorio.
 *
 * Mapea cualquier variante (femenino, abreviatura, sin acentos, mayúsculas)
 * a un slug canónico estable usado para FK contra `professions`.
 *
 * Estrategia:
 *   1. Lookup en memoria (CANONICAL_PROFESSIONS) — funciona sin DB.
 *   2. Si no encuentra, intenta contra la tabla `professions` (sinonimos[]).
 *   3. Si tampoco, devuelve `null` (el caller decide si rechaza o guarda libre).
 *
 * El catálogo en memoria DEBE estar sincronizado con el seed.
 */

const { PrismaClient } = require('@prisma/client');

/**
 * Quita acentos y normaliza a minúsculas. `"Fonoaudióloga"` → `"fonoaudiologa"`.
 */
function normalizeText(input) {
  if (input == null) return '';
  return String(input)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Catálogo canónico (debe coincidir con el seed de `professions`).
 * Cualquier valor en `aliases` (ya normalizado sin acentos / minúsculas) mapea al `slug`.
 */
const CANONICAL_PROFESSIONS = [
  {
    slug: 'fonoaudiologo',
    nombre: 'Fonoaudiólogo',
    nombreFemenino: 'Fonoaudióloga',
    aliases: ['fonoaudiologo', 'fonoaudiologa', 'fono', 'fonoaudiologia'],
  },
  {
    slug: 'audiologo',
    nombre: 'Audiólogo',
    nombreFemenino: 'Audióloga',
    aliases: ['audiologo', 'audiologa', 'audiologia'],
  },
  {
    slug: 'otologo',
    nombre: 'Otólogo',
    nombreFemenino: 'Otóloga',
    aliases: ['otologo', 'otologa', 'otologia'],
  },
  {
    slug: 'otorrinolaringologo',
    nombre: 'Otorrinolaringólogo',
    nombreFemenino: 'Otorrinolaringóloga',
    aliases: [
      'otorrinolaringologo',
      'otorrinolaringologa',
      'otorrino',
      'otorrinolaringologia',
      'orl',
    ],
  },
];

/**
 * Búsqueda rápida sincrónica (sin DB). Devuelve `{ slug, nombre, nombreFemenino }` o `null`.
 */
function normalizeProfesionSync(input) {
  const needle = normalizeText(input);
  if (!needle) return null;
  for (const p of CANONICAL_PROFESSIONS) {
    if (p.aliases.includes(needle) || normalizeText(p.nombre) === needle) {
      return { slug: p.slug, nombre: p.nombre, nombreFemenino: p.nombreFemenino };
    }
  }
  return null;
}

/**
 * Versión async: si el catálogo en memoria no encuentra match, consulta `professions.sinonimos`.
 * Devuelve el `Profession` completo de la DB (id, slug, nombre, …) o `null`.
 *
 * @param {string} input
 * @param {PrismaClient} [prisma] Cliente para reutilizar (evita instanciar uno por llamada).
 */
async function normalizeProfesion(input, prisma) {
  const sync = normalizeProfesionSync(input);
  if (!sync) {
    if (!input) return null;
    // Último intento: buscar como sinónimo en DB (catálogo extensible vía admin).
    const db = prisma || new PrismaClient();
    const needle = normalizeText(input);
    const found = await db.profession.findFirst({
      where: {
        activo: true,
        OR: [{ slug: needle }, { sinonimos: { has: needle } }],
      },
    });
    if (!prisma) await db.$disconnect();
    return found;
  }
  // Cargar la fila real desde DB para devolver `id`.
  const db = prisma || new PrismaClient();
  const found = await db.profession.findUnique({ where: { slug: sync.slug } });
  if (!prisma) await db.$disconnect();
  return found;
}

module.exports = {
  CANONICAL_PROFESSIONS,
  normalizeText,
  normalizeProfesionSync,
  normalizeProfesion,
};
