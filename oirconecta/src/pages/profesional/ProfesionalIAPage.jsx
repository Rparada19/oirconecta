/**
 * F5.4 UI — Panel del profesional para gestionar su agente IA.
 * Muestra saldo (base 150/mes + packs comprados), lista conversaciones,
 * export XLSX (compliance habeas data), y solicitud de compra de packs.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Stack, Chip, CircularProgress, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, IconButton, Drawer, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Snackbar,
} from '@mui/material';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { AGENT_ICON_MAP, AGENT_ICON_LABELS, getAgentIcon } from '../../utils/iaAgentIcons';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import { directoryApi, getDirectoryToken } from '../../services/directoryAccountApi';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';
import ProfesionalPageHeader from '../../components/profesional/ProfesionalPageHeader';

const ACCENT = '#6d28d9';
const NAVY = '#0F2A4A';

const fmtCOP = (n) => `$${(n || 0).toLocaleString('es-CO')}`;
const fmtDT = (d) => d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—';

export default function ProfesionalIAPage() {
  const [balance, setBalance] = useState(null);
  const [convs, setConvs] = useState({ items: [], total: 0 });
  const [catalog, setCatalog] = useState([]);
  const [config, setConfig] = useState(null);
  const [configDraft, setConfigDraft] = useState({ agentName: '', agentColor: '#6d28d9', agentIcon: 'smart_toy', welcomeMessage: '' });
  const [savingConfig, setSavingConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accessError, setAccessError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [toast, setToast] = useState(null);
  // Educación del asistente (F5.6)
  const [eduDraft, setEduDraft] = useState({ personality: '', expertise: '', signature: '', avoidTopics: '' });
  const [savingEdu, setSavingEdu] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [faqDialog, setFaqDialog] = useState(null); // null | { id?, question, answer, isActive }
  const [savingFaq, setSavingFaq] = useState(false);
  const [limits, setLimits] = useState({ text: { personality: 600, expertise: 600, signature: 200, avoidTopics: 600 }, faqs: { max: 30, questionMax: 200, answerMax: 1000 } });

  const loadAll = async () => {
    setLoading(true);
    const [b, c, cat, cfg, fq, lim] = await Promise.all([
      directoryApi.get('/api/ia/me/balance'),
      directoryApi.get('/api/ia/me/conversations?limit=200'),
      directoryApi.get('/api/ia/packs/catalog'),
      directoryApi.get('/api/ia/me/agent-config'),
      directoryApi.get('/api/ia/me/agent-faqs'),
      directoryApi.get('/api/ia/agent-config/limits'),
    ]);
    if (b.error) {
      setAccessError({ code: b.data?.code, message: b.error });
      setLoading(false);
      return;
    }
    setBalance(b.data.data);
    if (c.data?.data) setConvs(c.data.data);
    if (cat.data?.data) setCatalog(cat.data.data);
    if (cfg.data?.data) {
      setConfig(cfg.data.data);
      setConfigDraft({
        agentName: cfg.data.data.agentName || 'Asistente',
        agentColor: cfg.data.data.agentColor || '#6d28d9',
        agentIcon: cfg.data.data.agentIcon || 'smart_toy',
        welcomeMessage: cfg.data.data.welcomeMessage || '',
      });
      setEduDraft({
        personality: cfg.data.data.personality || '',
        expertise: cfg.data.data.expertise || '',
        signature: cfg.data.data.signature || '',
        avoidTopics: cfg.data.data.avoidTopics || '',
      });
    }
    if (Array.isArray(fq.data?.data)) setFaqs(fq.data.data);
    if (lim.data?.data) setLimits(lim.data.data);
    setLoading(false);
  };

  const saveEducation = async () => {
    setSavingEdu(true);
    const r = await directoryApi.put('/api/ia/me/agent-config', {
      personality: eduDraft.personality.trim() || null,
      expertise: eduDraft.expertise.trim() || null,
      signature: eduDraft.signature.trim() || null,
      avoidTopics: eduDraft.avoidTopics.trim() || null,
    });
    setSavingEdu(false);
    if (r.error) return setToast({ severity: 'error', msg: r.error });
    setConfig(r.data.data);
    setToast({ severity: 'success', msg: 'Educación guardada. Se aplica al bot en la próxima conversación.' });
  };

  const openFaqNew = () => setFaqDialog({ question: '', answer: '', isActive: true });
  const openFaqEdit = (f) => setFaqDialog({ id: f.id, question: f.question, answer: f.answer, isActive: f.isActive });

  const saveFaq = async () => {
    if (!faqDialog) return;
    setSavingFaq(true);
    const body = { question: faqDialog.question, answer: faqDialog.answer, isActive: faqDialog.isActive };
    const r = faqDialog.id
      ? await directoryApi.patch(`/api/ia/me/agent-faqs/${faqDialog.id}`, body)
      : await directoryApi.post('/api/ia/me/agent-faqs', body);
    setSavingFaq(false);
    if (r.error) return setToast({ severity: 'error', msg: r.error });
    // refresca lista
    const fq = await directoryApi.get('/api/ia/me/agent-faqs');
    if (Array.isArray(fq.data?.data)) setFaqs(fq.data.data);
    setFaqDialog(null);
    setToast({ severity: 'success', msg: faqDialog.id ? 'FAQ actualizada' : 'FAQ agregada' });
  };

  const toggleFaqActive = async (f) => {
    const r = await directoryApi.patch(`/api/ia/me/agent-faqs/${f.id}`, { isActive: !f.isActive });
    if (r.error) return setToast({ severity: 'error', msg: r.error });
    setFaqs((prev) => prev.map((x) => x.id === f.id ? { ...x, isActive: !f.isActive } : x));
  };

  const deleteFaq = async (f) => {
    if (!confirm(`¿Eliminar la FAQ "${f.question.slice(0, 40)}…"?`)) return;
    const r = await directoryApi.delete(`/api/ia/me/agent-faqs/${f.id}`);
    if (r.error) return setToast({ severity: 'error', msg: r.error });
    setFaqs((prev) => prev.filter((x) => x.id !== f.id));
    setToast({ severity: 'success', msg: 'FAQ eliminada' });
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    const r = await directoryApi.put('/api/ia/me/agent-config', {
      agentName: configDraft.agentName.trim(),
      agentColor: configDraft.agentColor,
      agentIcon: configDraft.agentIcon,
      welcomeMessage: configDraft.welcomeMessage.trim() || null,
    });
    setSavingConfig(false);
    if (r.error) return setToast({ severity: 'error', msg: r.error });
    setConfig(r.data.data);
    setToast({ severity: 'success', msg: 'Personalización guardada. Se aplica al widget en unos segundos.' });
  };

  useEffect(() => { loadAll(); }, []);

  const openDetail = async (id) => {
    setSelected({ loading: true });
    const r = await directoryApi.get(`/api/ia/me/conversations/${id}`);
    setSelected(r?.data?.data || { error: r?.error });
  };

  const exportXlsx = async () => {
    const token = getDirectoryToken();
    const url = `${getApiBaseUrl().replace(/\/$/, '')}/api/ia/me/conversations.xlsx`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `conversaciones-ia-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      setToast({ severity: 'success', msg: 'Descarga iniciada' });
    } catch (e) {
      setToast({ severity: 'error', msg: e.message });
    }
  };

  if (loading) {
    return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  }

  if (accessError) {
    const needsUpgrade = accessError.code === 'IA_NOT_INCLUDED' || accessError.code === 'NO_SUBSCRIPTION';
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <ProfesionalPageHeader icon={SmartToyOutlinedIcon} title="Agente IA"
          subtitle="Panel de conversaciones con tus pacientes" />
        <Card sx={{ mt: 2, borderRadius: '14px', border: '1px solid #e5e7eb', maxWidth: 720 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <SmartToyOutlinedIcon sx={{ fontSize: 56, color: ACCENT, mb: 2 }} />
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: NAVY, mb: 1 }}>
              {needsUpgrade ? 'El Agente IA está solo en Plan 3' : 'No disponible'}
            </Typography>
            <Typography sx={{ color: '#475569', mb: 3 }}>{accessError.message}</Typography>
            {needsUpgrade && (
              <Button variant="contained" href="/portal-profesional/suscripcion"
                sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700 }}>
                Ver planes
              </Button>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  const totalUsed = (balance?.base?.used || 0) + balance?.packs?.reduce((a, p) => a + (p.usedConversations || 0), 0);
  const totalCapacity = (balance?.base?.limit || 0) + balance?.packs?.reduce((a, p) => a + (p.totalConversations || 0), 0);
  const pct = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;
  const alertColor = pct >= 90 ? '#b91c1c' : pct >= 70 ? '#a16207' : ACCENT;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <ProfesionalPageHeader icon={SmartToyOutlinedIcon} title="Agente IA"
        subtitle="Saldo de conversaciones, historial y auditoría de tu asistente virtual." />

      {/* Saldo */}
      <Card sx={{ mt: 2, borderRadius: '14px', border: '1px solid #e5e7eb', background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.5 }}>
                Conversaciones disponibles
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography sx={{ fontSize: '2.5rem', fontWeight: 900, color: alertColor, lineHeight: 1 }}>
                  {balance?.totalRemaining ?? 0}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>de {totalCapacity} totales este periodo</Typography>
              </Stack>
              <Box sx={{ mt: 1.5, height: 8, bgcolor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', maxWidth: 400 }}>
                <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: alertColor, transition: 'width 0.3s' }} />
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5 }}>
                {pct}% consumido · Base: {balance?.base?.remaining}/{balance?.base?.limit} · Packs: {balance?.packs?.reduce((a, p) => a + p.remaining, 0) || 0}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="contained" startIcon={<ShoppingCartOutlinedIcon />} onClick={() => setBuyOpen(true)}
                sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
                Comprar paquete
              </Button>
              <Button variant="outlined" onClick={loadAll} startIcon={<RefreshRoundedIcon />}
                sx={{ borderColor: ACCENT, color: ACCENT, textTransform: 'none', borderRadius: '10px' }}>
                Refrescar
              </Button>
            </Stack>
          </Stack>

          {/* Packs activos */}
          {balance?.packs?.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
                Paquetes activos
              </Typography>
              <Stack spacing={1}>
                {balance.packs.map((p) => (
                  <Box key={p.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1.25, border: '1px solid #e5e7eb', borderRadius: '10px', bgcolor: '#fff' }}>
                    <Chip label={`${p.totalConversations}`} size="small" sx={{ bgcolor: '#faf5ff', color: ACCENT, fontWeight: 800 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 700 }}>Paquete de {p.totalConversations} · pagado {fmtCOP(p.priceCOP)}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Restan {p.remaining} · vence {fmtDate(p.expiresAt)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Personalización del asistente */}
      <Card sx={{ mt: 3, borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.75, bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.95rem' }}>
            Personalización del asistente
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
            Elige cómo te representa el chat en tu perfil público.
          </Typography>
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            {/* Form */}
            <Stack spacing={2} sx={{ flex: 1 }}>
              <TextField label="Nombre del asistente" size="small" fullWidth
                value={configDraft.agentName}
                onChange={(e) => setConfigDraft({ ...configDraft, agentName: e.target.value })}
                inputProps={{ minLength: 2, maxLength: 30 }}
                helperText="2 a 30 caracteres. Ej: Sofía, Camilo, Aura." />
              <Box>
                <Typography sx={{ fontSize: '0.75rem', color: '#475569', mb: 0.5, fontWeight: 600 }}>
                  Color del botón
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <input type="color"
                    value={configDraft.agentColor}
                    onChange={(e) => setConfigDraft({ ...configDraft, agentColor: e.target.value })}
                    style={{ width: 48, height: 40, border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer' }} />
                  <TextField size="small" value={configDraft.agentColor}
                    onChange={(e) => setConfigDraft({ ...configDraft, agentColor: e.target.value })}
                    inputProps={{ pattern: '^#[0-9A-Fa-f]{6}$' }}
                    sx={{ width: 130 }} />
                  <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>Formato hex #RRGGBB</Typography>
                </Stack>
              </Box>

              {/* Galería de íconos */}
              <Box>
                <Typography sx={{ fontSize: '0.75rem', color: '#475569', mb: 0.75, fontWeight: 600 }}>
                  Ícono del bot
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 1 }}>
                  {Object.keys(AGENT_ICON_MAP).map((key) => {
                    const Ico = AGENT_ICON_MAP[key];
                    const selected = configDraft.agentIcon === key;
                    return (
                      <Box key={key} onClick={() => setConfigDraft({ ...configDraft, agentIcon: key })}
                        sx={{
                          cursor: 'pointer', textAlign: 'center', p: 1, borderRadius: '10px',
                          border: selected ? `2px solid ${configDraft.agentColor}` : '2px solid transparent',
                          bgcolor: selected ? `${configDraft.agentColor}12` : '#f8fafc',
                          transition: 'all 0.15s',
                          '&:hover': { bgcolor: selected ? `${configDraft.agentColor}20` : '#f1f5f9' },
                        }}>
                        <Ico sx={{ fontSize: 28, color: selected ? configDraft.agentColor : '#475569' }} />
                        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', mt: 0.25, lineHeight: 1.1 }}>
                          {AGENT_ICON_LABELS[key]}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
              <TextField label="Mensaje de bienvenida (opcional)" size="small" fullWidth multiline minRows={2}
                value={configDraft.welcomeMessage}
                onChange={(e) => setConfigDraft({ ...configDraft, welcomeMessage: e.target.value })}
                inputProps={{ maxLength: 500 }}
                helperText="Si lo dejas vacío, se genera automáticamente." />
              <Button variant="contained" onClick={saveConfig} disabled={savingConfig}
                sx={{ background: configDraft.agentColor, textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start',
                      '&:hover': { background: configDraft.agentColor, filter: 'brightness(0.9)' } }}>
                {savingConfig ? 'Guardando…' : 'Guardar personalización'}
              </Button>
            </Stack>

            {/* Preview del botón */}
            <Box sx={{ width: { xs: '100%', md: 260 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, mb: 1.5 }}>
                Vista previa del botón
              </Typography>
              {(() => {
                const PreviewIcon = getAgentIcon(configDraft.agentIcon);
                return (
                  <Box sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 1, px: 2.25, py: 1.25, borderRadius: '999px',
                    background: `linear-gradient(135deg, ${configDraft.agentColor}, ${configDraft.agentColor}dd)`,
                    color: '#fff', fontWeight: 700, boxShadow: `0 10px 28px ${configDraft.agentColor}55`,
                  }}>
                    <PreviewIcon sx={{ fontSize: 20 }} />
                    {configDraft.agentName || 'Asistente'}
                  </Box>
                );
              })()}
              <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mt: 2, textAlign: 'center' }}>
                Así lo verán los pacientes en la esquina inferior de tu ficha pública.
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Educación del asistente (F5.6) */}
      <Card sx={{ mt: 3, borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.75, bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SchoolOutlinedIcon sx={{ color: ACCENT }} />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.95rem' }}>
              Educación del asistente
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
              Enséñale a tu bot cómo hablar, qué mencionar y qué NUNCA responder. Todo se aplica al instante en la próxima conversación.
            </Typography>
          </Box>
        </Box>
        <CardContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 2.5, borderRadius: '10px' }}>
            <strong>Cómo funciona:</strong> lo que escribas aquí se inyecta en las instrucciones del asistente cada vez que un paciente le habla.
            No lo repitas literalmente en las conversaciones — describe cómo <em>debe comportarse</em>. Ejemplo: <em>"Habla en tono cercano, evita palabras técnicas, siempre invita a agendar valoración."</em>
          </Alert>

          <Stack spacing={2.25}>
            <TextField
              label="🎭 Personalidad y tono"
              size="small" fullWidth multiline minRows={2}
              value={eduDraft.personality}
              onChange={(e) => setEduDraft({ ...eduDraft, personality: e.target.value })}
              inputProps={{ maxLength: limits.text.personality }}
              helperText={`${eduDraft.personality.length}/${limits.text.personality}. Ej: "Cercana, empática, usa términos cotidianos en vez de jerga médica. Trata al paciente con calidez."`}
            />
            <TextField
              label="🎯 Áreas de expertise (para mencionar cuando aporten valor)"
              size="small" fullWidth multiline minRows={2}
              value={eduDraft.expertise}
              onChange={(e) => setEduDraft({ ...eduDraft, expertise: e.target.value })}
              inputProps={{ maxLength: limits.text.expertise }}
              helperText={`${eduDraft.expertise.length}/${limits.text.expertise}. Ej: "Adaptación de audífonos pediátricos, terapia auditiva verbal, manejo de tinnitus, evaluación laboral."`}
            />
            <TextField
              label="✍️ Frase de firma (opcional)"
              size="small" fullWidth
              value={eduDraft.signature}
              onChange={(e) => setEduDraft({ ...eduDraft, signature: e.target.value })}
              inputProps={{ maxLength: limits.text.signature }}
              helperText={`${eduDraft.signature.length}/${limits.text.signature}. Ej: "Cuídate mucho — Piedad." El bot la usa al despedirse.`}
            />
            <TextField
              label="🚫 Temas que el bot NUNCA debe tocar"
              size="small" fullWidth multiline minRows={2}
              value={eduDraft.avoidTopics}
              onChange={(e) => setEduDraft({ ...eduDraft, avoidTopics: e.target.value })}
              inputProps={{ maxLength: limits.text.avoidTopics }}
              helperText={`${eduDraft.avoidTopics.length}/${limits.text.avoidTopics}. Ej: "Precios exactos de audífonos, diagnósticos, promesas de resultados clínicos, financiación."`}
            />
            <Button
              variant="contained"
              onClick={saveEducation}
              disabled={savingEdu}
              startIcon={<AutoAwesomeOutlinedIcon />}
              sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start',
                    '&:hover': { background: ACCENT, filter: 'brightness(0.9)' } }}
            >
              {savingEdu ? 'Guardando…' : 'Guardar educación'}
            </Button>
          </Stack>

          {/* FAQs */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px dashed #e5e7eb' }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.9rem' }}>
                  Preguntas frecuentes verificadas ({faqs.length}/{limits.faqs.max})
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Pregunta ↔ respuesta que <strong>tú apruebas</strong>. El bot las usa como fuente confiable antes de improvisar.
                </Typography>
              </Box>
              <Button
                startIcon={<AddRoundedIcon />}
                variant="outlined"
                size="small"
                disabled={faqs.length >= limits.faqs.max}
                onClick={openFaqNew}
                sx={{ borderColor: ACCENT, color: ACCENT, textTransform: 'none', fontWeight: 700 }}
              >
                Agregar FAQ
              </Button>
            </Stack>

            {faqs.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                  Aún no tienes FAQs. Agrega las preguntas que tus pacientes hacen todo el tiempo (horarios, dirección, qué esperar en la primera consulta, medios de pago, etc.).
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.25}>
                {faqs.map((f) => (
                  <Box key={f.id} sx={{
                    p: 1.75, border: '1px solid #e5e7eb', borderRadius: '10px',
                    bgcolor: f.isActive ? '#fff' : '#f8fafc',
                    opacity: f.isActive ? 1 : 0.65,
                  }}>
                    <Stack direction="row" alignItems="flex-start" spacing={1}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: NAVY, mb: 0.25 }}>
                          P: {f.question}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8125rem', color: '#475569', whiteSpace: 'pre-wrap' }}>
                          R: {f.answer}
                        </Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={0.25}>
                        <Tooltip title={f.isActive ? 'Activa — el bot la usa' : 'Pausada — el bot no la ve'}>
                          <Switch size="small" checked={f.isActive} onChange={() => toggleFaqActive(f)} />
                        </Tooltip>
                        <IconButton size="small" onClick={() => openFaqEdit(f)}>
                          <EditRoundedIcon sx={{ fontSize: 18, color: '#64748b' }} />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteFaq(f)}>
                          <DeleteOutlineRoundedIcon sx={{ fontSize: 18, color: '#b91c1c' }} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Dialog FAQ (crear/editar) */}
      <Dialog open={!!faqDialog} onClose={() => setFaqDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>
          {faqDialog?.id ? 'Editar pregunta frecuente' : 'Nueva pregunta frecuente'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Pregunta del paciente"
              size="small" fullWidth
              value={faqDialog?.question || ''}
              onChange={(e) => setFaqDialog({ ...faqDialog, question: e.target.value })}
              inputProps={{ maxLength: limits.faqs.questionMax }}
              helperText={`${(faqDialog?.question || '').length}/${limits.faqs.questionMax}. Ej: "¿Cuánto dura la primera valoración?"`}
              autoFocus
            />
            <TextField
              label="Respuesta que el bot debe dar"
              size="small" fullWidth multiline minRows={3}
              value={faqDialog?.answer || ''}
              onChange={(e) => setFaqDialog({ ...faqDialog, answer: e.target.value })}
              inputProps={{ maxLength: limits.faqs.answerMax }}
              helperText={`${(faqDialog?.answer || '').length}/${limits.faqs.answerMax}. Escribe la respuesta ideal — el bot la adapta al contexto de cada conversación.`}
            />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={faqDialog?.isActive ?? true}
                onChange={(e) => setFaqDialog({ ...faqDialog, isActive: e.target.checked })}
              />
              <Typography sx={{ fontSize: '0.875rem', color: '#475569' }}>
                Activa — el bot puede usarla en conversaciones
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFaqDialog(null)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button
            onClick={saveFaq}
            disabled={savingFaq || !faqDialog?.question?.trim() || !faqDialog?.answer?.trim()}
            variant="contained"
            sx={{ background: ACCENT, textTransform: 'none', fontWeight: 700 }}
          >
            {savingFaq ? 'Guardando…' : (faqDialog?.id ? 'Actualizar' : 'Crear FAQ')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Conversaciones */}
      <Card sx={{ mt: 3, borderRadius: '14px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <Box sx={{ px: 2.5, py: 1.75, bgcolor: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '0.95rem' }}>
              Historial de conversaciones ({convs.total})
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
              Puedes descargar todas las conversaciones como archivo Excel para tu registro clínico o auditorías.
            </Typography>
          </Box>
          <Button startIcon={<DownloadRoundedIcon />} variant="outlined" onClick={exportXlsx}
            sx={{ borderColor: ACCENT, color: ACCENT, textTransform: 'none', fontWeight: 700 }}>
            Exportar Excel
          </Button>
        </Box>
        {convs.items.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center', color: '#94a3b8' }}>
            <Typography>Aún no hay conversaciones. Aparecerán aquí cuando un paciente use el asistente en tu perfil público.</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Fecha', 'Paciente', 'Canal', 'Msgs', 'Cita', 'Última actividad', ''].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {convs.items.map((c) => (
                <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => openDetail(c.id)}>
                  <TableCell sx={{ fontSize: '0.8125rem' }}>{fmtDT(c.startedAt)}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>{c.pacienteNombre || 'Anónimo'}</Typography>
                    {c.pacienteTelefono && <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.pacienteTelefono}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={c.canal}
                      sx={{ bgcolor: c.canal === 'whatsapp' ? '#dcfce7' : '#e0f2fe',
                            color: c.canal === 'whatsapp' ? '#15803d' : '#0369a1',
                            fontWeight: 700, height: 20, fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell>{c.messageCount}</TableCell>
                  <TableCell>
                    {c.resultedInAppointmentId
                      ? <EventAvailableOutlinedIcon sx={{ color: '#15803d', fontSize: 18 }} />
                      : <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8125rem' }}>{fmtDT(c.lastMessageAt)}</TableCell>
                  <TableCell sx={{ color: ACCENT, fontWeight: 700 }}>Ver →</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Drawer detalle */}
      <Drawer anchor="right" open={!!selected} onClose={() => setSelected(null)}
        PaperProps={{ sx: { width: { xs: '100%', md: 560 } } }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ fontWeight: 800, color: NAVY, flex: 1 }}>Conversación</Typography>
          <IconButton onClick={() => setSelected(null)}><CloseOutlinedIcon /></IconButton>
        </Box>
        <Box sx={{ p: 2, overflowY: 'auto' }}>
          {selected?.loading && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>}
          {selected?.error && <Alert severity="error">{selected.error}</Alert>}
          {selected && !selected.loading && !selected.error && (
            <>
              <Box sx={{ bgcolor: '#faf5ff', p: 2, borderRadius: '10px', mb: 2 }}>
                <Typography sx={{ fontSize: '0.875rem' }}><strong>Paciente:</strong> {selected.pacienteNombre || 'Anónimo'}</Typography>
                {selected.pacienteTelefono && <Typography sx={{ fontSize: '0.875rem' }}><strong>Teléfono:</strong> {selected.pacienteTelefono}</Typography>}
                <Typography sx={{ fontSize: '0.875rem' }}><strong>Canal:</strong> {selected.canal}</Typography>
                <Typography sx={{ fontSize: '0.875rem' }}><strong>Inicio:</strong> {fmtDT(selected.startedAt)}</Typography>
                {selected.resultedInAppointmentId && (
                  <Chip size="small" label="Terminó en cita agendada" sx={{ mt: 1, bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
                )}
              </Box>
              <Divider sx={{ mb: 2 }}>Mensajes</Divider>
              <Stack spacing={1}>
                {selected.messages?.map((m) => (
                  <Box key={m.id} sx={{
                    p: 1.5, borderRadius: '10px',
                    bgcolor: m.role === 'user' ? '#e0f2fe' : m.role === 'assistant' ? '#faf5ff' : '#fef3c7',
                    borderLeft: `3px solid ${m.role === 'user' ? '#0369a1' : m.role === 'assistant' ? ACCENT : '#a16207'}`,
                  }}>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 0.5 }}>
                      {m.role === 'user' ? '👤 Paciente' : m.role === 'assistant' ? '🤖 Asistente' : `🔧 ${m.toolName || 'tool'}`}
                      {' · '} {fmtDT(m.createdAt)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                  </Box>
                ))}
              </Stack>
            </>
          )}
        </Box>
      </Drawer>

      {/* Dialog compra pack */}
      <Dialog open={buyOpen} onClose={() => setBuyOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>Comprar paquete de conversaciones</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            La pasarela de pago automática se conectará muy pronto. Mientras tanto,
            contacta al equipo OírConecta al <strong>servicioalcliente@oirconecta.com</strong> con
            el paquete que deseas comprar. Al confirmar el pago manual, activaremos el paquete en tu cuenta.
          </Alert>
          <Stack spacing={1.5}>
            {catalog.map((p) => (
              <Box key={p.code} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 2, border: '1px solid #e5e7eb', borderRadius: '10px' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>{p.label}</Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    {p.totalConversations} conversaciones · vence en {p.durationDays} días
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, color: ACCENT }}>{fmtCOP(p.priceCOP)}</Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBuyOpen(false)} sx={{ textTransform: 'none' }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)}>
        {toast && <Alert severity={toast.severity} onClose={() => setToast(null)}>{toast.msg}</Alert>}
      </Snackbar>
    </Box>
  );
}
