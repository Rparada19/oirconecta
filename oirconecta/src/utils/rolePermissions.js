/**
 * Permisos por rol para el portal CRM
 * ADMIN: todo
 * RECEPCION: operativo (citas, leads, pacientes). Campañas solo lectura. Sin Configuración.
 * AUDIOLOGA: clínico/comercial (pacientes, ventas, cotizaciones). Campañas CRUD (dueña de clínica). Sin Configuración.
 * VENDEDOR: igual que AUDIOLOGA
 * SOLO_LECTURA: ver todo excepto Configuración
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  RECEPCION: 'RECEPCION',
  AUDIOLOGA: 'AUDIOLOGA',
  VENDEDOR: 'VENDEDOR',
  SOLO_LECTURA: 'SOLO_LECTURA',
};

export const MENU_KEYS = {
  DASHBOARD: 'dashboard',
  ACCIONES_DIA: 'acciones-dia',
  CITAS: 'citas',
  LEADS: 'leads',
  PACIENTES: 'pacientes',
  CAMPANAS: 'campanas',
  REPORTES: 'reportes',
  CONFIGURACION: 'configuracion',
  DIRECTORIO_REVISION: 'directorio-revision',
};

// Menús visibles por rol (Configuración solo ADMIN)
const MENU_BY_ROLE = {
  [ROLES.ADMIN]: [MENU_KEYS.DASHBOARD, MENU_KEYS.ACCIONES_DIA, MENU_KEYS.CITAS, MENU_KEYS.LEADS, MENU_KEYS.PACIENTES, MENU_KEYS.CAMPANAS, MENU_KEYS.REPORTES, MENU_KEYS.DIRECTORIO_REVISION, MENU_KEYS.CONFIGURACION],
  [ROLES.RECEPCION]: [MENU_KEYS.DASHBOARD, MENU_KEYS.ACCIONES_DIA, MENU_KEYS.CITAS, MENU_KEYS.LEADS, MENU_KEYS.PACIENTES, MENU_KEYS.CAMPANAS, MENU_KEYS.REPORTES],
  [ROLES.AUDIOLOGA]: [MENU_KEYS.DASHBOARD, MENU_KEYS.ACCIONES_DIA, MENU_KEYS.CITAS, MENU_KEYS.LEADS, MENU_KEYS.PACIENTES, MENU_KEYS.CAMPANAS, MENU_KEYS.REPORTES],
  [ROLES.VENDEDOR]: [MENU_KEYS.DASHBOARD, MENU_KEYS.ACCIONES_DIA, MENU_KEYS.CITAS, MENU_KEYS.LEADS, MENU_KEYS.PACIENTES, MENU_KEYS.CAMPANAS, MENU_KEYS.REPORTES],
  [ROLES.SOLO_LECTURA]: [MENU_KEYS.DASHBOARD, MENU_KEYS.ACCIONES_DIA, MENU_KEYS.CITAS, MENU_KEYS.LEADS, MENU_KEYS.PACIENTES, MENU_KEYS.CAMPANAS, MENU_KEYS.REPORTES],
};

const normalizeRole = (r) => (typeof r === 'string' ? r.toUpperCase() : r);

export function getMenuForRole(role) {
  const r = normalizeRole(role);
  return MENU_BY_ROLE[r] || MENU_BY_ROLE[ROLES.RECEPCION];
}

export function canAccessConfig(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

export function canManageCampaigns(role) {
  return [ROLES.ADMIN, ROLES.AUDIOLOGA, ROLES.VENDEDOR].includes(normalizeRole(role));
}

export function canRegisterSales(role) {
  return [ROLES.ADMIN, ROLES.AUDIOLOGA, ROLES.VENDEDOR].includes(normalizeRole(role));
}

/** RECEPCIÓN puede agregar productos y facturar en perfil de paciente. ADMIN, AUDIOLOGA, VENDEDOR, RECEPCION. */
export function canAddAndInvoiceProducts(role) {
  return [ROLES.ADMIN, ROLES.AUDIOLOGA, ROLES.VENDEDOR, ROLES.RECEPCION].includes(normalizeRole(role));
}

/** Datos generales (nombre, email, etc.): solo ADMIN puede editar. */
export function canEditDatosGenerales(role) {
  return normalizeRole(role) === ROLES.ADMIN;
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
