import React, { useState } from 'react';
import { Box, Container, Typography, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { PlayArrow, Pause, ArrowForward } from '@mui/icons-material';
import { SoundWave } from '../brand/BrandMark';
import { useReveal } from '../../hooks/useReveal';

const C = {
  navy: '#272F50',
  verde: '#085946',
  verdeProfundo: '#00382B',
  oro: '#C9A86A',
  oroSuave: '#E0C28A',
  arena: '#D9CDBF',
  cremaCalida: '#F5EFE6',
  blanco: '#FBFAF8',
  gris: '#6B7280',
};

const LEVELS = [
  { id: 'normal', label: 'Normal', range: 'sana' },
  { id: 'leve', label: 'Leve', range: '20–40 dB' },
  { id: 'moderada', label: 'Moderada', range: '40–60 dB' },
  { id: 'severa', label: 'Severa', range: '60–90 dB' },
];

export default function HomePonteEnSusOidosSection() {
  const [hovered, setHovered] = useState('moderada');
  const { ref, visible } = useReveal({ threshold: 0.18 });

  return (
    <Box component="section" aria-label="Simulador de pérdida auditiva" sx={{
      position: 'relative', overflow: 'hidden',
      bgcolor: C.navy, color: '#fff',
      py: { xs: 9, md: 14 },
    }}>
      {/* Onda sonora animada de fondo */}
      <Box aria-hidden sx={{
        position: 'absolute', inset: 0, opacity: 0.55, pointerEvents: 'none',
        display: 'flex', alignItems: 'center',
      }}>
        <SoundWave width={1800} height={500} color={C.oroSuave} accent={C.oro} style={{ width: '100%', height: 'auto' }} />
      </Box>
      {/* Gradient para foco lateral */}
      <Box aria-hidden sx={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(90deg, ${C.navy}f5 0%, ${C.navy}aa 55%, transparent 100%)`,
        pointerEvents: 'none',
      }} />

      <Container maxWidth="lg" ref={ref} sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{
          display: 'grid', gridTemplateColumns: { xs: '1fr', md: '6fr 5fr' },
          gap: { xs: 6, md: 8 }, alignItems: 'center',
        }}>
          {/* Texto editorial */}
          <Box sx={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'all 0.95s cubic-bezier(0.2,0.7,0.2,1)',
          }}>
            <Stack direction="row" alignItems="center" spacing={1.75} sx={{ mb: 3 }}>
              <Box sx={{ width: 36, height: 2, bgcolor: C.oro }} />
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.24em',
                textTransform: 'uppercase', color: C.oro,
              }}>
                Experiencia sonora · Estreno
              </Typography>
            </Stack>

            <Typography component="h2" sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '2.4rem', sm: '3rem', md: '4rem', lg: '4.4rem' },
              fontWeight: 500, lineHeight: 1, letterSpacing: '-0.025em',
              mb: 3,
            }}>
              Esto es lo{' '}
              <Box component="span" sx={{ fontStyle: 'italic', color: C.arena }}>
                que escuchan
              </Box>
              <br />
              tus seres queridos.
            </Typography>

            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: '1.05rem', md: '1.2rem' }, lineHeight: 1.55,
              color: '#ffffffb3', mb: 4.5, maxWidth: 540,
            }}>
              Una herramienta interactiva con ocho escenas cotidianas y cuatro
              niveles de pérdida procesados en vivo. Cuando lo viven, lo entienden.
            </Typography>

            {/* CTA editorial */}
            <Box
              component={RouterLink}
              to="/ponte-en-sus-oidos"
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1.25,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '1rem', fontWeight: 700, color: '#fff',
                textDecoration: 'none', pb: 0.5,
                borderBottom: `2px solid ${C.oro}`,
                transition: 'gap 0.3s ease, color 0.3s ease',
                '&:hover': { gap: 2, color: C.oro },
              }}
            >
              Probar la experiencia
              <ArrowForward sx={{ fontSize: 20 }} />
            </Box>
          </Box>

          {/* Player flotante con niveles */}
          <Box sx={{
            position: 'relative',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(36px)',
            transition: 'all 1.1s cubic-bezier(0.2,0.7,0.2,1) 0.2s',
          }}>
            {/* Tarjeta player principal */}
            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px', p: { xs: 3, md: 3.5 },
              boxShadow: `0 24px 60px ${C.navy}66`,
            }}>
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: '#ffffff66', mb: 1,
              }}>
                Escena actual
              </Typography>
              <Typography sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '1.4rem', fontWeight: 600, color: '#fff', mb: 2.5,
              }}>
                Cena con la familia
              </Typography>

              {/* Botón play visual */}
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Box sx={{
                  width: 52, height: 52, borderRadius: '50%',
                  bgcolor: C.oro, color: C.navy,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  '&:hover': { transform: 'scale(1.08)' },
                  animation: 'oc-pulse 2.4s ease-in-out infinite',
                  '@keyframes oc-pulse': {
                    '0%, 100%': { boxShadow: `0 0 0 0 ${C.oro}80` },
                    '50%': { boxShadow: `0 0 0 14px ${C.oro}00` },
                  },
                }}>
                  <PlayArrow sx={{ fontSize: 28 }} />
                </Box>
                {/* Barras de audio fake animadas */}
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: 32 }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Box key={i} sx={{
                      width: 3, bgcolor: '#fff', borderRadius: '999px',
                      animation: `oc-bar-${i % 3} ${0.9 + (i % 3) * 0.3}s ease-in-out infinite`,
                      animationDelay: `${i * 0.07}s`,
                      '@keyframes oc-bar-0': {
                        '0%, 100%': { height: 6 }, '50%': { height: 22 },
                      },
                      '@keyframes oc-bar-1': {
                        '0%, 100%': { height: 10 }, '50%': { height: 30 },
                      },
                      '@keyframes oc-bar-2': {
                        '0%, 100%': { height: 14 }, '50%': { height: 26 },
                      },
                    }} />
                  ))}
                </Stack>
              </Stack>

              {/* Niveles seleccionables */}
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em',
                textTransform: 'uppercase', color: '#ffffff66', mb: 1.25,
              }}>
                Nivel de pérdida
              </Typography>
              <Stack spacing={1}>
                {LEVELS.map((l) => {
                  const active = l.id === hovered;
                  return (
                    <Stack
                      key={l.id}
                      direction="row" justifyContent="space-between" alignItems="center"
                      onMouseEnter={() => setHovered(l.id)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: active ? C.oro : 'rgba(255,255,255,0.04)',
                        color: active ? C.navy : '#fff',
                        borderRadius: '8px', px: 2, py: 1.25,
                        transition: 'all 0.3s cubic-bezier(0.2,0.7,0.2,1)',
                      }}
                    >
                      <Typography sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: '0.92rem', fontWeight: 700,
                      }}>{l.label}</Typography>
                      <Typography sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontSize: '0.75rem', opacity: active ? 0.7 : 0.55,
                      }}>{l.range}</Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>

            {/* Tag flotante */}
            <Box sx={{
              position: 'absolute', top: -16, right: -16,
              bgcolor: C.oro, color: C.navy,
              px: 2, py: 0.75, borderRadius: '4px',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
              boxShadow: `0 12px 24px ${C.navy}99`,
              transform: 'rotate(2deg)',
            }}>
              En vivo · Web Audio
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
