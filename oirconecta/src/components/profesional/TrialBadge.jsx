/**
 * Badge de plan gratuito 120 días.
 * Lee trialEndsAt o subscription del profile y muestra días restantes.
 *
 * Variantes:
 *  - 'sidebar'  → pill compacta para el sidebar oscuro
 *  - 'card'     → card grande para dashboard/suscripcion
 */
import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { WorkspacePremiumOutlined } from '@mui/icons-material';

const TRIAL_DAYS = 120;

function daysLeft(trialEndsAt) {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt).getTime();
  const now = Date.now();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.ceil((end - now) / (24 * 3600 * 1000)));
}

function inferTrialEnd(profile) {
  if (!profile) return null;
  if (profile.trialEndsAt) return profile.trialEndsAt;
  // Fallback: si tenemos createdAt, asumimos 120 d desde el registro
  if (profile.createdAt) {
    const created = new Date(profile.createdAt);
    if (!Number.isNaN(created.getTime())) {
      created.setDate(created.getDate() + TRIAL_DAYS);
      return created.toISOString();
    }
  }
  return null;
}

export default function TrialBadge({ profile, variant = 'sidebar' }) {
  const trialEnd = inferTrialEnd(profile);
  const left = daysLeft(trialEnd);
  if (left == null) return null;

  const used = TRIAL_DAYS - left;
  const pct = Math.max(0, Math.min(100, (used / TRIAL_DAYS) * 100));
  const tone = left > 30 ? 'ok' : left > 7 ? 'warn' : 'danger';
  const colors = {
    ok:     { fg: '#6ee7c8', bg: 'rgba(110,231,200,0.12)', bar: '#10b981' },
    warn:   { fg: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  bar: '#f59e0b' },
    danger: { fg: '#fca5a5', bg: 'rgba(252,165,165,0.12)', bar: '#ef4444' },
  }[tone];

  const colorsLight = {
    ok:     { fg: '#047857', bg: '#ecfdf5',  bar: '#10b981' },
    warn:   { fg: '#b45309', bg: '#fffbeb',  bar: '#f59e0b' },
    danger: { fg: '#b91c1c', bg: '#fef2f2',  bar: '#ef4444' },
  }[tone];

  if (variant === 'sidebar') {
    return (
      <Box sx={{
        px: 1.5, py: 1.25, borderRadius: 1.5,
        bgcolor: colorsLight.bg, border: `1px solid ${colorsLight.fg}25`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          <WorkspacePremiumOutlined sx={{ fontSize: 13, color: colorsLight.fg }} />
          <Typography sx={{
            fontSize: 9.5, fontWeight: 700, color: colorsLight.fg,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Plan gratuito
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: colorsLight.fg, mb: 0.75, lineHeight: 1.2 }}>
          {left === 0 ? 'Vence hoy' : `${left} día${left === 1 ? '' : 's'} restantes`}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 4, borderRadius: 2, bgcolor: `${colorsLight.fg}15`,
            '& .MuiLinearProgress-bar': { bgcolor: colorsLight.bar, borderRadius: 2 },
          }}
        />
      </Box>
    );
  }

  // variant === 'card'
  return (
    <Box sx={{
      p: 1.5, borderRadius: 1.5, bgcolor: colorsLight.bg,
      border: `1px solid ${colorsLight.fg}25`,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
        <WorkspacePremiumOutlined sx={{ fontSize: 13, color: colorsLight.fg }} />
        <Typography sx={{
          fontSize: 9.5, fontWeight: 700, color: colorsLight.fg,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Plan gratuito · 120 d
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: colorsLight.fg, mb: 0.75, lineHeight: 1.2 }}>
        {left === 0 ? 'Vence hoy' : `${left} día${left === 1 ? '' : 's'} restantes`}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 4, borderRadius: 2, bgcolor: `${colorsLight.fg}15`,
          '& .MuiLinearProgress-bar': { bgcolor: colorsLight.bar, borderRadius: 2 },
        }}
      />
    </Box>
  );
}
