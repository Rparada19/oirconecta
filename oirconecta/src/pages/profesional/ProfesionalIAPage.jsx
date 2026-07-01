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

  const loadAll = async () => {
    setLoading(true);
    const [b, c, cat, cfg] = await Promise.all([
      directoryApi.get('/api/ia/me/balance'),
      directoryApi.get('/api/ia/me/conversations?limit=200'),
      directoryApi.get('/api/ia/packs/catalog'),
      directoryApi.get('/api/ia/me/agent-config'),
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
    }
    setLoading(false);
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
