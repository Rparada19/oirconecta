import React from 'react';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import PlayCircleFilledRoundedIcon from '@mui/icons-material/PlayCircleFilledRounded';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { Link as RouterLink } from 'react-router-dom';
import { HOME_VIDEO_EMBED_URL } from '../config/homeContent';

const C = {
  navy: '#272F50', verde: '#085946', verdeProfundo: '#00382B',
  oro: '#C9A86A', blanco: '#FBFAF8', gris: '#6B7280', arena: '#D9CDBF',
};

const POSTER = '/img/audiologa-atendiendo-paciente.jpg';

export default function HomeVideoSection() {
  const hasVideo = Boolean(HOME_VIDEO_EMBED_URL && HOME_VIDEO_EMBED_URL.trim());

  return (
    <Box component="section" aria-label="Video educativo" sx={{ py: { xs: 6, md: 9 }, bgcolor: '#fff' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 5, md: 8 }, alignItems: 'center' }}>
          {/* Texto */}
          <Box sx={{ flex: '0 0 auto', maxWidth: { md: 440 } }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.5 }}>
              <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
                fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.verde,
              }}>Historia humana</Typography>
            </Stack>
            <Typography component="h2" sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '2rem', md: '2.875rem' }, fontWeight: 600, lineHeight: 1.1,
              color: C.navy, letterSpacing: '-0.018em', mb: 3,
            }}>
              Así se siente una{' '}
              <Box component="span" sx={{ fontStyle: 'italic', color: C.verde, fontWeight: 500 }}>
                primera visita
              </Box>
            </Typography>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif', fontSize: '1.0625rem',
              color: C.gris, lineHeight: 1.65, mb: 4,
            }}>
              Conversación, pruebas sencillas y espacio para preguntar. Nada de tecnicismos innecesarios: solo personas cuidando personas.
            </Typography>
            <Button component={RouterLink} to="/agendar" variant="contained" size="large"
              startIcon={<CalendarMonthIcon />}
              sx={{
                fontFamily: '"DM Sans", sans-serif', background: 'linear-gradient(135deg, #0d7a5c 0%, #085946 60%, #00382B 100%) !important', color: '#fff !important',
                fontWeight: 700, fontSize: '0.9375rem', px: 3.5, py: 1.5, borderRadius: '6px',
                boxShadow: '0 6px 18px rgba(8,89,70,0.35)',
                '&:hover': { background: 'linear-gradient(135deg, #109070 0%, #0a6a54 60%, #064a3a 100%) !important', transform: 'translateY(-2px)', boxShadow: '0 10px 24px rgba(8,89,70,0.45)' },
              }}
            >Agendar una valoración</Button>
          </Box>

          {/* Video / poster */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <Box sx={{
              position: 'relative', borderRadius: '10px', overflow: 'hidden',
              aspectRatio: '16/10', boxShadow: `0 24px 64px ${C.navy}22`,
            }}>
              {hasVideo ? (
                <iframe
                  src={HOME_VIDEO_EMBED_URL}
                  title="Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 0 }}
                />
              ) : (
                <>
                  <Box component="img" src={POSTER} alt="Audióloga con paciente sonriendo"
                    loading="lazy"
                    sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Box sx={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(135deg, ${C.navy}55 0%, transparent 50%, ${C.verdeProfundo}66 100%)`,
                  }} />
                  <Box sx={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Box sx={{
                      width: 88, height: 88, borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.95)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': { transform: 'scale(1.08)' },
                    }}>
                      <PlayCircleFilledRoundedIcon sx={{ fontSize: 64, color: C.oro }} />
                    </Box>
                  </Box>
                  {/* Caption */}
                  <Box sx={{
                    position: 'absolute', bottom: 20, left: 20,
                    bgcolor: '#fff', borderRadius: '6px', px: 1.75, py: 0.875,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                  }}>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '0.6875rem',
                      fontWeight: 700, color: C.navy, letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}>
                      Pronto · Video 2 min
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
