// Servicio para procesar datos de profesionales destacados
import otologosData from '../data/bdatos_otologos.json';
import audiologasData from '../data/bdatos_audiologas.json';
import fonoaudiologosData from '../data/bdatos_fonoaudiologos.json';
import otorrinolaringologosData from '../data/bdatos_otorrinolaringologos.json';

// Función para generar calificaciones aleatorias basadas en criterios
const generateRating = () => {
  // Base rating entre 4.0 y 5.0
  let baseRating = 4.0 + Math.random() * 1.0;
  
  return Math.min(5.0, baseRating);
};

// Función para generar servicios basados en la profesión
const generateServices = (profesion) => {
  const servicesByProfession = {
    'Otólogo': [
      'Cirugía de oído',
      'Tratamiento de tinnitus',
      'Implantes cocleares',
      'Audiología clínica',
      'Rehabilitación auditiva',
      'Cirugía endoscópica',
      'Otología pediátrica',
      'Tratamiento de vértigo',
      'Cirugía de oído medio',
      'Audiometría avanzada',
      'Cirugía de oído externo',
      'Tratamiento de otitis',
      'Cirugía de colesteatoma',
      'Tratamiento de hipoacusia',
      'Cirugía de estapedectomía',
      'Audiometría tonal',
      'Logoaudiometría',
      'Timpanometría',
      'Reflejos acústicos',
      'Emisiones otoacústicas'
    ],
    'Audióloga': [
      'Evaluación auditiva',
      'Adaptación de audífonos',
      'Audiometría',
      'Audiología pediátrica',
      'Implantes cocleares',
      'Rehabilitación',
      'Audiometría ocupacional',
      'Procesamiento auditivo',
      'Audiometría tonal y verbal',
      'Logoaudiometría',
      'Timpanometría',
      'Reflejos acústicos',
      'Emisiones otoacústicas',
      'Potenciales evocados auditivos',
      'Audiometría de alta frecuencia',
      'Audiometría de campo libre',
      'Audiometría con ruido',
      'Audiometría de reconocimiento',
      'Audiometría de umbral',
      'Audiometría de confort'
    ],
    'Otorrinolaringólogo': [
      'Cirugía endoscópica',
      'Tratamiento de sinusitis',
      'Cirugía de amígdalas',
      'Tratamiento de vértigo',
      'Cirugía de nariz',
      'Audiología',
      'Rinología',
      'Laringología',
      'Cirugía de adenoides',
      'Tratamiento de rinitis alérgica',
      'Cirugía de desviación septal',
      'Tratamiento de apnea del sueño',
      'Cirugía de pólipos nasales',
      'Tratamiento de sinusitis crónica',
      'Cirugía de turbinoplastia',
      'Tratamiento de laringitis',
      'Cirugía de nódulos vocales',
      'Tratamiento de disfonía',
      'Cirugía de pólipos laríngeos',
      'Tratamiento de reflujo laringofaríngeo'
    ],
    'Fonoaudióloga': [
      'Terapia del lenguaje',
      'Rehabilitación auditiva',
      'Tratamiento de disfagia',
      'Terapia de voz',
      'Rehabilitación neurológica',
      'Audiología',
      'Foniatría',
      'Audiología pediátrica',
      'Terapia de articulación',
      'Tratamiento de dislalias',
      'Terapia de fluidez',
      'Tratamiento de tartamudez',
      'Terapia de deglución',
      'Tratamiento de afasia',
      'Terapia de motricidad orofacial',
      'Tratamiento de disartria',
      'Terapia de respiración',
      'Tratamiento de disfonía funcional',
      'Terapia de resonancia',
      'Tratamiento de trastornos del lenguaje'
    ]
  };
  
  const services = servicesByProfession[profesion] || servicesByProfession['Audióloga'];
  const numServices = Math.floor(Math.random() * 3) + 2; // 2-4 servicios
  const shuffled = services.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, numServices);
};

// Función para determinar si es premium
const isPremium = () => {
  // 30% de probabilidad de ser premium
  return Math.random() < 0.3;
};

// Función para generar email basado en el nombre
const generateEmail = (nombre) => {
  const cleanName = nombre
    .replace(/DR\.|DRA\./g, '')
    .replace(/\s+/g, '.')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  
  return `${cleanName}@${domain}`;
};

