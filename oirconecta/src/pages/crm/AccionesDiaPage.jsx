import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  CircularProgress,
  Alert,
  TextField,
  Tabs,
  Tab,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Link,
} from '@mui/material';
import {
  Build,
  Assignment,
  Notifications,
  Person,
  Refresh,
  CalendarToday,
  ArrowBack,
  CheckCircle,
  Comment as CommentIcon,
  Event,
  ViewList,
  Call,
} from '@mui/icons-material';
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 3 }}>
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#272F50' }}>
              Acciones del día
            </Typography>
            <Typography variant="body2" sx={{ color: '#86899C', mt: 0.5 }}>
              Citas próximas (preparación de atención), seguimiento de consumibles, garantías y recordatorios
            </Typography>
          </Box>
          <Button startIcon={<Refresh />} onClick={load} disabled={loading} variant="outlined" sx={{ borderColor: '#085946', color: '#085946' }}>
            Actualizar
          </Button>
        </Box>

        {/* Métricas: alertas activas, vencidas, cumplidas */}
        {!loading && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <Card sx={{ flex: 1, minWidth: 100, bgcolor: '#e8f5e9', borderLeft: 4, borderColor: '#2e7d32' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" sx={{ color: '#1b5e20' }}>Alertas activas</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#272F50' }}>{metrics.activas}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, minWidth: 100, bgcolor: '#ffebee', borderLeft: 4, borderColor: '#c62828' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" sx={{ color: '#b71c1c' }}>Alertas vencidas</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#272F50' }}>{metrics.vencidas}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, minWidth: 100, bgcolor: '#e8eaf6', borderLeft: 4, borderColor: '#3949ab' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" sx={{ color: '#283593' }}>Citas en ventana</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#272F50' }}>{citasAgendaCount}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1, minWidth: 100, bgcolor: '#e3f2fd', borderLeft: 4, borderColor: '#1565c0' }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" sx={{ color: '#0d47a1' }}>Alertas cumplidas</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#272F50' }}>{metrics.cumplidas}</Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tabs Lista / Calendario */}
        <Tabs value={viewMode} onChange={(_, v) => setViewMode(v)} sx={{ mb: 2 }}>
          <Tab value="lista" label="Lista" icon={<ViewList />} iconPosition="start" />
          <Tab value="calendario" label="Calendario" icon={<Event />} iconPosition="start" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#085946' }} />
          </Box>
        ) : viewMode === 'calendario' ? (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>{monthLabel}</Typography>
                <Box>
                  <Button size="small" onClick={() => setCalendarMonth((m) => ({ ...m, month: m.month - 1 }))}>Ant</Button>
                  <Button size="small" onClick={() => setCalendarMonth((m) => ({ ...m, month: m.month + 1 }))}>Sig</Button>
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, textAlign: 'center' }}>
                {WEEKDAYS.map((d) => (
                  <Typography key={d} variant="caption" sx={{ fontWeight: 600, color: '#86899C' }}>{d}</Typography>
                ))}
                {calendarRows.flat().map((cell, idx) => {
                  const day = cell;
                  if (day == null) return <Box key={idx} sx={{ minHeight: 64 }} />;
                  const dateStr = `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayActions = actionsByDate[dateStr] || [];
                  const isToday =
                    new Date().getDate() === day &&
                    new Date().getMonth() === calendarMonth.month &&
                    new Date().getFullYear() === calendarMonth.year;
                  return (
                    <Paper
                      key={idx}
                      elevation={0}
                      sx={{
                        p: 0.5,
                        minHeight: 64,
                        bgcolor: isToday ? '#e3f2fd' : dayActions.length ? '#fff8e1' : 'transparent',
                        border: isToday ? '2px solid #1565c0' : '1px solid #e0e0e0',
                        cursor: dayActions.length ? 'pointer' : 'default',
                      }}
                      onClick={() => dayActions.length >= 1 && setDetailAction(dayActions[0])}
                    >
                      <Typography variant="body2" sx={{ fontWeight: isToday ? 700 : 400 }}>{day}</Typography>
                      {dayActions.length > 0 && (
                        <Chip size="small" label={dayActions.length} sx={{ mt: 0.5, bgcolor: '#085946', color: '#fff', fontSize: '0.7rem' }} />
                      )}
                    </Paper>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        ) : actions.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Notifications sx={{ fontSize: 48, color: '#86899C', opacity: 0.6, mb: 1 }} />
            <Typography variant="body1" sx={{ color: '#86899C' }}>
              No hay acciones pendientes para los próximos {daysAhead} días.
            </Typography>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[['cita_agenda', byType.cita_agenda], ['consumibles', byType.consumibles], ['garantia', byType.garantia], ['reminder', byType.reminder]].map(([type, list]) =>
              list.length > 0 ? (
                <Card key={type} sx={{ borderLeft: 4, borderColor: typeColors[type] }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      {type === 'cita_agenda' && <Event sx={{ color: typeColors[type] }} />}
                      {type === 'consumibles' && <Build sx={{ color: typeColors[type] }} />}
                      {type === 'garantia' && <Assignment sx={{ color: typeColors[type] }} />}
                      {type === 'reminder' && <CalendarToday sx={{ color: typeColors[type] }} />}
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#272F50' }}>
                        {typeLabels[type]}
                      </Typography>
                      <Chip size="small" label={list.length} sx={{ bgcolor: typeColors[type], color: '#fff' }} />
                    </Box>
                    <List disablePadding>
                      {list.map((a) => (
                        <ListItem
                          key={a.id}
                          disablePadding
                          secondaryAction={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <IconButton size="small" onClick={() => setDetailAction(a)} title="Ver detalle">
                                <CommentIcon fontSize="small" />
                              </IconButton>
                              {!a.resolvedAt && (
                                <Chip
                                  size="small"
                                  label={
                                    a.type === 'cita_agenda'
                                      ? (a.kind === 'hoy' ? 'Hoy' : 'Próxima')
                                      : a.kind === 'vencido'
                                        ? 'Vencido'
                                        : a.kind === 'reclamacion'
                                          ? 'Reclamación'
                                          : a.kind === 'vencida'
                                            ? 'Vencida'
                                            : 'Próximo'
                                  }
                                  color={
                                    a.type === 'cita_agenda'
                                      ? (a.kind === 'hoy' ? 'primary' : 'default')
                                      : a.kind === 'vencido' || a.kind === 'vencida'
                                        ? 'error'
                                        : 'default'
                                  }
                                />
                              )}
                              {a.resolvedAt && <Chip size="small" icon={<CheckCircle />} label="Cumplida" color="success" />}
                            </Box>
                          }
                        >
                          <ListItemButton onClick={() => openPatient(a.patientEmail)}>
                            <ListItemText
                              primary={a.title}
                              secondary={
                                <>
                                  {a.patientName || a.patientEmail}
                                  {a.patientPhone && ` · Tel: ${a.patientPhone}`}
                                  {' · '}{a.dueDate ? new Date(a.dueDate).toLocaleDateString('es-ES') : '—'}
                                  {a.responsibleName && ` · Responsable: ${a.responsibleName}`}
                                  {a.description && ` · ${a.description}`}
                                </>
                              }
                            />
                            <Person sx={{ color: '#085946', ml: 0.5 }} fontSize="small" />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              ) : null
            )}
          </Box>
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
