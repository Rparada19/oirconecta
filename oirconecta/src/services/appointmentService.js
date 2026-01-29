// Servicio de gestión de citas para OirConecta
// Maneja la creación, lectura, actualización y eliminación de citas
// Previene sobreagendamiento bloqueando horarios ya ocupados

import { validarYNormalizarProcedencia } from '../utils/procedenciaNormalizer';

const APPOINTMENTS_KEY = 'oirconecta_appointments';
const BLOCKED_SLOTS_KEY = 'oirconecta_blocked_slots'; // Horarios bloqueados por el administrador
const DEFAULT_DURATION_MINUTES = 50; // Duración de una cita en minutos
const BREAK_MINUTES = 10; // Minutos de descanso entre citas
const APPOINTMENT_INTERVAL = DEFAULT_DURATION_MINUTES + BREAK_MINUTES; // 60 minutos totales (50 cita + 10 descanso)

/**
 * Obtiene todas las citas almacenadas
 * @returns {Array} Array de citas
 */
export const getAllAppointments = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const data = localStorage.getItem(APPOINTMENTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return [];
  }
};

/**
 * Guarda todas las citas en localStorage
 * @param {Array} appointments - Array de citas a guardar
 * @returns {boolean} true si se guardó correctamente
 */
const saveAppointments = (appointments) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
    return true;
  } catch (error) {
    console.error('Error al guardar citas:', error);
    return false;
  }
};

/**
 * Obtiene los horarios bloqueados
 * @returns {Array} Array de objetos con {date, time, durationMinutes} o {date} para días completos
 */
export const getBlockedSlots = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const data = localStorage.getItem(BLOCKED_SLOTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error al obtener horarios bloqueados:', error);
    return [];
  }
};

/**
 * Guarda los horarios bloqueados
 * @param {Array} blockedSlots - Array de horarios bloqueados
 * @returns {boolean} true si se guardó correctamente
 */
const saveBlockedSlots = (blockedSlots) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(BLOCKED_SLOTS_KEY, JSON.stringify(blockedSlots));
    return true;
  } catch (error) {
    console.error('Error al guardar horarios bloqueados:', error);
    return false;
  }
};

/**
 * Bloquea un horario específico o un día completo
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {string} time - Hora en formato HH:MM (opcional, si no se proporciona bloquea el día completo)
 * @param {number} durationMinutes - Duración del bloqueo en minutos (opcional)
 * @returns {Object} {success: boolean, error: string|null}
 */
export const blockTimeSlot = (date, time = null, durationMinutes = DEFAULT_DURATION_MINUTES) => {
  const blockedSlots = getBlockedSlots();
  
  // Verificar si ya está bloqueado
  const existingBlock = blockedSlots.find(block => {
    if (block.date === date) {
      if (!time && !block.time) {
        return true; // Día completo ya bloqueado
      }
      if (time && block.time === time) {
        return true; // Horario específico ya bloqueado
      }
    }
    return false;
  });

  if (existingBlock) {
    return {
      success: false,
      error: 'Este horario ya está bloqueado',
    };
  }

  const newBlock = {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date,
    time: time || null, // null significa día completo bloqueado
    durationMinutes: time ? durationMinutes : null,
    blockedAt: new Date().toISOString(),
  };

  blockedSlots.push(newBlock);

  if (saveBlockedSlots(blockedSlots)) {
    return {
      success: true,
      error: null,
    };
  } else {
    return {
      success: false,
      error: 'Error al bloquear el horario',
    };
  }
};

/**
 * Desbloquea un horario o día
 * @param {string} blockId - ID del bloqueo
 * @returns {Object} {success: boolean, error: string|null}
 */
export const unblockTimeSlot = (blockId) => {
  const blockedSlots = getBlockedSlots();
  const filtered = blockedSlots.filter(block => block.id !== blockId);

  if (filtered.length === blockedSlots.length) {
    return {
      success: false,
      error: 'Bloqueo no encontrado',
    };
  }

  if (saveBlockedSlots(filtered)) {
    return {
      success: true,
      error: null,
    };
  } else {
    return {
      success: false,
      error: 'Error al desbloquear el horario',
    };
  }
};

