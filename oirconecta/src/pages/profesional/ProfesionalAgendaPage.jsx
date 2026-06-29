/**
 * F2.4 — Panel del profesional para configurar su agenda multi-tenant.
 * Consume /api/professional-agenda/me/*.
 *
 * 4 tabs: Configuración general, Tipos de consulta, Horario semanal, Bloqueos.
 * Bloquea uso si plan no incluye 'agenda' (Plan 2/3) → CTA a /suscripcion.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Tabs, Tab, Switch, TextField,
  MenuItem, IconButton, Stack, Chip, CircularProgress, Alert, Snackbar, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControlLabel, Table, TableHead,
  TableRow, TableCell, TableBody, Divider, Grid, Tooltip,
} from '@mui/material';
import {
  EventOutlined, AddOutlined, DeleteOutlineOutlined, SaveOutlined,
  WorkspacePremiumOutlined, EditOutlined, BlockOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { directoryApi } from '../../services/directoryAccountApi';
import ProfesionalPageHeader from '../../components/profesional/ProfesionalPageHeader';

const ACCENT = '#15803d';
const NAVY = '#0F2A4A';

const TIMEZONES = [
  'America/Bogota', 'America/Mexico_City', 'America/Lima', 'America/Caracas',
  'America/Santiago', 'America/Argentina/Buenos_Aires', 'America/Panama',
];

const DOW_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const TIPOS_BLOQUEO = [
  { value: '', label: 'Sin tipo' },
  { value: 'VACACIONES', label: 'Vacaciones' },
  { value: 'ENFERMEDAD', label: 'Enfermedad' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'FERIADO', label: 'Feriado' },
  { value: 'OTRO', label: 'Otro' },
];

// ─────────────────────────────────────────────────────────────
// Página
// ─────────────────────────────────────────────────────────────

export default function ProfesionalAgendaPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState(null); // 402/409 → bloquea acceso
  const [snack, setSnack] = useState(null);

  const [config, setConfig] = useState(null);
  const [types, setTypes] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [blocks, setBlocks] = useState([]);

  const showSnack = (message, severity = 'success') => setSnack({ message, severity });

  // Carga inicial: el primer GET valida feature, los siguientes asumen acceso.
  const loadAll = useCallback(async () => {
    setLoading(true);
    const cfg = await directoryApi.get('/api/professional-agenda/me/config');
    if (cfg.error) {
      setAccessError({ status: cfg.status, message: cfg.error, code: cfg.data?.code });
      setLoading(false);
      return;
    }
    setConfig(cfg.data.data);
    const [t, a, b] = await Promise.all([
      directoryApi.get('/api/professional-agenda/me/types?includeInactive=1'),
      directoryApi.get('/api/professional-agenda/me/availability'),
      directoryApi.get('/api/professional-agenda/me/blocks'),
    ]);
    if (t.data?.data) setTypes(t.data.data);
    if (a.data?.data) setAvailability(a.data.data);
    if (b.data?.data) setBlocks(b.data.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (accessError) {
    const isUpgrade = accessError.code === 'AGENDA_NOT_INCLUDED' || accessError.code === 'NO_SUBSCRIPTION';
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <ProfesionalPageHeader
          icon={EventOutlined} title="Mi agenda"
          subtitle="Sistema de agendamiento para tus pacientes" />
        <Card sx={{ mt: 2, borderRadius: '14px', border: '1px solid #e5e7eb', maxWidth: 720 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <WorkspacePremiumOutlined sx={{ fontSize: 56, color: '#a16207', mb: 2 }} />
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: NAVY, mb: 1 }}>
              {isUpgrade ? 'Esta función requiere Plan 2 o Plan 3' : 'Acceso a agenda no disponible'}
            </Typography>
            <Typography sx={{ color: '#475569', mb: 3 }}>
              {accessError.message}
            </Typography>
            {isUpgrade && (
              <Button variant="contained"
                onClick={() => navigate('/portal-profesional/suscripcion')}
                sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700, borderRadius: '8px', px: 4 }}>
                Ver planes
              </Button>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <ProfesionalPageHeader
        icon={EventOutlined} title="Mi agenda"
        subtitle="Configura horarios, tipos de consulta y bloqueos. Tus pacientes reservarán según estas reglas." />

      {!config?.agendaActiva && (
        <Alert severity="warning" sx={{ mt: 2, borderRadius: '10px' }}>
          Tu agenda en línea está <strong>pausada</strong>. Mientras siga así, los pacientes no podrán reservar desde tu perfil público. Actívala en la pestaña Configuración.
        </Alert>
      )}

      <Card sx={{ mt: 2, borderRadius: '14px', border: '1px solid #e5e7eb' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: '1px solid #e5e7eb', px: 2,
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                '& .Mui-selected': { color: ACCENT },
                '& .MuiTabs-indicator': { backgroundColor: ACCENT } }}>
          <Tab label="Configuración" />
          <Tab label={`Tipos de consulta (${types.length})`} />
          <Tab label="Horario semanal" />
          <Tab label={`Bloqueos (${blocks.length})`} />
        </Tabs>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {tab === 0 && <ConfigTab config={config} setConfig={setConfig} showSnack={showSnack} />}
          {tab === 1 && <TypesTab types={types} setTypes={setTypes} showSnack={showSnack} />}
          {tab === 2 && <AvailabilityTab availability={availability} setAvailability={setAvailability} showSnack={showSnack} />}
          {tab === 3 && <BlocksTab blocks={blocks} setBlocks={setBlocks} showSnack={showSnack} />}
        </Box>
      </Card>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack && <Alert onClose={() => setSnack(null)} severity={snack.severity}>{snack.message}</Alert>}
      </Snackbar>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 1: Configuración general
// ─────────────────────────────────────────────────────────────

function ConfigTab({ config, setConfig, showSnack }) {
  const [form, setForm] = useState(config);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setForm(config); }, [config]);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = async () => {
    setSaving(true);
    const r = await directoryApi.put('/api/professional-agenda/me/config', form);
    setSaving(false);
    if (r.error) return showSnack(r.error, 'error');
    setConfig(r.data.data);
    showSnack('Configuración guardada');
  };

  return (
    <Box>
      <Card sx={{ p: 2.5, mb: 3, border: '1px solid #e5e7eb', borderRadius: '10px',
                  bgcolor: form?.agendaActiva ? '#f0fdf4' : '#fefce8' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography sx={{ fontWeight: 800, color: NAVY }}>Agenda en línea</Typography>
            <Typography sx={{ fontSize: '0.875rem', color: '#475569' }}>
              {form?.agendaActiva
                ? 'Los pacientes pueden reservar desde tu perfil público.'
                : 'Tu agenda está pausada. Actívala cuando hayas configurado tipos y horario.'}
            </Typography>
          </Box>
          <FormControlLabel
            control={<Switch checked={!!form?.agendaActiva}
              onChange={(e) => upd('agendaActiva', e.target.checked)}
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: ACCENT },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: ACCENT } }} />}
            label={form?.agendaActiva ? 'Activa' : 'Pausada'}
          />
        </Stack>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField fullWidth size="small" type="number" label="Duración por defecto (min)"
            value={form?.defaultSlotMinutes ?? 30}
            onChange={(e) => upd('defaultSlotMinutes', parseInt(e.target.value) || 0)}
            helperText="Se usa cuando un tipo de consulta no define su propia duración." />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth size="small" type="number" label="Buffer entre citas (min)"
            value={form?.bufferMinutes ?? 0}
            onChange={(e) => upd('bufferMinutes', parseInt(e.target.value) || 0)}
            helperText="Tiempo de respiro adicional entre citas consecutivas." />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth size="small" type="number" label="Ventana de reserva (días)"
            value={form?.bookingWindowDays ?? 60}
            onChange={(e) => upd('bookingWindowDays', parseInt(e.target.value) || 0)}
            helperText="Anticipación máxima a la que un paciente puede reservar." />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth size="small" type="number" label="Anticipación mínima (horas)"
            value={form?.minNoticeHours ?? 2}
            onChange={(e) => upd('minNoticeHours', parseInt(e.target.value) || 0)}
            helperText="Mínimo de horas entre ahora y la cita más cercana reservable." />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth select size="small" label="Zona horaria"
            value={form?.timezone || 'America/Bogota'}
            onChange={(e) => upd('timezone', e.target.value)}>
            {TIMEZONES.map((tz) => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControlLabel
            control={<Switch checked={!!form?.autoConfirm}
              onChange={(e) => upd('autoConfirm', e.target.checked)} />}
            label={form?.autoConfirm ? 'Confirmación automática' : 'Requiere tu aprobación'} />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" startIcon={<SaveOutlined />} onClick={save} disabled={saving}
          sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </Button>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 2: Tipos de consulta
// ─────────────────────────────────────────────────────────────

function TypesTab({ types, setTypes, showSnack }) {
  const [editing, setEditing] = useState(null); // null | {row}
  const [open, setOpen] = useState(false);

  const newType = () => { setEditing({ nombre: '', durationMinutes: 30, priceCOP: '', color: '#15803d', orden: types.length, activo: true }); setOpen(true); };
  const editType = (t) => { setEditing({ ...t, priceCOP: t.priceCOP ?? '' }); setOpen(true); };

  const save = async () => {
    const body = {
      nombre: editing.nombre.trim(),
      descripcion: editing.descripcion || null,
      durationMinutes: parseInt(editing.durationMinutes) || 30,
      priceCOP: editing.priceCOP === '' ? null : parseInt(editing.priceCOP),
      color: editing.color || null,
      orden: parseInt(editing.orden) || 0,
      activo: !!editing.activo,
    };
    if (!body.nombre) return showSnack('Nombre requerido', 'error');
    const r = editing.id
      ? await directoryApi.patch(`/api/professional-agenda/me/types/${editing.id}`, body)
      : await directoryApi.post('/api/professional-agenda/me/types', body);
    if (r.error) return showSnack(r.error, 'error');
    setOpen(false);
    // recarga local
    const fresh = await directoryApi.get('/api/professional-agenda/me/types?includeInactive=1');
    if (fresh.data?.data) setTypes(fresh.data.data);
    showSnack(editing.id ? 'Tipo actualizado' : 'Tipo creado');
  };

  const remove = async (t) => {
    if (!window.confirm(`¿Desactivar "${t.nombre}"? Las citas que ya lo usan no se afectan.`)) return;
    const r = await directoryApi.delete(`/api/professional-agenda/me/types/${t.id}`);
    if (r.error) return showSnack(r.error, 'error');
    setTypes((arr) => arr.map((x) => x.id === t.id ? { ...x, activo: false } : x));
    showSnack('Tipo desactivado');
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}>
          Define los distintos servicios que ofreces. Cada uno tiene su propia duración y precio.
        </Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={newType}
          sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
          Nuevo tipo
        </Button>
      </Stack>

      {types.length === 0 ? (
        <EmptyState text="Aún no has creado tipos de consulta. Crea al menos uno para que los pacientes puedan reservar." />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Nombre', 'Duración', 'Precio', 'Estado', 'Acciones'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {types.map((t) => (
              <TableRow key={t.id} hover>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {t.color && <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: t.color }} />}
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: NAVY }}>{t.nombre}</Typography>
                      {t.descripcion && <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.descripcion}</Typography>}
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>{t.durationMinutes} min</TableCell>
                <TableCell>{t.priceCOP ? `$${t.priceCOP.toLocaleString('es-CO')}` : '—'}</TableCell>
                <TableCell>
                  <Chip size="small" label={t.activo ? 'Activo' : 'Inactivo'}
                    sx={{ bgcolor: t.activo ? '#dcfce7' : '#f1f5f9', color: t.activo ? '#15803d' : '#64748b', fontWeight: 700 }} />
                </TableCell>
                <TableCell>
                  <Tooltip title="Editar"><IconButton size="small" onClick={() => editType(t)}><EditOutlined fontSize="small" /></IconButton></Tooltip>
                  {t.activo && (
                    <Tooltip title="Desactivar"><IconButton size="small" onClick={() => remove(t)}><DeleteOutlineOutlined fontSize="small" /></IconButton></Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>{editing?.id ? 'Editar tipo' : 'Nuevo tipo de consulta'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Nombre" required fullWidth size="small"
              value={editing?.nombre || ''} onChange={(e) => setEditing({ ...editing, nombre: e.target.value })} />
            <TextField label="Descripción (opcional)" fullWidth size="small" multiline minRows={2}
              value={editing?.descripcion || ''} onChange={(e) => setEditing({ ...editing, descripcion: e.target.value })} />
            <Stack direction="row" spacing={2}>
              <TextField label="Duración (min)" type="number" size="small" sx={{ flex: 1 }}
                value={editing?.durationMinutes || ''} onChange={(e) => setEditing({ ...editing, durationMinutes: e.target.value })} />
              <TextField label="Precio COP (sin IVA, opc.)" type="number" size="small" sx={{ flex: 1 }}
                value={editing?.priceCOP ?? ''} onChange={(e) => setEditing({ ...editing, priceCOP: e.target.value })} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Color (hex)" size="small" sx={{ flex: 1 }}
                value={editing?.color || ''} onChange={(e) => setEditing({ ...editing, color: e.target.value })} placeholder="#15803d" />
              <TextField label="Orden" type="number" size="small" sx={{ flex: 1 }}
                value={editing?.orden ?? 0} onChange={(e) => setEditing({ ...editing, orden: e.target.value })} />
            </Stack>
            {editing?.id && (
              <FormControlLabel control={<Switch checked={!!editing.activo}
                onChange={(e) => setEditing({ ...editing, activo: e.target.checked })} />}
                label={editing.activo ? 'Activo' : 'Inactivo'} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" onClick={save}
            sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700 }}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 3: Horario semanal (grilla simple, una fila por franja)
// ─────────────────────────────────────────────────────────────

function AvailabilityTab({ availability, setAvailability, showSnack }) {
  // Trabajamos sobre copia local; "Guardar semana" reemplaza atómicamente.
  const [rows, setRows] = useState(availability);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setRows(availability); }, [availability]);

  const addRow = (dow) => setRows((r) => [...r, { dayOfWeek: dow, startTime: '09:00', endTime: '12:00', active: true, _tmp: Math.random() }]);
  const updRow = (idx, k, v) => setRows((r) => r.map((row, i) => i === idx ? { ...row, [k]: v } : row));
  const delRow = (idx) => setRows((r) => r.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    const payload = rows.map((r) => ({
      dayOfWeek: r.dayOfWeek, startTime: r.startTime, endTime: r.endTime, active: r.active !== false,
    }));
    const r = await directoryApi.put('/api/professional-agenda/me/availability/weekly', { rows: payload });
    setSaving(false);
    if (r.error) return showSnack(r.error, 'error');
    const fresh = await directoryApi.get('/api/professional-agenda/me/availability');
    if (fresh.data?.data) setAvailability(fresh.data.data);
    showSnack('Horario guardado');
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}>
          Define en qué franjas trabajas cada día. Puedes tener varias franjas por día (ej. mañana y tarde).
        </Typography>
        <Button variant="contained" startIcon={<SaveOutlined />} onClick={save} disabled={saving}
          sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
          {saving ? 'Guardando…' : 'Guardar semana'}
        </Button>
      </Stack>

      {DOW_LABELS.map((label, dow) => {
        const dayRows = rows.map((r, i) => ({ r, i })).filter(({ r }) => r.dayOfWeek === dow);
        return (
          <Card key={dow} sx={{ mb: 2, border: '1px solid #e5e7eb', borderRadius: '10px' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: dayRows.length ? 1.5 : 0 }}>
                <Typography sx={{ fontWeight: 700, color: NAVY, minWidth: 110 }}>{label}</Typography>
                <Button size="small" startIcon={<AddOutlined />} onClick={() => addRow(dow)}
                  sx={{ textTransform: 'none', color: ACCENT }}>Agregar franja</Button>
              </Stack>
              {dayRows.length === 0 ? (
                <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8', pl: 0.5 }}>
                  Día sin atención.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {dayRows.map(({ r, i }) => (
                    <Stack key={r.id || r._tmp || i} direction="row" spacing={1} alignItems="center">
                      <TextField size="small" type="time" value={r.startTime}
                        onChange={(e) => updRow(i, 'startTime', e.target.value)} sx={{ width: 130 }} />
                      <Typography sx={{ color: '#94a3b8' }}>a</Typography>
                      <TextField size="small" type="time" value={r.endTime}
                        onChange={(e) => updRow(i, 'endTime', e.target.value)} sx={{ width: 130 }} />
                      <FormControlLabel control={<Switch checked={r.active !== false} size="small"
                        onChange={(e) => updRow(i, 'active', e.target.checked)} />}
                        label={r.active !== false ? 'Activa' : 'Pausada'} />
                      <IconButton size="small" onClick={() => delRow(i)}><DeleteOutlineOutlined fontSize="small" /></IconButton>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// Tab 4: Bloqueos (vacaciones, días libres, horas específicas)
// ─────────────────────────────────────────────────────────────

function BlocksTab({ blocks, setBlocks, showSnack }) {
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const newBlock = () => {
    const now = new Date();
    const start = new Date(now); start.setHours(now.getHours() + 1, 0, 0, 0);
    const end = new Date(start); end.setHours(end.getHours() + 1);
    setEditing({
      startAt: toLocalInput(start), endAt: toLocalInput(end),
      allDay: false, tipo: '', motivo: '',
    });
    setOpen(true);
  };

  const save = async () => {
    const body = {
      startAt: new Date(editing.startAt).toISOString(),
      endAt: new Date(editing.endAt).toISOString(),
      allDay: !!editing.allDay,
      tipo: editing.tipo || null,
      motivo: editing.motivo || null,
    };
    const r = editing.id
      ? await directoryApi.patch(`/api/professional-agenda/me/blocks/${editing.id}`, body)
      : await directoryApi.post('/api/professional-agenda/me/blocks', body);
    if (r.error) return showSnack(r.error, 'error');
    setOpen(false);
    const fresh = await directoryApi.get('/api/professional-agenda/me/blocks');
    if (fresh.data?.data) setBlocks(fresh.data.data);
    showSnack(editing.id ? 'Bloqueo actualizado' : 'Bloqueo creado');
  };

  const remove = async (b) => {
    if (!window.confirm('¿Eliminar este bloqueo?')) return;
    const r = await directoryApi.delete(`/api/professional-agenda/me/blocks/${b.id}`);
    if (r.error) return showSnack(r.error, 'error');
    setBlocks((arr) => arr.filter((x) => x.id !== b.id));
    showSnack('Bloqueo eliminado');
  };

  const editBlock = (b) => {
    setEditing({
      ...b,
      startAt: toLocalInput(new Date(b.startAt)),
      endAt: toLocalInput(new Date(b.endAt)),
      tipo: b.tipo || '',
      motivo: b.motivo || '',
    });
    setOpen(true);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}>
          Vacaciones, días libres o franjas específicas que NO deben ofrecerse a pacientes.
        </Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={newBlock}
          sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}>
          Nuevo bloqueo
        </Button>
      </Stack>

      {blocks.length === 0 ? (
        <EmptyState text="No hay bloqueos. Tus pacientes pueden reservar en cualquier franja de tu horario semanal." icon={BlockOutlined} />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Desde', 'Hasta', 'Día completo', 'Tipo', 'Motivo', 'Acciones'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569', textTransform: 'uppercase' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {blocks.map((b) => (
              <TableRow key={b.id} hover>
                <TableCell sx={{ fontSize: '0.8125rem' }}>{fmtDT(b.startAt)}</TableCell>
                <TableCell sx={{ fontSize: '0.8125rem' }}>{fmtDT(b.endAt)}</TableCell>
                <TableCell>{b.allDay ? 'Sí' : 'No'}</TableCell>
                <TableCell>{b.tipo || '—'}</TableCell>
                <TableCell sx={{ fontSize: '0.8125rem' }}>{b.motivo || '—'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => editBlock(b)}><EditOutlined fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => remove(b)}><DeleteOutlineOutlined fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>{editing?.id ? 'Editar bloqueo' : 'Nuevo bloqueo'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControlLabel control={<Switch checked={!!editing?.allDay}
              onChange={(e) => setEditing({ ...editing, allDay: e.target.checked })} />}
              label="Día(s) completo(s)" />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Desde" type="datetime-local" InputLabelProps={{ shrink: true }} size="small" sx={{ flex: 1 }}
                value={editing?.startAt || ''} onChange={(e) => setEditing({ ...editing, startAt: e.target.value })} />
              <TextField label="Hasta" type="datetime-local" InputLabelProps={{ shrink: true }} size="small" sx={{ flex: 1 }}
                value={editing?.endAt || ''} onChange={(e) => setEditing({ ...editing, endAt: e.target.value })} />
            </Stack>
            <TextField select label="Tipo" size="small" value={editing?.tipo || ''}
              onChange={(e) => setEditing({ ...editing, tipo: e.target.value })}>
              {TIPOS_BLOQUEO.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField label="Motivo (opc.)" size="small" multiline minRows={2}
              value={editing?.motivo || ''} onChange={(e) => setEditing({ ...editing, motivo: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" onClick={save}
            sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700 }}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// Helpers visuales
// ─────────────────────────────────────────────────────────────

function EmptyState({ text, icon: Icon = EventOutlined }) {
  return (
    <Box sx={{ textAlign: 'center', py: 5, color: '#94a3b8' }}>
      <Icon sx={{ fontSize: 48, mb: 1 }} />
      <Typography sx={{ fontSize: '0.875rem' }}>{text}</Typography>
    </Box>
  );
}

function toLocalInput(d) {
  // formato para <input type="datetime-local">
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDT(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-CO', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}
