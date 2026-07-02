/**
 * D3 — Agregados analíticos para el panel del admin.
 *
 * Todas las funciones aceptan un rango { from, to } en ISO string.
 * Si no viene, defaultea últimos 30 días. Todos los queries usan índices
 * existentes (timestamp, city+timestamp, device+timestamp, etc.).
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function toDate(v, fallback) {
  if (!v) return fallback;
  const d = new Date(v);
  return isNaN(d.getTime()) ? fallback : d;
}

function defaultRange({ from, to } = {}) {
  const now = new Date();
  const toDt = toDate(to, now);
  const defaultFrom = new Date(toDt.getTime() - 30 * 24 * 3600 * 1000);
  const fromDt = toDate(from, defaultFrom);
  return { from: fromDt, to: toDt };
}

// ─── Overview: KPIs del sitio ───
async function getOverview(range) {
  const { from, to } = defaultRange(range);
  const [sessions, events, uniqueVisitors, converted] = await Promise.all([
    prisma.analyticsSession.count({ where: { startedAt: { gte: from, lte: to } } }),
    prisma.analyticsEvent.count({ where: { timestamp: { gte: from, lte: to } } }),
    prisma.analyticsEvent.findMany({
      where: { timestamp: { gte: from, lte: to } },
      distinct: ['visitorId'],
      select: { visitorId: true },
      take: 100000, // safety
    }),
    prisma.analyticsSession.count({
      where: {
        startedAt: { gte: from, lte: to },
        OR: [
          { hadLead: true }, { hadBooking: true },
          { hadPurchase: true }, { hadSubscription: true },
        ],
      },
    }),
  ]);

  const pageViews = await prisma.analyticsEvent.count({
    where: { timestamp: { gte: from, lte: to }, eventType: 'page_view' },
  });

  // Métricas de sesión (duración/bounce)
  const [sessionStats] = await prisma.$queryRawUnsafe(`
    SELECT
      AVG(NULLIF("durationSec",0))::int  AS avg_duration,
      AVG("pageCount")::float            AS avg_pages,
      SUM(CASE WHEN "pageCount" <= 1 THEN 1 ELSE 0 END)::int AS bounces
    FROM "analytics_sessions"
    WHERE "startedAt" BETWEEN $1 AND $2
  `, from, to);

  const bounceRate = sessions > 0 ? Math.round(((sessionStats?.bounces || 0) / sessions) * 10000) / 100 : 0;
  const conversionRate = sessions > 0 ? Math.round((converted / sessions) * 10000) / 100 : 0;

  return {
    from, to,
    sessions,
    events,
    pageViews,
    uniqueVisitors: uniqueVisitors.length,
    convertedSessions: converted,
    conversionRate,
    avgSessionDurationSec: sessionStats?.avg_duration || 0,
    avgPagesPerSession: sessionStats?.avg_pages ? Math.round(sessionStats.avg_pages * 100) / 100 : 0,
    bounceRate,
  };
}

// ─── Timeseries diaria ───
async function getTimeseries(range) {
  const { from, to } = defaultRange(range);
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      DATE_TRUNC('day', "timestamp") AS day,
      COUNT(DISTINCT "sessionId")::int AS sessions,
      COUNT(DISTINCT "visitorId")::int AS visitors,
      COUNT(*) FILTER (WHERE "eventType" = 'page_view')::int AS "pageViews",
      COUNT(*) FILTER (WHERE "eventType" = 'ad_impression')::int AS impressions,
      COUNT(*) FILTER (WHERE "eventType" = 'ad_click')::int AS clicks,
      COUNT(*) FILTER (WHERE "eventType" = 'booking_created')::int AS bookings,
      COUNT(*) FILTER (WHERE "eventType" = 'contact_form_submitted')::int AS leads
    FROM "analytics_events"
    WHERE "timestamp" BETWEEN $1 AND $2
    GROUP BY 1
    ORDER BY 1 ASC
  `, from, to);
  return rows.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    sessions: r.sessions,
    visitors: r.visitors,
    pageViews: r.pageViews,
    impressions: r.impressions,
    clicks: r.clicks,
    bookings: r.bookings,
    leads: r.leads,
  }));
}

// ─── By city ───
async function getByCity(range) {
  const { from, to } = defaultRange(range);
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      COALESCE("city", '(Desconocida)') AS city,
      COUNT(DISTINCT "sessionId")::int AS sessions,
      COUNT(DISTINCT "visitorId")::int AS visitors,
      COUNT(*) FILTER (WHERE "eventType" = 'page_view')::int AS "pageViews",
      COUNT(*) FILTER (WHERE "eventType" = 'booking_created')::int AS bookings,
      COUNT(*) FILTER (WHERE "eventType" IN ('contact_form_submitted', 'newsletter_signup'))::int AS leads
    FROM "analytics_events"
    WHERE "timestamp" BETWEEN $1 AND $2
    GROUP BY 1
    ORDER BY sessions DESC
    LIMIT 30
  `, from, to);
  return rows;
}

// ─── By device (+ OS + browser) ───
async function getByDevice(range) {
  const { from, to } = defaultRange(range);
  const [byDevice, byOs, byBrowser] = await Promise.all([
    prisma.$queryRawUnsafe(`
      SELECT
        COALESCE("device", '(otros)') AS device,
        COUNT(DISTINCT "sessionId")::int AS sessions,
        COUNT(DISTINCT "visitorId")::int AS visitors,
        COUNT(*) FILTER (WHERE "eventType" = 'page_view')::int AS "pageViews",
        COUNT(*) FILTER (WHERE "eventType" = 'booking_created')::int AS bookings
      FROM "analytics_events"
      WHERE "timestamp" BETWEEN $1 AND $2
      GROUP BY 1
      ORDER BY sessions DESC
    `, from, to),
    prisma.$queryRawUnsafe(`
      SELECT
        COALESCE("os", '(otros)') AS os,
        COUNT(DISTINCT "sessionId")::int AS sessions
      FROM "analytics_events"
      WHERE "timestamp" BETWEEN $1 AND $2
      GROUP BY 1
      ORDER BY sessions DESC
      LIMIT 10
    `, from, to),
    prisma.$queryRawUnsafe(`
      SELECT
        COALESCE("browser", '(otros)') AS browser,
        COUNT(DISTINCT "sessionId")::int AS sessions
      FROM "analytics_events"
      WHERE "timestamp" BETWEEN $1 AND $2
      GROUP BY 1
      ORDER BY sessions DESC
      LIMIT 10
    `, from, to),
  ]);
  return { byDevice, byOs, byBrowser };
}

// ─── Traffic sources ───
async function getTrafficSources(range) {
  const { from, to } = defaultRange(range);

  // Categoriza según utmSource + referrer:
  // - Si utmSource contiene 'meta'/'facebook'/'ig' → Meta Ads
  // - Si utmSource contiene 'google' → Google Ads
  // - Si referrer contiene 'google' → Orgánico Google
  // - Si referrer contiene 'facebook.com'/'instagram.com' → Social orgánico
  // - Si utmSource === 'oirconecta' → Campaña interna
  // - Sin utm ni referrer → Directo
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      CASE
        WHEN LOWER(COALESCE("utmSource", '')) IN ('meta', 'facebook', 'ig', 'instagram') THEN 'Meta Ads'
        WHEN LOWER(COALESCE("utmSource", '')) IN ('google', 'gads', 'adwords')            THEN 'Google Ads'
        WHEN COALESCE("utmSource", '') = 'oirconecta'                                     THEN 'Campaña interna'
        WHEN COALESCE("utmSource", '') <> ''                                              THEN CONCAT('Otro UTM: ', "utmSource")
        WHEN LOWER(COALESCE("referrer", '')) LIKE '%google.%'                             THEN 'Orgánico Google'
        WHEN LOWER(COALESCE("referrer", '')) LIKE '%facebook.com%'                        THEN 'Social · Facebook'
        WHEN LOWER(COALESCE("referrer", '')) LIKE '%instagram.com%'                       THEN 'Social · Instagram'
        WHEN LOWER(COALESCE("referrer", '')) LIKE '%whatsapp.com%' OR LOWER(COALESCE("referrer", '')) LIKE '%wa.me%' THEN 'WhatsApp'
        WHEN LOWER(COALESCE("referrer", '')) LIKE '%bing.%'                               THEN 'Orgánico Bing'
        WHEN COALESCE("referrer", '') = ''                                                THEN 'Directo'
        ELSE 'Referido'
      END AS source,
      COUNT(DISTINCT "sessionId")::int AS sessions,
      COUNT(DISTINCT "visitorId")::int AS visitors,
      COUNT(*) FILTER (WHERE "eventType" = 'booking_created')::int AS bookings,
      COUNT(*) FILTER (WHERE "eventType" IN ('contact_form_submitted', 'newsletter_signup'))::int AS leads
    FROM "analytics_events"
    WHERE "timestamp" BETWEEN $1 AND $2
    GROUP BY 1
    ORDER BY sessions DESC
    LIMIT 20
  `, from, to);
  return rows;
}

// ─── Top pages ───
async function getTopPages(range) {
  const { from, to } = defaultRange(range);
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      COALESCE("path", '(sin path)') AS path,
      COALESCE("pageType", '(otro)') AS "pageType",
      COUNT(*)::int                   AS views,
      COUNT(DISTINCT "sessionId")::int AS sessions,
      COUNT(DISTINCT "visitorId")::int AS visitors
    FROM "analytics_events"
    WHERE "timestamp" BETWEEN $1 AND $2
      AND "eventType" = 'page_view'
    GROUP BY 1, 2
    ORDER BY views DESC
    LIMIT 25
  `, from, to);
  return rows;
}

// ─── Funnel del sitio ───
async function getFunnel(range) {
  const { from, to } = defaultRange(range);
  const [session, profileView, wizardStart, bookingCreated, leadOrForm, subscribed] = await Promise.all([
    prisma.analyticsSession.count({ where: { startedAt: { gte: from, lte: to } } }),
    prisma.analyticsEvent.count({ where: { timestamp: { gte: from, lte: to }, eventType: 'profile_view' } }),
    prisma.analyticsEvent.count({ where: { timestamp: { gte: from, lte: to }, eventType: 'booking_wizard_start' } }),
    prisma.analyticsEvent.count({ where: { timestamp: { gte: from, lte: to }, eventType: 'booking_created' } }),
    prisma.analyticsEvent.count({
      where: {
        timestamp: { gte: from, lte: to },
        eventType: { in: ['contact_form_submitted', 'newsletter_signup'] },
      },
    }),
    prisma.analyticsEvent.count({ where: { timestamp: { gte: from, lte: to }, eventType: 'subscription_activated' } }),
  ]);
  return {
    steps: [
      { key: 'session',        label: 'Sesiones en el sitio',           count: session },
      { key: 'profile_view',   label: 'Vieron una ficha profesional',   count: profileView },
      { key: 'wizard',         label: 'Iniciaron reserva',              count: wizardStart },
      { key: 'booking',        label: 'Confirmaron cita',               count: bookingCreated },
      { key: 'lead',           label: 'Enviaron formulario / newsletter', count: leadOrForm },
      { key: 'subscription',   label: 'Profesional suscrito',           count: subscribed },
    ],
  };
}

// ─── Top events (útil para debug/exploración) ───
async function getTopEvents(range) {
  const { from, to } = defaultRange(range);
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      "eventType" AS event,
      COUNT(*)::int AS count
    FROM "analytics_events"
    WHERE "timestamp" BETWEEN $1 AND $2
    GROUP BY 1
    ORDER BY count DESC
    LIMIT 25
  `, from, to);
  return rows;
}

// ─── Debug: últimos eventos crudos + salud del pipeline ───
async function getDebug() {
  const total = await prisma.analyticsEvent.count();
  const last24h = await prisma.analyticsEvent.count({
    where: { timestamp: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
  });
  const distinctSessions = await prisma.$queryRawUnsafe(`
    SELECT COUNT(DISTINCT "sessionId")::int AS c FROM "analytics_events"
    WHERE "timestamp" >= NOW() - INTERVAL '24 hours'
  `);
  const nullDevice = await prisma.analyticsEvent.count({
    where: { device: null, timestamp: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
  });
  const nullCity = await prisma.analyticsEvent.count({
    where: { city: null, timestamp: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
  });
  const latest = await prisma.analyticsEvent.findMany({
    orderBy: { timestamp: 'desc' },
    take: 20,
    select: {
      id: true, eventType: true, timestamp: true, sessionId: true, visitorId: true,
      path: true, device: true, os: true, browser: true,
      ipMasked: true, city: true, country: true, referrer: true, utmSource: true,
    },
  });
  return {
    counts: {
      total,
      last24h,
      distinctSessions24h: distinctSessions[0]?.c || 0,
      nullDevice24h: nullDevice,
      nullCity24h: nullCity,
    },
    latest,
  };
}

module.exports = {
  getOverview, getTimeseries, getByCity, getByDevice,
  getTrafficSources, getTopPages, getFunnel, getTopEvents,
  getDebug,
};
