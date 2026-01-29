/**
 * Servicio para campañas de marketing.
 * Usado en Campañas de Marketing y en Nueva Cotización (descuento, nombre, fabricante, vigencia).
 */

const CAMPAIGNS_KEY = 'oirconecta_marketing_campaigns';

/** Marcas usadas en producto ofertado y en fabricante de campañas (deben coincidir para filtrar por marca). */
export const MARCAS = [
  'Widex',
  'Audioservice',
  'Oticon',
  'Resound',
  'Starkey',
  'Beltone',
  'Sonic',
  'Hansaton',
  'Bernafon',
];

const defaultCampaigns = [
  {
    id: 1,
    nombre: 'Promoción Audífonos Enero',
    tipo: 'Email',
    estado: 'activa',
    fechaInicio: '2026-01-01',
    fechaFin: '2026-01-31',
    fabricante: 'Widex',
    descuentoAprobado: 15,
    destinatarios: 1250,
    abiertos: 850,
    clicks: 320,
  },
  {
    id: 2,
    nombre: 'Descuento Consultas',
    tipo: 'Redes Sociales',
    estado: 'activa',
    fechaInicio: '2026-01-15',
    fechaFin: '2026-02-15',
    fabricante: 'Oticon',
    descuentoAprobado: 10,
    destinatarios: 5000,
    abiertos: 3200,
    clicks: 890,
  },
  {
    id: 3,
    nombre: 'Campaña Implantes',
    tipo: 'SMS',
    estado: 'pausada',
    fechaInicio: '2025-12-01',
    fechaFin: '2025-12-31',
    fabricante: 'Cochlear',
    descuentoAprobado: 5,
    destinatarios: 800,
    abiertos: 600,
    clicks: 150,
  },
];

const load = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CAMPAIGNS_KEY);
    if (raw) return JSON.parse(raw);
    return null;
  } catch {
    return null;
  }
};

const save = (list) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('campaignsUpdated'));
    return true;
  } catch (e) {
    console.error('Error al guardar campañas:', e);
    return false;
  }
};

/**
 * Obtiene todas las campañas de marketing.
 * @returns {Array<{id: number, nombre: string, tipo: string, estado: string, fechaInicio: string, fechaFin: string, fabricante: string, descuentoAprobado: number, ...}>}
 */
export const getCampaigns = () => {
  const stored = load();
  if (Array.isArray(stored) && stored.length > 0) return stored;
  save(defaultCampaigns);
  return defaultCampaigns;
};

/**
 * Guarda la lista de campañas (para uso desde CampanasPage).
 * @param {Array} list
 * @returns {boolean}
 */
export const setCampaigns = (list) => {
  if (!Array.isArray(list)) return false;
  return save(list);
};
