/**
 * Contenedor blanco con borde sutil para tablas y listas. Reemplaza el
 * glassmorphism con backdrop blur por algo más calmado y legible.
 */
import React from 'react';
import { Box } from '@mui/material';

export default function DataTableCard({ children, sx, padded = false }) {
  return (
    <Box sx={{
      bgcolor: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 2,
      overflow: 'hidden',
      ...(padded ? { p: { xs: 2, sm: 2.5 } } : {}),
      ...sx,
    }}>
      {children}
    </Box>
  );
}
