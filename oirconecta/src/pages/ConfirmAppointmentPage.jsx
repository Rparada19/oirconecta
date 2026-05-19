import React, { useEffect, useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Header from '../components/Header';
import Footer from '../components/Footer';

const API = import.meta.env.VITE_API_URL || '';

export default function ConfirmAppointmentPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMsg('Token no válido.'); return; }
    fetch(`${API}/api/appointments/confirm/${token}`, { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d.success) setStatus('success');
        else { setStatus('error'); setMsg(d.error || 'No se pudo confirmar la cita.'); }
      })
      .catch(() => { setStatus('error'); setMsg('Error de red. Intenta de nuevo.'); });
  }, [token]);

  return (
    <>
      <Header />
      <Box sx={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 480 }}>
          {status === 'loading' && <CircularProgress size={48} sx={{ color: '#6ee7c8' }} />}

          {status === 'success' && (
            <>
              <CheckCircleOutlineIcon sx={{ fontSize: 72, color: '#6ee7c8', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                ¡Cita confirmada!
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Gracias por confirmar. Te esperamos puntualmente en nuestro consultorio.
              </Typography>
              <Button variant="contained" component={RouterLink} to="/"
                sx={{ background: 'linear-gradient(135deg,#6ee7c8,#34d399)', color: '#0a1628', fontWeight: 700, borderRadius: 2 }}>
                Ir al inicio
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <ErrorOutlineIcon sx={{ fontSize: 72, color: '#f87171', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                No pudimos confirmar
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {msg || 'El enlace puede haber expirado o ya fue usado.'}
              </Typography>
              <Button variant="outlined" component={RouterLink} to="/agendar"
                sx={{ borderColor: '#6ee7c8', color: '#6ee7c8', borderRadius: 2 }}>
                Agendar nueva cita
              </Button>
            </>
          )}
        </Box>
      </Box>
      <Footer />
    </>
  );
}
