import { useEffect, useState } from 'react';
import { Box, Dialog, IconButton, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import NewsletterSignup from './NewsletterSignup';

const LS_KEY = 'oirconecta_newsletter_popup_seen';

/**
 * Popup de suscripción. Aparece una sola vez (localStorage) tras `delayMs`,
 * o cuando el usuario hace scroll más del 40% de la página.
 */
export default function NewsletterPopup({ delayMs = 8000, source = 'blog-popup' }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_KEY)) return;
    } catch {
      return;
    }

    let fired = false;
    const trigger = () => {
      if (fired) return;
      fired = true;
      setOpen(true);
      try { localStorage.setItem(LS_KEY, '1'); } catch {}
      cleanup();
    };

    const timer = setTimeout(trigger, delayMs);
    const onScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
      if (scrolled > 0.4) trigger();
    };
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return cleanup;
  }, [delayMs]);

  const close = () => setOpen(false);

  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
    >
      <Box sx={{ position: 'relative', p: { xs: 3, md: 4 } }}>
        <IconButton
          onClick={close}
          aria-label="Cerrar"
          sx={{ position: 'absolute', top: 8, right: 8, color: 'text.secondary' }}
        >
          <CloseRoundedIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <MarkEmailReadRoundedIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            No te pierdas nada
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Recibe guías, comparativas y novedades de salud auditiva cada 15 días.
          Información clara, sin tecnicismos, directo a tu correo.
        </Typography>
        <NewsletterSignup source={source} compact />
      </Box>
    </Dialog>
  );
}
