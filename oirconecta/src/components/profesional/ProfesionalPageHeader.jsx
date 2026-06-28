/**
 * Header estándar para todas las páginas del portal profesional.
 * Tono más sobrio que el del CRM: icono + título + subtítulo + acciones.
 */
import React from 'react';
import { Box, Typography } from '@mui/material';

const GREEN = '#085946';
const NAVY = '#041a12';

export default function ProfesionalPageHeader({ icon: Icon, title, subtitle, actions = null }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 2, mb: 3, flexWrap: 'wrap',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minWidth: 0 }}>
        {Icon && (
          <Box sx={{
            width: 42, height: 42, borderRadius: 2,
            bgcolor: 'rgba(8,89,70,0.10)', color: GREEN,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon sx={{ fontSize: 22 }} />
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{
            fontSize: { xs: 20, sm: 24 }, fontWeight: 800, color: NAVY,
            letterSpacing: '-0.4px', lineHeight: 1.15,
          }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{
              fontSize: 13, color: '#5b6b7a', mt: 0.25,
            }}>
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
