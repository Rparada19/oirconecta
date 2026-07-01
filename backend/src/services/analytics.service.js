/**
 * D1 — Analytics first-party.
 *
 * Ingesta de eventos del sitio + sesiones agregadas.
 * Ley 1581 (habeas data CO):
 *   - IP se guarda enmascarada (`ipMasked`) — nunca completa.
 *   - `visitorId` es un id anónimo (uuid), no PII.
 *   - Lookup geo por IP se hace con servicio externo (ip-api.com) cacheado
 *     en memoria; solo guardamos {city, region, country} derivados.
 */

const { PrismaClient } = require('@prisma/client');
const { UAParser } = require('ua-parser-js');

const prisma = new PrismaClient();

// ─────────── Utilidades de anonimización ───────────

function maskIp(ip) {
  if (!ip) return null;
  const clean = String(ip).replace(/^::ffff:/, '').trim();
  // IPv4 → últimos octetos
  if (/^\d+\.\d+\.\d+\.\d+$/.test(clean)) {
    return clean.replace(/\.\d+$/, '.X');
  }
  // IPv6 → mantén primeros 3 hextets
  const parts = clean.split(':');
  if (parts.length > 3) return `${parts.slice(0, 3).join(':')}::X`;
  return 'X.X.X.X';
}

function pickIpFromReq(req) {
  const raw = (req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '').toString();
  const first = raw.split(',')[0].trim();
  return first.replace(/^::ffff:/, '') || null;
}

// ─────────── Parseo user agent ───────────

function parseUserAgent(uaString) {
  if (!uaString) return { device: null, os: null, browser: null };
  const p = new UAParser(uaString);
  const r = p.getResult();
  // ua-parser marca device.type = mobile|tablet|smarttv|... . undefined = desktop.
  let device = r.device.type || 'desktop';
  if (device === 'smarttv' || device === 'console' || device === 'embedded') device = 'other';
  return {
    device,
    os: r.os.name || null,
    browser: r.browser.name || null,
  };
}

// ─────────── Geo lookup con caché en memoria ───────────

const GEO_CACHE = new Map(); // ip → { city, region, country, ts }
const GEO_TTL_MS = 24 * 3600 * 1000;
const GEO_MAX = 5000;

async function lookupGeo(ip) {
  if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { city: null, region: null, country: null };
  }
  const cached = GEO_CACHE.get(ip);
  if (cached && Date.now() - cached.ts < GEO_TTL_MS) return cached;
  try {
    // ip-api.com — gratis 45 req/min, sin API key para uso HTTP no comercial.
    // En producción con volumen alto, migrar a MaxMind local o ipapi.co pago.
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) throw new Error(`geo HTTP ${res.status}`);
    const d = await res.json();
    if (d.status !== 'success') throw new Error(d.message || 'geo status not success');
    const out = {
      city: d.city || null,
      region: d.regionName || null,
      country: d.countryCode || null,
      ts: Date.now(),
    };
    if (GEO_CACHE.size >= GEO_MAX) {
      // Simple eviction: borra la mitad más vieja
      const arr = [...GEO_CACHE.entries()].sort((a, b) => a[1].ts - b[1].ts);
      for (let i = 0; i < arr.length / 2; i++) GEO_CACHE.delete(arr[i][0]);
    }
    GEO_CACHE.set(ip, out);
    return out;
  } catch (e) {
    return { city: null, region: null, country: null };
  }
}

// ─────────── Track event ───────────

/**
 * Guarda un evento + upserta la sesión con conteo/timestamps + marca conversión.
 * @param {object} payload — datos del evento desde el cliente
 * @param {object} req     — request Express (para IP + UA)
 */
async function trackEvent(payload, req) {
  const {
    eventType, eventName,
    sessionId, visitorId, userId,
    path, pageType, referrer,
    utmSource, utmMedium, utmCampaign, utmContent, utmTerm,
    campaignId, entityType, entityId,
    screenWidth, screenHeight, language,
    properties,
  } = payload || {};

  if (!eventType || !sessionId || !visitorId) {
    throw Object.assign(new Error('eventType, sessionId y visitorId requeridos'), { statusCode: 400 });
  }

  const uaString = req?.headers?.['user-agent'] || null;
  const { device, os, browser } = parseUserAgent(uaString);
  const rawIp = pickIpFromReq(req || {});
  const ipMasked = maskIp(rawIp);

  // Geo async, no bloqueante para respuesta cliente
  const geoPromise = lookupGeo(rawIp);

  const geo = await geoPromise;

  const evt = await prisma.analyticsEvent.create({
    data: {
      eventType, eventName: eventName || null,
      sessionId, visitorId, userId: userId || null,
      path: path || null, pageType: pageType || null, referrer: referrer || null,
      utmSource: utmSource || null, utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null, utmContent: utmContent || null, utmTerm: utmTerm || null,
      campaignId: campaignId || null,
      entityType: entityType || null, entityId: entityId || null,
      ipMasked, city: geo.city, region: geo.region, country: geo.country,
      device, os, browser,
      screenWidth: screenWidth ? parseInt(screenWidth) : null,
      screenHeight: screenHeight ? parseInt(screenHeight) : null,
      language: language || null,
      properties: properties || null,
    },
    select: { id: true, timestamp: true },
  });

  // Upsert sesión — al primer evento crea, en siguientes actualiza contadores.
  const isPageView = eventType === 'page_view';
  const conv = mapConversion(eventType);

  await prisma.analyticsSession.upsert({
    where: { id: sessionId },
    create: {
      id: sessionId, visitorId, userId: userId || null,
      entryPath: path || null, exitPath: path || null,
      utmSource: utmSource || null, utmMedium: utmMedium || null, utmCampaign: utmCampaign || null,
      ipMasked, city: geo.city, region: geo.region, country: geo.country,
      device, os, browser,
      pageCount: isPageView ? 1 : 0,
      eventCount: 1,
      isNewVisitor: true, // TODO: dedup por visitorId con sesión previa
      hadLead: conv.hadLead,
      hadBooking: conv.hadBooking,
      hadPurchase: conv.hadPurchase,
      hadSubscription: conv.hadSubscription,
    },
    update: {
      exitPath: path || undefined,
      pageCount: isPageView ? { increment: 1 } : undefined,
      eventCount: { increment: 1 },
      endedAt: new Date(),
      hadLead: conv.hadLead ? true : undefined,
      hadBooking: conv.hadBooking ? true : undefined,
      hadPurchase: conv.hadPurchase ? true : undefined,
      hadSubscription: conv.hadSubscription ? true : undefined,
    },
  }).catch((e) => console.warn('[analytics] session upsert:', e.message));

  return evt;
}

function mapConversion(eventType) {
  const s = String(eventType || '');
  return {
    hadLead: s === 'contact_form_submitted' || s === 'newsletter_signup' || s === 'ad_lead_attributed',
    hadBooking: s === 'booking_created',
    hadPurchase: s === 'order_paid',
    hadSubscription: s === 'subscription_activated',
  };
}

module.exports = { trackEvent, maskIp, parseUserAgent, lookupGeo };
