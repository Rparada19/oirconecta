/**
 * Habla con tu asistente sin salir del portal.
 *
 * Usa el mismo system prompt, la misma educación y el mismo retrieval de
 * documentos que la conversación real de un paciente — si no, la prueba
 * mentiría. Lo que no hace: consumir cuota. Probar tu bot no debería costarte
 * conversaciones.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Typography, CircularProgress } from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { directoryApi } from '../../services/directoryAccountApi';
import { C, MONO, SERIF } from './iaConsole';

const SUGERENCIAS = [
  '¿Cuánto cuesta la valoración?',
  '¿Ustedes trabajan Widex?',
  'Es para mi mamá, no quiere audífonos',
  '¿Dónde quedan y a qué hora atienden?',
];

export default function AssistantChat({ agentName = 'tu asistente' }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  const enviar = async (contenido) => {
    const q = (contenido ?? text).trim();
    if (!q || loading) return;
    setError(null);
    setText('');
    const nuevos = [...msgs, { role: 'user', content: q }];
    setMsgs(nuevos);
    setLoading(true);
    try {
      const r = await directoryApi.post('/api/ia/me/agent-preview-chat', { messages: nuevos });
      const data = r?.data?.data;
      if (!r?.data?.success || !data) {
        setError(r?.error || r?.data?.error || 'No pude responder. Revisa que el asistente esté configurado.');
      } else {
        setMsgs((m) => [...m, {
          role: 'assistant', content: data.reply,
          docs: data.usedDocuments || 0, sim: !!data.simulated,
        }]);
      }
    } catch (e) {
      setError(e?.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.25, borderBottom: `1px solid ${C.line}` }}>
        <Box component="p" sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em',
                                 textTransform: 'uppercase', color: C.trace, m: 0, mb: 0.75 }}>
          Prueba en vivo
        </Box>
        <Typography sx={{ ...SERIF, fontWeight: 600, fontSize: { xs: '1.25rem', md: '1.5rem' },
                          color: C.bone, lineHeight: 1.15 }}>
          Habla con {agentName}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: C.mute, mt: 0.75, maxWidth: '58ch', lineHeight: 1.55 }}>
          Responde con todo lo que le has enseñado y consulta tu agenda real, igual que
          le respondería a un paciente en tu ficha. No consume saldo, y si llega a agendar
          lo hace en simulacro: no ocupa cupos.
        </Typography>
      </Box>

      <Box sx={{ px: { xs: 2, md: 3 }, py: 2.5 }}>
        <Box sx={{ minHeight: 180, maxHeight: 420, overflowY: 'auto', display: 'flex',
                   flexDirection: 'column', gap: 1.25, mb: 2 }}>
          {msgs.length === 0 && !loading && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignContent: 'flex-start' }}>
              {SUGERENCIAS.map((s) => (
                <Box key={s} component="button" type="button" onClick={() => enviar(s)}
                  sx={{ font: 'inherit', fontSize: '0.8125rem', color: C.mute, cursor: 'pointer',
                        bgcolor: 'transparent', border: `1px solid ${C.line}`, borderRadius: '999px',
                        px: 1.75, py: 0.75, transition: 'border-color .2s, color .2s',
                        '&:hover': { borderColor: C.signal, color: C.bone } }}>
                  {s}
                </Box>
              ))}
            </Box>
          )}

          {msgs.map((m, i) => (
            <Box key={i} sx={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '84%' }}>
              <Box sx={{
                px: 1.75, py: 1.25, borderRadius: '12px', fontSize: '0.9rem', lineHeight: 1.55,
                whiteSpace: 'pre-wrap', color: C.bone,
                bgcolor: m.role === 'user' ? 'rgba(124,92,255,0.14)' : C.ink3,
                border: `1px solid ${m.role === 'user' ? 'rgba(124,92,255,0.3)' : C.line}`,
                borderBottomRightRadius: m.role === 'user' ? '3px' : '12px',
                borderBottomLeftRadius: m.role === 'user' ? '12px' : '3px',
              }}>
                {m.content}
              </Box>
              {m.role === 'assistant' && m.sim && (
                <Box component="span" sx={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em',
                                            color: C.warn, textTransform: 'uppercase', mt: 0.5, display: 'block' }}>
                  Agendó en modo prueba · no se ocupó ningún cupo real
                </Box>
              )}
              {m.role === 'assistant' && m.docs > 0 && (
                <Box component="span" sx={{ fontFamily: MONO, fontSize: 9, letterSpacing: '0.14em',
                                            color: C.trace, textTransform: 'uppercase', mt: 0.5, display: 'block' }}>
                  Usó {m.docs} pasaje{m.docs === 1 ? '' : 's'} de tus documentos
                </Box>
              )}
            </Box>
          ))}

          {loading && (
            <Box sx={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 1,
                       fontFamily: MONO, fontSize: 11, color: C.dim }}>
              <CircularProgress size={12} sx={{ color: C.trace }} /> pensando…
            </Box>
          )}
          <div ref={endRef} />
        </Box>

        {error && (
          <Typography sx={{ fontSize: '0.8rem', color: C.danger, mb: 1 }}>{error}</Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth size="small" multiline maxRows={4}
            placeholder="Escríbele como lo haría un paciente…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
            }}
          />
          <IconButton onClick={() => enviar()} disabled={loading || !text.trim()}
            aria-label="Enviar"
            sx={{ bgcolor: C.signal, color: '#fff', borderRadius: '10px',
                  '&:hover': { bgcolor: C.signal, filter: 'brightness(1.1)' },
                  '&.Mui-disabled': { bgcolor: C.line, color: C.dim } }}>
            <SendRoundedIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
