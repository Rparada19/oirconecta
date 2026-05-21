/**
 * Rutas REST del directorio público.
 * Debe mantenerse alineado con `backend/src/routes/directory.routes.js` y el `router` en `backend/src/routes/index.js` (`/api/directory`).
 */

const B = '/api/directory';

export const DIRECTORY_API = {
  search: `${B}/search`,
  profilePublic: (profileId) => `${B}/profiles/${encodeURIComponent(profileId)}`,
  profileInquiry: (profileId) => `${B}/profiles/${encodeURIComponent(profileId)}/inquiry`,
  profileWhatsappStat: (profileId) => `${B}/profiles/${encodeURIComponent(profileId)}/stats/whatsapp`,
  profileCallStat: (profileId) => `${B}/profiles/${encodeURIComponent(profileId)}/stats/call`,
  register: `${B}/register`,
  login: `${B}/auth/login`,
  me: `${B}/me`,
  myStats: `${B}/me/stats`,
  meInquiries: `${B}/me/inquiries`,
  meInquiry: (inquiryId) => `${B}/me/inquiries/${encodeURIComponent(inquiryId)}`,
  /** Listado moderación (JWT CRM + rol ADMIN) */
  adminProfiles: `${B}/admin/profiles`,
  adminProfileStatus: (accountId) => `${B}/admin/profiles/${encodeURIComponent(accountId)}`,
  adminStats: `${B}/admin/stats`,
};