/**
 * Verifica si un horario está disponible (incluyendo bloqueos)
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {string} time - Hora en formato HH:MM
 * @param {number} durationMinutes - Duración de la cita en minutos (opcional)
 * @returns {boolean} true si el horario está disponible
 */
export const isTimeSlotAvailable = (date, time, durationMinutes = DEFAULT_DURATION_MINUTES) => {
  // Verificar bloqueos primero
  const blockedSlots = getBlockedSlots();
  const timeToMinutes = (t) => {
    const [hours, mins] = t.split(':').map(Number);
    return hours * 60 + mins;
  };

  for (const block of blockedSlots) {
    if (block.date === date) {
      // Si no tiene time, el día completo está bloqueado
      if (!block.time) {
        return false;
      }

      // Verificar si el horario solicitado se solapa con el bloqueo
      const requestedStart = timeToMinutes(time);
      const requestedEnd = requestedStart + durationMinutes;
      const blockStart = timeToMinutes(block.time);
      const blockEnd = blockStart + (block.durationMinutes || DEFAULT_DURATION_MINUTES);

      if (
        (requestedStart >= blockStart && requestedStart < blockEnd) ||
        (requestedEnd > blockStart && requestedEnd <= blockEnd) ||
        (requestedStart <= blockStart && requestedEnd >= blockEnd)
      ) {
        return false; // Hay conflicto con bloqueo
      }
    }
  }

  // Verificar citas existentes
  const appointments = getAllAppointments();
  const requestedDateTime = new Date(`${date}T${time}`);
  const requestedEndTime = new Date(requestedDateTime.getTime() + durationMinutes * 60000);

  // Filtrar citas del mismo día
  const sameDayAppointments = appointments.filter(apt => apt.date === date && apt.status !== 'cancelled');

  // Verificar si hay conflicto con alguna cita existente
  for (const appointment of sameDayAppointments) {
    const existingDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const existingEndTime = new Date(
      existingDateTime.getTime() + (appointment.durationMinutes || DEFAULT_DURATION_MINUTES) * 60000
    );

    // Verificar solapamiento
    if (
      (requestedDateTime >= existingDateTime && requestedDateTime < existingEndTime) ||
      (requestedEndTime > existingDateTime && requestedEndTime <= existingEndTime) ||
      (requestedDateTime <= existingDateTime && requestedEndTime >= existingEndTime)
    ) {
      return false; // Hay conflicto
    }
  }

  return true; // No hay conflicto, el horario está disponible
};

/**
 * Obtiene los horarios ocupados para una fecha específica
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Array} Array de objetos con {time, durationMinutes}
 */
export const getOccupiedTimeSlots = (date) => {
  const appointments = getAllAppointments();
  return appointments
    .filter(apt => apt.date === date)
    .map(apt => ({
      time: apt.time,
      durationMinutes: apt.durationMinutes || DEFAULT_DURATION_MINUTES,
    }));
};

/**
 * Crea una nueva cita
 * @param {Object} appointmentData - Datos de la cita
 * @param {string} appointmentData.date - Fecha en formato YYYY-MM-DD
 * @param {string} appointmentData.time - Hora en formato HH:MM
 * @param {string} appointmentData.patientName - Nombre del paciente
 * @param {string} appointmentData.patientEmail - Email del paciente
 * @param {string} appointmentData.patientPhone - Teléfono del paciente
 * @param {string} appointmentData.reason - Motivo de la cita
 * @param {number} appointmentData.durationMinutes - Duración en minutos (opcional)
 * @returns {Object} {success: boolean, appointment: Object|null, error: string|null}
 */
