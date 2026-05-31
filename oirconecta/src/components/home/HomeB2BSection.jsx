import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Button, Stack, Grid } from '@mui/material';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import LoginIcon from '@mui/icons-material/Login';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';

const BENEFITS = [
  'Perfil visible en el directorio nacional',
  'Pacientes que ya buscan un especialista de confianza',
  'Panel propio para gestionar tus consultas y servicios',
  'Aprobación y acompañamiento del equipo OírConecta',
];

export default function HomeB2BSection() {
  return (
    <Box
      component="section"
      id="profesionales-directorio"
      aria-labelledby="heading-b2b"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(ellipse 60% 80% at -5% 60%, rgba(13,122,92,0.38) 0%, transparent 50%),' +
          'radial-gradient(ellipse 55% 65% at 108% 20%, rgba(39,47,80,0.55) 0%, transparent 55%),' +
          'linear-gradient(155deg, #041a12 0%, #063c2c 28%, #0d1f3c 62%, #1a2040 100%)',
        color: '#fff',
        scrollMarginTop: 88,
      }}
    >
      {/* Grain overlay */}
      <Box sx={{
        position: 'absolute', inset: 0, opacity: 0.45, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E")`,
      }} />

      {/* Decorative circle */}
      <Box sx={{
        position: 'absolute', right: -120, top: '50%', transform: 'translateY(-50%)',
        width: 480, height: 480, borderRadius: '50%',
        border: '1.5px solid rgba(201,168,106,0.10)',
        pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', right: -60, top: '50%', transform: 'translateY(-50%)',
        width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,106,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 6, md: 8 } }}>
        <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">

          {/* ── Left: copy ── */}
          <Grid item xs={12} md={6}>
            {/* Badge */}
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1,
              px: 2, py: 0.625, mb: 4,
              borderRadius: '8px',
              background: 'rgba(201,168,106,0.10)',
              border: '1px solid rgba(201,168,106,0.25)',
            }}>
              <MedicalServicesOutlinedIcon sx={{ fontSize: 15, color: '#C9A86A' }} />
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
                Para profesionales de la salud auditiva
              </Typography>
            </Box>

            <Typography
              id="heading-b2b"
              component="h2"
              sx={{
                fontSize: { xs: '2.25rem', sm: '2.75rem', md: '3.5rem' },
                fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.08,
                color: '#fff', mb: 3,
              }}
            >
              Haz crecer tu{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(135deg, #C9A86A 0%, #a7f3d0 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}
              >
                consulta
              </Box>
              {' '}con OírConecta
            </Typography>

            <Typography sx={{ fontSize: '1.0625rem', color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, mb: 5, maxWidth: 520 }}>
              Publica tu perfil profesional en el directorio más especializado de audición en Colombia y conecta con pacientes que ya buscan a alguien de confianza.
            </Typography>

            {/* Benefits */}
            <Stack spacing={1.75} sx={{ mb: 6 }}>
              {BENEFITS.map((b) => (
                <Box key={b} sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 20, color: '#C9A86A', flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.82)' }}>{b}</Typography>
                </Box>
              ))}
            </Stack>

            {/* CTAs */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                component={RouterLink}
                to="/registro-profesional"
                variant="contained"
                size="large"
                startIcon={<PersonAddAltOutlinedIcon />}
                sx={{
                  fontWeight: 700, px: 3.5, py: 1.5, borderRadius: '14px', fontSize: '0.9375rem',
                  background: 'linear-gradient(135deg, #C9A86A 0%, #34d399 100%)',
                  color: '#041a12',
                  boxShadow: '0 8px 28px rgba(201,168,106,0.30)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #a7f3d0 0%, #C9A86A 100%)',
                    boxShadow: '0 12px 36px rgba(201,168,106,0.40)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.22s ease',
                }}
              >
                Registrarme gratis
              </Button>
              <Button
                component={RouterLink}
                to="/login-directorio"
                variant="outlined"
                size="large"
                startIcon={<LoginIcon />}
                sx={{
                  fontWeight: 600, px: 3.5, py: 1.5, borderRadius: '14px', fontSize: '0.9375rem',
                  borderColor: 'rgba(255,255,255,0.28)', color: '#fff',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.60)', bgcolor: 'rgba(255,255,255,0.07)', transform: 'translateY(-2px)' },
                  transition: 'all 0.22s ease',
                }}
              >
                Iniciar sesión
              </Button>
            </Stack>
          </Grid>

          {/* ── Right: info cards ── */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={3}>
              {/* Card: Stats */}
              <Grid item xs={12}>
                <Box sx={{
                  borderRadius: '22px', p: 3.5,
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(24px) saturate(1.5)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}>
                  <Grid container spacing={2} textAlign="center">
                    {[
                      { num: '100%', label: 'Directorio especializado en audición' },
                      { num: 'Gratis', label: 'Registro sin costo inicial' },
                      { num: '24h', label: 'Revisión y aprobación de tu perfil' },
                    ].map((s) => (
                      <Grid item xs={4} key={s.label}>
                        <Typography sx={{
                          fontSize: { xs: '1.5rem', sm: '2rem' }, fontWeight: 900,
                          background: 'linear-gradient(135deg, #C9A86A, #a7f3d0)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                          letterSpacing: '-0.02em',
                        }}>
                          {s.num}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.58)', mt: 0.5, lineHeight: 1.4 }}>
                          {s.label}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Grid>

              {/* Card: Portal profesional */}
              <Grid item xs={12} sm={6}>
                <Box sx={{
                  borderRadius: '8px', p: 3,
                  background: 'linear-gradient(140deg, rgba(8,89,70,0.55) 0%, rgba(13,31,60,0.55) 100%)',
                  border: '1px solid rgba(201,168,106,0.18)',
                  backdropFilter: 'blur(20px)',
                  height: '100%',
                }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: '12px', mb: 2,
                    background: 'linear-gradient(135deg, #085946, #0d7a5f)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 18px rgba(8,89,70,0.45)' }}>
                    <MedicalServicesOutlinedIcon sx={{ color: '#C9A86A', fontSize: 22 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#C9A86A', mb: 1 }}>
                    Tu portal propio
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.68)', lineHeight: 1.65, mb: 2 }}>
                    Gestiona tu perfil, servicios, fotos y consultas entrantes desde un solo lugar.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/portal-profesional"
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    sx={{ color: '#C9A86A', fontWeight: 600, p: 0, '&:hover': { bgcolor: 'transparent', opacity: 0.8 } }}
                  >
                    Acceder al portal
                  </Button>
                </Box>
              </Grid>

              {/* Card: Marcas */}
              <Grid item xs={12} sm={6}>
                <Box sx={{
                  borderRadius: '8px', p: 3,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  backdropFilter: 'blur(20px)',
                  height: '100%',
                }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: '12px', mb: 2,
                    background: 'linear-gradient(135deg, #272F50, #1a2040)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 6px 18px rgba(39,47,80,0.50)' }}>
                    <CampaignOutlinedIcon sx={{ color: '#a7f3d0', fontSize: 22 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: 'rgba(255,255,255,0.90)', mb: 1 }}>
                    Marcas y aliados
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.58)', lineHeight: 1.65, mb: 2 }}>
                    Visibilidad estratégica junto a contenido útil y acceso a la red de especialistas en Colombia.
                  </Typography>
                  <Button
                    component={RouterLink}
                    to="/contacto"
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    sx={{ color: 'rgba(255,255,255,0.70)', fontWeight: 600, p: 0, '&:hover': { bgcolor: 'transparent', color: '#fff' } }}
                  >
                    Hablar con el equipo
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
