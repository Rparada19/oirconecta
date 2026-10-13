import React, { useEffect, useRef, useState } from 'react';
import { Box, Container, Typography, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  ArrowForward, VerifiedOutlined, FavoriteBorderOutlined, GroupsOutlined,
  HeadphonesOutlined, StarRounded,
} from '@mui/icons-material';

const C = {
  deep: '#141C3F',
  navy: '#1B2550',
  azul: '#4054B2',
  electric: '#5B7BFF',
  cielo: '#9DB8FF',
  blanco: '#FFFFFF',
};
const F = '"Gotham", "Helvetica", "Arial", sans-serif';

const HERO_IMAGE = '/img/familia-disfrutando-mejor-audicion.jpg';
const WORDS = ['las risas de tu familia.', 'cada conversación.', 'tu música favorita.', 'los sonidos de tu ciudad.'];
const TRUST = [
  { Icon: VerifiedOutlined, label: 'Profesionales verificados' },
  { Icon: FavoriteBorderOutlined, label: 'Acompañamiento humano' },
  { Icon: GroupsOutlined, label: 'Red nacional' },
];
const WAVE = [0.4, 0.75, 1, 0.6, 0.9, 0.5, 0.8, 0.35, 0.7, 1, 0.55, 0.85, 0.45, 0.65];
const MARQUEE = ['Audiología', 'Otorrinolaringología', 'Fonoaudiología', 'Otología', 'Bogotá', 'Medellín', 'Cali',
  'Barranquilla', 'Implantes cocleares', 'Valoración auditiva', 'Teleconsulta', 'Acompañamiento posadaptación'];

function useRotatingWord(list, ms = 2600) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % list.length), ms);
    return () => clearInterval(id);
  }, [list.length, ms]);
  return [list[i], i];
}

/* Parallax suave con el mouse (solo puntero fino, respeta reduced-motion) */
function useParallax() {
  const ref = useRef(null);
  const [p, setP] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || !window.matchMedia('(pointer: fine)').matches) return undefined;
    let raf = 0;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setP({ x, y }));
    };
    const onLeave = () => setP({ x: 0, y: 0 });
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);
  return [ref, p];
}

const glass = {
  bgcolor: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.22)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  borderRadius: '18px',
  color: C.blanco,
  boxShadow: '0 24px 60px rgba(8,12,40,0.35)',
};

