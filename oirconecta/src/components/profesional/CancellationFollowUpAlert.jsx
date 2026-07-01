/**
 * C8.1 — Alerta al profesional con lista de pacientes que cancelaron
 * su cita por link y todavía no han sido contactados.
 *
 * Consume:
 *   GET  /api/professional-agenda/me/cancellations-pending
 *   POST /api/professional-agenda/me/appointments/:id/follow-up  { notes? }
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, Typography, Button, IconButton, Stack, Chip, TextField,
  Collapse, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip,
} from '@mui/material';
import {
  ErrorOutlineOutlined, ExpandLessOutlined, ExpandMoreOutlined,
  PhoneOutlined, WhatsApp, CheckCircleOutlined,
} from '@mui/icons-material';
import { directoryApi } from '../../services/directoryAccountApi';

const RED = '#dc2626';
const RED_BG = '#fef2f2';
const NAVY = '#0F2A4A';

function phoneTelHref(phone) {
  const clean = String(phone || '').replace(/\D+/g, '');
  if (!clean) return null;
  const withCountry = clean.startsWith('57') ? clean : `57${clean}`;
  return `tel:+${withCountry}`;
}
function phoneWaHref(phone) {
  const clean = String(phone || '').replace(/\D+/g, '');
  if (!clean) return null;
  const withCountry = clean.startsWith('57') ? clean : `57${clean}`;
  return `https://wa.me/${withCountry}`;
}
function fmtDT(iso) {
  try {
    return new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });
  } catch { return iso; }
}

export default function CancellationFollowUpAlert() {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [followUp, setFollowUp] = useState(null); // { id, patientName }
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await directoryApi.get('/api/professional-agenda/me/cancellations-pending');
    if (r.data?.data) {
      setItems(r.data.data.items || []);
      setCount(r.data.data.count || 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openFollowUp = (item) => {
    setFollowUp(item);
    setNotes('');
  };

  const submitFollowUp = async () => {
    if (!followUp) return;
    setSaving(true);
    const r = await directoryApi.post(`/api/professional-agenda/me/appointments/${followUp.id}/follow-up`, {
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (r.error) return;
    setFollowUp(null);
    load();
  };

  if (loading || count === 0) return null; // sin alertas, no mostramos nada

  return (
    <>
      <Card sx={{
        mt: 2, mb: 2, borderRadius: '12px',
        border: `1.5px solid ${RED}`,
        bgcolor: RED_BG,
        overflow: 'hidden',
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between"
          sx={{ px: 2, py: 1.25, cursor: 'pointer' }}
          onClick={() => setExpanded((v) => !v)}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ErrorOutlineOutlined sx={{ color: RED, fontSize: 22 }} />
            <Box>
              <Typography sx={{ fontWeight: 800, color: RED, fontSize: '0.95rem' }}>
                {count === 1 ? '1 paciente canceló su cita' : `${count} pacientes cancelaron su cita`}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#7f1d1d' }}>
                Llámalos o escríbeles para saber qué pasó y ofrecerles reagendar.
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" sx={{ color: RED }}>
            {expanded ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
          </IconButton>
        </Stack>

        <Collapse in={expanded}>
          <Box sx={{ borderTop: `1px solid ${RED}33`, bgcolor: '#fff' }}>
            {items.map((it) => {
              const tel = phoneTelHref(it.patientPhone);
              const wa  = phoneWaHref(it.patientPhone);
              return (
                <Box key={it.id} sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9',
                  '&:last-child': { borderBottom: 'none' } }}>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} justifyContent="space-between">
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: NAVY }}>
                        {it.patientName || 'Paciente'}
                        {it.tipoConsulta && (
                          <Chip size="small" label={it.tipoConsulta}
                            sx={{ ml: 1, height: 20, fontSize: '0.65rem', bgcolor: '#f1f5f9' }} />
                        )}
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mt: 0.25 }}>
                        Cita original: <strong>{fmtDate(it.fecha)}</strong> a las <strong>{it.hora}</strong> · Canceló {fmtDT(it.cancelledByPatientAt)}
                      </Typography>
                      {it.cancelReason && (
                        <Typography sx={{ fontSize: '0.8rem', color: '#374151', mt: 0.5,
                          bgcolor: '#f9fafb', borderLeft: '3px solid #cbd5e1', pl: 1, py: 0.5, borderRadius: '0 4px 4px 0' }}>
                          <em>"{it.cancelReason}"</em>
                        </Typography>
                      )}
                      {!it.cancelReason && (
                        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mt: 0.5, fontStyle: 'italic' }}>
                          No dio motivo.
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
                      {tel && (
                        <Tooltip title={`Llamar a ${it.patientPhone}`}>
                          <Button size="small" href={tel} startIcon={<PhoneOutlined />}
                            variant="contained"
                            sx={{ bgcolor: RED, textTransform: 'none', fontWeight: 700, borderRadius: '8px',
                              '&:hover': { bgcolor: RED, filter: 'brightness(0.9)' } }}>
                            Llamar
                          </Button>
                        </Tooltip>
                      )}
                      {wa && (
                        <Tooltip title="WhatsApp">
                          <Button size="small" href={wa} target="_blank" rel="noopener" startIcon={<WhatsApp />}
                            variant="outlined"
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px',
                              color: '#16a34a', borderColor: '#16a34a' }}>
                            WhatsApp
                          </Button>
                        </Tooltip>
                      )}
                      <Tooltip title="Marcar como contactado">
                        <IconButton size="small" onClick={() => openFollowUp(it)}
                          sx={{ color: '#15803d' }}>
                          <CheckCircleOutlined />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Collapse>
      </Card>

      <Dialog open={!!followUp} onClose={() => setFollowUp(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>
          Marcar como contactado
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ mb: 2, color: '#475569' }}>
            Confirmas que ya contactaste a <strong>{followUp?.patientName}</strong>.
            La alerta desaparecerá de tu portal.
          </Typography>
          <TextField fullWidth multiline minRows={3} label="Notas (opcional)"
            placeholder="Ej: le llamé, quiere reagendar la próxima semana"
            value={notes} onChange={(e) => setNotes(e.target.value.slice(0, 1000))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFollowUp(null)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" onClick={submitFollowUp} disabled={saving}
            sx={{ background: '#15803d', textTransform: 'none', fontWeight: 700,
              '&:hover': { background: '#15803d', filter: 'brightness(0.95)' } }}>
            {saving ? 'Guardando…' : 'Confirmar contactado'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
