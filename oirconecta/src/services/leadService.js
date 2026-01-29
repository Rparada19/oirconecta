// Servicio de gestión de leads para OirConecta
// Maneja la creación, lectura, actualización y eliminación de leads

import { getAllAppointments } from './appointmentService';
import { validarYNormalizarProcedencia } from '../utils/procedenciaNormalizer';

const LEADS_KEY = 'oirconecta_leads';

const normLead = (l) => ({
  emailKey: ((l.email || '').toString().trim()).toLowerCase(),
  phoneKey: (l.telefono || '').toString().replace(/\D/g, ''),
});

/**
 * Busca un lead existente por email o teléfono (para aviso de duplicado antes de crear).
 * @param {string} email
 * @param {string} telefono
 * @param {string} [excludeLeadId] - Excluir este id (p. ej. al editar)
 * @returns {Object|null} Primer lead encontrado o null
 */
export const findLeadByEmailOrPhone = (email, telefono, excludeLeadId) => {
  const { emailKey, phoneKey } = normLead({ email, telefono });
  if (!emailKey && !phoneKey) return null;
  const manual = getAllLeads();
  const fromApt = getLeadsFromAppointments();
  const all = [...fromApt, ...manual];
  return all.find((l) => {
    if (excludeLeadId && l.id === excludeLeadId) return false;
    const { emailKey: ek, phoneKey: pk } = normLead(l);
    return (emailKey && ek === emailKey) || (phoneKey && pk === phoneKey);
  }) || null;
};

/**
 * Obtiene todos los leads almacenados
 * @returns {Array} Array de leads
 */
export const getAllLeads = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const data = localStorage.getItem(LEADS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error al obtener leads:', error);
    return [];
  }
};

/**
 * Guarda todos los leads en localStorage
 * @param {Array} leads - Array de leads a guardar
 * @returns {boolean} true si se guardó correctamente
 */
const saveLeads = (leads) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
    // Disparar evento personalizado para actualización en tiempo real
    window.dispatchEvent(new CustomEvent('leadsUpdated'));
    return true;
  } catch (error) {
    console.error('Error al guardar leads:', error);
    return false;
  }
};

/**
 * Crea un nuevo lead
 * @param {Object} leadData - Datos del lead
 * @returns {Object} {success: boolean, lead: Object|null, error: string|null}
 */
