/**
 * Utilidad centralizada para normalizar procedencias
 * Asegura que todas las procedencias se conviertan a valores estandarizados
 * independientemente de cómo se ingresen en los formularios
 */

/**
 * Normaliza una procedencia a su valor estandarizado
 * @param {string} procedencia - Procedencia a normalizar
 * @returns {string} Procedencia normalizada
 */
export const normalizarProcedencia = (procedencia) => {
  if (!procedencia) return 'visita-medica';
  
  let normalizada = procedencia.toLowerCase().trim();
  
  // Mapeo completo de variaciones a valores estandarizados
  const mapeoProcedencias = {
    // Recomendación
    'recomendación': 'recomendacion',
    'recomendacion': 'recomendacion',
    // Sitio Web
    'sitio web': 'sitio-web',
    'página web': 'sitio-web',
    'pagina-web': 'sitio-web',
    'sitio-web': 'sitio-web',
    // Agendamiento Manual
    'agendamiento manual': 'agendamiento-manual',
    'agendamiento-manual': 'agendamiento-manual',
    // Leads Marketing Digital
    'leads marketing digital': 'leads-marketing-digital',
    'marketing digital': 'leads-marketing-digital',
    'leads-marketing-digital': 'leads-marketing-digital',
    // Leads Marketing Offline
    'leads marketing offline': 'leads-marketing-offline',
    'marketing offline': 'leads-marketing-offline',
    'leads-marketing-offline': 'leads-marketing-offline',
    // Visita Médica
    'visita médica': 'visita-medica',
    'visita medica': 'visita-medica',
    'visita-medica': 'visita-medica',
    // Renovación
    'renovación': 'renovacion',
    'renovacion': 'renovacion',
  };
  
  return mapeoProcedencias[normalizada] || normalizada;
};

/**
 * Valida y normaliza una procedencia antes de guardarla
 * @param {string} procedencia - Procedencia a validar
 * @returns {string} Procedencia normalizada y validada
 */
export const validarYNormalizarProcedencia = (procedencia) => {
  const normalizada = normalizarProcedencia(procedencia);
  
  // Valores válidos estandarizados
  const procedenciasValidas = [
    'leads-marketing-digital',
    'leads-marketing-offline',
    'visita-medica',
    'renovacion',
    'recomendacion',
    'sitio-web',
    'agendamiento-manual'
  ];
  
  // Si no está en la lista de válidos, retornar 'visita-medica' como default
  if (!procedenciasValidas.includes(normalizada)) {
    console.warn(`[ProcedenciaNormalizer] Procedencia no reconocida: "${procedencia}" → normalizada a "visita-medica"`);
    return 'visita-medica';
  }
  
  return normalizada;
};
