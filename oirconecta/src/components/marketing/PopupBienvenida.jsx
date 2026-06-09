/**
 * Pop-up de bienvenida (A1) — primer espacio publicitario del módulo M2.
 *
 * Lee la campaña activa via polling 60s (sobrescribe si cambia).
 * Frecuencia: 1 por sesión por defecto (configurable vía campaign.config.frecuencia).
 * Delay antes de aparecer: campaign.config.delaySec (default 3s).
 * Botón de cierre habilitado tras campaign.config.closeAfterSec (default 0).
 */

import React, { useEffect, useState } from 'react';
import { Box, IconButton, Backdrop, Typography } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  fetchActiveCampaign, trackImpression, trackClick,
  buildDestinationUrl, rememberUtm,
} from '../../services/marketingPublicApi';
import { usePreviewMode } from '../../hooks/usePreviewMode';

const ACTION_TYPE = 'POPUP_BIENVENIDA';
const POLL_MS = 60 * 1000;
const SEEN_KEY = 'oc_popup_seen';

export default function PopupBienvenida() {
  const preview = usePreviewMode();
  const [camp, setCamp] = useState(null);
  const [shown, setShown] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [impressed, setImpressed] = useState(false);

  // Polling de campaña activa
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const c = await fetchActiveCampaign(ACTION_TYPE);
      if (alive) setCamp(c);
    };
    tick();
    const t = setInterval(tick, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, []);

  // Mostrar respetando frecuencia
  useEffect(() => {
    if (!camp) return;
    rememberUtm(camp);

    const cfg = camp.config || {};
    const frecuencia = cfg.frecuencia || 'session'; // 'session' | 'day' | 'always'
    const delaySec = Math.max(0, Number(cfg.delaySec ?? 3));
    const closeAfterSec = Math.max(0, Number(cfg.closeAfterSec ?? 0));

    // Frecuencia
    if (frecuencia === 'session' && sessionStorage.getItem(`${SEEN_KEY}:${camp.id}`)) return;
    if (frecuencia === 'day') {
      const last = localStorage.getItem(`${SEEN_KEY}:${camp.id}`);
      if (last && (Date.now() - Number(last)) < 24 * 3600 * 1000) return;
    }

    const showTimer = setTimeout(() => {
      setShown(true);
      if (closeAfterSec === 0) setCanClose(true);
      else setTimeout(() => setCanClose(true), closeAfterSec * 1000);
    }, delaySec * 1000);

    return () => clearTimeout(showTimer);
  }, [camp]);

  // Tracking de impresión una sola vez
  useEffect(() => {
    if (shown && camp && !impressed) {
      trackImpression(camp.id);
      setImpressed(true);
      const cfg = camp.config || {};
      if ((cfg.frecuencia || 'session') === 'session') {
        sessionStorage.setItem(`${SEEN_KEY}:${camp.id}`, '1');
      } else if (cfg.frecuencia === 'day') {
        localStorage.setItem(`${SEEN_KEY}:${camp.id}`, String(Date.now()));
      }
    }
  }, [shown, camp, impressed]);

  const onClick = () => {
    if (!camp) return;
    trackClick(camp.id);
    const url = buildDestinationUrl(camp);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };
  const onClose = (e) => { e.stopPropagation(); setShown(false); };

  // En preview sin campaña: render una etiqueta flotante para que el admin
  // sepa que este slot existe y dónde aparecería.
  if (preview && !camp) {
    return (
      <Box sx={{
        position: 'fixed', top: 80, right: 16, zIndex: 9999,
        bgcolor: '#fff', border: '2px dashed #cbd5e1', borderRadius: '8px',
        px: 1.5, py: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Slot vacío
        </Typography>
        <Typography sx={{ fontWeight: 700, color: '#475569', fontSize: '0.8rem' }}>
          Pop-up de bienvenida
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace' }}>
          POPUP_BIENVENIDA
        </Typography>
      </Box>
    );
  }

  if (!camp || !shown) return null;
  const isVideo = camp.creativeType === 'video';

  return (
    <Backdrop open sx={{
      zIndex: 1500,
      // Vignette suave + blur fuerte: el fondo no se ve "muerto" gris,
      // sino que el contenido del sitio queda apenas perceptible detrás.
      background: 'radial-gradient(ellipse at center, rgba(15,25,35,0.55) 0%, rgba(15,25,35,0.78) 100%)',
      backdropFilter: 'blur(14px) saturate(0.9)',
      WebkitBackdropFilter: 'blur(14px) saturate(0.9)',
      animation: 'oc-backdrop-in 0.32s ease-out',
      '@keyframes oc-backdrop-in': {
        '0%': { opacity: 0, backdropFilter: 'blur(0)' },
        '100%': { opacity: 1 },
      },
    }}>
      <Box
        onClick={onClick}
        role="dialog"
        aria-label="Publicidad"
        sx={{
          position: 'relative', cursor: camp.destinationUrl ? 'pointer' : 'default',
          width: { xs: '92vw', sm: 600 }, maxWidth: '92vw',
          aspectRatio: { xs: '340 / 480', sm: '600 / 400' },
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)',
          bgcolor: '#000',
          animation: 'oc-popup-in 0.36s cubic-bezier(0.16, 1, 0.3, 1)',
          '@keyframes oc-popup-in': {
            '0%':   { opacity: 0, transform: 'scale(0.92) translateY(8px)' },
            '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
          },
        }}
      >
        {isVideo ? (
          <Box component="video" src={camp.creativeUrl} autoPlay muted playsInline loop
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <Box component="img" src={camp.creativeUrl} alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}

        {/* Etiqueta sutil */}
        <Box sx={{
          position: 'absolute', bottom: 8, left: 8,
          px: 1, py: 0.25, borderRadius: '4px',
          bgcolor: 'rgba(0,0,0,0.5)', color: '#fff',
          fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase',
          fontFamily: '"DM Sans", sans-serif',
        }}>
          Publicidad
        </Box>

        {canClose && (
          <IconButton
            onClick={onClose}
            aria-label="Cerrar"
            sx={{
              position: 'absolute', top: 8, right: 8,
              bgcolor: 'rgba(255,255,255,0.95)', color: '#0f1923',
              '&:hover': { bgcolor: '#fff' },
              width: 36, height: 36,
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Backdrop>
  );
}
