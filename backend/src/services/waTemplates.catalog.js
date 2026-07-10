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

// ─── Tipificaciones de contacto ───────────────────────────
// Determina la bandeja (businessLine) y qué plantillas aplican.
const CONTACT_TYPES = [
  {
    key: 'PACIENTE_BOGOTA',
    label: 'Paciente potencial (Bogotá)',
    description: 'Leads de FB Ads o pauta que buscan valoración auditiva en el centro.',
    businessLine: 'CRM',
    icon: 'PersonAddAlt1',
  },
  {
    key: 'PACIENTE_EXISTENTE',
    label: 'Paciente existente',
    description: 'Ya es cliente del centro. Seguimiento post-adaptación, controles, mantenimientos.',
    businessLine: 'CRM',
    icon: 'People',
  },
  {
    key: 'PROFESIONAL_DIRECTORIO',
    label: 'Profesional (invitación directorio)',
    description: 'Audiólogos u otorrinos para inscribirse al directorio.',
    businessLine: 'DIRECTORIO',
    icon: 'MedicalServices',
  },
  {
    key: 'INFO_GENERAL',
    label: 'Info general / duda',
    description: 'Personas con preguntas sueltas sin intención comercial clara.',
    businessLine: 'CRM',
    icon: 'HelpOutline',
  },
  {
    key: 'ALIADO_PROVEEDOR',
    label: 'Aliado / proveedor',
    description: 'Marcas de audífonos, distribuidores, socios comerciales B2B.',
    businessLine: 'CRM',
    icon: 'HandshakeOutlined',
  },
  {
    key: 'OTROS',
    label: 'Otros',
    description: 'Cualquier otro caso que no encaje en las anteriores.',
    businessLine: 'CRM',
    icon: 'MoreHoriz',
  },
];

// ─── Catálogo de plantillas ───────────────────────────────
// Cada plantilla especifica el contactType al que aplica.
const CATALOG = [
  {
    key: 'saludo_paciente_bogota',
    metaName: 'saludo_paciente_bogota',
    locale: 'es_CO',
    category: 'UTILITY',
    label: 'Saludo · Paciente Bogotá',
    description: 'Contactar a leads de FB Ads o pauta digital que no han escrito primero.',
    contactType: 'PACIENTE_BOGOTA',
    variables: [
      { key: 'nombre', label: 'Nombre del paciente', placeholder: 'Ej. María' },
    ],
    preview:
      'Hola {{1}}, gracias por tu interés en OírConecta. Somos un centro auditivo en Bogotá. ¿Podríamos ayudarte a agendar tu valoración auditiva?',
  },
  {
    key: 'paciente_existente_saludo',
    metaName: 'paciente_existente_saludo',
    locale: 'es_CO',
    category: 'UTILITY',
    label: 'Saludo · Paciente existente',
    description: 'Retomar contacto con un paciente ya activo del centro (control, adaptación, mantenimiento).',
    contactType: 'PACIENTE_EXISTENTE',
    variables: [
      { key: 'nombre', label: 'Nombre del paciente', placeholder: 'Ej. Don Pedro' },
    ],
    preview:
      'Hola {{1}}, te escribimos desde OírConecta. Queremos hacer seguimiento a tu proceso auditivo. ¿Cómo has estado?',
  },
  {
    key: 'invitacion_profesional',
    metaName: 'invitacion_profesional',
    locale: 'es_CO',
    category: 'MARKETING',
    label: 'Invitación · Profesional al directorio',
    description: 'Captación outbound de audiólogos, otorrinos o centros para el directorio.',
    contactType: 'PROFESIONAL_DIRECTORIO',
    variables: [
      { key: 'nombre', label: 'Nombre del profesional', placeholder: 'Ej. Dra. Carolina' },
    ],
    preview:
      'Hola {{1}}, soy del equipo de OírConecta. Estamos invitando profesionales verificados a formar parte de nuestro directorio nacional. ¿Podríamos conversar?',
  },
  {
    key: 'info_general',
    metaName: 'info_general',
    locale: 'es_CO',
    category: 'UTILITY',
    label: 'Info general · Respuesta a duda',
    description: 'Para responder consultas informativas sin intención comercial definida.',
    contactType: 'INFO_GENERAL',
    variables: [
      { key: 'nombre', label: 'Nombre', placeholder: 'Ej. Andrés' },
    ],
    preview:
      'Hola {{1}}, gracias por escribirnos a OírConecta. Estamos disponibles para resolver tus dudas sobre salud auditiva. ¿En qué podemos ayudarte hoy?',
  },
  {
    key: 'aliado_saludo',
    metaName: 'aliado_saludo',
    locale: 'es_CO',
    category: 'MARKETING',
    label: 'Saludo · Aliado o proveedor',
    description: 'Contactar marcas, distribuidores o socios comerciales para coordinar reuniones.',
    contactType: 'ALIADO_PROVEEDOR',
    variables: [
      { key: 'nombre', label: 'Nombre del contacto', placeholder: 'Ej. Diego (Widex)' },
      { key: 'tema', label: 'Tema de la conversación', placeholder: 'Ej. propuesta comercial 2026' },
    ],
    preview:
      'Hola {{1}}, del equipo OírConecta. ¿Podríamos coordinar una reunión para revisar {{2}}?',
  },
  {
    key: 'seguimiento_general',
    metaName: 'seguimiento_general',
    locale: 'es_CO',
    category: 'UTILITY',
    label: 'Seguimiento · Lead del sitio web',
    description: 'Seguimiento a personas que dejaron sus datos en el formulario del sitio.',
    contactType: 'PACIENTE_BOGOTA',
    variables: [
      { key: 'nombre', label: 'Nombre', placeholder: 'Ej. Andrés' },
    ],
    preview:
      'Hola {{1}}, vimos que dejaste tus datos en oirconecta.com. ¿Cómo podemos ayudarte hoy?',
  },
];

function listContactTypes() {
  return CONTACT_TYPES;
}

function getContactType(key) {
  return CONTACT_TYPES.find((c) => c.key === key) || null;
}

/**
 * Lista plantillas filtradas por contactType (opcional) o businessLine (opcional).
 * Si no se pasa filtro, devuelve todas.
 */
function listTemplates({ contactType, businessLine } = {}) {
  let out = CATALOG;
  if (contactType) {
    const type = String(contactType).toUpperCase();
    out = out.filter((t) => t.contactType === type);
  } else if (businessLine) {
    const line = String(businessLine).toUpperCase();
    const typesInLine = CONTACT_TYPES.filter((c) => c.businessLine === line).map((c) => c.key);
    out = out.filter((t) => typesInLine.includes(t.contactType));
  }
  return out;
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
  CONTACT_TYPES,
  listContactTypes,
  getContactType,
  listTemplates,
  getByKey,
  renderPreview,
  buildBodyParams,
};
