/**
 * Card de insight para el Dashboard. Va más allá de un número: interpreta
 * los datos y propone una acción concreta.
 *
 * Props:
 *  - tone: 'positive' | 'attention' | 'warning' | 'neutral'
 *  - icon: componente icono opcional
 *  - title: titular corto (qué pasa)
 *  - body: párrafo explicativo (qué significa)
 *  - actionLabel + onAction: CTA opcional ("Ver leads sin contactar")
 *  - metric: número grande opcional al lado del titular
 */
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { OC_COLORS } from '../../../theme';

const TONES = {
  positive:  { bar: '#10b981', metric: '#047857', bgIcon: 'rgba(16,185,129,0.10)' },
  attention: { bar: '#f59e0b', metric: '#b45309', bgIcon: 'rgba(245,158,11,0.10)' },
  warning:   { bar: '#ef4444', metric: '#b91c1c', bgIcon: 'rgba(239,68,68,0.10)' },
  neutral:   { bar: '#6b7280', metric: OC_COLORS.navyPrincipal, bgIcon: 'rgba(0,0,0,0.04)' },
};

export default function InsightCard({
  tone = 'neutral', icon: Icon, title, body, metric, actionLabel, onAction,
}) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column',
      bgcolor: '#fff', border: '1px solid #e5e7eb',
      borderLeft: `3px solid ${t.bar}`, borderRadius: 2,
      p: 2, height: '100%',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1 }}>
        {Icon && (
          <Box sx={{
            width: 32, height: 32, borderRadius: 1.5, flexShrink: 0,
            bgcolor: t.bgIcon, color: t.metric,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon sx={{ fontSize: 18 }} />
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            fontSize: 13.5, fontWeight: 700, color: OC_COLORS.navyPrincipal,
            lineHeight: 1.3,
          }}>
            {title}
          </Typography>
        </Box>
        {metric != null && (
          <Typography sx={{
            fontSize: 22, fontWeight: 700, color: t.metric, lineHeight: 1,
            fontVariantNumeric: 'tabular-nums', flexShrink: 0,
          }}>
            {metric}
          </Typography>
        )}
      </Box>
      <Typography sx={{
        fontSize: 12.5, color: OC_COLORS.grisMedio, lineHeight: 1.55, flex: 1,
      }}>
        {body}
      </Typography>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
          sx={{
            mt: 1.5, alignSelf: 'flex-start',
            color: OC_COLORS.verdeBienestar, fontWeight: 600, fontSize: 12.5,
            textTransform: 'none', px: 1, py: 0.25, minWidth: 0,
            '&:hover': { bgcolor: 'rgba(8,89,70,0.06)' },
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
