import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { useReveal } from '../../hooks/useReveal';

const C = {
  navy: '#272F50',
  verde: '#085946',
  oro: '#C9A86A',
  oroSuave: '#E0C28A',
  arena: '#D9CDBF',
  cremaCalida: '#F5EFE6',
  blanco: '#FBFAF8',
  gris: '#6B7280',
};

const LINES = [
  { text: 'Escuchar', accent: false },
  { text: 'no es', accent: false, faded: true },
  { text: 'un lujo.', accent: true },
  { text: 'Es seguir', accent: false },
  { text: 'siendo parte', accent: false, faded: true },
  { text: 'de la vida.', accent: true },
];

export default function HomeManifestoSection() {
  const { ref, visible } = useReveal({ threshold: 0.1 });

  return (
    <Box component="section" ref={ref} sx={{
      position: 'relative', overflow: 'hidden',
      bgcolor: C.cremaCalida, color: C.navy,
      py: { xs: 10, md: 16 },
    }}>
      {/* Línea sutil arriba */}
      <Box aria-hidden sx={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 1, bgcolor: `${C.navy}14` }} />

      {/* Palabra fantasma gigante de fondo */}
      <Box aria-hidden sx={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: { xs: '20rem', md: '36rem' },
        fontWeight: 700, color: `${C.navy}05`,
        lineHeight: 0.85, pointerEvents: 'none',
        userSelect: 'none', whiteSpace: 'nowrap',
      }}>
        oír
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.28em',
          textTransform: 'uppercase', color: C.oro, mb: { xs: 5, md: 8 },
          opacity: visible ? 1 : 0, transition: 'opacity 0.8s ease',
        }}>
          ※ Manifiesto OírConecta
        </Typography>

        <Box component="h2" sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 500, m: 0,
          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '5rem', lg: '6.25rem' },
          lineHeight: 1.02, letterSpacing: '-0.03em',
        }}>
          {LINES.map((l, i) => (
            <Box
              key={i}
              component="span"
              sx={{
                display: 'block',
                color: l.accent ? C.verde : (l.faded ? `${C.navy}55` : C.navy),
                fontStyle: l.accent ? 'italic' : 'normal',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(40px)',
                transition: `all 0.85s cubic-bezier(0.2,0.7,0.2,1) ${i * 0.12}s`,
                pl: i % 2 === 1 ? { md: '8vw' } : 0, // sangrías intercaladas
              }}
            >
              {l.text}
            </Box>
          ))}
        </Box>

        {/* Bajada editorial */}
        <Box sx={{
          mt: { xs: 6, md: 10 },
          maxWidth: 540,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1.2s cubic-bezier(0.2,0.7,0.2,1) 0.8s',
        }}>
          <Box sx={{ width: 32, height: 2, bgcolor: C.navy, mb: 2.5 }} />
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: { xs: '1rem', md: '1.125rem' }, lineHeight: 1.6,
            color: C.gris,
          }}>
            Por eso nos sumamos a esta misión: conectar a cada persona con la solución
            auditiva correcta, sin presión y sin venta forzada. Porque cuidar la audición
            es cuidar el vínculo con los demás.
          </Typography>
          <Typography sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic', fontSize: '1.1rem', color: C.navy, mt: 2.5,
          }}>
            — Equipo OírConecta
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