// Función para procesar datos de otólogos
const processOtologosData = () => {
  console.log('Procesando datos reales de otólogos:', otologosData.length, 'profesionales');
  
  // Información específica de otólogos
  const especialidadesOtologicas = [
    'Otología Clínica',
    'Cirugía Otológica',
    'Otología Pediátrica',
    'Otología Geriátrica',
    'Otología Ocupacional'
  ];
  
  const certificaciones = [
    'Certificado en Otología Avanzada',
    'Especialista en Implantes Cocleares',
    'Certificado en Audiología Clínica',
    'Especialista en Cirugía Otológica',
    'Certificado en Otología Pediátrica'
  ];
  
  // Procesar todos los datos reales
  const processedData = otologosData.map((otologo, index) => {
    const rating = generateRating();
    const services = generateServices('Otólogo');
    const premium = isPremium();
    const email = generateEmail(otologo.nombre);
    
    return {
      id: `otologo_${index + 1}`,
      nombre: otologo.nombre,
      especialidad: 'Otólogo',
      subespecialidad: especialidadesOtologicas[Math.floor(Math.random() * especialidadesOtologicas.length)],
      calificacion: parseFloat(rating.toFixed(1)),
      servicios: services,
      ciudad: otologo.ciudad,
      telefono: otologo.telefono,
      email: email,
      premium: premium,
      imagen: `/images/profesionales/otologo${(index % 4) + 1}.jpg`,
      experiencia: `${Math.floor(Math.random() * 15) + 5} años`,
      reseñas: Math.floor(Math.random() * 200) + 50,
      certificacion: certificaciones[Math.floor(Math.random() * certificaciones.length)],
      consultorio: `${otologo.ciudad} - Consultorio ${Math.floor(Math.random() * 5) + 1}`,
      horarios: ['Lun-Vie: 8:00-18:00', 'Sáb: 8:00-12:00', 'Dom: Cerrado'][Math.floor(Math.random() * 3)],
      idiomas: ['Español', 'Inglés', 'Español, Inglés'][Math.floor(Math.random() * 3)]
    };
  });
  
  // Seleccionar 4 profesionales aleatoriamente de los datos reales
  const shuffled = processedData.sort(() => 0.5 - Math.random());
  const selectedProfessionals = shuffled.slice(0, 4);
  
  console.log('4 otólogos seleccionados aleatoriamente:', selectedProfessionals.map(p => p.nombre));
  
  return selectedProfessionals;
};

// Función para procesar datos de audiólogas
const processAudiologasData = () => {
  // Intentar obtener datos reales del localStorage
  try {
    const savedData = localStorage.getItem('audiologas_data');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      console.log('Usando datos reales de audiólogas del localStorage:', parsedData.length, 'profesionales');
      
      // Procesar todos los datos reales
      const processedData = parsedData.map((audiologa, index) => {
        const rating = generateRating();
        const services = generateServices('Audióloga');
        const premium = isPremium();
        const email = generateEmail(audiologa.nombre);
        
        return {
          id: `audiologa_${index + 1}`,
          nombre: audiologa.nombre,
          especialidad: 'Audióloga',
          calificacion: parseFloat(rating.toFixed(1)),
          servicios: services,
          ciudad: audiologa.ciudad,
          telefono: audiologa.telefono,
          email: email,
          premium: premium,
          imagen: `/images/profesionales/audiologa${(index % 4) + 1}.jpg`
        };
      });
      
      // Seleccionar 4 profesionales aleatoriamente de los datos reales
      const shuffled = processedData.sort(() => 0.5 - Math.random());
      const selectedProfessionals = shuffled.slice(0, 4);
      
      console.log('4 audiólogas seleccionadas aleatoriamente:', selectedProfessionals.map(p => p.nombre));
      
      return selectedProfessionals;
    }
  } catch (error) {
    console.error('Error al procesar datos reales de audiólogas:', error);
  }
  
  // Fallback a datos del archivo JSON si no hay datos en localStorage
  return audiologasData.map((audiologa, index) => {
          const rating = generateRating();
    const services = generateServices('Audióloga');
          const premium = isPremium();
            const email = generateEmail(audiologa.nombre);
    
    return {
      id: `audiologa_${index + 1}`,
      nombre: audiologa.nombre,
      especialidad: 'Audióloga',
      calificacion: parseFloat(rating.toFixed(1)),
      servicios: services,
      ciudad: audiologa.ciudad,
      telefono: audiologa.telefono,
      email: email,
      premium: premium,
      imagen: `/images/profesionales/audiologa${(index % 4) + 1}.jpg`
    };
  });
};

