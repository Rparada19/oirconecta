// Base de datos de marcas para el Simulador Familiar
export const marcasSimulador = {
  widex: {
    nombre: 'Widex',
    logo: 'W',
    color: '#4CAF50',
    descripcion: 'Tecnología danesa líder en audífonos',
    modelos: {
      basico: {
        nombre: 'Widex MOMENT',
        precio: 2800000,
        caracteristicas: [
          'Reducción de ruido inteligente',
          'Conectividad Bluetooth',
          'Aplicación móvil Widex MOMENT',
          'Batería recargable',
          'Micrófono direccional'
        ],
        compensacion: 65,
        tecnologia: 'MOMENT Technology'
      },
      intermedio: {
        nombre: 'Widex MOMENT SHEER',
        precio: 4200000,
        caracteristicas: [
          'Procesamiento de sonido avanzado',
          'Cancelación de ruido superior',
          'Conectividad inalámbrica completa',
          'Aplicación con control remoto',
          'Micrófono direccional avanzado',
          'Tecnología PureSound'
        ],
        compensacion: 80,
        tecnologia: 'SHEER Technology'
      },
      premium: {
        nombre: 'Widex MOMENT SHEER M&RIE',
        precio: 5800000,
        caracteristicas: [
          'Tecnología M&RIE revolucionaria',
          'Procesamiento neural avanzado',
          'Personalización completa',
          'Conectividad universal',
          'Aplicación con IA',
          'Micrófono en el oído'
        ],
        compensacion: 95,
        tecnologia: 'M&RIE Technology'
      }
    }
  },
  
  oticon: {
    nombre: 'Oticon',
    logo: 'O',
    color: '#2196F3',
    descripcion: 'Innovación en audífonos con BrainHearing',
    modelos: {
      basico: {
        nombre: 'Oticon Opn Play',
        precio: 2500000,
        caracteristicas: [
          'Conectividad Bluetooth',
          'Aplicación Oticon ON',
          'Batería recargable',
          'Micrófono direccional',
          'Reducción de ruido'
        ],
        compensacion: 60,
        tecnologia: 'Play Technology'
      },
      intermedio: {
        nombre: 'Oticon Opn S',
        precio: 3800000,
        caracteristicas: [
          'BrainHearing Technology',
          'Procesamiento 360°',
          'Conectividad avanzada',
          'Aplicación con control remoto',
          'Micrófono direccional avanzado',
          'Reducción de ruido superior'
        ],
        compensacion: 75,
        tecnologia: 'BrainHearing Technology'
      },
      premium: {
        nombre: 'Oticon Opn S M&RIE',
        precio: 5200000,
        caracteristicas: [
          'Tecnología M&RIE',
          'BrainHearing avanzado',
          'Personalización neural',
          'Conectividad universal',
          'Aplicación con IA',
          'Micrófono en el oído'
        ],
        compensacion: 90,
        tecnologia: 'M&RIE + BrainHearing'
      }
    }
  },
  
  resound: {
    nombre: 'ReSound',
    logo: 'R',
    color: '#FF9800',
    descripcion: 'Audífonos con tecnología M&RIE',
    modelos: {
      basico: {
        nombre: 'ReSound ONE',
        precio: 2600000,
        caracteristicas: [
          'Micrófono M&RIE',
          'Aplicación ReSound Smart 3D',
          'Conectividad Bluetooth',
          'Batería recargable',
          'Reducción de ruido'
        ],
        compensacion: 65,
        tecnologia: 'ONE Technology'
      },
      intermedio: {
        nombre: 'ReSound ONE M&RIE',
        precio: 4000000,
        caracteristicas: [
          'Tecnología M&RIE',
          'Procesamiento avanzado',
          'Conectividad inalámbrica',
          'Aplicación con control remoto',
          'Micrófono direccional avanzado',
          'Reducción de ruido superior'
        ],
        compensacion: 80,
        tecnologia: 'M&RIE Technology'
      },
      premium: {
        nombre: 'ReSound ONE M&RIE Premium',
        precio: 5500000,
        caracteristicas: [
          'M&RIE avanzado',
          'Procesamiento neural',
          'Personalización completa',
          'Conectividad universal',
          'Aplicación con IA',
          'Micrófono en el oído'
        ],
        compensacion: 95,
        tecnologia: 'Premium M&RIE'
      }
    }
  },
  
  phonak: {
    nombre: 'Phonak',
    logo: 'P',
    color: '#9C27B0',
    descripcion: 'Audífonos con tecnología Paradise',
    modelos: {
      basico: {
        nombre: 'Phonak Audeo Life',
        precio: 2400000,
        caracteristicas: [
          'AutoSense OS',
          'Conectividad Bluetooth',
          'Aplicación myPhonak',
          'Batería recargable',
          'Micrófono direccional'
        ],
        compensacion: 60,
        tecnologia: 'Life Technology'
      },
      intermedio: {
        nombre: 'Phonak Audeo Paradise',
        precio: 3600000,
        caracteristicas: [
          'Paradise Technology',
          'Conectividad inalámbrica',
          'Procesamiento avanzado',
          'Aplicación con control remoto',
          'Micrófono direccional avanzado',
          'Reducción de ruido superior'
        ],
        compensacion: 75,
        tecnologia: 'Paradise Technology'
      },
      premium: {
        nombre: 'Phonak Audeo Paradise M&RIE',
        precio: 5000000,
        caracteristicas: [
          'M&RIE Technology',
          'Paradise avanzado',
          'Personalización neural',
          'Conectividad universal',
          'Aplicación con IA',
          'Micrófono en el oído'
        ],
        compensacion: 90,
        tecnologia: 'Paradise + M&RIE'
      }
    }
  },
  
  signia: {
    nombre: 'Signia',
    logo: 'S',
    color: '#F44336',
    descripcion: 'Audífonos con tecnología Xperience',
    modelos: {
      basico: {
        nombre: 'Signia Pure X',
        precio: 2700000,
        caracteristicas: [
          'Xperience Technology',
          'Conectividad Bluetooth',
          'Aplicación Signia App',
          'Batería recargable',
          'Micrófono direccional'
        ],
        compensacion: 65,
        tecnologia: 'Xperience Technology'
      },
      intermedio: {
        nombre: 'Signia Pure Charge&Go X',
        precio: 4100000,
        caracteristicas: [
          'Xperience avanzado',
          'Conectividad inalámbrica',
          'Procesamiento avanzado',
          'Aplicación con control remoto',
          'Micrófono direccional avanzado',
          'Reducción de ruido superior'
        ],
        compensacion: 80,
        tecnologia: 'Advanced Xperience'
      },
      premium: {
        nombre: 'Signia Pure Charge&Go X M&RIE',
        precio: 5600000,
        caracteristicas: [
          'M&RIE Technology',
          'Xperience neural',
          'Personalización completa',
          'Conectividad universal',
          'Aplicación con IA',
          'Micrófono en el oído'
        ],
        compensacion: 95,
        tecnologia: 'Xperience + M&RIE'
      }
    }
  },
  
  starkey: {
    nombre: 'Starkey',
    logo: 'S',
    color: '#607D8B',
    descripcion: 'Audífonos personalizados de alta calidad',
    modelos: {
      basico: {
        nombre: 'Starkey Livio AI',
        precio: 2900000,
        caracteristicas: [
          'AI Technology',
          'Conectividad Bluetooth',
          'Aplicación Thrive',
          'Batería recargable',
          'Micrófono direccional'
        ],
        compensacion: 65,
        tecnologia: 'AI Technology'
      },
      intermedio: {
        nombre: 'Starkey Livio AI M&RIE',
        precio: 4300000,
        caracteristicas: [
          'AI avanzado',
          'M&RIE Technology',
          'Conectividad inalámbrica',
          'Aplicación con control remoto',
          'Micrófono direccional avanzado',
          'Reducción de ruido superior'
        ],
        compensacion: 80,
        tecnologia: 'AI + M&RIE'
      },
      premium: {
        nombre: 'Starkey Livio AI M&RIE Premium',
        precio: 5900000,
        caracteristicas: [
          'AI neural avanzado',
          'M&RIE Technology',
          'Personalización completa',
          'Conectividad universal',
          'Aplicación con IA',
          'Micrófono en el oído'
        ],
        compensacion: 95,
        tecnologia: 'Premium AI + M&RIE'
      }
    }
  }
};

// Función para obtener marca aleatoria (excluyendo la patrocinadora)
export const getMarcaAleatoria = (marcaExcluir) => {
  const marcasDisponibles = Object.keys(marcasSimulador).filter(
    marca => marca !== marcaExcluir
  );
  const marcaAleatoria = marcasDisponibles[Math.floor(Math.random() * marcasDisponibles.length)];
  return marcasSimulador[marcaAleatoria];
};

// Función para obtener marca por nombre
export const getMarcaPorNombre = (nombreMarca) => {
  return marcasSimulador[nombreMarca.toLowerCase()] || null;
};

// Función para formatear precios
export const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(price);
};

// Función para calcular comisión por marca y nivel
export const calcularComision = (marca, nivel, esPatrocinadora = false) => {
  const comisionesBase = {
    basico: 8,
    intermedio: 12,
    premium: 15
  };
  
  const multiplicador = esPatrocinadora ? 1.2 : 1.0; // 20% más para patrocinadoras
  return comisionesBase[nivel] * multiplicador;
}; 