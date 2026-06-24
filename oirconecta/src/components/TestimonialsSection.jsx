import React, { useState, useRef, useEffect } from 'react';
import { Box, Container, Typography, IconButton, Stack } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { BigQuote } from './brand/BrandMark';
import { useReveal } from '../hooks/useReveal';

const C = {
  navy: '#272F50',
  navyDark: '#1B2240',
  verde: '#085946',
  oro: '#C9A86A',
  arena: '#D9CDBF',
  cremaCalida: '#F5EFE6',
  blanco: '#FBFAF8',
};

const TESTIMONIOS = [
  {
    quote: 'Pensé que mi mamá ya no me quería oír. Cuando lo probé en el simulador, entendí que el problema no era yo.',
    nombre: 'Catalina M.',
    rol: 'Hija · Medellín',
    avatar: '/img/avatar-paciente-1.jpg',
  },
  {
    quote: 'En 45 minutos me hicieron la prueba y me explicaron todo sin tecnicismos. Por primera vez sentí que entendí mi diagnóstico.',
    nombre: 'Jorge R.',
    rol: 'Paciente · Bogotá',
    avatar: '/img/avatar-paciente-2.jpg',
  },
  {
    quote: 'Probé tres centros antes de encontrar OírConecta. Ningún vendedor me presionó. Solo me dieron información honesta.',
    nombre: 'Marta G.',
    rol: 'Paciente · Cali',
    avatar: '/img/avatar-paciente-3.jpg',
  },
  {
    quote: 'Mi papá se negaba a usar audífonos por orgullo. Ver el simulador con mis hijos lo convenció más que años de discusiones.',
    nombre: 'Andrés P.',
    rol: 'Hijo · Barranquilla',
    avatar: '/img/avatar-paciente-4.jpg',
  },
];

