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

/**
 * D7 — Atribución por campaña (UTM externas + campañas internas).
 * Agrupa sesiones por utm_campaign/source/medium y contabiliza conversiones.
 * Base de la tabla: AnalyticsSession con flags hadLead/hadBooking/hadSubscription.
 *
 * Retorna:
 *  - byUtmCampaign: filas por (utmCampaign, utmSource, utmMedium)
 *  - byInternalCampaign: filas por campaignId propio (ads OírConecta)
 *  - summary: totales del rango y breakdown paid / organic / direct
 */
async function getAttribution(range) {
  const { from, to } = defaultRange(range);

  // Agregado UTM
  const utmRows = await prisma.$queryRawUnsafe(`
    SELECT
      COALESCE("utmCampaign", '(none)') AS utm_campaign,
      COALESCE("utmSource",   '(none)') AS utm_source,
      COALESCE("utmMedium",   '(none)') AS utm_medium,
      COUNT(*)::int                                                   AS sessions,
      SUM(CASE WHEN "hadLead"         THEN 1 ELSE 0 END)::int          AS leads,
      SUM(CASE WHEN "hadBooking"      THEN 1 ELSE 0 END)::int          AS bookings,
      SUM(CASE WHEN "hadPurchase"     THEN 1 ELSE 0 END)::int          AS purchases,
      SUM(CASE WHEN "hadSubscription" THEN 1 ELSE 0 END)::int          AS subscriptions,
      COUNT(*) FILTER (WHERE "isNewVisitor")::int                       AS new_visitors
    FROM "analytics_sessions"
    WHERE "startedAt" BETWEEN $1 AND $2
    GROUP BY 1, 2, 3
    ORDER BY sessions DESC
    LIMIT 200
  `, from, to);

  // Agregado por campañaId interno (ads OírConecta).
  // Un click con campaignId enciende una sesión atribuida. Contamos sesiones
  // distintas cuyo primer/mejor evento con campaignId cae en el rango.
  const internalRows = await prisma.$queryRawUnsafe(`
    WITH campaign_sessions AS (
      SELECT DISTINCT e."campaignId", e."sessionId"
      FROM "analytics_events" e
      WHERE e."campaignId" IS NOT NULL
        AND e."timestamp" BETWEEN $1 AND $2
    ),
    ad_clicks AS (
      SELECT "campaignId", COUNT(*)::int AS clicks
      FROM "analytics_events"
      WHERE "campaignId" IS NOT NULL
        AND "eventType" = 'ad_click'
        AND "timestamp" BETWEEN $1 AND $2
      GROUP BY "campaignId"
    ),
    ad_impressions AS (
      SELECT "campaignId", COUNT(*)::int AS impressions
      FROM "analytics_events"
      WHERE "campaignId" IS NOT NULL
        AND "eventType" = 'ad_impression'
        AND "timestamp" BETWEEN $1 AND $2
      GROUP BY "campaignId"
    ),
    session_conv AS (
      SELECT
        cs."campaignId",
        COUNT(DISTINCT cs."sessionId")::int AS attributed_sessions,
        SUM(CASE WHEN s."hadLead"         THEN 1 ELSE 0 END)::int AS leads,
        SUM(CASE WHEN s."hadBooking"      THEN 1 ELSE 0 END)::int AS bookings,
        SUM(CASE WHEN s."hadPurchase"     THEN 1 ELSE 0 END)::int AS purchases,
        SUM(CASE WHEN s."hadSubscription" THEN 1 ELSE 0 END)::int AS subscriptions
      FROM campaign_sessions cs
      LEFT JOIN "analytics_sessions" s ON s.id = cs."sessionId"
      GROUP BY cs."campaignId"
    )
    SELECT
      c.id                            AS campaign_id,
      c.nombre                        AS name,
      c.fabricante                    AS advertiser,
      COALESCE(ai.impressions, 0)     AS impressions,
      COALESCE(ac.clicks, 0)          AS clicks,
      COALESCE(sc.attributed_sessions, 0) AS sessions,
      COALESCE(sc.leads, 0)           AS leads,
      COALESCE(sc.bookings, 0)        AS bookings,
      COALESCE(sc.purchases, 0)       AS purchases,
      COALESCE(sc.subscriptions, 0)   AS subscriptions
    FROM session_conv sc
    LEFT JOIN "campaigns" c    ON c.id = sc."campaignId"
    LEFT JOIN ad_clicks ac     ON ac."campaignId" = sc."campaignId"
    LEFT JOIN ad_impressions ai ON ai."campaignId" = sc."campaignId"
    ORDER BY sc.bookings DESC NULLS LAST, sc.attributed_sessions DESC
    LIMIT 200
  `, from, to);

  // Breakdown alto nivel: paid / organic / direct / referral / social / email
  const summaryRows = await prisma.$queryRawUnsafe(`
    SELECT
      CASE
        WHEN "utmMedium" IN ('cpc','ppc','paid','paid_social','display','video') THEN 'paid'
        WHEN "utmMedium" IN ('organic','seo') THEN 'organic'
        WHEN "utmMedium" IN ('email','newsletter') THEN 'email'
        WHEN "utmMedium" IN ('social','social_organic') THEN 'social'
        WHEN "utmCampaign" IS NULL AND "utmSource" IS NULL THEN 'direct'
        WHEN "utmMedium" = 'referral' THEN 'referral'
        ELSE 'other'
      END AS channel,
      COUNT(*)::int AS sessions,
      SUM(CASE WHEN "hadBooking"      THEN 1 ELSE 0 END)::int AS bookings,
      SUM(CASE WHEN "hadSubscription" THEN 1 ELSE 0 END)::int AS subscriptions
    FROM "analytics_sessions"
    WHERE "startedAt" BETWEEN $1 AND $2
    GROUP BY 1
    ORDER BY sessions DESC
  `, from, to);

  const totalSessions = summaryRows.reduce((a, r) => a + Number(r.sessions || 0), 0);
  const totalBookings = summaryRows.reduce((a, r) => a + Number(r.bookings || 0), 0);
  const totalSubs = summaryRows.reduce((a, r) => a + Number(r.subscriptions || 0), 0);

  return {
    from, to,
    byUtmCampaign: utmRows.map((r) => ({
      utmCampaign: r.utm_campaign, utmSource: r.utm_source, utmMedium: r.utm_medium,
      sessions: Number(r.sessions), leads: Number(r.leads), bookings: Number(r.bookings),
      purchases: Number(r.purchases), subscriptions: Number(r.subscriptions),
      newVisitors: Number(r.new_visitors),
      conversionRate: r.sessions > 0 ? Math.round((Number(r.bookings) / Number(r.sessions)) * 10000) / 100 : 0,
    })),
    byInternalCampaign: internalRows.map((r) => ({
      campaignId: r.campaign_id, name: r.name || 'Campaña sin nombre',
      advertiser: r.advertiser || null,
      impressions: Number(r.impressions), clicks: Number(r.clicks),
      sessions: Number(r.sessions), leads: Number(r.leads),
      bookings: Number(r.bookings), purchases: Number(r.purchases),
      subscriptions: Number(r.subscriptions),
      ctr: r.impressions > 0 ? Math.round((Number(r.clicks) / Number(r.impressions)) * 10000) / 100 : 0,
      bookingRate: r.sessions > 0 ? Math.round((Number(r.bookings) / Number(r.sessions)) * 10000) / 100 : 0,
    })),
    summary: {
      totalSessions, totalBookings, totalSubs,
      channels: summaryRows.map((r) => ({
        channel: r.channel, sessions: Number(r.sessions),
        bookings: Number(r.bookings), subscriptions: Number(r.subscriptions),
      })),
    },
  };
}

module.exports = {
  getOverview, getTimeseries, getByCity, getByDevice,
  getTrafficSources, getTopPages, getFunnel, getTopEvents,
  getDebug, getAttribution,
};
