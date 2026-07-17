/**
 * /portal-crm/plantillas — Buzón de plantillas del centro propio.
 *
 * Reusa AdminComunicacionesPage pasando scope='crm' + fetchFn con el
 * token del CRM. El backend filtra a los grupos CRM_*.
 */
import React from 'react';
import AdminComunicacionesPage from '../admin/AdminComunicacionesPage';
import { getToken } from '../../services/apiClient';

const API = import.meta.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';

async function crmFetch(path, options = {}) {
  const token = getToken();
  const url = path.startsWith('http') ? path : `${API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { ok: res.ok, status: res.status, data };
}

export default function PlantillasPage() {
  return <AdminComunicacionesPage scope="crm" fetchFn={crmFetch} />;
}
