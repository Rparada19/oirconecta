import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import PlayCircleFilledRoundedIcon from '@mui/icons-material/PlayCircleFilledRounded';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { Link as RouterLink } from 'react-router-dom';
import { HOME_VIDEO_EMBED_URL } from '../config/homeContent';

export default function HomeVideoSection() {
  const hasVideo = Boolean(HOME_VIDEO_EMBED_URL && HOME_VIDEO_EMBED_URL.trim());

  return (
    <Box component="section" aria-label="Video educativo"
      sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 5, md: 8 }, alignItems: 'center' }}>
          {/* Left text */}
          <Box sx={{ flex: '0 0 auto', maxWidth: { md: 400 } }}>
            <Box sx={{ display: 'inline-flex', px: 2.5, py: 0.75, borderRadius: '20px',
              background: 'rgba(8,89,70,0.08)', border: '1px solid rgba(8,89,70,0.15)', mb: 2.5 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#085946' }}>
                Historia humana
              </Typography>
            </Box>
            <Typography component="h2"
              sx={{ fontSize: { xs: '1.875rem', md: '2.75rem' }, fontWeight: 900,
                letterSpacing: '-0.03em', lineHeight: 1.1, color: '#0f1923', mb: 2 }}>
              Así se siente una{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                primera visita
              </Box>
            </Typography>
            <Typography sx={{ fontSize: '1rem', color: '#4a5568', lineHeight: 1.7, mb: 3.5 }}>
              Conversación, pruebas sencillas y espacio para preguntar. Nada de tecnicismos innecesarios: solo personas cuidando personas.
            </Typography>
            <Button component={RouterLink} to="/agendar" variant="contained" size="large"
              startIcon={<CalendarMonthIcon />}
              sx={{ borderRadius: '14px', fontWeight: 700, px: 3.5, py: 1.5,
                background: 'linear-gradient(135deg,#0d7a5c,#085946)',
                boxShadow: '0 8px 24px rgba(8,89,70,0.30)',
                '&:hover': { boxShadow: '0 12px 32px rgba(8,89,70,0.40)' } }}>
              Agendar una valoración
            </Button>
          </Box>

          {/* Right video/placeholder */}
          <Box sx={{ flex: 1, width: '100%' }}>
            <Box sx={{ borderRadius: '24px', overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(8,89,70,0.18)',
              border: '1px solid rgba(8,89,70,0.10)' }}>
              {hasVideo ? (
                <Box component="iframe" src={HOME_VIDEO_EMBED_URL}
                  title="Video educativo OírConecta" loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  sx={{ display: 'block', width: '100%', aspectRatio: '16 / 9', border: 0 }} />
              ) : (
                <Box sx={{
                  aspectRatio: '16 / 9',
                  background:
                    'radial-gradient(ellipse 80% 60% at 30% 40%, rgba(13,122,92,0.35) 0%, transparent 60%),' +
                    'linear-gradient(135deg, #063c2c 0%, #085946 50%, #1a2240 100%)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 2, position: 'relative', overflow: 'hidden',
                }}>
                  {/* Grain */}
                  <Box sx={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />
                  <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', px: 3 }}>
                    <Box sx={{ width: 80, height: 80, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.30)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3,
                      backdropFilter: 'blur(10px)' }}>
                      <PlayCircleFilledRoundedIcon sx={{ fontSize: 44, color: '#fff' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#fff', mb: 1 }}>
                      Pronto: un video corto y real
                    </Typography>
                    <Typography sx={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', maxWidth: 360, lineHeight: 1.65 }}>
                      Una conversación real, una primera visita. Sin guiones, sin actores.
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
