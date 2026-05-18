/**
 * Endpoints F1 del directorio (descubrimiento, reseñas, reportes).
 * Debe quedar alineado con `backend/src/routes/directoryDiscovery.routes.js`
 * y `backend/src/routes/directoryReviews.routes.js`.
 */

const B = '/api/directory';

export const DIRECTORY_DISCOVERY_API = {
  professions: `${B}/professions`,
  departments: `${B}/departments`,
  cities: `${B}/cities`,
  featured: `${B}/featured`,
  featuredByCity: (slug) => `${B}/featured/by-city/${encodeURIComponent(slug)}`,
  featuredByProfession: (slug) => `${B}/featured/by-profession/${encodeURIComponent(slug)}`,
  sponsored: `${B}/sponsored`,
  searchV2: `${B}/search-v2`,
  profileView: (profileId) => `${B}/profiles/${encodeURIComponent(profileId)}/views`,
  profileReviews: (profileId) => `${B}/profiles/${encodeURIComponent(profileId)}/reviews`,
  reportReview: (reviewId) => `${B}/reviews/${encodeURIComponent(reviewId)}/report`,
  reportProfile: (profileId) => `${B}/profiles/${encodeURIComponent(profileId)}/report`,
};
