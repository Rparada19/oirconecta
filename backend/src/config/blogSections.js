/**
 * Secciones canónicas del blog. El campo `BlogPost.categoria` guarda el `slug`.
 * Fuente única de verdad: el front las consume vía GET /api/blog/sections.
 */

const BLOG_SECTIONS = [
  {
    slug: 'guias',
    nombre: 'Guías y educación',
    descripcion: 'Aprende lo esencial sobre audición, pérdida auditiva y cómo cuidarla.',
    icon: 'school',
    orden: 1,
  },
  {
    slug: 'lanzamientos',
    nombre: 'Nuevos lanzamientos',
    descripcion: 'Los últimos modelos de audífonos e implantes y qué traen de nuevo.',
    icon: 'rocket',
    orden: 2,
  },
  {
    slug: 'comparativas',
    nombre: 'Comparativas',
    descripcion: 'Marca vs marca, tecnología vs tecnología: decide con criterio.',
    icon: 'balance',
    orden: 3,
  },
  {
    slug: 'tecnologia',
    nombre: 'Tecnología y novedades',
    descripcion: 'IA, recargables, Bluetooth y el futuro de la salud auditiva.',
    icon: 'memory',
    orden: 4,
  },
  {
    slug: 'casos',
    nombre: 'Casos y testimonios',
    descripcion: 'Historias reales de personas que recuperaron su audición.',
    icon: 'favorite',
    orden: 5,
  },
  {
    slug: 'glosario',
    nombre: 'Glosario auditivo',
    descripcion: 'Términos de audiología explicados en lenguaje claro.',
    icon: 'menu_book',
    orden: 6,
  },
  {
    slug: 'cuidados',
    nombre: 'Mantenimiento y cuidados',
    descripcion: 'Cómo limpiar, conservar y sacar el máximo a tus dispositivos.',
    icon: 'build',
    orden: 7,
  },
  {
    slug: 'general',
    nombre: 'General',
    descripcion: 'Otras novedades de OírConecta.',
    icon: 'article',
    orden: 99,
  },
];

const BLOG_SECTION_SLUGS = BLOG_SECTIONS.map((s) => s.slug);

/** Normaliza una categoría libre al slug canónico; cae a 'general' si no coincide. */
function normalizeSection(value) {
  if (!value) return 'general';
  const v = String(value).trim().toLowerCase();
  return BLOG_SECTION_SLUGS.includes(v) ? v : 'general';
}

module.exports = { BLOG_SECTIONS, BLOG_SECTION_SLUGS, normalizeSection };
