/**
 * C8.1 — Cancelar cita desde link email.
 *
 * Sirve tanto para retail como para citas del directorio (multi-tenant).
 *  GET  /api/appointments/reschedule/:token       → info previa (comparte endpoint)
 *  POST /api/appointments/cancel/:token           → { reason? } → cancela + notifica al profesional
 */

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = import.meta.env.VITE_API_URL || '';

export default function CancelAppointmentPage() {
  const [params] = useSearchParams();
  const token = params.get('token');

  const [pageStatus, setPageStatus] = useState('loading'); // loading | ready | error | success
  const [appt, setAppt] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    if (!token) { setPageStatus('error'); setErrMsg('Token no válido.'); return; }
    fetch(`${API}/api/appointments/reschedule/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          if (d.data?.estado === 'CANCELLED') {
            setPageStatus('error');
            setErrMsg('Esta cita ya estaba cancelada.');
            return;
          }
          setAppt(d.data);
          setPageStatus('ready');
        } else {
          setPageStatus('error');
          setErrMsg(d.error || 'Enlace inválido o expirado.');
        }
      })
      .catch(() => { setPageStatus('error'); setErrMsg('Error de red.'); });
  }, [token]);

  const handleSubmit = () => {
    setSubmitting(true);
    fetch(`${API}/api/appointments/cancel/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason.trim() || null }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) setPageStatus('success');
        else { setErrMsg(d.error || 'No se pudo cancelar.'); setSubmitting(false); }
      })
      .catch(() => { setErrMsg('Error de red.'); setSubmitting(false); });
  };

  const fechaShort = appt?.fecha ? String(appt.fecha).slice(0, 10) : '';

  return (
    <>
      <Helmet>
        <title>Cancelar cita | OírConecta</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Header />
      <Box sx={{
        minHeight: '80vh',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(220,38,38,0.06) 0%, transparent 70%), #0a1628',
        py: 8, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Box sx={{ width: '100%', maxWidth: 560 }}>

          {pageStatus === 'loading' && (
            <Box sx={{ textAlign: 'center' }}><CircularProgress size={48} sx={{ color: '#6ee7c8' }} /></Box>
          )}

          {pageStatus === 'error' && (
            <Box sx={{ textAlign: 'center' }}>
              <ErrorOutlineIcon sx={{ fontSize: 72, color: '#f87171', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>No se pudo procesar</Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>{errMsg}</Typography>
              <Button variant="outlined" component={RouterLink} to="/"
                sx={{ borderColor: '#6ee7c8', color: '#6ee7c8', borderRadius: 2 }}>
                Ir al inicio
              </Button>
            </Box>
          )}

          {pageStatus === 'success' && (
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 72, color: '#6ee7c8', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Cita cancelada</Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                Tu cita del <strong>{fechaShort}</strong> a las <strong>{appt?.hora}</strong>{appt?.professionalName ? <> con <strong>{appt.professionalName}</strong></> : null} quedó cancelada.
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3, fontSize: 14 }}>
                {appt?.professionalName || 'El profesional'} recibió la notificación y se pondrá en contacto contigo si es necesario.
              </Typography>
              <Button variant="contained" component={RouterLink} to={appt?.directoryProfileId ? `/directorio/profesional/${appt.directoryProfileId}` : '/'}
                sx={{ background: 'linear-gradient(135deg,#6ee7c8,#34d399)', color: '#0a1628', fontWeight: 700, borderRadius: 2, mr: 1 }}>
                {appt?.directoryProfileId ? 'Volver al perfil' : 'Ir al inicio'}
              </Button>
              {appt?.directoryProfileId && (
                <Button variant="outlined" component={RouterLink} to={`/agendar/reagendar?token=${token}`}
                  sx={{ borderColor: '#6ee7c8', color: '#6ee7c8', borderRadius: 2 }}
                  disabled>
                  {/* Ya cancelada; solo referencia */}
                  Reagendar
                </Button>
              )}
            </Box>
          )}

          {pageStatus === 'ready' && (
            <>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <EventBusyIcon sx={{ fontSize: 56, color: '#f87171', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 800 }}>Cancelar cita</Typography>
              </Box>

              {appt && (
                <Box sx={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 3, p: 2.5, mb: 3,
                }}>
                  <Typography sx={{ fontSize: 13, color: 'text.disabled', textTransform: 'uppercase', fontWeight: 700, mb: 1 }}>
                    Tu cita actual
                  </Typography>
                  <Typography sx={{ fontSize: 16 }}>
                    <strong>{fechaShort}</strong> a las <strong>{appt.hora}</strong>
                  </Typography>
                  {appt.professionalName && (
                    <Typography color="text.secondary" sx={{ fontSize: 14, mt: 0.5 }}>
                      con <strong>{appt.professionalName}</strong>{appt.tipoConsulta ? ` · ${appt.tipoConsulta}` : ''}
                    </Typography>
                  )}
                </Box>
              )}

              <Typography color="text.secondary" sx={{ fontSize: 14, mb: 2 }}>
                Antes de cancelar, considera <strong>reagendar</strong> a otra fecha. Si prefieres cancelar,
                cuéntanos brevemente el motivo (opcional). {appt?.professionalName ? `${appt.professionalName} lo verá para contactarte.` : ''}
              </Typography>

              <TextField
                fullWidth multiline minRows={3}
                label="Motivo (opcional)"
                placeholder="Ej: se me presentó un imprevisto, cambio de fechas de viaje, etc."
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 2,
                    color: 'text.primary',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(110,231,200,0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#6ee7c8' },
                  },
                  '& .MuiInputLabel-root': { color: 'text.disabled' },
                }}
              />

              {errMsg && (
                <Typography sx={{ color: '#f87171', mb: 2, fontSize: 14 }}>{errMsg}</Typography>
              )}

              <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  fullWidth
                  component={RouterLink} to={`/agendar/reagendar?token=${token}`}
                  sx={{
                    py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: 15,
                    background: 'linear-gradient(135deg,#6ee7c8,#34d399)',
                    color: '#0a1628',
                  }}>
                  Mejor reagendar
                </Button>
                <Button
                  fullWidth disabled={submitting}
                  onClick={handleSubmit}
                  sx={{
                    py: 1.5, borderRadius: 2, fontWeight: 700, fontSize: 15,
                    background: 'transparent',
                    color: '#f87171',
                    border: '1.5px solid #f87171',
                    '&:hover': { background: 'rgba(248,113,113,0.08)' },
                  }}>
                  {submitting ? <CircularProgress size={20} sx={{ color: '#f87171' }} /> : 'Confirmar cancelación'}
                </Button>
              </Box>
            </>
          )}

        </Box>
      </Box>
      <Footer />
    </>
  );
}
