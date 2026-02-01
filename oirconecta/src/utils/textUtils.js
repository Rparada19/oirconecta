/**
 * Normaliza texto para comparación: minúsculas y sin acentos.
 * Ej: "Medellín" y "MEDELLIN" ambos → "medellin"
 */
export const normalizeForSearch = (str) =>
  (str || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
