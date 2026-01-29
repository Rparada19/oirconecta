// Servicio para gestionar mantenimientos de audífonos

const MAINTENANCES_KEY = 'oirconecta_patient_maintenances';

/**
 * Obtiene todos los mantenimientos
 * @returns {Object} Objeto con email como clave y array de mantenimientos como valor
 */
export const getAllMaintenances = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {};
  }

  try {
    const data = localStorage.getItem(MAINTENANCES_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error al obtener mantenimientos:', error);
    return {};
  }
};

/**
 * Guarda todos los mantenimientos
 * @param {Object} maintenances - Objeto con mantenimientos
 * @returns {boolean} true si se guardó correctamente
 */
const saveMaintenances = (maintenances) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(MAINTENANCES_KEY, JSON.stringify(maintenances));
    // Disparar evento personalizado para actualización en tiempo real
    window.dispatchEvent(new CustomEvent('maintenancesUpdated'));
    return true;
  } catch (error) {
    console.error('Error al guardar mantenimientos:', error);
    return false;
  }
};

/**
 * Obtiene los mantenimientos de un paciente específico
 * @param {string} patientEmail - Email del paciente
 * @returns {Array} Array de mantenimientos del paciente
 */
export const getPatientMaintenances = (patientEmail) => {
  const allMaintenances = getAllMaintenances();
  return allMaintenances[patientEmail] || [];
};

/**
 * Agrega un mantenimiento a un paciente
 * @param {string} patientEmail - Email del paciente
 * @param {Object} maintenanceData - Datos del mantenimiento
 * @returns {Object} {success: boolean, maintenance: Object|null, error: string|null}
 */
export const addMaintenance = (patientEmail, maintenanceData) => {
  const {
    type, // 'cleaning', 'repair', 'adjustment', 'battery-replacement', 'check-up', 'other'
    productId, // ID del producto relacionado
    scheduledDate,
    scheduledTime,
    completedDate,
    completedTime,
    status, // 'scheduled', 'completed', 'cancelled', 'rescheduled'
    description,
    workPerformed,
    cost,
    notes,
    nextMaintenanceDate,
    relatedAppointmentId,
    metadata, // Objeto con datos adicionales
  } = maintenanceData;

  if (!patientEmail || !type || !scheduledDate) {
    return {
      success: false,
      maintenance: null,
      error: 'Email, tipo y fecha programada son obligatorios',
    };
  }

  const maintenance = {
    id: `maintenance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    patientEmail,
    type,
    productId: productId || null,
    scheduledDate,
    scheduledTime: scheduledTime || null,
    completedDate: completedDate || null,
    completedTime: completedTime || null,
    status: status || 'scheduled',
    description: description || '',
    workPerformed: workPerformed || '',
    cost: cost || 0,
    notes: notes || '',
    nextMaintenanceDate: nextMaintenanceDate || null,
    relatedAppointmentId: relatedAppointmentId || null,
    metadata: metadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const allMaintenances = getAllMaintenances();
  if (!allMaintenances[patientEmail]) {
    allMaintenances[patientEmail] = [];
  }
  allMaintenances[patientEmail].push(maintenance);
  
  // Ordenar por fecha programada (más próximos primero)
  allMaintenances[patientEmail].sort((a, b) => {
    const dateA = new Date(a.scheduledDate + (a.scheduledTime ? 'T' + a.scheduledTime : ''));
    const dateB = new Date(b.scheduledDate + (b.scheduledTime ? 'T' + b.scheduledTime : ''));
    return dateA - dateB;
  });

  if (saveMaintenances(allMaintenances)) {
    return {
      success: true,
      maintenance,
      error: null,
    };
  } else {
    return {
      success: false,
      maintenance: null,
      error: 'Error al guardar el mantenimiento',
    };
  }
};

/**
 * Actualiza un mantenimiento
 * @param {string} patientEmail - Email del paciente
 * @param {string} maintenanceId - ID del mantenimiento
 * @param {Object} updates - Campos a actualizar
 * @returns {Object} {success: boolean, maintenance: Object|null, error: string|null}
 */
export const updateMaintenance = (patientEmail, maintenanceId, updates) => {
  const allMaintenances = getAllMaintenances();
  if (!allMaintenances[patientEmail]) {
    return {
      success: false,
      maintenance: null,
      error: 'Paciente no encontrado',
    };
  }

  const maintenanceIndex = allMaintenances[patientEmail].findIndex(m => m.id === maintenanceId);
  if (maintenanceIndex === -1) {
    return {
      success: false,
      maintenance: null,
      error: 'Mantenimiento no encontrado',
    };
  }

  allMaintenances[patientEmail][maintenanceIndex] = {
    ...allMaintenances[patientEmail][maintenanceIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Reordenar si cambió la fecha
  if (updates.scheduledDate || updates.scheduledTime) {
    allMaintenances[patientEmail].sort((a, b) => {
      const dateA = new Date(a.scheduledDate + (a.scheduledTime ? 'T' + a.scheduledTime : ''));
      const dateB = new Date(b.scheduledDate + (b.scheduledTime ? 'T' + b.scheduledTime : ''));
      return dateA - dateB;
    });
  }

  if (saveMaintenances(allMaintenances)) {
    return {
      success: true,
      maintenance: allMaintenances[patientEmail].find(m => m.id === maintenanceId),
      error: null,
    };
  } else {
    return {
      success: false,
      maintenance: null,
      error: 'Error al actualizar el mantenimiento',
    };
  }
};

/**
 * Elimina un mantenimiento
 * @param {string} patientEmail - Email del paciente
 * @param {string} maintenanceId - ID del mantenimiento
 * @returns {Object} {success: boolean, error: string|null}
 */
export const deleteMaintenance = (patientEmail, maintenanceId) => {
  const allMaintenances = getAllMaintenances();
  if (!allMaintenances[patientEmail]) {
    return {
      success: false,
      error: 'Paciente no encontrado',
    };
  }

  allMaintenances[patientEmail] = allMaintenances[patientEmail].filter(m => m.id !== maintenanceId);

  if (saveMaintenances(allMaintenances)) {
    return {
      success: true,
      error: null,
    };
  } else {
    return {
      success: false,
      error: 'Error al eliminar el mantenimiento',
    };
  }
};

/**
 * Obtiene los próximos mantenimientos programados
 * @param {string} patientEmail - Email del paciente (opcional, si no se proporciona retorna todos)
 * @param {number} daysAhead - Días hacia adelante para buscar (default: 30)
 * @returns {Array} Array de mantenimientos programados
 */
export const getUpcomingMaintenances = (patientEmail = null, daysAhead = 30) => {
  const allMaintenances = patientEmail 
    ? { [patientEmail]: getPatientMaintenances(patientEmail) }
    : getAllMaintenances();
  
  const upcoming = [];
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  Object.values(allMaintenances).forEach(maintenances => {
    maintenances.forEach(maintenance => {
      if (maintenance.status === 'scheduled' || maintenance.status === 'rescheduled') {
        const scheduledDate = new Date(maintenance.scheduledDate);
        if (scheduledDate >= today && scheduledDate <= futureDate) {
          upcoming.push(maintenance);
        }
      }
    });
  });

  return upcoming.sort((a, b) => {
    const dateA = new Date(a.scheduledDate + (a.scheduledTime ? 'T' + a.scheduledTime : ''));
    const dateB = new Date(b.scheduledDate + (b.scheduledTime ? 'T' + b.scheduledTime : ''));
    return dateA - dateB;
  });
};
