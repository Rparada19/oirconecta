/**
 * Helper para eventos del Meta Pixel (1056565756928195).
 *
 * El pixel base y PageView viven en index.html + App.jsx.
 * Este archivo solo envuelve fbq() para eventos estándar de conversión
 * (Lead, Schedule, Search, ViewContent, Contact).
 *
 * Nunca lanza si fbq no está cargado (adblocker, entorno de test, etc.).
 */

export function fbqTrack(eventName, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', eventName, params);
    }
  } catch {
    /* pixel nunca rompe la app */
  }
}
