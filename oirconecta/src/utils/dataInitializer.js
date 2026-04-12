// Inicializador de datos: solo import() dinámico (evita inflar el JS inicial y dejar la pantalla en "Cargando…").

/** Sube este valor cuando cambien los JSON del directorio para forzar recarga desde archivo (evita caché vieja en localStorage). */
export const DIRECTORY_DATA_VERSION = '2026-04-11-muestras-4'

const DIRECTORY_VERSION_KEY = 'oirconecta_directory_data_version'

const DIRECTORY_STORAGE_KEYS = [
  'audiologas_data',
  'audiologasData',
  'audiologas_original_data',
  'otologos_data',
  'otologosData',
  'fonoaudiologos_data',
  'fonoaudiologosData',
  'otorrinolaringologos_data',
  'otorrinolaringologosData',
]

// Función para inicializar todos los datos
export const initializeData = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.log('🌐 No estamos en el navegador, saltando inicialización de datos');
    return false;
  }
  
  console.log('🚀 Inicializando datos de la aplicación...');
  
  try {
    const storedVersion = localStorage.getItem(DIRECTORY_VERSION_KEY)
    if (storedVersion !== DIRECTORY_DATA_VERSION) {
      DIRECTORY_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k))
      localStorage.setItem(DIRECTORY_VERSION_KEY, DIRECTORY_DATA_VERSION)
      console.log(
        '📦 Versión de datos del directorio actualizada; se volverán a cargar los JSON (antes había datos en caché).'
      )
    }

    // Verificar si ya hay datos en localStorage
    const existingAudiologas = localStorage.getItem('audiologas_data') || localStorage.getItem('audiologasData');
    const existingOtologos = localStorage.getItem('otologos_data') || localStorage.getItem('otologosData');
    const existingFonoaudiologos = localStorage.getItem('fonoaudiologos_data') || localStorage.getItem('fonoaudiologosData');
    const existingORL = localStorage.getItem('otorrinolaringologos_data') || localStorage.getItem('otorrinolaringologosData');
    
    // Solo inicializar si NO hay datos existentes
    if (!existingAudiologas) {
      console.log('📊 No hay datos de audiólogas en localStorage, cargando desde archivo JSON...');
      import('../data/bdatos_audiologas.json')
        .then((module) => {
          const audiologasData = module.default;
          if (audiologasData && audiologasData.length > 0) {
            localStorage.setItem('audiologas_data', JSON.stringify(audiologasData));
            localStorage.setItem('audiologasData', JSON.stringify(audiologasData));
            console.log(`✅ ${audiologasData.length} audiólogas cargadas desde archivo JSON`);
          }
        })
        .catch((error) => {
          console.error('❌ Error al cargar audiólogas desde archivo JSON:', error);
        });
    } else {
      console.log('📊 Datos de audiólogas ya existen en localStorage, saltando inicialización');
    }
    
    if (!existingOtologos) {
      console.log('📊 No hay datos de otólogos en localStorage, cargando desde archivo JSON...');
      import('../data/bdatos_otologos.json')
        .then((module) => {
          const otologosData = module.default;
          if (otologosData && otologosData.length > 0) {
            localStorage.setItem('otologos_data', JSON.stringify(otologosData));
            localStorage.setItem('otologosData', JSON.stringify(otologosData));
            console.log(`✅ ${otologosData.length} otólogos cargados desde archivo JSON`);
          }
        })
        .catch((error) => {
          console.error('❌ Error al cargar otólogos desde archivo JSON:', error);
        });
    } else {
      console.log('📊 Datos de otólogos ya existen en localStorage, saltando inicialización');
    }
    
    if (!existingFonoaudiologos) {
      console.log('📊 No hay datos de fonoaudiólogos en localStorage, cargando desde archivo JSON...');
      import('../data/bdatos_fonoaudiologos.json')
        .then((module) => {
          const fonoaudiologosData = module.default;
          if (fonoaudiologosData && fonoaudiologosData.length > 0) {
            localStorage.setItem('fonoaudiologos_data', JSON.stringify(fonoaudiologosData));
            localStorage.setItem('fonoaudiologosData', JSON.stringify(fonoaudiologosData));
            console.log(`✅ ${fonoaudiologosData.length} fonoaudiólogos cargados desde archivo JSON`);
          }
        })
        .catch((error) => {
          console.error('❌ Error al cargar fonoaudiólogos desde archivo JSON:', error);
        });
    } else {
      console.log('📊 Datos de fonoaudiólogos ya existen en localStorage, saltando inicialización');
    }
    
    if (!existingORL) {
      console.log('📊 No hay datos de ORL en localStorage, cargando desde archivo JSON...');
      import('../data/bdatos_otorrinolaringologos.json')
        .then((module) => {
          const orlData = module.default;
          if (orlData && orlData.length > 0) {
            localStorage.setItem('otorrinolaringologos_data', JSON.stringify(orlData));
            localStorage.setItem('otorrinolaringologosData', JSON.stringify(orlData));
            console.log(`✅ ${orlData.length} ORL cargados desde archivo JSON`);
          }
        })
        .catch((error) => {
          console.error('❌ Error al cargar ORL desde archivo JSON:', error);
        });
    } else {
      console.log('📊 Datos de ORL ya existen en localStorage, saltando inicialización');
    }
    
    console.log('🎉 Inicialización de datos completada exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error durante la inicialización de datos:', error);
    return false;
  }
};

// Función para verificar si los datos están disponibles
export const checkDataAvailability = () => {
  // Verificar que estemos en el navegador
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {
      audiologas: 0,
      otologos: 0,
      fonoaudiologos: 0,
      otorrinolaringologos: 0
    };
  }
  
  try {
    const audiologas = localStorage.getItem('audiologas_data') || localStorage.getItem('audiologasData');
    const otologos = localStorage.getItem('otologos_data') || localStorage.getItem('otologosData');
    const fonoaudiologos = localStorage.getItem('fonoaudiologos_data') || localStorage.getItem('fonoaudiologosData');
    const otorrinolaringologos = localStorage.getItem('otorrinolaringologos_data') || localStorage.getItem('otorrinolaringologosData');
    
    return {
      audiologas: audiologas ? JSON.parse(audiologas).length : 0,
      otologos: otologos ? JSON.parse(otologos).length : 0,
      fonoaudiologos: fonoaudiologos ? JSON.parse(fonoaudiologos).length : 0,
      otorrinolaringologos: otorrinolaringologos ? JSON.parse(otorrinolaringologos).length : 0
    };
  } catch (error) {
    console.error('❌ Error al verificar disponibilidad de datos:', error);
    return {
      audiologas: 0,
      otologos: 0,
      fonoaudiologos: 0,
      otorrinolaringologos: 0
    };
  }
};

// Función para limpiar todos los datos del localStorage
export const clearAllData = () => {
  // Verificar que estemos en el navegador
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    console.log('🌐 No estamos en el navegador, no se pueden limpiar datos');
    return;
  }
  
  try {
    DIRECTORY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key))
    localStorage.removeItem(DIRECTORY_VERSION_KEY)
    console.log('🧹 Todos los datos del localStorage han sido limpiados');
  } catch (error) {
    console.error('❌ Error al limpiar datos:', error);
  }
}; 