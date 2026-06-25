/**
 * Reglas de horario silencioso para notificaciones no-transaccionales.
 * Transaccionales (CITA_*, HC_*, GARANTIA_*) ignoran quietHours en la práctica;
 * el caller decide pasar `respectQuietHours=false`.
 */

const DEFAULT_START = '20:00';
const DEFAULT_END   = '07:00';
const TZ = 'America/Bogota';

function nowInTZ() {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour12: false,
    hour: '2-digit', minute: '2-digit',
  });
  const [h, m] = fmt.format(new Date()).split(':').map(Number);
  return h * 60 + m;
}

function parseHHmm(s) {
  if (!s || !/^\d{1,2}:\d{2}$/.test(s)) return null;
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

/** ¿Estamos AHORA dentro del rango silencioso? */
function isWithinQuietHours(start = DEFAULT_START, end = DEFAULT_END) {
  const now = nowInTZ();
  const s = parseHHmm(start);
  const e = parseHHmm(end);
  if (s == null || e == null) return false;
  // Rango cruza medianoche (ej. 20:00 → 07:00)
  if (s > e) return now >= s || now < e;
  return now >= s && now < e;
}

/** Próximo timestamp UTC seguro fuera del rango silencioso. */
function nextAllowedSendAt(start = DEFAULT_START, end = DEFAULT_END) {
  if (!isWithinQuietHours(start, end)) return new Date();
  // Avanza al `end` de hoy (en hora Bogotá) → si ya pasó, sumamos 24h.
  const now = new Date();
  const e = parseHHmm(end);
  const target = new Date(now);
  // Construir target en TZ Bogotá. Simplificación: sumamos minutos hasta el end.
  const minsNow = nowInTZ();
  let delta = e - minsNow;
  if (delta <= 0) delta += 24 * 60;
  target.setMinutes(target.getMinutes() + delta);
  return target;
}

module.exports = { isWithinQuietHours, nextAllowedSendAt, DEFAULT_START, DEFAULT_END };
