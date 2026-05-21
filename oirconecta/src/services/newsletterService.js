/**
 * Cliente JS del newsletter (público + admin).
 */

import { request } from './apiClient';

const B = '/api/newsletter';

/** Suscripción pública. */
export function subscribeNewsletter({ nombre, email, telefono, ciudad, source }) {
  return request(`${B}/subscribe`, {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ nombre, email, telefono, ciudad, source }),
  });
}

/** Admin: listado de suscriptores. */
export function fetchSubscribers({ status, q, limit = 50, offset = 0 } = {}) {
  const sp = new URLSearchParams();
  if (status) sp.set('status', status);
  if (q) sp.set('q', q);
  sp.set('limit', String(limit));
  sp.set('offset', String(offset));
  return request(`${B}/admin/subscribers?${sp.toString()}`, { method: 'GET' });
}

/** Admin: métricas resumidas. */
export function fetchNewsletterStats() {
  return request(`${B}/admin/stats`, { method: 'GET' });
}

/** Admin: campañas. */
export function fetchCampaigns() {
  return request(`${B}/admin/campaigns`, { method: 'GET' });
}

export function createCampaign({ asunto, htmlContent, preheader, blogPostId, scheduledFor }) {
  return request(`${B}/admin/campaigns`, {
    method: 'POST',
    body: JSON.stringify({ asunto, htmlContent, preheader, blogPostId, scheduledFor }),
  });
}

export function sendCampaign(id) {
  return request(`${B}/admin/campaigns/${encodeURIComponent(id)}/send`, { method: 'POST' });
}
