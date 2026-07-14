import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Card, CardContent, Grid, Stack, Chip, Button,
  Table, TableHead, TableBody, TableRow, TableCell, IconButton, Switch, TextField,
  MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Snackbar, Alert, Tooltip,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LaunchRoundedIcon from '@mui/icons-material/LaunchRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import MouseOutlinedIcon from '@mui/icons-material/MouseOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import { adminFetch } from './adminAuth';
import AdvertiserDetailDrawer from './AdvertiserDetailDrawer';
import MarketingPreviewDialog from './MarketingPreviewDialog';
import CampaignPagesSelector from './CampaignPagesSelector';
import CampaignLivePreview from './CampaignLivePreview';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import CampaignInsightsDrawer from './CampaignInsightsDrawer';

const PIPELINE_COLOR = {
  PROSPECT:    { bg: '#f1f5f9', fg: '#64748b', label: 'Prospecto' },
  NEGOCIATING: { bg: '#ede9fe', fg: '#6d28d9', label: 'Negociando' },
  ACTIVE:      { bg: '#dcfce7', fg: '#15803d', label: 'Activo' },
  PAUSED:      { bg: '#fef3c7', fg: '#a16207', label: 'Pausado' },
  LOST:        { bg: '#fee2e2', fg: '#b91c1c', label: 'Perdido' },
};

const ACCENT = '#6d28d9';
const NAVY = '#272F50';
const GOLD = '#C9A86A';

const STATUS_COLOR = {
  DRAFT:     { bg: '#e2e8f0', fg: '#475569', label: 'Borrador' },
  SCHEDULED: { bg: '#ede9fe', fg: '#6d28d9', label: 'Programada' },
  ACTIVE:    { bg: '#dcfce7', fg: '#15803d', label: 'Activa' },
  PAUSED:    { bg: '#fef3c7', fg: '#a16207', label: 'Pausada' },
  ENDED:     { bg: '#f3f4f6', fg: '#4b5563', label: 'Finalizada' },
};

const fmtCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—';
function timeAgo(iso) {
  if (!iso) return '';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'hace segundos';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
}