export const createAppointment = (appointmentData) => {
  const {
    date,
    time,
    patientName,
    patientEmail,
    patientPhone,
    reason,
    durationMinutes = DEFAULT_DURATION_MINUTES,
    appointmentType,
  } = appointmentData;

  // Validaciones básicas
  if (!date || !time || !patientName || !patientEmail || !patientPhone) {
    return {
      success: false,
      appointment: null,
      error: 'Todos los campos son obligatorios',
    };
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(patientEmail)) {
    return {
      success: false,
      appointment: null,
      error: 'El email no es válido',
    };
  }

  // Verificar disponibilidad
  if (!isTimeSlotAvailable(date, time, durationMinutes)) {
    return {
      success: false,
      appointment: null,
      error: 'El horario seleccionado no está disponible. Por favor, elige otro horario.',
    };
  }

  // Crear la cita
  const appointment = {
    id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date,
    time,
    patientName,
    patientEmail,
    patientPhone,
    reason: reason || '',
    appointmentType: appointmentType || null, // primera-vez, adaptacion, prueba-audifonos, entrega-mantenimiento, revision, examenes, control
    procedencia: validarYNormalizarProcedencia(appointmentData.procedencia || 'visita-medica'),
    durationMinutes,
    createdAt: new Date().toISOString(),
    status: 'confirmed', // confirmed, cancelled, completed, no-show
  };

  // Guardar la cita
  const appointments = getAllAppointments();
  appointments.push(appointment);
  
  if (saveAppointments(appointments)) {
    return {
      success: true,
      appointment,
      error: null,
    };
  } else {
    return {
      success: false,
      appointment: null,
      error: 'Error al guardar la cita. Por favor, intenta nuevamente.',
    };
  }
};

/**
 * Obtiene una cita por su ID
 * @param {string} appointmentId - ID de la cita
 * @returns {Object|null} La cita encontrada o null
 */
export const getAppointmentById = (appointmentId) => {
  const appointments = getAllAppointments();
  return appointments.find(apt => apt.id === appointmentId) || null;
};

/**
 * Cancela una cita
 * @param {string} appointmentId - ID de la cita
 * @returns {Object} {success: boolean, error: string|null}
 */
export const cancelAppointment = (appointmentId) => {
  const appointments = getAllAppointments();
  const index = appointments.findIndex(apt => apt.id === appointmentId);
  
  if (index === -1) {
    return {
      success: false,
      error: 'Cita no encontrada',
    };
  }

  appointments[index].status = 'cancelled';
  appointments[index].cancelledAt = new Date().toISOString();

  if (saveAppointments(appointments)) {
    return {
      success: true,
      error: null,
    };
  } else {
    return {
      success: false,
      error: 'Error al cancelar la cita',
    };
  }
};

/**
 * Actualiza el estado de una cita
 * @param {string} appointmentId - ID de la cita
 * @param {string} newStatus - Nuevo estado: 'confirmed', 'completed', 'no-show', 'cancelled', 'rescheduled', 'patient'
 * @returns {Object} {success: boolean, error: string|null}
 */
export const updateAppointmentStatus = (appointmentId, newStatus) => {
  const validStatuses = ['confirmed', 'completed', 'no-show', 'cancelled', 'rescheduled', 'patient'];
  
  if (!validStatuses.includes(newStatus)) {
    return {
      success: false,
      error: 'Estado no válido',
    };
  }

  const appointments = getAllAppointments();
  const index = appointments.findIndex(apt => apt.id === appointmentId);
  
  if (index === -1) {
    return {
      success: false,
      error: 'Cita no encontrada',
    };
  }

  appointments[index].status = newStatus;
  
  // Agregar timestamp según el estado
  if (newStatus === 'completed') {
    appointments[index].completedAt = new Date().toISOString();
  } else if (newStatus === 'no-show') {
    appointments[index].noShowAt = new Date().toISOString();
  } else if (newStatus === 'cancelled') {
    appointments[index].cancelledAt = new Date().toISOString();
  } else if (newStatus === 'rescheduled') {
    appointments[index].rescheduledAt = new Date().toISOString();
  } else if (newStatus === 'patient') {
    appointments[index].patientAt = new Date().toISOString();
  }

  if (saveAppointments(appointments)) {
    return {
      success: true,
      error: null,
    };
  } else {
    return {
      success: false,
      error: 'Error al actualizar el estado de la cita',
    };
  }
};

