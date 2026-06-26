/**
 * Header estándar de cada página del CRM.
 * Reemplaza los heroes con gradiente verde de cada pantalla.
 *
 * Props:
 *   - title           string requerido
 *   - subtitle        string opcional
 *   - icon            componente icono opcional (a la izquierda)
 *   - actions         nodo opcional a la derecha (botones)
 *   - tone            'default' | 'subtle'  (default = blanco, subtle = sin borde)
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { OC_COLORS } from '../../../theme';

export default function PageHeader({ title, subtitle, icon: Icon, actions, tone = 'default' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
        px: { xs: 2.5, md: 4 },
        py: { xs: 2.5, md: 3 },
        bgcolor: '#fff',
        borderBottom: tone === 'subtle' ? 'none' : '1px solid #e5e7eb',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
        {Icon && (
          <Box sx={{
            width: 44, height: 44, borderRadius: 2, flexShrink: 0,
            bgcolor: 'rgba(8,89,70,0.08)', color: OC_COLORS.verdeBienestar,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon sx={{ fontSize: 22 }} />
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{
            fontSize: { xs: 18, md: 22 }, fontWeight: 700, color: OC_COLORS.navyPrincipal,
            lineHeight: 1.2, letterSpacing: '-0.01em',
          }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: 13.5, color: OC_COLORS.grisMedio, mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}
