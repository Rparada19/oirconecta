/**
 * API del directorio público: token y rutas separadas del CRM (`apiClient`).
 */

import { getApiBaseUrl } from '../utils/apiBaseUrl';

const BASE_URL = getApiBaseUrl();
export const DIRECTORY_TOKEN_KEY = 'oirconecta_directory_token';

export function getDirectoryToken() {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(DIRECTORY_TOKEN_KEY) : null;
  } catch {
    return null;
  }
}

export function setDirectoryToken(token) {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(DIRECTORY_TOKEN_KEY, token || '');
  } catch (e) {
    console.error('Error al guardar token de directorio:', e);
  }
}

export function clearDirectoryToken() {
  try {
    if (typeof window !== 'undefined') localStorage.removeItem(DIRECTORY_TOKEN_KEY);
  } catch (e) {
    console.error('Error al borrar token de directorio:', e);
  }
}

/**
 * @param {string} path
 * @param {RequestInit & { skipAuth?: boolean }} [options]
 */
export async function directoryRequest(path, options = {}) {
  const { skipAuth = false, ...fetchOptions } = options;
  const url = path.startsWith('http') ? path : `${BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const isFormData = typeof FormData !== 'undefined' && fetchOptions.body instanceof FormData;
  const headers = {
    // Si el body es FormData, NO seteamos Content-Type: el navegador lo arma con boundary.
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(fetchOptions.headers || {}),
  };
  // Si el caller pasó Content-Type para multipart pero también es FormData, dejamos que
  // el navegador decida — quitamos el header manualmente.
  if (isFormData && headers['Content-Type'] && /multipart\/form-data/i.test(headers['Content-Type'])) {
    delete headers['Content-Type'];
  }
  const token = getDirectoryToken();
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
      return { data: null, error: msg, status: res.status };
    }
    return { data, error: null, status: res.status };
  } catch (err) {
    console.error('Directory API request error:', err);
    const raw = err.message || '';
    const isNetwork = /load failed|failed to fetch|network error|err_connection_refused/i.test(raw);
    const devHint =
      import.meta.env.DEV &&
      ` Comprueba que el backend esté en marcha${BASE_URL ? ` (${BASE_URL})` : ''}.`;
    const msg = isNetwork
      ? `No se pudo conectar con el servidor.${devHint || ' Comprueba tu conexión o inténtalo más tarde.'}`
      : raw || 'Error de conexión con el servidor';
    return { data: null, error: msg, status: 0 };
  }
}

function serializeBody(body) {
  if (body == null) return undefined;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return body;
  return JSON.stringify(body);
}

export const directoryApi = {
  get: (path, opts) => directoryRequest(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => directoryRequest(path, { ...opts, method: 'POST', body: serializeBody(body) }),
  patch: (path, body, opts) => directoryRequest(path, { ...opts, method: 'PATCH', body: serializeBody(body) }),
};
