/**
 * Catálogo de 20 acciones de marketing — referencia única compartida con el front.
 * El frontend lo lee vía GET /api/marketing/catalog.
 *
 * `precioSugeridoCOP` es solo orientativo para el admin; el precio real
 * lo fija al crear cada campaña.
 *
 * `disponible: false` permite al admin desactivar globalmente un formato
 * (toggle a nivel de catálogo, no por campaña).
 */

const CATALOG = [
  // ─── A. Display en sitio web ───
  { code: 'POPUP_BIENVENIDA',       categoria: 'DISPLAY', label: 'Pop-up de bienvenida',          descripcion: 'Modal al entrar al sitio. Imagen, GIF o video corto.',                            precioSugeridoCOP: 1500000, dim: '600×400 desktop · 340×480 mobile', soporta: ['imagen','gif','video'], disponible: true },
  { code: 'BANNER_HERO',            categoria: 'DISPLAY', label: 'Banner hero rotativo',          descripcion: 'Carrusel principal del home, hasta 3 slots en rotación.',                          precioSugeridoCOP: 2500000, dim: '1200×300 desktop · 375×200 mobile',  soporta: ['imagen','gif'],         disponible: true },
  { code: 'BANNER_SIDEBAR',         categoria: 'DISPLAY', label: 'Banner lateral sticky',         descripcion: 'Columna derecha en directorio, acompaña el scroll. Solo desktop.',                precioSugeridoCOP: 1200000, dim: '300×600',                            soporta: ['imagen','gif'],         disponible: true },
  { code: 'BANNER_FOOTER',          categoria: 'DISPLAY', label: 'Banner en footer',              descripcion: 'Banda horizontal al fondo de todas las páginas.',                                 precioSugeridoCOP: 800000,  dim: '970×90 desktop · 375×60 mobile',     soporta: ['imagen','gif'],         disponible: true },
  { code: 'EXIT_INTENT',            categoria: 'DISPLAY', label: 'Exit-intent overlay',           descripcion: 'Se activa al detectar intención de abandono. Solo 1 por sesión.',                 precioSugeridoCOP: 1300000, dim: '500×350',                            soporta: ['imagen','gif'],         disponible: true },
  { code: 'WEB_PUSH_TOAST',         categoria: 'DISPLAY', label: 'Notificación en sitio',         descripcion: 'Toast en esquina inferior derecha tras N segundos. Sin permiso del navegador.',  precioSugeridoCOP: 900000,  dim: '320×100',                            soporta: ['imagen'],               disponible: true },
  { code: 'SEARCH_DESTACADO',       categoria: 'DISPLAY', label: 'Destacado en búsquedas',        descripcion: 'Posición 1 en resultados por especialidad + ciudad. 1 destacado por combo.',     precioSugeridoCOP: 1800000, dim: '—',                                   soporta: ['perfil'],               disponible: true },
  { code: 'COMPARADOR_BANNER',      categoria: 'DISPLAY', label: 'Banner en Comparador',          descripcion: 'Banner integrado entre resultados del comparador de audífonos.',                   precioSugeridoCOP: 1500000, dim: '728×90 desktop · 375×60 mobile',     soporta: ['imagen','gif'],         disponible: true },
  { code: 'BLOG_VIDEO_PREROLL',     categoria: 'DISPLAY', label: 'Video pre-roll en blog',        descripcion: 'Video corto antes del contenido del artículo. Skip a los 5s.',                    precioSugeridoCOP: 2000000, dim: '16:9',                                soporta: ['video'],                disponible: true },
  { code: 'BLOG_PATROCINADOR',      categoria: 'DISPLAY', label: '"Patrocinado por" en blog',     descripcion: 'Bloque al final de artículos con logo + tagline + CTA.',                          precioSugeridoCOP: 700000,  dim: '800×120',                            soporta: ['imagen'],               disponible: true },
  { code: 'MOBILE_INTERSTICIAL',    categoria: 'DISPLAY', label: 'Intersticial mobile',           descripcion: 'Pantalla completa entre páginas en mobile. 1 por sesión.',                        precioSugeridoCOP: 1400000, dim: '320×480',                            soporta: ['imagen','gif'],         disponible: true },
  { code: 'MOBILE_STICKY_FOOTER',   categoria: 'DISPLAY', label: 'Sticky footer mobile',          descripcion: 'Banda fija inferior toda la sesión mobile.',                                       precioSugeridoCOP: 900000,  dim: '375×60',                             soporta: ['imagen'],               disponible: true },

  // ─── B. Contenido y lead generation ───
  { code: 'BRANDED_CONTENT',        categoria: 'CONTENIDO', label: 'Artículo de marca',           descripcion: 'Artículo blog patrocinado con etiqueta "Contenido patrocinado".',                 precioSugeridoCOP: 2200000, dim: '—', soporta: ['articulo'],       disponible: true },
  { code: 'LEAD_MAGNET',            categoria: 'CONTENIDO', label: 'Lead magnet patrocinado',     descripcion: 'PDF/guía descargable con branding del anunciante. Captura email.',                precioSugeridoCOP: 1800000, dim: '—', soporta: ['pdf'],            disponible: true },
  { code: 'WEBINAR',                categoria: 'CONTENIDO', label: 'Webinar patrocinado',         descripcion: 'Charla en vivo con landing de registro y patrocinador visible.',                 precioSugeridoCOP: 3500000, dim: '—', soporta: ['evento'],         disponible: true },
  { code: 'COMPARADOR_FICHA',       categoria: 'CONTENIDO', label: 'Ficha en Comparador',         descripcion: 'Ficha técnica de audífono/implante con specs en el Comparador.',                 precioSugeridoCOP: 1200000, dim: '—', soporta: ['ficha'],          disponible: true },
  { code: 'ENCUESTA_NPS',           categoria: 'CONTENIDO', label: 'Encuesta patrocinada',        descripcion: 'Encuesta de 3 preguntas máx, exportable. Investigación de mercado.',             precioSugeridoCOP: 1500000, dim: '—', soporta: ['encuesta'],       disponible: true },

  // ─── C. Email / Newsletter ───
  { code: 'NEWSLETTER_MENCION',     categoria: 'EMAIL', label: 'Mención en newsletter',           descripcion: 'Bloque sponsor en newsletter mensual de pacientes (logo + texto + CTA).',         precioSugeridoCOP: 1000000, dim: '600×200', soporta: ['imagen'],     disponible: true },
  { code: 'NEWSLETTER_DEDICADO',    categoria: 'EMAIL', label: 'Newsletter dedicado',             descripcion: 'Envío exclusivo a toda la base o segmento con contenido del anunciante.',        precioSugeridoCOP: 3000000, dim: '—',       soporta: ['html'],       disponible: true },
  { code: 'EMAIL_BIENVENIDA_PROF',  categoria: 'EMAIL', label: 'Sponsor en bienvenida prof.',     descripcion: 'Bloque patrocinado en el email de bienvenida a nuevos profesionales.',           precioSugeridoCOP: 700000,  dim: '600×150', soporta: ['imagen'],     disponible: true },
];

const BY_CODE = Object.fromEntries(CATALOG.map((a) => [a.code, a]));

/** Categoría → label en español para UI */
const CATEGORIES = {
  DISPLAY:   'Display en sitio web',
  CONTENIDO: 'Contenido y lead generation',
  EMAIL:     'Email y newsletter',
};

module.exports = { CATALOG, BY_CODE, CATEGORIES };
