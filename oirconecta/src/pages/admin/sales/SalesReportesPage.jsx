/**
 * Reportes del CRM Sales — KPIs del ejecutivo + pipeline + actividad.
 */
import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, IconButton } from '@mui/material';
import { InsightsOutlined, PersonAddAlt1Outlined, DeleteOutlined } from '@mui/icons-material';
import { salesApi, STATUS_META, PIPELINE_STAGES } from '../../../services/salesApi';
import { SalesPageHeader, softCard } from './SalesShell';
import { getAdminUser } from '../adminAuth';
import { canAccessAllAdminPages } from '../../../utils/rolePermissions';

export default function SalesReportesPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [snack, setSnack] = useState(null);
  const isAdmin = canAccessAllAdminPages(getAdminUser()?.role || 'ADMIN');

  useEffect(() => {
    salesApi.stats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
    if (isAdmin) salesApi.listUsers().then(setUsers).catch(() => {});
  }, [isAdmin]);

  const reloadUsers = () => salesApi.listUsers().then(setUsers).catch(() => {});

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#085946' }} /></Box>;

  const counts = stats?.byStatus || {};
  const total = stats?.open + stats?.closed || 0;

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <SalesPageHeader
        icon={InsightsOutlined}
        title="Reportes"
        subtitle="KPIs de captación, pipeline y actividad"
        actions={isAdmin ? (
          <Button onClick={() => setCreateOpen(true)} startIcon={<PersonAddAlt1Outlined />} variant="contained"
            sx={{ bgcolor: '#4054B2', textTransform: 'none', fontWeight: 700, borderRadius: 1.5, '&:hover': { bgcolor: '#32449a' } }}>
            Crear ejecutivo
          </Button>
        ) : null}
      />

      {/* KPIs */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
        <Kpi label="Pipeline abierto" value={stats?.open ?? 0} tone="info" />
        <Kpi label="Convertidos" value={counts.CONVERTIDO ?? 0} tone="success" />
        <Kpi label="En prueba" value={counts.EN_PRUEBA ?? 0} tone="violet" />
        <Kpi label="Tasa conversión" value={stats?.conversionRate != null ? `${stats.conversionRate}%` : '—'} tone="warning" />
      </Box>

      {/* Pipeline visual */}
      <Box sx={{ ...softCard, p: 2.5, mb: 3 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b6b7a', mb: 1.5 }}>
          Pipeline por estado
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.875 }}>
          {PIPELINE_STAGES.map((s) => {
            const c = counts[s] || 0;
            const pct = total > 0 ? Math.round((c / total) * 100) : 0;
            const m = STATUS_META[s];
            return (
              <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: m.color, minWidth: 130 }}>{m.label}</Typography>
                <Box sx={{ flex: 1, height: 22, bgcolor: '#f3f4f6', borderRadius: 1, overflow: 'hidden' }}>
                  <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: m.color, transition: 'width 240ms ease' }} />
                </Box>
                <Typography sx={{ fontSize: 12.5, color: '#5b6b7a', minWidth: 60, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {c} · {pct}%
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Actividad */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
        <Kpi label="Actividades hoy" value={stats?.activities?.today ?? 0} tone="info" hint="Llamadas + emails + WA" />
        <Kpi label="Esta semana" value={stats?.activities?.week ?? 0} tone="violet" />
        <Kpi label="Este mes" value={stats?.activities?.month ?? 0} tone="success" />
      </Box>

      {/* Equipo (solo admin) */}
      {isAdmin && (
        <Box sx={{ ...softCard, p: 2.5, mt: 3 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b6b7a', mb: 1.5 }}>
            Equipo de captación
          </Typography>
          {users.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: '#5b6b7a', textAlign: 'center', py: 2 }}>
              Sin usuarios aún. Crea un ejecutivo comercial para asignar leads.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.875 }}>
              {users.map((u) => (
                <Box key={u.id} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  p: 1.25, border: '1px solid #f0f2f4', borderRadius: 1.5,
                }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: 1, fontSize: 13, fontWeight: 800,
                    bgcolor: u.role === 'ADMIN' ? '#272F50' : '#4054B2', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{(u.nombre || '?').charAt(0).toUpperCase()}</Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#041a12' }}>{u.nombre}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: '#5b6b7a' }}>{u.email}</Typography>
                  </Box>
                  <Box sx={{
                    bgcolor: u.role === 'ADMIN' ? '#eef0fb' : '#ecfdf5',
                    color: u.role === 'ADMIN' ? '#272F50' : '#047857',
                    px: 1, py: 0.25, borderRadius: 0.75, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em',
                  }}>{u.role}</Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      <CreateExecutiveDialog open={createOpen} onClose={() => setCreateOpen(false)}
        onCreated={() => { setCreateOpen(false); reloadUsers(); setSnack({ severity: 'success', msg: 'Ejecutivo creado' }); }}
        setSnack={setSnack} />

      <Snackbar open={!!snack} autoHideDuration={2400} onClose={() => setSnack(null)}>
        {snack ? <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert> : null}
      </Snackbar>
    </Container>
  );
}

function CreateExecutiveDialog({ open, onClose, onCreated, setSnack }) {
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async () => {
    if (!form.nombre || !form.email || !form.password) {
      setSnack({ severity: 'error', msg: 'Todos los campos son requeridos' });
      return;
    }
    if (form.password.length < 8) {
      setSnack({ severity: 'error', msg: 'Password mínimo 8 caracteres' });
      return;
    }
    setSaving(true);
    try {
      await salesApi.createUser(form);
      setForm({ nombre: '', email: '', password: '' });
      onCreated();
    } catch (e) { setSnack({ severity: 'error', msg: e.message }); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#272F50' }}>
        Crear ejecutivo comercial
        <Typography sx={{ fontSize: 12, color: '#5b6b7a', fontWeight: 500, mt: 0.25 }}>
          Tendrá acceso solo al CRM Sales en portal-admin.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField label="Nombre completo" value={form.nombre} onChange={set('nombre')} size="small" />
          <TextField label="Email corporativo" type="email" value={form.email} onChange={set('email')} size="small" />
          <TextField label="Password temporal" type="password" value={form.password} onChange={set('password')} size="small"
            helperText="Mínimo 8 caracteres — el ejecutivo lo usará para entrar a /admin-login" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#5b6b7a' }}>Cancelar</Button>
        <Button onClick={submit} disabled={saving} variant="contained"
          sx={{ bgcolor: '#4054B2', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#32449a' } }}>
          {saving ? 'Creando…' : 'Crear ejecutivo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const TONES = {
  info:    { bar: '#3b82f6', num: '#1e40af' },
  success: { bar: '#10b981', num: '#065f46' },
  violet:  { bar: '#8b5cf6', num: '#5b21b6' },
  warning: { bar: '#f59e0b', num: '#92400e' },
};

function Kpi({ label, value, hint, tone = 'info' }) {
  const t = TONES[tone] || TONES.info;
  return (
    <Box sx={{
      bgcolor: '#fff', border: '1px solid #e5e7eb', borderLeft: `3px solid ${t.bar}`,
      borderRadius: 2, px: 2, py: 1.75,
    }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#5b6b7a' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 700, color: t.num, lineHeight: 1.2, mt: 0.25, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
      {hint && <Typography sx={{ fontSize: 11.5, color: '#5b6b7a', mt: 0.25 }}>{hint}</Typography>}
    </Box>
  );
}
