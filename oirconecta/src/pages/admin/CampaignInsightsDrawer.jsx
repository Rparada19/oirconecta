/**
 * D5 — Drawer con métricas completas de una campaña.
 * Se abre desde la tabla Campañas en AdminMarketingPage.
 *
 * KPIs nuevos:
 *   CPM (costo/mil impresiones), CPC, CPL, alcance único (visitorId
 *   distintos), frecuencia (impresiones/alcance), ritmo diario,
 *   proyección al vencimiento, cumplimiento del periodo.
 *
 * Segmentación:
 *   Por ciudad, dispositivo, fuente (utm_source + referrer) — datos que
 *   vienen de analytics_events con campaignId.
 *
 * Botón "Descargar informe PDF" al final.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Drawer, Box, Typography, IconButton, Stack, Card, Grid, Chip,
  Divider, LinearProgress, Table, TableHead, TableRow, TableCell, TableBody,
  Button, CircularProgress, Tabs, Tab,
} from '@mui/material';
import { CloseOutlined, PictureAsPdfOutlined, InsightsOutlined } from '@mui/icons-material';
import { adminFetch } from './adminAuth';
import { downloadCampaignPdf } from '../../utils/campaignPdfExport';

const ACCENT = '#15803d';
const NAVY = '#0F2A4A';

const fmtNum = (n) => n == null ? '—' : Number(n).toLocaleString('es-CO');
const fmtCOP = (n) => n == null ? '—' : `$ ${Number(n).toLocaleString('es-CO')}`;
const fmtPct = (n) => n == null ? '—' : `${Number(n).toFixed(2)}%`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function CampaignInsightsDrawer({ campaignId, open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const r = await adminFetch(`/api/marketing/admin/campaigns/${campaignId}/full-metrics`);
      const j = await r.json();
      if (!r.ok || !j?.success) {
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      setData(j.data);
    } catch (e) {
      console.error('[CampaignInsightsDrawer] load falló:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleDownloadPdf = async () => {
    if (!data) return;
    setDownloading(true);
    try {
      await downloadCampaignPdf(data);
    } catch (e) {
      alert(`No se pudo generar el PDF: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100vw', md: '820px' }, maxWidth: '100vw' } }}>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <InsightsOutlined sx={{ color: ACCENT }} />
              <Typography sx={{ fontSize: '0.7rem', letterSpacing: '0.15em', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Informe de campaña
              </Typography>
            </Stack>
            <Typography sx={{ fontWeight: 900, fontSize: '1.6rem', color: NAVY, lineHeight: 1.15 }}>
              {data?.campaign?.nombre || '—'}
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.9rem', mt: 0.5 }}>
              {data?.campaign?.advertiser?.nombre || '—'}
              {data?.campaign?.actionType && <> · {data.campaign.actionType}</>}
            </Typography>
          </Box>
          <IconButton onClick={onClose}><CloseOutlined /></IconButton>
        </Stack>

        {loading ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2, color: '#64748b', fontSize: '0.875rem' }}>Cargando métricas de la campaña…</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: '#b91c1c', fontWeight: 700, mb: 1 }}>No se pudo cargar el informe</Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.875rem', mb: 3 }}>{error}</Typography>
            <Button variant="outlined" onClick={load} sx={{ textTransform: 'none' }}>Reintentar</Button>
          </Box>
        ) : !data ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: '#64748b' }}>Sin datos</Typography>
          </Box>
        ) : (
          <>
            {/* Estado + periodo */}
            <Card sx={{ p: 2, mb: 2, border: '1px solid #e5e7eb', borderRadius: '10px', bgcolor: '#f8fafc' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                  <Typography sx={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Periodo</Typography>
                  <Typography sx={{ fontWeight: 700, color: NAVY, fontSize: '0.9rem' }}>
                    {fmtDate(data.campaign.startDate)} — {fmtDate(data.campaign.endDate)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5 }}>
                    Día {data.tiempo.daysElapsed} de {data.tiempo.daysTotal}
                    {!data.tiempo.finished && data.tiempo.daysRemaining > 0 && <> · {data.tiempo.daysRemaining} restantes</>}
                    {data.tiempo.finished && ' · finalizada'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography sx={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Progreso</Typography>
                  <LinearProgress variant="determinate" value={Math.min(100, data.tiempo.progressPct)}
                    sx={{ height: 8, borderRadius: 4, mt: 0.5, bgcolor: '#e5e7eb',
                      '& .MuiLinearProgress-bar': { bgcolor: ACCENT } }} />
                  <Typography sx={{ fontSize: '0.75rem', color: NAVY, fontWeight: 700, mt: 0.5 }}>
                    {data.tiempo.progressPct}%
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Chip label={data.campaign.isActive ? 'Activa' : 'Pausada'}
                    sx={{ fontWeight: 700, bgcolor: data.campaign.isActive ? '#dcfce7' : '#fee2e2', color: data.campaign.isActive ? ACCENT : '#b91c1c' }} />
                </Grid>
              </Grid>
            </Card>

            {/* KPIs principales */}
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Kpi label="Impresiones" value={fmtNum(data.resumen.impressions)} color="#0369a1" />
              <Kpi label="Clics" value={fmtNum(data.resumen.clicks)} color="#6d28d9" />
              <Kpi label="CTR" value={fmtPct(data.resumen.ctr)} color={data.resumen.ctr >= 2 ? ACCENT : '#f59e0b'} />
              <Kpi label="Alcance único" value={fmtNum(data.resumen.reach)} color="#0369a1" />
              <Kpi label="Frecuencia" value={data.resumen.frequency ? data.resumen.frequency.toFixed(2) : '—'} color="#64748b" hint="impresiones por usuario" />
              <Kpi label="Leads" value={fmtNum(data.resumen.leads)} color={ACCENT} />
              <Kpi label="CPM" value={data.resumen.cpm ? fmtCOP(data.resumen.cpm) : '—'} color="#f59e0b" hint="costo por mil impresiones" />
              <Kpi label="CPC" value={data.resumen.cpc ? fmtCOP(data.resumen.cpc) : '—'} color="#f59e0b" hint="costo por click" />
              <Kpi label="CPL" value={data.resumen.cpl ? fmtCOP(data.resumen.cpl) : '—'} color="#f59e0b" hint="costo por lead" />
              <Kpi label="Inversión" value={fmtCOP(data.resumen.inversionTotalCOP)} color={NAVY} />
              <Kpi label="Ritmo diario" value={fmtNum(data.tiempo.dailyPace)} color="#0369a1" hint="impresiones/día" />
              <Kpi label="Proyección total" value={fmtNum(data.tiempo.projectedImpressions)} color="#6d28d9" hint="al final del periodo" />
            </Grid>

            {/* Tabs desglose */}
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
              sx={{ borderBottom: '1px solid #e5e7eb', mb: 2,
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 40 },
                '& .Mui-selected': { color: ACCENT },
                '& .MuiTabs-indicator': { backgroundColor: ACCENT } }}>
              <Tab label="Tendencia diaria" />
              <Tab label={`Ciudades (${data.byCity?.length || 0})`} />
              <Tab label={`Dispositivos (${data.byDevice?.length || 0})`} />
              <Tab label={`Fuentes (${data.bySource?.length || 0})`} />
            </Tabs>

            {tab === 0 && <DailyTrend rows={data.dailyTrend} />}
            {tab === 1 && <BreakdownTable rows={data.byCity} keyCol="city" />}
            {tab === 2 && <BreakdownTable rows={data.byDevice} keyCol="device" />}
            {tab === 3 && <BreakdownTable rows={data.bySource} keyCol="source" />}

            <Divider sx={{ my: 3 }} />

            {/* PDF */}
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button size="small" onClick={onClose} sx={{ textTransform: 'none' }}>Cerrar</Button>
              <Button
                variant="contained" startIcon={<PictureAsPdfOutlined />}
                onClick={handleDownloadPdf} disabled={downloading}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 3,
                  background: ACCENT, '&:hover': { background: ACCENT, filter: 'brightness(0.95)' } }}>
                {downloading ? 'Generando PDF…' : 'Descargar informe PDF'}
              </Button>
            </Stack>
          </>
        )}
      </Box>
    </Drawer>
  );
}

