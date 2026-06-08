/**
 * Mapeo de URL a "tipo de página" para segmentación publicitaria.
 * Sin tabla persistente (M1): solo reglas en código que cubren todas las
 * rutas conocidas del portal. En M2 esto pasa a PageRegistry en BD con
 * auto-registro al publicar entidades.
 */

const PAGE_TYPES = [
  // type, label, pattern (regex), example
  { type: 'home',                  label: 'Home',                          re: /^\/$/ },
  { type: 'busqueda',              label: 'Búsqueda directorio',           re: /^\/buscar(\/.*)?$/ },
  { type: 'directorio',            label: 'Directorio (índice)',           re: /^\/directorio\/?$/ },
  { type: 'directorio_profesion',  label: 'Directorio por profesión',      re: /^\/directorio\/profesion\/[^\/]+\/?$/ },
  { type: 'directorio_ciudad',     label: 'Directorio por ciudad',         re: /^\/directorio\/ciudad\/[^\/]+\/?$/ },
  { type: 'perfil_profesional',    label: 'Perfil profesional',            re: /^\/profesional\/[a-f0-9-]+\/?$/ },
  { type: 'blog_listado',          label: 'Blog (índice)',                 re: /^\/blog\/?$/ },
  { type: 'blog_categoria',        label: 'Blog por categoría',            re: /^\/blog\/categoria\/[^\/]+\/?$/ },
  { type: 'blog_articulo',         label: 'Artículo del blog',             re: /^\/blog\/(?!categoria|tag)[^\/]+\/?$/ },
  { type: 'blog_tag',              label: 'Blog por tag',                  re: /^\/blog\/tag\/[^\/]+\/?$/ },
  { type: 'audifonos_listado',     label: 'Audífonos (índice)',            re: /^\/audifonos\/?$/ },
  { type: 'audifonos_marca',       label: 'Audífonos: marca',              re: /^\/audifonos\/[^\/]+\/?$/ },
  { type: 'implantes_listado',     label: 'Implantes (índice)',            re: /^\/implantes\/?$/ },
  { type: 'implantes_marca',       label: 'Implantes: marca',              re: /^\/implantes\/[^\/]+\/?$/ },
  { type: 'comparador',            label: 'Comparador',                    re: /^\/comparador(-ia)?\/?$/ },
  { type: 'comparador_resultados', label: 'Comparador resultados',         re: /^\/comparador\/resultados\/?$/ },
  { type: 'marketplace',           label: 'Marketplace',                   re: /^\/ecommerce\/?$/ },
  { type: 'marketplace_producto',  label: 'Marketplace: producto',         re: /^\/ecommerce\/[^\/]+\/?$/ },
  { type: 'agendar',               label: 'Agendar cita',                  re: /^\/agendar\/?$/ },
  { type: 'nosotros',              label: 'Nosotros',                      re: /^\/nosotros\/?$/ },
  { type: 'servicios',             label: 'Servicios',                     re: /^\/servicios\/?$/ },
  { type: 'contacto',              label: 'Contacto',                      re: /^\/contacto\/?$/ },
  { type: 'portal_profesional',    label: 'Portal del profesional',        re: /^\/portal-profesional(\/.*)?$/ },
];

/** Devuelve el tipo canónico de una ruta, o 'pagina_estatica' si no encaja. */
function pathToPageType(rawPath) {
  if (!rawPath) return 'pagina_estatica';
  const path = String(rawPath).split('?')[0].split('#')[0];
  for (const def of PAGE_TYPES) {
    if (def.re.test(path)) return def.type;
  }
  return 'pagina_estatica';
}

/** Lista plana de { type, label } para el frontend. */
function listPageTypes() {
  return PAGE_TYPES.map(({ type, label }) => ({ type, label }))
    .concat([{ type: 'pagina_estatica', label: 'Página estática (otras)' }]);
}

/**
 * Decide si una campaña debe mostrarse en un path dado, según su pagesConfig.
 * Defaults seguros: si no hay pagesConfig, se considera mode='all'.
 */
function campaignMatchesPath(campaign, path) {
  const cfg = campaign?.pagesConfig || { mode: 'all' };
  const cleanPath = String(path || '').split('?')[0];
  const pageType = pathToPageType(cleanPath);

  const excluded = Array.isArray(cfg.excludePaths) && cfg.excludePaths.includes(cleanPath);
  if (excluded) return false;

  if (cfg.mode === 'specific') {
    return Array.isArray(cfg.specificPaths) && cfg.specificPaths.includes(cleanPath);
  }
  if (cfg.mode === 'types') {
    return Array.isArray(cfg.types) && cfg.types.includes(pageType);
  }
  // 'all' o sin mode → siempre match (salvo exclusión)
  return true;
}

module.exports = { pathToPageType, listPageTypes, campaignMatchesPath, PAGE_TYPES };
