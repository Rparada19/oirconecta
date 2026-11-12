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

/**
 * Días sin agenda para Aura. Pedido de Rafael (12 de noviembre de 2026): la
 * semana del 16 al 22 de noviembre no hay agenda y Aura empieza a agendar desde
 * el lunes 23. Como pidió agendar "a partir del 23", también quedan cerrados
 * los días que faltan antes de esa semana (12 al 15). Para abrirlos, cambiar
 * `desde` a '2026-11-16'.
 * Solo afecta lo que Aura ofrece y agenda; la agenda del centro no cambia.
 */
const BLOQUEOS = [
  {
    desde: '2026-11-12',
    hasta: '2026-11-22',
    aviso: 'La semana del 16 al 22 de noviembre no hay agenda disponible. Las citas se agendan a partir del lunes 23 de noviembre.',
  },
];

function bloqueoPara(fecha) {
  return BLOQUEOS.find((b) => fecha >= b.desde && fecha <= b.hasta) || null;
}

// ─── Días que nunca se atienden (permanente) ─────────────────────────────────
// Pedido de Rafael (12 de noviembre de 2026): los sábados, los domingos y los
// festivos de Colombia no se atiende, así que Aura no agenda esos días.

function sumarDias(fechaUTC, n) {
  return new Date(fechaUTC.getTime() + n * 86400000);
}
function iso(fechaUTC) {
  return fechaUTC.toISOString().slice(0, 10);
}
// Ley Emiliani: el festivo pasa al lunes siguiente si no cae en lunes.
function alLunes(fechaUTC) {
  const dia = fechaUTC.getUTCDay();
  return dia === 1 ? fechaUTC : sumarDias(fechaUTC, (8 - dia) % 7);
}
// Domingo de Pascua (algoritmo de Meeus/Jones/Butcher).
function pascua(y) {
  const a = y % 19; const b = Math.floor(y / 100); const c = y % 100;
  const d = Math.floor(b / 4); const e = b % 4; const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31); const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, mes - 1, dia));
}

const cacheFestivos = {};
/** Festivos de Colombia de un año: Set de 'YYYY-MM-DD'. */
function festivosColombia(y) {
  if (cacheFestivos[y]) return cacheFestivos[y];
  const f = (m, d) => new Date(Date.UTC(y, m - 1, d));
  const p = pascua(y);
  const fechas = [
    f(1, 1), f(5, 1), f(7, 20), f(8, 7), f(12, 8), f(12, 25), // fijos
    alLunes(f(1, 6)), alLunes(f(3, 19)), alLunes(f(6, 29)), alLunes(f(8, 15)),
    alLunes(f(10, 12)), alLunes(f(11, 1)), alLunes(f(11, 11)), // se corren al lunes
    sumarDias(p, -3), sumarDias(p, -2), // jueves y viernes santo
    sumarDias(p, 43), sumarDias(p, 64), sumarDias(p, 71), // Ascensión, Corpus, Sagrado Corazón
  ];
  cacheFestivos[y] = new Set(fechas.map(iso));
  return cacheFestivos[y];
}

/** ¿Ese día no se atiende? (sábado, domingo o festivo). Devuelve el motivo o null. */
function diaSinAtencion(fecha) {
  const dia = diaSemana(fecha);
  if (dia === 6) return 'sábado';
  if (dia === 0) return 'domingo';
  if (festivosColombia(Number(fecha.slice(0, 4))).has(fecha)) return 'festivo';
  return null;
}

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
  if (diaSinAtencion(fecha)) return false;
  if (bloqueoPara(fecha)) return false;
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
  const y = Number(hoy.slice(0, 4));
  const proximos = [...festivosColombia(y), ...festivosColombia(y + 1)]
    .filter((d) => d >= hoy).sort().slice(0, 4).join(', ');
  const avisos = [`Los sábados, los domingos y los festivos de Colombia no hay citas (próximos festivos: ${proximos}). get_availability no devuelve cupos esos días.`];
  avisos.push(...BLOQUEOS.filter((b) => hoy <= b.hasta)
    .map((b) => `${b.aviso} Si alguien pide una cita antes, dile con calidez que esa semana no tenemos agenda y ofrécele desde el lunes 23. get_availability no devuelve cupos en esos días.`));
  const r = REGLAS.find((x) => hoy <= x.hasta);
  if (!r) return avisos.join('\n');
  const lunes = r.LUNES === 'cerrado'
    ? 'los lunes no hay citas'
    : 'los lunes solo hay citas en la tarde (de 1:00 a 5:00 p.m.)';
  avisos.push(`Del ${r.desde} al ${r.hasta}: la primera cita es a las 8:00 a.m., la última a las 4:00 p.m., y ${lunes}. get_availability ya devuelve solo esas horas.`);
  return avisos.join('\n');
}

module.exports = { horaPermitida, filtrarSlots, avisoParaPrompt, bloqueoPara, diaSinAtencion, festivosColombia, REGLAS, BLOQUEOS };