export default function TestimonialsSection() {
  const [idx, setIdx] = useState(0);
  const track = useRef(null);
  const { ref, visible } = useReveal({ threshold: 0.15 });
  const dragRef = useRef({ startX: 0, dragging: false, moved: 0 });

  const go = (n) => {
    const next = (n + TESTIMONIOS.length) % TESTIMONIOS.length;
    setIdx(next);
  };

  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setIdx((p) => (p + 1) % TESTIMONIOS.length), 9000);
    return () => clearInterval(id);
  }, [paused]);

  const onPointerDown = (e) => {
    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX || e.touches?.[0]?.clientX || 0;
    dragRef.current.moved = 0;
    setPaused(true);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    const x = e.clientX || e.touches?.[0]?.clientX || 0;
    dragRef.current.moved = x - dragRef.current.startX;
  };
  const onPointerUp = () => {
    if (!dragRef.current.dragging) return;
    const m = dragRef.current.moved;
    dragRef.current.dragging = false;
    if (m > 60) go(idx - 1);
    else if (m < -60) go(idx + 1);
    setTimeout(() => setPaused(false), 6000);
  };

  const t = TESTIMONIOS[idx];

  return (
    <Box component="section" sx={{
      position: 'relative', overflow: 'hidden',
      bgcolor: C.navy, color: '#fff',
      py: { xs: 8, md: 14 },
    }}>
      <Box aria-hidden sx={{
        position: 'absolute', top: -180, right: -180, width: 540, height: 540,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${C.oro}26 0%, transparent 70%)`,
        filter: 'blur(80px)',
      }} />
      <Box aria-hidden sx={{
        position: 'absolute', top: 0, left: '8%', right: '8%', height: 1, bgcolor: '#ffffff14',
      }} />

      <Container maxWidth="lg" ref={ref} sx={{ position: 'relative' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: { xs: 5, md: 8 } }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 32, height: 2, bgcolor: C.oro }} />
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: C.oro,
            }}>
              Historias reales
            </Typography>
          </Stack>
          <Typography sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '0.9rem', fontStyle: 'italic', color: '#ffffff77',
          }}>
            №{String(idx + 1).padStart(2, '0')} / {TESTIMONIOS.length}
          </Typography>
        </Stack>

        <Box
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchMove={onPointerMove}
          onTouchEnd={onPointerUp}
          onMouseEnter={() => setPaused(true)}
          sx={{ position: 'relative', userSelect: 'none', cursor: 'grab', '&:active': { cursor: 'grabbing' } }}
        >
          <Box aria-hidden sx={{
            position: 'absolute', top: { xs: -40, md: -90 }, left: { xs: -20, md: -10 },
            opacity: 0.18, pointerEvents: 'none',
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'transform 1.2s ease',
          }}>
            <BigQuote color={C.oro} size={260} />
          </Box>

          <Box ref={track} sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '4fr 1fr' },
            gap: { xs: 6, md: 8 }, alignItems: 'center',
            position: 'relative', zIndex: 1,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 1s cubic-bezier(0.2,0.7,0.2,1)',
          }}>
            <Typography
              key={t.quote}
              component="blockquote"
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: { xs: '1.6rem', sm: '2rem', md: '2.85rem', lg: '3.4rem' },
                fontWeight: 400, fontStyle: 'italic',
                lineHeight: 1.18, letterSpacing: '-0.015em',
                color: '#fff', m: 0,
                animation: 'oc-quote-in 0.8s cubic-bezier(0.2,0.7,0.2,1)',
                '@keyframes oc-quote-in': {
                  '0%': { opacity: 0, transform: 'translateX(20px)' },
                  '100%': { opacity: 1, transform: 'translateX(0)' },
                },
              }}
            >
              “{t.quote}”
            </Typography>

            <Stack spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Box
                key={t.avatar}
                sx={{
                  width: { xs: 64, md: 86 }, height: { xs: 64, md: 86 },
                  borderRadius: '50%', overflow: 'hidden',
                  border: `2px solid ${C.oro}`,
                  animation: 'oc-portrait-in 0.9s cubic-bezier(0.2,0.7,0.2,1)',
                  '@keyframes oc-portrait-in': {
                    '0%': { opacity: 0, transform: 'scale(0.85)' },
                    '100%': { opacity: 1, transform: 'scale(1)' },
                  },
                }}
              >
                <Box component="img" src={t.avatar} alt={`Foto de ${t.nombre}`}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </Box>
              <Box sx={{ textAlign: { xs: 'left', md: 'center' } }}>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '0.95rem',
                  fontWeight: 700, color: '#fff',
                }}>{t.nombre}</Typography>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '0.78rem',
                  color: '#ffffff99', mt: 0.25,
                }}>{t.rol}</Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: { xs: 5, md: 8 } }}>
          <Stack direction="row" spacing={1.5}>
            {TESTIMONIOS.map((_, i) => (
              <Box
                key={i}
                onClick={() => { setIdx(i); setPaused(true); }}
                sx={{
                  cursor: 'pointer',
                  width: i === idx ? 32 : 8, height: 4, borderRadius: '999px',
                  bgcolor: i === idx ? C.oro : '#ffffff33',
                  transition: 'all 0.4s ease',
                }}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => { go(idx - 1); setPaused(true); }}
              aria-label="Anterior"
              sx={{ color: '#fff', border: '1px solid #ffffff33',
                '&:hover': { borderColor: '#fff', bgcolor: '#ffffff10' } }}>
              <ChevronLeft />
            </IconButton>
            <IconButton onClick={() => { go(idx + 1); setPaused(true); }}
              aria-label="Siguiente"
              sx={{ color: '#fff', border: '1px solid #ffffff33',
                '&:hover': { borderColor: '#fff', bgcolor: '#ffffff10' } }}>
              <ChevronRight />
            </IconButton>
          </Stack>
        </Stack>

        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.7rem', color: '#ffffff66', mt: 3, textAlign: 'center',
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          Arrastra o desliza para cambiar de testimonio
        </Typography>
      </Container>
    </Box>
  );
}
