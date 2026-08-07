// Utilidades para formatear procedencias de manera consistente en todo el sistema

/**
 * Formatea una procedencia para mostrarla al usuario
 * @param {string} procedencia - Valor de procedencia (ej: 'leads-marketing-digital')
 * @returns {string} Procedencia formateada para mostrar
 */
export const formatProcedencia = (procedencia, agendamientoManualTipo = null) => {
  if (!procedencia) return 'Visita Médica';
  
  const procedenciasMap = {
    'leads-marketing-digital': 'Leads Marketing Digital',
    'leads-marketing-offline': 'Leads Marketing Offline',
    'visita-medica': 'Visita Médica',
    'renovacion': 'Renovación',
    'recomendacion': 'Recomendación',
    'sitio-web': 'Sitio Web',
    // Legado: "agendamiento manual" era canal, no procedencia. Se reclasificó.
    'agendamiento-manual': 'Recomendación',
    // Valores antiguos/compatibilidad
    'Marketing Digital': 'Leads Marketing Digital',
    'Marketing Offline': 'Leads Marketing Offline',
    'Visita Médica': 'Visita Médica',
    'Renovación': 'Renovación',
    'Recomendación': 'Recomendación',
    'Sitio Web': 'Sitio Web',
    'página web': 'Sitio Web',
    'pagina-web': 'Sitio Web',
  };
  
  let formatted = procedenciasMap[procedencia] || procedencia;
  
  // Si es agendamiento manual y tiene tipo, agregarlo
  if (procedencia === 'agendamiento-manual' && agendamientoManualTipo) {
    const tipoMap = {
      'telefono': 'Teléfono',
      'whatsapp': 'WhatsApp',
      'referido': 'Referido',
    };
    formatted += ` (${tipoMap[agendamientoManualTipo] || agendamientoManualTipo})`;
  }
  
  return formatted;
};

/**
 * Obtiene todas las opciones de procedencia disponibles (para landing / agendamiento público).
 * Nota: "Referido médico" en UI usa value `visita-medica`; en métricas y formatProcedencia sigue contándose como "Visita Médica".
 * @returns {Array} Array de objetos {value, label}
 */
export const getProcedenciaOptions = () => {
  return [
    { value: 'leads-marketing-digital', label: 'Leads Marketing Digital' },
    { value: 'leads-marketing-offline', label: 'Leads Marketing Offline' },
    { value: 'visita-medica', label: 'Referido médico' },
    { value: 'renovacion', label: 'Renovación' },
    { value: 'recomendacion', label: 'Recomendación' },
    { value: 'sitio-web', label: 'Sitio Web' },
  ];
};

/**
 * Obtiene todas las opciones de procedencia disponibles para el CRM (incluye Agendamiento Manual)
 * @returns {Array} Array de objetos {value, label}
 */
export const getProcedenciaOptionsCRM = () => {
  return [
    { value: 'leads-marketing-digital', label: 'Leads Marketing Digital' },
    { value: 'leads-marketing-offline', label: 'Leads Marketing Offline' },
    { value: 'visita-medica', label: 'Visita Médica' },
    { value: 'renovacion', label: 'Renovación' },
    { value: 'recomendacion', label: 'Recomendación' },
    { value: 'sitio-web', label: 'Sitio Web' },
  ];
};

/** Color por procedencia, para gráficos y embudos. */
export const PROCEDENCIA_COLORS = {
  'leads-marketing-digital': '#085946',
  'leads-marketing-offline': '#0a6b56',
  'visita-medica': '#272F50',
  'renovacion': '#b45309',
  'recomendacion': '#7c3aed',
  'sitio-web': '#1976d2',
};

/**
 * Canal por el que se REGISTRÓ la cita. NO es procedencia: un paciente que
 * llamó y fue registrado por servicio al cliente tiene su procedencia real
 * (recomendación, visita médica, etc.) y canal de registro "teléfono".
 */
export const getCanalRegistroOptions = () => {
  return [
    { value: 'manual-telefono', label: 'Teléfono' },
    { value: 'manual-whatsapp', label: 'WhatsApp' },
    { value: 'manual-presencial', label: 'Presencial' },
    { value: 'web', label: 'Agendamiento web' },
    { value: 'directorio', label: 'Ficha directorio' },
    { value: 'bot-whatsapp', label: 'Bot WhatsApp' },
  ];
};

export const formatCanalRegistro = (canal) => {
  const opt = getCanalRegistroOptions().find((o) => o.value === canal);
  return opt ? opt.label : 'Teléfono';
};
