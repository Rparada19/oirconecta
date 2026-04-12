import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Cabecera visual para tarjetas de marketing sin depender de /public/images.
 */
export default function MarketingCardMedia({ title, subtitle, icon: Icon, gradient }) {
  return (
    <Box
      sx={{
        width: '100%',
        height: 200,
        background: gradient || 'linear-gradient(135deg, #085946 0%, #71A095 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        px: 2,
        position: 'relative',
      }}
    >
      {Icon && <Icon sx={{ fontSize: 56, color: 'rgba(255,255,255,0.95)' }} />}
      <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, textAlign: 'center' }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', maxWidth: 280 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
