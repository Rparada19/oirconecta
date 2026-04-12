import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { HOME_VIDEO_EMBED_URL } from '../config/homeContent';

export default function HomeVideoSection() {
  const hasVideo = Boolean(HOME_VIDEO_EMBED_URL && HOME_VIDEO_EMBED_URL.trim());

  return (
    <Box component="section" aria-label="Video educativo" sx={{ py: { xs: 8, md: 10 }, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Typography
          variant="overline"
          sx={{ display: 'block', color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em', mb: 2 }}
        >
          Historia humana
        </Typography>
        <Typography component="h2" variant="h3" sx={{ fontWeight: 800, color: 'primary.main', mb: 1, letterSpacing: '-0.02em' }}>
          Así se siente una primera visita
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 640, lineHeight: 1.65 }}>
          Conversación, pruebas sencillas y espacio para preguntar. Nada de tecnicismos innecesarios: solo personas cuidando personas.
        </Typography>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'rgba(39, 47, 80, 0.08)',
            bgcolor: 'grey.50',
          }}
        >
          {hasVideo ? (
            <Box
              component="iframe"
              src={HOME_VIDEO_EMBED_URL}
              title="Video educativo OírConecta"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              sx={{
                display: 'block',
                width: '100%',
                aspectRatio: '16 / 9',
                border: 0,
              }}
            />
          ) : (
            <Box
              sx={{
                aspectRatio: '16 / 9',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                px: 3,
                py: 6,
                textAlign: 'center',
                bgcolor: 'rgba(8, 89, 70, 0.04)',
              }}
            >
              <PlayCircleOutlineIcon sx={{ fontSize: 56, color: 'primary.main', opacity: 0.85 }} aria-hidden />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', maxWidth: 420 }}>
                Pronto: un video corto, cálido y real
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480, lineHeight: 1.65 }}>
                Configura <code style={{ fontSize: '0.85em' }}>VITE_HOME_VIDEO_EMBED_URL</code> con el embed (YouTube o Vimeo) y aparecerá
                aquí automáticamente.
              </Typography>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
