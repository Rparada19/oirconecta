/**
 * Texto secundario en agenda: primera cita → procedencia; siguientes → tipo de cita.
 */
import { formatProcedencia } from './procedenciaUtils';

const TIPO_CITA_LABELS = {
  'primera-vez': 'Primera vez',
  adaptacion: 'Adaptación',
  'prueba-audifonos': 'Prueba de audífonos',
  'entrega-mantenimiento': 'Entrega / mantenimiento',
  revision: 'Revisión',
  examenes: 'Exámenes',
  control: 'Control',
};

/**
 * @param {object} appointment - cita del CRM (tipoConsulta / appointmentType, reason, procedencia…)
 * @returns {boolean}
 */
export function isPrimeraVezCita(appointment) {
  const tipo = appointment?.tipoConsulta || appointment?.appointmentType;
  if (tipo === 'primera-vez') return true;
  const r = (appointment?.reason || appointment?.motivo || '').toLowerCase();
  return r.includes('primera vez') || r.includes('primera-vez') || r === 'primera vez';
}

/**
 * Línea de agenda: procedencia si es primera vez; si no, etiqueta del tipo de cita.
 * @param {object} appointment
 * @returns {string}
 */
export function getAgendaProcedenciaOTipoCita(appointment) {
  if (!appointment) return '';
  if (isPrimeraVezCita(appointment)) {
    return formatProcedencia(appointment.procedencia, appointment.agendamientoManualTipo);
  }
  const tipo = appointment?.tipoConsulta || appointment?.appointmentType;
  if (tipo && TIPO_CITA_LABELS[tipo]) return TIPO_CITA_LABELS[tipo];
  const reason = (appointment.reason || appointment.motivo || '').trim();
  return reason || '—';
}

/**
 * Etiqueta del tipo de cita agendado (no procedencia). Para mostrar al marcar asistencia / evolucionar.
 * @param {object} appointment
 * @returns {string}
 */
export function getTipoCitaLabelSolo(appointment) {
  if (!appointment) return '—';
  const tipo = appointment.tipoConsulta || appointment.appointmentType;
  if (tipo && TIPO_CITA_LABELS[tipo]) return TIPO_CITA_LABELS[tipo];
  const reason = (appointment.reason || appointment.motivo || '').trim();
  return reason || '—';
}