export const createLead = (leadData) => {
  const {
    nombre,
    email,
    telefono,
    procedencia,
    interes,
    notas,
  } = leadData;
  
  // Compatibilidad: si viene como 'origen' (leads antiguos), convertirlo a 'procedencia'
  // Normalizar procedencia usando la función centralizada
  const procedenciaValue = validarYNormalizarProcedencia(procedencia || leadData.origen || 'visita-medica');

  // Validaciones básicas
  if (!nombre || !email || !telefono) {
    return {
      success: false,
      lead: null,
      error: 'Nombre, email y teléfono son obligatorios',
    };
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      lead: null,
      error: 'El email no es válido',
    };
  }

  // Crear el lead
  // La procedencia debe venir en formato estandarizado (ej: 'leads-marketing-digital', 'visita-medica')
  // IMPORTANTE: Los leads manuales nuevos SIEMPRE tienen estado 'nuevo' y NO tienen appointmentId
  // EXCEPCIÓN: Si se está convirtiendo un lead a cita, puede tener estado 'convertido' y appointmentId
  const lead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    nombre,
    email,
    telefono,
    direccion: leadData.direccion || '',
    ciudad: leadData.ciudad || '',
    usuarioAudifonosMedicados: leadData.usuarioAudifonosMedicados || 'NO',
    procedencia: procedenciaValue, // Usar valor estandarizado (mismo que en landing)
    interes: interes || 'Consulta General',
    notas: notas || '',
    medicoReferente: leadData.medicoReferente || '', // Si procedencia es Visita Médica
    redSocial: leadData.redSocial || '', // Si procedencia es Marketing Digital
    campanaMarketingOffline: leadData.campanaMarketingOffline || '', // Si procedencia es Marketing Offline
    personaRecomendacion: leadData.personaRecomendacion || '', // Si procedencia es Recomendación
    agendamientoManualTipo: leadData.agendamientoManualTipo || '', // Si procedencia es Agendamiento Manual
    // Permitir estado y appointmentId si se están pasando explícitamente (para conversión a cita)
    estado: leadData.estado || 'nuevo', // Por defecto 'nuevo', pero puede ser 'convertido' si se está convirtiendo
    appointmentId: leadData.appointmentId || null, // Por defecto null, pero puede tener appointmentId si se está convirtiendo
    fecha: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  console.log('[LeadService] Creando lead manual:', {
    nombre: lead.nombre,
    email: lead.email,
    estado: lead.estado,
    appointmentId: lead.appointmentId,
    procedencia: lead.procedencia
  });

  // Guardar el lead
  const leads = getAllLeads();
  
  console.log('[LeadService] Antes de agregar lead. Total leads actuales:', leads.length);
  console.log('[LeadService] Lead a crear:', {
    nombre: lead.nombre,
    email: lead.email,
    telefono: lead.telefono,
    estado: lead.estado,
    appointmentId: lead.appointmentId,
    procedencia: lead.procedencia
  });
  
  leads.push(lead);
  
  console.log('[LeadService] Después de agregar lead. Total leads:', leads.length);
  console.log('[LeadService] Lead completo a guardar:', JSON.stringify(lead, null, 2));
  
  const saveResult = saveLeads(leads);
  console.log('[LeadService] Resultado de saveLeads:', saveResult);
  
  if (saveResult) {
    console.log('[LeadService] ✅ Lead guardado exitosamente en localStorage');
    
    // Verificar que se guardó correctamente
    const verifyLeads = getAllLeads();
    console.log('[LeadService] Verificación: Total leads guardados:', verifyLeads.length);
    const foundLead = verifyLeads.find(l => l.id === lead.id);
    console.log('[LeadService] Verificación: Lead encontrado:', foundLead ? '✅ SÍ' : '❌ NO');
    
    if (foundLead) {
      console.log('[LeadService] Lead verificado correctamente:', {
        id: foundLead.id,
        nombre: foundLead.nombre,
        email: foundLead.email,
        estado: foundLead.estado
      });
    } else {
      console.error('[LeadService] ⚠️ El lead no se encontró después de guardar. Esto puede indicar un problema con localStorage.');
    }
    
    return {
      success: true,
      lead,
      error: null,
    };
  } else {
    console.error('[LeadService] ❌ Error al guardar lead en localStorage');
    return {
      success: false,
      lead: null,
      error: 'Error al guardar el lead. Por favor, intenta nuevamente.',
    };
  }
};

/**
 * Actualiza un lead
 * @param {string} leadId - ID del lead
 * @param {Object} updates - Campos a actualizar
 * @returns {Object} {success: boolean, error: string|null}
 */
