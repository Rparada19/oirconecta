// Sistema de persistencia de datos para audiólogas (JSON + localStorage).

import audiologasData from '../data/bdatos_audiologas.json';

// Claves de localStorage para audiólogas
const AUDIOLOGAS_KEYS = {
  PRIMARY: 'audiologas_data',
  BACKUP: 'audiologasData',
  ORIGINAL: 'audiologas_original_data'
};

// Función para obtener datos de audiólogas desde múltiples fuentes
export const getAudiologasData = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.log('🌐 No estamos en el navegador, retornando datos estáticos');
    return audiologasData;
  }

  try {
    // 1. Intentar obtener desde localStorage (datos del usuario)
    let data = localStorage.getItem(AUDIOLOGAS_KEYS.PRIMARY);
    if (data) {
      const parsedData = JSON.parse(data);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        console.log(`📊 Datos de audiólogas cargados desde localStorage: ${parsedData.length} registros`);
        return parsedData;
      }
    }

    // 2. Intentar desde clave alternativa
    data = localStorage.getItem(AUDIOLOGAS_KEYS.BACKUP);
    if (data) {
      const parsedData = JSON.parse(data);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        console.log(`📊 Datos de audiólogas cargados desde backup: ${parsedData.length} registros`);
        // Guardar en la clave principal para futuras sesiones
        localStorage.setItem(AUDIOLOGAS_KEYS.PRIMARY, data);
        return parsedData;
      }
    }

    // 3. Si no hay datos en localStorage, cargar desde archivo JSON estático
    if (audiologasData && audiologasData.length > 0) {
      console.log(`📊 Datos de audiólogas cargados desde archivo estático: ${audiologasData.length} registros`);
      // Guardar en localStorage para futuras sesiones
      localStorage.setItem(AUDIOLOGAS_KEYS.PRIMARY, JSON.stringify(audiologasData));
      localStorage.setItem(AUDIOLOGAS_KEYS.BACKUP, JSON.stringify(audiologasData));
      return audiologasData;
    }

    // 4. Si no hay datos en ningún lado, retornar array vacío
    console.warn('⚠️ No se encontraron datos de audiólogas en ninguna fuente');
    return [];

  } catch (error) {
    console.error('❌ Error al cargar datos de audiólogas:', error);
    // En caso de error, retornar datos estáticos como fallback
    return audiologasData || [];
  }
};

// Función para guardar datos de audiólogas permanentemente
export const saveAudiologasData = (data) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.log('🌐 No estamos en el navegador, no se puede guardar en localStorage');
    return false;
  }

  try {
    if (!Array.isArray(data) || data.length === 0) {
      console.error('❌ Datos inválidos para guardar');
      return false;
    }

    // Guardar en todas las claves para redundancia
    localStorage.setItem(AUDIOLOGAS_KEYS.PRIMARY, JSON.stringify(data));
    localStorage.setItem(AUDIOLOGAS_KEYS.BACKUP, JSON.stringify(data));
    localStorage.setItem(AUDIOLOGAS_KEYS.ORIGINAL, JSON.stringify(data));

    console.log(`💾 ${data.length} audiólogas guardadas permanentemente en localStorage`);
    
    // También actualizar el archivo JSON estático (esto requiere backend, pero es para documentación)
    console.log('📝 Nota: Para persistencia completa, los datos también deberían guardarse en el archivo JSON estático');
    
    return true;
  } catch (error) {
    console.error('❌ Error al guardar datos de audiólogas:', error);
    return false;
  }
};

// Función para verificar el estado de los datos
export const checkAudiologasDataStatus = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {
      available: false,
      source: 'static',
      count: audiologasData?.length || 0,
      message: 'No estamos en el navegador'
    };
  }

  try {
    const primaryData = localStorage.getItem(AUDIOLOGAS_KEYS.PRIMARY);
    const backupData = localStorage.getItem(AUDIOLOGAS_KEYS.BACKUP);
    const originalData = localStorage.getItem(AUDIOLOGAS_KEYS.ORIGINAL);
    const staticData = audiologasData;

    let source = 'none';
    let count = 0;
    let available = false;

    if (primaryData) {
      const parsed = JSON.parse(primaryData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        source = 'localStorage_primary';
        count = parsed.length;
        available = true;
      }
    } else if (backupData) {
      const parsed = JSON.parse(backupData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        source = 'localStorage_backup';
        count = parsed.length;
        available = true;
      }
    } else if (staticData && staticData.length > 0) {
      source = 'static_file';
      count = staticData.length;
      available = true;
    }

    return {
      available,
      source,
      count,
      message: available 
        ? `${count} audiólogas disponibles desde ${source}`
        : 'No hay datos de audiólogas disponibles'
    };

  } catch (error) {
    return {
      available: false,
      source: 'error',
      count: 0,
      message: `Error: ${error.message}`
    };
  }
};

// Función para restaurar datos desde el archivo estático
export const restoreAudiologasFromStatic = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    if (audiologasData && audiologasData.length > 0) {
      saveAudiologasData(audiologasData);
      console.log(`🔄 ${audiologasData.length} audiólogas restauradas desde archivo estático`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error al restaurar desde archivo estático:', error);
    return false;
  }
};

// Función para limpiar todos los datos (solo para debugging)
export const clearAllAudiologasData = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    Object.values(AUDIOLOGAS_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('🗑️ Todos los datos de audiólogas eliminados del localStorage');
    return true;
  } catch (error) {
    console.error('❌ Error al limpiar datos:', error);
    return false;
  }
};

// Función para exportar datos actuales (útil para respaldos)
export const exportAudiologasData = () => {
  const data = getAudiologasData();
  if (data && data.length > 0) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audiologas_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`📤 ${data.length} audiólogas exportadas como respaldo`);
    return true;
  }
  return false;
}; 