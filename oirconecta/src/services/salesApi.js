/**
 * Cliente del CRM Sales — usa el token del portal-admin.
 */
import { adminFetch } from '../pages/admin/adminAuth';

const json = (path, init) => adminFetch(path, init).then((r) => {
  if (!r.ok) throw new Error(r.data?.error || `Error ${r.status}`);
  return r.data?.data;
});

export const salesApi = {
  // Leads
  listLeads:   (params = {}) => json(`/api/sales/leads?${new URLSearchParams(params)}`),
  getLead:     (id) => json(`/api/sales/leads/${id}`),
  createLead:  (data) => json('/api/sales/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead:  (id, data) => json(`/api/sales/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLead:  (id) => json(`/api/sales/leads/${id}`, { method: 'DELETE' }),

  // Actividades
  listActivities: (leadId) => json(`/api/sales/leads/${leadId}/activities`),
  logActivity:    (leadId, data) => json(`/api/sales/leads/${leadId}/activities`, {
    method: 'POST', body: JSON.stringify(data),
  }),

  // Tareas
  createTask:   (leadId, data) => json(`/api/sales/leads/${leadId}/tasks`, {
    method: 'POST', body: JSON.stringify(data),
  }),
  listMyTasks:  (params = {}) => json(`/api/sales/tasks/mine?${new URLSearchParams(params)}`),
  updateTask:   (id, data) => json(`/api/sales/tasks/${id}`, {
    method: 'PATCH', body: JSON.stringify(data),
  }),

  // Conversión
  convertLead:  (id) => json(`/api/sales/leads/${id}/convert`, { method: 'POST' }),

  // Import CSV
  importCsv:    (rows, ownerId) => json('/api/sales/leads/import-csv', {
    method: 'POST', body: JSON.stringify({ rows, ownerId }),
  }),

  // KPIs
  stats:        (params = {}) => json(`/api/sales/stats?${new URLSearchParams(params)}`),

  // Email
  emailTemplates: () => json('/api/sales/email-templates'),
  renderTemplate: (leadId, templateId) => json(`/api/sales/leads/${leadId}/render-template`, {
    method: 'POST', body: JSON.stringify({ templateId }),
  }),
  sendEmail:    (leadId, subject, body) => json(`/api/sales/leads/${leadId}/send-email`, {
    method: 'POST', body: JSON.stringify({ subject, body }),
  }),

  // Admin: usuarios
  listUsers:    () => json('/api/sales/admin/users'),
  createUser:   (data) => json('/api/sales/admin/users', { method: 'POST', body: JSON.stringify(data) }),
};

/** Parsea un CSV simple en cliente (sin librerías). Soporta comillas básicas. */
export function parseCsv(text) {
  const rows = [];
  let i = 0;
  let field = '';
  let row = [];
  let inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { inQuotes = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\n' || c === '\r') {
      if (field !== '' || row.length > 0) { row.push(field); rows.push(row); row = []; field = ''; }
      if (c === '\r' && text[i + 1] === '\n') i++;
      i++; continue;
    }
    field += c; i++;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

/** Construye href wa.me con prefill (sin caracteres no válidos). */
export function waMeHref(telefono, mensaje = '') {
  const digits = String(telefono || '').replace(/\D/g, '');
  if (!digits) return null;
  const phone = digits.startsWith('57') ? digits : `57${digits}`;
  const text = encodeURIComponent(mensaje || '');
  return `https://wa.me/${phone}${text ? `?text=${text}` : ''}`;
}

/** href tel: limpio para click-to-call. */
export function telHref(telefono) {
  const digits = String(telefono || '').replace(/\D/g, '');
  if (!digits) return null;
  return `tel:+${digits.startsWith('57') ? digits : `57${digits}`}`;
}

/** href mailto: con subject y body. */
export function mailtoHref(email, subject = '', body = '') {
  if (!email) return null;
  const qs = [];
  if (subject) qs.push(`subject=${encodeURIComponent(subject)}`);
  if (body) qs.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${email}${qs.length ? `?${qs.join('&')}` : ''}`;
}

export const STATUS_META = {
  NUEVO:           { label: 'Nuevo',           color: '#4054B2', bg: '#eef0fb' },
  CONTACTADO:      { label: 'Contactado',      color: '#8b5cf6', bg: '#f3edff' },
  INTERESADO:      { label: 'Interesado',      color: '#f59e0b', bg: '#fffbeb' },
  DEMO_AGENDADA:   { label: 'Demo agendada',   color: '#0099CC', bg: '#e0f7ff' },
  EN_PRUEBA:       { label: 'En prueba',       color: '#10b981', bg: '#ecfdf5' },
  CONVERTIDO:      { label: 'Convertido',      color: '#047857', bg: '#d1fae5' },
  PERDIDO:         { label: 'Perdido',         color: '#6b7280', bg: '#f3f4f6' },
};

export const PIPELINE_STAGES = ['NUEVO','CONTACTADO','INTERESADO','DEMO_AGENDADA','EN_PRUEBA','CONVERTIDO','PERDIDO'];