/**
 * Elimina una cita permanentemente
 * @param {string} appointmentId - ID de la cita
 * @returns {Object} {success: boolean, error: string|null}
 */
export const deleteAppointment = (appointmentId) => {
  const appointments = getAllAppointments();
  const filtered = appointments.filter(apt => apt.id !== appointmentId);
  
  if (filtered.length === appointments.length) {
    return {
      success: false,
      error: 'Cita no encontrada',
    };
  }

  if (saveAppointments(filtered)) {
    return {
      success: true,
      error: null,
    };
  } else {
    return {
      success: false,
      error: 'Error al eliminar la cita',
    };
  }
};

/**
 * Re-agenda una cita creando una nueva cita y marcando la anterior como re-agendada
 * @param {string} appointmentId - ID de la cita original
 * @param {string} newDate - Nueva fecha en formato YYYY-MM-DD
 * @param {string} newTime - Nueva hora en formato HH:MM
 * @returns {Object} {success: boolean, newAppointment: Object|null, error: string|null}
 */
export const rescheduleAppointment = (appointmentId, newDate, newTime) => {
  const appointments = getAllAppointments();
  const originalAppointment = appointments.find(apt => apt.id === appointmentId);
  
  if (!originalAppointment) {
    return {
      success: false,
      newAppointment: null,
      error: 'Cita no encontrada',
    };
  }

  // Verificar disponibilidad del nuevo horario
  if (!isTimeSlotAvailable(newDate, newTime, originalAppointment.durationMinutes || DEFAULT_DURATION_MINUTES)) {
    return {
      success: false,
      newAppointment: null,
      error: 'El nuevo horario no está disponible. Por favor, elige otro horario.',
    };
  }

  // Crear nueva cita con los mismos datos del paciente
  const newAppointment = {
    id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date: newDate,
    time: newTime,
    patientName: originalAppointment.patientName,
    patientEmail: originalAppointment.patientEmail,
    patientPhone: originalAppointment.patientPhone,
    reason: originalAppointment.reason || '',
    procedencia: originalAppointment.procedencia || 'visita-medica',
    durationMinutes: originalAppointment.durationMinutes || DEFAULT_DURATION_MINUTES,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    originalAppointmentId: appointmentId, // Referencia a la cita original
  };

  // Marcar la cita original como re-agendada
  const originalIndex = appointments.findIndex(apt => apt.id === appointmentId);
  appointments[originalIndex].status = 'rescheduled';
  appointments[originalIndex].rescheduledAt = new Date().toISOString();
  appointments[originalIndex].rescheduledToId = newAppointment.id; // Referencia a la nueva cita

  // Agregar la nueva cita
  appointments.push(newAppointment);

  if (saveAppointments(appointments)) {
    return {
      success: true,
      newAppointment,
      error: null,
    };
  } else {
    return {
      success: false,
      newAppointment: null,
      error: 'Error al re-agendar la cita',
    };
  }
};

/**
 * Obtiene las citas de una fecha específica
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Array} Array de citas del día
 */
export const getAppointmentsByDate = (date) => {
  const appointments = getAllAppointments();
  return appointments.filter(apt => apt.date === date && apt.status !== 'cancelled');
};

/**
 * Genera horarios disponibles para un día
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {string} startTime - Hora de inicio en formato HH:MM (default: '07:00')
 * @param {string} endTime - Hora de fin en formato HH:MM (default: '18:00')
 * @returns {Array} Array de horarios disponibles en formato HH:MM
 */
