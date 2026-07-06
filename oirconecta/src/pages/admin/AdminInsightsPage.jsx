/**
 * D3 — Panel Insights del sitio.
 * /portal-admin/marketing/insights
 *
 * 6 tabs: Resumen, Ciudades, Dispositivos, Fuentes, Páginas, Embudo.
 * Todo consumido desde /api/analytics/admin/*.
 * Gráficas hechas con SVG puro (sin librería) para no engordar bundle.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Card, Typography, Tabs, Tab, Grid, Stack, Chip, LinearProgress,
  Table, TableHead, TableRow, TableCell, TableBody, CircularProgress,
  ToggleButton, ToggleButtonGroup, TextField, Tooltip, IconButton, Button,
} from '@mui/material';
import {
  InsightsOutlined, LocationOnOutlined, PhoneAndroidOutlined,
  PublicOutlined, ArticleOutlined, AccountTreeOutlined, TrendingUpOutlined,
  RefreshOutlined, PictureAsPdfOutlined, TrackChangesOutlined,
} from '@mui/icons-material';
import { adminFetch } from './adminAuth';
import { downloadInsightsPdf } from '../../utils/insightsPdfExport';

const ACCENT = '#6d28d9';
const NAVY = '#0F2A4A';

// ═══════════════════════════════════════════════════════════════════
// Helpers de fetch + formatos
// ═══════════════════════════════════════════════════════════════════

async function get(path, params) {
  const qs = new URLSearchParams(params || {});
  const url = `${path}${qs.toString() ? `?${qs}` : ''}`;
  // adminFetch ya retorna { ok, status, data } donde data es el JSON parseado
  // Nuestro backend envuelve como { success, data: <payload> } — extraemos el payload
  const r = await adminFetch(url);
  if (!r.ok || !r.data?.success) throw new Error(r.data?.error || `HTTP ${r.status}`);
  return r.data.data;
}

function fmtNum(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('es-CO');
}
function fmtPct(n) {
  if (n == null) return '—';
  return `${Number(n).toFixed(2)}%`;
}
function fmtSec(s) {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

// ═══════════════════════════════════════════════════════════════════
// Componente principal
// ═══════════════════════════════════════════════════════════════════

const PRESETS = [
  { key: '7d',  label: '7 días',  days: 7 },
  { key: '30d', label: '30 días', days: 30 },
  { key: '90d', label: '90 días', days: 90 },
];

export default function AdminInsightsPage() {
  const [tab, setTab] = useState(0);
  const [preset, setPreset] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const range = useMemo(() => {
    if (preset === 'custom' && customFrom && customTo) {
      return {
        from: new Date(customFrom).toISOString(),
        to: new Date(customTo + 'T23:59:59').toISOString(),
      };
    }
    const days = PRESETS.find((p) => p.key === preset)?.days || 30;
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 3600 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [preset, customFrom, customTo]);

  const handleDownloadPdf = useCallback(async () => {
    setDownloading(true);
    try {
      const [overview, series, byCity, byDevice, sources, topPages, funnel] = await Promise.all([
        get('/api/analytics/admin/overview', range),
        get('/api/analytics/admin/timeseries', range),
        get('/api/analytics/admin/by-city', range),
        get('/api/analytics/admin/by-device', range),
        get('/api/analytics/admin/traffic-sources', range),
        get('/api/analytics/admin/top-pages', range),
        get('/api/analytics/admin/funnel', range),
      ]);
      await downloadInsightsPdf({
        range: { from: range.from, to: range.to },
        overview, series, byCity, byDevice, sources, topPages, funnel,
      });
    } catch (e) {
      alert(`No se pudo generar el PDF: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  }, [range]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography sx={{ fontWeight: 900, color: NAVY, fontSize: '1.75rem', letterSpacing: '-0.02em' }}>
            Insights del sitio
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
            Segmentación por ciudad, dispositivo y fuente. Datos first-party (Ley 1581).
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup value={preset} exclusive onChange={(_, v) => v && setPreset(v)} size="small"
            sx={{ '& .MuiToggleButton-root': { textTransform: 'none', fontWeight: 700, borderRadius: '8px !important', mx: 0.25 },
              '& .Mui-selected': { bgcolor: `${ACCENT} !important`, color: '#fff !important' } }}>
            {PRESETS.map((p) => <ToggleButton key={p.key} value={p.key}>{p.label}</ToggleButton>)}
            <ToggleButton value="custom">Custom</ToggleButton>
          </ToggleButtonGroup>
          {preset === 'custom' && (
            <>
              <TextField type="date" size="small" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
              <TextField type="date" size="small" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </>
          )}
          <Tooltip title="Recargar">
            <IconButton onClick={() => setRefreshTick((t) => t + 1)} size="small"><RefreshOutlined /></IconButton>
          </Tooltip>
          <Button
            variant="contained" size="small" startIcon={<PictureAsPdfOutlined />}
            onClick={handleDownloadPdf} disabled={downloading}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px',
              background: ACCENT, '&:hover': { background: ACCENT, filter: 'brightness(0.95)' } }}>
            {downloading ? 'Generando…' : 'Descargar PDF'}
          </Button>
          {/* Debug oculto: solo aparece si la URL tiene ?debug=1 */}
          {new URLSearchParams(window.location.search).get('debug') === '1' && (
            <Button size="small" variant="outlined"
              onClick={async () => {
                const d = await get('/api/analytics/admin/debug');
                const counts = d?.counts || {};
                const latest = d?.latest || [];
                const rows = latest.map((e, i) => `${i+1}. ${e.eventType.padEnd(22)} device=${e.device || 'NULL'} os=${e.os || 'NULL'} browser=${e.browser || 'NULL'} city=${e.city || 'NULL'} sess=${e.sessionId?.slice(0,8)}`).join('\n');
                alert(
                  `Total eventos: ${counts.total}\n` +
                  `Últimas 24h: ${counts.last24h}\n` +
                  `Sesiones únicas 24h: ${counts.distinctSessions24h}\n` +
                  `Con device=NULL 24h: ${counts.nullDevice24h}\n` +
                  `Con city=NULL 24h: ${counts.nullCity24h}\n\n` +
                  `--- Últimos 20 ---\n${rows || '(sin eventos)'}`
                );
              }}
              sx={{ textTransform: 'none', borderRadius: '8px' }}>
              Debug
            </Button>
          )}
        </Stack>
      </Stack>

      <Card sx={{ borderRadius: '14px', border: '1px solid #e5e7eb' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: '1px solid #e5e7eb', px: 2,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: ACCENT },
            '& .MuiTabs-indicator': { backgroundColor: ACCENT } }}>
          <Tab icon={<InsightsOutlined fontSize="small" />} iconPosition="start" label="Resumen" />
          <Tab icon={<LocationOnOutlined fontSize="small" />} iconPosition="start" label="Ciudades" />
          <Tab icon={<PhoneAndroidOutlined fontSize="small" />} iconPosition="start" label="Dispositivos" />
          <Tab icon={<PublicOutlined fontSize="small" />} iconPosition="start" label="Fuentes" />
          <Tab icon={<ArticleOutlined fontSize="small" />} iconPosition="start" label="Páginas" />
          <Tab icon={<AccountTreeOutlined fontSize="small" />} iconPosition="start" label="Embudo" />
          <Tab icon={<TrackChangesOutlined fontSize="small" />} iconPosition="start" label="Atribución" />
        </Tabs>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {tab === 0 && <TabResumen range={range} tick={refreshTick} />}
          {tab === 1 && <TabCiudades range={range} tick={refreshTick} />}
          {tab === 2 && <TabDispositivos range={range} tick={refreshTick} />}
          {tab === 3 && <TabFuentes range={range} tick={refreshTick} />}
          {tab === 4 && <TabPaginas range={range} tick={refreshTick} />}
          {tab === 5 && <TabEmbudo range={range} tick={refreshTick} />}
          {tab === 6 && <TabAtribucion range={range} tick={refreshTick} />}
        </Box>
      </Card>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Hook fetch con estado
