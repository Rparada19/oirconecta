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

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { usePreviewMode } from '../../hooks/usePreviewMode';

const ACCENT = '#085946';

export default function SlotPreviewWrapper({
  slotId, slotLabel, active = false, children,
  minHeight = 120, inline = false,
}) {
  const preview = usePreviewMode();

  // Sin preview: comportamiento normal (render directo, o nada si no hay activa)
  if (!preview) return active ? children : null;

  // Modo preview + activo: render con overlay verde
  if (active) {
    return (
      <Box sx={{ position: 'relative', display: inline ? 'inline-block' : 'block' }}>
        <Box sx={{
          position: 'absolute', inset: -3, borderRadius: '10px',
          border: `3px solid ${ACCENT}`, pointerEvents: 'none', zIndex: 9998,
        }} />
        <Chip label={`✓ ACTIVO · ${slotLabel || slotId}`} size="small"
          sx={{
            position: 'absolute', top: -14, left: 8, zIndex: 9999,
            bgcolor: ACCENT, color: '#fff', fontWeight: 800,
            fontSize: '0.65rem', height: 22, letterSpacing: '0.05em',
          }} />
        {children}
      </Box>
    );
  }

  // Modo preview + sin campaña: placeholder
  return (
    <Box sx={{
      width: '100%', minHeight,
      border: '2px dashed #cbd5e1',
      borderRadius: '10px',
      bgcolor: '#f8fafc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 0.5,
      my: 1,
    }}>
      <Typography sx={{
        fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: '#94a3b8',
      }}>
        Slot vacío
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
