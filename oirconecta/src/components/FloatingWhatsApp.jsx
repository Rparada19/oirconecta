/**
 * Botón flotante de WhatsApp persistente en toda la web.
 * Aparece tras un scroll mínimo. Respeta safe-area-insets para iPhone.
 * En rutas /portal-* y /admin* NO se muestra (zona privada).
 */
import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { WhatsApp } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { getWhatsAppHref } from '../config/publicSite';

const HIDDEN_PREFIXES = ['/portal-', '/admin', '/crm-login', '/admin-login', '/login-'];

export default function FloatingWhatsApp() {
  const [visible, setVisible] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 240);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  return (
    <Box
      component="a"
      href={getWhatsAppHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      sx={{
        position: 'fixed', zIndex: 1200,
        right: { xs: 16, md: 24 },
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
        width: { xs: 56, md: 60 }, height: { xs: 56, md: 60 },
        borderRadius: '50%',
        bgcolor: '#25D366', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none',
        boxShadow: '0 14px 32px rgba(37,211,102,0.45)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.85)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.35s ease, transform 0.45s cubic-bezier(0.2,0.7,0.2,1)',
        '&::before': {
          content: '""', position: 'absolute', inset: -6,
          borderRadius: '50%', border: '2px solid #25D36655',
          animation: 'oc-wa-ping 2.4s ease-out infinite',
        },
        '@keyframes oc-wa-ping': {
          '0%': { opacity: 0.7, transform: 'scale(1)' },
          '100%': { opacity: 0, transform: 'scale(1.45)' },
        },
        '&:hover': { transform: 'translateY(0) scale(1.05)' },
      }}
    >
      <WhatsApp sx={{ fontSize: { xs: 28, md: 30 } }} />
    </Box>
  );
}
