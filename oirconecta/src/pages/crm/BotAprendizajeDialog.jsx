/**
 * 🧠 Aprendizaje del bot.
 *
 * Lo que la revisión nocturna propone que el bot aprenda, sacado de cómo
 * terminaron los chats reales. Nada llega a un paciente hasta que se aprueba
 * aquí: una pregunta frecuente aprobada entra al cerebro del bot, una lección
 * aprobada entra a sus instrucciones desde el siguiente mensaje.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Stack, Typography, Button, Chip, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab, CircularProgress, Alert,
} from '@mui/material';
import { api } from '../../services/apiClient';

const NAVY = '#0F2A4A';
const MUTED = '#64748b';
const BORDER = '#eef0f3';

const TIPOS = {
  FAQ: { label: 'Pregunta frecuente', color: '#0369a1', bg: '#eff6ff', aprobar: 'Aprobar y enseñársela' },
  LECCION: { label: 'Lección', color: '#6d28d9', bg: '#f5f3ff', aprobar: 'Aprobar la lección' },
  ERROR: { label: 'Error a corregir', color: '#b91c1c', bg: '#fef2f2', aprobar: 'Marcar para corregir' },
};

function fmtDia(dia) {
  return new Date(`${dia}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
}

function Propuesta({ p, onAprobar, onDescartar, onVerChat, ocupado }) {
  const meta = TIPOS[p.tipo] || TIPOS.LECCION;
  const [pregunta, setPregunta] = useState(p.pregunta || '');
  const [respuesta, setRespuesta] = useState(p.respuesta || '');
  const pendiente = p.estado === 'PENDIENTE';

  return (
    <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: 2, p: 2, mb: 1.5, bgcolor: '#fff' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
        <Chip size="small" label={meta.label} sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 600 }} />
        <Chip size="small" variant="outlined" label={`${p.casos} ${p.casos === 1 ? 'chat' : 'chats'}`} />
        <Typography sx={{ fontWeight: 600, color: NAVY, fontSize: '0.95rem' }}>{p.titulo}</Typography>
      </Stack>

      <Typography sx={{ fontSize: '0.8rem', color: MUTED, mb: 1.5, whiteSpace: 'pre-wrap' }}>
        {p.evidencia}
      </Typography>

      {p.tipo === 'FAQ' && (
        <TextField
          label="Cuando pregunten…" size="small" fullWidth sx={{ mb: 1 }}
          value={pregunta} onChange={(e) => setPregunta(e.target.value)} disabled={!pendiente}
          inputProps={{ maxLength: 200 }}
        />
      )}
      <TextField
        label={p.tipo === 'FAQ' ? 'El bot contesta…' : p.tipo === 'LECCION' ? 'Lo que el bot va a hacer' : 'Qué corregir'}
        size="small" fullWidth multiline minRows={2}
        value={respuesta} onChange={(e) => setRespuesta(e.target.value)} disabled={!pendiente}
        inputProps={{ maxLength: p.tipo === 'FAQ' ? 1000 : 2000 }}
      />

      <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
        {pendiente && (
          <Button size="small" variant="contained" disabled={ocupado || !respuesta.trim()}
            onClick={() => onAprobar(p, { pregunta, respuesta })}
            sx={{ bgcolor: meta.color, '&:hover': { bgcolor: meta.color } }}>
            {meta.aprobar}
          </Button>
        )}
        {(pendiente || p.tipo === 'LECCION') && (
          <Button size="small" variant="outlined" color="inherit" disabled={ocupado} onClick={() => onDescartar(p)}>
            {pendiente ? 'Descartar' : 'Retirar lección'}
          </Button>
        )}
        {(p.conversationIds || []).slice(0, 4).map((id, i) => (
          <Button key={id} size="small" onClick={() => onVerChat(id)} sx={{ color: MUTED }}>
            Ver chat {i + 1}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}

export default function BotAprendizajeDialog({ open, onClose, onVerChat }) {
  const [datos, setDatos] = useState(null);
  const [tab, setTab] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true); setError(null);
    try {
      const r = await api.get('/api/wa/aprendizaje');
      if (r?.data?.success) setDatos(r.data.data);
      else setError(r?.data?.error || 'No se pudo cargar');
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { if (open) cargar(); }, [open, cargar]);

  const revisarAhora = async () => {
    setRevisando(true); setError(null);
    try {
      const r = await api.post('/api/wa/aprendizaje/revisar', {});
      if (!r?.data?.success) setError(r?.data?.error || 'La revisión falló');
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setRevisando(false);
    }
  };

  const aprobar = async (p, cambios) => {
    setOcupado(true); setError(null);
    try {
      const r = await api.post(`/api/wa/aprendizaje/${p.id}/aprobar`, cambios);
      if (!r?.data?.success) setError(r?.data?.error || 'No se pudo aprobar');
      await cargar();
    } finally { setOcupado(false); }
  };

  const descartar = async (p) => {
    setOcupado(true); setError(null);
    try {
      await api.post(`/api/wa/aprendizaje/${p.id}/descartar`, {});
      await cargar();
    } finally { setOcupado(false); }
  };

  const pendientes = datos?.pendientes || [];
  const aprobadas = datos?.aprobadas || [];
  const revisiones = (datos?.revisiones || []).filter((r) => r.metricas && r.metricas.chats !== undefined);
  const ultima = revisiones[0];
  const lista = tab === 0 ? pendientes : aprobadas;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ color: NAVY, fontWeight: 700 }}>
        🧠 Lo que el bot está aprendiendo
        <Typography sx={{ fontSize: '0.8rem', color: MUTED, mt: 0.5 }}>
          Cada madrugada se revisan los chats del día anterior: dónde dejó de contestar la gente y qué respondió el equipo cuando el bot no supo.
          Nada de esto le llega a un paciente hasta que lo apruebas.
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#fafafa' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {ultima?.metricas?.resumen && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>{fmtDia(ultima.dia)}:</strong> {ultima.metricas.resumen}
          </Alert>
        )}

        {revisiones.length > 0 && (
          <Box sx={{ mb: 2, overflowX: 'auto' }}>
            <Box component="table" sx={{ borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: 420, width: '100%' }}>
              <thead>
                <tr>
                  {['Día', 'Chats', 'Citas', 'Se fueron', 'Al primer mensaje'].map((h) => (
                    <Box component="th" key={h} sx={{ textAlign: 'left', color: MUTED, fontWeight: 600, p: 0.75, borderBottom: `1px solid ${BORDER}` }}>{h}</Box>
                  ))}
                </tr>
              </thead>
              <tbody>
                {revisiones.map((r) => (
                  <tr key={r.id}>
                    <Box component="td" sx={{ p: 0.75 }}>{fmtDia(r.dia)}</Box>
                    <Box component="td" sx={{ p: 0.75 }}>{r.metricas.chats}</Box>
                    <Box component="td" sx={{ p: 0.75, color: '#15803d', fontWeight: 600 }}>{r.metricas.citas}</Box>
                    <Box component="td" sx={{ p: 0.75 }}>{r.metricas.seFueron}</Box>
                    <Box component="td" sx={{ p: 0.75 }}>{r.metricas.seFueronAlPrimerMensaje}</Box>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        )}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label={`Por revisar (${pendientes.length})`} />
          <Tab label={`Aprobadas (${aprobadas.length})`} />
        </Tabs>

        {cargando && !datos ? (
          <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : lista.length === 0 ? (
          <Typography sx={{ color: MUTED, fontSize: '0.85rem', py: 3, textAlign: 'center' }}>
            {tab === 0
              ? 'No hay propuestas por revisar. La próxima revisión corre esta madrugada.'
              : 'Todavía no has aprobado nada.'}
          </Typography>
        ) : (
          lista.map((p) => (
            <Propuesta key={`${p.id}-${p.estado}`} p={p} ocupado={ocupado}
              onAprobar={aprobar} onDescartar={descartar}
              onVerChat={(id) => { onClose(); onVerChat?.(id); }} />
          ))
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Button onClick={revisarAhora} disabled={revisando}
          startIcon={revisando ? <CircularProgress size={14} /> : null}>
          {revisando ? 'Revisando los chats de ayer… (1 minuto)' : 'Revisar los chats de ayer ahora'}
        </Button>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
