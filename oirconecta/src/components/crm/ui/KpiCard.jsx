/**
 * Tarjeta de métrica compacta. Mucho menos ruido visual que un Card de MUI.
 * tone controla el color del borde lateral.
 *
 * Tonos: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'violet'
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { OC_COLORS } from '../../../theme';

const TONES = {
  neutral: { bar: OC_COLORS.grisClaro, num: OC_COLORS.navyPrincipal },
  success: { bar: '#10b981', num: '#065f46' },
  warning: { bar: '#f59e0b', num: '#92400e' },
  danger:  { bar: '#ef4444', num: '#991b1b' },
  info:    { bar: '#3b82f6', num: '#1e40af' },
  violet:  { bar: '#8b5cf6', num: '#5b21b6' },
};

export default function KpiCard({ label, value, hint, tone = 'neutral', onClick }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <Box
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick(); }}
      sx={{
        flex: '1 1 160px',
        minWidth: 140,
        bgcolor: '#fff',
        border: '1px solid #e5e7eb',
        borderLeft: `3px solid ${t.bar}`,
        borderRadius: 2,
        px: 2,
        py: 1.75,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 120ms ease, transform 120ms ease',
        '&:hover': onClick ? { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } : {},
      }}
    >
      <Typography sx={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
        textTransform: 'uppercase', color: OC_COLORS.grisMedio,
      }}>
        {label}
      </Typography>
      <Typography sx={{
        fontSize: 26, fontWeight: 700, color: t.num, lineHeight: 1.2, mt: 0.25,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value ?? '—'}
      </Typography>
      {hint && (
        <Typography sx={{ fontSize: 11.5, color: OC_COLORS.grisMedio, mt: 0.25 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}
