/**
 * Base URL del backend para `fetch`.
 * En desarrollo sin `VITE_API_URL`, cadena vacía → rutas relativas `/api/...` y el proxy de Vite
 * reenvía a `localhost:3001` (evita CORS y desajustes localhost vs 127.0.0.1).
 */
export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (raw != null && String(raw).trim() !== '') {
    return String(raw).replace(/\/$/, '');
  }
  if (import.meta.env.DEV) return '';
  return 'http://localhost:3001';
}
