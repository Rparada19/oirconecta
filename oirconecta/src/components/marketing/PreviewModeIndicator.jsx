/**
 * Banda superior que aparece SOLO cuando preview_mode=true.
 * Sirve de aviso al admin de que está viendo el portal en modo debug.
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import { usePreviewMode, usePreviewFocusSlot } from '../../hooks/usePreviewMode';

export default function PreviewModeIndicator() {
  const preview = usePreviewMode();
  const focusSlot = usePreviewFocusSlot();
  if (!preview) return null;
  return (
    <Box sx={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
      bgcolor: '#fef3c7', borderBottom: '2px solid #f59e0b',
      px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1,
    }}>
      <VisibilityRoundedIcon sx={{ color: '#a16207', fontSize: 18 }} />
      <Typography sx={{ fontWeight: 800, color: '#92400e', fontSize: '0.8125rem' }}>
        {focusSlot
          ? `Vista previa enfocada en: ${focusSlot}`
          : 'Modo vista previa · slots vacíos visibles · solo admin'}
      </Typography>
    </Box>
  );
}
