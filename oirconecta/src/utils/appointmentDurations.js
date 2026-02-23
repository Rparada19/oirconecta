/**
 * Duraciones por tipo de cita (minutos).
 * Usado para mostrar la duración correcta cuando no está guardada en la cita.
 */
export const DURATION_BY_TIPO = {
  'primera-vez': 60,
  adaptacion: 60,
  'prueba-audifonos': 30,
  'entrega-mantenimiento': 20,
  revision: 20,
  examenes: 60,
  control: 30,
};

export const DEFAULT_DURATION = 50;

/**
 * Obtiene la duración en minutos para una cita.
 * Prioridad: durationMinutes guardado > tipoConsulta > motivo/reason > default
 */
export function getAppointmentDuration(appointment) {
  if (appointment?.durationMinutes != null) {
    return appointment.durationMinutes;
  }
  const tipo = appointment?.tipoConsulta || appointment?.appointmentType;
  if (tipo && DURATION_BY_TIPO[tipo] != null) {
    return DURATION_BY_TIPO[tipo];
  }
  const motivo = (appointment?.reason || appointment?.motivo || '').toLowerCase();
  if (motivo.includes('entrega') || motivo.includes('mantenimiento')) return 20;
  if (motivo.includes('revisión') || motivo.includes('revision')) return 20;
  if (motivo.includes('control')) return 30;
  if (motivo.includes('primera') || motivo.includes('adaptación') || motivo.includes('adaptacion')) return 60;
  if (motivo.includes('examen')) return 60;
  if (motivo.includes('prueba')) return 30;
  return DEFAULT_DURATION;
}
