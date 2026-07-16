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
  WorkspacePremiumOutlined, EditOutlined, BlockOutlined, CalendarMonthOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { directoryApi } from '../../services/directoryAccountApi';
import ProfesionalPageHeader from '../../components/profesional/ProfesionalPageHeader';
import AgendaCalendarView from '../../components/profesional/AgendaCalendarView';
import CancellationFollowUpAlert from '../../components/profesional/CancellationFollowUpAlert';
import GoogleCalendarCard from '../../components/profesional/GoogleCalendarCard';

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
  const [appointments, setAppointments] = useState({ items: [], upcoming: 0 });

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
    const [t, a, b, ap] = await Promise.all([
      directoryApi.get('/api/professional-agenda/me/types?includeInactive=1'),
      directoryApi.get('/api/professional-agenda/me/availability'),
      directoryApi.get('/api/professional-agenda/me/blocks'),
      directoryApi.get('/api/professional-agenda/me/appointments'),
    ]);
    if (t.data?.data) setTypes(t.data.data);
    if (a.data?.data) setAvailability(a.data.data);
    if (b.data?.data) setBlocks(b.data.data);
    if (ap.data?.data) setAppointments(ap.data.data);
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

      {/* Alerta de cancelaciones pendientes de seguimiento */}
      <CancellationFollowUpAlert />

      <Card sx={{ mt: 2, borderRadius: '14px', border: '1px solid #e5e7eb' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: '1px solid #e5e7eb', px: 2,
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                '& .Mui-selected': { color: ACCENT },
                '& .MuiTabs-indicator': { backgroundColor: ACCENT } }}>
          <Tab label={`Próximas citas (${appointments.upcoming || 0})`} />
          <Tab icon={<CalendarMonthOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Calendario" />
          <Tab label="Configuración" />
          <Tab label={`Tipos de consulta (${types.length})`} />
          <Tab label="Horario semanal" />
          <Tab label={`Bloqueos (${blocks.length})`} />
        </Tabs>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {tab === 0 && <AppointmentsTab appointments={appointments} setAppointments={setAppointments} showSnack={showSnack} />}
          {tab === 1 && <AgendaCalendarView appointments={appointments.items || []} blocks={blocks} availability={availability} />}
          {tab === 2 && <ConfigTab config={config} setConfig={setConfig} showSnack={showSnack} />}
          {tab === 3 && <TypesTab types={types} setTypes={setTypes} showSnack={showSnack} />}
          {tab === 4 && <AvailabilityTab availability={availability} setAvailability={setAvailability} showSnack={showSnack} />}
          {tab === 5 && <BlocksTab blocks={blocks} setBlocks={setBlocks} showSnack={showSnack} />}
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

  // La card de Google Calendar se muestra arriba de la configuración general.

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
      <GoogleCalendarCard />
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

  const toMin = (t) => { const [h, m] = (t || '00:00').split(':').map(Number); return h * 60 + m; };
  const toHHMM = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

  // Defaults inteligentes: si ya hay franja(s) en el día, la nueva arranca
  // 2h después del fin de la última (típico hueco de almuerzo). Si no, 07:00-12:00.
  const addRow = (dow) => setRows((r) => {
    const existing = r.filter((x) => x.dayOfWeek === dow);
    let start = '07:00', end = '12:00';
    if (existing.length > 0) {
      const lastEnd = Math.max(...existing.map((x) => toMin(x.endTime)));
      const newStart = Math.min(lastEnd + 120, 22 * 60); // +2h, tope 22:00
      start = toHHMM(newStart);
      end = toHHMM(Math.min(newStart + 180, 23 * 60));   // bloque de 3h por defecto
    }
    return [...r, { dayOfWeek: dow, startTime: start, endTime: end, active: true, _tmp: Math.random() }];
  });

  // Divide automáticamente el día en mañana 07-12 y tarde 14-17 (típico Colombia).
  const splitDay = (dow) => setRows((r) => {
    const others = r.filter((x) => x.dayOfWeek !== dow);
    return [
      ...others,
      { dayOfWeek: dow, startTime: '07:00', endTime: '12:00', active: true, _tmp: Math.random() },
      { dayOfWeek: dow, startTime: '14:00', endTime: '17:00', active: true, _tmp: Math.random() + 1 },
    ];
  });

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
        <Box>
          <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}>
            Define en qué franjas trabajas cada día. Puedes tener <strong>varias franjas por día</strong> (ej. mañana 07:00–12:00, tarde 14:00–17:00).
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mt: 0.25 }}>
            Tip: para días con hueco de almuerzo usa el botón "Mañana + tarde" — agrega ambas franjas de un click.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<SaveOutlined />} onClick={save} disabled={saving}
          sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700, borderRadius: '8px', flexShrink: 0, ml: 2 }}>
          {saving ? 'Guardando…' : 'Guardar semana'}
        </Button>
      </Stack>

      {DOW_LABELS.map((label, dow) => {
        const dayRows = rows.map((r, i) => ({ r, i })).filter(({ r }) => r.dayOfWeek === dow);
        return (
          <Card key={dow} sx={{ mb: 2, border: '1px solid #e5e7eb', borderRadius: '10px' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: dayRows.length ? 1.5 : 0 }}>
                <Typography sx={{ fontWeight: 700, color: NAVY, minWidth: 110 }}>
                  {label} {dayRows.length > 1 && <Chip size="small" label={`${dayRows.length} franjas`}
                    sx={{ ml: 0.5, height: 18, fontSize: '0.65rem', bgcolor: '#e0f2fe', color: '#0369a1' }} />}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => splitDay(dow)}
                    sx={{ textTransform: 'none', color: '#0369a1' }}>Mañana + tarde</Button>
                  <Button size="small" startIcon={<AddOutlined />} onClick={() => addRow(dow)}
                    sx={{ textTransform: 'none', color: ACCENT }}>Agregar franja</Button>
                </Stack>
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
// Tab 0: Próximas citas (lectura, con cancelar)
// ─────────────────────────────────────────────────────────────

function AppointmentsTab({ appointments, setAppointments, showSnack }) {
  const [filter, setFilter] = useState('UPCOMING'); // UPCOMING | ALL | TODAY
  const items = appointments?.items || [];

  const todayStr = new Date().toISOString().slice(0, 10);
  const filtered = items.filter((a) => {
    const d = new Date(a.fecha).toISOString().slice(0, 10);
    if (filter === 'TODAY') return d === todayStr && a.estado !== 'CANCELLED';
    if (filter === 'UPCOMING') return d >= todayStr && a.estado !== 'CANCELLED';
    return true;
  });

  const reload = async () => {
    const r = await directoryApi.get('/api/professional-agenda/me/appointments');
    if (r.data?.data) setAppointments(r.data.data);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ color: '#475569', fontSize: '0.875rem' }}>
          Citas reservadas por pacientes desde tu perfil público. Aparecen automáticamente al confirmar.
        </Typography>
        <Stack direction="row" spacing={0.5}>
          {[
            { v: 'UPCOMING', l: 'Próximas' },
            { v: 'TODAY',    l: 'Hoy' },
            { v: 'ALL',      l: 'Todas' },
          ].map((opt) => (
            <Chip key={opt.v} label={opt.l} size="small" onClick={() => setFilter(opt.v)}
              sx={{ fontWeight: 700, cursor: 'pointer',
                bgcolor: filter === opt.v ? ACCENT : '#f1f5f9',
                color: filter === opt.v ? '#fff' : NAVY,
                '&:hover': { bgcolor: filter === opt.v ? ACCENT : '#e2e8f0' } }} />
          ))}
        </Stack>
      </Stack>

      {filtered.length === 0 ? (
        <EmptyState text={filter === 'UPCOMING'
          ? 'No tienes citas próximas. Aparecerán acá cuando un paciente reserve desde tu perfil.'
          : filter === 'TODAY'
          ? 'No tienes citas para hoy.'
          : 'No se encontraron citas en el rango actual (próximos 30 días).'} />
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Fecha', 'Hora', 'Paciente', 'Contacto', 'Tipo', 'Estado', 'Acciones'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((a) => {
              // Fix TZ: a.fecha viene como "2026-07-21T00:00:00.000Z";
              // toLocaleDateString en UTC-5 lo mueve al día anterior. Cortar a YYYY-MM-DD
              // y reconstruir como fecha local del día real.
              const ymd = String(a.fecha).slice(0, 10);
              const [_y, _m, _d] = ymd.split('-').map(Number);
              const fechaLocal = new Date(_y, _m - 1, _d);
              const fechaStr = fechaLocal.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });
              const isCancel = a.estado === 'CANCELLED';
              const isPast = ymd < todayStr;
              return (
                <TableRow key={a.id} hover sx={{ opacity: isCancel ? 0.55 : 1 }}>
                  <TableCell sx={{ fontWeight: 600, color: NAVY }}>{fechaStr}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: NAVY }}>{a.hora} <Typography component="span" sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>· {a.durationMinutes || 30}min</Typography></TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{a.patient?.nombre || a.patientName || '—'}</Typography>
                    {a.patient?.numeroDocumento && <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{a.patient.tipoDocumento} {a.patient.numeroDocumento}</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem' }}>
                    {a.patient?.telefono || a.patientPhone || '—'}
                    {(a.patient?.email || a.patientEmail) && <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{a.patient?.email || a.patientEmail}</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem' }}>{a.tipoConsulta || '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={
                      isCancel ? 'Cancelada' :
                      a.estado === 'COMPLETED' ? 'Completada' :
                      a.estado === 'NO_SHOW' ? 'No asistió' :
                      isPast ? 'Pasada' : 'Confirmada'}
                      sx={{ fontWeight: 700, fontSize: '0.7rem',
                        bgcolor: isCancel ? '#fee2e2' : a.estado === 'COMPLETED' ? '#dcfce7' : isPast ? '#f1f5f9' : '#e0f2fe',
                        color: isCancel ? '#b91c1c' : a.estado === 'COMPLETED' ? '#15803d' : isPast ? '#64748b' : '#0369a1' }} />
                  </TableCell>
                  <TableCell>
                    {!isCancel && !isPast && (
                      <Tooltip title="Cancelar cita">
                        <IconButton size="small" onClick={async () => {
                          if (!window.confirm(`¿Cancelar la cita con ${a.patient?.nombre || a.patientName} del ${fechaStr} ${a.hora}?`)) return;
                          const r = await directoryApi.patch(`/api/professional-agenda/me/appointments/${a.id}`, { estado: 'CANCELLED' });
                          if (r.error) return showSnack(r.error, 'error');
                          showSnack('Cita cancelada');
                          reload();
                        }}>
                          <DeleteOutlineOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
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
