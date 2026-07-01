/**
 * F5.2 — Widget de chat con el agente IA del profesional (Plan 3).
 *
 * Comportamiento:
 *  - Al montar: GET /api/ia/public/:profileId/info — si available=false oculta todo.
 *  - FAB inferior derecho "Asistente IA" → abre panel deslizable estilo chat.
 *  - Mantiene conversationId en estado para enlazar turnos consecutivos.
 *  - Muestra cuota restante en el header (300 - usadas).
 *  - Auto-scroll a último mensaje.
 *  - Si el backend reporta QUOTA_EXCEEDED, muestra mensaje y cierra entrada.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box, IconButton, Fab, Typography, TextField, Chip, CircularProgress, Alert, Tooltip, Stack,
} from '@mui/material';
import { CloseOutlined, SendOutlined } from '@mui/icons-material';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';
import { getAgentIcon } from '../../utils/iaAgentIcons';

const BASE_URL = getApiBaseUrl().replace(/\/$/, '');
const ACCENT = '#15803d';
const NAVY = '#0F2A4A';

async function get(path) {
  try {
    const r = await fetch(`${BASE_URL}${path}`);
    const j = await r.json().catch(() => null);
    return { ok: r.ok, data: j?.data, error: j?.error, code: j?.code, status: r.status };
  } catch { return { ok: false, error: 'Sin conexión', status: 0 }; }
}
async function post(path, body) {
  try {
    const r = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await r.json().catch(() => null);
    return { ok: r.ok, data: j?.data, error: j?.error, code: j?.code, status: r.status };
  } catch { return { ok: false, error: 'Sin conexión', status: 0 }; }
}

const DEFAULT_COLOR = '#6d28d9';
const DEFAULT_NAME = 'Asistente';
const DEFAULT_ICON = 'smart_toy';

export default function AgenteIAFloatingChat({ profileId, profesionalNombre }) {
  const [available, setAvailable] = useState(null);
  const [quota, setQuota] = useState(null);
  const [agent, setAgent] = useState({ name: DEFAULT_NAME, color: DEFAULT_COLOR, icon: DEFAULT_ICON, welcomeMessage: null });
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [convId, setConvId] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [exhausted, setExhausted] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!profileId) return;
    let cancel = false;
    get(`/api/ia/public/${profileId}/info`).then((r) => {
      if (cancel) return;
      const d = r.data;
      setAvailable(!!d?.available);
      if (d?.available) {
        setQuota({ used: d.conversationsUsed, limit: d.conversationsLimit, remaining: d.remaining });
        if (d.agent) {
          setAgent({
            name: d.agent.name || DEFAULT_NAME,
            color: d.agent.color || DEFAULT_COLOR,
            icon: d.agent.icon || DEFAULT_ICON,
            welcomeMessage: d.agent.welcomeMessage || null,
          });
        }
      }
    });
    return () => { cancel = true; };
  }, [profileId]);

  // Saludo inicial cuando se abre por primera vez.
  // Prioridad: welcomeMessage custom > mensaje autogenerado con nombre custom.
  useEffect(() => {
    if (open && messages.length === 0) {
      const text = agent.welcomeMessage
        || `¡Hola! Soy ${agent.name}, el asistente virtual de ${profesionalNombre || 'tu profesional'}. Puedo ayudarte a agendar, reagendar o cancelar una cita. ¿En qué te ayudo?`;
      setMessages([{ role: 'assistant', text }]);
    }
  }, [open, messages.length, profesionalNombre, agent]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || exhausted) return;
    setError(null);
    setInput('');
    setMessages((m) => [...m, { role: 'user', text }]);
    setSending(true);
    const r = await post(`/api/ia/public/${profileId}/chat`, { conversationId: convId, message: text });
    setSending(false);
    if (!r.ok) {
      if (r.code === 'QUOTA_EXCEEDED') {
        setExhausted(true);
        setMessages((m) => [...m, { role: 'assistant', text: r.error || 'Cuota mensual agotada.' }]);
      } else {
        setError(r.error || 'Error al enviar mensaje');
      }
      return;
    }
    setConvId(r.data.conversationId);
    setQuota(r.data.quota);
    setMessages((m) => [...m, { role: 'assistant', text: r.data.reply }]);
  }, [input, sending, exhausted, profileId, convId]);

  if (available !== true) return null; // mientras carga o si no aplica

  const IconComp = getAgentIcon(agent.icon);

  return (
    <>
      {/* FAB — color, nombre e ícono personalizables por profesional.
          Posicionado ~90px arriba del WhatsApp (que está a bottom: ~20px). */}
      {!open && (
        <Tooltip title={`${agent.name} · pregúntame para agendar`}>
          <Fab onClick={() => setOpen(true)} aria-label={agent.name} variant="extended"
            sx={{
              position: 'fixed',
              bottom: { xs: 'calc(env(safe-area-inset-bottom, 0px) + 90px)', md: 100 },
              right: { xs: 16, md: 24 },
              background: `linear-gradient(135deg, ${agent.color}, ${agent.color}dd)`,
              color: '#fff',
              '&:hover': { background: `linear-gradient(135deg, ${agent.color}, ${agent.color})`, filter: 'brightness(0.95)' },
              zIndex: 1250,
              boxShadow: `0 10px 28px ${agent.color}55`,
              pl: 1.75, pr: 2, gap: 1, fontWeight: 700, textTransform: 'none',
              borderRadius: '999px',
            }}>
            <IconComp sx={{ fontSize: 22 }} />
            {agent.name}
          </Fab>
        </Tooltip>
      )}

      {/* Panel chat */}
      {open && (
        <Box sx={{
          position: 'fixed',
          bottom: { xs: 0, md: 90 }, right: { xs: 0, md: 24 },
          width: { xs: '100vw', md: 400 },
          height: { xs: '85vh', md: 560 },
          maxHeight: { xs: '85vh', md: '75vh' },
          bgcolor: '#fff', borderRadius: { xs: '20px 20px 0 0', md: '18px' },
          boxShadow: '0 24px 60px rgba(15,42,74,0.30)',
          border: '1px solid #e5e7eb',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          zIndex: 1400,
        }}>
          {/* Header — color custom del profesional */}
          <Box sx={{
            px: 2, py: 1.5,
            background: `linear-gradient(135deg, ${agent.color}, ${agent.color}dd)`,
            color: '#fff', display: 'flex', alignItems: 'center', gap: 1.5,
          }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.18)',
                       display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconComp sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>
                {agent.name} · {profesionalNombre || 'consulta'}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>
                Disponible 24/7 · Respuestas IA · No reemplaza diagnóstico
              </Typography>
            </Box>
            <IconButton onClick={() => setOpen(false)} sx={{ color: '#fff' }}>
              <CloseOutlined />
            </IconButton>
          </Box>

          {/* Mensajes */}
          <Box ref={scrollRef} sx={{
            flex: 1, overflowY: 'auto', p: 2, bgcolor: '#f8fafc',
            display: 'flex', flexDirection: 'column', gap: 1,
          }}>
            {messages.map((m, i) => (
              <Box key={i} sx={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                bgcolor: m.role === 'user' ? agent.color : '#fff',
                color: m.role === 'user' ? '#fff' : NAVY,
                px: 1.5, py: 1,
                borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                boxShadow: m.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                whiteSpace: 'pre-wrap',
                fontSize: '0.875rem', lineHeight: 1.45,
              }}>
                {m.text}
              </Box>
            ))}
            {sending && (
              <Box sx={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 1, p: 1.5,
                         bgcolor: '#fff', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <CircularProgress size={14} sx={{ color: agent.color }} />
                <Typography sx={{ fontSize: '0.8125rem', color: '#64748b' }}>Pensando…</Typography>
              </Box>
            )}
            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 1 }}>{error}</Alert>
            )}
          </Box>

          {/* Footer con quota */}
          {quota && (
            <Stack direction="row" justifyContent="space-between" alignItems="center"
              sx={{ px: 2, py: 0.5, bgcolor: '#f1f5f9', borderTop: '1px solid #e5e7eb' }}>
              <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                Conversaciones disponibles este mes: <strong>{quota.remaining}</strong> / {quota.limit}
              </Typography>
            </Stack>
          )}

          {/* Input */}
          <Box sx={{ p: 1.5, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 1, bgcolor: '#fff' }}>
            <TextField
              fullWidth size="small" autoFocus
              placeholder={exhausted ? 'Cuota mensual agotada' : 'Escribe tu mensaje…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              disabled={sending || exhausted}
              InputProps={{ sx: { borderRadius: '20px', fontSize: '0.875rem' } }}
            />
            <IconButton onClick={send} disabled={!input.trim() || sending || exhausted}
              sx={{ bgcolor: agent.color, color: '#fff', '&:hover': { bgcolor: agent.color, filter: 'brightness(0.9)' },
                    '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#fff' } }}>
              <SendOutlined fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      )}
    </>
  );
}
