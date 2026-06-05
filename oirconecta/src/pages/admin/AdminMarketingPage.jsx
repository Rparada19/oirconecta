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

const ACCENT = '#085946';
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

  const reload = async () => {
    setLoading(true);
    const [s, c, a, ca] = await Promise.all([
      adminFetch('/api/marketing/admin/stats'),
      adminFetch('/api/marketing/catalog'),
      adminFetch('/api/marketing/admin/advertisers'),
      adminFetch('/api/marketing/admin/campaigns'),
    ]);
    if (s?.data?.success) setStats(s.data.data);
    if (c?.data?.success) setCatalog(c.data.data);
    if (a?.data?.success) setAdvertisers(a.data.data.items || []);
    if (ca?.data?.success) setCampaigns(ca.data.data.items || []);
    setLoading(false);
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
                <Grid item xs={6} md={3}><StatCard icon={CampaignOutlinedIcon} label="CTR promedio" value={stats?.ctrPromedio ? `${stats.ctrPromedio}%` : '—'} color="#6d28d9" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={CampaignOutlinedIcon} label="Leads (mes)" value={stats?.leadsMes ?? '—'} color="#6d28d9" /></Grid>
              </Grid>
              <Alert severity="info" sx={{ borderRadius: '8px' }}>
                Las métricas de impresiones, clics, CTR y leads se activan al desplegar M2 (tracking en sitio público).
              </Alert>
            </>
          )}

          {/* ─── TAB 1: CATÁLOGO ─── */}
          {tab === 1 && (
            <Box>
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
                          <Box sx={{ p: 2, pt: 0 }}>
                            <Button fullWidth size="small" variant="outlined" startIcon={<AddRoundedIcon />}
                              onClick={() => setCampDialog({ actionType: a.code })}
                              sx={{ borderColor: ACCENT, color: ACCENT, textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
                              Crear campaña
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
                        {['Campaña', 'Anunciante', 'Tipo', 'Estado', 'ON/OFF', 'Periodo', 'Precio', 'Acciones'].map((h) => (
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
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.75rem' }}>
                              {fmtDate(c.startDate)}<br />
                              <span style={{ color: '#94a3b8' }}>↓ {fmtDate(c.endDate)}</span>
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>{fmtCOP(c.priceCOP)}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.5}>
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
                        <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                          Sin campañas aún. Crea la primera desde el catálogo.
                        </TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Card>
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
                      {['Nombre', 'Tipo', 'Contacto', 'Campañas', 'Acciones'].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {advertisers.map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{a.nombre}</Typography>
                          {a.nit && <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>NIT {a.nit}</Typography>}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8125rem' }}>{a.tipo}</TableCell>
                        <TableCell sx={{ fontSize: '0.8125rem' }}>
                          {a.contactoNombre && <div>{a.contactoNombre}</div>}
                          {a.contactoEmail && <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{a.contactoEmail}</div>}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>{a._count?.campaigns || 0}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => setAdvDialog({ data: a })}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => deleteAdvertiser(a)} sx={{ color: '#b91c1c' }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {advertisers.length === 0 && (
                      <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
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

      <CampaignDialog open={!!campDialog} initialActionType={campDialog?.actionType}
        data={campDialog?.data} advertisers={advertisers} catalog={catalog.items}
        onClose={() => setCampDialog(null)}
        onSaved={() => { setCampDialog(null); reload(); setToast({ severity: 'success', msg: 'Campaña guardada' }); }} />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {toast && <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ borderRadius: '8px' }}>{toast.msg}</Alert>}
      </Snackbar>
    </Box>
  );
}

// ─── Uploader de creatividad (Cloudinary vía backend) ───
function CreativeUploader({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

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
      {value.creativeUrl ? (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1.5, borderRadius: '8px', bgcolor: '#f8fafc', border: '1px solid #e5e7eb' }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '6px', overflow: 'hidden', flexShrink: 0, bgcolor: '#000' }}>
            {value.creativeType === 'video' ? (
              <video src={value.creativeUrl} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={value.creativeUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: NAVY }}>
              {value.creativeType === 'video' ? 'Video' : 'Imagen'} · {value.creativeWidth}×{value.creativeHeight}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {value.creativeUrl}
            </Typography>
          </Box>
          <Button size="small" onClick={() => onChange({ creativeUrl: null, creativePublicId: null, creativeType: null, creativeWidth: null, creativeHeight: null })}
            sx={{ color: '#b91c1c', textTransform: 'none' }}>
            Cambiar
          </Button>
        </Box>
      ) : (
        <Box component="label" sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
          py: 3, borderRadius: '8px', border: '2px dashed #cbd5e1', cursor: 'pointer',
          color: '#64748b', '&:hover': { borderColor: ACCENT, color: ACCENT, bgcolor: `${ACCENT}05` },
        }}>
          {busy ? <CircularProgress size={20} /> : <CloudUploadOutlinedIcon />}
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {busy ? 'Subiendo…' : 'Subir imagen, GIF o video (máx 10MB)'}
          </Typography>
          <input type="file" hidden accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
            onChange={(e) => handleFile(e.target.files?.[0])} />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
    </Box>
  );
}

// ─── Dialog Anunciante ───
function AdvertiserDialog({ open, data, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(data || { tipo: 'CASA_COMERCIAL' });
  }, [open, data]);

  const save = async () => {
    setSaving(true);
    const url = data?.id ? `/api/marketing/admin/advertisers/${data.id}` : '/api/marketing/admin/advertisers';
    const method = data?.id ? 'PATCH' : 'POST';
    const r = await adminFetch(url, { method, body: JSON.stringify(form) });
    setSaving(false);
    if (r?.data?.success) onSaved();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>{data?.id ? 'Editar anunciante' : 'Nuevo anunciante'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Nombre *" fullWidth value={form.nombre || ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <TextField select label="Tipo" fullWidth value={form.tipo || 'CASA_COMERCIAL'} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            {['CASA_COMERCIAL','PROFESIONAL','CLINICA','MARCA','OTRO'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField label="Contacto nombre" fullWidth value={form.contactoNombre || ''} onChange={(e) => setForm({ ...form, contactoNombre: e.target.value })} />
          <TextField label="Contacto email" fullWidth value={form.contactoEmail || ''} onChange={(e) => setForm({ ...form, contactoEmail: e.target.value })} />
          <TextField label="Contacto teléfono" fullWidth value={form.contactoTelefono || ''} onChange={(e) => setForm({ ...form, contactoTelefono: e.target.value })} />
          <TextField label="Email facturación" fullWidth value={form.emailFacturacion || ''} onChange={(e) => setForm({ ...form, emailFacturacion: e.target.value })} />
          <TextField label="NIT" fullWidth value={form.nit || ''} onChange={(e) => setForm({ ...form, nit: e.target.value })} />
          <TextField label="Notas internas" fullWidth multiline rows={2} value={form.notas || ''} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
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

  const save = async () => {
    setSaving(true);
    const url = data?.id ? `/api/marketing/admin/campaigns/${data.id}` : '/api/marketing/admin/campaigns';
    const method = data?.id ? 'PATCH' : 'POST';
    const r = await adminFetch(url, { method, body: JSON.stringify(form) });
    setSaving(false);
    if (r?.data?.success) onSaved();
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>{data?.id ? 'Editar campaña' : 'Nueva campaña'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
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
            <CreativeUploader value={form} onChange={(patch) => setForm({ ...form, ...patch })} />
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
