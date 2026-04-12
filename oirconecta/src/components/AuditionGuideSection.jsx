import React from 'react';
import { Box, Container, Typography, Grid, Paper, Stack } from '@mui/material';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined';
import HearingOutlinedIcon from '@mui/icons-material/HearingOutlined';

const SIGNALS = [
  {
    icon: <VolumeUpOutlinedIcon sx={{ fontSize: 36 }} />,
    title: 'Subes mucho el volumen',
    text: 'Del televisor, la radio o el celular, y aun así cuesta entender lo que dicen.',
  },
  {
    icon: <GroupsOutlinedIcon sx={{ fontSize: 36 }} />,
    title: 'Te cuesta seguir conversaciones',
    text: 'Sobre todo si hay varias personas o ruido al fondo (restaurante, familia reunida).',
  },
  {
    icon: <NotificationsActiveOutlinedIcon sx={{ fontSize: 36 }} />,
    title: 'Te avisan que “no escuchaste”',
    text: 'Timbre, llamadas o cuando alguien te habla de espaldas.',
  },
  {
    icon: <PhoneInTalkOutlinedIcon sx={{ fontSize: 36 }} />,
    title: 'Evitas hablar por teléfono',
    text: 'Porque se vuelve cansón adivinar palabras.',
  },
];

export default function AuditionGuideSection() {
  return (
    <Box
      id="aprender-audicion"
      component="section"
      aria-label="Señales de alerta auditiva"
      sx={{ scrollMarginTop: 96, py: { xs: 8, md: 10 }, bgcolor: 'background.default' }}
    >
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems={{ md: 'flex-start' }} sx={{ mb: 5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              sx={{ display: 'block', color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em', mb: 2 }}
            >
              Guía sencilla
            </Typography>
            <Typography component="h2" variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, letterSpacing: '-0.02em' }}>
              Señales que muchas personas posponen
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65, maxWidth: 520 }}>
              Si algo te suena familiar, pedir una valoración es tan razonable como revisarte la vista. Aquí no hay drama: solo claridad.
            </Typography>
          </Box>
          <Paper
            elevation={0}
            sx={{
              flex: { md: '0 0 280px' },
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'rgba(8, 89, 70, 0.1)',
              bgcolor: 'rgba(8, 89, 70, 0.04)',
            }}
          >
            <HearingOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1.5 }} aria-hidden />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              En una frase
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              El sonido viaja hasta tu cerebro. Si algo se cansa en el camino, todo suena apagado o confuso. Un especialista lo explica
              contigo, sin apuro.
            </Typography>
          </Paper>
        </Stack>

        <Grid container spacing={3}>
          {SIGNALS.map((s) => (
            <Grid item xs={12} sm={6} key={s.title}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'rgba(39, 47, 80, 0.08)',
                  bgcolor: 'background.paper',
                }}
              >
                <Box sx={{ color: 'primary.main', mb: 2 }} aria-hidden>
                  {s.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                  {s.text}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