export const getAvailableTimeSlots = (
  date,
  startTime = '07:00',
  endTime = '18:00'
) => {
  const occupiedSlots = getOccupiedTimeSlots(date);
  const availableSlots = [];

  // Convertir horas a minutos desde medianoche
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);
  
  // Determinar el día de la semana y ajustar el horario de fin
  try {
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 1 = Lunes, ..., 5 = Viernes, 6 = Sábado
    
    // Lunes a Jueves (1-4): último slot disponible a las 4:00 PM (16:00)
    // Viernes (5): último slot disponible a las 3:00 PM (15:00)
    if (dayOfWeek >= 1 && dayOfWeek <= 4) {
      // Lunes a Jueves: último slot a las 4:00 PM (16:00 = 960 minutos)
      // Para que el último slot sea 4:00 PM, necesitamos endMinutes >= 960 + 50 = 1010
      // Así que endMinutes debe ser al menos 1020 (17:00) para incluir el slot de 4:00 PM
      endMinutes = timeToMinutes('17:00'); // 5:00 PM - permite slots hasta 4:00 PM
    } else if (dayOfWeek === 5) {
      // Viernes: último slot a las 3:00 PM (15:00 = 900 minutos)
      // Para que el último slot sea 3:00 PM, necesitamos endMinutes >= 900 + 50 = 950
      // Así que endMinutes debe ser al menos 960 (16:00) para incluir el slot de 3:00 PM
      endMinutes = timeToMinutes('16:00'); // 4:00 PM - permite slots hasta 3:00 PM
    }
  } catch (e) {
    console.warn('Error al determinar día de la semana:', e);
  }

  // Obtener horarios bloqueados
  const blockedSlots = getBlockedSlots();
  const blockedRanges = [];
  const blockedDays = new Set();

  blockedSlots.forEach(block => {
    if (block.date === date) {
      if (!block.time) {
        // Día completo bloqueado
        blockedDays.add(date);
      } else {
        const blockStart = timeToMinutes(block.time);
        blockedRanges.push({
          start: blockStart,
          end: blockStart + (block.durationMinutes || DEFAULT_DURATION_MINUTES) + BREAK_MINUTES,
        });
      }
    }
  });

  // Si el día completo está bloqueado, no hay slots disponibles
  if (blockedDays.has(date)) {
    return [];
  }

  // Crear array de horarios ocupados con sus rangos (incluyendo el descanso)
  const occupiedRanges = occupiedSlots.map(slot => {
    const slotStart = timeToMinutes(slot.time);
    return {
      start: slotStart,
      end: slotStart + slot.durationMinutes + BREAK_MINUTES, // Incluye cita + descanso
    };
  });

  // Combinar rangos ocupados y bloqueados
  const allBlockedRanges = [...occupiedRanges, ...blockedRanges];

  // Horario de almuerzo bloqueado (12:00 PM a 1:00 PM)
  const lunchStartMinutes = timeToMinutes('12:00'); // 720 minutos (12:00 PM)
  const lunchEndMinutes = timeToMinutes('13:00');   // 780 minutos (1:00 PM)

  // Generar todos los posibles horarios con intervalo de 60 minutos (50 cita + 10 descanso)
  for (let minutes = startMinutes; minutes + DEFAULT_DURATION_MINUTES <= endMinutes; minutes += APPOINTMENT_INTERVAL) {
    const slotTime = minutesToTime(minutes);
    const slotEnd = minutes + DEFAULT_DURATION_MINUTES; // Solo la duración de la cita

    // Verificar si el horario está en el rango de almuerzo (12:00 PM - 1:00 PM)
    const isLunchTime = (minutes >= lunchStartMinutes && minutes < lunchEndMinutes) ||
                        (slotEnd > lunchStartMinutes && slotEnd <= lunchEndMinutes) ||
                        (minutes <= lunchStartMinutes && slotEnd >= lunchEndMinutes);

    if (isLunchTime) {
      continue; // Saltar este horario, es hora de almuerzo
    }

    // Verificar si este horario se solapa con alguno ocupado o bloqueado
    const isOccupied = allBlockedRanges.some(range => {
      return (
        (minutes >= range.start && minutes < range.end) ||
        (slotEnd > range.start && slotEnd <= range.end) ||
        (minutes <= range.start && slotEnd >= range.end)
      );
    });

    if (!isOccupied) {
      availableSlots.push(slotTime);
    }
  }

  return availableSlots;
};

/**
 * Limpia todas las citas (útil para desarrollo/testing)
 * @returns {boolean} true si se limpiaron correctamente
 */
export const clearAllAppointments = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.removeItem(APPOINTMENTS_KEY);
    return true;
  } catch (error) {
    console.error('Error al limpiar citas:', error);
    return false;
  }
};
