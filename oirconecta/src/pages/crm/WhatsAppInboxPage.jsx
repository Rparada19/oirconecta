/**
 * F9a — Bandeja de WhatsApp corporativo (CRM centros propios).
 * URL: /portal-crm/whatsapp
 *
 * Layout tipo Slack:
 *  - Lista lateral con filtros y contadores
 *  - Chat centro con historial de mensajes + composer
 *  - Panel derecho con info del contacto y acciones (asignar, cerrar, vincular Patient)
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Stack, Typography, TextField, Button, IconButton, Chip, Avatar,
  CircularProgress, Alert, Tooltip, Divider, InputAdornment, Badge,
  MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, RadioGroup, FormControlLabel, Radio,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AddIcon from '@mui/icons-material/Add';
import { api } from '../../services/apiClient';

const NAVY = '#0F2A4A';
const ACCENT = '#6d28d9';
const MUTED = '#64748b';
const BORDER = '#eef0f3';
const CREAM = '#fefdfb';
const WA_GREEN = '#25D366';
const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' };

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return d.toLocaleDateString('es-CO', { weekday: 'short' });
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

const STATUS_META = {
  BOT: { label: 'Bot', color: '#0369a1', bg: '#eff6ff' },
  HUMAN: { label: 'Humano', color: '#15803d', bg: '#f0fdf4' },
  ESCALATED: { label: 'Escalado', color: '#b91c1c', bg: '#fef2f2' },
  CLOSED: { label: 'Cerrado', color: '#78716c', bg: '#f5f5f4' },
};

const INTENT_LABELS = {
  LEAD_PROFESIONAL: 'Profesional',
  CITA_PACIENTE: 'Cita paciente',
  INFO_GENERAL: 'Info',
  SIN_CLASIFICAR: 'Sin clasificar',
};

// Etiquetas cortas para el header — coinciden con las del catálogo backend
const CONTACT_TYPE_LABELS = {
  PACIENTE_BOGOTA: 'Paciente potencial',
  PACIENTE_EXISTENTE: 'Paciente existente',
  PROFESIONAL_DIRECTORIO: 'Profesional directorio',
  INFO_GENERAL: 'Info general',
  ALIADO_PROVEEDOR: 'Aliado / proveedor',
  OTROS: 'Otros',
};

export default function WhatsAppInboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [windowOpen, setWindowOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filter, setFilter] = useState(searchParams.get('filter') || 'all'); // all | mine | unassigned | closed
  const [q, setQ] = useState('');
  const [sendText, setSendText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  // Nueva conversación
  const [newOpen, setNewOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [contactTypes, setContactTypes] = useState([]);
  const [newForm, setNewForm] = useState({
    phone: '', contactName: '', templateKey: '', contactType: 'PACIENTE_BOGOTA', variables: {},
  });
  const [newLoading, setNewLoading] = useState(false);
  const [newError, setNewError] = useState(null);
  const selectedTemplate = templates.find((t) => t.key === newForm.templateKey);
  const templatesForType = templates.filter((t) => t.contactType === newForm.contactType);

  const openNewDialog = async () => {
    setNewError(null);
    setNewForm({ phone: '', contactName: '', templateKey: '', contactType: 'PACIENTE_BOGOTA', variables: {} });
    setNewOpen(true);
    try {
      if (contactTypes.length === 0) {
        const rt = await api.get('/api/wa/contact-types');
        if (rt?.data?.success) setContactTypes(rt.data.data);
      }
      if (templates.length === 0) {
        const r = await api.get('/api/wa/templates');
        if (r?.data?.success) setTemplates(r.data.data);
      }
    } catch (e) { setNewError('No se pudieron cargar las plantillas'); }
  };

  const submitNew = async () => {
    setNewError(null);
    if (!newForm.phone || !newForm.templateKey) {
      setNewError('Teléfono y plantilla son obligatorios');
      return;
    }
    setNewLoading(true);
    try {
      const r = await api.post('/api/wa/conversations/new', {
        phone: newForm.phone,
        contactName: newForm.contactName || null,
        templateKey: newForm.templateKey,
        variables: newForm.variables,
        contactType: newForm.contactType,
      });
      if (r?.data?.success) {
        setNewOpen(false);
        await load();
        if (r.data.data?.conversationId) loadDetail(r.data.data.conversationId);
      } else {
        setNewError(r?.data?.error || 'Error al iniciar');
      }
    } catch (e) {
      const errData = e.response?.data;
      if (errData?.code === 'SEND_FAILED') {
        setNewError(`Meta rechazó el envío: ${errData.error}. Verifica que la plantilla esté aprobada.`);
      } else {
        setNewError(errData?.error || e.message);
      }
    } finally {
      setNewLoading(false);
    }
  };

  const load = useCallback(async ({ showSpinner = true } = {}) => {
    if (showSpinner) setLoading(true);
    try {
      const params = { businessLine: 'CRM', limit: 100 };
      if (filter === 'mine') params.mine = 'true';
      else if (filter === 'unassigned') params.unassigned = 'true';
      else if (filter === 'closed') params.status = 'CLOSED';
      else params.status = 'HUMAN';
      if (q) params.q = q;

      const qs = new URLSearchParams(params).toString();
      const res = await api.get(`/api/wa/conversations?${qs}`);
      if (res?.data?.success) {
        setConversations(res.data.data || []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [filter, q]);

  const loadDetail = useCallback(async (id) => {
    if (!id) return;
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/wa/conversations/${id}?limit=300`);
      if (res?.data?.success) {
        setSelected(res.data.data.conversation);
        setMessages(res.data.data.messages || []);
        setWindowOpen(!!res.data.data.windowOpen);
        // Marca como leído
        await api.post(`/api/wa/conversations/${id}/read`).catch(() => {});
        // Refresca lista para reflejar el unreadCount=0
        load({ showSpinner: false });
        // Scroll al final
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setDetailLoading(false);
    }
  }, [load]);

  useEffect(() => { load(); }, [load]);

  // Polling cada 15s (silent)
  useEffect(() => {
    pollRef.current = setInterval(() => {
      load({ showSpinner: false });
      if (selected?.id) loadDetail(selected.id);
    }, 15000);
    return () => clearInterval(pollRef.current);
  }, [load, loadDetail, selected?.id]);

  const handleSend = async () => {
    if (!sendText.trim() || !selected?.id) return;
    setSending(true); setSendError(null);
    try {
      const res = await api.post(`/api/wa/conversations/${selected.id}/messages`, { text: sendText.trim() });
      if (res?.data?.success) {
        setSendText('');
        await loadDetail(selected.id);
      } else {
        setSendError(res?.data?.error || 'Error al enviar');
      }
    } catch (e) {
      if (e.response?.data?.code === 'WINDOW_CLOSED') {
        setSendError('La ventana de 24h se cerró. Solo se pueden enviar plantillas HSM (próximamente).');
      } else {
        setSendError(e.response?.data?.error || e.message);
      }
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!selected?.id) return;
    if (!window.confirm('¿Marcar esta conversación como cerrada?')) return;
    await api.post(`/api/wa/conversations/${selected.id}/status`, { status: 'CLOSED' });
    setSelected(null); setMessages([]);
    load();
  };

  const handleAssignMine = async () => {
    if (!selected?.id) return;
    // Sin user context aquí — el backend usará req.user
    const res = await api.post(`/api/wa/conversations/${selected.id}/assign`, { userId: 'me' });
    // Backend acepta 'me' o el id; para simplificar usamos endpoint dedicado
    await loadDetail(selected.id);
  };

  const shortName = (c) => c.contactName || `+${c.phone}`;

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', bgcolor: '#fafbfc' }}>
      {/* ─── Lista lateral ─── */}
      <Box sx={{
        width: 340, flexShrink: 0, borderRight: `1px solid ${BORDER}`,
        bgcolor: CREAM, display: 'flex', flexDirection: 'column',
      }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${BORDER}` }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography sx={{ ...SERIF, fontWeight: 600, color: NAVY, fontSize: '1.25rem' }}>
                <WhatsAppIcon sx={{ fontSize: 20, color: WA_GREEN, mr: 1, verticalAlign: 'middle' }} />
                WhatsApp
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: MUTED }}>+57 317 150 3944 · Corporativo</Typography>
            </Box>
            <Tooltip title="Nueva conversación">
              <IconButton onClick={openNewDialog}
                sx={{ bgcolor: ACCENT, color: '#fff', width: 36, height: 36, '&:hover': { bgcolor: '#5b21b6' } }}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Box sx={{ p: 1.5, borderBottom: `1px solid ${BORDER}` }}>
          <TextField
            fullWidth size="small" placeholder="Buscar por nombre o teléfono"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: MUTED }} /></InputAdornment>,
              sx: { borderRadius: '10px', fontSize: '0.85rem' },
            }}
          />
          <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'Abiertas' },
              { key: 'mine', label: 'Mías' },
              { key: 'unassigned', label: 'Sin asignar' },
              { key: 'closed', label: 'Cerradas' },
            ].map((f) => (
              <Chip
                key={f.key} label={f.label} size="small" clickable
                onClick={() => { setFilter(f.key); setSearchParams({ filter: f.key }); }}
                sx={{
                  fontSize: '0.72rem', fontWeight: 700, borderRadius: '8px', height: 24,
                  bgcolor: filter === f.key ? ACCENT : '#f1f5f9',
                  color: filter === f.key ? '#fff' : MUTED,
                  '&:hover': { bgcolor: filter === f.key ? ACCENT : '#e2e8f0' },
                }}
              />
            ))}
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress size={24} sx={{ color: ACCENT }} /></Box>
          ) : conversations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center', color: MUTED, fontSize: '0.85rem' }}>
              <WhatsAppIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, mb: 0.5, color: NAVY }}>Sin conversaciones</Typography>
              <Typography sx={{ fontSize: '0.75rem' }}>
                Cuando alguien escriba a +57 317 150 3944 aparecerá aquí.
              </Typography>
            </Box>
          ) : conversations.map((c) => {
            const active = selected?.id === c.id;
            const st = STATUS_META[c.status] || STATUS_META.HUMAN;
            return (
              <Box key={c.id}
                onClick={() => loadDetail(c.id)}
                sx={{
                  px: 2, py: 1.5, cursor: 'pointer',
                  borderBottom: `1px solid ${BORDER}`,
                  bgcolor: active ? '#faf5ff' : 'transparent',
                  borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
                  '&:hover': { bgcolor: active ? '#faf5ff' : '#f8fafc' },
                }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar sx={{ bgcolor: WA_GREEN, width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700 }}>
                    {(c.contactName || c.phone || '?').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={0.5}>
                      <Typography sx={{
                        fontSize: '0.88rem', fontWeight: c.unreadCount > 0 ? 800 : 600, color: NAVY,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {shortName(c)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: MUTED, flexShrink: 0 }}>
                        {fmtTime(c.lastMessageAt)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
                      <Typography sx={{
                        fontSize: '0.75rem', color: c.unreadCount > 0 ? '#0f172a' : MUTED,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        flex: 1, fontWeight: c.unreadCount > 0 ? 600 : 400,
                      }}>
                        {c.lastMessagePreview || '(sin mensajes)'}
                      </Typography>
                      {c.unreadCount > 0 && (
                        <Badge badgeContent={c.unreadCount} sx={{
                          '& .MuiBadge-badge': { bgcolor: WA_GREEN, color: '#fff', fontSize: '0.65rem', fontWeight: 700, minWidth: 18, height: 18 },
                        }} />
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ─── Chat centro ─── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {selected ? (
          <>
            {/* Header */}
            <Box sx={{
              px: 3, py: 2, borderBottom: `1px solid ${BORDER}`, bgcolor: '#fff',
              display: 'flex', alignItems: 'center', gap: 2,
            }}>
              <Avatar sx={{ bgcolor: WA_GREEN, width: 40, height: 40 }}>
                {(selected.contactName || selected.phone || '?').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, color: NAVY, fontSize: '1rem' }}>
                  {shortName(selected)}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: MUTED }}>
                  +{selected.phone}
                  {selected.contactType ? ` · ${CONTACT_TYPE_LABELS[selected.contactType] || selected.contactType}` : ` · ${INTENT_LABELS[selected.intent]}`}
                  {selected.assignedTo ? ` · asignado a ${selected.assignedTo.nombre}` : ' · sin asignar'}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={STATUS_META[selected.status]?.label || selected.status}
                sx={{
                  bgcolor: STATUS_META[selected.status]?.bg || '#f1f5f9',
                  color: STATUS_META[selected.status]?.color || MUTED,
                  fontWeight: 700, fontSize: '0.7rem',
                }}
              />
              <Tooltip title="Refrescar">
                <IconButton size="small" onClick={() => loadDetail(selected.id)}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {selected.status !== 'CLOSED' && (
                <Tooltip title="Cerrar conversación">
                  <IconButton size="small" onClick={handleClose}>
                    <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#15803d' }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* Mensajes */}
            <Box sx={{
              flex: 1, overflowY: 'auto', px: 3, py: 2,
              bgcolor: '#f7f5f0',
              backgroundImage: 'linear-gradient(#f7f5f0, #f7f5f0)',
            }}>
              {detailLoading && messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', pt: 4 }}><CircularProgress size={24} sx={{ color: ACCENT }} /></Box>
              ) : messages.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: MUTED, mt: 4 }}>(sin mensajes aún)</Typography>
              ) : messages.map((m) => {
                const outbound = m.direction === 'OUTBOUND';
                return (
                  <Box key={m.id} sx={{
                    display: 'flex', justifyContent: outbound ? 'flex-end' : 'flex-start',
                    mb: 0.75,
                  }}>
                    <Box sx={{
                      maxWidth: '65%', px: 1.75, py: 1,
                      borderRadius: outbound ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      bgcolor: outbound ? '#dcf8c6' : '#fff',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    }}>
                      <Typography sx={{
                        fontSize: '0.9rem', color: '#111827', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}>
                        {m.body || `[${m.type}]`}
                      </Typography>
                      <Stack direction="row" spacing={0.75} justifyContent="flex-end" alignItems="center" sx={{ mt: 0.25 }}>
                        {outbound && m.sentByUser && (
                          <Typography sx={{ fontSize: '0.62rem', color: MUTED }}>
                            {m.sentByUser.nombre}
                          </Typography>
                        )}
                        {outbound && m.sentByBot && (
                          <Chip size="small" label="Bot" sx={{ height: 14, fontSize: '0.55rem', bgcolor: '#eff6ff', color: '#0369a1' }} />
                        )}
                        <Typography sx={{ fontSize: '0.62rem', color: MUTED }}>{fmtTime(m.timestamp)}</Typography>
                        {outbound && m.deliveryStatus && (
                          <Typography sx={{ fontSize: '0.62rem', color: m.deliveryStatus === 'failed' ? '#b91c1c' : MUTED }}>
                            · {m.deliveryStatus}
                          </Typography>
                        )}
                      </Stack>
                    </Box>
                  </Box>
                );
              })}
              <div ref={messagesEndRef} />
            </Box>

            {/* Composer */}
            <Box sx={{ p: 2, borderTop: `1px solid ${BORDER}`, bgcolor: '#fff' }}>
              {!windowOpen ? (
                <Alert severity="warning" sx={{ borderRadius: '10px' }}>
                  La ventana de 24h se cerró. Solo se pueden enviar plantillas HSM aprobadas por Meta (disponibles próximamente).
                </Alert>
              ) : selected.status === 'CLOSED' ? (
                <Alert severity="info" sx={{ borderRadius: '10px' }}>
                  Conversación cerrada. Reabre para responder.
                </Alert>
              ) : (
                <>
                  {sendError && <Alert severity="error" sx={{ mb: 1, borderRadius: '10px', fontSize: '0.8rem' }}>{sendError}</Alert>}
                  <Stack direction="row" spacing={1} alignItems="flex-end">
                    <TextField
                      fullWidth multiline maxRows={4} placeholder="Escribe un mensaje..."
                      value={sendText}
                      onChange={(e) => setSendText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                      }}
                      InputProps={{ sx: { borderRadius: '12px', fontSize: '0.9rem' } }}
                    />
                    <IconButton
                      onClick={handleSend}
                      disabled={sending || !sendText.trim()}
                      sx={{
                        bgcolor: WA_GREEN, color: '#fff', width: 44, height: 44,
                        '&:hover': { bgcolor: '#1fb85a' },
                        '&:disabled': { bgcolor: '#cbd5e1', color: '#fff' },
                      }}
                    >
                      {sending ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <SendRoundedIcon />}
                    </IconButton>
                  </Stack>
                </>
              )}
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: MUTED, textAlign: 'center', px: 3 }}>
            <WhatsAppIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
            <Typography sx={{ ...SERIF, color: NAVY, fontSize: '1.5rem', fontWeight: 600, mb: 1 }}>
              Selecciona una conversación
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', mb: 3 }}>
              Los mensajes de +57 317 150 3944 aparecerán a la izquierda cuando lleguen.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openNewDialog}
              sx={{ bgcolor: ACCENT, textTransform: 'none', fontWeight: 700, borderRadius: '10px',
                '&:hover': { bgcolor: '#5b21b6' } }}>
              Iniciar nueva conversación
            </Button>
          </Box>
        )}
      </Box>

      {/* ─── Modal: Nueva conversación ─── */}
      <Dialog open={newOpen} onClose={() => !newLoading && setNewOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '14px' } }}>
        <DialogTitle sx={{ ...SERIF, color: NAVY, fontSize: '1.35rem', fontWeight: 600 }}>
          Nueva conversación
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.82rem' }}>
            Meta solo permite escribir en frío usando <strong>plantillas HSM aprobadas</strong>.
            Cuando el contacto responda, se abre la ventana de 24h para texto libre.
          </Alert>

          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de contacto</InputLabel>
              <Select
                value={newForm.contactType}
                label="Tipo de contacto"
                onChange={(e) => setNewForm({ ...newForm, contactType: e.target.value, templateKey: '', variables: {} })}
              >
                {contactTypes.map((c) => (
                  <MenuItem key={c.key} value={c.key}>
                    <Box>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.label}</Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: MUTED }}>{c.description}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField label="Teléfono (con código país, ej. 573001234567)" fullWidth size="small"
              value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value.replace(/\D/g, '') })}
              helperText="Solo números, sin + ni espacios" />
            <TextField label="Nombre (opcional)" fullWidth size="small"
              value={newForm.contactName} onChange={(e) => setNewForm({ ...newForm, contactName: e.target.value })} />

            <FormControl fullWidth size="small">
              <InputLabel>Plantilla</InputLabel>
              <Select value={newForm.templateKey} label="Plantilla"
                onChange={(e) => setNewForm({ ...newForm, templateKey: e.target.value, variables: {} })}>
                {templatesForType.length === 0 ? (
                  <MenuItem disabled value="">
                    Sin plantillas disponibles para este tipo
                  </MenuItem>
                ) : templatesForType.map((t) => (
                  <MenuItem key={t.key} value={t.key}>
                    <Box>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{t.label}</Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: MUTED }}>{t.description}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedTemplate && (
              <>
                {selectedTemplate.variables.map((v) => (
                  <TextField key={v.key} label={v.label} placeholder={v.placeholder} fullWidth size="small"
                    value={newForm.variables[v.key] || ''}
                    onChange={(e) => setNewForm({ ...newForm, variables: { ...newForm.variables, [v.key]: e.target.value } })}
                  />
                ))}
                <Box sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803d', mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Vista previa del mensaje
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: '#111827', whiteSpace: 'pre-wrap' }}>
                    {selectedTemplate.variables.reduce((txt, v, i) => {
                      const val = newForm.variables[v.key] || `{{${i + 1}}}`;
                      return txt.split(`{{${i + 1}}}`).join(val);
                    }, selectedTemplate.preview)}
                  </Typography>
                </Box>
              </>
            )}

            {newError && <Alert severity="error" sx={{ borderRadius: '10px', fontSize: '0.82rem' }}>{newError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNewOpen(false)} disabled={newLoading}>Cancelar</Button>
          <Button variant="contained" onClick={submitNew} disabled={newLoading || !newForm.phone || !newForm.templateKey}
            sx={{ bgcolor: WA_GREEN, textTransform: 'none', fontWeight: 700,
              '&:hover': { bgcolor: '#1fb85a' } }}>
            {newLoading ? 'Enviando…' : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
