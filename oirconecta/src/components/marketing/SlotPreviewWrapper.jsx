/**
 * Wrapper visual de slot publicitario para modo preview.
 *
 * - Modo normal: renderiza children tal cual.
 * - Modo preview con campaña activa: borde verde + badge "ACTIVO".
 * - Modo preview sin campaña: placeholder dashed gris con etiqueta del slot.
 *
 * Uso típico:
 *   <SlotPreviewWrapper slotId="POPUP_BIENVENIDA" slotLabel="Pop-up bienvenida" active={!!camp}>
 *     {camp ? <CampaignRender ... /> : null}
 *   </SlotPreviewWrapper>
 */

import React, { useEffect, useRef } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { usePreviewMode, usePreviewFocusSlot } from '../../hooks/usePreviewMode';

const ACCENT = '#085946';

export default function SlotPreviewWrapper({
  slotId, slotLabel, active = false, children,
  minHeight = 120, inline = false,
}) {
  const preview = usePreviewMode();
  const focusSlot = usePreviewFocusSlot();
  const isFocused = !!slotId && !!focusSlot && slotId === focusSlot;
  const elRef = useRef(null);

  // Scroll automático al slot resaltado
  useEffect(() => {
    if (isFocused && elRef.current) {
      setTimeout(() => {
        elRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [isFocused]);

  // Sin preview: comportamiento normal (render directo, o nada si no hay activa)
  if (!preview) return active ? children : null;

  // Si hay un slot focused y NO somos ese slot → ocultar (el usuario solo quiere
  // ver el slot del card en el que hizo click).
  if (focusSlot && !isFocused) {
    return active ? children : null;
  }

  // Borde + chip — pulsa si es el slot focused
  const borderColor = isFocused ? ACCENT : (active ? ACCENT : '#cbd5e1');
  const borderWidth = isFocused ? 3 : (active ? 3 : 2);
  const borderStyle = active || isFocused ? 'solid' : 'dashed';
  const pulse = isFocused ? {
    animation: 'oc-pulse 1.6s ease-in-out infinite',
    '@keyframes oc-pulse': {
      '0%, 100%': { opacity: 1, boxShadow: `0 0 0 0 ${ACCENT}88` },
      '50%':      { opacity: 0.8, boxShadow: `0 0 0 6px ${ACCENT}00` },
    },
  } : {};

  // Modo preview + activo: render con overlay verde
  if (active) {
    return (
      <Box ref={elRef} sx={{ position: 'relative', display: inline ? 'inline-block' : 'block' }}>
        <Box sx={{
          position: 'absolute', inset: -3, borderRadius: '10px',
          border: `${borderWidth}px ${borderStyle} ${borderColor}`,
          pointerEvents: 'none', zIndex: 9998,
          ...pulse,
        }} />
        <Chip label={`${isFocused ? '⚡ ' : '✓ '}${active ? 'ACTIVO · ' : ''}${slotLabel || slotId}`} size="small"
          sx={{
            position: 'absolute', top: -14, left: 8, zIndex: 9999,
            bgcolor: ACCENT, color: '#fff', fontWeight: 800,
            fontSize: '0.65rem', height: 22, letterSpacing: '0.05em',
          }} />
        {children}
      </Box>
    );
  }

  // Modo preview + sin campaña: placeholder (con pulse si es focused)
  return (
    <Box ref={elRef} sx={{
      width: '100%', minHeight,
      border: `${borderWidth}px ${borderStyle} ${borderColor}`,
      borderRadius: '10px',
      bgcolor: isFocused ? '#ecfdf5' : '#f8fafc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 0.5,
      my: 1, position: 'relative',
      ...pulse,
    }}>
      {isFocused && (
        <Chip label={`⚡ ${slotLabel || slotId}`} size="small"
          sx={{ position: 'absolute', top: -12, left: 12,
            bgcolor: ACCENT, color: '#fff', fontWeight: 800, fontSize: '0.65rem', height: 22 }} />
      )}
      <Typography sx={{
        fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: isFocused ? ACCENT : '#94a3b8',
      }}>
        {isFocused ? 'Slot resaltado' : 'Slot vacío'}
      </Typography>
      <Typography sx={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
        {slotLabel || slotId}
      </Typography>
      <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
        {slotId}
      </Typography>
    </Box>
  );
}
