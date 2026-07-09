/**
 * Enlaces públicos configurables (Vite: VITE_*).
 * WhatsApp: número en formato internacional sin + (ej. 573001234567).
 * Único punto de verdad — no hardcodear en otros archivos.
 */
const DEFAULT_WA = '573171503944';
const DEFAULT_WA_DISPLAY = '+57 317 150 3944';

/** Número corporativo tal como el usuario lo lee (para render de texto). */
export function getWhatsAppDisplay() {
  return import.meta.env.VITE_WHATSAPP_DISPLAY || DEFAULT_WA_DISPLAY;
}

/** Número en formato E.164 sin `+` para links tel:/wa.me. */
export function getWhatsAppNumber() {
  const n = import.meta.env.VITE_WHATSAPP_NUMBER;
  if (n && String(n).replace(/\D/g, '')) return String(n).replace(/\D/g, '');
  return DEFAULT_WA;
}

export function getPhoneHref() {
  return `tel:+${getWhatsAppNumber()}`;
}

export function getWhatsAppHref() {
  const fromEnv = import.meta.env.VITE_WHATSAPP_URL;
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim();
  return `https://wa.me/${getWhatsAppNumber()}`;
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
