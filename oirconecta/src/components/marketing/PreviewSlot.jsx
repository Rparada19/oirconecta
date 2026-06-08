/**
 * Placeholder visible SOLO en preview_mode=true. Sirve para que el admin
 * vea en el iframe dónde irían slots todavía no implementados (sin
 * afectar la UX del visitante real).
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { usePreviewMode } from '../../hooks/usePreviewMode';

export default function PreviewSlot({
  slotId, slotLabel, minHeight = 120, container = true,
}) {
  const preview = usePreviewMode();
  if (!preview) return null;

  return (
    <Box sx={{
      maxWidth: container ? 1200 : '100%',
      mx: container ? 'auto' : 0,
      px: container ? 2 : 0,
      my: 2,
    }}>
      <Box sx={{
        width: '100%', minHeight,
        border: '2px dashed #cbd5e1',
        borderRadius: '10px',
        bgcolor: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 0.5,
        py: 2,
      }}>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Slot publicitario (preview)
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
