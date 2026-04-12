import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Typography, Grid, Paper, Button, Stack, Chip } from '@mui/material';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';

export default function HomeB2BSection() {
  return (
    <Box
      component="section"
      id="profesionales-directorio"
      aria-labelledby="heading-b2b"
      sx={{
        py: { xs: 8, md: 10 },
        scrollMarginTop: 88,
        background: 'linear-gradient(165deg, #05261f 0%, #0d5c49 38%, #152a36 100%)',
        color: 'common.white',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={1.5} sx={{ mb: 2 }}>
          <Chip
            label="Para profesionales y marcas"
            size="small"
            sx={{
              alignSelf: { xs: 'flex-start', sm: 'center' },
              fontWeight: 800,
              letterSpacing: '0.04em',
              bgcolor: 'rgba(255,255,255,0.14)',
              color: 'common.white',
              border: '1px solid rgba(255,255,255,0.28)',
            }}
          />
        </Stack>
        <Typography
          variant="overline"
          sx={{ color: 'rgba(255,255,255,0.78)', fontWeight: 800, letterSpacing: '0.16em', display: 'block', mb: 1 }}
        >
          Directorio público Oír Conecta
        </Typography>
        <Typography
          id="heading-b2b"
          component="h2"
          variant="h3"
          sx={{
            fontWeight: 800,
            mb: 2,
            letterSpacing: '-0.03em',
            fontSize: { xs: '1.85rem', sm: '2.35rem', md: '2.75rem' },
            lineHeight: 1.12,
            maxWidth: 900,
          }}
        >
          Hagamos visible lo que ya haces bien
        </Typography>
        <Typography
          variant="body1"
          sx={{
            mb: { xs: 1.5, md: 2 },
            maxWidth: 760,
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.9)',
            fontSize: { xs: '1.02rem', md: '1.08rem' },
          }}
        >
          Si atiendes audición, voz u ORL, puedes tener una{' '}
          <Box component="strong" sx={{ fontWeight: 800, color: 'common.white' }}>
            ficha clara en nuestro directorio
          </Box>
          : pacientes que ya se informaron en la web y buscan a alguien de confianza.
        </Typography>
        <Typography variant="body2" sx={{ mb: { xs: 4, md: 5 }, maxWidth: 720, lineHeight: 1.65, color: 'rgba(255,255,255,0.78)' }}>
          Es un registro aparte: sirve para publicar tu perfil público cuando el equipo lo apruebe. Las marcas tienen otro canal de
          alianzas, al lado.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 3.75 },
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.16)',
                height: '100%',
                backdropFilter: 'blur(8px)',
              }}
            >
              <HandshakeOutlinedIcon sx={{ fontSize: 42, mb: 2, opacity: 0.95 }} aria-hidden />
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.25, color: '#b8e6d9' }}>
                Tu perfil en el directorio
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, lineHeight: 1.7, color: 'rgba(255,255,255,0.88)' }}>
                Publica datos de consulta, sedes y especialidad para que te encuentren quienes buscan valoración o seguimiento —sin
                mezclarse con otros sistemas internos del centro.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  component={RouterLink}
                  to="/registro-profesional"
                  variant="contained"
                  color="inherit"
                  size="large"
                  startIcon={<PersonAddAltOutlinedIcon />}
                  sx={{
                    color: 'primary.dark',
                    fontWeight: 800,
                    bgcolor: '#fff',
                    px: 2.5,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.92)' },
                  }}
                >
                  Registrarme
                </Button>
                <Button
                  component={RouterLink}
                  to="/login-directorio"
                  variant="outlined"
                  size="large"
                  startIcon={<LoginIcon />}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.65)',
                    color: '#fff',
                    fontWeight: 700,
                    borderWidth: 2,
                    '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  Iniciar sesión
                </Button>
              </Stack>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 3.75 },
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                height: '100%',
              }}
            >
              <CampaignOutlinedIcon sx={{ fontSize: 42, mb: 2, opacity: 0.9 }} aria-hidden />
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.25, color: '#b8e6d9' }}>
                Marcas y aliados
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, lineHeight: 1.7, color: 'rgba(255,255,255,0.82)' }}>
                Educación alineada con tu mensaje, visibilidad junto a contenido útil y oportunidades de co-crear campañas con la red.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  component={RouterLink}
                  to="/contacto"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'rgba(255,255,255,0.55)',
                    color: '#fff',
                    fontWeight: 700,
                    '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  Hablar con el equipo
                </Button>
                <Button
                  component={RouterLink}
                  to="/nosotros"
                  variant="text"
                  size="large"
                  sx={{ color: 'rgba(255,255,255,0.92)', fontWeight: 600 }}
                >
                  Cómo funciona la plataforma
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
