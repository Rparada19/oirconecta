/**
 * Enlaces públicos configurables (Vite: VITE_*).
 * WhatsApp: número en formato internacional sin + (ej. 573001234567).
 */
const DEFAULT_WA = '573001234567';

export function getWhatsAppHref() {
  const fromEnv = import.meta.env.VITE_WHATSAPP_URL;
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim();
  const n = import.meta.env.VITE_WHATSAPP_NUMBER;
  if (n && String(n).replace(/\D/g, '')) {
    return `https://wa.me/${String(n).replace(/\D/g, '')}`;
  }
  return `https://wa.me/${DEFAULT_WA}`;
}

/**
 * Mismo número que `getWhatsAppHref`, con mensaje prellenado (codificación URL).
 * @param {string} message
 */
export function getWhatsAppHrefWithText(message) {
  const base = getWhatsAppHref();
  const text = encodeURIComponent(message || '');
  if (!text) return base;
  return base.includes('?') ? `${base}&text=${text}` : `${base}?text=${text}`;
}
