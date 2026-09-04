/**
 * Fechas sin hora, dibujadas sin moverse de día.
 *
 * `new Date('2026-09-04')` es medianoche UTC, y en Bogotá (UTC-5) eso es el 3
 * de septiembre a las 7 p.m. Por eso una fecha de adaptación guardada como el
 * 4 se leía en pantalla como el 3, y parecía que la edición no había servido.
 *
 * Cuando el valor es solo fecha (YYYY-MM-DD) se arma el Date con las partes,
 * en hora local, y el día queda intacto. Lo que trae hora se respeta: ahí el
 * instante sí importa.
 */
export function aFechaLocal(v) {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  const s = String(v);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Formatea una fecha para mostrar. Devuelve `vacio` si no hay nada que mostrar. */
export function fechaCorta(v, { locale = 'es-ES', vacio = '—', ...opts } = {}) {
  const d = aFechaLocal(v);
  if (!d) return vacio;
  return d.toLocaleDateString(locale, Object.keys(opts).length ? opts : undefined);
}