// ─── Sub-componentes ───
function Kpi({ label, value, color, hint }) {
  return (
    <Grid item xs={6} sm={4} md={3}>
      <Card sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: '8px', height: '100%' }}>
        <Typography sx={{ fontSize: '0.65rem', letterSpacing: '0.05em', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, mb: 0.25 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '1.15rem', fontWeight: 900, color, lineHeight: 1.15 }}>{value}</Typography>
        {hint && <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', mt: 0.25 }}>{hint}</Typography>}
      </Card>
    </Grid>
  );
}

function DailyTrend({ rows = [] }) {
  const max = Math.max(1, ...rows.map((r) => r.impressions || 0));
  if (rows.length === 0) return <Typography sx={{ color: '#94a3b8', fontStyle: 'italic', p: 2 }}>Aún sin métricas diarias.</Typography>;
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>Fecha</TableCell>
          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>Impr.</TableCell>
          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>Clicks</TableCell>
          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>Leads</TableCell>
          <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>Volumen</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={i}>
            <TableCell sx={{ fontSize: '0.8rem' }}>{r.date}</TableCell>
            <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{r.impressions.toLocaleString('es-CO')}</TableCell>
            <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{r.clicks.toLocaleString('es-CO')}</TableCell>
            <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{r.leads.toLocaleString('es-CO')}</TableCell>
            <TableCell sx={{ width: '30%' }}>
              <Box sx={{ height: 6, bgcolor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ width: `${(r.impressions / max) * 100}%`, height: '100%', background: `linear-gradient(90deg,${ACCENT},#86efac)` }} />
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function BreakdownTable({ rows = [], keyCol }) {
  const max = Math.max(1, ...rows.map((r) => r.impressions || 0));
  if (rows.length === 0) return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Typography sx={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.875rem' }}>
        Sin datos aún. Aparecerán cuando el sitio empiece a servir esta creatividad y los eventos se registren con ciudad/dispositivo/fuente.
      </Typography>
    </Box>
  );
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>
            {keyCol === 'city' ? 'Ciudad' : keyCol === 'device' ? 'Dispositivo' : 'Fuente'}
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>Impresiones</TableCell>
          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>Clicks</TableCell>
          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>CTR</TableCell>
          <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>Volumen</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r, i) => {
          const ctr = r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0;
          return (
            <TableRow key={i}>
              <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600, textTransform: keyCol === 'device' ? 'capitalize' : 'none' }}>{r[keyCol]}</TableCell>
              <TableCell align="right" sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{r.impressions.toLocaleString('es-CO')}</TableCell>
              <TableCell align="right" sx={{ fontSize: '0.85rem' }}>{r.clicks.toLocaleString('es-CO')}</TableCell>
              <TableCell align="right" sx={{ fontSize: '0.85rem', color: ctr >= 2 ? ACCENT : '#64748b', fontWeight: 700 }}>{ctr.toFixed(2)}%</TableCell>
              <TableCell sx={{ width: '30%' }}>
                <Box sx={{ height: 6, bgcolor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <Box sx={{ width: `${(r.impressions / max) * 100}%`, height: '100%', background: `linear-gradient(90deg,${ACCENT},#86efac)` }} />
                </Box>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
