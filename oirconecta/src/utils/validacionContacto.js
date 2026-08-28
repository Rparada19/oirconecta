/**
 * Validación de correo y teléfono en el navegador.
 *
 * Espejo de `backend/src/utils/validacionContacto.js`. El servidor es el que
 * manda — esto solo evita que la persona llene todo el formulario y se entere
 * del error después de enviar. Si cambian las reglas, hay que cambiar ambos.
 */

const digitos = (v) => String(v || '').replace(/\D/g, '');

/**
 * Teléfono colombiano válido: celular de 10 dígitos que empieza por 3, o fijo
 * que empieza por 60 (numeración nacional desde 2022), con o sin el 57.
 * Internacional con '+': entre 8 y 15 dígitos, sin exigir país.
 */
export function esTelefonoValido(raw) {
  const s = String(raw || '').trim();
  if (!s) return false;
  let d = digitos(s);
  if (!d) return false;

  if (/^(\d)\1+$/.test(d)) return false;
  if ('01234567890123456789'.includes(d) && d.length >= 7) return false;

  if (s.startsWith('+') && !d.startsWith('57')) {
    return d.length >= 8 && d.length <= 15;
  }
  if (d.startsWith('57') && d.length === 12) d = d.slice(2);
  if (d.length !== 10) return false;
  return d.startsWith('3') || d.startsWith('60');
}

const DOMINIOS_FALSOS = new Set([
  'test.com', 'test.co', 'example.com', 'example.org', 'ejemplo.com',
  'correo.com', 'email.com', 'asdf.com', 'aaa.com', 'no.com', 'nose.com',
  'mailinator.com', 'yopmail.com', 'tempmail.com', '10minutemail.com',
  'guerrillamail.com', 'trashmail.com',
]);

export function esEmailValido(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s || s.length > 254 || /\s/.test(s)) return false;
  if (!/^[^@]+@[^@.]+(\.[^@.]+)*\.[a-z]{2,}$/.test(s)) return false;
  const [usuario, dominio] = s.split('@');
  if (usuario.length < 2) return false;
  if (DOMINIOS_FALSOS.has(dominio)) return false;
  if (/^gmail\.(co|con|cm|om)$/.test(dominio)) return false;
  if (/^hotmail\.(co|con|cm)$/.test(dominio)) return false;
  return true;
}

export const MSG_TEL = 'Escribe un celular de 10 dígitos (ej. 3001234567) o un fijo con indicativo (ej. 6012345678).';
export const MSG_EMAIL = 'Revisa el correo: ahí te enviamos la confirmación.';

/**
 * Error a mostrar bajo el campo. Devuelve null si está bien o si aún está
 * vacío — no se regaña a alguien que todavía no ha terminado de escribir.
 * @param {'telefono'|'email'} tipo
 */
export function errorDeContacto(tipo, valor, { requerido = true } = {}) {
  const v = String(valor || '').trim();
  if (!v) return requerido ? null : null;
  if (tipo === 'telefono') return esTelefonoValido(v) ? null : MSG_TEL;
  return esEmailValido(v) ? null : MSG_EMAIL;
}
