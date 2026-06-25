/**
 * Base URL del backend para `fetch`.
 * En desarrollo sin `VITE_API_URL`, cadena vacía → rutas relativas `/api/...` y el proxy de Vite
 * reenvía a `localhost:3001` (evita CORS y desajustes localhost vs 127.0.0.1).
 * En producción sin `VITE_API_URL`, usa rutas relativas (asume mismo origen que el frontend).
 */
export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).replace(/\/$/, '');
  }
  // En producción (oirconecta.com), si el build no recibió VITE_API_URL,
  // apuntar al backend conocido en lugar de rutas relativas (que devolverían el SPA).
  if (typeof window !== 'undefined' && window.location.hostname.endsWith('oirconecta.com')) {
    return 'https://oirconecta-api.onrender.com';
  }
  // DEV: rutas relativas; Vite proxea a localhost:3001.
  return '';
}
