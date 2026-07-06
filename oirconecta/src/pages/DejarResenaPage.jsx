/**
 * F6 — Página pública para dejar una reseña usando el token único
 * enviado por email después de una cita completada.
 *
 * Rutas backend:
 *   GET  /api/directory/reviews/by-token/:token   → contexto de la cita
 *   POST /api/directory/reviews/by-token/:token   → enviar reseña
 */

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Typography, Stack, Button, TextField, IconButton,
  CircularProgress, Alert,
} from '@mui/material';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { request } from '../services/apiClient';

const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' };
const NAVY = '#0F2A4A';
const ACCENT = '#6d28d9';
const MUTED = '#64748b';
const BORDER = '#eef0f3';
const AMBER = '#f59e0b';

function StarRating({ value, onChange, size = 44 }) {
  const [hover, setHover] = useState(0);
  return (
    <Stack direction="row" spacing={0.5} justifyContent="center">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n;
        return (
          <IconButton
            key={n}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            sx={{ p: 0.5 }}
          >
            <StarRoundedIcon sx={{
              fontSize: size,
              color: filled ? AMBER : '#e5e7eb',
              transition: 'color 120ms ease',
            }} />
          </IconButton>
        );
      })}
    </Stack>
  );
}

export default function DejarResenaPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [ctx, setCtx] = useState(null);
  const [error, setError] = useState('');

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return;
    request(`/api/directory/reviews/by-token/${token}`, { method: 'GET', skipAuth: true })
      .then(({ data, error: err }) => {
        if (err) setError(err);
        else if (data?.data) {
          setCtx(data.data);
          if (data.data.alreadySubmitted) setSubmitted(true);
        }
        setLoading(false);
      });
  }, [token]);

  const submit = async () => {
    if (rating < 1) return setError('Selecciona una calificación de 1 a 5 estrellas.');
    setSubmitting(true); setError('');
    const { error: err } = await request(`/api/directory/reviews/by-token/${token}`, {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ rating, comment: comment.trim() || null }),
    });
    setSubmitting(false);
    if (err) return setError(err);
    setSubmitted(true);
  };

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

  if (!ctx) {
    return (
      <>
        <Header />
        <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
          <Typography sx={{ ...SERIF, fontSize: '1.75rem', color: NAVY, mb: 1.5 }}>
            Link inválido o expirado
          </Typography>
          <Typography sx={{ color: MUTED, mb: 3 }}>
            El enlace para dejar reseña ya no está disponible. Si crees que es un error, contáctanos.
          </Typography>
          <Button variant="outlined" component={RouterLink} to="/"
            sx={{ borderColor: NAVY, color: NAVY, textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}>
            Volver al inicio
          </Button>
        </Container>
        <Footer />
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <Helmet><title>¡Gracias por tu reseña! · OírConecta</title></Helmet>
        <Header />
        <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}>
          <CheckCircleRoundedIcon sx={{ fontSize: 72, color: '#15803d', mb: 2 }} />
          <Typography sx={{ ...SERIF, fontWeight: 600, color: NAVY, fontSize: { xs: '2rem', md: '2.4rem' }, lineHeight: 1.1, mb: 1.5 }}>
            ¡Gracias por tu reseña!
          </Typography>
          <Typography sx={{ fontSize: '1rem', color: MUTED, lineHeight: 1.6, mb: 4 }}>
            Tu opinión ayuda a otros pacientes a decidir. En breve aparecerá en la ficha de {ctx.professionalName}.
          </Typography>
          {ctx.profileId && (
            <Button
              component={RouterLink}
              to={`/directorio/profesional/${ctx.profileId}`}
              variant="contained"
              sx={{
                background: NAVY, color: '#fff',
                textTransform: 'none', fontWeight: 700, fontSize: '0.95rem',
                px: 3.5, py: 1.25, borderRadius: '12px',
                '&:hover': { background: NAVY, filter: 'brightness(0.92)' },
              }}
            >
              Ver ficha de {ctx.professionalName?.split(' ')[0] || 'la profesional'}
            </Button>
          )}
        </Container>
        <Footer />
      </>
    );
  }

  const firstName = ctx.patientName?.split(' ')[0] || '';
  const fechaFmt = ctx.fecha
    ? new Date(ctx.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <>
      <Helmet><title>Deja tu reseña · OírConecta</title></Helmet>
      <Header />
      <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          {ctx.fotoPerfilUrl ? (
            <Box sx={{
              width: 88, height: 88, borderRadius: '50%',
              backgroundImage: `url(${ctx.fotoPerfilUrl})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              margin: '0 auto 20px', border: `3px solid ${BORDER}`,
            }} />
          ) : (
            <Box sx={{
              width: 88, height: 88, borderRadius: '50%',
              background: `linear-gradient(135deg, ${ACCENT}, #a855f7)`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              ...SERIF, fontSize: '2rem', fontWeight: 500,
            }}>
              {ctx.professionalName?.[0] || 'P'}
            </Box>
          )}
          <Typography sx={{
            fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.16em',
            color: MUTED, textTransform: 'uppercase', mb: 1,
          }}>
            Deja tu reseña
          </Typography>
          <Typography sx={{
            ...SERIF, fontWeight: 600, color: NAVY,
            fontSize: { xs: '1.9rem', md: '2.3rem' }, lineHeight: 1.1, mb: 1.5,
          }}>
            ¿Cómo fue tu consulta con {ctx.professionalName || 'el profesional'}?
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', color: MUTED }}>
            Hola{firstName ? ` ${firstName}` : ''}, tu opinión sobre {ctx.tipoConsulta ? `tu ${ctx.tipoConsulta.toLowerCase()}` : 'tu consulta'}
            {fechaFmt ? ` del ${fechaFmt}` : ''} ayuda a otros pacientes.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box sx={{
          bgcolor: '#fff', border: `1px solid ${BORDER}`, borderRadius: '16px',
          p: { xs: 3, md: 4 },
        }}>
          <Typography sx={{
            fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.14em',
            color: MUTED, textTransform: 'uppercase', mb: 2, textAlign: 'center',
          }}>
            Tu calificación general
          </Typography>
          <StarRating value={rating} onChange={setRating} />
          <Typography sx={{ textAlign: 'center', mt: 1, fontSize: '0.9rem', color: rating > 0 ? NAVY : MUTED, fontWeight: 600 }}>
            {rating === 0 ? 'Toca una estrella' :
             rating === 1 ? 'Muy mala' :
             rating === 2 ? 'Mala' :
             rating === 3 ? 'Regular' :
             rating === 4 ? 'Buena' : 'Excelente'}
          </Typography>

          <Box sx={{ mt: 4 }}>
            <Typography sx={{
              fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.14em',
              color: MUTED, textTransform: 'uppercase', mb: 1.5,
            }}>
              Cuéntanos más (opcional)
            </Typography>
            <TextField
              fullWidth multiline minRows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              inputProps={{ maxLength: 2000 }}
              placeholder="¿Qué destacas de la consulta? ¿Qué te ayudó más? ¿Cómo fue el trato?"
              helperText={`${comment.length}/2000`}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={submit}
            disabled={submitting || rating < 1}
            sx={{
              mt: 3, background: NAVY, color: '#fff',
              textTransform: 'none', fontWeight: 700, fontSize: '1rem',
              py: 1.5, borderRadius: '12px',
              '&:hover': { background: NAVY, filter: 'brightness(0.92)' },
              '&.Mui-disabled': { background: '#cbd5e1', color: '#fff' },
            }}
          >
            {submitting ? 'Enviando…' : 'Enviar mi reseña'}
          </Button>
          <Typography sx={{ fontSize: '0.75rem', color: MUTED, textAlign: 'center', mt: 1.5 }}>
            Tu reseña se publicará en la ficha de {ctx.professionalName || 'el profesional'}.
          </Typography>
        </Box>
      </Container>
      <Footer />
    </>
  );
}
