/**
 * T2-Gap4 — Landing pública /invita/:code.
 * Un amigo compartió su código único; mostramos su nombre + CTA a explorar
 * el directorio con contexto. El código se guarda en sessionStorage para
 * que si el usuario agenda, quede vinculado al referrer.
 */

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Button, CircularProgress, Alert } from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { request } from '../services/apiClient';

const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' };
const NAVY = '#0F2A4A';
const ACCENT = '#6d28d9';
const MUTED = '#64748b';
const BORDER = '#eef0f3';

const REFERRAL_STORAGE_KEY = 'oc_referred_by_code';

export default function InvitaPage() {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;
    request(`/api/referrals/by-code/${code}`, { method: 'GET', skipAuth: true })
      .then(({ data: res, error: err }) => {
        if (err) setError(err);
        else if (res?.data) {
          setData(res.data);
          try { sessionStorage.setItem(REFERRAL_STORAGE_KEY, res.data.code); } catch {}
        }
        setLoading(false);
      });
  }, [code]);

  if (loading) {
    return (
      <>
        <Header />
        <Box sx={{ py: 12, textAlign: 'center' }}>
          <CircularProgress sx={{ color: ACCENT }} />
        </Box>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header />
        <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
          <Typography sx={{ ...SERIF, fontSize: '1.75rem', color: NAVY, mb: 1.5 }}>
            Enlace no válido
          </Typography>
          <Typography sx={{ color: MUTED, mb: 3 }}>
            El código de invitación no existe o expiró. Puedes explorar OírConecta desde el sitio principal.
          </Typography>
          <Button variant="outlined" component={RouterLink} to="/directorio"
            sx={{ borderColor: NAVY, color: NAVY, textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}>
            Ir al directorio
          </Button>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet><title>Una invitación para ti · OírConecta</title></Helmet>
      <Header />
      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 }, textAlign: 'center' }}>
        <Box sx={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#faf5ff', color: ACCENT,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <FavoriteRoundedIcon sx={{ fontSize: 36 }} />
        </Box>

        <Typography sx={{
          fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.16em',
          color: MUTED, textTransform: 'uppercase', mb: 1,
        }}>
          Una invitación
        </Typography>

        <Typography sx={{
          ...SERIF, fontWeight: 600, color: NAVY,
          fontSize: { xs: '2rem', md: '2.6rem' }, lineHeight: 1.05, mb: 2,
        }}>
          {data.referrerFirstName ? `${data.referrerFirstName} pensó en ti` : 'Alguien pensó en ti'}
        </Typography>

        <Typography sx={{
          fontSize: '1.05rem', color: '#334155', lineHeight: 1.6, mb: 4, maxWidth: 480, mx: 'auto',
        }}>
          {data.referrerFirstName ? `${data.referrerFirstName} confió` : 'Alguien confió'} en OírConecta para cuidar su audición y quiere que tú también encuentres al profesional adecuado.
        </Typography>

        <Box sx={{
          bgcolor: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px',
          p: { xs: 3, md: 4 }, mb: 4, textAlign: 'left',
        }}>
          <Typography sx={{
            fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.14em',
            color: MUTED, textTransform: 'uppercase', mb: 2,
          }}>
            Cómo funciona
          </Typography>
          {[
            'Explora profesionales verificados en tu ciudad',
            'Compara precios reales y horarios disponibles',
            'Agenda tu valoración auditiva en 2 minutos',
            `Cuando completes tu primera cita, ${data.referrerFirstName || 'la persona que te invitó'} recibirá una notificación de agradecimiento`,
          ].map((step, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'flex-start' }}>
              <Box sx={{
                width: 24, height: 24, borderRadius: '50%',
                bgcolor: '#faf5ff', color: ACCENT,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
              }}>{i + 1}</Box>
              <Typography sx={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>{step}</Typography>
            </Box>
          ))}
        </Box>

        <Button
          component={RouterLink}
          to="/directorio"
          variant="contained"
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{
            background: NAVY, color: '#fff',
            textTransform: 'none', fontWeight: 700, fontSize: '1rem',
            px: 4, py: 1.5, borderRadius: '12px',
            '&:hover': { background: NAVY, filter: 'brightness(0.92)' },
          }}
        >
          Explorar profesionales
        </Button>

        <Typography sx={{ fontSize: '0.75rem', color: MUTED, mt: 3 }}>
          Enlace único · Código {data.code}
        </Typography>
      </Container>
      <Footer />
    </>
  );
}
