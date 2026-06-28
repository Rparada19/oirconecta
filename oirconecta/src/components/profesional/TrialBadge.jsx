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

  if (variant === 'sidebar') {
    return (
      <Box sx={{
        mx: 2, mb: 1.5, px: 1.5, py: 1.25, borderRadius: 1.5,
        bgcolor: colors.bg, border: `1px solid ${colors.fg}40`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
          <WorkspacePremiumOutlined sx={{ fontSize: 14, color: colors.fg }} />
          <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: colors.fg, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Plan gratuito
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#e2f5f0', mb: 0.5 }}>
          {left === 0 ? 'Hoy vence' : `${left} día${left === 1 ? '' : 's'} restantes`}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)',
            '& .MuiLinearProgress-bar': { bgcolor: colors.bar, borderRadius: 2 },
          }}
        />
      </Box>
    );
  }

  // variant === 'card'
  return (
    <Box sx={{
      p: 2, borderRadius: 2, bgcolor: '#fff',
      border: `1px solid ${colors.fg}55`, borderLeft: `4px solid ${colors.bar}`,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
        <WorkspacePremiumOutlined sx={{ fontSize: 18, color: colors.bar }} />
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#085946', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Plan gratuito 120 días
        </Typography>
      </Box>
      <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#041a12', lineHeight: 1 }}>
        {left === 0 ? 'Vence hoy' : `${left} ${left === 1 ? 'día' : 'días'} restantes`}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          mt: 1.25, height: 5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.06)',
          '& .MuiLinearProgress-bar': { bgcolor: colors.bar, borderRadius: 2 },
        }}
      />
      <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.75 }}>
        Disfruta todas las funciones sin tarjeta. Activa tu plan antes para no perder visibilidad.
      </Typography>
    </Box>
  );
}