export const updateLead = (leadId, updates) => {
  const leads = getAllLeads();
  const index = leads.findIndex(lead => lead.id === leadId);
  
  if (index === -1) {
    return {
      success: false,
      error: 'Lead no encontrado',
    };
  }

  // Bloquear cambio de estado si ya es 'paciente'
  if (leads[index].estado === 'paciente' && updates.estado && updates.estado !== 'paciente') {
    return {
      success: false,
      error: 'No se puede cambiar el estado de un lead que ya es paciente',
    };
  }

  leads[index] = {
    ...leads[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (saveLeads(leads)) {
    return {
      success: true,
      error: null,
    };
  } else {
    return {
      success: false,
      error: 'Error al actualizar el lead',
    };
  }
};

/**
 * Elimina un lead
 * @param {string} leadId - ID del lead
 * @returns {Object} {success: boolean, error: string|null}
 */
export const deleteLead = (leadId) => {
  const leads = getAllLeads();
  const filtered = leads.filter(lead => lead.id !== leadId);

  if (filtered.length === leads.length) {
    return {
      success: false,
      error: 'Lead no encontrado',
    };
  }

  if (saveLeads(filtered)) {
    return {
      success: true,
      error: null,
    };
  } else {
    return {
      success: false,
      error: 'Error al eliminar el lead',
    };
  }
};

/**
 * Obtiene leads desde citas no asistidas
 * @returns {Array} Array de leads generados desde citas
 */
export const getLeadsFromAppointments = () => {
  const appointments = getAllAppointments();
  
  // Filtrar citas que NO han sido completadas (asistidas) y NO son pacientes
  // Incluir: confirmed (agendadas), no-show, cancelled, rescheduled
  // Excluir: completed (asistidas), patient (ya son pacientes)
  const leadsFromAppointments = appointments
    .filter(apt => {
      // Excluir citas que ya fueron completadas o convertidas a pacientes
      const shouldInclude = apt.status !== 'completed' && apt.status !== 'patient';
      if (!shouldInclude) {
        console.log(`[Leads] Excluyendo cita ${apt.id} - Estado: ${apt.status}`);
      }
      return shouldInclude;
    })
    .map(apt => {
      // Normalizar procedencia de la cita usando la función centralizada
      const procedencia = validarYNormalizarProcedencia(apt.procedencia || 'visita-medica');
      
      // Determinar estado del lead basado en el estado de la cita
      let estadoLead = 'agendado';
      if (apt.status === 'no-show') {
        estadoLead = 'nuevo';
      } else if (apt.status === 'confirmed') {
        estadoLead = 'agendado'; // Lead con cita agendada
      } else if (apt.status === 'cancelled') {
        estadoLead = 'nuevo'; // Pueden ser contactados de nuevo
      } else if (apt.status === 'rescheduled') {
        estadoLead = 'agendado'; // Sigue agendado (re-agendado)
      }
      
      return {
        id: `lead_from_apt_${apt.id}`,
        nombre: apt.patientName,
        email: apt.patientEmail,
        telefono: apt.patientPhone,
        procedencia: procedencia, // Usar procedencia (igual que en citas)
        interes: apt.reason || 'Consulta General',
        notas: `Generado desde cita ${apt.date} ${apt.time} - Estado: ${apt.status}`,
        estado: estadoLead,
        fecha: apt.date,
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt || apt.createdAt,
        appointmentId: apt.id, // Referencia a la cita original
      };
    });

  console.log(`[Leads] Generados ${leadsFromAppointments.length} leads desde ${appointments.length} citas`);
  console.log('[Leads] Leads generados:', leadsFromAppointments.map(l => ({ nombre: l.nombre, estado: l.estado, procedencia: l.procedencia })));
  
  return leadsFromAppointments;
};

/**
 * Obtiene todos los leads (manuales + desde citas)
 * @returns {Array} Array combinado de leads
 */
export const getAllLeadsCombined = () => {
  const manualLeads = getAllLeads();
  const leadsFromAppointments = getLeadsFromAppointments();
  
  console.log('[Leads] getAllLeadsCombined - Inicio');
  console.log('[Leads] Leads manuales encontrados:', manualLeads.length);
  console.log('[Leads] Leads desde citas encontrados:', leadsFromAppointments.length);
  console.log('[Leads] Detalles leads manuales:', manualLeads.map(l => ({
    id: l.id,
    nombre: l.nombre,
    email: l.email,
    estado: l.estado,
    appointmentId: l.appointmentId
  })));
  
  // IMPORTANTE: Los leads manuales (sin appointmentId) siempre tienen estado 'nuevo'
  // Los leads desde citas (con appointmentId) pueden tener otros estados
  
  const combined = [];
  const processedEmails = new Set();
  const processedPhones = new Set();

  // Primero agregar leads desde citas (tienen appointmentId y pueden estar agendados)
  leadsFromAppointments.forEach(lead => {
    const { emailKey, phoneKey } = normLead(lead);
    const alreadyExists = (emailKey && processedEmails.has(emailKey)) || (phoneKey && processedPhones.has(phoneKey));

    if (!alreadyExists) {
      const leadFromApt = {
        ...lead,
        appointmentId: lead.appointmentId || lead.id?.replace('lead_from_apt_', '') || null,
      };
      combined.push(leadFromApt);
      if (emailKey) processedEmails.add(emailKey);
      if (phoneKey) processedPhones.add(phoneKey);
      console.log('[Leads] Agregando lead desde cita:', {
        nombre: leadFromApt.nombre,
        email: leadFromApt.email,
        estado: leadFromApt.estado,
        appointmentId: leadFromApt.appointmentId
      });
    }
  });

  // Luego agregar leads manuales
  // Evitar duplicados: no agregar si ya existe un lead (cita o manual) con mismo email o teléfono
  manualLeads.forEach(lead => {
    const { emailKey, phoneKey } = normLead(lead);
    const alreadyExists = (emailKey && processedEmails.has(emailKey)) || (phoneKey && processedPhones.has(phoneKey));

    console.log('[Leads] Procesando lead manual:', {
      nombre: lead.nombre,
      email: lead.email,
      estado: lead.estado,
      appointmentId: lead.appointmentId,
      alreadyExists,
    });

    // Si el lead manual tiene estado 'convertido' y appointmentId, tiene prioridad
    // Reemplazar el lead desde cita si existe
    if (lead.estado === 'convertido' && lead.appointmentId) {
      const existingLeadIndex = combined.findIndex(l => {
        const { emailKey: ek, phoneKey: pk } = normLead(l);
        const match = (emailKey && ek === emailKey) || (phoneKey && pk === phoneKey);
        return match && l.appointmentId && l.id?.startsWith('lead_from_apt_');
      });

      if (existingLeadIndex !== -1) {
        console.log('[Leads] Reemplazando lead desde cita con lead manual convertido');
        combined.splice(existingLeadIndex, 1);
      }

      combined.push({
        ...lead,
        estado: 'convertido',
        appointmentId: lead.appointmentId
      });
      if (emailKey) processedEmails.add(emailKey);
      if (phoneKey) processedPhones.add(phoneKey);
      console.log('[Leads] ✅ Agregando lead manual CONVERTIDO:', { nombre: lead.nombre, estado: lead.estado });
      return;
    }

    // Lead manual normal: omitir si ya existe un lead con mismo email o teléfono (evitar duplicados)
    if (alreadyExists) {
      console.log('[Leads] ⏭️ Omitiendo lead manual duplicado (mismo email/teléfono):', lead.nombre);
      return;
    }
    if (lead.estado === 'convertido' && !lead.appointmentId) {
      console.warn('[Leads] ⚠️ Lead manual con estado "convertido" pero sin appointmentId:', lead.nombre);
    }

    const manualLead = {
      ...lead,
      estado: lead.estado || 'nuevo',
      appointmentId: lead.appointmentId || null,
    };
    combined.push(manualLead);
    if (emailKey) processedEmails.add(emailKey);
    if (phoneKey) processedPhones.add(phoneKey);
    console.log('[Leads] ✅ Agregando lead manual:', { nombre: manualLead.nombre, estado: manualLead.estado, id: manualLead.id });
  });
  
  // Validación final: solo corregir leads manuales sin appointmentId que NO sean convertidos
  // Los leads convertidos pueden tener appointmentId y estado 'convertido'
  combined.forEach(lead => {
    // Solo forzar 'nuevo' si es un lead manual sin appointmentId y no está convertido
    if (!lead.appointmentId && lead.estado !== 'nuevo' && lead.estado !== 'convertido' && lead.estado !== 'contactado' && lead.estado !== 'calificado' && lead.estado !== 'perdido') {
      console.warn('[Leads] CORRIGIENDO: Lead sin appointmentId con estado inválido:', {
        nombre: lead.nombre,
        estadoAnterior: lead.estado,
        estadoNuevo: 'nuevo'
      });
      lead.estado = 'nuevo';
    }
  });
  
  console.log(`[Leads] Total combinado: ${combined.length} (${leadsFromAppointments.length} desde citas + ${manualLeads.length} manuales)`);
  console.log('[Leads] Resumen por estado:', {
    nuevos: combined.filter(l => l.estado === 'nuevo' && !l.appointmentId).length,
    agendados: combined.filter(l => l.estado === 'agendado').length,
    desdeCitas: combined.filter(l => l.appointmentId).length,
    manuales: combined.filter(l => !l.appointmentId).length
  });
  console.log('[Leads] Lista completa de leads combinados:', combined.map(l => ({
    nombre: l.nombre,
    email: l.email,
    estado: l.estado,
    appointmentId: l.appointmentId
  })));
  
  return combined;
};
