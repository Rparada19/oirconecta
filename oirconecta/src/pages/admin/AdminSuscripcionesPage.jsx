import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Table, TableHead, TableBody, TableRow, TableCell,
  TextField, MenuItem, Chip, Button, Stack, CircularProgress, Tooltip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert,
} from '@mui/material';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import { adminFetch } from './adminAuth';

const ACCENT = '#085946';
const NAVY = '#272F50';

const STATUS_COLOR = {
  TRIAL: { bg: '#e0f2fe', fg: '#0369a1', label: 'En prueba' },
  ACTIVE: { bg: '#dcfce7', fg: '#15803d', label: 'Activo' },
  EXPIRING_SOON: { bg: '#fef3c7', fg: '#a16207', label: 'Por vencer' },
  EXPIRED: { bg: '#fee2e2', fg: '#b91c1c', label: 'Vencido' },
  PAST_DUE: { bg: '#fecaca', fg: '#991b1b', label: 'En mora' },
  SUSPENDED: { bg: '#e5e7eb', fg: '#374151', label: 'Suspendido' },
  CANCELED: { bg: '#f3f4f6', fg: '#4b5563', label: 'Cancelado' },
  PENDING: { bg: '#ede9fe', fg: '#6d28d9', label: 'Pendiente' },
};

const ESTADOS = ['', 'TRIAL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'PAST_DUE', 'SUSPENDED', 'CANCELED'];
const PLANES = ['', 'TRIAL_90D', 'ANUAL', 'PLAN_2_ANUAL', 'PLAN_3_MENSUAL', 'MENSUAL', 'EMPRESA'];
const PROFESIONES = [
  { slug: '', label: 'Todas' },
  { slug: 'fonoaudiologia', label: 'Fonoaudiología' },
  { slug: 'audiologia', label: 'Audiología' },
  { slug: 'otorrinolaringologia', label: 'Otorrinolaringología' },
  { slug: 'otologia', label: 'Otología' },
];

const fmtCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—';

function StatCard({ icon: Icon, label, value, hint, color = ACCENT }) {
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
        {hint && <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mt: 0.5 }}>{hint}</Typography>}
      </CardContent>
    </Card>
  );
}

