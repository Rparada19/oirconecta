/**
 * Interpolación {{var}} con escape simple. Sin librería.
 * No HTML-escape: el cuerpo de WhatsApp es texto plano, el de email se
 * concatena en una plantilla HTML segura.
 */
function render(body, vars = {}) {
  if (!body) return '';
  return body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = key.split('.').reduce((o, k) => (o == null ? o : o[k]), vars);
    return v == null ? '' : String(v);
  });
}

module.exports = { render };
