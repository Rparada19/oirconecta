/**
 * Auth independiente para el Portal Admin.
 * No comparte token ni contexto con el CRM ni con el portal de profesionales.
 */
export const ADMIN_TOKEN_KEY = 'oirconecta_admin_token';

export function getAdminToken() {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY) || null; } catch { return null; }
}

export function clearAdminToken() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem('oirconecta_admin_user');
  } catch {}
}

export function getAdminUser() {
  try {
    const raw = localStorage.getItem('oirconecta_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export const API = import.meta.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';

/** fetch autenticado con el token del portal admin */
export async function adminFetch(path, options = {}) {
  const token = getAdminToken();
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { ok: res.ok, status: res.status, data };
}