export default function Hero() {
  const [word, wi] = useRotatingWord(WORDS);
  const [ref, p] = useParallax();
  const move = (k) => ({ transform: `translate3d(${p.x * k}px, ${p.y * k}px, 0)`, transition: 'transform 0.4s ease-out' });

  return (
    <Box
      component="section"
      ref={ref}
      aria-label="Hero principal de OírConecta"
      sx={{
        position: 'relative', overflow: 'hidden', color: C.blanco,
        background: `radial-gradient(1200px 600px at 85% 10%, ${C.azul}66 0%, transparent 60%),
                     radial-gradient(900px 500px at 0% 100%, ${C.electric}40 0%, transparent 55%),
                     linear-gradient(160deg, ${C.deep} 0%, ${C.navy} 55%, #22307A 100%)`,
        pt: { xs: 7, md: 8 },
      }}
    >
      {/* Malla de puntos */}
      <Box aria-hidden sx={{
        position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(157,184,255,0.55) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        maskImage: 'linear-gradient(180deg, #000 0%, transparent 85%)',
        WebkitMaskImage: 'linear-gradient(180deg, #000 0%, transparent 85%)',
      }} />
      {/* Orbes animados */}
      <Box aria-hidden sx={{
        position: 'absolute', width: 420, height: 420, borderRadius: '50%', top: -120, left: '38%',
        background: `radial-gradient(circle, ${C.electric}55, transparent 70%)`, filter: 'blur(20px)',
        animation: 'oc-float-slow 14s ease-in-out infinite',
      }} />
      <Box aria-hidden sx={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%', bottom: 40, left: -80,
        background: `radial-gradient(circle, ${C.cielo}40, transparent 70%)`, filter: 'blur(16px)',
        animation: 'oc-float-slow 18s ease-in-out infinite reverse',
      }} />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
          alignItems: 'center', gap: { xs: 6, md: 4 },
          minHeight: { md: 'calc(88vh - 80px)' },
        }}>
          {/* TEXTO */}
          <Box sx={{ animation: 'oc-word-in 0.9s cubic-bezier(0.2,0.7,0.2,1) both', pl: { md: 2 } }}>
            <Stack direction="row" alignItems="center" spacing={1.25} sx={{
              display: 'inline-flex', px: 1.75, py: 0.75, mb: 4, borderRadius: 999,
              bgcolor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)',
            }}>
              <Box sx={{ position: 'relative', width: 8, height: 8 }}>
                <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', bgcolor: C.cielo }} />
                <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', bgcolor: C.cielo, animation: 'oc-ring 1.8s ease-out infinite' }} />
              </Box>
              <Typography sx={{ fontFamily: F, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                Salud auditiva, sin presión
              </Typography>
            </Stack>

            <Typography component="h1" sx={{
              fontFamily: F, fontWeight: 300, color: C.blanco,
              fontSize: { xs: '2.9rem', sm: '3.6rem', md: '4.4rem', lg: '5.3rem' },
              lineHeight: 1.0, letterSpacing: '-0.035em', mb: 3,
            }}>
              Tu vida con una{' '}
              <Box component="span" sx={{
                fontWeight: 800,
                background: `linear-gradient(90deg, ${C.blanco} 0%, ${C.cielo} 60%, ${C.electric} 100%)`,
                WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
              }}>
                mejor audición.
              </Box>
            </Typography>

            <Typography aria-live="polite" sx={{
              fontFamily: F, fontSize: { xs: '1.15rem', md: '1.4rem' }, fontWeight: 400,
              color: 'rgba(255,255,255,0.78)', mb: 1, minHeight: '1.6em',
            }}>
              Vuelve a disfrutar{' '}
              <Box key={wi} component="span" sx={{
                display: 'inline-block', fontWeight: 700, color: C.blanco,
                animation: 'oc-word-in 0.6s cubic-bezier(0.2,0.7,0.2,1) both',
              }}>
                {word}
              </Box>
            </Typography>
            <Typography sx={{
              fontFamily: F, fontSize: { xs: '1rem', md: '1.05rem' }, lineHeight: 1.65,
              color: 'rgba(255,255,255,0.66)', mb: { xs: 4, md: 5 }, maxWidth: 540,
            }}>
              Encuentra especialistas, centros auditivos y soluciones confiables.
              Sin presión, solo personas cuidando personas.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: { xs: 5, md: 6 } }}>
              <Box component={RouterLink} to="/directorio/listado" sx={{
                fontFamily: F, fontSize: '1rem', fontWeight: 700, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1.25,
                bgcolor: C.blanco, color: C.navy, px: 3.5, py: 1.75, borderRadius: 999,
                boxShadow: `0 14px 40px ${C.electric}55`,
                transition: 'transform 0.25s ease, box-shadow 0.25s ease, gap 0.25s ease',
                '&:hover': { transform: 'translateY(-2px)', gap: 2, boxShadow: `0 20px 50px ${C.electric}80` },
              }}>
                Buscar especialista <ArrowForward sx={{ fontSize: 20 }} />
              </Box>
              <Box component={RouterLink} to="/ponte-en-sus-oidos/" sx={{
                fontFamily: F, fontSize: '1rem', fontWeight: 600, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 1.25,
                color: C.blanco, px: 3.5, py: 1.75, borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.35)',
                transition: 'background 0.25s ease, border-color 0.25s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.10)', borderColor: C.blanco },
              }}>
                <HeadphonesOutlined sx={{ fontSize: 20 }} /> Probar el simulador
              </Box>
            </Stack>

            <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', columnGap: { xs: 2.5, md: 3.5 }, rowGap: 1.5 }}>
              {TRUST.map(({ Icon, label }) => (
                <Stack key={label} direction="row" spacing={1} alignItems="center">
                  <Icon sx={{ fontSize: 18, color: C.cielo }} />
                  <Typography sx={{ fontFamily: F, fontSize: '0.82rem', fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>
                    {label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* VISUAL */}
          <Box sx={{ position: 'relative', height: { xs: 420, sm: 520, md: 600 }, mx: { xs: 'auto', md: 0 }, width: '100%', maxWidth: 640 }}>
            {/* Anillos de pulso */}
            {[0, 1, 2].map((k) => (
              <Box key={k} aria-hidden sx={{
                position: 'absolute', left: '11%', top: '50%', width: '78%', aspectRatio: '1',
                transform: 'translateY(-50%)', pointerEvents: 'none',
              }}>
                <Box sx={{
                  width: '100%', height: '100%', borderRadius: '50%', border: `1.5px solid ${C.cielo}`,
                  animation: `oc-ring 4.5s ease-out ${k * 1.5}s infinite`,
                }} />
              </Box>
            ))}

            {/* Imagen en blob animado */}
            <Box sx={{ position: 'absolute', top: '6%', bottom: '6%', left: '6%', right: '6%', ...move(-14) }}>
              <Box sx={{
                position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
                animation: 'oc-blob 16s ease-in-out infinite',
                boxShadow: '0 40px 100px rgba(5,10,40,0.55), 0 0 0 10px rgba(255,255,255,0.06)',
              }}>
                <Box component="img" src={HERO_IMAGE}
                  alt="Familia disfrutando momentos juntos gracias a una mejor audición"
                  loading="eager" decoding="async" fetchpriority="high"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scale(1.06)' }} />
                <Box aria-hidden sx={{ position: 'absolute', inset: 0, background: `linear-gradient(200deg, transparent 40%, ${C.navy}99 100%)` }} />
              </Box>
            </Box>

            {/* Card: onda sonora */}
            <Box sx={{ position: 'absolute', top: { xs: '2%', md: '8%' }, left: { xs: 0, md: '-6%' }, ...move(22) }}>
              <Box sx={{ ...glass, px: 2.25, py: 1.75, animation: 'oc-float 6s ease-in-out infinite' }}>
                <Typography sx={{ fontFamily: F, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.cielo, mb: 1 }}>
                  Escucha en vivo
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ height: 34 }} aria-hidden>
                  {WAVE.map((h, k) => (
                    <Box key={k} sx={{
                      width: 4, height: `${h * 100}%`, borderRadius: 4,
                      background: `linear-gradient(180deg, ${C.blanco}, ${C.cielo})`,
                      transformOrigin: 'center',
                      animation: `oc-wave ${0.9 + (k % 4) * 0.18}s ease-in-out ${k * 0.07}s infinite`,
                    }} />
                  ))}
                </Stack>
              </Box>
            </Box>

            {/* Card: dato OMS */}
            <Box sx={{ position: 'absolute', bottom: { xs: '3%', md: '9%' }, left: { xs: 0, md: '-8%' }, ...move(30) }}>
              <Box sx={{
                ...glass, bgcolor: 'rgba(255,255,255,0.95)', color: C.navy, px: 2.75, py: 2.25, maxWidth: 300,
                animation: 'oc-float 7s ease-in-out 1s infinite',
              }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography sx={{ fontFamily: F, fontSize: '2.3rem', fontWeight: 800, color: C.azul, lineHeight: 1, letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>
                    1<Box component="span" sx={{ fontSize: '0.5em', fontWeight: 500, color: C.navy, mx: 0.5 }}>de</Box>5
                  </Typography>
                  <Box>
                    <Typography sx={{ fontFamily: F, fontSize: '0.84rem', fontWeight: 700, lineHeight: 1.3 }}>
                      personas en el mundo vive con pérdida auditiva
                    </Typography>
                    <Typography sx={{ fontFamily: F, fontSize: '0.62rem', color: '#6B7280', mt: 0.5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      OMS · Informe mundial sobre la audición
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>

            {/* Chip: verificados */}
            <Box sx={{ position: 'absolute', top: { xs: '42%', md: '30%' }, right: { xs: 0, md: '-2%' }, ...move(-26) }}>
              <Box sx={{
                ...glass, bgcolor: 'rgba(20,28,63,0.72)', px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.25,
                animation: 'oc-float 8s ease-in-out 0.5s infinite',
              }}>
                <Box sx={{ width: 34, height: 34, borderRadius: '50%', bgcolor: C.blanco, color: C.azul, display: 'grid', placeItems: 'center' }}>
                  <VerifiedOutlined sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: F, fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.2 }}>Especialistas verificados</Typography>
                  <Stack direction="row" sx={{ color: '#FFD36B' }} aria-hidden>
                    {[0, 1, 2, 3, 4].map((s) => <StarRounded key={s} sx={{ fontSize: 15 }} />)}
                  </Stack>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Marquee inferior */}
      <Box sx={{
        position: 'relative', zIndex: 1, mt: { xs: 6, md: 2 },
        borderTop: '1px solid rgba(255,255,255,0.12)', bgcolor: 'rgba(255,255,255,0.04)',
        overflow: 'hidden', py: 2,
        maskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)',
      }}>
        <Box sx={{ display: 'flex', width: 'max-content', animation: 'oc-marquee 38s linear infinite', '&:hover': { animationPlayState: 'paused' } }}>
          {[0, 1].map((dup) => (
            <Stack key={dup} direction="row" aria-hidden={dup === 1 ? true : undefined} spacing={6} sx={{ pr: 6 }}>
              {MARQUEE.map((t) => (
                <Stack key={t} direction="row" spacing={6} alignItems="center">
                  <Typography sx={{ fontFamily: F, fontSize: '0.95rem', fontWeight: 500, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>{t}</Typography>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: C.cielo, opacity: 0.7 }} />
                </Stack>
              ))}
            </Stack>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
