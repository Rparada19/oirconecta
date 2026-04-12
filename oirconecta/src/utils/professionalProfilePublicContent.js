/**
 * Contenido de perfil público: aliados y estudios por categoría.
 * Las categorías sin ítems no se muestran en la UI.
 */

export const ALLY_CATEGORY_META = [
  { key: 'audifonos', title: 'Audífonos' },
  { key: 'implantes', title: 'Implantes' },
  { key: 'medicamentos', title: 'Medicamentos' },
  { key: 'accesorios', title: 'Accesorios' },
];

export const STUDY_CATEGORY_META = [
  { key: 'profesional', title: 'Formación profesional' },
  { key: 'especializaciones', title: 'Especializaciones' },
  { key: 'maestrias', title: 'Maestrías' },
  { key: 'cursos', title: 'Cursos' },
  { key: 'diplomados', title: 'Diplomados' },
];

/** @param {Record<string, { name: string, description?: string, image?: string }[]>} allies */
export function alliesCategoriesWithContent(allies) {
  if (!allies || typeof allies !== 'object') return [];
  return ALLY_CATEGORY_META.filter(
    (c) => Array.isArray(allies[c.key]) && allies[c.key].length > 0
  );
}

/** @param {Record<string, { title: string, institution?: string, period?: string }[]>} studies */
export function studyCategoriesWithContent(studies) {
  if (!studies || typeof studies !== 'object') return [];
  return STUDY_CATEGORY_META.filter(
    (c) => Array.isArray(studies[c.key]) && studies[c.key].length > 0
  );
}

/**
 * @param {boolean} isAudiologa
 * @param {object | null} audiologa
 */
export function buildPublicAllies(isAudiologa, audiologa) {
  const base = {
    audifonos: [
      { name: 'Phonak', description: 'Tecnología y adaptación', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop' },
      { name: 'Oticon', description: 'Soluciones auditivas', image: 'https://images.unsplash.com/photo-1576091160550-2173fba988a5?w=300&h=200&fit=crop' },
    ],
    implantes: [
      { name: 'Cochlear', description: 'Implantes cocleares', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop' },
      { name: 'MED-EL', description: 'Sistemas implantables', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop' },
    ],
    medicamentos: [],
    accesorios: [
      { name: 'Consumibles y accesorios', description: 'Filtros, domos, pilas y conectividad según prescripción.', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop' },
    ],
  };

  if (isAudiologa && audiologa) {
    return {
      ...base,
      accesorios: [
        { name: 'Soporte y accesorios', description: 'Según modelo y protocolo del centro.', image: base.accesorios[0].image },
      ],
    };
  }

  return base;
}

export function buildPublicStudies(isAudiologa, audiologa) {
  if (isAudiologa && audiologa) {
    const prof = [];
    if (audiologa.titulo || audiologa.especialidad) {
      prof.push({
        title: audiologa.titulo || audiologa.especialidad,
        institution: audiologa.hospitales?.[0] || 'Formación profesional',
        period: '',
      });
    }
    const esp = (audiologa.subespecialidades || []).slice(0, 6).map((t) => ({
      title: t,
      institution: 'Subespecialidad / área clínica',
      period: '',
    }));
    const certs = (audiologa.certificaciones || []).map((t) => ({
      title: t,
      institution: 'Certificación',
      period: '',
    }));
    return {
      profesional: prof,
      especializaciones: esp,
      maestrias: [],
      cursos: certs.length ? certs.slice(0, 2) : [],
      diplomados: certs.length > 2 ? certs.slice(2, 4) : [],
    };
  }

  return {
    profesional: [
      { title: 'Médico cirujano', institution: 'Universidad Nacional de Colombia', period: '2005-2011' },
    ],
    especializaciones: [
      { title: 'Otorrinolaringología', institution: 'Universidad de los Andes', period: '2012-2016' },
    ],
    maestrias: [{ title: 'Maestría en ciencias de la salud', institution: 'Institución de posgrado', period: '2017-2019' }],
    cursos: [{ title: 'Cirugía endoscópica nasal', institution: 'Hospital universitario', period: '2018' }],
    diplomados: [],
  };
}

export function buildConsultationInfo(isAudiologa, audiologa, professional) {
  if (isAudiologa && audiologa) {
    return {
      costos:
        'Los valores de consulta y procedimientos los confirma el centro al momento de agendar. Puedes solicitar una cotización orientativa por teléfono o correo.',
      preparacion:
        'Trae documento de identidad, orden médica si aplica, resultados previos de audiometría y lista de medicamentos. Para primera vez, llega 15 minutos antes.',
      contactoCentro: [
        professional.phone,
        professional.email,
        professional.address !== 'No especificado' ? professional.address : null,
      ]
        .filter(Boolean)
        .join(' · '),
    };
  }
  return {
    costos:
      'Tarifas según tipo de consulta y convenios. El equipo del consultorio confirmará costos y medios de pago al contactarte.',
    preparacion: 'Documento de identidad, historia clínica previa si la tienes, y orden médica si fue referido.',
    contactoCentro: `${professional.phone} · ${professional.email}`,
  };
}
