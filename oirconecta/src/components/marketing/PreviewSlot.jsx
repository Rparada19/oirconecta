/**
 * Placeholder visible SOLO en preview_mode=true. Sirve para que el admin
 * vea en el iframe dónde irían slots todavía no implementados (sin
 * afectar la UX del visitante real).
 */

import React, { useEffect, useRef } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { usePreviewMode, usePreviewFocusSlot } from '../../hooks/usePreviewMode';

const ACCENT = '#085946';

export default function PreviewSlot({
  slotId, slotLabel, minHeight = 120, container = true,
}) {
  const preview = usePreviewMode();
  const focusSlot = usePreviewFocusSlot();
  const isFocused = !!slotId && slotId === focusSlot;
  const elRef = useRef(null);

  useEffect(() => {
    if (isFocused && elRef.current) {
      setTimeout(() => elRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
  }, [isFocused]);

  if (!preview) return null;

  // Si hay un slot focused y no somos ese, ocultamos para que el admin solo
  // vea el slot del card en el que hizo click.
  if (focusSlot && !isFocused) return null;

  return (
    <Box sx={{
      maxWidth: container ? 1200 : '100%',
      mx: container ? 'auto' : 0,
      px: container ? 2 : 0,
      my: 2,
    }}>
      <Box ref={elRef} sx={{
        width: '100%', minHeight,
        border: `${isFocused ? 3 : 2}px ${isFocused ? 'solid' : 'dashed'} ${isFocused ? ACCENT : '#cbd5e1'}`,
        borderRadius: '10px',
        bgcolor: isFocused ? '#ecfdf5' : '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 0.5,
        py: 2, position: 'relative',
        ...(isFocused ? {
          animation: 'oc-pulse 1.6s ease-in-out infinite',
          '@keyframes oc-pulse': {
            '0%, 100%': { boxShadow: `0 0 0 0 ${ACCENT}88` },
            '50%':      { boxShadow: `0 0 0 8px ${ACCENT}00` },
          },
        } : {}),
      }}>
        {isFocused && (
          <Chip label={`⚡ Slot resaltado`} size="small"
            sx={{ position: 'absolute', top: -12, left: 12,
              bgcolor: ACCENT, color: '#fff', fontWeight: 800, fontSize: '0.65rem', height: 22 }} />
        )}
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: isFocused ? ACCENT : '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {isFocused ? 'Slot protagonista' : 'Slot publicitario (preview)'}
        </Typography>
        <Typography sx={{ fontWeight: 700, color: '#475569', fontSize: '0.95rem' }}>
          {slotLabel || slotId}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
          {slotId}
        </Typography>
      </Box>
    </Box>
  );
}
