/**
 * Cliente del portal de aliados referidores.
 *
 * A propósito NO usa `apiClient`: ese guarda el token del CRM y, ante un 401
 * en cualquier ruta que empiece por /portal-crm, redirige a /login-crm. El
 * aliado vive bajo /portal-crm/aliado/:code pero no es del CRM — terminaría
 * rebotando a una pantalla de login que no le corresponde.
 */

import { getApiBaseUrl } from '../utils/apiBaseUrl';

const PROD_FALLBACK = 'https://oirconecta-api.onrender.com';
const TOKEN_KEY = 'oirconecta_aliado_token';

function base() {
  const v = getApiBaseUrl();
  if (v) return v;
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('oirconecta.com')) {
    return PROD_FALLBACK;
  }
  return '';
}

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(t) {
  try { localStorage.setItem(TOKEN_KEY, t); } catch { /* modo privado */ }
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* modo privado */ }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(`${base()}/api/aliado${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try { json = await res.json(); } catch { /* respuesta sin cuerpo */ }

  if (res.status === 401) {
    clearToken();
    const err = new Error(json?.error || 'Sesión expirada');
    err.unauthorized = true;
    throw err;
  }
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Error ${res.status}`);
  }
  return json?.data;
}

export const aliadoApi = {
  login: (email, password) => request('/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => request('/me'),
  referidos: (code) => request(`/${encodeURIComponent(code)}/referidos`),
  resumen: (code) => request(`/${encodeURIComponent(code)}/resumen`),
};
