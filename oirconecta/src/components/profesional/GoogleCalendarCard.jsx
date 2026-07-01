/**
 * C9 — Card para conectar/desconectar Google Calendar del profesional.
 * Se muestra dentro de la tab "Configuración" de la agenda.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, Typography, Button, Stack, Alert, CircularProgress, Chip,
} from '@mui/material';
import { CalendarMonthOutlined, LinkOffOutlined, CheckCircleOutlined } from '@mui/icons-material';
import { directoryApi } from '../../services/directoryAccountApi';

const NAVY = '#0F2A4A';
const ACCENT = '#15803d';

export default function GoogleCalendarCard() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await directoryApi.get('/api/google-calendar/me/status');
    if (r.data?.data) setStatus(r.data.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Detecta ?gcal=ok|error tras callback
    const params = new URLSearchParams(window.location.search);
    const gcal = params.get('gcal');
    if (gcal === 'ok') setMsg({ type: 'success', text: 'Google Calendar conectado correctamente.' });
    else if (gcal === 'error') setMsg({ type: 'error', text: `No se pudo conectar: ${params.get('reason') || 'desconocido'}` });
    if (gcal) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [load]);

  const connect = async () => {
    setBusy(true);
    const r = await directoryApi.get('/api/google-calendar/me/authorize-url');
    setBusy(false);
    if (r.data?.data?.url) window.location.href = r.data.data.url;
  };

  const disconnect = async () => {
    if (!window.confirm('¿Desconectar Google Calendar? Las citas futuras dejarán de sincronizarse.')) return;
    setBusy(true);
    await directoryApi.post('/api/google-calendar/me/disconnect');
    setBusy(false);
    setMsg({ type: 'success', text: 'Google Calendar desconectado.' });
    load();
  };

  if (loading) {
    return <Card sx={{ p: 2, mb: 2, border: '1px solid #e5e7eb', borderRadius: '10px' }}><CircularProgress size={20} /></Card>;
  }

  return (
    <Card sx={{ p: 2.5, mb: 3, border: '1px solid #e5e7eb', borderRadius: '10px',
                bgcolor: status?.connected ? '#f0fdf4' : '#f8fafc' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CalendarMonthOutlined sx={{ fontSize: 32, color: status?.connected ? ACCENT : '#94a3b8' }} />
          <Box>
            <Typography sx={{ fontWeight: 800, color: NAVY, display: 'flex', alignItems: 'center', gap: 1 }}>
              Google Calendar
              {status?.connected && (
                <Chip icon={<CheckCircleOutlined sx={{ fontSize: 14 }} />} label="Conectado"
                  size="small" sx={{ height: 22, bgcolor: '#dcfce7', color: ACCENT, fontWeight: 700 }} />
              )}
            </Typography>
            {status?.connected ? (
              <Typography sx={{ fontSize: '0.8rem', color: '#475569' }}>
                Sincronizando con <strong>{status.email || 'tu cuenta'}</strong>. Cada cita nueva, reagendada o cancelada aparece automáticamente en tu Google Calendar.
              </Typography>
            ) : (
              <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
                Conecta tu cuenta para ver tus citas de OírConecta directamente en tu Google Calendar (móvil, escritorio, invitaciones).
              </Typography>
            )}
          </Box>
        </Stack>
        <Box>
          {status?.connected ? (
            <Button size="small" onClick={disconnect} disabled={busy} startIcon={<LinkOffOutlined />}
              variant="outlined" sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#dc2626', color: '#dc2626',
                '&:hover': { borderColor: '#dc2626', bgcolor: '#fef2f2' } }}>
              Desconectar
            </Button>
          ) : (
            <Button onClick={connect} disabled={busy} variant="contained"
              sx={{ textTransform: 'none', fontWeight: 700, background: ACCENT,
                '&:hover': { background: ACCENT, filter: 'brightness(0.95)' } }}>
              {busy ? 'Redirigiendo…' : 'Conectar Google Calendar'}
            </Button>
          )}
        </Box>
      </Stack>
      {msg && <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mt: 2 }}>{msg.text}</Alert>}
    </Card>
  );
}
