/**
 * Servicio de leads conectado a la API backend.
 * Todas las funciones son async.
 */

import { api } from './apiClient';
import { validarYNormalizarProcedencia } from '../utils/procedenciaNormalizer';

const normLead = (l) => ({
  emailKey: ((l.email || '').toString().trim()).toLowerCase(),
  phoneKey: (l.telefono || '').toString().replace(/\D/g, ''),
});

const mapLeadFromApi = (l) => ({
  ...l,
  estado: (l.estado || '').toLowerCase(),
  id: l.id,
  fecha: l.createdAt ? String(l.createdAt).slice(0, 10) : (l.fecha || ''),
});

const mapLeadToApi = (lead) => {
  const out = { ...lead };
  if (out.estado) out.estado = out.estado.toUpperCase();
  return out;
};

/**
 * Obtiene todos los leads desde la API.
 * @returns {Promise<Array>}
 */
export async function getAllLeads() {
  const { data, error } = await api.get('/api/leads?limit=100');
  if (error) return [];
  const list = data?.data?.leads ?? [];
  return list.map(mapLeadFromApi);
}

function mapAptToLead(apt, estadoLead, idPrefix = 'lead_from_apt_') {
  const procedenciaNorm = (p) => validarYNormalizarProcedencia(p || 'visita-medica');
  const dateStr = apt.fecha ? (typeof apt.fecha === 'string' ? apt.fecha.slice(0, 10) : apt.fecha?.toISOString?.()?.slice(0, 10)) : '';
  return {
    id: `${idPrefix}${apt.id}`,
    nombre: apt.patientName || '',
    email: apt.patientEmail || '',
    telefono: apt.patientPhone || '',
    procedencia: procedenciaNorm(apt.procedencia),
    interes: apt.motivo || 'Consulta General',
    notas: idPrefix === 'patient_from_apt_' ? `Paciente desde cita ${dateStr} ${apt.hora || ''}` : `Desde cita ${dateStr} ${apt.hora || ''} - ${apt.estado || ''}`,
    estado: estadoLead,
    fecha: dateStr,
    createdAt: apt.createdAt,
    updatedAt: apt.updatedAt || apt.createdAt,
    appointmentId: apt.id,
  };
}

/**
 * Obtiene leads desde citas (API appointments no completadas/no paciente).
 * @returns {Promise<Array>}
 */
export async function getLeadsFromAppointments() {
  const { data, error } = await api.get('/api/appointments?limit=100');
  if (error) return [];
  const appointments = data?.data?.appointments ?? [];
  const filtered = appointments.filter(
    (apt) => apt.estado !== 'COMPLETED' && apt.estado !== 'PATIENT'
  );
  const status = (s) => (s || '').toLowerCase();

  return filtered.map((apt) => {
    let estadoLead = 'agendado';
    const s = status(apt.estado);
    if (s === 'no_show' || s === 'no-show') estadoLead = 'nuevo';
    else if (s === 'cancelled') estadoLead = 'nuevo';
    else if (s === 'confirmed' || s === 'rescheduled') estadoLead = 'agendado';
    return mapAptToLead(apt, estadoLead, 'lead_from_apt_');
  });
}

/**
 * Obtiene pacientes desde citas (estado PATIENT) para mostrarlos en el funnel.
 * Conecta la traza de quienes son paciente solo por cita con el funnel de leads.
 * @returns {Promise<Array>}
 */
export async function getPatientsFromAppointments() {
  const { data, error } = await api.get('/api/appointments?limit=100');
  if (error) return [];
  const appointments = data?.data?.appointments ?? [];
  const patientApts = appointments.filter((apt) => apt.estado === 'PATIENT');
  return patientApts.map((apt) => mapAptToLead(apt, 'paciente', 'patient_from_apt_'));
}

async function fetchLeadsAndPatientsFromAppointments() {
  const { data, error } = await api.get('/api/appointments?limit=100');
  if (error) return { leads: [], patients: [] };
  const appointments = data?.data?.appointments ?? [];
  const status = (s) => (s || '').toLowerCase();
  const leads = [];
  const patients = [];
  appointments.forEach((apt) => {
    if (apt.estado === 'PATIENT') {
      patients.push(mapAptToLead(apt, 'paciente', 'patient_from_apt_'));
      return;
    }
    if (apt.estado === 'COMPLETED') return;
    let estadoLead = 'agendado';
    const s = status(apt.estado);
    if (s === 'no_show' || s === 'no-show') estadoLead = 'nuevo';
    else if (s === 'cancelled') estadoLead = 'nuevo';
    else if (s === 'confirmed' || s === 'rescheduled') estadoLead = 'agendado';
    leads.push(mapAptToLead(apt, estadoLead, 'lead_from_apt_'));
  });
  return { leads, patients };
}

/**
 * Obtiene todos los leads (manuales + desde citas + pacientes por cita), combinados y sin duplicados.
 * Incluye pacientes que solo existen por cita (estado PATIENT) para que aparezcan en el funnel.
 * @returns {Promise<Array>}
 */
