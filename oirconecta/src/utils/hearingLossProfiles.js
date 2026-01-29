// Perfiles de Pérdida Auditiva según Estándares Médicos
// Basado en clasificación internacional de audiometría

export const hearingLossProfiles = {
  'normal': {
    name: 'Audición Normal',
    range: '0-20 dB HL',
    description: 'Audición perfecta, no requiere intervención',
    filterFreq: 8000,      // No filtra frecuencias
    compression: 1,         // Sin compresión
    distortion: 0,          // Sin distorsión
    volume: 1.0,            // Volumen completo
    color: '#4CAF50',
    icon: '👂'
  },
  
  'leve': {
    name: 'Pérdida Leve',
    range: '20-40 dB HL',
    description: 'Dificultad con voces suaves y ambientes ruidosos',
    filterFreq: 2000,      // Filtra frecuencias > 2000 Hz
    compression: 2,         // Compresión 2:1
    distortion: 0.05,      // 5% de distorsión
    volume: 0.7,            // Volumen al 70%
    color: '#8BC34A',
    icon: '🔊'
  },
  
  'moderada': {
    name: 'Pérdida Moderada',
    range: '40-60 dB HL',
    description: 'Dificultad con conversación normal, pérdida de consonantes',
    filterFreq: 1500,      // Filtra frecuencias > 1500 Hz
    compression: 4,         // Compresión 4:1
    distortion: 0.15,      // 15% de distorsión
    volume: 0.5,            // Volumen al 50%
    color: '#FFC107',
    icon: '🔉'
  },
  
  'moderadamente_severa': {
    name: 'Pérdida Moderadamente Severa',
    range: '60-80 dB HL',
    description: 'Solo escucha voces muy fuertes, pérdida severa de consonantes',
    filterFreq: 1000,      // Filtra frecuencias > 1000 Hz
    compression: 8,         // Compresión 8:1
    distortion: 0.30,      // 30% de distorsión
    volume: 0.3,            // Volumen al 30%
    color: '#FF9800',
    icon: '🔊'
  },
  
  'severa': {
    name: 'Pérdida Severa',
    range: '80-90 dB HL',
    description: 'Solo sonidos muy fuertes, dependencia de lectura labial',
    filterFreq: 500,        // Filtra frecuencias > 500 Hz
    compression: 12,        // Compresión 12:1
    distortion: 0.50,      // 50% de distorsión
    volume: 0.15,           // Volumen al 15%
    color: '#F44336',
    icon: '🔊'
  },
  
  'profunda': {
    name: 'Pérdida Profunda',
    range: '>90 dB HL',
    description: 'Solo percibe vibraciones, no puede entender el habla',
    filterFreq: 250,        // Filtra frecuencias > 250 Hz
    compression: 20,        // Compresión 20:1
    distortion: 0.70,      // 70% de distorsión
    volume: 0.05,           // Volumen al 5%
    color: '#9C27B0',
    icon: '🔇'
  }
};

// Función para determinar categoría basada en audiograma
export const classifyHearingLoss = (audiogramData) => {
  // audiogramData debe ser un objeto con frecuencias como claves
  // Ejemplo: { '125': 15, '250': 20, '500': 25, '1000': 30, '2000': 35, '4000': 40, '8000': 45 }
  
  const frequencies = Object.values(audiogramData);
  const averageLoss = frequencies.reduce((sum, loss) => sum + loss, 0) / frequencies.length;
  
  if (averageLoss <= 20) return 'normal';
  if (averageLoss <= 40) return 'leve';
  if (averageLoss <= 60) return 'moderada';
  if (averageLoss <= 80) return 'moderadamente_severa';
  if (averageLoss <= 90) return 'severa';
  return 'profunda';
};

// Función para obtener descripción detallada de efectos
export const getHearingLossEffects = (category) => {
  const effects = {
    'normal': {
      consonants: 'Todas las consonantes se escuchan claramente',
      vowels: 'Vocales perfectamente distinguibles',
      speech: 'Comprensión del habla al 100%',
      environment: 'Sin problemas en ambientes ruidosos'
    },
    'leve': {
      consonants: 'Pérdida de consonantes sibilantes (s, f, th, sh)',
      vowels: 'Vocales se escuchan bien',
      speech: 'Comprensión del habla al 85-90%',
      environment: 'Dificultad en ambientes ruidosos'
    },
    'moderada': {
      consonants: 'Pérdida de consonantes explosivas (p, t, k, b, d, g)',
      vowels: 'Algunas vocales pueden confundirse',
      speech: 'Comprensión del habla al 70-80%',
      environment: 'Dificultad significativa en ambientes ruidosos'
    },
    'moderadamente_severa': {
      consonants: 'Pérdida de la mayoría de consonantes',
      vowels: 'Solo vocales fuertes se distinguen',
      speech: 'Comprensión del habla al 50-60%',
      environment: 'Muy difícil en ambientes ruidosos'
    },
    'severa': {
      consonants: 'Prácticamente no se distinguen consonantes',
      vowels: 'Solo vocales muy fuertes',
      speech: 'Comprensión del habla al 20-30%',
      environment: 'Imposible en ambientes ruidosos'
    },
    'profunda': {
      consonants: 'No se distinguen consonantes',
      vowels: 'No se distinguen vocales',
      speech: 'No puede entender el habla',
      environment: 'Solo percibe vibraciones'
    }
  };
  
  return effects[category] || effects['normal'];
};

// Función para generar audiograma de ejemplo
export const generateExampleAudiogram = (category) => {
  const examples = {
    'normal': { '125': 10, '250': 5, '500': 0, '1000': 5, '2000': 10, '4000': 15, '8000': 20 },
    'leve': { '125': 15, '250': 20, '500': 25, '1000': 30, '2000': 35, '4000': 40, '8000': 45 },
    'moderada': { '125': 25, '250': 30, '500': 35, '1000': 40, '2000': 45, '4000': 50, '8000': 55 },
    'moderadamente_severa': { '125': 45, '250': 50, '500': 55, '1000': 60, '2000': 65, '4000': 70, '8000': 75 },
    'severa': { '125': 65, '250': 70, '500': 75, '1000': 80, '2000': 85, '4000': 90, '8000': 95 },
    'profunda': { '125': 85, '250': 90, '500': 95, '1000': 100, '2000': 105, '4000': 110, '8000': 115 }
  };
  
  return examples[category] || examples['normal'];
};

export default hearingLossProfiles; 