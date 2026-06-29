/**
 * Favoritos del directorio (anónimo, en localStorage).
 *
 * No requiere auth — el visitante puede marcar como favorito cualquier
 * profesional y verlos en una página local. Si en el futuro construimos
 * cuentas de paciente, migramos la lista a backend.
 */

const KEY = 'oc_favorite_profiles';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  try { window.dispatchEvent(new Event('oc-favorites-changed')); } catch {}
}

export function getFavorites() {
  return read();
}

export function isFavorite(profileId) {
  if (!profileId) return false;
  return read().includes(profileId);
}

export function toggleFavorite(profileId) {
  if (!profileId) return false;
  const list = read();
  const i = list.indexOf(profileId);
  if (i >= 0) {
    list.splice(i, 1);
    write(list);
    return false;
  }
  list.push(profileId);
  write(list);
  return true;
}
