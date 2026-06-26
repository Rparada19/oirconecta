/**
 * Sección con título + contador + cuerpo. Usado para agrupar listas de acciones.
 */

import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { OC_COLORS } from '../../../theme';

export default function SectionBucket({ title, count, icon: Icon, tone = 'neutral', actions, children }) {
  const toneColor = ({
    danger: '#ef4444', warning: '#f59e0b', success: '#10b981',
    info: '#3b82f6', primary: OC_COLORS.verdeBienestar, neutral: OC_COLORS.grisMedio,
  })[tone] || OC_COLORS.grisMedio;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 1.5, mb: 1.25, px: 0.5,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {Icon && <Icon sx={{ fontSize: 17, color: toneColor }} />}
          <Typography sx={{
            fontSize: 13, fontWeight: 700,
            color: OC_COLORS.navyPrincipal, textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {title}
          </Typography>
          {typeof count === 'number' && (
            <Chip
              label={count}
              size="small"
              sx={{
                height: 18, fontSize: 10.5, fontWeight: 700,
                bgcolor: `${toneColor}1A`, color: toneColor, border: 'none',
                '& .MuiChip-label': { px: 0.875 },
              }}
            />
          )}
        </Box>
        {actions}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {children}
      </Box>
    </Box>
  );
}
