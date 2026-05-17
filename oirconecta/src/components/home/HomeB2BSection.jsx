import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Grid, Button, Stack } from '@mui/material';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const FEATURES = [
  { label: 'Perfil visible en el directorio' },
  { label: 'Pacientes ya informados que buscan especialista' },
  { label: 'Sin mezclarse con otros sistemas internos' },
  { label: 'Aprobación del equipo OírConecta' },
];

export default function HomeB2BSection() {
  return (
    <Box component="section" id="profesionales-directorio"
      aria-labelledby="heading-b2b"
      sx={{
        py: { xs: 0, md: 0 }, scrollMarginTop: 88,
        position: 'relative', overflow: 'hidden',
        background:
          'radial-gradient(ellipse 70% 60% at 5% 50%, rgba(13,122,92,0.35) 0%, transparent 55%),' +
          'radial-gradient(ellipse 60% 70% at 95% 30%, rgba(39,47,80,0.50) 0%, transparent 55%),' +
          'linear-gradient(160deg, #041a12 0%, #063c2c 30%, #0d1f3c 65%, #1a2040 100%)',
        color: '#fff',
      }}>
      {/* Grain */}
      <Box sx={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 10, md: 14 } }}>
        <Grid container spacing={{ xs: 6, md: 10 }} alignItems="center">
          {/* Left — headline */}
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'inline-flex', px: 2.5, py: 0.75, borderRadius: '20px',
              background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.20)', mb: 3 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
                Para profesionales y marcas
              </Typography>
            </Box>
            <Typography id="heading-b2b" component="h2"
              sx={{ fontSize: { xs: '2.25rem', md: '3.25rem' }, fontWeight: 900,
                letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', mb: 2.5 }}>
              Hagamos visible lo que{' '}
              <Box component="span" sx={{ background: 'linear-gradient(135deg, #6ee7c8 0%, #a7f3d0 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                ya haces bien
              </Box>
            </Typography>
            <Typography sx={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, mb: 4 }}>
              Si atiendes audición, voz u ORL, puedes tener una ficha clara en nuestro directorio: pacientes que ya se informaron en la web y buscan a alguien de confianza.
            </Typography>

            {/* Feature list */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {FEATURES.map((f) => (
                <Box key={f.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6ee7c8, #a7f3d0)', flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.80)' }}>{f.label}</Typography>
                </Box>
              ))}
            </Box>
          </Grid>

          {/* Right — two cards */}
          <Grid item xs={12} md={7}>
            <Grid container spacing={3}>
              {/* Card 1 — Profesionales */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ borderRadius: '24px', p: 3.5, height: '100%',
                  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  transition: 'all 0.28s ease',
                  '&:hover': { background: 'rgba(255,255,255,0.12)', transform: 'translateY(-4px)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.30)' } }}>
                  {/* Icon pill */}
                  <Box sx={{ width: 52, height: 52, borderRadius: '14px', mb: 2.5,
                    background: 'linear-gradient(135deg, #085946, #0d7a5f)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(8,89,70,0.40)' }}>
                    <HandshakeOutlinedIcon sx={{ color: '#fff', fontSize: 26 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.0625rem', color: '#a7f3d0', mb: 1.25 }}>
                    Tu perfil en el directorio
                  </Typography>
                  <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)',
                    lineHeight: 1.7, mb: 3 }}>
                    Publica datos de consulta, sedes y especialidad para que te encuentren quienes buscan valoración o seguimiento.
                  </Typography>
                  <Stack spacing={1.5}>
                    <Button component={RouterLink} to="/registro-profesional"
                      variant="contained" size="medium" startIcon={<PersonAddAltOutlinedIcon />}
                      sx={{ fontWeight: 700, bgcolor: '#fff', color: '#085946', borderRadius: '12px',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' } }}>
                      Registrarme
                    </Button>
                    <Button component={RouterLink} to="/login-directorio"
                      variant="outlined" size="medium" startIcon={<LoginIcon />}
                      sx={{ fontWeight: 600, borderColor: 'rgba(255,255,255,0.35)', color: '#fff',
                        borderRadius: '12px',
                        '&:hover': { borderColor: 'rgba(255,255,255,0.65)', bgcolor: 'rgba(255,255,255,0.08)' } }}>
                      Iniciar sesión
                    </Button>
                  </Stack>
                </Box>
              </Grid>

              {/* Card 2 — Marcas */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ borderRadius: '24px', p: 3.5, height: '100%',
                  background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  transition: 'all 0.28s ease',
                  '&:hover': { background: 'rgba(255,255,255,0.09)', transform: 'translateY(-4px)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.25)' } }}>
                  <Box sx={{ width: 52, height: 52, borderRadius: '14px', mb: 2.5,
                    background: 'linear-gradient(135deg, #272F50, #085946)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 20px rgba(39,47,80,0.40)' }}>
                    <CampaignOutlinedIcon sx={{ color: '#fff', fontSize: 26 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.0625rem', color: '#a7f3d0', mb: 1.25 }}>
                    Marcas y aliados
                  </Typography>
                  <Typography sx={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)',
                    lineHeight: 1.7, mb: 3 }}>
                    Visibilidad junto a contenido útil y oportunidades de co-crear campañas con la red de especialistas.
                  </Typography>
                  <Stack spacing={1.5}>
                    <Button component={RouterLink} to="/contacto"
                      variant="outlined" size="medium" endIcon={<ArrowForwardIcon />}
                      sx={{ fontWeight: 700, borderColor: 'rgba(255,255,255,0.35)', color: '#fff',
                        borderRadius: '12px',
                        '&:hover': { borderColor: 'rgba(255,255,255,0.65)', bgcolor: 'rgba(255,255,255,0.08)' } }}>
                      Hablar con el equipo
                    </Button>
                    <Button component={RouterLink} to="/nosotros"
                      variant="text" size="medium"
                      sx={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600, justifyContent: 'flex-start',
                        '&:hover': { color: '#fff', bgcolor: 'transparent' } }}>
                      Cómo funciona la plataforma →
                    </Button>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
