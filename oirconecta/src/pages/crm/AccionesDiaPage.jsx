import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
} from '@mui/material';
import {
  Notifications,
  Refresh,
  CalendarToday,
  CheckCircle,
  Event,
  ViewList,
  Call,
  FlashOn,
  AccessTime,
  WarningAmber,
  TaskAlt,
  Schedule,
} from '@mui/icons-material';
import PageHeader from '../../components/crm/ui/PageHeader';
import KpiCard from '../../components/crm/ui/KpiCard';
import SectionBucket from '../../components/crm/ui/SectionBucket';
import ActionRow from '../../components/crm/ui/ActionRow';
import EmptyState from '../../components/crm/ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getDailyActions,
  getDailyActionsMetrics,
  getInteractionById,
  updateInteraction,
} from '../../services/interactionService';
import { getAllAppointments } from '../../services/appointmentService';

const typeLabels = {
  cita_agenda: 'Citas y preparación de atención',
  consumibles: 'Seguimiento consumibles',
  garantia: 'Garantía',
  reminder: 'Recordatorio',
};

const kindLabels = {
  vencido: 'Vencido',
  proximo: 'Próximo',
  reclamacion: 'Reclamación abierta',
  vencida: 'Garantía vencida',
  hoy: 'Hoy',
};

const typeColors = {
  cita_agenda: '#1565c0',
  consumibles: '#2e7d32',
  garantia: '#e65100',
  reminder: '#ff9800',
};

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const AccionesDiaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [actions, setActions] = useState([]);
  const [metrics, setMetrics] = useState({ activas: 0, vencidas: 0, cumplidas: 0, total: 0 });
  const [citasAgendaCount, setCitasAgendaCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [daysAhead] = useState(7);
  const [viewMode, setViewMode] = useState('lista'); // 'lista' | 'calendario'
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [detailAction, setDetailAction] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [savingResolve, setSavingResolve] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, m, apptsRes] = await Promise.all([
        getDailyActions(daysAhead),
        getDailyActionsMetrics(daysAhead),
        getAllAppointments().catch(() => []),
      ]);
      const appts = Array.isArray(apptsRes) ? apptsRes : [];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const horizon = new Date(todayStart);
      horizon.setDate(horizon.getDate() + daysAhead);
      horizon.setHours(23, 59, 59, 999);
      const todayStr = todayStart.toISOString().slice(0, 10);
      const citaSynthetic = appts
        .filter((apt) => {
          if (!apt?.date || apt.status === 'cancelled') return false;
          const d = new Date(`${apt.date}T12:00:00`);
          return d >= todayStart && d <= horizon && ['confirmed', 'patient'].includes(apt.status);
        })
        .map((apt) => ({
          id: `cita-${apt.id}`,
          type: 'cita_agenda',
          kind: apt.date === todayStr ? 'hoy' : 'proximo',
          dueDate: apt.date,
          title: `Preparar atención: ${apt.reason || 'Cita agendada'}`,
          description: `Hora ${apt.time || '—'}. Contacto previo, confirmación de asistencia y revisión de documentación o estudios pendientes mejoran la experiencia del paciente.`,
          patientEmail: apt.patientEmail,
          patientName: apt.patientName,
          patientPhone: apt.patientPhone,
          resolvedAt: null,
          comments: [],
          responsibleName: null,
          _synthetic: true,
          _appointment: apt,
        }));
      setCitasAgendaCount(citaSynthetic.length);
      const combined = [...citaSynthetic, ...(list || [])].sort((a, b) => {
        const da = a.dueDate ? new Date(a.dueDate + 'T12:00:00').getTime() : 0;
        const db = b.dueDate ? new Date(b.dueDate + 'T12:00:00').getTime() : 0;
        if (da !== db) return da - db;
        return String(a.id).localeCompare(String(b.id));
      });
      setActions(combined);
      setMetrics(m || { activas: 0, vencidas: 0, cumplidas: 0, total: 0 });
    } catch (e) {
      setError(e?.message || 'Error al cargar acciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [daysAhead]);

  const openPatient = (patientEmail) => {
    if (!patientEmail) return;
    navigate('/portal-crm/pacientes', { state: { openProfileEmail: patientEmail } });
  };

  const handleAddComment = async () => {
    if (!detailAction || !commentText.trim()) return;
    if (detailAction._synthetic || String(detailAction.id || '').startsWith('cita-')) return;
    setSavingComment(true);
    try {
      const full = await getInteractionById(detailAction.id);
      if (!full || !full.metadata) {
        setSavingComment(false);
        return;
      }
      const meta = { ...full.metadata };
      meta.comments = Array.isArray(meta.comments) ? [...meta.comments] : [];
      meta.comments.push({
        date: new Date().toISOString(),
        author: user?.nombre || user?.email || 'Usuario',
        text: commentText.trim(),
      });
      const res = await updateInteraction(detailAction.patientEmail, detailAction.id, { metadata: meta });
      if (res.success) {
        setCommentText('');
        setDetailAction((prev) => prev ? { ...prev, comments: meta.comments } : null);
        load();
      }
    } finally {
      setSavingComment(false);
    }
  };

  const handleMarkResolved = async () => {
    if (!detailAction) return;
    if (detailAction._synthetic || String(detailAction.id || '').startsWith('cita-')) return;
    setSavingResolve(true);
    try {
      const full = await getInteractionById(detailAction.id);
      const meta = full?.metadata && typeof full.metadata === 'object' ? { ...full.metadata } : {};
      meta.resolvedAt = new Date().toISOString();
      const res = await updateInteraction(detailAction.patientEmail, detailAction.id, { metadata: meta });
      if (res.success) {
        setDetailAction(null);
        load();
      }
    } finally {
      setSavingResolve(false);
    }
  };

  const byType = {
    cita_agenda: actions.filter((a) => a.type === 'cita_agenda'),
    consumibles: actions.filter((a) => a.type === 'consumibles'),
    garantia: actions.filter((a) => a.type === 'garantia'),
    reminder: actions.filter((a) => a.type === 'reminder'),
  };

  // Agrupar acciones por fecha para el calendario (solo no cumplidas)
  const actionsByDate = React.useMemo(() => {
    const map = {};
    actions.filter((a) => !a.resolvedAt).forEach((a) => {
      const key = a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [actions]);

  const getDaysInMonth = (year, month) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const days = last.getDate();
    const cells = Array(42).fill(null);
    for (let d = 1; d <= days; d++) cells[startPad + d - 1] = d;
    const rows = [];
    for (let r = 0; r < 6; r++) rows.push(cells.slice(r * 7, (r + 1) * 7));
    return rows;
  };

  const calendarRows = getDaysInMonth(calendarMonth.year, calendarMonth.month);
  const monthLabel = new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Agrupar por urgencia temporal (antes era por tipo).
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const buckets = useMemo(() => {
    const vencidas = [];
    const hoy = [];
    const proximas = [];
    const cumplidasHoy = [];
    actions.forEach((a) => {
      const due = a.dueDate ? a.dueDate.slice(0, 10) : null;
      if (a.resolvedAt) {
        if (a.resolvedAt.slice(0, 10) === todayStr) cumplidasHoy.push(a);
        return;
      }
      if (!due) { proximas.push(a); return; }
      if (due < todayStr) vencidas.push(a);
      else if (due === todayStr) hoy.push(a);
      else proximas.push(a);
    });
    return { vencidas, hoy, proximas, cumplidasHoy };
  }, [actions, todayStr]);

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
      <PageHeader
        icon={FlashOn}
        title="Acciones del día"
        subtitle={`Citas próximas, consumibles, garantías y recordatorios (próximos ${daysAhead} días)`}
        actions={
          <>
            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(_, v) => v && setViewMode(v)}
              sx={{
                '& .MuiToggleButton-root': { px: 1.5, py: 0.5, textTransform: 'none', fontSize: 12.5 },
              }}
            >
              <ToggleButton value="lista"><ViewList sx={{ fontSize: 16, mr: 0.5 }} /> Lista</ToggleButton>
              <ToggleButton value="calendario"><Event sx={{ fontSize: 16, mr: 0.5 }} /> Calendario</ToggleButton>
            </ToggleButtonGroup>
            <Button
              size="small"
              startIcon={<Refresh sx={{ fontSize: 16 }} />}
              onClick={load}
              disabled={loading}
              variant="outlined"
              sx={{ borderColor: '#085946', color: '#085946', textTransform: 'none', fontWeight: 600 }}
            >
              Actualizar
            </Button>
          </>
        }
      />

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* KPIs */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <KpiCard label="Hoy" value={buckets.hoy.length} tone="info" hint="Tareas con fecha hoy" />
          <KpiCard label="Vencidas" value={buckets.vencidas.length} tone="danger" hint="Requieren acción inmediata" />
          <KpiCard label="Próximas" value={buckets.proximas.length} tone="warning" hint={`Siguientes ${daysAhead} días`} />
          <KpiCard label="Cumplidas hoy" value={buckets.cumplidasHoy.length} tone="success" />
          <KpiCard label="Citas en ventana" value={citasAgendaCount} tone="violet" />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#085946' }} />
          </Box>
        ) : viewMode === 'calendario' ? (
          <Box sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize', color: '#272F50' }}>
                {monthLabel}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Button size="small" onClick={() => setCalendarMonth((m) => ({ ...m, month: m.month - 1 }))} sx={{ textTransform: 'none' }}>← Ant</Button>
                <Button size="small" onClick={() => setCalendarMonth((m) => ({ ...m, month: m.month + 1 }))} sx={{ textTransform: 'none' }}>Sig →</Button>
              </Box>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
              {WEEKDAYS.map((d) => (
                <Typography key={d} sx={{ fontSize: 10.5, fontWeight: 700, color: '#6b7280',
                  textTransform: 'uppercase', textAlign: 'center', py: 0.5,
                  letterSpacing: '0.06em' }}>{d}</Typography>
              ))}
              {calendarRows.flat().map((cell, idx) => {
                const day = cell;
                if (day == null) return <Box key={idx} sx={{ minHeight: 68 }} />;
                const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayActions = actionsByDate[dateStr] || [];
                const isToday = dateStr === todayStr;
                return (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 0.75, minHeight: 68,
                      bgcolor: isToday ? 'rgba(59,130,246,0.06)' : '#fff',
                      border: isToday ? '1.5px solid #3b82f6' : '1px solid #eef0f2',
                      borderRadius: 1.5,
                      cursor: dayActions.length ? 'pointer' : 'default',
                      transition: 'border-color 120ms ease',
                      '&:hover': dayActions.length ? { borderColor: '#085946' } : {},
                    }}
                    onClick={() => dayActions.length >= 1 && setDetailAction(dayActions[0])}
                  >
                    <Typography sx={{ fontSize: 12.5, fontWeight: isToday ? 700 : 500,
                      color: isToday ? '#3b82f6' : '#272F50' }}>{day}</Typography>
                    {dayActions.length > 0 && (
                      <Chip size="small" label={dayActions.length}
                        sx={{ mt: 0.5, height: 16, bgcolor: '#085946', color: '#fff',
                          fontSize: '0.65rem', '& .MuiChip-label': { px: 0.75 } }} />
                    )}
                  </Paper>
                );
              })}
            </Box>
          </Box>
        ) : actions.length === 0 ? (
          <EmptyState
            icon={Notifications}
            title="Todo en orden por ahora"
            description={`No hay acciones pendientes para los próximos ${daysAhead} días. Disfruta del momento.`}
            tone="success"
          />
        ) : (
          <>
            {buckets.vencidas.length > 0 && (
              <SectionBucket
                title="Vencidas"
                count={buckets.vencidas.length}
                icon={WarningAmber}
                tone="danger"
              >
                {buckets.vencidas.map((a) => (
                  <ActionRow key={a.id} action={a} onOpen={setDetailAction} onOpenPatient={openPatient} />
                ))}
              </SectionBucket>
            )}

            {buckets.hoy.length > 0 && (
              <SectionBucket
                title="Hoy"
                count={buckets.hoy.length}
                icon={AccessTime}
                tone="info"
              >
                {buckets.hoy.map((a) => (
                  <ActionRow key={a.id} action={a} onOpen={setDetailAction} onOpenPatient={openPatient} />
                ))}
              </SectionBucket>
            )}

            {buckets.proximas.length > 0 && (
              <SectionBucket
                title="Próximas"
                count={buckets.proximas.length}
                icon={Schedule}
                tone="warning"
              >
                {buckets.proximas.map((a) => (
                  <ActionRow key={a.id} action={a} onOpen={setDetailAction} onOpenPatient={openPatient} />
                ))}
              </SectionBucket>
            )}

            {buckets.cumplidasHoy.length > 0 && (
              <SectionBucket
                title="Cumplidas hoy"
                count={buckets.cumplidasHoy.length}
                icon={TaskAlt}
                tone="success"
              >
                {buckets.cumplidasHoy.map((a) => (
                  <ActionRow key={a.id} action={a} onOpen={setDetailAction} onOpenPatient={openPatient} dense />
                ))}
              </SectionBucket>
            )}
          </>
        )}
      </Container>

      {/* Diálogo detalle: comentarios y marcar cumplida */}
      <Dialog open={Boolean(detailAction)} onClose={() => { setDetailAction(null); setCommentText(''); }} maxWidth="sm" fullWidth>
        <DialogTitle>
          {detailAction?.title}
          {detailAction?.resolvedAt && <Chip size="small" label="Cumplida" color="success" sx={{ ml: 1 }} />}
        </DialogTitle>
        <DialogContent>
          {detailAction && (
            <Box>
              <Typography variant="body2" sx={{ color: '#86899C', mb: 1 }}>
                {detailAction.patientName || detailAction.patientEmail}
                {detailAction.patientPhone && (
                  <>
                    {' · Tel: '}
                    <Link component="a" href={`tel:${detailAction.patientPhone}`} sx={{ color: '#085946', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <Call fontSize="small" /> {detailAction.patientPhone}
                    </Link>
                  </>
                )}
                {detailAction.type !== 'cita_agenda' && (
                  <>{' · Responsable: '}{detailAction.responsibleName || '—'}</>
                )}
              </Typography>
              {detailAction.description && <Typography variant="body2" sx={{ mb: 1 }}>{detailAction.description}</Typography>}

              {(detailAction._synthetic || detailAction.type === 'cita_agenda' || String(detailAction.id || '').startsWith('cita-')) ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Esta entrada proviene de la agenda. Para reprogramar o cambiar estado use el módulo <strong>Agenda</strong>. Antes de la cita conviene confirmar asistencia, recordar documentación y revisar si el paciente tiene pendientes en CRM (consumibles o garantía).
                </Alert>
              ) : (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5 }}>Comentarios</Typography>
                  <List dense>
                    {(detailAction.comments || []).map((c, i) => (
                      <ListItem key={i}>
                        <ListItemText
                          primary={c.text}
                          secondary={`${c.author} · ${c.date ? new Date(c.date).toLocaleString('es-ES') : ''}`}
                        />
                      </ListItem>
                    ))}
                    {(detailAction.comments || []).length === 0 && (
                      <ListItem><ListItemText secondary="Sin comentarios" /></ListItem>
                    )}
                  </List>
                  {!detailAction.resolvedAt && (
                    <>
                      <TextField
                        fullWidth
                        size="small"
                        label="Nuevo comentario"
                        multiline
                        rows={2}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        sx={{ mt: 1 }}
                      />
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button variant="contained" size="small" onClick={handleAddComment} disabled={!commentText.trim() || savingComment} sx={{ bgcolor: '#085946' }}>
                          {savingComment ? 'Guardando…' : 'Agregar comentario'}
                        </Button>
                        <Button variant="outlined" size="small" color="success" startIcon={<CheckCircle />} onClick={handleMarkResolved} disabled={savingResolve}>
                          {savingResolve ? 'Guardando…' : 'Marcar cumplida'}
                        </Button>
                      </Box>
                    </>
                  )}
                </>
              )}

              {(detailAction._synthetic || detailAction.type === 'cita_agenda' || String(detailAction.id || '').startsWith('cita-')) && (
                <Button fullWidth variant="outlined" sx={{ mb: 1, borderColor: '#272F50', color: '#272F50' }} onClick={() => { navigate('/portal-crm/citas'); setDetailAction(null); setCommentText(''); }}>
                  Ir a Agenda (citas)
                </Button>
              )}
              <Button fullWidth sx={{ mt: 2 }} onClick={() => { openPatient(detailAction.patientEmail); setDetailAction(null); }}>
                Ver perfil del paciente
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDetailAction(null); setCommentText(''); }}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccionesDiaPage;
