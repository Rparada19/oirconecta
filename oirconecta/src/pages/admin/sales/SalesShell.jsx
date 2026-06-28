/**
 * Estilos compartidos del CRM Sales en portal-admin.
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import { STATUS_META } from '../../../services/salesApi';

export const SALES_COLORS = {
  navy:    '#272F50',
  blue:    '#4054B2',
  green:   '#085946',
  ink:     '#0f1923',
  muted:   '#5b6b7a',
  bg:      '#f5f7fa',
  card:    '#fff',
  border:  '#e5e7eb',
};

export function SalesPageHeader({ icon: Icon, title, subtitle, actions = null }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 2, mb: 3, flexWrap: 'wrap',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minWidth: 0 }}>
        {Icon && (
          <Box sx={{
            width: 42, height: 42, borderRadius: 2,
            background: 'linear-gradient(135deg, #4054B2 0%, #085946 100%)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 2px 6px rgba(64,84,178,0.25)',
          }}>
            <Icon sx={{ fontSize: 22 }} />
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 800, color: SALES_COLORS.navy, letterSpacing: '-0.4px', lineHeight: 1.15 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: 13, color: SALES_COLORS.muted, mt: 0.25 }}>
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

export function StatusPill({ status, size = 'sm' }) {
  const m = STATUS_META[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  const dim = size === 'sm' ? { px: 0.875, py: 0.25, fs: 10.5 } : { px: 1.25, py: 0.5, fs: 12 };
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', borderRadius: 1,
      px: dim.px, py: dim.py, bgcolor: m.bg, color: m.color,
      fontSize: dim.fs, fontWeight: 700, letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      {m.label}
    </Box>
  );
}

export const softCard = {
  bgcolor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 2.5,
  boxShadow: '0 1px 3px rgba(15,23,35,0.04)',
};
