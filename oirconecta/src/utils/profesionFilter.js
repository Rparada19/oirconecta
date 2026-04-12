import { normalizeForSearch } from './textUtils';

export const PROFESION_LABEL_TODAS = 'Todas las profesiones';

/** Cuatro profesiones alojadas en la plataforma (sin opción “todas”). */
export const PROFESIONES_CATALOGO = ['Fonoaudiología', 'Audiología', 'Otorrinolaringología', 'Otología'];

export function isTodasProfesiones(value) {
  return !value || value === PROFESION_LABEL_TODAS;
}

/**
 * Indica si un registro de directorio coincide con la profesión elegida.
 * Usa profesion, especialidad, titulo y subespecialidades (texto libre).
 */
export function recordMatchesProfesion(record, selectedProfesion) {
  if (isTodasProfesiones(selectedProfesion)) return true;

  const parts = [
    record.profesion,
    record.especialidad,
    record.titulo,
    ...(Array.isArray(record.subespecialidades) ? record.subespecialidades : []),
  ]
    .filter(Boolean)
    .join(' ');
  const blob = normalizeForSearch(parts);

  switch (selectedProfesion) {
    case 'Audiología':
      return blob.includes(normalizeForSearch('Audiología')) || blob.includes('audiolog');
    case 'Fonoaudiología':
      return blob.includes('fonoaudi');
    case 'Otología':
      return blob.includes('otolog') || blob.includes(normalizeForSearch('Otología'));
    case 'Otorrinolaringología':
      return blob.includes('otorrino') || blob.includes('orl') || blob.includes(normalizeForSearch('Otorrinolaringología'));
    default:
      return blob.includes(normalizeForSearch(selectedProfesion));
  }
}

/**
 * Opciones del desplegable "profesión" (mismas en todo el sitio: las cuatro del oído).
 * El parámetro se ignora; se conserva para no romper llamadas existentes (audiología / otorrino).
 */
export function profesionesParaListing(_tipo) {
  return [...PROFESIONES_CATALOGO];
}
