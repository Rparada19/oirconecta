/**
 * Helper para eventos del Meta Pixel (1056565756928195).
 *
 * El pixel base y PageView viven en index.html + App.jsx (AnalyticsRouteTracker).
 * Este archivo envuelve fbq() para eventos estándar y custom, y expone un
 * generador de eventId para deduplicar con la Conversions API server-side.
 *
 * Nunca lanza si fbq no está cargado (adblocker, entorno de test, etc.).
 */

export function generateEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function fbqTrack(eventName, params = {}, eventId = null) {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      const options = eventId ? { eventID: eventId } : undefined;
      window.fbq('track', eventName, params, options);
    }
  } catch {
    /* pixel nunca rompe la app */
  }
}

/** Alias más idiomático; misma implementación que fbqTrack. */
export const trackEvent = fbqTrack;

export function trackCustomEvent(eventName, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('trackCustom', eventName, params);
    }
  } catch {
    /* pixel nunca rompe la app */
  }
}
