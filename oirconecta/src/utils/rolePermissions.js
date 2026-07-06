/**
 * Permisos por rol para el portal CRM
 * ADMIN: todo
 * RECEPCION: operativo (citas, leads, pacientes, datos generales del paciente, productos y mantenimientos en perfil). Sin pestaña CRM interactiva ni consentimientos. Sin Configuración.
 * AUDIOLOGA: clínico/comercial (pacientes, ventas, cotizaciones). Sin Configuración. Campañas (pantalla admin) solo ADMIN.
 * VENDEDOR: igual que AUDIOLOGA
 * SOLO_LECTURA: ver todo excepto Configuración
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  RECEPCION: 'RECEPCION',
  AUDIOLOGA: 'AUDIOLOGA',
  VENDEDOR: 'VENDEDOR',
  SOLO_LECTURA: 'SOLO_LECTURA',
  /// Ejecutivo de captación comercial outbound — solo CRM Sales en portal-admin
  EJECUTIVO_COMERCIAL: 'EJECUTIVO_COMERCIAL',
};

export const MENU_KEYS = {
  DASHBOARD: 'dashboard',
  ACCIONES_DIA: 'acciones-dia',
  CITAS: 'citas',
  LEADS: 'leads',
  PACIENTES: 'pacientes',
  CONTROLES: 'controles',
  CAMPANAS: 'campanas',
  REPORTES: 'reportes',
  CONFIGURACION: 'configuracion',
  PRODUCTOS: 'productos',
};

// Menús visibles por rol (Configuración solo ADMIN)
const MENU_BY_ROLE = {
  [ROLES.ADMIN]: [MENU_KEYS.DASHBOARD, MENU_KEYS.ACCIONES_DIA, MENU_KEYS.CITAS, MENU_KEYS.LEADS, MENU_KEYS.PACIENTES, MENU_KEYS.CONTROLES, MENU_KEYS.CAMPANAS, MENU_KEYS.REPORTES, MENU_KEYS.PRODUCTOS, MENU_KEYS.CONFIGURACION],
  [ROLES.RECEPCION]: [MENU_KEYS.DASHBOARD, MENU_KEYS.ACCIONES_DIA, MENU_KEYS.CITAS, MENU_KEYS.LEADS, MENU_KEYS.PACIENTES, MENU_KEYS.CONTROLES, MENU_KEYS.REPORTES],
  [ROLES.AUDIOLOGA]: [MENU_KEYS.DASHBOARD, MENU_KEYS.ACCIONES_DIA, MENU_KEYS.CITAS, MENU_KEYS.LEADS, MENU_KEYS.PACIENTES, MENU_KEYS.CONTROLES, MENU_KEYS.REPORTES],
  [ROLES.VENDEDOR]: [MENU_KEYS.DASHBOARD, MENU_KEYS.ACCIONES_DIA, MENU_KEYS.CITAS, MENU_KEYS.LEADS, MENU_KEYS.PACIENTES, MENU_KEYS.CONTROLES, MENU_KEYS.REPORTES],
  [ROLES.SOLO_LECTURA]: [MENU_KEYS.DASHBOARD, MENU_KEYS.ACCIONES_DIA, MENU_KEYS.CITAS, MENU_KEYS.LEADS, MENU_KEYS.PACIENTES, MENU_KEYS.CONTROLES, MENU_KEYS.REPORTES],
  // EJECUTIVO_COMERCIAL no opera el CRM clínico; queda vacío para portal-crm.
  [ROLES.EJECUTIVO_COMERCIAL]: [],
};

/// Menú visible en portal-admin (administración del sitio + CRM Sales).
export const ADMIN_MENU_KEYS = {
  DASHBOARD:      'admin-dashboard',
  BLOG:           'admin-blog',
  PROFESIONALES:  'admin-profesionales',
  MARKETPLACE:    'admin-marketplace',
  PEDIDOS:        'admin-pedidos',
  COMPARADOR:     'admin-comparador',
  NEWSLETTER:     'admin-newsletter',
  CONTACTOS:      'admin-contactos',
  SUSCRIPCIONES:  'admin-suscripciones',
  MARKETING:      'admin-marketing',
  SALES_DIA:      'admin-sales-dia',
  SALES_LEADS:    'admin-sales-leads',
  SALES_REPORTES: 'admin-sales-reportes',
};

const ADMIN_MENU_FULL = Object.values(ADMIN_MENU_KEYS);
const ADMIN_MENU_SALES_ONLY = [
  ADMIN_MENU_KEYS.SALES_DIA,
  ADMIN_MENU_KEYS.SALES_LEADS,
  ADMIN_MENU_KEYS.SALES_REPORTES,
];

const normalizeRole = (r) => (typeof r === 'string' ? r.toUpperCase() : r);

export function getMenuForRole(role) {
  const r = normalizeRole(role);
  return MENU_BY_ROLE[r] || MENU_BY_ROLE[ROLES.RECEPCION];
}

export function canAccessConfig(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

export function canManageCampaigns(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

/** Administración total de historias clínicas (borrar/editar cualquier dato). Solo ADMIN. */
export function canAdminClinicalHistory(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

export function canRegisterSales(role) {
  return [ROLES.ADMIN, ROLES.AUDIOLOGA, ROLES.VENDEDOR].includes(normalizeRole(role));
}

/** RECEPCIÓN puede agregar productos y facturar en perfil de paciente. ADMIN, AUDIOLOGA, VENDEDOR, RECEPCION. */
export function canAddAndInvoiceProducts(role) {
  return [ROLES.ADMIN, ROLES.AUDIOLOGA, ROLES.VENDEDOR, ROLES.RECEPCION].includes(normalizeRole(role));
}

/** Datos generales (nombre, email, contacto, foto, etc.): ADMIN y RECEPCIÓN. */
export function canEditDatosGenerales(role) {
  const r = normalizeRole(role);
  return r === ROLES.ADMIN || r === ROLES.RECEPCION;
}

/** Firma y asignación de consentimientos informados en perfil: solo ADMIN. */
export function canManagePatientConsentSignatures(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

/**
 * Formularios de la pestaña CRM del paciente (registrar actividad, consumibles, garantías).
 * RECEPCIÓN no; ADMIN, AUDIOLOGA y VENDEDOR sí. Otros roles solo si el diálogo no es readOnly.
 */
export function canUsePatientCrmTabForms(role, readOnly = false) {
  const r = normalizeRole(role);
  if (r === ROLES.RECEPCION) return false;
  if ([ROLES.ADMIN, ROLES.AUDIOLOGA, ROLES.VENDEDOR].includes(r)) return true;
  return !readOnly;
}

/** RECEPCIÓN no puede editar historia clínica (anamnesis clínica, evolucionar). Solo ADMIN, AUDIOLOGA, VENDEDOR. */
export function canEditClinicalHistory(role) {
  return [ROLES.ADMIN, ROLES.AUDIOLOGA, ROLES.VENDEDOR].includes(normalizeRole(role));
}

/** Historia clínica tras primera visita: solo ADMIN puede editar. */
export function canEditClinicalHistoryAfterFirstVisit(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

/** Anamnesis una vez diligenciada: solo ADMIN puede editar. */
export function canEditAnamnesisAfterFilled(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

export function isSoloLectura(role) {
  return normalizeRole(role) === ROLES.SOLO_LECTURA;
}

/// Portal-admin: items de sidebar visibles por rol.
export function getAdminMenuForRole(role) {
  const r = normalizeRole(role);
  if (r === ROLES.ADMIN) return ADMIN_MENU_FULL;
  if (r === ROLES.EJECUTIVO_COMERCIAL) return ADMIN_MENU_SALES_ONLY;
  return [];
}

/// ¿El rol puede entrar al portal-admin?
export function canAccessAdmin(role) {
  const r = normalizeRole(role);
  return r === ROLES.ADMIN || r === ROLES.EJECUTIVO_COMERCIAL;
}

/// ¿El rol ve todas las páginas del portal-admin (no solo Sales)?
export function canAccessAllAdminPages(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

/// ¿El rol puede operar el CRM Sales (outbound captación)?
export function canUseSalesCrm(role) {
  const r = normalizeRole(role);
  return r === ROLES.ADMIN || r === ROLES.EJECUTIVO_COMERCIAL;
}
