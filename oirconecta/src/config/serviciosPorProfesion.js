/**
 * Catálogo de servicios sugeridos por profesión.
 * El profesional puede seleccionar de la lista (click → se agrega a su perfil)
 * o crear servicios libres con "Agregar servicio".
 *
 * Las claves son los SLUGS de Profession (Prisma). El frontend mapea
 * `form.profesion` (texto libre) a slug antes de leer.
 */

export const SERVICIOS_POR_PROFESION = {
  audiologia: [
    'Audiometría tonal',
    'Audiometría verbal (logoaudiometría)',
    'Impedanciometría / Timpanometría',
    'Otoemisiones acústicas (OEA)',
    'Potenciales evocados auditivos (PEATC)',
    'Adaptación de audífonos',
    'Programación y ajuste de audífonos',
    'Reparación y mantenimiento de audífonos',
    'Limpieza de audífonos',
    'Asesoría en compra de audífono',
    'Tamizaje auditivo neonatal',
    'Audiología ocupacional (entornos de ruido)',
    'Atención auditiva a domicilio',
    'Acompañamiento post-implante coclear',
    'Seguimiento y revisión periódica',
  ],

  fonoaudiologia: [
    'Evaluación de lenguaje',
    'Evaluación de habla y voz',
    'Terapia auditivo-verbal',
    'Habilitación / rehabilitación auditiva',
    'Terapia post implante coclear',
    'Terapia post audífono (adaptación al sonido)',
    'Estimulación temprana del lenguaje',
    'Tratamiento de tartamudez (disfemia)',
    'Tratamiento de trastornos del habla',
    'Tratamiento de trastornos de voz',
    'Terapia miofuncional orofacial',
    'Manejo de disfagia (trastornos de deglución)',
    'Lectura labiofacial',
    'Atención a domicilio',
  ],

  otorrinolaringologia: [
    'Consulta médica de otorrinolaringología',
    'Otoscopia diagnóstica',
    'Diagnóstico de pérdida auditiva',
    'Tratamiento de tinnitus (zumbidos)',
    'Tratamiento de vértigo y desequilibrio',
    'Manejo de otitis aguda y crónica',
    'Extracción y limpieza de cerumen',
    'Endoscopia nasal',
    'Manejo de rinitis y sinusitis',
    'Audiometría diagnóstica',
    'Tratamiento médico de hipoacusia súbita',
    'Cirugía de oído externo y medio',
    'Adenoidectomía / Amigdalectomía',
    'Manejo de patología vestibular',
  ],

  otologia: [
    'Consulta de subespecialidad otológica',
    'Evaluación para implante coclear',
    'Cirugía de implante coclear',
    'Cirugía de estapedotomía (otosclerosis)',
    'Timpanoplastia',
    'Mastoidectomía',
    'Manejo de colesteatoma',
    'Implantes osteointegrados (BAHA, Bonebridge)',
    'Implantes de oído medio activos',
    'Tratamiento de schwannoma vestibular',
    'Manejo de patología del nervio auditivo',
    'Reconstrucción auditiva',
    'Acompañamiento post-quirúrgico auditivo',
  ],
};

/**
 * Normaliza un texto libre de profesión a su slug canónico.
 * Acepta variaciones comunes (acentos, mayúsculas, sinónimos).
 */
export function profesionToSlug(profesion) {
  if (!profesion) return null;
  const p = String(profesion).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  if (p.includes('audiolog')) return 'audiologia';
  if (p.includes('fonoaudiolog') || p.includes('logoped') || p.includes('terapeuta del lenguaje')) return 'fonoaudiologia';
  if (p.includes('otolog')) return 'otologia';
  if (p.includes('otorrinolaringolog') || p.includes('orl') || p.includes('otorrino')) return 'otorrinolaringologia';
  return null;
}

/** Devuelve la lista de servicios sugeridos para una profesión (string libre). */
export function getServiciosSugeridos(profesion) {
  const slug = profesionToSlug(profesion);
  return slug ? SERVICIOS_POR_PROFESION[slug] || [] : [];
}
