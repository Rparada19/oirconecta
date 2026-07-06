/**
 * T6 — Asistente de diseño con IA para templates de email.
 *
 * Recibe una instrucción en lenguaje natural y edita el template
 * respetando: variables {{var}}, brand tokens, compatibilidad email.
 * Usa Claude Haiku 4.5 (rápido y barato, ~$0.006 por edición).
 */

const Anthropic = require('@anthropic-ai/sdk');

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_INSTRUCTION_LEN = 800;
const MAX_TEMPLATE_LEN = 20000;

const SYSTEM_PROMPT = `Eres un asistente experto en diseño y edición de emails HTML para OírConecta, una plataforma de salud auditiva en Colombia. Tu tarea es modificar el subject y/o cuerpo HTML de un template según la instrucción del usuario.

Reglas absolutas:

1. VARIABLES DE INTERPOLACIÓN: NUNCA borres, renombres o modifiques las variables {{var}} presentes en el template. Son sagradas. Si el usuario pide "quitar el nombre del paciente" o similar, negocia manteniendo la variable pero cambiando el contexto.

2. HTML COMPATIBLE CON EMAIL: Usa SOLO estilos inline (style="..."). NO uses <style>, class, id, javascript, ni CSS externo. Los clientes de email (Gmail, Outlook, Apple Mail) los ignoran o rompen.

3. TAGS PERMITIDOS: <p>, <strong>, <em>, <a>, <br>, <ul>, <ol>, <li>, <blockquote>, <div>, <span>, <table>, <tr>, <td>, <h1>, <h2>, <h3>, <img>. NADA MÁS.

4. BRAND OírConecta:
   - Serif para titulares: font-family:'Playfair Display',Georgia,serif
   - Navy principal: #0F2A4A (títulos y texto oscuro)
   - Accent morado: #6d28d9 (botones, acentos, quotes)
   - Verde salud: #15803d (secundario, WhatsApp)
   - Muted gris: #64748b (texto secundario, labels)
   - Cream fondo: #fafbfc (backgrounds sutiles)
   - Borders: 1px solid #eef0f3
   - Bordes redondeados: border-radius entre 8px y 14px
   - Botones: padding:14px 32px; background:#0F2A4A; color:#fff; text-decoration:none; border-radius:10px; font-weight:700
   - Blockquotes: border-left:3px solid #6d28d9; padding:8px 20px; font-style:italic; background:#faf5ff

5. TONO: cálido, respetuoso, honesto. Nunca agresivo con la venta. Habla de "cuidar la audición", "acompañar", "escuchar". No prometas resultados clínicos.

6. LONGITUD: mantén balance entre concisión y contenido rico. Emails de menos de 3 párrafos suelen convertir mejor.

7. FORMATO DE RESPUESTA: Devuelve SIEMPRE un objeto JSON con esta forma exacta:
{
  "subject": "nuevo subject (o el mismo si no cambió)",
  "body": "nuevo HTML del body (o el mismo si no cambió)",
  "changes": "explicación breve en español (máximo 200 chars) de qué modificaste y por qué"
}
NO envuelvas el JSON en markdown ni agregues texto antes o después.`;

/**
 * Edita un template con IA según instrucción del usuario.
 * @param {object} params
 * @param {string} params.code Código del template (para logs).
 * @param {string} params.currentSubject
 * @param {string} params.currentBody
 * @param {string[]} params.variables Variables permitidas ["nombre", "fecha", ...].
 * @param {string} params.instruction Instrucción libre del usuario.
 * @returns {Promise<{ subject: string, body: string, changes: string, usage: object }>}
 */
async function editTemplate({ code, currentSubject, currentBody, variables = [], instruction }) {
  if (!instruction || typeof instruction !== 'string') {
    throw new Error('Falta instrucción');
  }
  if (instruction.length > MAX_INSTRUCTION_LEN) {
    throw new Error(`Instrucción demasiado larga (máx ${MAX_INSTRUCTION_LEN} chars)`);
  }
  if ((currentBody || '').length > MAX_TEMPLATE_LEN) {
    throw new Error('Template demasiado largo para editar con IA');
  }

  const varsBlock = variables.length > 0
    ? `Variables disponibles (PRESERVAR): ${variables.map((v) => `{{${v}}}`).join(', ')}`
    : 'Este template no tiene variables.';

  const userMessage = `Template actual: ${code}

${varsBlock}

--- SUBJECT ACTUAL ---
${currentSubject}

--- BODY ACTUAL ---
${currentBody}

--- INSTRUCCIÓN DEL USUARIO ---
${instruction}

Devuelve el JSON con subject, body y changes según las reglas.`;

  const client = new Anthropic();
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = (resp.content || []).find((b) => b.type === 'text');
  const raw = textBlock?.text?.trim() || '';

  // Parse defensivo: aceptar tanto JSON limpio como envuelto en ```json
  let json;
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    json = JSON.parse(cleaned);
  } catch (e) {
    console.error('[ai-edit] respuesta no es JSON válido:', raw.slice(0, 200));
    throw new Error('El asistente no devolvió una respuesta válida. Reintenta con otra instrucción.');
  }

  if (!json.subject || !json.body) {
    throw new Error('El asistente omitió subject o body');
  }

  // Validación: todas las variables originales deben seguir presentes
  const missingVars = [];
  const combinedNew = `${json.subject}\n${json.body}`;
  for (const v of variables) {
    if (!combinedNew.includes(`{{${v}}}`)) {
      // Solo alertamos si estaba en el original
      const wasInOriginal = `${currentSubject}\n${currentBody}`.includes(`{{${v}}}`);
      if (wasInOriginal) missingVars.push(v);
    }
  }
  if (missingVars.length > 0) {
    console.warn('[ai-edit] Variables perdidas:', missingVars.join(', '));
    json.changes = (json.changes || '') + ` [ALERTA: se removieron variables ${missingVars.join(', ')} — revisa antes de guardar]`;
  }

  return {
    subject: String(json.subject).slice(0, 500),
    body: String(json.body).slice(0, MAX_TEMPLATE_LEN),
    changes: String(json.changes || 'Cambio aplicado').slice(0, 500),
    usage: {
      inputTokens: resp.usage?.input_tokens || 0,
      outputTokens: resp.usage?.output_tokens || 0,
    },
  };
}

module.exports = { editTemplate };
