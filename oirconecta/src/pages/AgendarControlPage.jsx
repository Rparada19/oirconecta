/**
 * F8b — Página pública para que el paciente agende su control de adaptación
 * con 1 click desde el link mágico del email/WhatsApp.
 *
 * URL: /agendar-control/:token
 * El token identifica el PatientFollowUp — no requiere login.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  Box, Container, Typography, Button, CircularProgress, Alert,
  TextField, MenuItem, Chip, Stack,
} from '@mui/material';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const API = getApiBaseUrl().replace(/\/$/, '');
const NAVY = '#0F2A4A';
const ACCENT = '#6d28d9';
const MUTED = '#64748b';
const BORDER = '#eef0f3';
const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' };

// Días útiles dentro de los próximos 14 días (excluye domingos)
function nextBusinessDays(n = 14) {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 1; out.length < n && i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 0) continue; // omitir domingo
    out.push(d);
  }
  return out;
}

function fmtDate(d) {
  return d.toLocaleDateString('es-CO', {
    weekday: 'short', day: '2-digit', month: 'short',
  });
}

function isoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function AgendarControlPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notas, setNotas] = useState('');
  const [confirmation, setConfirmation] = useState(null);

  const days = useMemo(() => nextBusinessDays(14), []);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/follow-ups/by-token/${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json?.success) {
          setError(json?.error || 'Enlace no válido');
        } else {
          setInfo(json.data);
        }
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [token]);

  useEffect(() => {
    if (!selectedDate) { setSlots([]); return; }
    setSlotsLoading(true);
    fetch(`${API}/api/appointments/available-slots?fecha=${selectedDate}`)
      .then((r) => r.json())
      .then((json) => {
        const list = json?.data?.slots || json?.slots || json?.data || [];
        // El endpoint puede devolver strings HH:MM o objetos {time,available}
        const normalized = list.map((s) => (typeof s === 'string' ? { time: s, available: true } : s))
          .filter((s) => s.available !== false);
        setSlots(normalized);
        setSlotsLoading(false);
      })
      .catch(() => { setSlots([]); setSlotsLoading(false); });
  }, [selectedDate]);

  const canConfirm = selectedDate && selectedTime && !submitting;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`${API}/api/follow-ups/by-token/${token}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: selectedDate,
          hora: selectedTime,
          notas: notas || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.code === 'SLOT_TAKEN') {
          setError('Ese horario acaba de ocuparse. Elige otro.');
          setSelectedTime(null);
          // Recarga slots
          const rr = await fetch(`${API}/api/appointments/available-slots?fecha=${selectedDate}`).then((r) => r.json());
          const list = rr?.data?.slots || rr?.slots || rr?.data || [];
          setSlots(list.map((s) => (typeof s === 'string' ? { time: s, available: true } : s)).filter((s) => s.available !== false));
        } else if (json.code === 'ALREADY_SCHEDULED') {
          setError('Este control ya está agendado. Si necesitas cambiarlo, contáctanos.');
        } else {
          setError(json.error || `Error ${res.status}`);
        }
        return;
      }
      setConfirmation(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <Box sx={{ py: 12, textAlign: 'center' }}><CircularProgress sx={{ color: ACCENT }} /></Box>
        <Footer />
      </>
    );
  }

  if (error && !info) {
    return (
      <>
        <Header />
        <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
          <Typography sx={{ ...SERIF, fontSize: '1.75rem', color: NAVY, mb: 1.5 }}>Enlace no válido</Typography>
          <Typography sx={{ color: MUTED, mb: 3 }}>{error}</Typography>
          <Button component={RouterLink} to="/" variant="outlined"
            sx={{ borderColor: NAVY, color: NAVY, textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}>
            Ir al sitio
          </Button>
        </Container>
        <Footer />
      </>
    );
  }

  if (info?.alreadyScheduled) {
    return (
      <>
        <Header />
        <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
          <CheckCircleOutlineRoundedIcon sx={{ fontSize: 64, color: '#15803d', mb: 2 }} />
          <Typography sx={{ ...SERIF, fontSize: '1.75rem', color: NAVY, mb: 1.5 }}>
            Este control ya está agendado
          </Typography>
          <Typography sx={{ color: MUTED, mb: 3 }}>
            Si necesitas cambiar la fecha o cancelar, contáctanos y con gusto te ayudamos.
          </Typography>
        </Container>
        <Footer />
      </>
    );
  }

  if (confirmation) {
    return (
      <>
        <Helmet><title>Control agendado · OírConecta</title></Helmet>
        <Header />
        <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
          <CheckCircleOutlineRoundedIcon sx={{ fontSize: 72, color: '#15803d', mb: 2 }} />
          <Typography sx={{ ...SERIF, fontSize: '2rem', color: NAVY, mb: 1.5 }}>¡Listo, {info.patient.nombre.split(' ')[0]}!</Typography>
          <Typography sx={{ color: '#334155', fontSize: '1.05rem', mb: 3 }}>
            Tu <strong>{info.stepLabel}</strong> quedó agendado para el
            <br/>
            <strong style={{ color: NAVY }}>{selectedDate} a las {selectedTime}</strong>
          </Typography>
          <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', p: 3, textAlign: 'left', mb: 3 }}>
            <Typography sx={{ fontSize: '0.9rem', color: '#166534', fontWeight: 600, mb: 1 }}>Te enviamos un correo con la confirmación.</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
              Un día antes te recordaremos por email. Si necesitas reagendar,
              usa el link que viene en el correo de confirmación.
            </Typography>
          </Box>
          <Button component={RouterLink} to="/" variant="outlined"
            sx={{ borderColor: NAVY, color: NAVY, textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}>
            Ir al sitio
          </Button>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet><title>Agendar {info?.stepLabel || 'control'} · OírConecta</title></Helmet>
      <Header />
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Encabezado */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '50%',
            bgcolor: '#faf5ff', color: ACCENT,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            mb: 2,
          }}>
            <EventAvailableRoundedIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography sx={{
            fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.16em',
            color: MUTED, textTransform: 'uppercase', mb: 1,
          }}>
            {info?.stepLabel}
          </Typography>
          <Typography sx={{ ...SERIF, fontWeight: 600, color: NAVY, fontSize: { xs: '1.75rem', md: '2.25rem' }, lineHeight: 1.1, mb: 1.5 }}>
            Hola {info?.patient?.nombre?.split(' ')[0]}, agenda tu control
          </Typography>
          <Typography sx={{ fontSize: '1rem', color: '#334155', maxWidth: 500, mx: 'auto', lineHeight: 1.6 }}>
            Elige el día y la hora que mejor te queden. Toma menos de 1 minuto y te llegará la confirmación al correo.
          </Typography>
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: '10px' }}>{error}</Alert>
        )}

        {/* Paso 1: Fecha */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', mb: 1.5 }}>
            1 · Elige una fecha
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mx: -0.5, px: 0.5 }}>
            {days.map((d) => {
              const iso = isoDate(d);
              const selected = selectedDate === iso;
              return (
                <Box key={iso}
                  onClick={() => { setSelectedDate(iso); setSelectedTime(null); }}
                  sx={{
                    flexShrink: 0, cursor: 'pointer', minWidth: 100,
                    px: 2, py: 1.5, borderRadius: '12px', textAlign: 'center',
                    border: `1px solid ${selected ? ACCENT : BORDER}`,
                    bgcolor: selected ? '#faf5ff' : '#fff',
                    color: selected ? ACCENT : NAVY,
                    transition: 'all 0.15s ease',
                    '&:hover': { borderColor: selected ? ACCENT : '#cbd5e1' },
                  }}
                >
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {fmtDate(d).split(' ')[0]}
                  </Typography>
                  <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1, my: 0.25 }}>
                    {d.getDate()}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: selected ? ACCENT : MUTED, textTransform: 'uppercase', fontWeight: 600 }}>
                    {d.toLocaleDateString('es-CO', { month: 'short' })}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Paso 2: Hora */}
        {selectedDate && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', mb: 1.5 }}>
              2 · Elige una hora
            </Typography>
            {slotsLoading ? (
              <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress size={28} sx={{ color: ACCENT }} /></Box>
            ) : slots.length === 0 ? (
              <Typography sx={{ color: MUTED, fontStyle: 'italic', py: 2 }}>
                No hay horarios disponibles para esta fecha. Elige otro día.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {slots.map((s) => (
                  <Chip
                    key={s.time}
                    label={s.time}
                    clickable
                    onClick={() => setSelectedTime(s.time)}
                    sx={{
                      px: 1.5, py: 2.25, fontSize: '0.95rem', fontWeight: 700,
                      borderRadius: '10px',
                      bgcolor: selectedTime === s.time ? ACCENT : '#fff',
                      color: selectedTime === s.time ? '#fff' : NAVY,
                      border: `1px solid ${selectedTime === s.time ? ACCENT : BORDER}`,
                      '&:hover': { bgcolor: selectedTime === s.time ? ACCENT : '#faf5ff' },
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Paso 3: Notas + confirmar */}
        {selectedDate && selectedTime && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.14em', color: MUTED, textTransform: 'uppercase', mb: 1.5 }}>
              3 · Confirmar (opcional)
            </Typography>
            <TextField
              fullWidth multiline rows={2}
              placeholder="¿Algún tema que quieras discutir en el control? (opcional)"
              value={notas} onChange={(e) => setNotas(e.target.value)}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained" size="large"
                endIcon={<ArrowForwardRoundedIcon />}
                disabled={!canConfirm}
                onClick={handleConfirm}
                sx={{
                  background: NAVY, color: '#fff',
                  textTransform: 'none', fontWeight: 700,
                  px: 4, py: 1.5, borderRadius: '10px',
                  '&:hover': { background: NAVY, filter: 'brightness(0.92)' },
                }}
              >
                {submitting ? 'Agendando…' : `Confirmar cita — ${selectedDate} ${selectedTime}`}
              </Button>
            </Stack>
          </Box>
        )}
      </Container>
      <Footer />
    </>
  );
}
