/** Próximo lunes igual o posterior a una fecha */
function nextMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 1 ? 0 : day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function easterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function fmt(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const cache = {};

export function getHolidaysForYear(year) {
  if (cache[year]) return cache[year];
  const set = new Set();
  const add = (d) => set.add(fmt(d));
  const fixed = (m, d) => add(new Date(year, m - 1, d));
  const emiliani = (m, d) => add(nextMonday(new Date(year, m - 1, d)));

  fixed(1, 1); fixed(5, 1); fixed(7, 20); fixed(8, 7); fixed(12, 8); fixed(12, 25);
  emiliani(1, 6); emiliani(3, 19); emiliani(6, 29);
  emiliani(8, 15); emiliani(10, 12); emiliani(11, 1); emiliani(11, 11);

  const easter = easterSunday(year);
  const offset = (n) => new Date(easter.getTime() + n * 86400000);
  add(offset(-3)); add(offset(-2));
  add(nextMonday(offset(39)));
  add(nextMonday(offset(60)));
  add(nextMonday(offset(68)));

  cache[year] = set;
  return set;
}

export function isColombianHoliday(dateStr) {
  const year = parseInt(dateStr.slice(0, 4), 10);
  return getHolidaysForYear(year).has(dateStr);
}

export function isNonWorkingDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  if (dow === 0 || dow === 6) return true;
  return isColombianHoliday(dateStr);
}
