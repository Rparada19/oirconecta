/** Slug de URL para perfil de audióloga (debe coincidir con ProfessionalProfilePage). */
export function slugForAudiologaList(nombre) {
  return String(nombre || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Slug de URL para perfil de otólogo en listado actual. */
export function slugForOtologoList(nombre) {
  return String(nombre || '').toLowerCase().replace(/\s+/g, '-');
}
