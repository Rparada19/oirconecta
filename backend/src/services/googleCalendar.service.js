/**
 * C9 — Sincronización con Google Calendar del profesional (Plan 2/3).
 *
 * OAuth 2.0 authorization code flow con offline access:
 *   1. Redirect al profesional a Google auth URL con state=profileId.
 *   2. Google redirige a /callback con code.
 *   3. Intercambiamos code → refresh_token + access_token.
 *   4. Guardamos refresh_token en google_calendar_channels.
 *
 * Sincronización actual (push OírConecta → Google):
 *   - createEventForAppointment: al crear cita multi-tenant.
 *   - deleteEventForAppointment: al cancelar cita.
 *   - updateEventForAppointment: al reagendar.
 *
 * Pull (Google → OírConecta) queda para siguiente iteración con webhooks push.
 *
 * Sin librería `googleapis` — usa fetch directo contra REST v3 para mantener
 * el bundle backend liviano.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OAUTH_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const OAUTH_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const CAL_BASE = 'https://www.googleapis.com/calendar/v3';
const SCOPES = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/userinfo.email'];

function env(name, required = true) {
  const v = process.env[name];
  if (required && !v) throw new Error(`Falta variable de entorno ${name}`);
  return v;
}

function buildAuthUrl(profileId) {
  const params = new URLSearchParams({
    client_id: env('GOOGLE_OAUTH_CLIENT_ID'),
    redirect_uri: env('GOOGLE_OAUTH_REDIRECT_URI'),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent', // fuerza a Google a devolver refresh_token de nuevo
    state: profileId,
    include_granted_scopes: 'true',
  });
  return `${OAUTH_AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForTokens(code) {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env('GOOGLE_OAUTH_CLIENT_ID'),
      client_secret: env('GOOGLE_OAUTH_CLIENT_SECRET'),
      redirect_uri: env('GOOGLE_OAUTH_REDIRECT_URI'),
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google OAuth token exchange falló: ${data.error_description || data.error || res.status}`);
  return data; // { access_token, refresh_token, expires_in, scope, token_type, id_token }
}

async function refreshAccessToken(refreshToken) {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env('GOOGLE_OAUTH_CLIENT_ID'),
      client_secret: env('GOOGLE_OAUTH_CLIENT_SECRET'),
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google refresh falló: ${data.error_description || data.error || res.status}`);
  return data; // { access_token, expires_in, scope, token_type }
}

async function fetchUserEmail(accessToken) {
  const res = await fetch(OAUTH_USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return null;
  const d = await res.json();
  return d.email || null;
}

/**
 * Devuelve un access_token válido para el profileId. Refresca si expira en <60s.
 */
async function getFreshAccessToken(profileId) {
  const ch = await prisma.googleCalendarChannel.findUnique({ where: { profileId } });
  if (!ch) throw Object.assign(new Error('Google Calendar no conectado'), { code: 'NOT_CONNECTED' });
  const now = Date.now();
  const bufferMs = 60 * 1000;
  if (ch.accessToken && ch.expiresAt && ch.expiresAt.getTime() - bufferMs > now) {
    return { accessToken: ch.accessToken, channel: ch };
  }
  const refreshed = await refreshAccessToken(ch.refreshToken);
  const expiresAt = new Date(now + (refreshed.expires_in || 3600) * 1000);
  const updated = await prisma.googleCalendarChannel.update({
    where: { profileId },
    data: { accessToken: refreshed.access_token, expiresAt },
  });
  return { accessToken: refreshed.access_token, channel: updated };
}

// ═════════ OAuth callback: guardar canal ═════════

async function connectFromCallback(profileId, code) {
  const tokens = await exchangeCodeForTokens(code);
  if (!tokens.refresh_token) {
    throw new Error('Google no devolvió refresh_token. Revoca acceso desde https://myaccount.google.com/permissions e intenta de nuevo.');
  }
  const email = await fetchUserEmail(tokens.access_token).catch(() => null);
  const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);
  return prisma.googleCalendarChannel.upsert({
    where: { profileId },
    create: {
      profileId,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      expiresAt,
      scopes: tokens.scope || null,
      email,
      lastSyncAt: new Date(),
    },
    update: {
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      expiresAt,
      scopes: tokens.scope || null,
      email,
      lastSyncAt: new Date(),
    },
  });
}

async function disconnect(profileId) {
  await prisma.googleCalendarChannel.deleteMany({ where: { profileId } });
  return { ok: true };
}

async function getStatus(profileId) {
  const ch = await prisma.googleCalendarChannel.findUnique({
    where: { profileId },
    select: { email: true, calendarId: true, lastSyncAt: true, createdAt: true },
  });
  return {
    connected: !!ch,
    email: ch?.email || null,
    calendarId: ch?.calendarId || null,
    lastSyncAt: ch?.lastSyncAt || null,
    connectedAt: ch?.createdAt || null,
  };
}

