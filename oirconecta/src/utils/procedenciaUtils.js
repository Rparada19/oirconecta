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
    'agendamiento-manual': 'Agendamiento Manual',
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
 * Obtiene todas las opciones de procedencia disponibles (para landing)
 * @returns {Array} Array de objetos {value, label}
 */
export const getProcedenciaOptions = () => {
  return [
    { value: 'leads-marketing-digital', label: 'Leads Marketing Digital' },
    { value: 'leads-marketing-offline', label: 'Leads Marketing Offline' },
    { value: 'visita-medica', label: 'Visita Médica' },
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
    { value: 'agendamiento-manual', label: 'Agendamiento Manual' },
  ];
};

/**
 * Obtiene las opciones de tipo de agendamiento manual
 * @returns {Array} Array de objetos {value, label}
 */
export const getAgendamientoManualOptions = () => {
  return [
    { value: 'telefono', label: 'Teléfono' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'referido', label: 'Referido' },
  ];
};
