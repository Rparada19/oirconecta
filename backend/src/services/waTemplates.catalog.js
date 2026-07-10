/**
 * F9a.1 — Catálogo de plantillas HSM aprobadas por Meta para el WhatsApp
 * corporativo OírConecta. Este archivo es la fuente de verdad hasta que
 * agreguemos sincronización con la Graph API (opcional futuro).
 *
 * Cuando agregues una plantilla nueva en Meta:
 *  1. Espera aprobación (24-48h).
 *  2. Copia el nombre exacto (name) que Meta usa (case-sensitive).
 *  3. Agrégala aquí con las variables que definiste.
 *  4. Deploy.
 *
 * Los templates de Meta usan {{1}}, {{2}}... como placeholders posicionales.
 * `variables` es solo metadata para la UI (labels).
 */

const CATALOG = [
  {
    key: 'saludo_paciente_bogota',
    metaName: 'saludo_paciente_bogota',
    locale: 'es_CO',
    category: 'UTILITY',
    label: 'Saludo · Paciente Bogotá',
    description: 'Contactar a leads de FB Ads o pauta digital que no han escrito primero.',
    businessLine: 'CRM',
    variables: [
      { key: 'nombre', label: 'Nombre del paciente', placeholder: 'Ej. María' },
    ],
    preview:
      'Hola {{1}}, gracias por tu interés en OírConecta. Somos un centro auditivo en Bogotá. ¿Podríamos ayudarte a agendar tu valoración auditiva?',
  },
  {
    key: 'invitacion_profesional',
    metaName: 'invitacion_profesional',
    locale: 'es_CO',
    category: 'MARKETING',
    label: 'Invitación · Profesional al directorio',
    description: 'Captación outbound de audiólogos, otorrinos o centros para el directorio.',
    businessLine: 'DIRECTORIO',
    variables: [
      { key: 'nombre', label: 'Nombre del profesional', placeholder: 'Ej. Dra. Carolina' },
    ],
    preview:
      'Hola {{1}}, soy del equipo de OírConecta. Estamos invitando profesionales verificados a formar parte de nuestro directorio nacional. ¿Podríamos conversar?',
  },
  {
    key: 'seguimiento_general',
    metaName: 'seguimiento_general',
    locale: 'es_CO',
    category: 'UTILITY',
    label: 'Seguimiento · Lead del sitio web',
    description: 'Seguimiento a personas que dejaron sus datos en el formulario del sitio.',
    businessLine: 'CRM',
    variables: [
      { key: 'nombre', label: 'Nombre', placeholder: 'Ej. Andrés' },
    ],
    preview:
      'Hola {{1}}, vimos que dejaste tus datos en oirconecta.com. ¿Cómo podemos ayudarte hoy?',
  },
];

function listTemplates({ businessLine } = {}) {
  if (!businessLine) return CATALOG;
  const line = String(businessLine).toUpperCase();
  return CATALOG.filter((t) => !t.businessLine || t.businessLine === line);
}

function getByKey(key) {
  return CATALOG.find((t) => t.key === key) || null;
}

/**
 * Renderiza el preview con los valores del usuario (para mostrar en UI antes de enviar).
 * NO es lo que se envía a Meta — Meta usa solo los positional params.
 */
function renderPreview(template, values) {
  if (!template) return '';
  let text = template.preview || '';
  template.variables.forEach((v, i) => {
    const val = values?.[v.key] ?? values?.[String(i + 1)] ?? `{{${i + 1}}}`;
    text = text.split(`{{${i + 1}}}`).join(val);
  });
  return text;
}

/**
 * Convierte {nombre: "María"} en ["María"] siguiendo el orden de variables.
 * Devuelve error si falta alguna variable requerida.
 */
function buildBodyParams(template, values = {}) {
  if (!template) throw new Error('Plantilla no encontrada');
  const out = [];
  for (const v of template.variables) {
    const val = values?.[v.key];
    if (val == null || String(val).trim() === '') {
      const err = new Error(`Falta variable "${v.label || v.key}"`);
      err.code = 'MISSING_VARIABLE';
      throw err;
    }
    out.push(String(val).trim());
  }
  return out;
}

module.exports = {
  CATALOG,
  listTemplates,
  getByKey,
  renderPreview,
  buildBodyParams,
};
