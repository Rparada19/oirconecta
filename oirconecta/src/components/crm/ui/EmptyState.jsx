/**
 * Estado vacío con icono, mensaje y opcionalmente un CTA. Cuando no hay datos.
 */

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { OC_COLORS } from '../../../theme';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  tone = 'neutral',
}) {
  const toneColor = tone === 'success' ? '#10b981' : OC_COLORS.grisClaro;
  return (
    <Box sx={{
      textAlign: 'center', py: 5, px: 3,
      border: '1px dashed #e5e7eb', borderRadius: 2, bgcolor: '#fafbfc',
    }}>
      {Icon && (
        <Box sx={{
          width: 52, height: 52, mx: 'auto', mb: 1.5,
          borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: toneColor,
        }}>
          <Icon sx={{ fontSize: 26 }} />
        </Box>
      )}
      <Typography sx={{ fontWeight: 600, fontSize: 14.5, color: OC_COLORS.navyPrincipal }}>
        {title}
      </Typography>
      {description && (
        <Typography sx={{ fontSize: 13, color: OC_COLORS.grisMedio, mt: 0.5, maxWidth: 380, mx: 'auto' }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="outlined"
          sx={{
            mt: 2, color: OC_COLORS.verdeBienestar,
            borderColor: 'rgba(8,89,70,0.5)', fontWeight: 600,
            '&:hover': { borderColor: OC_COLORS.verdeBienestar, bgcolor: 'rgba(8,89,70,0.05)' },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
