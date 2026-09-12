/**
 * Google Ads (AW-18441131676) — conversiones y click ids.
 *
 * La librería gtag.js y el `config` de la cuenta viven en index.html (la misma
 * librería sirve GA4 y Ads). Este archivo hace dos cosas:
 *
 *  1) CONVERSIONES. `adsConversion('agendamiento')` dispara el evento hacia
 *     Google Ads. Cada conversión necesita su LABEL, que sale de la cuenta de
 *     Ads (Objetivos → Conversiones → la acción → "Configurar la etiqueta" →
 *     el send_to se ve como 'AW-18441131676/AbC-D_efGh'; el label es lo que va
 *     después de la barra). Mientras el label esté vacío la llamada es no-op:
 *     no rompe nada y no manda basura a la cuenta.
 *
 *  2) CLICK IDS. Google marca el click con `gclid` (búsqueda/display) o con
 *     `gbraid`/`wbraid` (tráfico de iOS). Guardarlo al aterrizar es lo que
 *     permite, semanas después, subir a Ads la venta que salió de ese click
 *     (conversiones offline): la cita se agenda hoy y se vende en tres
 *     semanas, y sin el gclid guardado esa venta no tiene a quién atribuirse.
 *
 * Nada de esto se persiste sin consentimiento de cookies: sin 'accepted' el
 * click id vive sólo en memoria, para la navegación en curso.
 */

import { hasConsent } from './cookieConsent';

export const GOOGLE_ADS_ID = 'AW-18441131676';

/**
 * Etiquetas de conversión por evento de negocio.
 *
 * El label lo da Google Ads al crear la acción de conversión:
 * Objetivos → Conversiones → la acción → "Configurar la etiqueta". El send_to
 * se ve como 'AW-18441131676/AbC-D_efGh' y el label es lo que va DESPUÉS de la
 * barra. Sin label, la conversión no se dispara y la cuenta reporta cero —
 * que es exactamente lo que Google avisa en "el seguimiento de conversiones
 * está incompleto".
 *
 * Se pueden poner por variable de entorno en Render (sin tocar código) o aquí
 * mismo. Lo que esté en el entorno manda.
 */
const CONVERSION_LABELS = {
  agendamiento: import.meta.env.VITE_ADS_LABEL_AGENDAMIENTO || '',    // cita agendada en /agendar
  lead_simulador: import.meta.env.VITE_ADS_LABEL_SIMULADOR || '',     // dejó datos en /ponte-en-sus-oidos
  whatsapp_click: import.meta.env.VITE_ADS_LABEL_WHATSAPP || '',      // abrió WhatsApp desde un CTA
  contacto: import.meta.env.VITE_ADS_LABEL_CONTACTO || '',            // formulario de /contacto
};

/** Qué acciones están listas y cuáles siguen sin etiqueta. Para diagnosticar. */
export function estadoDeConversiones() {
  return Object.fromEntries(
    Object.entries(CONVERSION_LABELS).map(([k, v]) => [k, v ? 'lista' : 'SIN ETIQUETA']),
  );
}

const LS_CLICK_IDS = 'oc_google_click_ids';
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 días, la ventana de Google Ads

let memoryClickIds = null;

function readStored() {
  try {
    const raw = localStorage.getItem(LS_CLICK_IDS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.at || Date.now() - parsed.at > TTL_MS) {
      localStorage.removeItem(LS_CLICK_IDS);
      return null;
    }
    return parsed;
  } catch { return null; }
}

function parseFromUrl() {
  try {
    const p = new URLSearchParams(window.location.search);
    const gclid = p.get('gclid');
    const gbraid = p.get('gbraid');
    const wbraid = p.get('wbraid');
    if (!gclid && !gbraid && !wbraid) return null;
    return { gclid: gclid || null, gbraid: gbraid || null, wbraid: wbraid || null, at: Date.now() };
  } catch { return null; }
}

/**
 * Al montar la app: si la URL trae click id de Google, lo captura y lo guarda
 * (90 días). Un click nuevo pisa al anterior — la campaña que trajo la última
 * visita es la que se lleva la conversión, igual que cuenta Google.
 */
export function captureClickIds() {
  const fresh = parseFromUrl();
  if (fresh) memoryClickIds = fresh;
  else memoryClickIds = memoryClickIds || readStored();

  // Se persiste aquí y no sólo al aterrizar: el banner de cookies se acepta
  // unos segundos después del click, y para entonces la URL ya no trae gclid.
  if (memoryClickIds && hasConsent()) {
    try { localStorage.setItem(LS_CLICK_IDS, JSON.stringify(memoryClickIds)); } catch {}
  }
  return memoryClickIds;
}

/** { gclid, gbraid, wbraid } del click vigente, o {} si no vino de Ads. */
export function getClickIds() {
  const ids = memoryClickIds || readStored();
  if (!ids) return {};
  return { gclid: ids.gclid || null, gbraid: ids.gbraid || null, wbraid: ids.wbraid || null };
}

/** Sólo el gclid, que es el que viaja en los payloads al backend. */
export function getGclid() {
  return getClickIds().gclid || null;
}

/**
 * Dispara una conversión de Google Ads.
 * @param {string} key    — clave de CONVERSION_LABELS ('agendamiento', ...)
 * @param {object} params — { value, currency, transaction_id } opcionales
 */
export function adsConversion(key, params = {}) {
  const label = CONVERSION_LABELS[key];
  if (!label) {
    // Silencioso durante meses: la conversión ocurría, nadie la mandaba, y en
    // Ads la campaña aparecía sin datos. Que al menos quede dicho.
    console.warn(
      `[ads] "${key}" ocurrió pero no se envió a Google Ads: esa acción no tiene etiqueta.`,
      'Google Ads → Objetivos → Conversiones → la acción → Configurar la etiqueta.',
    );
    return false;
  }
  try {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false;
    window.gtag('event', 'conversion', {
      send_to: `${GOOGLE_ADS_ID}/${label}`,
      ...params,
    });
    return true;
  } catch {
    return false; // el tag nunca rompe la app
  }
}
