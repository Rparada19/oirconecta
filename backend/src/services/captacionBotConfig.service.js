/**
 * Cerebro comercial editable del bot de captación (rama "Soy profesional").
 *
 * Fila única (id="singleton"). El portal comercial edita el argumentario; el bot
 * lo inyecta en su system prompt para vender/cerrar con profesionales.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ID = 'singleton';

async function get() {
  let cfg = await prisma.captacionBotConfig.findUnique({ where: { id: ID } });
  if (!cfg) {
    cfg = await prisma.captacionBotConfig.create({ data: { id: ID } });
  }
  return cfg;
}

async function update(data = {}) {
  const clean = {
    propuestaValor: data.propuestaValor ?? undefined,
    planesPrecios: data.planesPrecios ?? undefined,
    diferenciadores: data.diferenciadores ?? undefined,
    objeciones: data.objeciones ?? undefined,
    faqs: Array.isArray(data.faqs) ? data.faqs : undefined,
    tono: data.tono ?? undefined,
    objetivoCierre: data.objetivoCierre === 'CERRAR_CHAT' ? 'CERRAR_CHAT' : (data.objetivoCierre === 'AGENDAR' ? 'AGENDAR' : undefined),
    instruccionesExtra: data.instruccionesExtra ?? undefined,
    activo: typeof data.activo === 'boolean' ? data.activo : undefined,
  };
  return prisma.captacionBotConfig.upsert({
    where: { id: ID },
    create: { id: ID, ...clean },
    update: clean,
  });
}

/**
 * Renderiza la configuración como un bloque de texto para inyectar en el prompt
 * del bot. Devuelve '' si está inactiva o vacía.
 */
function buildPromptSection(cfg) {
  if (!cfg || cfg.activo === false) return '';
  const parts = [];
  if (cfg.propuestaValor) parts.push(`PROPUESTA DE VALOR (úsala para argumentar):\n${cfg.propuestaValor}`);
  if (cfg.diferenciadores) parts.push(`DIFERENCIADORES vs. otras opciones:\n${cfg.diferenciadores}`);
  if (cfg.planesPrecios) parts.push(`PLANES Y PRECIOS (comunícalos así):\n${cfg.planesPrecios}`);
  if (cfg.objeciones) parts.push(`MANEJO DE OBJECIONES (responde en este espíritu):\n${cfg.objeciones}`);
  if (Array.isArray(cfg.faqs) && cfg.faqs.length) {
    const faqTxt = cfg.faqs
      .filter((f) => f && (f.pregunta || f.respuesta))
      .map((f) => `- P: ${f.pregunta || ''}\n  R: ${f.respuesta || ''}`)
      .join('\n');
    if (faqTxt) parts.push(`PREGUNTAS FRECUENTES:\n${faqTxt}`);
  }
  if (cfg.tono) parts.push(`TONO Y ESTILO ADICIONAL:\n${cfg.tono}`);
  const objetivo = cfg.objetivoCierre === 'CERRAR_CHAT'
    ? 'OBJETIVO: cierra la venta en el chat cuando haya interés claro; si no, agenda la reunión con el ejecutivo.'
    : 'OBJETIVO: lleva la conversación a AGENDAR la reunión con el ejecutivo comercial.';
  parts.push(objetivo);
  if (cfg.instruccionesExtra) parts.push(`INSTRUCCIONES ADICIONALES:\n${cfg.instruccionesExtra}`);

  if (parts.length === 0) return '';
  return `\n\n=== ARGUMENTARIO COMERCIAL (editable por el equipo) ===\n${parts.join('\n\n')}\n=== FIN ARGUMENTARIO ===`;
}

module.exports = { get, update, buildPromptSection };
