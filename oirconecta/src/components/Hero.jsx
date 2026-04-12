import React from 'react';
import { Box, Container, Typography, Grid, Stack, Button } from '@mui/material';
import { ChatOutlined, SouthRounded } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { getWhatsAppHref } from '../config/publicSite';

const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(165deg, #0a4d3c 0%, #1e2a45 48%, #2d6b5c 100%)',
  color: '#fff',
  padding: theme.spacing(14, 0, 9),
  position: 'relative',
  overflow: 'hidden',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(12, 0, 7),
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(255,255,255,0.12) 0%, transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(255,255,255,0.06) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    opacity: 0.35,
    background:
      'url("data:image/svg+xml,%3Csvg width=\'72\' height=\'72\' viewBox=\'0 0 72 72\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath fill=\'%23ffffff\' fill-opacity=\'0.04\' d=\'M36 0L72 36L36 72L0 36Z\'/%3E%3C/svg%3E")',
    pointerEvents: 'none',
  },
}));

const Hero = () => {
  const waHref = getWhatsAppHref();

  const goQueBuscas = () => {
    document.getElementById('que-buscas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section aria-label="Banner principal de OírConecta">
      <HeroSection>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography
                variant="overline"
                sx={{
                  display: 'block',
                  letterSpacing: '0.14em',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.72)',
                  mb: 2,
                  fontSize: '0.8125rem',
                }}
              >
                Plataforma de salud auditiva
              </Typography>

              <Typography component="h1" variant="h1" sx={{ fontWeight: 800, mb: 2, color: '#fff', letterSpacing: '-0.03em' }}>
                Un solo lugar para entender tu oído y dar el siguiente paso
              </Typography>

              <Typography
                component="p"
                variant="h5"
                sx={{
                  mb: 3,
                  fontWeight: 400,
                  lineHeight: 1.45,
                  color: 'rgba(255,255,255,0.9)',
                  maxWidth: 520,
                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                }}
              >
                Profesionales de confianza, transparencia en precios y contenido que habla como una persona —no como un folleto.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2, alignItems: { xs: 'stretch', sm: 'center' } }}>
                <Button
                  variant="contained"
                  size="large"
                  color="inherit"
                  startIcon={<SouthRounded />}
                  onClick={goQueBuscas}
                  sx={{
                    bgcolor: '#fff',
                    color: 'primary.main',
                    fontWeight: 700,
                    py: 1.5,
                    px: 3,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' },
                  }}
                >
                  Ver qué puedes hacer aquí
                </Button>
                <Button
                  component="a"
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="large"
                  startIcon={<ChatOutlined />}
                  sx={{
                    color: '#fff',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.45)',
                    borderRadius: 2,
                    px: 2.5,
                    py: 1.25,
                    justifyContent: 'center',
                    textDecoration: 'none',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  Escribir por WhatsApp
                </Button>
              </Stack>

              <Button
                component={RouterLink}
                to="/agendar"
                variant="text"
                size="medium"
                sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, mb: 2, px: 0, textDecoration: 'underline', textUnderlineOffset: 4 }}
              >
                Prefiero agendar una valoración
              </Button>

              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 480, lineHeight: 1.65 }}>
                Sin prisas: primero claridad, luego tú decides.
              </Typography>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  borderRadius: 4,
                  p: { xs: 3, md: 3.5 },
                  bgcolor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: '0.12em', mb: 1.5 }}>
                  En pocas palabras
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mb: 2, lineHeight: 1.35 }}>
                  Red + plataforma: te orientamos, tú eliges con quién caminar.
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.65, m: 0 }}>
                  Explorar audífonos, conocer especialistas o aprender sobre audición: todo empieza abajo, en un solo vistazo.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </HeroSection>
    </section>
  );
};

export default Hero;
