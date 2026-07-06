/**
 * Cliente API para el backend OirConecta.
 * Usa VITE_API_URL y envía el token JWT en las peticiones autenticadas.
 */

import { getApiBaseUrl } from '../utils/apiBaseUrl';

// Resolver perezosamente: en runtime conoce `window.location` y elige
// el backend correcto incluso si el build no recibió VITE_API_URL.
const PROD_FALLBACK = 'https://oirconecta-api.onrender.com';
function resolveBase() {
  const v = getApiBaseUrl();
  if (v) return v;
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('oirconecta.com')) {
    return PROD_FALLBACK;
  }
  return '';
}
const TOKEN_KEY = 'oirconecta_crm_token';
const LOGIN_ROUTE = '/login-crm';

// Evita disparar el redirect múltiples veces cuando varias peticiones
// devuelven 401 casi al mismo tiempo.
let redirecting = false;
function handleUnauthorized() {
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
  if (redirecting) return;
  if (typeof window === 'undefined') return;
  const path = window.location.pathname || '';
  // No redirigir si ya estás en la propia pantalla de login.
  if (path.startsWith(LOGIN_ROUTE)) return;
  // Solo aplicamos el auto-redirect a rutas del CRM (evita afectar al
  // portal profesional o al admin que usan otros tokens/rutas de login).
  if (!path.startsWith('/portal-crm')) return;
  redirecting = true;
  const returnTo = encodeURIComponent(path + window.location.search);
  window.location.href = `${LOGIN_ROUTE}?returnTo=${returnTo}&reason=expired`;
}

export const getToken = () => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token || '');
  } catch (e) {
    console.error('Error al guardar token:', e);
  }
};

export const clearToken = () => {
  try {
    if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('Error al borrar token:', e);
  }
};

/**
 * @param {string} path - Ruta (ej. /api/auth/login)
 * @param {RequestInit & { skipAuth?: boolean }} [options]
 * @returns {Promise<{ data?: any; error?: string; status?: number }>}
 */
export async function request(path, options = {}) {
  const { skipAuth = false, ...fetchOptions } = options;
  const base = resolveBase();
  const url = path.startsWith('http') ? path : `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  };
  const token = getToken();
  if (!skipAuth && token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      headers,
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const msg = data?.error || data?.message || res.statusText || `Error ${res.status}`;
      // Auto-logout + redirect a /login-crm si el token expiró o es inválido
      // durante una llamada autenticada.
      if (!skipAuth && res.status === 401) handleUnauthorized();
      return { data: null, error: msg, status: res.status };
    }
    return { data, error: null, status: res.status };
  } catch (err) {
    console.error('API request error:', err);
    const raw = err.message || '';
    const isNetwork = /load failed|failed to fetch|network error|err_connection_refused/i.test(raw);
    const devHint =
      import.meta.env.DEV &&
      ` Comprueba que el backend esté en marcha${base ? ` (${base})` : ' (proxy /api → puerto 3001)'}.`;
    const msg = isNetwork
      ? `No se pudo conectar con el servidor.${devHint || ' Comprueba tu conexión o inténtalo más tarde.'}`
      : raw || 'Error de conexión con el servidor';
    return { data: null, error: msg, status: 0 };
  }
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body: body != null ? JSON.stringify(body) : undefined }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body: body != null ? JSON.stringify(body) : undefined }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body: body != null ? JSON.stringify(body) : undefined }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

export default api;