// ═══════════════════════════════════════════════════════════════════
function useAnalytics(path, range, tick) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancel = false;
    setLoading(true);
    get(path, range).then((d) => { if (!cancel) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [path, range.from, range.to, tick]);
  return { data, loading };
}

// ═══════════════════════════════════════════════════════════════════
// TAB 0 · Resumen del sitio
// ═══════════════════════════════════════════════════════════════════
function TabResumen({ range, tick }) {
  const { data: ov, loading } = useAnalytics('/api/analytics/admin/overview', range, tick);
  const { data: series } = useAnalytics('/api/analytics/admin/timeseries', range, tick);
  const { data: topEvents } = useAnalytics('/api/analytics/admin/top-events', range, tick);

  if (loading) return <Loading />;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Kpi label="Visitantes únicos" value={fmtNum(ov?.uniqueVisitors)} color="#0369a1" />
        <Kpi label="Sesiones" value={fmtNum(ov?.sessions)} color="#6d28d9" />
        <Kpi label="Pageviews" value={fmtNum(ov?.pageViews)} color="#15803d" />
        <Kpi label="Duración media" value={fmtSec(ov?.avgSessionDurationSec)} color="#f59e0b" />
        <Kpi label="Pág. por sesión" value={ov?.avgPagesPerSession?.toFixed?.(2) ?? '—'} color="#0369a1" />
        <Kpi label="Bounce rate" value={fmtPct(ov?.bounceRate)} color="#dc2626" />
        <Kpi label="Sesiones que convirtieron" value={fmtNum(ov?.convertedSessions)} color="#15803d" />
        <Kpi label="Tasa de conversión" value={fmtPct(ov?.conversionRate)} color="#15803d" />
      </Grid>

      <Typography sx={{ fontWeight: 800, mb: 1.5, color: NAVY }}>Tendencia diaria</Typography>
      <TimeseriesChart data={series || []} />

      <Typography sx={{ fontWeight: 800, mt: 3, mb: 1.5, color: NAVY }}>Top eventos</Typography>
      <RankTable
        rows={topEvents || []}
        cols={[
          { key: 'event', label: 'Evento' },
          { key: 'count', label: 'Total', align: 'right', render: (v) => fmtNum(v) },
        ]}
        barKey="count"
      />
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 1 · Ciudades
// ═══════════════════════════════════════════════════════════════════
function TabCiudades({ range, tick }) {
  const { data, loading } = useAnalytics('/api/analytics/admin/by-city', range, tick);
  if (loading) return <Loading />;
  return (
    <Box>
      <Typography sx={{ color: '#64748b', fontSize: '0.875rem', mb: 2 }}>
        Cada fila representa a los visitantes cuya IP fue geolocalizada (best-effort).
        Las sesiones sin ciudad detectada quedan agrupadas como "(Desconocida)".
      </Typography>
      <RankTable
        rows={data || []}
        cols={[
          { key: 'city',      label: 'Ciudad' },
          { key: 'sessions',  label: 'Sesiones',  align: 'right', render: fmtNum },
          { key: 'visitors',  label: 'Únicos',    align: 'right', render: fmtNum },
          { key: 'pageViews', label: 'Pageviews', align: 'right', render: fmtNum },
          { key: 'bookings',  label: 'Citas',     align: 'right', render: (v) => v > 0 ? <b style={{ color: ACCENT }}>{fmtNum(v)}</b> : '0' },
          { key: 'leads',     label: 'Leads',     align: 'right', render: fmtNum },
        ]}
        barKey="sessions"
      />
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2 · Dispositivos
// ═══════════════════════════════════════════════════════════════════
function TabDispositivos({ range, tick }) {
  const { data, loading } = useAnalytics('/api/analytics/admin/by-device', range, tick);
  if (loading) return <Loading />;
  const totalSessions = (data?.byDevice || []).reduce((a, b) => a + b.sessions, 0);
  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Typography sx={{ fontWeight: 800, mb: 1.5, color: NAVY }}>Distribución por device</Typography>
          <Donut data={(data?.byDevice || []).map((d) => ({ label: d.device, value: d.sessions }))} />
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead><TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Device</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Sesiones</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>%</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Citas</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {(data?.byDevice || []).map((d) => (
                <TableRow key={d.device}>
                  <TableCell>{d.device}</TableCell>
                  <TableCell align="right">{fmtNum(d.sessions)}</TableCell>
                  <TableCell align="right">{totalSessions > 0 ? `${Math.round((d.sessions/totalSessions)*100)}%` : '—'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: d.bookings > 0 ? 700 : 400, color: d.bookings > 0 ? ACCENT : 'inherit' }}>{fmtNum(d.bookings)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Grid>
        <Grid item xs={12} md={3.5}>
          <Typography sx={{ fontWeight: 800, mb: 1.5, color: NAVY }}>Sistema operativo</Typography>
          <RankTable
            rows={data?.byOs || []}
            cols={[
              { key: 'os',       label: 'OS' },
              { key: 'sessions', label: 'Sesiones', align: 'right', render: fmtNum },
            ]}
            barKey="sessions"
            compact
          />
        </Grid>
        <Grid item xs={12} md={3.5}>
          <Typography sx={{ fontWeight: 800, mb: 1.5, color: NAVY }}>Navegador</Typography>
          <RankTable
            rows={data?.byBrowser || []}
            cols={[
              { key: 'browser',  label: 'Browser' },
              { key: 'sessions', label: 'Sesiones', align: 'right', render: fmtNum },
            ]}
            barKey="sessions"
            compact
          />
        </Grid>
      </Grid>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3 · Fuentes
// ═══════════════════════════════════════════════════════════════════
function TabFuentes({ range, tick }) {
  const { data, loading } = useAnalytics('/api/analytics/admin/traffic-sources', range, tick);
  if (loading) return <Loading />;
  return (
    <Box>
      <Typography sx={{ color: '#64748b', fontSize: '0.875rem', mb: 2 }}>
        Clasificamos cada sesión según su UTM Source (Meta Ads, Google Ads, campaña interna) y
        el referrer HTTP (Google orgánico, Facebook, WhatsApp, referido, directo).
      </Typography>
      <RankTable
        rows={data || []}
        cols={[
          { key: 'source',   label: 'Fuente' },
          { key: 'sessions', label: 'Sesiones', align: 'right', render: fmtNum },
          { key: 'visitors', label: 'Únicos',   align: 'right', render: fmtNum },
          { key: 'bookings', label: 'Citas',    align: 'right', render: (v) => v > 0 ? <b style={{ color: ACCENT }}>{fmtNum(v)}</b> : '0' },
          { key: 'leads',    label: 'Leads',    align: 'right', render: fmtNum },
        ]}
        barKey="sessions"
      />
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 4 · Páginas
// ═══════════════════════════════════════════════════════════════════
function TabPaginas({ range, tick }) {
  const { data, loading } = useAnalytics('/api/analytics/admin/top-pages', range, tick);
  if (loading) return <Loading />;
  return (
    <Box>
      <RankTable
        rows={data || []}
        cols={[
          { key: 'path',      label: 'Ruta', render: (v) => <code style={{ fontSize: '0.75rem' }}>{v}</code> },
          { key: 'pageType',  label: 'Tipo' },
          { key: 'views',     label: 'Pageviews', align: 'right', render: fmtNum },
          { key: 'sessions',  label: 'Sesiones',  align: 'right', render: fmtNum },
          { key: 'visitors',  label: 'Únicos',    align: 'right', render: fmtNum },
        ]}
        barKey="views"
      />
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 5 · Embudo
// ═══════════════════════════════════════════════════════════════════
function TabEmbudo({ range, tick }) {
  const { data, loading } = useAnalytics('/api/analytics/admin/funnel', range, tick);
  if (loading) return <Loading />;
  const steps = data?.steps || [];
  const max = Math.max(1, ...steps.map((s) => s.count));
  const first = steps[0]?.count || 0;
  return (
    <Box>
      <Typography sx={{ color: '#64748b', fontSize: '0.875rem', mb: 2 }}>
        Cada etapa es un evento capturado en el rango. La conversión entre etapas se calcula
        como <em>etapaN / sesiones totales</em>.
      </Typography>
      <Stack spacing={1.5}>
        {steps.map((s, i) => {
          const pctOfPrev = i === 0 ? 100 : (steps[0].count > 0 ? Math.round((s.count / steps[0].count) * 1000) / 10 : 0);
          const width = Math.max(4, Math.round((s.count / max) * 100));
          return (
            <Card key={s.key} sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: '10px' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, color: NAVY, fontSize: '0.95rem' }}>{s.label}</Typography>
                  <Box sx={{ mt: 0.5, height: 10, bgcolor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ width: `${width}%`, height: '100%', background: `linear-gradient(90deg, ${ACCENT}, #86efac)` }} />
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                  <Typography sx={{ fontWeight: 900, color: NAVY, fontSize: '1.25rem' }}>{fmtNum(s.count)}</Typography>
                  {i > 0 && <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{pctOfPrev}% del total</Typography>}
                </Box>
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 6 · Atribución (D7)
// ═══════════════════════════════════════════════════════════════════
function TabAtribucion({ range, tick }) {
  const { data, loading } = useAnalytics('/api/analytics/admin/attribution', range, tick);
  if (loading) return <Loading />;
  if (!data) return <Typography sx={{ color: '#94a3b8', fontStyle: 'italic', p: 2 }}>Sin datos.</Typography>;

  const utm = data.byUtmCampaign || [];
  const internal = data.byInternalCampaign || [];
  const channels = data.summary?.channels || [];
  const totalCh = channels.reduce((a, c) => a + Number(c.sessions || 0), 0);

  return (
    <Box>
      <Typography sx={{ color: '#64748b', fontSize: '0.875rem', mb: 2 }}>
        Atribución <strong>last-touch</strong> por sesión. Cada sesión cuenta como
        una conversión si logró un lead, cita, compra o suscripción.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Kpi label="Sesiones totales" value={fmtNum(data.summary?.totalSessions)} color="#0369a1" />
        <Kpi label="Citas atribuidas" value={fmtNum(data.summary?.totalBookings)} color={ACCENT} />
        <Kpi label="Suscripciones" value={fmtNum(data.summary?.totalSubs)} color="#6d28d9" />
        <Kpi label="Utms distintas" value={fmtNum(utm.length)} color="#f59e0b" />
      </Grid>

      <Typography sx={{ fontWeight: 800, mb: 1.5, color: NAVY }}>Canal de origen</Typography>
      <Table size="small" sx={{ mb: 3 }}>
        <TableHead><TableRow>
          <TableCell sx={{ fontWeight: 700 }}>Canal</TableCell>
          <TableCell align="right" sx={{ fontWeight: 700 }}>Sesiones</TableCell>
          <TableCell align="right" sx={{ fontWeight: 700 }}>%</TableCell>
          <TableCell align="right" sx={{ fontWeight: 700 }}>Citas</TableCell>
          <TableCell align="right" sx={{ fontWeight: 700 }}>Suscripciones</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {channels.map((c) => (
            <TableRow key={c.channel} hover>
              <TableCell sx={{ textTransform: 'capitalize' }}>{c.channel}</TableCell>
              <TableCell align="right">{fmtNum(c.sessions)}</TableCell>
              <TableCell align="right">{totalCh > 0 ? `${Math.round((c.sessions / totalCh) * 100)}%` : '—'}</TableCell>
              <TableCell align="right" sx={{ fontWeight: c.bookings > 0 ? 700 : 400, color: c.bookings > 0 ? ACCENT : 'inherit' }}>
                {fmtNum(c.bookings)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: c.subscriptions > 0 ? 700 : 400, color: c.subscriptions > 0 ? '#6d28d9' : 'inherit' }}>
                {fmtNum(c.subscriptions)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Typography sx={{ fontWeight: 800, mb: 1.5, color: NAVY }}>Por campaña externa (UTM)</Typography>
      {utm.length === 0 ? (
        <Typography sx={{ color: '#94a3b8', fontStyle: 'italic', mb: 3 }}>
          Sin UTMs registradas en el rango. Las campañas externas deben marcar tráfico con
          <code style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: 4, marginLeft: 4 }}>?utm_campaign=…&utm_source=…&utm_medium=…</code>
        </Typography>
      ) : (
        <RankTable
          rows={utm.slice(0, 25)}
          cols={[
            { key: 'utmCampaign',   label: 'Campaña' },
            { key: 'utmSource',     label: 'Source' },
            { key: 'utmMedium',     label: 'Medium' },
            { key: 'sessions',      label: 'Sesiones', align: 'right', render: fmtNum },
            { key: 'bookings',      label: 'Citas',    align: 'right', render: (v) => v > 0 ? <b style={{ color: ACCENT }}>{fmtNum(v)}</b> : '0' },
            { key: 'subscriptions', label: 'Subs',     align: 'right', render: (v) => v > 0 ? <b style={{ color: '#6d28d9' }}>{fmtNum(v)}</b> : '0' },
            { key: 'conversionRate', label: 'CVR',     align: 'right', render: fmtPct },
          ]}
          barKey="sessions"
        />
      )}

      <Typography sx={{ fontWeight: 800, mt: 3, mb: 1.5, color: NAVY }}>Por campaña interna (ads OírConecta)</Typography>
      {internal.length === 0 ? (
        <Typography sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
          No hay clicks atribuidos a campañas internas en el rango.
        </Typography>
      ) : (
        <RankTable
          rows={internal.slice(0, 25)}
          cols={[
            { key: 'name',          label: 'Campaña' },
            { key: 'advertiser',    label: 'Marca' },
            { key: 'impressions',   label: 'Impres.',  align: 'right', render: fmtNum },
            { key: 'clicks',        label: 'Clicks',   align: 'right', render: fmtNum },
            { key: 'ctr',           label: 'CTR',      align: 'right', render: fmtPct },
            { key: 'sessions',      label: 'Sesiones', align: 'right', render: fmtNum },
            { key: 'bookings',      label: 'Citas',    align: 'right', render: (v) => v > 0 ? <b style={{ color: ACCENT }}>{fmtNum(v)}</b> : '0' },
            { key: 'subscriptions', label: 'Subs',     align: 'right', render: (v) => v > 0 ? <b style={{ color: '#6d28d9' }}>{fmtNum(v)}</b> : '0' },
          ]}
          barKey="sessions"
        />
      )}
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Componentes visuales genéricos
// ═══════════════════════════════════════════════════════════════════

function Loading() {
  return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
}

function Kpi({ label, value, color }) {
  return (
    <Grid item xs={6} sm={4} md={3}>
      <Card sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: '10px', height: '100%' }}>
        <Typography sx={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color, mt: 0.5 }}>{value}</Typography>
      </Card>
    </Grid>
  );
}

/** Tabla ranking con barra proporcional en la columna clave. */
function RankTable({ rows = [], cols, barKey, compact }) {
  const max = Math.max(1, ...rows.map((r) => Number(r[barKey] || 0)));
  if (rows.length === 0) return <Typography sx={{ color: '#94a3b8', fontStyle: 'italic', p: 2 }}>Sin datos en el rango seleccionado.</Typography>;
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {cols.map((c) => (
            <TableCell key={c.key} align={c.align || 'left'} sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>
              {c.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r, i) => {
          const pct = (Number(r[barKey] || 0) / max) * 100;
          return (
            <TableRow key={i} hover>
              {cols.map((c, j) => {
                const val = r[c.key];
                const display = c.render ? c.render(val, r) : (val ?? '—');
                return (
                  <TableCell key={c.key} align={c.align || 'left'} sx={{ position: 'relative', fontSize: compact ? '0.75rem' : '0.85rem' }}>
                    {j === 0 && <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, bgcolor: `${ACCENT}12`, zIndex: 0 }} />}
                    <Box sx={{ position: 'relative', zIndex: 1 }}>{display}</Box>
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** Line chart SVG minimal para timeseries multi-métrica. */
function TimeseriesChart({ data }) {
  const width = 900;
  const height = 260;
  const padL = 40, padR = 20, padT = 20, padB = 40;
  const iw = width - padL - padR;
  const ih = height - padT - padB;

  if (!data || data.length === 0) {
    return <Card sx={{ p: 4, textAlign: 'center', border: '1px solid #e5e7eb', borderRadius: '10px' }}>
      <Typography sx={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin datos en el rango. Aparecerán cuando el sitio empiece a registrar tráfico.</Typography>
    </Card>;
  }

  const metrics = [
    { key: 'sessions', label: 'Sesiones', color: '#0369a1' },
    { key: 'pageViews', label: 'Pageviews', color: '#15803d' },
    { key: 'bookings', label: 'Citas', color: '#dc2626' },
  ];
  const max = Math.max(1, ...data.flatMap((d) => metrics.map((m) => d[m.key] || 0)));
  const x = (i) => padL + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
  const y = (v) => padT + ih - (v / max) * ih;

  return (
    <Card sx={{ p: 2, border: '1px solid #e5e7eb', borderRadius: '10px', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: 600 }}>
        {/* Grid horizontal */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={padL} x2={width - padR} y1={padT + ih * (1 - f)} y2={padT + ih * (1 - f)}
            stroke="#e5e7eb" strokeDasharray="3 3" />
        ))}
        {/* Eje Y */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <text key={f} x={padL - 6} y={padT + ih * (1 - f) + 4} textAnchor="end" fontSize="9" fill="#94a3b8">
            {Math.round(max * f)}
          </text>
        ))}
        {/* Líneas */}
        {metrics.map((m) => {
          const points = data.map((d, i) => `${x(i)},${y(d[m.key] || 0)}`).join(' ');
          return <polyline key={m.key} fill="none" stroke={m.color} strokeWidth="2" points={points} />;
        })}
        {/* Ticks X (cada N para no saturar) */}
        {data.map((d, i) => {
          const step = Math.max(1, Math.floor(data.length / 8));
          if (i % step !== 0 && i !== data.length - 1) return null;
          return <text key={i} x={x(i)} y={height - 20} textAnchor="middle" fontSize="9" fill="#64748b">
            {d.day.slice(5)}
          </text>;
        })}
      </svg>
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
        {metrics.map((m) => (
          <Stack key={m.key} direction="row" spacing={0.5} alignItems="center">
            <Box sx={{ width: 10, height: 10, bgcolor: m.color, borderRadius: 5 }} />
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{m.label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}

/** Donut SVG minimal. */
function Donut({ data = [] }) {
  const size = 200;
  const r = 70;
  const cx = size / 2, cy = size / 2;
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const colors = ['#6d28d9', '#0369a1', '#15803d', '#f59e0b', '#dc2626', '#64748b'];
  let angle = -Math.PI / 2;
  const arcs = data.map((d, i) => {
    const frac = d.value / total;
    const start = angle;
    const end = angle + frac * Math.PI * 2;
    angle = end;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = frac > 0.5 ? 1 : 0;
    return { path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: colors[i % colors.length], label: d.label, value: d.value, pct: Math.round(frac * 100) };
  });
  return (
    <Box sx={{ width: size, mx: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a, i) => <path key={i} d={a.path} fill={a.color} stroke="#fff" strokeWidth="1.5" />)}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="#fff" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="12" fill="#64748b">Total</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="18" fontWeight="800" fill={NAVY}>{fmtNum(total)}</text>
      </svg>
      <Stack sx={{ mt: 1.5 }} spacing={0.5}>
        {arcs.map((a, i) => (
          <Stack key={i} direction="row" alignItems="center" spacing={1}>
            <Box sx={{ width: 10, height: 10, bgcolor: a.color, borderRadius: '2px', flexShrink: 0 }} />
            <Typography sx={{ fontSize: '0.75rem', color: NAVY, fontWeight: 600, flex: 1 }}>{a.label}</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{a.pct}%</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