function StatCard({ icon: Icon, label, value, color = ACCENT }) {
  return (
    <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
          <Box sx={{ p: 0.75, borderRadius: '8px', bgcolor: `${color}15`, display: 'flex' }}>
            <Icon sx={{ color, fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {label}
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: '1.625rem', fontWeight: 800, color: NAVY, lineHeight: 1.1 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function AdminMarketingPage() {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState(null);
  const [catalog, setCatalog] = useState({ items: [], categories: {} });
  const [advertisers, setAdvertisers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // dialogs
  const [advDialog, setAdvDialog] = useState(null); // null | {new}|{edit, data}
  const [campDialog, setCampDialog] = useState(null); // null | { actionType?: string, data?: object }
  const [insightsCampaignId, setInsightsCampaignId] = useState(null); // id de campaña con drawer abierto
  const [advDetailId, setAdvDetailId] = useState(null); // anunciante abierto en drawer
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFocusSlot, setPreviewFocusSlot] = useState(null);
  const [previewCampaign, setPreviewCampaign] = useState(null);

  const [reloadError, setReloadError] = useState(null);
  const reload = async () => {
    setLoading(true); setReloadError(null);
    try {
      const [s, c, a, ca] = await Promise.all([
        adminFetch('/api/marketing/admin/stats'),
        adminFetch('/api/marketing/catalog'),
        adminFetch('/api/marketing/admin/advertisers'),
        adminFetch('/api/marketing/admin/campaigns'),
      ]);
      // Catálogo es público; si falla, lo trato como crítico para el tab
      if (c?.data?.success) {
        setCatalog(c.data.data);
      } else {
        setReloadError(c?.data?.error || 'No se pudo cargar el catálogo de acciones');
      }
      if (s?.status === 401 || a?.status === 401 || ca?.status === 401) {
        setReloadError('Sesión expirada. Cierra sesión y vuelve a entrar al panel admin.');
      }
      if (s?.data?.success) setStats(s.data.data);
      if (a?.data?.success) setAdvertisers(a.data.data.items || []);
      if (ca?.data?.success) setCampaigns(ca.data.data.items || []);
    } catch (e) {
      setReloadError(e?.message || 'Error de red al cargar el panel');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const advertisersById = useMemo(() => Object.fromEntries(advertisers.map((a) => [a.id, a])), [advertisers]);

  const toggleCampaign = async (camp) => {
    const r = await adminFetch(`/api/marketing/admin/campaigns/${camp.id}/toggle`, {
      method: 'POST', body: JSON.stringify({ isActive: !camp.isActive }),
    });
    if (r?.data?.success) {
      setToast({ severity: 'success', msg: !camp.isActive ? 'Campaña activada' : 'Campaña pausada' });
      reload();
    }
  };
  const deleteCampaign = async (camp) => {
    if (!window.confirm(`¿Eliminar la campaña "${camp.nombre}"?`)) return;
    const r = await adminFetch(`/api/marketing/admin/campaigns/${camp.id}`, { method: 'DELETE' });
    if (r?.data?.success) { setToast({ severity: 'success', msg: 'Campaña eliminada' }); reload(); }
  };
  const deleteAdvertiser = async (a) => {
    if (!window.confirm(`¿Eliminar el anunciante "${a.nombre}"?`)) return;
    const r = await adminFetch(`/api/marketing/admin/advertisers/${a.id}`, { method: 'DELETE' });
    if (r?.data?.success) { setToast({ severity: 'success', msg: 'Anunciante eliminado' }); reload(); }
    else { setToast({ severity: 'error', msg: r?.error || 'No se pudo eliminar' }); }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: NAVY, letterSpacing: '-0.02em' }}>
            Marketing & Ventas
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.9375rem' }}>
            Catálogo de acciones, anunciantes y campañas activas.
          </Typography>
        </Box>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #e5e7eb',
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, color: '#64748b' },
          '& .Mui-selected': { color: ACCENT },
          '& .MuiTabs-indicator': { backgroundColor: ACCENT } }}>
        <Tab label="Dashboard" />
        <Tab label="Catálogo" />
        <Tab label="Campañas" />
        <Tab label="Anunciantes" />
        <Tab label="Profesionales" />
      </Tabs>

      {loading ? (
        <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>
      ) : (
        <>
          {/* ─── TAB 0: DASHBOARD ─── */}
          {tab === 0 && (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}><StatCard icon={CampaignOutlinedIcon} label="Campañas activas" value={stats?.campanasActivasAhora ?? 0} color={ACCENT} /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={BusinessOutlinedIcon} label="Anunciantes" value={stats?.anunciantesActivos ?? 0} color="#0369a1" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={EventOutlinedIcon} label="Vencen en 30d" value={stats?.campanasPorVencer30d ?? 0} color="#a16207" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={AttachMoneyRoundedIcon} label="Ingresos del mes" value={fmtCOP(stats?.ingresosMesCOP)} color={ACCENT} /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={VisibilityOutlinedIcon} label="Impresiones (mes)" value={stats?.impresionesMes ?? '—'} color="#6d28d9" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={MouseOutlinedIcon} label="Clics (mes)" value={stats?.clicsMes ?? '—'} color="#6d28d9" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={CampaignOutlinedIcon} label="CTR promedio" value={(stats?.impresionesMes || 0) > 0 ? `${(stats.ctrPromedio ?? 0).toFixed(2)}%` : '—'} color="#6d28d9" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={CampaignOutlinedIcon} label="Leads (mes)" value={stats?.leadsMes ?? '—'} color="#6d28d9" /></Grid>
              </Grid>
              <CampaignAnalytics />
              <Box sx={{ height: 24 }} />
              <CoverageWidget />
            </>
          )}

          {/* ─── TAB 1: CATÁLOGO ─── */}
          {tab === 1 && (
            <Box>
              {reloadError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}
                  action={<Button size="small" onClick={reload}>Reintentar</Button>}>
                  {reloadError}
                </Alert>
              )}
              {!reloadError && Object.keys(catalog.categories || {}).length === 0 && (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <CircularProgress />
                  <Typography sx={{ mt: 2, color: '#64748b' }}>Cargando catálogo…</Typography>
                </Box>
              )}
              {Object.entries(catalog.categories || {}).map(([cat, label]) => (
                <Box key={cat} sx={{ mb: 4 }}>
                  <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
                    {label}
                  </Typography>
                  <Grid container spacing={2}>
                    {(catalog.items || []).filter((a) => a.categoria === cat).map((a) => (
                      <Grid item xs={12} sm={6} md={4} key={a.code}>
                        <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flex: 1 }}>
                            <Chip label={a.code} size="small"
                              sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontSize: '0.65rem', fontWeight: 700, mb: 1.5 }} />
                            <Typography sx={{ fontWeight: 700, color: NAVY, mb: 0.5 }}>{a.label}</Typography>
                            <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', mb: 1.5 }}>{a.descripcion}</Typography>
                            <Stack direction="row" spacing={1} sx={{ mb: 0.5 }}>
                              <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>Sugerido:</Typography>
                              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: ACCENT }}>{fmtCOP(a.precioSugeridoCOP)}</Typography>
                            </Stack>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{a.dim}</Typography>
                          </CardContent>
                          <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                            <Button size="small" variant="contained" startIcon={<AddRoundedIcon />}
                              onClick={() => setCampDialog({ actionType: a.code })}
                              sx={{ flex: 1, background: ACCENT, color: '#fff', textTransform: 'none', fontWeight: 700, borderRadius: '8px',
                                '&:hover': { background: '#064a3a' } }}>
                              Crear
                            </Button>
                            <Button size="small" variant="outlined" startIcon={<VisibilityRoundedIcon />}
                              onClick={() => { setPreviewOpen(true); setPreviewFocusSlot(a.code); setPreviewCampaign(null); }}
                              sx={{ flexShrink: 0, borderColor: '#cbd5e1', color: '#475569', textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                              title="Vista previa del slot">
                              Previa
                            </Button>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Box>
          )}

          {/* ─── TAB 2: CAMPAÑAS ─── */}
          {tab === 2 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 700, color: NAVY }}>{campaigns.length} campañas</Typography>
                <Button variant="contained" startIcon={<AddRoundedIcon />}
                  onClick={() => setCampDialog({})}
                  sx={{ background: ACCENT, borderRadius: '8px', textTransform: 'none', fontWeight: 700,
                    '&:hover': { background: '#064a3a' } }}>
                  Nueva campaña
                </Button>
              </Stack>
              <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        {['Campaña', 'Anunciante', 'Tipo', 'Estado', 'ON/OFF', 'Impr. mes', 'Clics', 'CTR', 'Periodo', 'Precio', 'Acciones'].map((h) => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {campaigns.map((c) => {
                        const sc = STATUS_COLOR[c.status] || STATUS_COLOR.DRAFT;
                        return (
                          <TableRow key={c.id} hover>
                            <TableCell>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{c.nombre}</Typography>
                              <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{c.slug}</Typography>
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8125rem' }}>{c.advertiser?.nombre || '—'}</TableCell>
                            <TableCell sx={{ fontSize: '0.8125rem' }}>{c.actionLabel}</TableCell>
                            <TableCell>
                              <Chip size="small" label={sc.label}
                                sx={{ bgcolor: sc.bg, color: sc.fg, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                            </TableCell>
                            <TableCell>
                              <Switch size="small" checked={c.isActive} onChange={() => toggleCampaign(c)}
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: ACCENT },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: ACCENT } }} />
                              {(c.isActive ? c.activatedAt : c.deactivatedAt) && (
                                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', mt: 0.5 }}>
                                  {c.isActive ? 'Activada' : 'Apagada'} {timeAgo(c.isActive ? c.activatedAt : c.deactivatedAt)}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>{c.monthImpressions || 0}</TableCell>
                            <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>{c.monthClicks || 0}</TableCell>
                            <TableCell sx={{ fontSize: '0.8125rem', color: c.monthCTR > 0 ? ACCENT : '#94a3b8', fontWeight: 600 }}>
                              {(c.monthImpressions || 0) > 0 ? `${(c.monthCTR ?? 0).toFixed(2)}%` : '—'}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.75rem' }}>
                              {fmtDate(c.startDate)}<br />
                              <span style={{ color: '#94a3b8' }}>↓ {fmtDate(c.endDate)}</span>
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>{fmtCOP(c.priceCOP)}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.5}>
                                <Tooltip title="Vista previa">
                                  <IconButton size="small" onClick={() => { setPreviewOpen(true); setPreviewFocusSlot(c.actionType); setPreviewCampaign(c); }}
                                    sx={{ color: ACCENT }}>
                                    <VisibilityRoundedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Ver informe · KPIs, ciudad, device, fuentes, PDF">
                                  <IconButton size="small" onClick={() => setInsightsCampaignId(c.id)}
                                    sx={{ color: '#0369a1' }}>
                                    <InsightsOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Editar">
                                  <IconButton size="small" onClick={() => setCampDialog({ data: c })}>
                                    <EditOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {c.destinationUrl && (
                                  <Tooltip title="Abrir destino">
                                    <IconButton size="small" component="a" href={c.destinationUrl} target="_blank" rel="noreferrer">
                                      <LaunchRoundedIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Eliminar">
                                  <IconButton size="small" onClick={() => deleteCampaign(c)} sx={{ color: '#b91c1c' }}>
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {campaigns.length === 0 && (
                        <TableRow><TableCell colSpan={11} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                          Sin campañas aún. Crea la primera desde el catálogo.
                        </TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Card>
            </Box>
          )}

          {/* ─── TAB 4: PROFESIONALES (anunciantes tipo=PROFESIONAL) ─── */}
          {tab === 4 && (
            <Box>
              {(() => {
                const profesionales = advertisers.filter((a) => a.tipo === 'PROFESIONAL');
                return (
                  <>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, color: NAVY, fontSize: 18 }}>
                          {profesionales.length} profesionales anunciantes
                        </Typography>
                        <Typography sx={{ color: '#64748b', fontSize: 13 }}>
                          Registros generados desde el portal profesional (sección "Anúnciate").
                          Cuando un profesional solicita un formato, aparece aquí con la actividad SOLICITUD.
                        </Typography>
                      </Box>
                    </Stack>
                    <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                          <TableRow>
                            {['Profesional', 'Ciudad', 'Contacto', 'Pipeline', 'Campañas', 'Perfil', 'Acciones'].map((h) => (
                              <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>{h}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {profesionales.map((a) => {
                            const p = PIPELINE_COLOR[a.pipelineStage] || PIPELINE_COLOR.PROSPECT;
                            return (
                              <TableRow key={a.id} hover sx={{ cursor: 'pointer' }} onClick={() => setAdvDetailId(a.id)}>
                                <TableCell>
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{a.nombre}</Typography>
                                  {a.contactoEmail && (
                                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{a.contactoEmail}</Typography>
                                  )}
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.8125rem' }}>{a.ciudad || '—'}</TableCell>
                                <TableCell sx={{ fontSize: '0.8125rem' }}>{a.contactoTelefono || '—'}</TableCell>
                                <TableCell>
                                  <Chip size="small" label={p.label} sx={{ bgcolor: p.bg, color: p.fg, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                                </TableCell>
                                <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>{a._count?.campaigns || 0}</TableCell>
                                <TableCell>
                                  {a.profileId ? (
                                    <Chip size="small" label="Vinculado" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                                  ) : (
                                    <Chip size="small" label="Sin perfil" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                                  )}
                                </TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <Button size="small" variant="outlined" onClick={() => setCampDialog({ data: { advertiserId: a.id } })}
                                    sx={{ textTransform: 'none', borderColor: ACCENT, color: ACCENT }}>
                                    Crear campaña
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {profesionales.length === 0 && (
                            <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                              Ningún profesional ha solicitado anuncios todavía.
                            </TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </>
                );
              })()}
            </Box>
          )}

          {/* ─── TAB 3: ANUNCIANTES ─── */}
          {tab === 3 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 700, color: NAVY }}>{advertisers.length} anunciantes</Typography>
                <Button variant="contained" startIcon={<AddRoundedIcon />}
                  onClick={() => setAdvDialog({})}
                  sx={{ background: ACCENT, borderRadius: '8px', textTransform: 'none', fontWeight: 700,
                    '&:hover': { background: '#064a3a' } }}>
                  Nuevo anunciante
                </Button>
              </Stack>
              <Card sx={{ borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      {['Nombre', 'Marca', 'Pipeline', 'Tipo', 'Campañas', 'Acciones'].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {advertisers.map((a) => {
                      const p = PIPELINE_COLOR[a.pipelineStage] || PIPELINE_COLOR.PROSPECT;
                      return (
                        <TableRow key={a.id} hover sx={{ cursor: 'pointer' }}
                          onClick={() => setAdvDetailId(a.id)}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{a.nombre}</Typography>
                            {a.contactoNombre && <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{a.contactoNombre}</Typography>}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8125rem' }}>{a.marcaPrincipal || '—'}</TableCell>
                          <TableCell>
                            <Chip size="small" label={p.label}
                              sx={{ bgcolor: p.bg, color: p.fg, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8125rem' }}>{a.tipo}</TableCell>
                          <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>{a._count?.campaigns || 0}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <IconButton size="small" onClick={() => setAdvDialog({ data: a })}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => deleteAdvertiser(a)} sx={{ color: '#b91c1c' }}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {advertisers.length === 0 && (
                      <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                        Sin anunciantes aún.
                      </TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </Box>
          )}
        </>
      )}

      {/* Dialogs */}
      <AdvertiserDialog open={!!advDialog} data={advDialog?.data}
        onClose={() => setAdvDialog(null)}
        onSaved={() => { setAdvDialog(null); reload(); setToast({ severity: 'success', msg: 'Anunciante guardado' }); }} />

      <AdvertiserDetailDrawer open={!!advDetailId} advertiserId={advDetailId}
        onClose={() => setAdvDetailId(null)} onUpdated={reload} />

      <MarketingPreviewDialog open={previewOpen}
        focusSlot={previewFocusSlot} campaign={previewCampaign}
        onClose={() => { setPreviewOpen(false); setPreviewFocusSlot(null); setPreviewCampaign(null); }} />

      <CampaignDialog open={!!campDialog} initialActionType={campDialog?.actionType}
        data={campDialog?.data} advertisers={advertisers} catalog={catalog.items}
        onClose={() => setCampDialog(null)}
        onSaved={() => { setCampDialog(null); reload(); setToast({ severity: 'success', msg: 'Campaña guardada' }); }} />

      <CampaignInsightsDrawer campaignId={insightsCampaignId} open={!!insightsCampaignId}
        onClose={() => setInsightsCampaignId(null)} />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {toast && <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ borderRadius: '8px' }}>{toast.msg}</Alert>}
      </Snackbar>
    </Box>
  );
}

// ─── Analytics ejecutivo de campañas ───
function CampaignAnalytics() {
  const [data, setData] = useState(null);
  useEffect(() => {
    adminFetch('/api/marketing/admin/analytics').then((r) => {
      if (r?.data?.success) setData(r.data.data);
    });
  }, []);

  if (!data) {
    return (
      <Card sx={{ borderRadius: '12px', p: 3 }}>
        <CircularProgress size={20} sx={{ mr: 1 }} /> <Typography component="span">Cargando analytics…</Typography>
      </Card>
    );
  }
  const { resumen, rankings, distribucion, topAnunciantes } = data;

  return (
    <Box>
      {/* Resumen del mes */}
      <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: NAVY, mb: 1.5, letterSpacing: '-0.01em' }}>
        Resumen del mes
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard icon={CampaignOutlinedIcon} label="Activadas este mes" value={resumen.campanasActivadasMes} color={ACCENT} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={CampaignOutlinedIcon} label="Creadas este mes" value={resumen.campanasCreadasMes} color="#6d28d9" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={EventOutlinedIcon} label="Vencidas este mes" value={resumen.campanasVencidasMes} color="#a16207" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={AttachMoneyRoundedIcon} label="Inversión total mes" value={fmtCOP(resumen.inversionTotalCOP)} color={ACCENT} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={VisibilityOutlinedIcon} label="Impr. promedio / campaña" value={resumen.promedioImpresionesPorCampana.toLocaleString('es-CO')} color="#0369a1" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={MouseOutlinedIcon} label="CTR promedio" value={(resumen.totalImpresionesMes ?? 0) > 0 ? `${(resumen.ctrPromedio ?? 0).toFixed(2)}%` : '—'} color="#0369a1" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={CampaignOutlinedIcon} label="Conversión clic → lead" value={(resumen.totalClicsMes ?? 0) > 0 ? `${(resumen.conversion ?? 0).toFixed(2)}%` : '—'} color="#15803d" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard icon={AttachMoneyRoundedIcon} label="Costo por lead promedio" value={resumen.cplPromedio ? fmtCOP(resumen.cplPromedio) : '—'} color={ACCENT} />
        </Grid>
      </Grid>

      {/* Rankings: más / menos efectivas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <RankingCard title="🏆 Más efectivas (por CTR)"
            color="#15803d" bg="#dcfce7"
            items={rankings.topByCTR}
            getValue={(c) => `${c.monthCTR}%`}
            empty="Sin datos suficientes. Las métricas llegan con tracking." />
        </Grid>
        <Grid item xs={12} md={6}>
          <RankingCard title="⚠️ Menos efectivas (por CTR, mín 50 impr.)"
            color="#b91c1c" bg="#fee2e2"
            items={rankings.bottomByCTR}
            getValue={(c) => `${c.monthCTR}%`}
            empty="Sin campañas con métricas suficientes para ranking." />
        </Grid>
        <Grid item xs={12} md={6}>
          <RankingCard title="👁 Mayor alcance (impresiones)"
            color="#0369a1" bg="#e0f2fe"
            items={rankings.topByImpressions}
            getValue={(c) => c.monthImpressions.toLocaleString('es-CO')}
            empty="Aún sin impresiones registradas." />
        </Grid>
        <Grid item xs={12} md={6}>
          <RankingCard title="🎯 Más leads generados"
            color="#6d28d9" bg="#ede9fe"
            items={rankings.topByLeads}
            getValue={(c) => `${c.monthLeads} leads${c.cpl ? ` · CPL ${fmtCOP(c.cpl)}` : ''}`}
            empty="Aún sin leads registrados." />
        </Grid>
      </Grid>

      {/* Distribución + Top anunciantes */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <CardContent>
              <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.95rem', mb: 1.5 }}>
                Distribución por formato (activas)
              </Typography>
              {distribucion.length === 0 ? (
                <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8' }}>Sin campañas activas.</Typography>
              ) : (
                <Stack spacing={1}>
                  {distribucion.slice(0, 8).map((d) => {
                    const max = Math.max(...distribucion.map((x) => x.activas));
                    const pct = max > 0 ? (d.activas / max) * 100 : 0;
                    return (
                      <Box key={d.actionType}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                          <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>{d.label}</Typography>
                          <Typography sx={{ fontSize: '0.8125rem', color: ACCENT, fontWeight: 700 }}>
                            {d.activas} · {fmtCOP(d.inversionCOP)}
                          </Typography>
                        </Stack>
                        <Box sx={{ height: 6, borderRadius: 3, bgcolor: '#e2e8f0' }}>
                          <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: ACCENT, borderRadius: 3 }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
            <CardContent>
              <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.95rem', mb: 1.5 }}>
                Top anunciantes del mes
              </Typography>
              {topAnunciantes.length === 0 ? (
                <Typography sx={{ fontSize: '0.875rem', color: '#94a3b8' }}>Sin anunciantes con campañas este mes.</Typography>
              ) : (
                <Stack spacing={1.25}>
                  {topAnunciantes.map((a, idx) => (
                    <Stack key={a.advertiserId} direction="row" alignItems="center" spacing={1.5}>
                      <Box sx={{
                        width: 24, height: 24, borderRadius: '50%',
                        bgcolor: idx === 0 ? '#fef3c7' : '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.75rem',
                        color: idx === 0 ? '#a16207' : '#64748b',
                      }}>{idx + 1}</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{a.nombre || a.advertiserId.slice(0, 8)}</Typography>
                        {a.marcaPrincipal && (
                          <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{a.marcaPrincipal}</Typography>
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontWeight: 800, color: ACCENT, fontSize: '0.875rem' }}>
                          {fmtCOP(a.inversionMesCOP)}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {a.campanasMes} campaña{a.campanasMes === 1 ? '' : 's'}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {(resumen.campanasSinMetricas > 0 || resumen.campanasConMetricas === 0) && (
        <Alert severity="info" sx={{ borderRadius: '8px', mb: 2 }}>
          {resumen.campanasSinMetricas} campaña(s) sin impresiones registradas. Las métricas se llenan con el tracking en sitio público.
        </Alert>
      )}
    </Box>
  );
}

function RankingCard({ title, color, bg, items, getValue, empty }) {
  return (
    <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', height: '100%' }}>
      <CardContent>
        <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.95rem', mb: 1.5 }}>{title}</Typography>
        {items.length === 0 ? (
          <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{empty}</Typography>
        ) : (
          <Stack spacing={1}>
            {items.map((c, idx) => (
              <Stack key={c.id} direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{
                  width: 22, height: 22, borderRadius: '50%',
                  bgcolor: bg, color, fontWeight: 800, fontSize: '0.7rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{idx + 1}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.nombre}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    {c.advertiserNombre} · {c.actionType}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, color, fontSize: '0.8125rem', flexShrink: 0 }}>
                  {getValue(c)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Cobertura publicitaria ───
function CoverageWidget() {
  const [cov, setCov] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const load = () => adminFetch('/api/marketing/admin/coverage').then((r) => {
    if (r?.data?.success) setCov(r.data.data);
  });
  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true);
    await adminFetch('/api/marketing/admin/pages/sync', { method: 'POST' });
    await load();
    setSyncing(false);
  };

  if (!cov) return null;

  return (
    <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '1rem' }}>
              Cobertura publicitaria
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: '#64748b' }}>
              {cov.activeCampaigns} campaña(s) activa(s) · {cov.totalPages} página(s) en el portal
            </Typography>
          </Box>
          <Button size="small" onClick={sync} disabled={syncing}
            sx={{ color: ACCENT, textTransform: 'none', fontWeight: 700 }}>
            {syncing ? 'Sincronizando…' : 'Sincronizar páginas'}
          </Button>
        </Stack>

        <Box sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography sx={{ fontSize: '2.5rem', fontWeight: 900, color: ACCENT, lineHeight: 1 }}>
              {cov.coveragePct}%
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>
              de páginas con al menos 1 anuncio activo
            </Typography>
          </Stack>
          <Box sx={{ mt: 1, height: 8, borderRadius: 4, bgcolor: '#e2e8f0', overflow: 'hidden' }}>
            <Box sx={{ width: `${cov.coveragePct}%`, height: '100%', bgcolor: ACCENT }} />
          </Box>
        </Box>

        <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Por tipo de página
        </Typography>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Tipo</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Páginas</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Con campaña</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Cobertura</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cov.types.map((t) => {
              const pct = t.total > 0 ? Math.round((t.covered / t.total) * 100) : 0;
              return (
                <TableRow key={t.type}>
                  <TableCell sx={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>{t.type}</TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem' }}>{t.total}</TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700, color: t.covered > 0 ? ACCENT : '#94a3b8' }}>{t.covered}</TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem', color: pct > 0 ? ACCENT : '#94a3b8', fontWeight: 700 }}>{pct}%</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {cov.uncoveredSample?.length > 0 && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: '8px', bgcolor: '#fef3c7' }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#a16207', mb: 0.5 }}>
              Páginas sin anuncio (muestra de {cov.uncoveredSample.length}):
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {cov.uncoveredSample.slice(0, 8).map((p) => (
                <Chip key={p.path} label={p.path} size="small"
                  sx={{ bgcolor: '#fff', color: '#92400e', fontFamily: 'monospace', fontSize: '0.7rem', height: 22 }} />
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Config específica por tipo de acción ───
function ActionConfigPanel({ actionType, config, onChange }) {
  const cfg = config || {};
  const set = (k, v) => onChange({ ...cfg, [k]: v });

  // Configs soportadas por tipo (M2)
  const popup = ['POPUP_BIENVENIDA', 'EXIT_INTENT', 'MOBILE_INTERSTICIAL'].includes(actionType);
  const banner = ['BANNER_HERO', 'BANNER_SIDEBAR', 'BANNER_FOOTER', 'COMPARADOR_BANNER',
                  'MOBILE_STICKY_FOOTER', 'BLOG_PATROCINADOR', 'WEB_PUSH_TOAST'].includes(actionType);
  const search = actionType === 'SEARCH_DESTACADO';

  if (!popup && !banner && !search) return null;

  return (
    <Box sx={{ p: 2, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #e5e7eb' }}>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Configuración del formato
      </Typography>
      <Grid container spacing={2}>
        {popup && (
          <>
            <Grid item xs={6} md={3}>
              <TextField fullWidth size="small" type="number" label="Delay (seg)"
                value={cfg.delaySec ?? 3} onChange={(e) => set('delaySec', parseInt(e.target.value) || 0)} />
            </Grid>
            <Grid item xs={6} md={3}>
              <TextField fullWidth size="small" type="number" label="Cierre permitido tras (seg)"
                value={cfg.closeAfterSec ?? 0} onChange={(e) => set('closeAfterSec', parseInt(e.target.value) || 0)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth select size="small" label="Frecuencia"
                value={cfg.frecuencia ?? 'session'} onChange={(e) => set('frecuencia', e.target.value)}>
                <MenuItem value="session">1 por sesión</MenuItem>
                <MenuItem value="day">1 por día</MenuItem>
                <MenuItem value="always">Siempre</MenuItem>
              </TextField>
            </Grid>
          </>
        )}
        {banner && (
          <Grid item xs={12}>
            <TextField fullWidth select size="small" label="Dispositivo"
              value={cfg.device ?? 'both'} onChange={(e) => set('device', e.target.value)}
              helperText="La selección de páginas se hace en el bloque de abajo">
              <MenuItem value="both">Desktop + mobile</MenuItem>
              <MenuItem value="desktop">Solo desktop</MenuItem>
              <MenuItem value="mobile">Solo mobile</MenuItem>
            </TextField>
          </Grid>
        )}
        {search && (
          <>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Especialidad (slug)" placeholder="audiologia"
                value={cfg.especialidad ?? ''} onChange={(e) => set('especialidad', e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Ciudad"
                value={cfg.ciudad ?? ''} onChange={(e) => set('ciudad', e.target.value)} />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}

// ─── Uploader de creatividad (Cloudinary vía backend) ───
/**
 * Extrae dimensiones de la cadena `dim` del catálogo.
 * Ejemplos:
 *   "1200×300 desktop · 375×200 mobile" → [{ w:1200, h:300, label:'desktop' }, { w:375, h:200, label:'mobile' }]
 *   "600×400" → [{ w:600, h:400 }]
 *   "300×600" → [{ w:300, h:600 }]
 *   "16:9"    → [{ ratio:'16:9' }]
 */
function parseDimensions(dim) {
  if (!dim || typeof dim !== 'string') return [];
  const out = [];
  // Buscar todas las apariciones de "NNN×NNN" o "NNNxNNN"
  const re = /(\d{2,5})\s*[×xX]\s*(\d{2,5})\s*([a-záéíóúñ]*)?/g;
  let m;
  while ((m = re.exec(dim))) {
    out.push({ w: parseInt(m[1]), h: parseInt(m[2]), label: (m[3] || '').trim() });
  }
  if (out.length === 0) {
    // Ratio puro tipo "16:9"
    const rm = /^(\d{1,2}):(\d{1,2})$/.exec(dim.trim());
    if (rm) return [{ ratio: dim.trim() }];
  }
  return out;
}

/**
 * Dropzone individual (desktop o mobile). Subimos a Cloudinary y devolvemos
 * { url, publicId, type, width, height } al padre via onUploaded.
 */
function CreativeDropzone({ slotLabel, target, value, busy, setBusy, error, setError, onUploaded, onClear }) {
  const TOL = 0.12;
  const matches = (() => {
    if (!target || target.ratio) return null;
    if (!value?.width || !value?.height) return null;
    const targetRatio = target.w / target.h;
    const uploaded = value.width / value.height;
    return Math.abs(uploaded - targetRatio) / targetRatio <= TOL;
  })();

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true); setError(null);
    const fd = new FormData();
    fd.append('file', file);
    const token = localStorage.getItem('oirconecta_admin_token');
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/marketing/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error || 'Error al subir');
      onUploaded({
        url: j.data.url,
        publicId: j.data.publicId,
        type: j.data.resourceType === 'video' ? 'video' : 'image',
        width: j.data.width,
        height: j.data.height,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const labelText = slotLabel + (target ? ` · ${target.ratio || `${target.w}×${target.h}px`}` : '');

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {slotLabel}
        </Typography>
        {target && (
          <Chip size="small" label={target.ratio || `${target.w}×${target.h}`}
            sx={{ bgcolor: `${ACCENT}10`, color: ACCENT, fontWeight: 700, fontSize: '0.65rem', height: 18, fontFamily: 'monospace' }} />
        )}
      </Stack>

      {value?.url ? (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #e5e7eb' }}>
          <Box sx={{ width: 60, height: 60, borderRadius: '6px', overflow: 'hidden', flexShrink: 0, bgcolor: '#000' }}>
            {value.type === 'video' ? (
              <video src={value.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={value.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: NAVY }}>
              {value.width}×{value.height}
            </Typography>
            {target && !target.ratio && (
              <Typography sx={{ fontSize: '0.65rem', color: matches ? '#15803d' : '#a16207', fontWeight: 700 }}>
                {matches ? '✓ proporciones ok' : `⚠ esperado ${target.w}×${target.h}`}
              </Typography>
            )}
          </Box>
          <Button size="small" onClick={onClear} sx={{ color: '#b91c1c', textTransform: 'none', fontSize: '0.7rem' }}>
            Quitar
          </Button>
        </Box>
      ) : (
        <Box component="label" sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5,
          py: 2, borderRadius: '8px', border: '2px dashed #cbd5e1', cursor: busy ? 'wait' : 'pointer',
          color: '#64748b', '&:hover': { borderColor: ACCENT, color: ACCENT, bgcolor: `${ACCENT}05` },
        }}>
          {busy ? <CircularProgress size={20} /> : <CloudUploadOutlinedIcon sx={{ fontSize: 24 }} />}
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
            {busy ? 'Subiendo…' : `Subir ${slotLabel.toLowerCase()}`}
          </Typography>
          {target && !target.ratio && (
            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace' }}>
              {target.w}×{target.h}px {target.label}
            </Typography>
          )}
          <input type="file" hidden accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,video/mp4,video/quicktime"
            onChange={(e) => handleFile(e.target.files?.[0])} />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mt: 0.5, fontSize: '0.75rem' }}>{error}</Alert>}
    </Box>
  );
}

function CreativeUploader({ value, onChange, actionType, catalog }) {
  const [busyDesktop, setBusyDesktop] = useState(false);
  const [busyMobile, setBusyMobile] = useState(false);
  const [errorDesktop, setErrorDesktop] = useState(null);
  const [errorMobile, setErrorMobile] = useState(null);
  const action = catalog?.find((c) => c.code === actionType);
  const dims = parseDimensions(action?.dim);
  const desktopTarget = dims.find((d) => /desktop|escritorio/i.test(d.label || '')) || dims[0];
  const mobileTarget  = dims.find((d) => /mobile|móvil|movil/i.test(d.label || ''));
  const hasTwoVariants = !!mobileTarget && mobileTarget !== desktopTarget;

  const handleFile = async (file) => {
    if (!file) return;
    setBusy(true); setError(null);
    const fd = new FormData();
    fd.append('file', file);
    const token = localStorage.getItem('oirconecta_admin_token');
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/marketing/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error || 'Error al subir');
      onChange({
        creativeUrl: j.data.url,
        creativePublicId: j.data.publicId,
        creativeType: j.data.resourceType === 'video' ? 'video' : 'image',
        creativeWidth: j.data.width,
        creativeHeight: j.data.height,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', mb: 1, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Creatividad
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: hasTwoVariants ? { xs: '1fr', sm: '1fr 1fr' } : '1fr',
        gap: 2,
      }}>
        <CreativeDropzone
          slotLabel={hasTwoVariants ? 'Desktop' : 'Imagen principal'}
          target={desktopTarget}
          value={value.creativeUrl ? {
            url: value.creativeUrl, type: value.creativeType,
            width: value.creativeWidth, height: value.creativeHeight,
          } : null}
          busy={busyDesktop} setBusy={setBusyDesktop}
          error={errorDesktop} setError={setErrorDesktop}
          onUploaded={(u) => onChange({
            creativeUrl: u.url, creativePublicId: u.publicId,
            creativeType: u.type, creativeWidth: u.width, creativeHeight: u.height,
          })}
          onClear={() => onChange({
            creativeUrl: null, creativePublicId: null, creativeType: null,
            creativeWidth: null, creativeHeight: null,
          })} />

        {hasTwoVariants && (
          <CreativeDropzone
            slotLabel="Mobile"
            target={mobileTarget}
            value={value.creativeUrlMobile ? {
              url: value.creativeUrlMobile, type: value.creativeType,
              width: value.creativeMobileWidth, height: value.creativeMobileHeight,
            } : null}
            busy={busyMobile} setBusy={setBusyMobile}
            error={errorMobile} setError={setErrorMobile}
            onUploaded={(u) => onChange({
              creativeUrlMobile: u.url, creativeMobilePublicId: u.publicId,
              creativeMobileWidth: u.width, creativeMobileHeight: u.height,
            })}
            onClear={() => onChange({
              creativeUrlMobile: null, creativeMobilePublicId: null,
              creativeMobileWidth: null, creativeMobileHeight: null,
            })} />
        )}
      </Box>

      {hasTwoVariants && (
        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 1, fontStyle: 'italic' }}>
          Sube ambas variantes para que el anuncio se vea óptimo en cada dispositivo. Si solo subes desktop, mobile usará la misma imagen.
        </Typography>
      )}
    </Box>
  );
}

// ─── Dialog Anunciante ───
function AdvertiserDialog({ open, data, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(data || { tipo: 'CASA_COMERCIAL', pipelineStage: 'PROSPECT' });
      setError(null);
    }
  }, [open, data]);

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setUploading(true); setError(null);
    const fd = new FormData();
    fd.append('file', file);
    const token = localStorage.getItem('oirconecta_admin_token');
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/marketing/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error || 'Error al subir');
      setForm((f) => ({ ...f, logoUrl: j.data.url }));
    } catch (e) { setError(e.message); }
    finally { setUploading(false); }
  };

  const save = async () => {
    setSaving(true); setError(null);
    try {
      const url = data?.id ? `/api/marketing/admin/advertisers/${data.id}` : '/api/marketing/admin/advertisers';
      const method = data?.id ? 'PATCH' : 'POST';
      const payload = { ...form };
      delete payload.id; delete payload.contacts; delete payload.activities; delete payload.campaigns; delete payload._count;
      ['contactoEmail', 'emailFacturacion', 'sitioWeb', 'linkedinUrl', 'notas', 'nit'].forEach((k) => {
        if (payload[k] === '') payload[k] = null;
      });
      console.log('[adv] POST/PATCH', url, payload);
      const r = await adminFetch(url, { method, body: JSON.stringify(payload) });
      console.log('[adv] response', r);
      if (r?.data?.success) {
        onSaved();
      } else {
        const msg = r?.data?.error || `HTTP ${r?.status} sin mensaje del backend`;
        console.error('[adv] save fail', r);
        setError(msg);
        // Si es 401, avisa con redirect al login
        if (r?.status === 401) {
          setError('Sesión expirada. Cierra sesión y vuelve a entrar al panel admin.');
        }
      }
    } catch (e) {
      console.error('[adv] save threw', e);
      setError(e?.message || 'Error de red');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>{data?.id ? 'Editar anunciante' : 'Nuevo anunciante'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Nombre *" fullWidth value={form.nombre || ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />

          {/* Logo del anunciante */}
          <Box>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Logo del anunciante
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{
                width: 80, height: 80, borderRadius: '10px', border: '1px dashed #cbd5e1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: '#f8fafc', overflow: 'hidden', flexShrink: 0,
              }}>
                {form.logoUrl
                  ? <img src={form.logoUrl} alt="logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  : <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>Sin logo</Typography>}
              </Box>
              <Stack spacing={0.5} sx={{ flex: 1 }}>
                <Button component="label" size="small" variant="outlined" disabled={uploading}
                  sx={{ textTransform: 'none', borderRadius: '8px', alignSelf: 'flex-start' }}>
                  {uploading ? 'Subiendo…' : (form.logoUrl ? 'Cambiar logo' : 'Subir logo')}
                  <input hidden type="file" accept="image/*" onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
                </Button>
                {form.logoUrl && (
                  <Button size="small" onClick={() => setForm((f) => ({ ...f, logoUrl: null }))}
                    sx={{ textTransform: 'none', color: '#b91c1c', alignSelf: 'flex-start' }}>
                    Quitar logo
                  </Button>
                )}
                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  Aparece en la portada del informe PDF y en el drawer.
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <TextField select label="Tipo" fullWidth value={form.tipo || 'CASA_COMERCIAL'} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            {['CASA_COMERCIAL','PROFESIONAL','CLINICA','MARCA','OTRO'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField select label="Etapa del pipeline" fullWidth value={form.pipelineStage || 'PROSPECT'}
            onChange={(e) => setForm({ ...form, pipelineStage: e.target.value })}
            helperText="Estado comercial del anunciante">
            <MenuItem value="PROSPECT">Prospecto</MenuItem>
            <MenuItem value="NEGOCIATING">Negociando</MenuItem>
            <MenuItem value="ACTIVE">Activo</MenuItem>
            <MenuItem value="PAUSED">Pausado</MenuItem>
            <MenuItem value="LOST">Perdido</MenuItem>
          </TextField>
          <TextField label="Marca principal" fullWidth value={form.marcaPrincipal || ''}
            onChange={(e) => setForm({ ...form, marcaPrincipal: e.target.value })}
            helperText="Ej: Widex, Oticon (opcional)" />
          <TextField label="Contacto nombre" fullWidth value={form.contactoNombre || ''} onChange={(e) => setForm({ ...form, contactoNombre: e.target.value })} />
          <TextField label="Contacto email" fullWidth value={form.contactoEmail || ''} onChange={(e) => setForm({ ...form, contactoEmail: e.target.value })} />
          <TextField label="Contacto teléfono" fullWidth value={form.contactoTelefono || ''} onChange={(e) => setForm({ ...form, contactoTelefono: e.target.value })} />
          <TextField label="Email facturación" fullWidth value={form.emailFacturacion || ''} onChange={(e) => setForm({ ...form, emailFacturacion: e.target.value })} />
          <TextField label="NIT" fullWidth value={form.nit || ''} onChange={(e) => setForm({ ...form, nit: e.target.value })} />
          <TextField label="Notas internas" fullWidth multiline rows={2} value={form.notas || ''} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          {error && <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={save} disabled={saving || !form.nombre}
          sx={{ background: ACCENT, '&:hover': { background: '#064a3a' } }}>
          {saving ? <CircularProgress size={20} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Dialog Campaña ───
function CampaignDialog({ open, data, initialActionType, advertisers, catalog, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (data) {
      setForm({
        ...data,
        startDate: data.startDate?.slice(0, 10),
        endDate: data.endDate?.slice(0, 10),
      });
    } else {
      setForm({
        actionType: initialActionType || '',
        priceCOP: catalog?.find((a) => a.code === initialActionType)?.precioSugeridoCOP || 0,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      });
    }
  }, [open, data, initialActionType, catalog]);

  const [error, setError] = useState(null);
  const save = async () => {
    setSaving(true); setError(null);
    try {
      const url = data?.id ? `/api/marketing/admin/campaigns/${data.id}` : '/api/marketing/admin/campaigns';
      const method = data?.id ? 'PATCH' : 'POST';
      const r = await adminFetch(url, { method, body: JSON.stringify(form) });
      if (r?.data?.success) onSaved();
      else setError(r?.error || r?.data?.error || `Error ${r?.status || ''} al guardar`);
    } catch (e) {
      setError(e?.message || 'Error de red');
    } finally {
      setSaving(false);
    }
  };

  const utmsPreview = useMemo(() => {
    const slug = (form.nombre || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return {
      utm_source: 'oirconecta',
      utm_medium: (form.actionType || '').toLowerCase(),
      utm_campaign: slug || '(se genera al guardar)',
    };
  }, [form.nombre, form.actionType]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>{data?.id ? 'Editar campaña' : 'Nueva campaña'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          {/* Columna izquierda — formulario */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
            <TextField label="Nombre de la campaña *" fullWidth size="small"
              value={form.nombre || ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField select label="Anunciante *" fullWidth size="small"
              value={form.advertiserId || ''} onChange={(e) => setForm({ ...form, advertiserId: e.target.value })}>
              {advertisers.map((a) => <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField select label="Tipo de acción *" fullWidth size="small" disabled={!!data?.id}
              value={form.actionType || ''} onChange={(e) => setForm({ ...form, actionType: e.target.value })}>
              {(catalog || []).map((a) => <MenuItem key={a.code} value={a.code}>{a.label} ({a.code})</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField type="date" label="Inicio" InputLabelProps={{ shrink: true }} fullWidth size="small"
              value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField type="date" label="Fin" InputLabelProps={{ shrink: true }} fullWidth size="small"
              value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField label="URL de destino" fullWidth size="small" placeholder="https://..."
              value={form.destinationUrl || ''} onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField type="number" label="Precio acordado (COP)" fullWidth size="small"
              value={form.priceCOP || 0} onChange={(e) => setForm({ ...form, priceCOP: e.target.value })} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Notas internas" fullWidth multiline rows={2} size="small"
              value={form.internalNotes || ''} onChange={(e) => setForm({ ...form, internalNotes: e.target.value })} />
          </Grid>
          <Grid item xs={12}>
            <CreativeUploader value={form} onChange={(patch) => setForm({ ...form, ...patch })}
              actionType={form.actionType} catalog={catalog} />
          </Grid>
          <Grid item xs={12}>
            <ActionConfigPanel actionType={form.actionType} config={form.config || {}}
              onChange={(config) => setForm({ ...form, config })} />
          </Grid>
          <Grid item xs={12}>
            <CampaignPagesSelector
              actionType={form.actionType}
              value={form.pagesConfig}
              onChange={(pagesConfig) => setForm({ ...form, pagesConfig })} />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ p: 2, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
              <Typography sx={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                UTMs que se generarán
              </Typography>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: NAVY }}>
                ?utm_source={utmsPreview.utm_source}&utm_medium={utmsPreview.utm_medium}&utm_campaign={utmsPreview.utm_campaign}
              </Typography>
            </Box>
          </Grid>
          {error && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ borderRadius: '8px' }}>{error}</Alert>
                </Grid>
              )}
            </Grid>
          </Grid>

          {/* Columna derecha — vista previa en vivo */}
          <Grid item xs={12} md={4}>
            <CampaignLivePreview form={form} advertisers={advertisers} catalog={catalog} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={save}
          disabled={saving || !form.nombre || !form.advertiserId || !form.actionType || !form.startDate || !form.endDate}
          sx={{ background: ACCENT, '&:hover': { background: '#064a3a' } }}>
          {saving ? <CircularProgress size={20} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
