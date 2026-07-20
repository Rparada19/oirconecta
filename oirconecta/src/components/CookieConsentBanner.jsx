import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { getConsent, setConsent, onConsentChange } from '../utils/cookieConsent';

/**
 * Banner de consentimiento de cookies.
 * Aparece si no hay preferencia guardada. Controla Meta Pixel y analytics propio.
 */
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
    const off = onConsentChange((v) => setVisible(v === null));
    return off;
  }, []);

  if (!visible) return null;

  const accept = () => { setConsent('accepted'); setVisible(false); };
  const reject = () => { setConsent('rejected'); setVisible(false); };

  return (
    <Box
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
      sx={{
        position: 'fixed',
        bottom: { xs: 12, md: 24 },
        left: { xs: 12, md: 24 },
        right: { xs: 12, md: 24 },
        mx: 'auto',
        maxWidth: 760,
        zIndex: 2000,
        bgcolor: '#fff',
        border: '1px solid rgba(39,47,80,0.12)',
        borderRadius: '14px',
        boxShadow: '0 10px 40px rgba(39,47,80,0.18)',
        p: { xs: 2.5, md: 3 },
      }}
    >
      <Container disableGutters>
        <Typography sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: { xs: '1.15rem', md: '1.35rem' },
          fontWeight: 500, color: '#272F50', mb: 1,
        }}>
          Usamos cookies
        </Typography>
        <Typography sx={{
          fontSize: { xs: '0.875rem', md: '0.9375rem' },
          color: '#4b5563', lineHeight: 1.6, mb: 2.25,
        }}>
          Utilizamos cookies técnicas necesarias para el funcionamiento del sitio, y —con tu autorización— cookies
          analíticas y de marketing (Meta Pixel, analítica propia) para entender cómo usas el sitio y mostrarte
          publicidad relevante. Puedes cambiar tu preferencia en cualquier momento desde la{' '}
          <RouterLink to="/legal#cookies" style={{ color: '#085946', fontWeight: 700 }}>
            Política de cookies
          </RouterLink>.
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.25}
          justifyContent="flex-end"
        >
          <Button
            onClick={reject}
            variant="outlined"
            sx={{
              borderRadius: '10px', fontWeight: 600, textTransform: 'none',
              borderColor: 'rgba(39,47,80,0.25)', color: '#272F50',
              '&:hover': { borderColor: '#272F50', bgcolor: 'rgba(39,47,80,0.04)' },
            }}
          >
            Sólo esenciales
          </Button>
          <Button
            onClick={accept}
            variant="contained"
            sx={{
              borderRadius: '10px', fontWeight: 700, textTransform: 'none',
              background: 'linear-gradient(135deg,#085946,#0d7a5f)',
              boxShadow: '0 4px 14px rgba(8,89,70,0.28)',
              '&:hover': { boxShadow: '0 6px 20px rgba(8,89,70,0.38)' },
            }}
          >
            Aceptar todas
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
