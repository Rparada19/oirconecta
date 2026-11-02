/**
 * Reglas temporales de horario para las citas que agenda Aura.
 *
 * Campaña de noviembre 2026 (pedido de Rafael, 1 de noviembre):
 *   1. Los lunes no se agenda en la mañana: solo de 1:00 a 5:00 p.m.
 *      (la última cita del lunes empieza a las 4:00, por la regla 2).
 *      Si se prefiere bloquear los lunes del todo, cambiar LUNES a 'cerrado'.
 *   2. Ningún día se agenda antes de las 8:00 a.m. ni después de las 4:00 p.m.
 *      (la última cita empieza a las 4:00 p.m.).
 *
 * Solo aplica entre `desde` y `hasta` (fechas de la cita, hora Bogotá). El 1 de
 * diciembre la agenda vuelve sola a lo que diga la disponibilidad del centro.
 * Las reglas solo quitan horas: nunca abren un cupo que la agenda no tenga.
 */
const REGLAS = [
  {
    nombre: 'Campaña noviembre 2026',
    desde: '2026-11-01',
    hasta: '2026-11-30',
    primeraCita: '08:00',
    ultimaCita: '16:00',
    // 'tarde' = lunes solo de 1 a 5 p.m.; 'cerrado' = lunes sin citas.
    LUNES: 'tarde',
    lunesDesde: '13:00',
    lunesHasta: '17:00',
  },
];

function reglaPara(fecha) {
  return REGLAS.find((r) => fecha >= r.desde && fecha <= r.hasta) || null;
}

// 0 domingo … 6 sábado, del día de calendario (sin depender de la TZ del server).
function diaSemana(fecha) {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** ¿Se puede agendar a esa hora ese día? fecha 'YYYY-MM-DD', hora 'HH:MM'. */
function horaPermitida(fecha, hora) {
  const r = reglaPara(fecha);
  if (!r) return true;
  if (hora < r.primeraCita || hora > r.ultimaCita) return false;
  if (diaSemana(fecha) === 1) {
    if (r.LUNES === 'cerrado') return false;
    if (hora < r.lunesDesde || hora >= r.lunesHasta) return false;
  }
  return true;
}

/** Filtra los slots [{ time }] que devuelve computeSlotsForDay. */
function filtrarSlots(fecha, slots) {
  return (slots || []).filter((s) => horaPermitida(fecha, s.time));
}

/** Texto para el prompt mientras haya una regla vigente (hoy o más adelante). */
function avisoParaPrompt(hoy) {
  const r = REGLAS.find((x) => hoy <= x.hasta);
  if (!r) return null;
  const lunes = r.LUNES === 'cerrado'
    ? 'los lunes no hay citas'
    : 'los lunes solo hay citas en la tarde (de 1:00 a 5:00 p.m.)';
  return `Del ${r.desde} al ${r.hasta}: la primera cita es a las 8:00 a.m., la última a las 4:00 p.m., y ${lunes}. get_availability ya devuelve solo esas horas.`;
}

module.exports = { horaPermitida, filtrarSlots, avisoParaPrompt, REGLAS };
