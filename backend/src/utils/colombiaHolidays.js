/**
 * Feriados nacionales de Colombia.
 * Ley 51/1983 (Emiliani): algunos feriados se trasladan al siguiente lunes.
 * Pascua se calcula con el algoritmo gregoriano anónimo.
 */

/** Próximo lunes igual o posterior a una fecha */
function nextMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=dom, 1=lun…
  const diff = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Domingo de Pascua para un año dado (algoritmo anónimo gregoriano) */
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/** Retorna un Set de strings 'YYYY-MM-DD' con los feriados del año */
function getHolidaysForYear(year) {
  const holidays = new Set();

  const add = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    holidays.add(`${y}-${m}-${d}`);
  };

  const fixed = (m, d) => add(new Date(year, m - 1, d));
  const emiliani = (m, d) => add(nextMonday(new Date(year, m - 1, d)));

  // Fijos
  fixed(1, 1);   // Año Nuevo
  fixed(5, 1);   // Día del Trabajo
  fixed(7, 20);  // Independencia de Colombia
  fixed(8, 7);   // Batalla de Boyacá
  fixed(12, 8);  // Inmaculada Concepción
  fixed(12, 25); // Navidad

  // Emiliani (se mueven al lunes siguiente)
  emiliani(1, 6);   // Reyes Magos
  emiliani(3, 19);  // San José
  emiliani(6, 29);  // San Pedro y San Pablo
  emiliani(8, 15);  // Asunción de la Virgen
  emiliani(10, 12); // Día de la Raza
  emiliani(11, 1);  // Todos los Santos
  emiliani(11, 11); // Independencia de Cartagena

  // Basados en Pascua
  const easter = easterSunday(year);

  const addOffset = (base, offsetDays) => {
    const d = new Date(base);
    d.setDate(d.getDate() + offsetDays);
    add(d);
  };

  addOffset(easter, -3);  // Jueves Santo
  addOffset(easter, -2);  // Viernes Santo
  // Ascensión, Corpus Christi y Sagrado Corazón son Emiliani desde Pascua
  add(nextMonday(new Date(easter.getTime() + 39 * 86400000))); // Ascensión
  add(nextMonday(new Date(easter.getTime() + 60 * 86400000))); // Corpus Christi
  add(nextMonday(new Date(easter.getTime() + 68 * 86400000))); // Sagrado Corazón

  return holidays;
}

/** Caché por año */
const cache = {};

function isColombianHoliday(dateStr) {
  const year = parseInt(dateStr.slice(0, 4), 10);
  if (!cache[year]) cache[year] = getHolidaysForYear(year);
  return cache[year].has(dateStr);
}

/** Lista de feriados para un año (array de strings YYYY-MM-DD) */
function listHolidaysForYear(year) {
  if (!cache[year]) cache[year] = getHolidaysForYear(year);
  return [...cache[year]].sort();
}

module.exports = { isColombianHoliday, listHolidaysForYear, getHolidaysForYear };
