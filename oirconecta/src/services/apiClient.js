/**
 * Cliente API para el backend OirConecta.
 * Usa VITE_API_URL y envía el token JWT en las peticiones autenticadas.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'oirconecta_crm_token';

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
  const url = path.startsWith('http') ? path : `${BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
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
      return { data: null, error: msg, status: res.status };
    }
    return { data, error: null, status: res.status };
  } catch (err) {
    console.error('API request error:', err);
    const raw = err.message || '';
    const isNetwork = /load failed|failed to fetch|network error|err_connection_refused/i.test(raw);
    const msg = isNetwork
      ? 'No se pudo conectar con el servidor. Comprueba que el backend esté en marcha (http://localhost:3001).'
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
