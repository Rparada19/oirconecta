/**
 * Detalle de lead — timeline de actividades, quick actions, tareas, conversión.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Container, TextField, MenuItem, Avatar,
  CircularProgress, Snackbar, Alert, IconButton, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip,
} from '@mui/material';
import {
  ArrowBack, PhoneOutlined, WhatsApp, EmailOutlined, EventOutlined,
  EditNoteOutlined, CheckCircleOutline, RocketLaunchOutlined,
  PersonOutline, BusinessOutlined, LocationOnOutlined,
  CalendarMonthOutlined, BoltOutlined, AutoAwesomeOutlined,
  CallReceivedOutlined, CallMadeOutlined, ContentCopyOutlined,
} from '@mui/icons-material';
import {
  salesApi, telHref, waMeHref, mailtoHref,
  PIPELINE_STAGES, STATUS_META,
} from '../../../services/salesApi';
import { SalesPageHeader, softCard, StatusPill } from './SalesShell';

const ACTIVITY_TYPES = [
  { key: 'CALL',     label: 'Llamada',  icon: PhoneOutlined,  color: '#4054B2' },
  { key: 'EMAIL',    label: 'Email',    icon: EmailOutlined,  color: '#8b5cf6' },
  { key: 'WHATSAPP', label: 'WhatsApp', icon: WhatsApp,       color: '#25D366' },
  { key: 'MEETING',  label: 'Reunión',  icon: EventOutlined,  color: '#0099CC' },
  { key: 'NOTE',     label: 'Nota',     icon: EditNoteOutlined,color: '#5b6b7a' },
];

const OUTCOMES = ['Sin respuesta','Buzón','Interesado','No interesado','Pidió info','Agendó','Reagendar','Convertido'];

// Siguiente día hábil a las 10:00 — slot razonable por defecto.
function defaultNextSlot() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return toLocalInputValue(d);
}
function toLocalInputValue(d) {
  const tz = d.getTimezoneOffset();
  return new Date(d.getTime() - tz * 60000).toISOString().slice(0, 16);
}

export default function SalesLeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState(null);
  const [logType, setLogType] = useState('CALL');
  const [logOutcome, setLogOutcome] = useState('Sin respuesta');
  const [logBody, setLogBody] = useState('');
  const [logDirection, setLogDirection] = useState('out'); // para WA / EMAIL
  // Próxima acción inline tras guardar actividad
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextType, setNextType] = useState('CALL');
  const [nextAt, setNextAt] = useState(defaultNextSlot());
  const [nextNotes, setNextNotes] = useState('');
  // Scoring
  const [score, setScore] = useState(null);
  // Meeting
  const [meetOpen, setMeetOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [emailSending, setEmailSending] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertPassword, setConvertPassword] = useState('');
  const [convertSendEmail, setConvertSendEmail] = useState(true);
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [leadData, scoreData] = await Promise.all([
        salesApi.getLead(id),
        salesApi.leadScore(id).catch(() => null),
      ]);
      setLead(leadData);
      setScore(scoreData);
    } catch (e) { setSnack({ severity: 'error', msg: e.message }); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    salesApi.emailTemplates().then(setEmailTemplates).catch(() => {});
  }, []);

  const openEmail = async (templateId = null) => {
    setEmailOpen(true);
    if (templateId) {
      try {
        const r = await salesApi.renderTemplate(id, templateId);
        setEmailSubject(r.subject); setEmailBody(r.body);
      } catch (e) { setSnack({ severity: 'error', msg: e.message }); }
    } else if (!emailSubject) {
      setEmailSubject(`Hola ${lead?.nombre || ''}`);
      setEmailBody(`Hola ${lead?.nombre || ''},\n\n`);
    }
  };

  const sendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      setSnack({ severity: 'error', msg: 'Asunto y cuerpo son requeridos' });
      return;
    }
    setEmailSending(true);
    try {
      await salesApi.sendEmail(id, emailSubject, emailBody);
      setSnack({ severity: 'success', msg: 'Email enviado y actividad registrada' });
      setEmailOpen(false);
      setEmailSubject(''); setEmailBody('');
      reload();
    } catch (e) { setSnack({ severity: 'error', msg: e.message }); }
    finally { setEmailSending(false); }
  };

  const logActivity = async () => {
    try {
      const supportsDirection = logType === 'WHATSAPP' || logType === 'EMAIL';
      await salesApi.logActivity(id, {
        type: logType,
        outcome: logOutcome,
        body: logBody,
        direction: supportsDirection ? logDirection : 'out',
      });
      // Si pidió agendar siguiente acción, crear la tarea
      if (scheduleNext && nextAt) {
        await salesApi.createTask(id, {
          type: nextType,
          dueAt: new Date(nextAt).toISOString(),
          notes: nextNotes,
        });
      }
      setSnack({ severity: 'success', msg: scheduleNext ? 'Actividad guardada y próxima acción agendada' : 'Actividad registrada' });
      setLogBody('');
      setScheduleNext(false);
      setNextNotes('');
      setNextAt(defaultNextSlot());
      reload();
    } catch (e) { setSnack({ severity: 'error', msg: e.message }); }
  };

  const changeStatus = async (newStatus) => {
    try {
      await salesApi.updateLead(id, { status: newStatus });
      setSnack({ severity: 'success', msg: `Estado: ${STATUS_META[newStatus]?.label || newStatus}` });
      reload();
    } catch (e) { setSnack({ severity: 'error', msg: e.message }); }
  };

  const generatePassword = () => {
    const adj = ['Audio','Sonus','Claro','Onda','Voz','Eco','Logos','Ritmo','Pulso'];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = ''; for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    const n = Math.floor(1000 + Math.random() * 9000);
    return `${adj[Math.floor(Math.random() * adj.length)]}-${s}-${n}`;
  };

  const openConvert = () => {
    if (!lead?.email) { setSnack({ severity: 'error', msg: 'Lead sin email — agrégalo primero' }); return; }
    setConvertPassword(generatePassword());
    setConvertSendEmail(true);
    setConvertResult(null);
    setConvertOpen(true);
  };

  const doConvert = async () => {
    setConverting(true);
    try {
      const result = await salesApi.convertLead(id, convertPassword, convertSendEmail);
      setConvertResult(result);
      setSnack({ severity: 'success',
        msg: result.alreadyExisted
          ? `Cuenta ya existía: ${result.account.email}. Estado actualizado a EN_PRUEBA.`
          : `Cuenta creada: ${result.account.email}${convertSendEmail ? ' — email enviado' : ''}`,
      });
      reload();
    } catch (e) { setSnack({ severity: 'error', msg: e.message }); }
    finally { setConverting(false); }
  };

  // Estado del dialog reunión
  const [meetStart, setMeetStart] = useState(defaultNextSlot());
  const [meetDuration, setMeetDuration] = useState(30);
  const [meetTitle, setMeetTitle] = useState('');
  const [meetLocation, setMeetLocation] = useState('Llamada virtual / Google Meet');
  const [meetNotes, setMeetNotes] = useState('');
  const [meetSendEmail, setMeetSendEmail] = useState(true);
  const [meetGcalUrl, setMeetGcalUrl] = useState(null);
  const [meetingSaving, setMeetingSaving] = useState(false);

  const openMeeting = () => {
    setMeetStart(defaultNextSlot());
    setMeetDuration(30);
    setMeetTitle(`Demo OírConecta · ${lead?.nombre || ''}`);
    setMeetNotes('');
    setMeetGcalUrl(null);
    setMeetOpen(true);
  };

  const scheduleMeeting = async () => {
    setMeetingSaving(true);
    try {
      const r = await salesApi.scheduleMeeting(id, {
        startAt: new Date(meetStart).toISOString(),
        durationMin: meetDuration,
        title: meetTitle, location: meetLocation, notes: meetNotes,
        sendEmail: meetSendEmail,
      });
      setMeetGcalUrl(r.gcalUrl);
      setSnack({ severity: 'success', msg: r.mailed ? 'Reunión agendada y email enviado' : 'Reunión agendada' });
      reload();
    } catch (e) { setSnack({ severity: 'error', msg: e.message }); }
    finally { setMeetingSaving(false); }
  };

  const copyCreds = async () => {
    if (!convertResult) return;
    const text = `Portal: https://oirconecta.com/login-directorio\nEmail: ${convertResult.account.email}\nClave temporal: ${convertResult.tempPassword || convertPassword}`;
    try { await navigator.clipboard.writeText(text); setSnack({ severity: 'success', msg: 'Credenciales copiadas' }); }
    catch { setSnack({ severity: 'error', msg: 'No se pudo copiar' }); }
  };

  if (loading || !lead) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#085946' }} /></Box>;
  }

  const tel = telHref(lead.telefono);
  const wa = waMeHref(lead.telefono, `Hola ${lead.nombre}, te contacto de OírConecta.`);
  const mail = mailtoHref(lead.email, 'Hola desde OírConecta', `Hola ${lead.nombre},`);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Button onClick={() => navigate('/portal-admin/sales/leads')} startIcon={<ArrowBack />}
        sx={{ textTransform: 'none', color: '#272F50', fontWeight: 600, mb: 1.5 }}>
        Volver a leads
      </Button>

      {/* Hero */}
      <Box sx={{
        position: 'relative', borderRadius: 3, overflow: 'hidden',
        background: 'linear-gradient(135deg, #272F50 0%, #1f3a6b 50%, #085946 100%)',
        color: '#fff', p: { xs: 2.5, sm: 3 }, mb: 3,
      }}>
        <Box sx={{
          position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(110,231,200,0.22), rgba(110,231,200,0) 70%)',
        }} />
        <Box sx={{ position: 'relative', display: 'flex', gap: 2, alignItems: { sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', minWidth: 0 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.18)', fontSize: 22, fontWeight: 800 }}>
              {(lead.nombre || '?').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: '#6ee7c8', mb: 0.5 }}>
                Lead · {lead.source || 'manual'}
              </Typography>
              <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 800, lineHeight: 1.15 }}>
                {lead.nombre}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 0.5, flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
                {lead.profesion && <span><PersonOutline sx={{ fontSize: 13, verticalAlign: 'middle', mr: 0.5 }}/>{lead.profesion}</span>}
                {lead.empresa && <span><BusinessOutlined sx={{ fontSize: 13, verticalAlign: 'middle', mr: 0.5 }}/>{lead.empresa}</span>}
                {lead.ciudad && <span><LocationOnOutlined sx={{ fontSize: 13, verticalAlign: 'middle', mr: 0.5 }}/>{lead.ciudad}</span>}
              </Box>
            </Box>
          </Box>
          {/* Quick actions */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {tel && <HeroAction href={tel} icon={PhoneOutlined} label="Llamar" color="#4054B2" />}
            {wa && <HeroAction href={wa} external icon={WhatsApp} label="WhatsApp" color="#25D366" />}
            {lead.email && <HeroAction onClick={() => openEmail()} icon={EmailOutlined} label="Email CRM" color="#8b5cf6" />}
            <HeroAction onClick={openMeeting} icon={CalendarMonthOutlined} label="Agendar reunión" color="#0099CC" />}}
          </Box>
        </Box>
      </Box>

      {/* Lead Score — probabilidad de cierre */}
      {score && <LeadScoreCard score={score} />}

      {/* Pipeline */}
      <Box sx={{ ...softCard, p: 2, mb: 2 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b6b7a', mb: 1 }}>
          Estado en el pipeline
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
          {PIPELINE_STAGES.map((s) => (
            <Box key={s} onClick={() => changeStatus(s)} role="button"
              sx={{
                cursor: 'pointer', px: 1.25, py: 0.625, borderRadius: 1,
                bgcolor: lead.status === s ? STATUS_META[s].color : STATUS_META[s].bg,
                color: lead.status === s ? '#fff' : STATUS_META[s].color,
                border: `1px solid ${lead.status === s ? STATUS_META[s].color : STATUS_META[s].color + '25'}`,
                fontSize: 12, fontWeight: 700, transition: 'all 120ms ease',
                '&:hover': { bgcolor: lead.status === s ? STATUS_META[s].color : STATUS_META[s].color + '18' },
              }}>
              {STATUS_META[s].label}
            </Box>
          ))}
          {lead.status !== 'EN_PRUEBA' && lead.status !== 'CONVERTIDO' && (
            <Button onClick={openConvert} variant="contained" startIcon={<RocketLaunchOutlined />}
              sx={{ ml: 'auto', bgcolor: '#10b981', textTransform: 'none', fontWeight: 700, borderRadius: 1.5, '&:hover': { bgcolor: '#0d9469' } }}>
              Crear cuenta trial 120d
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {/* Log de actividad */}
        <Box sx={{ ...softCard, p: 2 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b6b7a', mb: 1.25 }}>
            Registrar actividad
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
            {ACTIVITY_TYPES.map((t) => {
              const active = logType === t.key;
              const Icon = t.icon;
              return (
                <Box key={t.key} onClick={() => setLogType(t.key)} role="button"
                  sx={{
                    cursor: 'pointer', px: 1.25, py: 0.625, borderRadius: 1,
                    display: 'flex', alignItems: 'center', gap: 0.625,
                    bgcolor: active ? t.color : `${t.color}15`, color: active ? '#fff' : t.color,
                    border: `1px solid ${active ? t.color : `${t.color}25`}`,
                    fontSize: 12, fontWeight: 700,
                    '&:hover': { bgcolor: active ? t.color : `${t.color}25` },
                  }}>
                  <Icon sx={{ fontSize: 14 }} /> {t.label}
                </Box>
              );
            })}
          </Box>
          <TextField select label="Resultado" size="small" value={logOutcome} onChange={(e) => setLogOutcome(e.target.value)} sx={{ mb: 1.5, width: '100%' }}>
            {OUTCOMES.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
          </TextField>

          {/* Dirección — solo aplica a WA/EMAIL */}
          {(logType === 'WHATSAPP' || logType === 'EMAIL') && (
            <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5 }}>
              <DirectionToggle active={logDirection === 'out'} icon={CallMadeOutlined} label="Yo envié" onClick={() => setLogDirection('out')} color="#4054B2" />
              <DirectionToggle active={logDirection === 'in'}  icon={CallReceivedOutlined} label="Me respondió" onClick={() => setLogDirection('in')} color="#10b981" />
            </Box>
          )}

          <TextField
            label={logType === 'WHATSAPP' && logDirection === 'in' ? 'Mensaje recibido' :
                   logType === 'WHATSAPP' ? 'Mensaje enviado' :
                   logType === 'EMAIL' && logDirection === 'in' ? 'Respuesta del prospecto' :
                   'Notas'}
            multiline rows={3} value={logBody}
            onChange={(e) => setLogBody(e.target.value)}
            fullWidth size="small" sx={{ mb: 1.5 }} />

          {/* Próxima acción inline */}
          <Box sx={{
            mb: 1.5, p: 1.25, borderRadius: 1.5,
            border: '1px dashed #cbd5e1', bgcolor: scheduleNext ? '#eef0fb' : 'transparent',
            transition: 'background 120ms ease',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: scheduleNext ? 1.5 : 0 }}>
              <input
                type="checkbox" id="scheduleNext"
                checked={scheduleNext}
                onChange={(e) => setScheduleNext(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <Box component="label" htmlFor="scheduleNext" sx={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <CalendarMonthOutlined sx={{ fontSize: 16, color: '#4054B2' }} />
                <Typography sx={{ fontSize: 12.5, color: '#272F50', fontWeight: 600 }}>
                  Agendar próxima acción con este prospecto
                </Typography>
              </Box>
            </Box>
            {scheduleNext && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
                <TextField select label="Tipo" size="small" value={nextType} onChange={(e) => setNextType(e.target.value)}>
                  {[{k:'CALL',l:'Llamada'},{k:'EMAIL',l:'Email'},{k:'WHATSAPP',l:'WhatsApp'},{k:'MEETING',l:'Reunión'},{k:'FOLLOWUP',l:'Seguimiento'}].map((o) =>
                    <MenuItem key={o.k} value={o.k}>{o.l}</MenuItem>)}
                </TextField>
                <TextField type="datetime-local" label="Fecha y hora" size="small"
                  value={nextAt} onChange={(e) => setNextAt(e.target.value)}
                  InputLabelProps={{ shrink: true }} />
                <TextField label="Notas (opcional)" size="small" value={nextNotes}
                  onChange={(e) => setNextNotes(e.target.value)}
                  placeholder="Ej: confirmar interés y enviar propuesta"
                  sx={{ gridColumn: { sm: '1 / -1' } }} />
              </Box>
            )}
          </Box>

          <Button onClick={logActivity} startIcon={<CheckCircleOutline />} variant="contained"
            sx={{ bgcolor: '#085946', textTransform: 'none', fontWeight: 700, borderRadius: 1.5, '&:hover': { bgcolor: '#064a38' } }}>
            Guardar
          </Button>
        </Box>

        {/* Contacto + datos */}
        <Box sx={{ ...softCard, p: 2 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b6b7a', mb: 1.25 }}>
            Contacto
          </Typography>
          <FieldRow label="Email" value={lead.email || '—'} />
          <FieldRow label="Teléfono" value={lead.telefono || '—'} />
          <FieldRow label="Empresa" value={lead.empresa || '—'} />
          <FieldRow label="Profesión" value={lead.profesion || '—'} />
          <FieldRow label="Ciudad" value={lead.ciudad || '—'} />
          <FieldRow label="Fuente" value={lead.source || 'manual'} />
          {lead.notes && (
            <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#fffbeb', border: '1px solid #f59e0b25', borderRadius: 1, fontSize: 12.5, color: '#92400e' }}>
              {lead.notes}
            </Box>
          )}
        </Box>
      </Box>

      {/* Conversación WhatsApp (vista tipo chat) */}
      <WhatsAppConversation lead={lead} />

      {/* Timeline general (excluye WA porque ya está arriba) */}
      <Box sx={{ ...softCard, p: 2, mt: 2 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5b6b7a', mb: 1.5 }}>
          Historial · {lead.activities?.filter((a) => a.type !== 'WHATSAPP').length || 0}
        </Typography>
        {(!lead.activities || lead.activities.filter((a) => a.type !== 'WHATSAPP').length === 0) ? (
          <Typography sx={{ fontSize: 13, color: '#5b6b7a', textAlign: 'center', py: 3 }}>
            Sin actividades aún. Registra la primera arriba.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            {lead.activities.filter((a) => a.type !== 'WHATSAPP').map((a) => {
              const t = ACTIVITY_TYPES.find((x) => x.key === a.type) || ACTIVITY_TYPES[4];
              const Icon = t.icon;
              const isIncoming = a.direction === 'in';
              return (
                <Box key={a.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', pb: 1.25, borderBottom: '1px solid #f0f2f4', '&:last-child': { borderBottom: 'none' } }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: 1, flexShrink: 0,
                    bgcolor: `${t.color}15`, color: t.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon sx={{ fontSize: 16 }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#041a12' }}>
                        {t.label}{a.outcome ? ` · ${a.outcome}` : ''}
                      </Typography>
                      {isIncoming && (
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.375, bgcolor: '#ecfdf5', color: '#047857', px: 0.625, py: 0.125, borderRadius: 0.625, fontSize: 10.5, fontWeight: 700 }}>
                          <CallReceivedOutlined sx={{ fontSize: 11 }} /> Entrante
                        </Box>
                      )}
                      <Typography sx={{ fontSize: 11.5, color: '#5b6b7a' }}>
                        {new Date(a.ts).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} — {a.user?.nombre || ''}
                      </Typography>
                    </Box>
                    {a.body && <Typography sx={{ fontSize: 12.5, color: '#5b6b7a', whiteSpace: 'pre-wrap' }}>{a.body}</Typography>}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Dialog: agendar reunión */}
      <Dialog open={meetOpen} onClose={() => !meetingSaving && setMeetOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#272F50' }}>
          {meetGcalUrl ? 'Reunión agendada' : `Agendar reunión con ${lead?.nombre}`}
          <Typography sx={{ fontSize: 12, color: '#5b6b7a', fontWeight: 500, mt: 0.25 }}>
            {meetGcalUrl
              ? 'Comparte el link de calendario si el email no llegó.'
              : 'Crea la tarea en tu agenda y envía invite al correo del prospecto.'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {!meetGcalUrl ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75, pt: 1 }}>
              <TextField label="Título" value={meetTitle} onChange={(e) => setMeetTitle(e.target.value)} size="small" />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 1.5 }}>
                <TextField type="datetime-local" label="Fecha y hora"
                  value={meetStart} onChange={(e) => setMeetStart(e.target.value)}
                  size="small" InputLabelProps={{ shrink: true }} />
                <TextField select label="Duración" value={meetDuration} onChange={(e) => setMeetDuration(Number(e.target.value))} size="small">
                  {[15, 30, 45, 60, 90].map((m) => <MenuItem key={m} value={m}>{m} min</MenuItem>)}
                </TextField>
              </Box>
              <TextField label="Lugar / Link" value={meetLocation} onChange={(e) => setMeetLocation(e.target.value)} size="small"
                placeholder="Ej: Google Meet · https://meet.google.com/..." />
              <TextField label="Notas (irán en el email del prospecto)" multiline rows={3} value={meetNotes} onChange={(e) => setMeetNotes(e.target.value)} size="small" />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.25, bgcolor: '#eef0fb', borderRadius: 1, fontSize: 12.5, color: '#272F50' }}>
                <input type="checkbox" checked={meetSendEmail} onChange={(e) => setMeetSendEmail(e.target.checked)} id="meetSendEmail" disabled={!lead?.email} />
                <label htmlFor="meetSendEmail" style={{ cursor: 'pointer', flex: 1 }}>
                  {lead?.email
                    ? <>Enviar invite por email a <strong>{lead.email}</strong> con link Add-to-Calendar</>
                    : 'El lead no tiene email — solo se creará la tarea en tu agenda'}
                </label>
              </Box>
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ p: 2, bgcolor: '#ecfdf5', border: '1px solid #10b98140', borderRadius: 1.5, mb: 1.5 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#047857', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
                  Link Add-to-Calendar
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#0f1923', wordBreak: 'break-all', fontFamily: 'ui-monospace, monospace' }}>
                  {meetGcalUrl}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={() => window.open(meetGcalUrl, '_blank')} variant="contained" startIcon={<CalendarMonthOutlined />}
                  sx={{ bgcolor: '#0099CC', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#007aa3' } }}>
                  Abrir Google Calendar
                </Button>
                <Button onClick={() => { navigator.clipboard.writeText(meetGcalUrl); setSnack({ severity: 'success', msg: 'Link copiado' }); }} startIcon={<ContentCopyOutlined />}
                  sx={{ textTransform: 'none', fontWeight: 700, color: '#4054B2', bgcolor: '#eef0fb', '&:hover': { bgcolor: '#dde0f5' } }}>
                  Copiar link
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!meetGcalUrl ? (
            <>
              <Button onClick={() => setMeetOpen(false)} disabled={meetingSaving} sx={{ textTransform: 'none', color: '#5b6b7a' }}>Cancelar</Button>
              <Button onClick={scheduleMeeting} disabled={meetingSaving || !meetStart} variant="contained" startIcon={<CalendarMonthOutlined />}
                sx={{ bgcolor: '#0099CC', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#007aa3' } }}>
                {meetingSaving ? 'Agendando…' : 'Agendar reunión'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setMeetOpen(false)} variant="contained" sx={{ bgcolor: '#272F50', textTransform: 'none', fontWeight: 700 }}>
              Listo
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog: convertir a cuenta trial 120d */}
      <Dialog open={convertOpen} onClose={() => !converting && setConvertOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#272F50' }}>
          {convertResult ? 'Cuenta lista' : `Convertir a ${lead?.nombre}`}
          <Typography sx={{ fontSize: 12, color: '#5b6b7a', fontWeight: 500, mt: 0.25 }}>
            {convertResult ? 'Comparte estas credenciales con el profesional.' : 'Trial gratuito 120 días. La clave es temporal y el profesional la cambiará al primer login.'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {!convertResult ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75, pt: 1 }}>
              <TextField label="Email del profesional" value={lead?.email || ''} size="small" disabled />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField label="Clave temporal" value={convertPassword} onChange={(e) => setConvertPassword(e.target.value)} size="small" fullWidth helperText="Mínimo 8 caracteres. Se envía por email al profesional." />
                <Button onClick={() => setConvertPassword(generatePassword())} size="small" sx={{ mt: 0.5, textTransform: 'none', fontWeight: 700, color: '#4054B2' }}>
                  Regenerar
                </Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.25, bgcolor: '#eef0fb', borderRadius: 1, fontSize: 12.5, color: '#272F50' }}>
                <input type="checkbox" checked={convertSendEmail} onChange={(e) => setConvertSendEmail(e.target.checked)} id="sendEmailChk" />
                <label htmlFor="sendEmailChk" style={{ cursor: 'pointer', flex: 1 }}>
                  Enviar email de bienvenida con credenciales desde <strong>servicioalcliente@oirconecta.com</strong>
                </label>
              </Box>
            </Box>
          ) : (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ p: 2, bgcolor: '#ecfdf5', border: '1px solid #10b98140', borderRadius: 1.5, mb: 1.5 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#047857', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
                  Credenciales
                </Typography>
                <CredRow label="Portal" value="https://oirconecta.com/login-directorio" />
                <CredRow label="Email" value={convertResult.account.email} />
                <CredRow label="Clave temporal" value={convertResult.tempPassword || convertPassword} mono />
              </Box>
              <Button onClick={copyCreds} size="small" startIcon={<EmailOutlined />}
                sx={{ textTransform: 'none', fontWeight: 700, color: '#4054B2', bgcolor: '#eef0fb', '&:hover': { bgcolor: '#dde0f5' } }}>
                Copiar credenciales
              </Button>
              {convertResult.alreadyExisted && (
                <Typography sx={{ fontSize: 12.5, color: '#b45309', mt: 1.5 }}>
                  La cuenta ya existía. No se sobrescribió la clave; comparte la que el profesional ya conoce.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!convertResult ? (
            <>
              <Button onClick={() => setConvertOpen(false)} disabled={converting} sx={{ textTransform: 'none', color: '#5b6b7a' }}>Cancelar</Button>
              <Button onClick={doConvert} disabled={converting || convertPassword.length < 8} variant="contained" startIcon={<RocketLaunchOutlined />}
                sx={{ bgcolor: '#10b981', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#0d9469' } }}>
                {converting ? 'Creando…' : 'Crear cuenta'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setConvertOpen(false)} variant="contained"
              sx={{ bgcolor: '#272F50', textTransform: 'none', fontWeight: 700 }}>
              Listo
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog: enviar email outbound */}
      <Dialog open={emailOpen} onClose={() => setEmailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#272F50' }}>
          Enviar email a {lead.nombre}
          <Typography sx={{ fontSize: 12, color: '#5b6b7a', fontWeight: 500, mt: 0.25 }}>
            Desde servicioalcliente@oirconecta.com · responde llega a ti
          </Typography>
        </DialogTitle>
        <DialogContent>
          {emailTemplates.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5b6b7a', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.875 }}>
                Plantillas
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {emailTemplates.map((t) => (
                  <Chip key={t.id} label={t.label} clickable onClick={() => openEmail(t.id)}
                    sx={{ bgcolor: '#eef0fb', color: '#4054B2', fontWeight: 700, borderRadius: 1 }} />
                ))}
              </Box>
            </Box>
          )}
          <TextField label="Asunto" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} fullWidth size="small" sx={{ mb: 1.5 }} />
          <TextField label="Mensaje" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} multiline rows={10} fullWidth size="small"
            placeholder="Escribe el mensaje. Las plantillas reemplazan {nombre}, {ciudad}, {empresa}." />
          <Typography sx={{ fontSize: 11.5, color: '#5b6b7a', mt: 1 }}>
            Se registra una actividad EMAIL en el historial al enviar.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailOpen(false)} sx={{ textTransform: 'none', color: '#5b6b7a' }}>Cancelar</Button>
          <Button onClick={sendEmail} disabled={emailSending} variant="contained" startIcon={<EmailOutlined />}
            sx={{ bgcolor: '#8b5cf6', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#7c3aed' } }}>
            {emailSending ? 'Enviando…' : 'Enviar email'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={2400} onClose={() => setSnack(null)}>
        {snack ? <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert> : null}
      </Snackbar>
    </Container>
  );
}

function FieldRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #f0f2f4', '&:last-child': { borderBottom: 'none' } }}>
      <Typography sx={{ fontSize: 12, color: '#5b6b7a', fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, color: '#0f1923', fontWeight: 500 }}>{value}</Typography>
    </Box>
  );
}

function DirectionToggle({ active, icon: Icon, label, onClick, color }) {
  return (
    <Box onClick={onClick} role="button"
      sx={{
        cursor: 'pointer', px: 1.25, py: 0.5, borderRadius: 1,
        display: 'inline-flex', alignItems: 'center', gap: 0.5,
        bgcolor: active ? color : `${color}15`, color: active ? '#fff' : color,
        border: `1px solid ${active ? color : `${color}25`}`,
        fontSize: 12, fontWeight: 700, transition: 'all 120ms ease',
      }}>
      <Icon sx={{ fontSize: 14 }} /> {label}
    </Box>
  );
}

function LeadScoreCard({ score }) {
  const pct = score.score;
  const t = pct >= 80 ? { bar: '#10b981', fg: '#047857', bg: '#ecfdf5' }
        : pct >= 60 ? { bar: '#3b82f6', fg: '#1e40af', bg: '#eef0fb' }
        : pct >= 35 ? { bar: '#f59e0b', fg: '#b45309', bg: '#fffbeb' }
                    : { bar: '#ef4444', fg: '#b91c1c', bg: '#fef2f2' };
  return (
    <Box sx={{
      ...softCard, p: 2, mb: 2, borderLeft: `4px solid ${t.bar}`,
      display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap',
    }}>
      <Box sx={{ minWidth: 200 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <AutoAwesomeOutlined sx={{ fontSize: 16, color: t.fg }} />
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: t.fg, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Probabilidad de cierre
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 36, fontWeight: 800, color: t.fg, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
          {pct}%
        </Typography>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: t.fg, mt: 0.25 }}>
          {score.label}
        </Typography>
        <Box sx={{ mt: 0.75, height: 6, borderRadius: 3, bgcolor: `${t.fg}15`, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: t.bar, transition: 'width 240ms ease' }} />
        </Box>
      </Box>
      <Box sx={{ flex: 1, minWidth: 240 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#5b6b7a', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 0.625 }}>
          Por qué este score
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {score.reasons.map((r, i) => (
            <Typography key={i} sx={{ fontSize: 12.5, color: '#0f1923', display: 'flex', gap: 0.625 }}>
              <Box component="span" sx={{ color: t.fg, fontWeight: 800 }}>·</Box> {r}
            </Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function WhatsAppConversation({ lead }) {
  const messages = (lead?.activities || [])
    .filter((a) => a.type === 'WHATSAPP')
    .slice() // copy
    .sort((a, b) => new Date(a.ts) - new Date(b.ts));
  if (messages.length === 0) return null;
  return (
    <Box sx={{ ...softCard, p: 2, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.875, mb: 1.5 }}>
        <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: '#25D36615', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WhatsApp sx={{ fontSize: 16 }} />
        </Box>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#1f7a3e', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Conversación WhatsApp · {messages.length}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.875, bgcolor: '#f8fafc', borderRadius: 1.5, p: 1.5 }}>
        {messages.map((m) => {
          const incoming = m.direction === 'in';
          return (
            <Box key={m.id} sx={{ display: 'flex', justifyContent: incoming ? 'flex-start' : 'flex-end' }}>
              <Box sx={{
                maxWidth: '78%',
                px: 1.25, py: 0.875, borderRadius: 1.5,
                bgcolor: incoming ? '#fff' : '#dcf8c6',
                border: incoming ? '1px solid #e5e7eb' : '1px solid #c5e9a4',
                boxShadow: '0 1px 1px rgba(15,23,35,0.04)',
              }}>
                <Typography sx={{ fontSize: 13, color: '#0f1923', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
                  {m.body || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>(sin contenido)</span>}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: '#6b7280', mt: 0.375, textAlign: 'right' }}>
                  {new Date(m.ts).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function CredRow({ label, value, mono }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, py: 0.5 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#047857', minWidth: 110 }}>{label}</Typography>
      <Typography sx={{
        fontSize: 13, fontWeight: 700, color: '#041a12', flex: 1, wordBreak: 'break-all',
        fontFamily: mono ? 'ui-monospace, monospace' : 'inherit',
      }}>
        {value}
      </Typography>
    </Box>
  );
}

function HeroAction({ href, onClick, icon: Icon, label, color, external }) {
  const props = href ? {
    component: 'a', href,
    target: external ? '_blank' : undefined,
    rel: external ? 'noopener noreferrer' : undefined,
  } : { component: 'button', onClick, type: 'button' };
  return (
    <Box {...props}
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.875,
        bgcolor: '#fff', color: '#272F50', fontWeight: 700,
        px: 1.5, py: 0.75, borderRadius: 1.5, fontSize: 12.5,
        textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        '&:hover': { bgcolor: '#f3f4f6' },
      }}>
      <Icon sx={{ fontSize: 16, color }} /> {label}
    </Box>
  );
}