// ═════════ Push: crear / update / delete event ═════════

function buildEventBodyFromAppointment(appt, opts = {}) {
  // appt.fecha es Date (medianoche UTC) + appt.hora "HH:MM" en TZ profesional.
  // Construimos start/end como fecha+hora local usando la TZ del profesional.
  const tz = opts.timezone || 'America/Bogota';
  const yyyy = appt.fecha.toISOString().slice(0, 10);
  const [h, m] = (appt.hora || '00:00').split(':').map(Number);
  const dur = appt.durationMinutes || 30;
  const startLocal = `${yyyy}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`;
  const endMinTotal = h * 60 + m + dur;
  const eh = Math.floor(endMinTotal / 60);
  const em = endMinTotal % 60;
  const endLocal = `${yyyy}T${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}:00`;

  const summary = `${appt.tipoConsulta ? appt.tipoConsulta + ' — ' : ''}${appt.patientName || 'Paciente'}`;
  const description = [
    `Paciente: ${appt.patientName || '—'}`,
    appt.patientPhone ? `Tel: ${appt.patientPhone}` : null,
    appt.patientEmail ? `Email: ${appt.patientEmail}` : null,
    appt.motivo ? `Motivo: ${appt.motivo}` : null,
    ``,
    `Reservada desde OírConecta.`,
  ].filter(Boolean).join('\n');

  return {
    summary,
    description,
    start: { dateTime: startLocal, timeZone: tz },
    end:   { dateTime: endLocal,   timeZone: tz },
    reminders: { useDefault: true },
  };
}

async function createEventForAppointment(profileId, appointment, opts = {}) {
  try {
    const { accessToken, channel } = await getFreshAccessToken(profileId);
    const body = buildEventBodyFromAppointment(appointment, opts);
    const res = await fetch(`${CAL_BASE}/calendars/${encodeURIComponent(channel.calendarId)}/events`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Google create failed: ${data.error?.message || res.status}`);
    await prisma.appointment.update({ where: { id: appointment.id }, data: { googleEventId: data.id } });
    await prisma.googleCalendarChannel.update({ where: { profileId }, data: { lastSyncAt: new Date() } });
    return data.id;
  } catch (e) {
    if (e.code === 'NOT_CONNECTED') return null;
    console.error('[gcal] createEventForAppointment error:', e.message);
    return null;
  }
}

async function updateEventForAppointment(profileId, appointment, opts = {}) {
  if (!appointment.googleEventId) {
    // Si no existe en Google (porque se creó antes de conectar), lo creamos ahora.
    return createEventForAppointment(profileId, appointment, opts);
  }
  try {
    const { accessToken, channel } = await getFreshAccessToken(profileId);
    const body = buildEventBodyFromAppointment(appointment, opts);
    const res = await fetch(`${CAL_BASE}/calendars/${encodeURIComponent(channel.calendarId)}/events/${appointment.googleEventId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok && res.status !== 404) {
      const data = await res.json().catch(() => ({}));
      throw new Error(`Google update failed: ${data.error?.message || res.status}`);
    }
    await prisma.googleCalendarChannel.update({ where: { profileId }, data: { lastSyncAt: new Date() } });
    return appointment.googleEventId;
  } catch (e) {
    if (e.code === 'NOT_CONNECTED') return null;
    console.error('[gcal] updateEventForAppointment error:', e.message);
    return null;
  }
}

async function deleteEventForAppointment(profileId, appointment) {
  if (!appointment.googleEventId) return null;
  try {
    const { accessToken, channel } = await getFreshAccessToken(profileId);
    const res = await fetch(`${CAL_BASE}/calendars/${encodeURIComponent(channel.calendarId)}/events/${appointment.googleEventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // 200/204 ok; 410 gone también aceptable
    if (!res.ok && res.status !== 404 && res.status !== 410) {
      const data = await res.json().catch(() => ({}));
      throw new Error(`Google delete failed: ${data.error?.message || res.status}`);
    }
    await prisma.appointment.update({ where: { id: appointment.id }, data: { googleEventId: null } });
    await prisma.googleCalendarChannel.update({ where: { profileId }, data: { lastSyncAt: new Date() } });
    return true;
  } catch (e) {
    if (e.code === 'NOT_CONNECTED') return null;
    console.error('[gcal] deleteEventForAppointment error:', e.message);
    return null;
  }
}

/**
 * True si el profesional tiene canal Google conectado. Ligero (no refresca).
 */
async function isConnected(profileId) {
  const row = await prisma.googleCalendarChannel.findUnique({
    where: { profileId }, select: { id: true },
  });
  return !!row;
}

module.exports = {
  buildAuthUrl,
  connectFromCallback,
  disconnect,
  getStatus,
  isConnected,
  createEventForAppointment,
  updateEventForAppointment,
  deleteEventForAppointment,
};
