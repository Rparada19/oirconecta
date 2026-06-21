import React from 'react';
import { Box, Container, Typography, Button, Stack, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { HearingOutlined, ArrowForward, PlayArrow } from '@mui/icons-material';

const C = {
  navy: '#272F50',
  verde: '#085946',
  verdeProfundo: '#00382B',
  oro: '#C9A86A',
  arena: '#D9CDBF',
  blanco: '#FBFAF8',
  gris: '#6B7280',
};

export default function HomePonteEnSusOidosSection() {
  return (
    <Box component="section" aria-label="Simulador de pérdida auditiva" sx={{
      bgcolor: C.navy, color: '#fff', py: { xs: 7, md: 10 },
      position: 'relative', overflow: 'hidden',
    }}>
      {/* halo verde decorativo */}
      <Box sx={{
        position: 'absolute', top: -160, right: -160, width: 460, height: 460,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${C.oro}33 0%, transparent 70%)`,
        filter: 'blur(80px)', pointerEvents: 'none',
      }} />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
              <Box sx={{ width: 32, height: 2, bgcolor: C.oro }} />
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: C.oro,
              }}>
                Experiencia sonora · Nuevo
              </Typography>
            </Stack>

            <Typography component="h2" sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 600, lineHeight: 1.08, mb: 2.5,
              letterSpacing: '-0.018em',
            }}>
              Cuando ella no contesta, no es que te ignore.{' '}
              <Box component="span" sx={{ fontStyle: 'italic', color: C.arena }}>
                Esto es lo que está oyendo.
              </Box>
            </Typography>

            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.6,
              color: '#D9CDBFcc', mb: 4, maxWidth: 560,
            }}>
              "Ponte en sus oídos" es un simulador en vivo: elige una escena de la vida diaria —
              una cena familiar, una llamada del nieto, el televisor — y escucha cómo suena con
              pérdida auditiva leve, moderada y severa. Una experiencia que vale más que mil
              explicaciones.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                component={RouterLink}
                to="/ponte-en-sus-oidos"
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                endIcon={<ArrowForward />}
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  background: `${C.oro} !important`, color: `${C.navy} !important`,
                  fontWeight: 700, fontSize: '0.95rem',
                  px: 3.5, py: 1.75, borderRadius: '6px',
                  boxShadow: `0 8px 24px ${C.oro}55`,
                  '&:hover': { background: '#D4B97A !important' },
                }}
              >
                Probar la experiencia
              </Button>
              <Button
                component={RouterLink}
                to="/ponte-en-sus-oidos"
                variant="outlined"
                size="large"
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  color: '#fff', borderColor: '#ffffff55', borderWidth: '1.5px',
                  fontWeight: 600, fontSize: '0.95rem',
                  px: 3.5, py: 1.75, borderRadius: '6px',
                  '&:hover': { borderColor: '#fff', bgcolor: '#ffffff10' },
                }}
              >
                Conocer cómo funciona
              </Button>
            </Stack>
          </Grid>

          <Grid item xs={12} md={5}>
            <Box sx={{
              bgcolor: '#ffffff0d', border: '1px solid #ffffff1f',
              borderRadius: '14px', p: { xs: 3, md: 3.5 },
              backdropFilter: 'blur(6px)',
            }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: '8px',
                  bgcolor: `${C.oro}33`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <HearingOutlined sx={{ color: C.arena, fontSize: 22 }} />
                </Box>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.95rem', fontWeight: 700, color: '#fff',
                }}>
                  4 niveles de audición
                </Typography>
              </Stack>
              <Stack spacing={1.25}>
                {[
                  { label: 'Normal', db: 'Audición sana' },
                  { label: 'Leve', db: '20–40 dB' },
                  { label: 'Moderada', db: '40–60 dB' },
                  { label: 'Severa', db: '60–90 dB' },
                ].map((row) => (
                  <Box key={row.label} sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    px: 1.75, py: 1.25, borderRadius: '8px',
                    bgcolor: '#ffffff08',
                  }}>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '0.9rem', fontWeight: 600, color: '#fff',
                    }}>
                      {row.label}
                    </Typography>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '0.8rem', color: C.arena,
                    }}>
                      {row.db}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.75rem', color: '#ffffff88', mt: 2, lineHeight: 1.5,
              }}>
                Procesado en vivo con Web Audio API. No reemplaza una valoración médica.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
