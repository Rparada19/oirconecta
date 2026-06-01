import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Button, Stack, Grid } from '@mui/material';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import LoginIcon from '@mui/icons-material/Login';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const C = {
  navy: '#272F50', verde: '#085946', verdeProfundo: '#00382B',
  oro: '#C9A86A', blanco: '#FBFAF8', gris: '#6B7280',
};

const BENEFITS = [
  'Perfil visible en el directorio nacional',
  'Pacientes que ya buscan un especialista de confianza',
  'Panel propio para gestionar tus consultas y servicios',
  'Aprobación y acompañamiento del equipo OírConecta',
];

const HERO_IMAGE = 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=1200&h=1400&q=80&auto=format&fit=crop';

export default function HomeB2BSection() {
  return (
    <Box
      component="section"
      id="profesionales-directorio"
      aria-labelledby="heading-b2b"
      sx={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, ${C.navy} 0%, #1f2545 50%, ${C.verdeProfundo} 100%)`,
        color: '#fff', scrollMarginTop: 88, py: { xs: 6, md: 9 },
      }}
    >
      {/* Blob oro decorativo */}
      <Box sx={{
        position: 'absolute', top: '20%', left: '-10%',
        width: 480, height: 480, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.oro}1a 0%, transparent 70%)`,
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      {/* Patrón ruido */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.04, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          {/* Texto */}
          <Grid item xs={12} md={7}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 3 }}>
              <Box sx={{ width: 28, height: 2, bgcolor: C.oro }} />
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
                fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.oro,
              }}>Para profesionales auditivos</Typography>
            </Stack>

            <Typography id="heading-b2b" component="h2" sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 600, lineHeight: 1.08,
              color: '#fff', letterSpacing: '-0.02em', mb: 3,
            }}>
              Forma parte de una{' '}
              <Box component="span" sx={{ fontStyle: 'italic', color: C.oro, fontWeight: 500 }}>
                red verificada
              </Box>
              {' '}en Colombia
            </Typography>

            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif', fontSize: { xs: '1.0625rem', md: '1.1875rem' },
              color: 'rgba(255,255,255,0.80)', lineHeight: 1.6, mb: 4, maxWidth: 580,
            }}>
              Si eres audiólogo, otorrino, fonoaudiólogo o tienes un centro auditivo, súmate a la red. Acompañamiento, visibilidad y pacientes que ya buscan especialistas de confianza.
            </Typography>

            <Stack spacing={1.5} sx={{ mb: 4.5 }}>
              {BENEFITS.map((b) => (
                <Box key={b} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 20, color: C.oro }} />
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem',
                    color: 'rgba(255,255,255,0.90)',
                  }}>{b}</Typography>
                </Box>
              ))}
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                component={RouterLink}
                to="/registro-profesional"
                variant="contained"
                size="large"
                startIcon={<PersonAddAltOutlinedIcon />}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  background: '#C9A86A !important', color: '#272F50 !important', fontWeight: 700, fontSize: '0.9375rem',
                  px: 3.5, py: 1.75, borderRadius: '6px', letterSpacing: '0.01em',
                  boxShadow: `0 8px 24px ${C.oro}55`,
                  '&:hover': { background: '#D4B97A !important', transform: 'translateY(-2px)' },
                }}
              >Suscribir mi perfil</Button>
              <Button
                component={RouterLink}
                to="/login-directorio"
                variant="outlined"
                size="large"
                startIcon={<LoginIcon />}
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  color: '#fff', borderColor: 'rgba(255,255,255,0.40)', borderWidth: '1.5px',
                  fontWeight: 600, fontSize: '0.9375rem', px: 3.5, py: 1.75, borderRadius: '6px',
                  '&:hover': { borderColor: '#fff', borderWidth: '1.5px', bgcolor: 'rgba(255,255,255,0.08)' },
                }}
              >Ya soy parte</Button>
            </Stack>
          </Grid>

          {/* Imagen */}
          <Grid item xs={12} md={5}>
            <Box sx={{
              position: 'relative',
              borderRadius: '10px', overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
              aspectRatio: '4/5', maxHeight: 520,
            }}>
              <Box component="img" src={HERO_IMAGE}
                alt="Audióloga profesional en consulta moderna"
                loading="lazy"
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <Box sx={{
                position: 'absolute', bottom: 20, left: 20, right: 20,
                bgcolor: 'rgba(255,255,255,0.95)',
                borderRadius: '8px', p: 2,
                display: 'flex', alignItems: 'center', gap: 1.5,
              }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: '50%',
                  bgcolor: `${C.verde}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 22, color: C.verde }} />
                </Box>
                <Box>
                  <Typography sx={{
                    fontFamily: '"Playfair Display", serif', fontSize: '0.9375rem',
                    fontWeight: 700, color: C.navy, lineHeight: 1.2,
                  }}>Red verificada nacional</Typography>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
                    color: C.gris, mt: 0.25,
                  }}>Audiólogos, otorrinos y centros</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
