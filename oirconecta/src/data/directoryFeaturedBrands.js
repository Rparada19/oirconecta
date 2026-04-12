/**
 * Marcas destacadas en el directorio (showcase mensual).
 * — Cambiar `period` y el array `slots` cada mes, o marcar `featured: false` hasta la próxima rotación.
 * — Máximo 3 entradas con `featured: true` (el componente recorta a 3).
 */

export const DIRECTORY_FEATURED_BRANDS_PERIOD = '2026-04';

/** @typedef {{ slug: string; name: string; path: string; tagline: string; rating: number; badge: 'Destacado' | 'Top marca' | 'Recomendado'; featured: boolean; order: number; logoUrl?: string | null }} DirectoryFeaturedBrandSlot */

/** @type {DirectoryFeaturedBrandSlot[]} */
const SLOTS = [
  {
    slug: 'phonak',
    name: 'Phonak',
    path: '/audifonos/phonak',
    tagline: 'Sonido natural y conexión con lo que te rodea.',
    rating: 4.9,
    badge: 'Destacado',
    featured: true,
    order: 1,
    logoUrl: null,
  },
  {
    slug: 'oticon',
    name: 'Oticon',
    path: '/audifonos/oticon',
    tagline: 'Pensada para entender mejor las conversaciones del día a día.',
    rating: 4.85,
    badge: 'Recomendado',
    featured: true,
    order: 2,
    logoUrl: null,
  },
  {
    slug: 'widex',
    name: 'Widex',
    path: '/audifonos/widex',
    tagline: 'Matices musicales y sensación de confort al escuchar.',
    rating: 4.88,
    badge: 'Top marca',
    featured: true,
    order: 3,
    logoUrl: null,
  },
  {
    slug: 'signia',
    name: 'Signia',
    path: '/audifonos/signia',
    tagline: 'Tecnología intuitiva para moverte con soltura.',
    rating: 4.8,
    badge: 'Recomendado',
    featured: false,
    order: 10,
    logoUrl: null,
  },
];

const MAX_SHOWCASE = 3;

export function getDirectoryShowcaseBrands() {
  return [...SLOTS]
    .filter((b) => b.featured)
    .sort((a, b) => a.order - b.order)
    .slice(0, MAX_SHOWCASE);
}
