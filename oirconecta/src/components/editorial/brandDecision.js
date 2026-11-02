// Lógica de apoyo a la decisión para páginas de marca.
// Solo deriva rasgos de la información que ya publica cada página (categoría y
// características); no inventa especificaciones.

const has = (txt, words) => words.some((w) => txt.includes(w));

export const NEEDS = {
  audifonos: [
    { id: 'discreto', label: 'Que casi no se note', short: 'Discreto' },
    { id: 'recargable', label: 'No cambiar pilas', short: 'Recargable' },
    { id: 'conectividad', label: 'Llamadas y TV directo al oído', short: 'Bluetooth' },
    { id: 'potencia', label: 'Pérdida severa o profunda', short: 'Alta potencia' },
    { id: 'agua', label: 'Resistente a sudor y humedad', short: 'Resistente al agua' },
    { id: 'inteligente', label: 'Que se ajuste solo a cada lugar', short: 'Ajuste automático' },
  ],
  implantes: [
    { id: 'discreto', label: 'Procesador discreto', short: 'Discreto' },
    { id: 'recargable', label: 'Batería recargable', short: 'Recargable' },
    { id: 'conectividad', label: 'Conexión directa al celular', short: 'Bluetooth' },
    { id: 'agua', label: 'Uso en agua y deporte', short: 'Resistente al agua' },
    { id: 'osea', label: 'Pérdida conductiva o de un solo oído', short: 'Conducción ósea' },
    { id: 'ninos', label: 'Pensado para niños', short: 'Pediátrico' },
  ],
};

export function traitsOf(p) {
  const cat = (p.categoria || '').toLowerCase();
  const txt = [p.nombre, p.categoria, p.descripcion, ...(p.caracteristicas || [])].join(' ').toLowerCase();
  const t = new Set();
  if (['cic', 'iic', 'itc'].some((c) => cat === c) || cat.includes('off-the-ear') || has(txt, ['invisible', 'discret', 'ultra-peque', 'pequeñ'])) t.add('discreto');
  if (has(txt, ['recargable', 'carga', 'batería de litio', 'li-ion'])) t.add('recargable');
  if (has(txt, ['bluetooth', 'streaming', 'auracast', 'le audio', 'iphone', 'android', 'made for'])) t.add('conectividad');
  if (has(txt, ['potencia', 'power', 'severa', 'profunda', 'superpower']) || /\b(up|sp|hp)\b/.test(txt)) t.add('potencia');
  if (has(txt, ['agua', 'ip6', 'ip5', 'ip57', 'ip68', 'sumergible', 'sudor'])) t.add('agua');
  if (has(txt, ['inteligen', 'aprendizaje', 'learn', 'dnn', 'neural', 'automátic', 'adaptativ', 'edge ai']) || /\bia\b/.test(txt)) t.add('inteligente');
  if (has(txt, ['conducción ósea', 'conduccion osea', 'baha', 'bonebridge', 'osia', 'adhear'])) t.add('osea');
  if (has(txt, ['pediátric', 'pediatric', 'niño', 'infantil'])) t.add('ninos');
  return t;
}

export function scoreProducts(productos, selected) {
  return productos
    .map((p, i) => {
      const t = traitsOf(p);
      const hits = selected.filter((s) => t.has(s));
      return { p, i, t, hits, score: hits.length + (p.destacado ? 0.1 : 0) };
    })
    .sort((a, b) => (selected.length ? b.score - a.score || a.i - b.i : a.i - b.i));
}

// Guía de estilos: información general y verificable sobre cada formato.
export const STYLE_GUIDE = {
  RIC: {
    nombre: 'RIC · Auricular en el canal',
    para: 'Pérdidas leves a severas. Es el formato más elegido hoy.',
    pros: ['Discreto detrás de la oreja', 'Sonido natural', 'Suele ser recargable y con Bluetooth'],
    ojo: 'El auricular está en el canal y requiere limpieza frecuente.',
  },
  BTE: {
    nombre: 'BTE · Retroauricular',
    para: 'Pérdidas moderadas a profundas, niños y quien busca robustez.',
    pros: ['Más potencia disponible', 'Fácil de manipular', 'Muy durable'],
    ojo: 'Es más visible que otros formatos.',
  },
  ITC: {
    nombre: 'ITC · Intracanal',
    para: 'Pérdidas leves a moderadas, a la medida de tu oído.',
    pros: ['Hecho a la medida', 'Discreto', 'Sin nada detrás de la oreja'],
    ojo: 'Menos espacio para batería y conectividad que un RIC.',
  },
  CIC: {
    nombre: 'CIC / IIC · Casi invisible',
    para: 'Pérdidas leves a moderadas en canales auditivos con espacio suficiente.',
    pros: ['Prácticamente invisible', 'Aprovecha la forma natural del oído'],
    ojo: 'Pilas pequeñas y menos funciones; no sirve para todos los oídos.',
  },
  'Procesador externo': {
    nombre: 'Procesador retroauricular',
    para: 'La opción más versátil para usuarios de implante coclear.',
    pros: ['Más funciones y accesorios', 'Opciones de batería flexibles'],
    ojo: 'Va detrás de la oreja, como un audífono grande.',
  },
  'Off-the-ear': {
    nombre: 'Procesador fuera del oído',
    para: 'Quien prioriza comodidad y discreción con su implante.',
    pros: ['Nada sobre la oreja', 'Compatible con gafas', 'Muy discreto bajo el cabello'],
    ojo: 'Menos opciones de accesorios que el retroauricular.',
  },
  'Conducción ósea': {
    nombre: 'Conducción ósea',
    para: 'Pérdidas conductivas o mixtas, o sordera en un solo oído.',
    pros: ['Transmite el sonido por el hueso', 'Evita el canal auditivo'],
    ojo: 'Requiere evaluación de candidatura por otorrino.',
  },
  'Implante interno': {
    nombre: 'Implante interno',
    para: 'La parte quirúrgica del sistema; la elige el cirujano contigo.',
    pros: ['Diseñado para durar toda la vida', 'Compatible con futuras actualizaciones de procesador'],
    ojo: 'Se define en la valoración médica, no por preferencia estética.',
  },
  Pediátrico: {
    nombre: 'Pensado para niños',
    para: 'Bebés y niños con implante coclear.',
    pros: ['Diseño seguro y resistente', 'Opciones de sujeción y colores'],
    ojo: 'El equipo pediátrico define tiempos y accesorios.',
  },
};

export const QUESTIONS = {
  audifonos: [
    '¿Qué tipo y grado de pérdida muestra mi audiometría?',
    '¿Qué formato me recomiendas para mi oído y mi estilo de vida?',
    '¿Puedo probarlo antes de decidir? ¿Por cuánto tiempo?',
    '¿Qué incluye el precio: controles, ajustes, garantía, accesorios?',
    '¿Cómo funciona la conexión con mi celular?',
    '¿Qué pasa si se daña o lo pierdo?',
  ],
  implantes: [
    '¿Soy candidato a implante coclear o a conducción ósea?',
    '¿Qué cubre mi EPS o mi plan de salud en este proceso?',
    '¿Cómo es la cirugía y la recuperación?',
    '¿Cuánto dura la rehabilitación auditiva y quién me acompaña?',
    '¿Qué procesador se adapta mejor a mi rutina?',
    '¿Cómo se actualiza el procesador en el futuro?',
  ],
};
