/**
 * Contenido editable de la home (sin tocar lógica de rutas).
 * VITE_HOME_VIDEO_EMBED_URL: URL completa de embed (YouTube/Vimeo), ej. https://www.youtube.com/embed/VIDEO_ID
 */

export const HOME_VIDEO_EMBED_URL = import.meta.env.VITE_HOME_VIDEO_EMBED_URL || '';

export const RECOMMENDATION_OF_MONTH = {
  label: 'Recomendación del mes',
  product: 'Un audífono que prioriza la voz cuando el mundo se pone ruidoso',
  brandLine: 'Tecnología que se adapta al café, la familia o la calle —para que no tengas que “esforzarte” tanto por escuchar.',
  forWho:
    'Te puede encajar si subes mucho el televisor, te repiten a menudo o llegas casado del ruido al final del día. Tu audiólogo confirma si es para ti.',
  disclaimer: 'Es una idea general para conversar en consulta; no sustituye tu valoración.',
  ctaLabel: 'Explorar marcas y estilos',
  ctaTo: '/audifonos',
};

export const TRUST_POINTS = [
  { title: 'Pasos claros', subtitle: 'Sin letra pequeña en el primer contacto' },
  { title: 'Red de especialistas', subtitle: 'Audiólogos y médicos en varias ciudades' },
  { title: 'Tú decides el ritmo', subtitle: 'Información primero, cita cuando tú quieras' },
];
