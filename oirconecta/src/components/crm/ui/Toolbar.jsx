/**
 * Fila de filtros + acciones al estilo CRM moderno.
 * left   = filtros (search, select)
 * right  = acciones (botones)
 */
import React from 'react';
import { Box } from '@mui/material';

export default function Toolbar({ left, right, children, sx }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap',
      mb: 2, ...sx,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, flexWrap: 'wrap' }}>
        {left || children}
      </Box>
      {right && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {right}
        </Box>
      )}
    </Box>
  );
}
