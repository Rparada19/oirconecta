import React from 'react';
import { Box, Container, Typography, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowForward, VerifiedOutlined, FavoriteBorderOutlined, GroupsOutlined } from '@mui/icons-material';
import { Swoosh } from './brand/BrandMark';
import { useReveal } from '../hooks/useReveal';

const C = {
  navy: '#272F50',
  verde: '#085946',
  oro: '#C9A86A',
  oroSuave: '#E0C28A',
  arena: '#D9CDBF',
  cremaCalida: '#F5EFE6',
  blanco: '#FBFAF8',
  gris: '#6B7280',
  grisClaro: '#A1A7B1',
};

const HERO_IMAGE = '/img/familia-disfrutando-mejor-audicion.jpg';

const TRUST = [
  { Icon: VerifiedOutlined, label: 'Profesionales verificados' },
  { Icon: FavoriteBorderOutlined, label: 'Acompañamiento humano' },
  { Icon: GroupsOutlined, label: 'Red nacional' },
];

export default function Hero() {
  const t = useReveal({ threshold: 0.1 });
  const i = useReveal({ threshold: 0.15 });

  return (
    <Box component="section" aria-label="Hero principal de OírConecta" sx={{
      position: 'relative', overflow: 'hidden',
      bgcolor: C.blanco, color: C.navy,
      pt: { xs: 12, md: 14 }, pb: { xs: 0, md: 0 },
      minHeight: { md: '92vh' },
      display: 'flex', alignItems: 'center',
    }}>
      {/* Swoosh signature gigante de fondo */}
      <Box aria-hidden sx={{
        position: 'absolute', top: { xs: '50%', md: '8%' }, left: { xs: -180, md: -120 },
        width: { xs: 520, md: 760 }, opacity: 0.06, pointerEvents: 'none',
        transform: t.visible ? 'translateY(0) rotate(-8deg)' : 'translateY(40px) rotate(-12deg)',
        transition: 'transform 1.4s cubic-bezier(0.2,0.7,0.2,1)',
      }}>
        <Swoosh width="100%" color={C.navy} accent={C.oro} />
      </Box>

      {/* Línea vertical decorativa estilo editorial */}
      <Box aria-hidden sx={{
        position: 'absolute', top: 0, bottom: 0, left: '50%',
        width: 1, bgcolor: `${C.navy}0a`, display: { xs: 'none', md: 'block' },
      }} />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
          alignItems: 'center',
          gap: { xs: 6, md: 0 },
        }}>
          {/* COLUMNA TEXTO */}
          <Box ref={t.ref} sx={{
            pr: { md: 8 }, pl: { md: 2 },
            opacity: t.visible ? 1 : 0,
            transform: t.visible ? 'translateY(0)' : 'translateY(28px)',
            transition: 'all 0.9s cubic-bezier(0.2,0.7,0.2,1)',
          }}>
            {/* Número de capítulo editorial */}
            <Stack direction="row" spacing={2} alignItems="baseline" sx={{ mb: 4 }}>
              <Typography sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '0.95rem', fontWeight: 600, color: C.oro,
                fontStyle: 'italic',
              }}>
                — Edición №01
              </Typography>
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.7rem', letterSpacing: '0.28em', fontWeight: 700,
                textTransform: 'uppercase', color: C.navy,
              }}>
                Salud auditiva, sin presión
              </Typography>
            </Stack>

            {/* Headline gigante */}
            <Typography component="h1" sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '3rem', sm: '3.75rem', md: '4.75rem', lg: '5.75rem' },
              fontWeight: 500, lineHeight: 0.98,
              letterSpacing: '-0.025em',
              color: C.navy,
              mb: { xs: 3, md: 4 },
            }}>
              Tu vida{' '}
              <Box component="span" sx={{ color: C.gris }}>con</Box>{' '}
              <Box component="span" sx={{
                display: 'inline-block', position: 'relative',
                fontStyle: 'italic', color: C.verde, fontWeight: 500,
              }}>
                una mejor
                {/* Subrayado oro a mano alzada */}
                <Box aria-hidden sx={{
                  position: 'absolute', left: '-2%', right: '-2%', bottom: '-0.04em',
                  height: '0.18em',
                  background: `linear-gradient(180deg, transparent 35%, ${C.oroSuave}80 35%)`,
                  zIndex: -1, borderRadius: '999px',
                }} />
              </Box>{' '}
              <Box component="span" sx={{ fontStyle: 'italic', color: C.verde, fontWeight: 500 }}>
                audición.
              </Box>
            </Typography>

            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: '1.125rem', md: '1.3125rem' }, lineHeight: 1.55,
              color: C.gris, mb: { xs: 4, md: 5 }, maxWidth: 580, fontWeight: 400,
            }}>
              Encuentra especialistas, centros auditivos y soluciones confiables.
              Sin presión, sin marketing — solo personas cuidando personas.
            </Typography>

            {/* CTA editorial: enlace con flecha en vez de botón pesado */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} alignItems={{ sm: 'center' }} sx={{ mb: { xs: 5, md: 7 } }}>
              <Box
                component={RouterLink}
                to="/directorio/listado"
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '1.05rem', fontWeight: 700,
                  color: C.navy, textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 1.25,
                  position: 'relative', pb: 0.5,
                  borderBottom: `2px solid ${C.navy}`,
                  transition: 'gap 0.3s ease, color 0.3s ease',
                  '&:hover': { gap: 2, color: C.verde, borderColor: C.verde },
                }}
              >
                Buscar especialista
                <ArrowForward sx={{ fontSize: 20 }} />
              </Box>
              <Box
                component={RouterLink}
                to="/ponte-en-sus-oidos"
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.95rem', fontWeight: 600,
                  color: C.gris, textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: 1,
                  '&:hover': { color: C.navy },
                }}
              >
                Probar el simulador de audición →
              </Box>
            </Stack>

            {/* Trust en columna separada por divisores */}
            <Stack direction="row" spacing={{ xs: 2, md: 4 }} divider={<Box sx={{ width: 1, bgcolor: `${C.navy}22` }} />} sx={{
              flexWrap: 'wrap', rowGap: 2,
            }}>
              {TRUST.map(({ Icon, label }) => (
                <Stack key={label} direction="row" spacing={1.25} alignItems="center">
                  <Icon sx={{ fontSize: 18, color: C.verde }} />
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.825rem', fontWeight: 600, color: C.navy,
                  }}>
                    {label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* COLUMNA IMAGEN — sangra al borde derecho */}
          <Box ref={i.ref} sx={{
            position: 'relative',
            height: { xs: 460, sm: 540, md: '88vh' },
            maxHeight: { md: 820 },
            mx: { xs: -3, md: 0 },
            mr: { md: 'calc(-1 * (100vw - 100%) / 2 - 0px)' },
            overflow: 'hidden',
          }}>
            <Box
              component="img"
              src={HERO_IMAGE}
              alt="Familia disfrutando momentos juntos gracias a una mejor audición"
              loading="eager"
              decoding="async"
              fetchpriority="high"
              sx={{
                width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                transform: i.visible ? 'scale(1)' : 'scale(1.08)',
                transition: 'transform 1.6s cubic-bezier(0.2,0.7,0.2,1)',
              }}
            />
            {/* Gradient inferior para legibilidad de la stat card */}
            <Box aria-hidden sx={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(180deg, transparent 55%, ${C.navy}aa 100%)`,
            }} />

            {/* Stat card flotante estilo Widex */}
            <Box sx={{
              position: 'absolute', left: { xs: 16, md: 32 }, bottom: { xs: 16, md: 32 },
              bgcolor: C.blanco, color: C.navy,
              borderRadius: '12px', px: { xs: 2.5, md: 3.5 }, py: { xs: 2, md: 2.5 },
              boxShadow: `0 24px 64px ${C.navy}33`,
              maxWidth: 340,
              opacity: i.visible ? 1 : 0,
              transform: i.visible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 1s cubic-bezier(0.2,0.7,0.2,1) 0.4s',
            }}>
              <Stack direction="row" spacing={2.5} alignItems="center">
                <Typography sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: { xs: '2.25rem', md: '3rem' }, fontWeight: 700,
                  color: C.navy, lineHeight: 1,
                }}>
                  98<Box component="span" sx={{ color: C.oro, fontSize: '0.6em' }}>%</Box>
                </Typography>
                <Box>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.85rem', fontWeight: 700, color: C.navy, lineHeight: 1.25,
                  }}>
                    de quienes adaptan audífonos mejoran su calidad de vida
                  </Typography>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.65rem', color: C.gris, mt: 0.5, letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    Lancet Commission, 2024
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* Tag editorial sobre la imagen */}
            <Box sx={{
              position: 'absolute', top: { xs: 16, md: 32 }, right: { xs: 16, md: 32 },
              bgcolor: 'rgba(255,255,255,0.92)', color: C.navy,
              px: 2, py: 0.75, borderRadius: '4px',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
            }}>
              Historia real
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
