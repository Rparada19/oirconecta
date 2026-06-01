import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Grid, Stack } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const C = {
  navy: '#272F50', verdeProfundo: '#00382B', oro: '#C9A86A',
  blanco: '#FBFAF8', gris: '#6B7280',
};

const BULLETS = [
  'Compara hasta 3 marcas, tecnologías y plataformas',
  'Fortalezas, debilidades y precios reales en Colombia',
  'Recomendación según tu pérdida y presupuesto',
];

export default function HomeComparadorSection() {
  const navigate = useNavigate();
  return (
    <Box sx={{ py: { xs: 6, md: 9 }, bgcolor: C.blanco }}>
      <Container maxWidth="lg">
        <Box sx={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${C.navy} 0%, #1f2545 60%, ${C.verdeProfundo} 100%)`,
          color: '#fff',
          boxShadow: `0 24px 64px ${C.navy}33`,
        }}>
          <Box sx={{
            position: 'absolute', top: -120, right: -120,
            width: 380, height: 380, borderRadius: '50%',
            background: `radial-gradient(circle, ${C.oro}26 0%, transparent 70%)`,
            filter: 'blur(50px)', pointerEvents: 'none',
          }} />
          <Grid container alignItems="stretch">
            <Grid item xs={12} md={7}>
              <Box sx={{ p: { xs: 4, md: 6 }, position: 'relative', zIndex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 3 }}>
                  <Box sx={{ width: 28, height: 2, bgcolor: C.oro }} />
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.7rem', fontWeight: 700,
                    letterSpacing: '0.18em', textTransform: 'uppercase', color: C.oro,
                  }}>
                    Nuevo · Con inteligencia artificial
                  </Typography>
                </Stack>
                <Typography component="h2" sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: { xs: '2rem', md: '2.875rem' },
                  fontWeight: 600, lineHeight: 1.1, color: '#fff',
                  letterSpacing: '-0.018em', mb: 2.5,
                }}>
                  ¿No sabes qué{' '}
                  <Box component="span" sx={{ fontStyle: 'italic', color: C.oro, fontWeight: 500 }}>
                    audífono elegir
                  </Box>?
                </Typography>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  color: 'rgba(255,255,255,0.80)', lineHeight: 1.6,
                  mb: 3.5, maxWidth: 560,
                }}>
                  Nuestro comparador con IA te orienta: dinos tu pérdida y presupuesto, y te decimos cuál te conviene — con precios reales.
                </Typography>
                <Stack spacing={1.5} sx={{ mb: 4 }}>
                  {BULLETS.map((b) => (
                    <Box key={b} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 20, color: C.oro }} />
                      <Typography sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: '0.9375rem', color: 'rgba(255,255,255,0.90)',
                      }}>{b}</Typography>
                    </Box>
                  ))}
                </Stack>
                <Button
                  variant="contained" size="large"
                  startIcon={<CompareArrowsIcon />}
                  onClick={() => navigate('/comparador')}
                  sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    background: '#C9A86A !important', color: '#272F50 !important', fontWeight: 700, fontSize: '0.9375rem',
                    px: 3.5, py: 1.75, borderRadius: '6px', letterSpacing: '0.01em',
                    boxShadow: `0 8px 24px ${C.oro}55`, transition: 'all 0.3s ease',
                    '&:hover': { background: '#D4B97A !important', transform: 'translateY(-2px)',
                      boxShadow: `0 12px 28px ${C.oro}66` },
                  }}
                >Probar comparador IA</Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={5} sx={{ position: 'relative' }}>
              <Box sx={{
                height: '100%', minHeight: { xs: 280, md: 'auto' },
                background: 'url("https://images.pexels.com/photos/14682242/pexels-photo-14682242.jpeg?w=900&h=900&auto=compress&cs=tinysrgb&fit=crop")',
                backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative',
                '&::after': {
                  content: '""', position: 'absolute', inset: 0,
                  background: `linear-gradient(to left, transparent 0%, ${C.navy}80 100%)`,
                },
              }}>
                <Box sx={{
                  position: 'absolute', bottom: 24, right: 24, zIndex: 2,
                  bgcolor: 'rgba(255,255,255,0.95)', borderRadius: '8px',
                  p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                  maxWidth: 220, boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
                }}>
                  <AutoAwesomeIcon sx={{ fontSize: 28, color: C.oro }} />
                  <Box>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '0.6875rem',
                      color: C.gris, letterSpacing: '0.06em',
                      textTransform: 'uppercase', fontWeight: 600,
                    }}>IA Comparador</Typography>
                    <Typography sx={{
                      fontFamily: '"Playfair Display", serif',
                      fontSize: '0.9375rem', color: C.navy, fontWeight: 700, lineHeight: 1.2,
                    }}>3 marcas en 1 minuto</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