// Función para procesar datos de otorrinolaringólogos
const processOtorrinolaringologosData = () => {
  return otorrinolaringologosData.map((orl, index) => {
    const rating = generateRating();
    const services = generateServices('Otorrinolaringólogo');
    const premium = isPremium();
    const email = generateEmail(orl.nombre);
    
    return {
      id: `orl_${index + 1}`,
      nombre: orl.nombre,
      especialidad: 'Otorrinolaringólogo',
      calificacion: parseFloat(rating.toFixed(1)),
      servicios: services,
      ciudad: orl.ciudad,
      telefono: orl.telefono,
      email: email,
      premium: premium,
      imagen: `/images/profesionales/orl${(index % 4) + 1}.jpg`
    };
  });
};

// Función para procesar datos de fonoaudiólogos
const processFonoaudiologosData = () => {
  return fonoaudiologosData.map((fono, index) => {
    const rating = generateRating();
    const services = generateServices('Fonoaudióloga');
    const premium = isPremium();
    const email = generateEmail(fono.nombre);
    
    return {
      id: `fono_${index + 1}`,
      nombre: fono.nombre,
      especialidad: 'Fonoaudióloga',
      calificacion: parseFloat(rating.toFixed(1)),
      servicios: services,
      ciudad: fono.ciudad,
      telefono: fono.telefono,
      email: email,
      premium: premium,
      imagen: `/images/profesionales/fono${(index % 4) + 1}.jpg`
    };
  });
};

// Función para obtener los 4 mejores profesionales por especialidad
const getTopProfessionals = (professionals, count = 4) => {
  // Si ya tenemos exactamente 4 profesionales (caso de audiólogas con selección aleatoria)
  if (professionals.length === 4) {
    return professionals;
  }
  
  // Para otros casos, aplicar criterios de selección
  return professionals
    .sort((a, b) => {
      // Primero por premium
      if (a.premium && !b.premium) return -1;
      if (!a.premium && b.premium) return 1;
      
      // Luego por calificación
      if (a.calificacion !== b.calificacion) {
        return b.calificacion - a.calificacion;
      }
      
      // Luego por cantidad de servicios
      return b.servicios.length - a.servicios.length;
    })
    .slice(0, count);
};

// Función principal para obtener todos los datos procesados
export const getProcessedProfessionalData = () => {
  const otologos = processOtologosData();
  const audiologas = processAudiologasData();
  const orl = processOtorrinolaringologosData();
  const fonoaudiologos = processFonoaudiologosData();
  
  console.log('Datos procesados - Otólogos:', otologos.length);
  console.log('Datos procesados - Audiólogas:', audiologas.length);
  console.log('Datos procesados - ORL:', orl.length);
  console.log('Datos procesados - Fonoaudiólogos:', fonoaudiologos.length);
  
  const result = {
    otorrinolaringologos: {
      titulo: "Otorrinolaringólogos Destacados",
      icono: "MedicalServices",
      profesionales: getTopProfessionals(orl)
    },
    otologos: {
      titulo: "Otólogos Destacados",
      icono: "Hearing",
      profesionales: getTopProfessionals(otologos)
    },
    audiologos: {
      titulo: "Audiólogos Destacados",
      icono: "Support",
      profesionales: getTopProfessionals(audiologas)
    },
    fonoaudiologos: {
      titulo: "Fonoaudiólogos Destacados",
      icono: "Psychology",
      profesionales: getTopProfessionals(fonoaudiologos)
    }
  };
  
  console.log('Top 4 ORL:', result.otorrinolaringologos.profesionales.map(p => p.nombre));
  console.log('Top 4 Audiólogas:', result.audiologos.profesionales.map(p => p.nombre));
  
  return result;
};

// Función para obtener datos de localStorage si existen
export const getProfessionalDataFromStorage = () => {
  try {
    // Obtener datos procesados
    const processedData = getProcessedProfessionalData();
    
    console.log('Datos procesados - Audiólogas:', processedData.audiologos.profesionales.map(p => p.nombre));
    console.log('Datos procesados - ORL:', processedData.otorrinolaringologos.profesionales.map(p => p.nombre));
    console.log('Datos procesados - Otólogos:', processedData.otologos.profesionales.map(p => p.nombre));
    console.log('Datos procesados - Fonoaudiólogos:', processedData.fonoaudiologos.profesionales.map(p => p.nombre));
    
    return processedData;
  } catch (error) {
    console.error('Error al procesar datos de profesionales:', error);
    return getProcessedProfessionalData();
  }
}; 