export default function AdminSuscripcionesPage() {
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ ciudad: '', profesionSlug: '', status: '', plan: '' });
  const [q, setQ] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null); // sub a cancelar
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    const [s, l] = await Promise.all([
      adminFetch('/api/subscriptions/admin/stats'),
      adminFetch(`/api/subscriptions/admin/list?${params.toString()}&limit=500`),
    ]);
    if (s?.data?.success) setStats(s.data.data);
    if (l?.data?.success) {
      setItems(l.data.data.items || []);
      setTotal(l.data.data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [filters]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((i) =>
      (i.nombre || '').toLowerCase().includes(term) ||
      (i.email || '').toLowerCase().includes(term)
    );
  }, [items, q]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setWorking(true);
    const r = await adminFetch(`/api/subscriptions/admin/${cancelTarget.id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ motivo: cancelMotivo, immediate: true }),
    });
    setWorking(false);
    if (r?.data?.success) {
      setToast({ severity: 'success', msg: `Suscripción de ${cancelTarget.nombre || cancelTarget.email} cancelada. Email de despedida enviado.` });
      setCancelTarget(null); setCancelMotivo('');
      fetchAll();
    } else {
      setToast({ severity: 'error', msg: r?.error || 'No se pudo cancelar' });
    }
  };

  const handleReactivate = async (sub) => {
    if (!window.confirm(`¿Reactivar la suscripción de ${sub.nombre || sub.email}? Se le concederán 30 días desde hoy.`)) return;
    setWorking(true);
    const r = await adminFetch(`/api/subscriptions/admin/${sub.id}/reactivate`, {
      method: 'POST',
      body: JSON.stringify({ extendDays: 30 }),
    });
    setWorking(false);
    if (r?.data?.success) {
      setToast({ severity: 'success', msg: `Suscripción reactivada. Email enviado.` });
      fetchAll();
    } else {
      setToast({ severity: 'error', msg: r?.error || 'No se pudo reactivar' });
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    const token = localStorage.getItem('oirconecta_admin_token');
    const url = `${import.meta.env.VITE_API_URL || ''}/api/subscriptions/admin/export.csv?${params.toString()}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `suscripciones-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: NAVY, letterSpacing: '-0.02em' }}>
            Suscripciones
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.9375rem' }}>
            Gestión del ciclo de membresías de profesionales.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Recargar">
            <IconButton onClick={fetchAll}><RefreshRoundedIcon /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<DownloadRoundedIcon />} onClick={handleExport}
            sx={{ background: ACCENT, borderRadius: '8px', textTransform: 'none', fontWeight: 700,
              '&:hover': { background: '#064a3a' } }}>
            Exportar CSV
          </Button>
        </Stack>
      </Stack>

      {/* KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><StatCard icon={PeopleAltOutlinedIcon} label="Total" value={stats?.totalProfesionales ?? '—'} /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={HourglassEmptyOutlinedIcon} label="En prueba" value={stats?.enPrueba ?? '—'} color="#0369a1" /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={CheckCircleOutlineIcon} label="Activos" value={stats?.activos ?? '—'} color="#15803d" /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={WarningAmberRoundedIcon} label="En mora" value={stats?.enMora ?? '—'} color="#b91c1c" /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={BlockOutlinedIcon} label="Suspendidos" value={stats?.suspendidos ?? '—'} color="#374151" /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={AttachMoneyRoundedIcon} label="MRR (sin IVA)" value={fmtCOP(stats?.mrrCOP)} color={ACCENT} hint={`${stats?.suscripcionesMensualActivas || 0} mensuales + ${stats?.suscripcionesAnualActivas || 0} anuales`} /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={AttachMoneyRoundedIcon} label="ARR" value={fmtCOP(stats?.arrCOP)} color={ACCENT} /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={BlockOutlinedIcon} label="Vencidos" value={stats?.vencidos ?? '—'} color="#a16207" /></Grid>
      </Grid>

      {/* Planes vigentes — referencia rápida para cotizar */}
      <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', mb: 3, overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.75, bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.95rem' }}>
            Planes vigentes
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
            Referencia para cotización telefónica · precios en COP, IVA 19% aparte
          </Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Plan', 'Para quién', 'Precio (sin IVA)', 'IVA 19%', 'Total cobrado', 'Vigencia'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[
              { plan: 'Prueba gratuita',        target: 'Todos los registros nuevos',                 precio: 0,       vig: '120 días' },
              { plan: 'Plan 1 · Anual',         target: 'Directorio + Marketing',                     precio: 200000,  vig: '12 meses',  badge: 'Trial 120 días' },
              { plan: 'Plan 2 · Anual',         target: '+ Sistema de Agendamiento (Google Calendar)', precio: 500000,  vig: '12 meses',  badge: 'Trial 120 días' },
              { plan: 'Plan 3 · Mensual',       target: '+ Agente IA (hasta 300 conv/mes)',           precio: 120000,  vig: '1 mes',     badge: 'Permanencia 12 meses' },
              { plan: 'Mensual (legacy)',       target: 'Profesional independiente',                  precio: 20000,   vig: '30 días',   nota: 'plan legacy — no se ofrece a nuevos' },
              { plan: 'Empresa o centro (legacy)', target: 'Persona jurídica · por sede',             precio: 20000,   vig: '30 días',   nota: '× cada sede · plan legacy' },
            ].map((row) => {
              const iva = Math.round(row.precio * 0.19);
              return (
                <TableRow key={row.plan} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: NAVY }}>{row.plan}</Typography>
                      {row.badge && (
                        <Chip label={row.badge} size="small"
                          sx={{ bgcolor: '#fef3c7', color: '#a16207', fontWeight: 700, fontSize: '0.65rem', height: 18 }} />
                      )}
                    </Stack>
                    {row.nota && (
                      <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{row.nota}</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem', color: '#475569' }}>{row.target}</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', fontWeight: 700, color: NAVY }}>
                    {row.precio === 0 ? '—' : fmtCOP(row.precio)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    {row.precio === 0 ? '—' : fmtCOP(iva)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.875rem', fontWeight: 800, color: ACCENT }}>
                    {row.precio === 0 ? '$0' : fmtCOP(row.precio + iva)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem' }}>{row.vig}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Filtros */}
      <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', p: 2, mb: 2 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField fullWidth size="small" placeholder="Buscar por nombre o email"
              value={q} onChange={(e) => setQ(e.target.value)}
              InputProps={{ sx: { borderRadius: '8px' } }} />
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField select fullWidth size="small" label="Estado"
              value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              InputProps={{ sx: { borderRadius: '8px' } }}>
              {ESTADOS.map((e) => (
                <MenuItem key={e || 'all'} value={e}>{e ? STATUS_COLOR[e]?.label || e : 'Todos'}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField select fullWidth size="small" label="Plan"
              value={filters.plan} onChange={(e) => setFilters({ ...filters, plan: e.target.value })}
              InputProps={{ sx: { borderRadius: '8px' } }}>
              {PLANES.map((p) => (
                <MenuItem key={p || 'all'} value={p}>{p || 'Todos'}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField select fullWidth size="small" label="Especialidad"
              value={filters.profesionSlug} onChange={(e) => setFilters({ ...filters, profesionSlug: e.target.value })}
              InputProps={{ sx: { borderRadius: '8px' } }}>
              {PROFESIONES.map((p) => (
                <MenuItem key={p.slug || 'all'} value={p.slug}>{p.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} md={2}>
            <TextField fullWidth size="small" label="Ciudad" placeholder="ej: Bogotá"
              value={filters.ciudad} onChange={(e) => setFilters({ ...filters, ciudad: e.target.value })}
              InputProps={{ sx: { borderRadius: '8px' } }} />
          </Grid>
        </Grid>
      </Card>

      {/* Tabla */}
      <Card sx={{ borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  {['Nombre', 'Especialidad', 'Ciudad', 'Plan', 'Estado', 'Vence', 'Días restantes', 'Mora', 'Último pago', 'Acciones'].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((s) => {
                  const sc = STATUS_COLOR[s.status] || { bg: '#f3f4f6', fg: '#4b5563', label: s.status };
                  return (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.nombre || '—'}</Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.email}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem' }}>{s.especialidad || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem' }}>{s.ciudad || '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem' }}>{s.planNombre || '—'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={sc.label}
                          sx={{ bgcolor: sc.bg, color: sc.fg, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem' }}>{fmtDate(s.currentPeriodEnd)}</TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                        {s.diasRestantes}d
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', color: s.diasMora > 0 ? '#b91c1c' : '#94a3b8' }}>
                        {s.diasMora > 0 ? `${s.diasMora}d` : '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem' }}>{fmtDate(s.lastPaymentAt)}</TableCell>
                      <TableCell>
                        {s.status === 'CANCELED' || s.status === 'SUSPENDED' ? (
                          <Tooltip title="Reactivar">
                            <IconButton size="small" disabled={working} onClick={() => handleReactivate(s)}
                              sx={{ color: ACCENT, '&:hover': { bgcolor: `${ACCENT}10` } }}>
                              <RestartAltRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Dar de baja">
                            <IconButton size="small" disabled={working} onClick={() => setCancelTarget(s)}
                              sx={{ color: '#b91c1c', '&:hover': { bgcolor: '#fee2e2' } }}>
                              <PersonOffOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                      Sin resultados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <Typography sx={{ mt: 2, fontSize: '0.75rem', color: '#94a3b8' }}>
        Mostrando {filtered.length} de {total} suscripciones.
      </Typography>

      {/* Dialog cancelación */}
      <Dialog open={!!cancelTarget} onClose={() => !working && setCancelTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>
          Dar de baja suscripción
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Vas a cancelar la suscripción de <strong>{cancelTarget?.nombre || cancelTarget?.email}</strong>.
            Su perfil dejará de aparecer en el directorio público de inmediato y recibirá un correo de despedida.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            La información (perfil, reseñas, historial) se conserva. Puedes reactivar después si hace falta.
          </Alert>
          <TextField fullWidth multiline rows={3} label="Motivo (opcional, queda registrado)"
            value={cancelMotivo} onChange={(e) => setCancelMotivo(e.target.value)}
            placeholder="Ej: solicitó cancelación por WhatsApp, falta de uso, cambió de actividad..." />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelTarget(null)} disabled={working}>Cancelar</Button>
          <Button onClick={handleCancel} disabled={working} variant="contained"
            startIcon={working ? <CircularProgress size={16} color="inherit" /> : <PersonOffOutlinedIcon />}
            sx={{ background: '#b91c1c', '&:hover': { background: '#991b1b' } }}>
            Dar de baja
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {toast && <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ borderRadius: '8px' }}>{toast.msg}</Alert>}
      </Snackbar>
    </Box>
  );
}
