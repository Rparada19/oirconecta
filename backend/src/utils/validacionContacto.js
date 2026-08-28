/**
 * Validación de correo y teléfono para los formularios públicos.
 *
 * Hasta ahora bastaba con escribir "5" para quedar registrado: los endpoints
 * pedían `notEmpty()` y nada más. Eso llena la base de contactos imposibles de
 * atender — y en un negocio donde el seguimiento se hace por WhatsApp, un
 * teléfono falso es un lead perdido que además ensucia las métricas.
 *
 * Criterio: rechazar lo que claramente no se puede contactar, sin castigar a
 * quien escribe raro pero real. Ante la duda, se acepta.
 */

/** Solo dígitos. */
const digitos = (v) => String(v || '').replace(/\D/g, '');

/**
 * Teléfono colombiano válido.
 *  · Celular: 10 dígitos que empiezan por 3.
 *  · Fijo: 10 dígitos que empiezan por 60 (numeración nacional desde 2022).
 *  · Ambos aceptan el indicativo 57 adelante.
 *  · Internacional: si viene con +, entre 8 y 15 dígitos.
 */
function esTelefonoValido(raw) {
  const s = String(raw || '').trim();
  if (!s) return false;
  let d = digitos(s);
  if (!d) return false;

  // Rellenos obvios: 0000000000, 1111111111, 1234567890.
  if (/^(\d)\1+$/.test(d)) return false;
  if ('01234567890123456789'.includes(d) && d.length >= 7) return false;

  // Internacional explícito: confiamos en el largo, no en el país.
  if (s.startsWith('+') && !d.startsWith('57')) {
    return d.length >= 8 && d.length <= 15;
  }

  if (d.startsWith('57') && d.length === 12) d = d.slice(2);
  if (d.length !== 10) return false;
  return d.startsWith('3') || d.startsWith('60');
}

/** Normaliza a E.164 sin '+' para guardar y para WhatsApp. */
function normalizarTelefono(raw) {
  const s = String(raw || '').trim();
  let d = digitos(s);
  if (!d) return '';
  if (s.startsWith('+') && !d.startsWith('57')) return d;
  if (d.length === 10 && (d.startsWith('3') || d.startsWith('60'))) return `57${d}`;
  return d;
}

// Dominios que solo aparecen cuando alguien está saliendo del paso.
const DOMINIOS_FALSOS = new Set([
  'test.com', 'test.co', 'example.com', 'example.org', 'ejemplo.com',
  'correo.com', 'email.com', 'asdf.com', 'aaa.com', 'no.com', 'nose.com',
  'mailinator.com', 'yopmail.com', 'tempmail.com', '10minutemail.com',
  'guerrillamail.com', 'trashmail.com',
]);

/** Correo con forma real y dominio plausible. */
function esEmailValido(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (!s || s.length > 254 || /\s/.test(s)) return false;
  // usuario@dominio.tld — el TLD de al menos 2 letras es lo que descarta "a@a".
  if (!/^[^@]+@[^@.]+(\.[^@.]+)*\.[a-z]{2,}$/.test(s)) return false;

  const [usuario, dominio] = s.split('@');
  if (usuario.length < 2) return false;
  if (DOMINIOS_FALSOS.has(dominio)) return false;
  // Errores de dedo frecuentes que hacen el correo inservible.
  if (/^gmail\.(co|con|cm|om)$/.test(dominio)) return false;
  if (/^hotmail\.(co|con|cm)$/.test(dominio)) return false;
  return true;
}

const MSG_TEL = 'Escribe un teléfono real: celular de 10 dígitos (ej. 3001234567) o fijo con indicativo (ej. 6012345678).';
const MSG_EMAIL = 'Escribe un correo real. Lo usamos para enviarte la confirmación.';

/** Validadores listos para express-validator. */
const telefonoValidator = (campo = 'telefono') => (value) => {
  if (!esTelefonoValido(value)) throw new Error(MSG_TEL);
  return true;
};
const emailValidator = () => (value) => {
  if (!esEmailValido(value)) throw new Error(MSG_EMAIL);
  return true;
};

module.exports = {
  esTelefonoValido, normalizarTelefono, esEmailValido,
  telefonoValidator, emailValidator, MSG_TEL, MSG_EMAIL,
};
