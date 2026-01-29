// Servicio para gestionar el perfil completo del paciente incluyendo anamnesis clínica y social

const PATIENT_PROFILES_KEY = 'oirconecta_patient_profiles';

/**
 * Obtiene todos los perfiles de pacientes
 * @returns {Object} Objeto con email como clave y perfil como valor
 */
export const getAllPatientProfiles = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {};
  }

  try {
    const data = localStorage.getItem(PATIENT_PROFILES_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error al obtener perfiles de pacientes:', error);
    return {};
  }
};

/**
 * Guarda todos los perfiles de pacientes
 * @param {Object} profiles - Objeto con perfiles
 * @returns {boolean} true si se guardó correctamente
 */
const savePatientProfiles = (profiles) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem(PATIENT_PROFILES_KEY, JSON.stringify(profiles));
    return true;
  } catch (error) {
    console.error('Error al guardar perfiles de pacientes:', error);
    return false;
  }
};

/**
 * Obtiene el perfil de un paciente específico
 * @param {string} patientEmail - Email del paciente
 * @returns {Object|null} Perfil del paciente o null
 */
export const getPatientProfile = (patientEmail) => {
  const allProfiles = getAllPatientProfiles();
  return allProfiles[patientEmail] || null;
};

/**
 * Crea o actualiza el perfil de un paciente
 * @param {string} patientEmail - Email del paciente
 * @param {Object} profileData - Datos del perfil
 * @returns {Object} {success: boolean, profile: Object|null, error: string|null}
 */
export const savePatientProfile = (patientEmail, profileData) => {
  if (!patientEmail) {
    return {
      success: false,
      profile: null,
      error: 'Email del paciente es obligatorio',
    };
  }

  const allProfiles = getAllPatientProfiles();
  const existingProfile = allProfiles[patientEmail] || {};

  const profile = {
    ...existingProfile,
    ...profileData,
    patientEmail,
    updatedAt: new Date().toISOString(),
    createdAt: existingProfile.createdAt || new Date().toISOString(),
  };

  allProfiles[patientEmail] = profile;

  if (savePatientProfiles(allProfiles)) {
    return {
      success: true,
      profile,
      error: null,
    };
  } else {
    return {
      success: false,
      profile: null,
      error: 'Error al guardar el perfil',
    };
  }
};

/**
 * Inicializa un perfil de paciente desde datos de cita o lead
 * @param {Object} sourceData - Datos de cita o lead
 * @returns {Object} {success: boolean, profile: Object|null, error: string|null}
 */
export const initializePatientProfile = (sourceData) => {
  const email = sourceData.patientEmail || sourceData.email;
  if (!email) {
    return {
      success: false,
      profile: null,
      error: 'Email es obligatorio',
    };
  }

  const existingProfile = getPatientProfile(email);
  if (existingProfile) {
    // Si ya existe, solo actualizar datos básicos si faltan
    return {
      success: true,
      profile: existingProfile,
      error: null,
    };
  }

  // Crear nuevo perfil con datos básicos
  const profile = {
    // Datos demográficos básicos
    nombre: sourceData.patientName || sourceData.nombre || '',
    email: email,
    telefono: sourceData.patientPhone || sourceData.telefono || '',
    direccion: sourceData.direccion || '',
    ciudad: sourceData.ciudad || '',
    fechaNacimiento: sourceData.fechaNacimiento || '',
    genero: sourceData.genero || '',
    documentoIdentidad: sourceData.documentoIdentidad || '',
    
    // Datos de procedencia
    procedencia: sourceData.procedencia || 'visita-medica',
    medicoReferente: sourceData.medicoReferente || '',
    usuarioAudifonosMedicados: sourceData.usuarioAudifonosMedicados || 'NO',
    
    // Anamnesis Clínica
    anamnesisClinica: {
      motivoConsulta: sourceData.reason || sourceData.interes || '',
      sintomasAuditivos: {
        hipoacusia: { presente: false, grado: '', oido: '', inicio: '', evolucion: '' },
        acufeno: { presente: false, tipo: '', frecuencia: '', intensidad: '', oido: '' },
        vertigo: { presente: false, frecuencia: '', duracion: '', desencadenantes: '' },
        dificultadPercepcionHabla: { presente: false, descripcion: '' },
        dificultadInteligibilidad: { presente: false, descripcion: '' },
        dificultadLocalizacionSonora: { presente: false, descripcion: '' },
      },
      antecedentesMedicos: {
        patologiasGenerales: [],
        cirugias: [],
        medicamentos: [],
        alergias: [],
        enfermedadesCronicas: [],
      },
      antecedentesOtorrinolaringologicos: {
        otitis: { presente: false, tipo: '', frecuencia: '', tratamiento: '' },
        perforacionTimpanica: { presente: false, oido: '', fecha: '' },
        traumaAcustico: { presente: false, descripcion: '', fecha: '' },
        exposicionRuido: { presente: false, tipo: '', duracion: '', intensidad: '' },
        otros: '',
      },
      antecedentesFamiliares: {
        hipoacusia: { presente: false, familiar: '', grado: '' },
        otrasPatologias: [],
      },
      desarrollo: {
        embarazo: { normal: true, complicaciones: '' },
        parto: { normal: true, tipo: '', complicaciones: '' },
        desarrolloMotor: { normal: true, observaciones: '' },
        desarrolloLenguaje: { normal: true, observaciones: '' },
      },
    },
    
    // Anamnesis Social
    anamnesisSocial: {
      estadoCivil: '',
      ocupacion: '',
      nivelEducativo: '',
      contextoFamiliar: {
        composicionFamiliar: '',
        apoyoFamiliar: '',
        observaciones: '',
      },
      contextoLaboral: {
        tipoTrabajo: '',
        ambienteRuido: false,
        usoProteccionAuditiva: false,
        observaciones: '',
      },
      contextoSocial: {
        actividadesRecreativas: [],
        participacionSocial: '',
        limitaciones: '',
      },
      habitos: {
        tabaquismo: { presente: false, frecuencia: '', duracion: '' },
        alcohol: { presente: false, frecuencia: '', cantidad: '' },
        otros: '',
      },
    },
    
    // Historial de consultas
    historialConsultas: [],
    
    // Notas y observaciones - desde lead (notas)
    notas: sourceData.notas || '',
    observacionesGenerales: sourceData.notas || '',
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return savePatientProfile(email, profile);
};
