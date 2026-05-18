/**
 * Cliente JS para los endpoints F1 del directorio (descubrimiento y reseñas).
 * Todas las llamadas son públicas (skipAuth).
 */

import { request } from './apiClient';
import { DIRECTORY_DISCOVERY_API } from '../config/directoryDiscoveryApi';

const get = (path) => request(path, { method: 'GET', skipAuth: true });

const post = (path, body) =>
  request(path, {
    method: 'POST',
    skipAuth: true,
    body: body ? JSON.stringify(body) : '{}',
  });

const qs = (params = {}) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const fetchProfessions = () => get(DIRECTORY_DISCOVERY_API.professions);
export const fetchDepartments = () => get(DIRECTORY_DISCOVERY_API.departments);
export const fetchCities = (params = {}) => get(`${DIRECTORY_DISCOVERY_API.cities}${qs(params)}`);
export const fetchFeatured = (limit = 12) =>
  get(`${DIRECTORY_DISCOVERY_API.featured}${qs({ limit })}`);
export const fetchFeaturedByCity = (slug, limit = 12) =>
  get(`${DIRECTORY_DISCOVERY_API.featuredByCity(slug)}${qs({ limit })}`);
export const fetchFeaturedByProfession = (slug, limit = 12) =>
  get(`${DIRECTORY_DISCOVERY_API.featuredByProfession(slug)}${qs({ limit })}`);
export const fetchSponsored = () => get(DIRECTORY_DISCOVERY_API.sponsored);

/**
 * Búsqueda v2 con filtros. Cualquier parámetro vacío se omite.
 * @param {{ q?: string, professionSlug?: string, citySlug?: string, modalidad?: string,
 *           minRating?: number, poliza?: string, sort?: string, limit?: number, offset?: number }} params
 */
export const searchDirectoryV2 = (params = {}) =>
  get(`${DIRECTORY_DISCOVERY_API.searchV2}${qs(params)}`);

export const logProfileView = (profileId, body = {}) =>
  post(DIRECTORY_DISCOVERY_API.profileView(profileId), body);

export const fetchProfileReviews = (profileId, { limit = 20, offset = 0 } = {}) =>
  get(`${DIRECTORY_DISCOVERY_API.profileReviews(profileId)}${qs({ limit, offset })}`);

export const submitProfileReview = (profileId, body) =>
  post(DIRECTORY_DISCOVERY_API.profileReviews(profileId), body);

export const reportReview = (reviewId, body) =>
  post(DIRECTORY_DISCOVERY_API.reportReview(reviewId), body);

export const reportProfile = (profileId, body) =>
  post(DIRECTORY_DISCOVERY_API.reportProfile(profileId), body);
