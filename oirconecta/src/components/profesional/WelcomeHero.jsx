/**
 * Hero del Dashboard del profesional. Banda con gradiente navy→verde
 * que da la bienvenida, anuncia días restantes del trial y resume el día.
 */
import React from 'react';
import { Box, Typography, Button, LinearProgress } from '@mui/material';
import { ArrowForward, WorkspacePremiumOutlined, VisibilityOutlined, MailOutlined } from '@mui/icons-material';

const TRIAL_DAYS = 120;

function daysLeft(profile) {
  if (!profile) return null;
  const end = profile.trialEndsAt
    ? new Date(profile.trialEndsAt)
    : profile.createdAt
      ? (() => { const d = new Date(profile.createdAt); d.setDate(d.getDate() + TRIAL_DAYS); return d; })()
      : null;
  if (!end || Number.isNaN(end.getTime())) return null;
  return Math.max(0, Math.ceil((end.getTime() - Date.now()) / (24 * 3600 * 1000)));
}

function firstName(profile) {
  const full = profile?.nombre || profile?.nombreConsultorio || '';
  return full.trim().split(/\s+/)[0] || 'Profesional';
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function WelcomeHero({ profile, stats, inquiriesNew = 0, onActivate }) {
  const left = daysLeft(profile);
  const pct = left != null ? Math.max(0, Math.min(100, ((TRIAL_DAYS - left) / TRIAL_DAYS) * 100)) : 0;
  const visMes = stats?.visitas?.mes ?? 0;

  return (
    <Box sx={{
      position: 'relative',
      borderRadius: 3,
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #272F50 0%, #1f3a6b 45%, #085946 100%)',
      color: '#fff',
      p: { xs: 2.5, sm: 3.25 },
      mb: 3,
    }}>
      {/* Decoración: círculos suaves */}
      <Box sx={{
        position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(110,231,200,0.20) 0%, rgba(110,231,200,0) 70%)',
        pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', right: 120, bottom: -80, width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(64,84,178,0.30) 0%, rgba(64,84,178,0) 70%)',
        pointerEvents: 'none',
      }} />

      <Box sx={{
        position: 'relative', display: 'flex', flexDirection: { xs: 'column', md: 'row' },
        gap: { xs: 2.5, md: 4 }, alignItems: { md: 'center' }, justifyContent: 'space-between',
      }}>
        {/* Saludo + trial */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.10em',
            textTransform: 'uppercase', color: 'rgba(110,231,200,0.95)', mb: 0.75,
          }}>
            {greeting()}
          </Typography>
          <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 800, lineHeight: 1.15, mb: 0.5 }}>
            Hola, {firstName(profile)}
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: 'rgba(255,255,255,0.80)', mb: 2 }}>
            {inquiriesNew > 0
              ? `Tienes ${inquiriesNew} consulta${inquiriesNew === 1 ? '' : 's'} sin responder y ${visMes} visita${visMes === 1 ? '' : 's'} al perfil este mes.`
              : `${visMes} visita${visMes === 1 ? '' : 's'} al perfil este mes. Comparte tu ficha para acelerar el crecimiento.`}
          </Typography>

          {left != null && (
            <Box sx={{ maxWidth: 420 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <WorkspacePremiumOutlined sx={{ fontSize: 16, color: '#6ee7c8' }} />
                <Typography sx={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: '#6ee7c8',
                }}>
                  Plan gratuito 120 días
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 0.75 }}>
                {left === 0 ? 'Vence hoy' : `${left} día${left === 1 ? '' : 's'} restantes`}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.15)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #6ee7c8 0%, #4054B2 100%)',
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          )}
        </Box>

        {/* CTA derecha */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, minWidth: { md: 200 } }}>
          {inquiriesNew > 0 && (
            <Button
              onClick={() => window.location.assign('/portal-profesional/consultas')}
              endIcon={<MailOutlined sx={{ fontSize: 16 }} />}
              sx={{
                bgcolor: '#fff', color: '#272F50', fontWeight: 700, textTransform: 'none',
                px: 2, py: 1, borderRadius: 1.5, fontSize: 13,
                '&:hover': { bgcolor: '#f3f4f6' },
              }}
            >
              Responder consultas
            </Button>
          )}
          <Button
            onClick={onActivate || (() => window.location.assign('/portal-profesional/suscripcion'))}
            endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
            sx={{
              bgcolor: 'rgba(255,255,255,0.12)',
              color: '#fff', fontWeight: 700, textTransform: 'none',
              px: 2, py: 1, borderRadius: 1.5, fontSize: 13,
              border: '1px solid rgba(255,255,255,0.25)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.20)' },
            }}
          >
            Ver planes
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
