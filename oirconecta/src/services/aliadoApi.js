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

/**
 * Descarga con token: un <a href> normal no lleva la cabecera de sesión, así
 * que el archivo se pide con fetch y se entrega desde memoria.
 */
export async function descargarQr(code, formato = 'svg') {
  const res = await fetch(
    `${base()}/api/aliado/${encodeURIComponent(code)}/qr?formato=${formato}&size=1024`,
    { headers: { Authorization: `Bearer ${getToken()}` } },
  );
  if (!res.ok) throw new Error('No se pudo generar el QR');

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qr-${String(code).toLowerCase()}.${formato}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Vista previa del QR en pantalla, como URL de objeto. */
export async function previsualizarQr(code) {
  const res = await fetch(
    `${base()}/api/aliado/${encodeURIComponent(code)}/qr?formato=png&size=512`,
    { headers: { Authorization: `Bearer ${getToken()}` } },
  );
  if (!res.ok) throw new Error('No se pudo generar el QR');
  return URL.createObjectURL(await res.blob());
}

export async function subirLogo(code, archivo) {
  const datos = new FormData();
  datos.append('archivo', archivo);
  const res = await fetch(`${base()}/api/aliado/${encodeURIComponent(code)}/logo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: datos,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.success === false) throw new Error(json?.error || 'No se pudo subir el logo');
  return json.data;
}

export const aliadoApi = {
  login: (email, password) => request('/login', { method: 'POST', body: { email, password }, auth: false }),
  registro: (body) => request('/registro', { method: 'POST', body, auth: false }),
  recuperar: (email) => request('/recuperar', { method: 'POST', body: { email }, auth: false }),
  restablecer: (token, password) => request('/restablecer', { method: 'POST', body: { token, password }, auth: false }),
  me: () => request('/me'),
  referidos: (code) => request(`/${encodeURIComponent(code)}/referidos`),
  resumen: (code) => request(`/${encodeURIComponent(code)}/resumen`),
};