export async function getAllLeadsCombined() {
  const [manualLeads, { leads: leadsFromAppointments, patients: patientsFromAppointments }] = await Promise.all([
    getAllLeads(),
    fetchLeadsAndPatientsFromAppointments(),
  ]);

  const combined = [];
  const processedEmails = new Set();
  const processedPhones = new Set();

  leadsFromAppointments.forEach((lead) => {
    const { emailKey, phoneKey } = normLead(lead);
    const exists = (emailKey && processedEmails.has(emailKey)) || (phoneKey && processedPhones.has(phoneKey));
    if (exists) return;
    combined.push({
      ...lead,
      appointmentId: lead.appointmentId || (lead.id?.replace?.('lead_from_apt_', '') || null),
    });
    if (emailKey) processedEmails.add(emailKey);
    if (phoneKey) processedPhones.add(phoneKey);
  });

  manualLeads.forEach((lead) => {
    const { emailKey, phoneKey } = normLead(lead);
    const exists = (emailKey && processedEmails.has(emailKey)) || (phoneKey && processedPhones.has(phoneKey));

    if (lead.estado === 'convertido' && lead.appointmentId) {
      const idx = combined.findIndex((l) => {
        const { emailKey: ek, phoneKey: pk } = normLead(l);
        const match = (emailKey && ek === emailKey) || (phoneKey && pk === phoneKey);
        return match && l.appointmentId && String(l.id || '').startsWith('lead_from_apt_');
      });
      if (idx !== -1) combined.splice(idx, 1);
      combined.push({ ...lead, estado: 'convertido', appointmentId: lead.appointmentId });
      if (emailKey) processedEmails.add(emailKey);
      if (phoneKey) processedPhones.add(phoneKey);
      return;
    }
    if (exists) return;

    combined.push({
      ...lead,
      estado: lead.estado || 'nuevo',
      appointmentId: lead.appointmentId || null,
    });
    if (emailKey) processedEmails.add(emailKey);
    if (phoneKey) processedPhones.add(phoneKey);
  });

  patientsFromAppointments.forEach((p) => {
    const { emailKey, phoneKey } = normLead(p);
    const exists = (emailKey && processedEmails.has(emailKey)) || (phoneKey && processedPhones.has(phoneKey));
    if (exists) return;
    combined.push({
      ...p,
      appointmentId: p.appointmentId || (p.id?.replace?.('patient_from_apt_', '') || null),
    });
    if (emailKey) processedEmails.add(emailKey);
    if (phoneKey) processedPhones.add(phoneKey);
  });

  return combined;
}

/**
 * Crea un lead.
 * @param {Object} leadData
 * @returns {Promise<{ success: boolean, lead?: Object, error?: string }>}
 */
export async function createLead(leadData) {
  const procedencia = validarYNormalizarProcedencia(leadData.procedencia || leadData.origen || 'visita-medica');
  const payload = {
    nombre: leadData.nombre,
    email: (leadData.email || '').trim(),
    telefono: leadData.telefono,
    direccion: leadData.direccion,
    ciudad: leadData.ciudad,
    usuarioAudifonosMedicados: leadData.usuarioAudifonosMedicados || 'NO',
    procedencia,
    interes: leadData.interes || 'Consulta General',
    notas: leadData.notas,
    medicoReferente: leadData.medicoReferente,
    redSocial: leadData.redSocial,
    campanaMarketingOffline: leadData.campanaMarketingOffline,
    personaRecomendacion: leadData.personaRecomendacion,
    agendamientoManualTipo: leadData.agendamientoManualTipo,
  };
  if (leadData.estado) payload.estado = leadData.estado;
  // Solo enviar appointmentId si es UUID (cita creada en API)
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (leadData.appointmentId && uuidLike.test(String(leadData.appointmentId))) payload.appointmentId = leadData.appointmentId;

  const { data, error } = await api.post('/api/leads', payload);
  if (error) return { success: false, lead: null, error };
  const lead = data?.data ? mapLeadFromApi(data.data) : null;
  return { success: !!lead, lead, error: lead ? null : 'Error al crear lead' };
}

/**
 * Actualiza un lead.
 * @param {string} leadId
 * @param {Object} updates
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function updateLead(leadId, updates) {
  if (String(leadId || '').startsWith('lead_from_apt_')) {
    return { success: false, error: 'No se puede editar un lead generado desde una cita' };
  }
  const payload = mapLeadToApi(updates);
  const { data, error } = await api.put(`/api/leads/${leadId}`, payload);
  if (error) return { success: false, error };
  return { success: !!(data?.data), error: data?.data ? null : 'Error al actualizar' };
}

/**
 * Elimina un lead.
 * @param {string} leadId
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function deleteLead(leadId) {
  if (String(leadId || '').startsWith('lead_from_apt_')) {
    return { success: false, error: 'No se puede eliminar un lead generado desde una cita' };
  }
  const { error } = await api.delete(`/api/leads/${leadId}`);
  return { success: !error, error: error || null };
}

/**
 * Busca un lead por email o teléfono (duplicados).
 * @param {string} email
 * @param {string} telefono
 * @param {string} [excludeLeadId]
 * @returns {Promise<Object|null>}
 */
export async function findLeadByEmailOrPhone(email, telefono, excludeLeadId) {
  const params = new URLSearchParams();
  if (email) params.set('email', email);
  if (telefono) params.set('telefono', telefono);
  if (excludeLeadId) params.set('excludeId', excludeLeadId);
  const q = params.toString();
  const { data, error } = await api.get(`/api/leads/check-duplicate${q ? `?${q}` : ''}`);
  if (error || !data?.data?.existingLead) return null;
  return mapLeadFromApi(data.data.existingLead);
}
