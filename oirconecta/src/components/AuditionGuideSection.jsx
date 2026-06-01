import React from 'react';
import { Box, Container, Typography, Grid, Stack, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const C = {
  navy: '#272F50', verde: '#085946', verdeProfundo: '#00382B',
  oro: '#C9A86A', blanco: '#FBFAF8', gris: '#6B7280',
  grisClaro: '#A1A7B1',
};

const SIGNALS = [
  { icon: VolumeUpOutlinedIcon, title: 'Subes mucho el volumen', text: 'Del televisor, la radio o el celular, y aun así cuesta entender lo que dicen.' },
  { icon: GroupsOutlinedIcon, title: 'Te cuesta seguir conversaciones', text: 'Sobre todo si hay varias personas o ruido al fondo (restaurante, familia reunida).' },
  { icon: NotificationsActiveOutlinedIcon, title: 'Te avisan que "no escuchaste"', text: 'Timbre, llamadas o cuando alguien te habla de espaldas.' },
  { icon: PhoneInTalkOutlinedIcon, title: 'Evitas hablar por teléfono', text: 'Porque se vuelve cansón adivinar palabras.' },
];

export default function AuditionGuideSection() {
  return (
    <Box id="aprender-audicion" component="section" aria-label="Señales de alerta auditiva"
      sx={{ scrollMarginTop: 96, py: { xs: 6, md: 9 }, bgcolor: C.blanco }}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, md: 8 }} alignItems="flex-start">
          <Grid item xs={12} md={5}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: 110 } }}>
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.5 }}>
                <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
                  fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.verde,
                }}>Guía sencilla</Typography>
              </Stack>
              <Typography component="h2" sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: { xs: '2rem', md: '2.875rem' }, fontWeight: 600, lineHeight: 1.1,
                color: C.navy, letterSpacing: '-0.018em', mb: 3,
              }}>
                Señales que muchos{' '}
                <Box component="span" sx={{ fontStyle: 'italic', color: C.verde, fontWeight: 500 }}>posponen</Box>
              </Typography>
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif', fontSize: '1.0625rem',
                color: C.gris, lineHeight: 1.65, mb: 4,
              }}>
                Si te identificas con varias de estas situaciones, una valoración auditiva es el primer paso —sin presión, sin venta. Solo claridad sobre lo que pasa.
              </Typography>
              <Button component={RouterLink} to="/agendar" variant="contained" size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  fontFamily: '"DM Sans", sans-serif', background: '#272F50 !important', color: '#fff !important',
                  fontWeight: 700, fontSize: '0.9375rem', px: 3.5, py: 1.5,
                  borderRadius: '6px', letterSpacing: '0.01em',
                  boxShadow: `0 6px 18px ${C.navy}33`,
                  '&:hover': { background: '#1a1f38 !important', transform: 'translateY(-2px)' },
                }}
              >Agendar una valoración</Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={7}>
            <Grid container spacing={2.5}>
              {SIGNALS.map((s) => {
                const Icon = s.icon;
                return (
                  <Grid item xs={12} sm={6} key={s.title}>
                    <Box sx={{
                      p: 3.5, borderRadius: '10px', bgcolor: '#fff',
                      border: `1px solid ${C.grisClaro}33`, height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: `${C.verde}55`, transform: 'translateY(-3px)',
                        boxShadow: `0 12px 28px ${C.navy}12`,
                      },
                    }}>
                      <Box sx={{
                        width: 48, height: 48, borderRadius: '8px',
                        bgcolor: `${C.verde}12`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mb: 2.5,
                      }}><Icon sx={{ fontSize: 26, color: C.verde }} /></Box>
                      <Typography sx={{
                        fontFamily: '"Playfair Display", Georgia, serif',
                        fontSize: '1.1875rem', fontWeight: 600,
                        color: C.navy, lineHeight: 1.25, mb: 1.25,
                      }}>{s.title}</Typography>
                      <Typography sx={{
                        fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem',
                        color: C.gris, lineHeight: 1.6,
                      }}>{s.text}</Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
