/**
 * Wrapper editorial para el SearchEngine en la home. No toca la lógica del
 * buscador — solo lo presenta con un header editorial y un fondo premium.
 */
import React from 'react';
import { Box, Container, Typography, Stack } from '@mui/material';
import SearchEngine from '../SearchEngine';
import { useReveal } from '../../hooks/useReveal';
import { Swoosh } from '../brand/BrandMark';

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

export default function HomeSearchSection() {
  const { ref, visible } = useReveal({ threshold: 0.18 });

  return (
    <Box component="section" id="busqueda-profesionales" sx={{
      position: 'relative', overflow: 'hidden',
      bgcolor: C.cremaCalida, color: C.navy,
      py: { xs: 8, md: 13 }, scrollMarginTop: 96,
    }}>
      {/* Swoosh de marca de fondo */}
      <Box aria-hidden sx={{
        position: 'absolute', bottom: -120, right: -160,
        width: 620, opacity: 0.08, pointerEvents: 'none',
        transform: 'rotate(190deg)',
      }}>
        <Swoosh width="100%" color={C.navy} accent={C.oro} />
      </Box>

      <Container maxWidth="lg" ref={ref} sx={{ position: 'relative' }}>
        {/* Header editorial */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '6fr 5fr' },
          gap: { xs: 4, md: 6 }, alignItems: 'end',
          mb: { xs: 5, md: 7 },
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.9s cubic-bezier(0.2,0.7,0.2,1)',
        }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.75} sx={{ mb: 3 }}>
              <Box sx={{ width: 32, height: 2, bgcolor: C.oro }} />
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.24em',
                textTransform: 'uppercase', color: C.navy,
              }}>
                Directorio nacional
              </Typography>
            </Stack>
            <Typography component="h2" sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '2.25rem', md: '3.4rem', lg: '3.85rem' }, fontWeight: 500,
              color: C.navy, lineHeight: 1, letterSpacing: '-0.025em',
            }}>
              Encuentra a tu{' '}
              <Box component="span" sx={{ fontStyle: 'italic', color: C.verde }}>
                especialista.
              </Box>
            </Typography>
          </Box>
          <Box sx={{ pb: { md: 1 } }}>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: '1.05rem', md: '1.15rem' }, lineHeight: 1.6,
              color: C.gris, maxWidth: 480,
            }}>
              Audiólogos, otorrinos, fonoaudiólogos y centros auditivos verificados
              en toda Colombia. Filtra por ciudad, especialidad o cobertura.
            </Typography>
          </Box>
        </Box>

        {/* Buscador en un card editorial */}
        <Box sx={{
          bgcolor: '#fff',
          borderRadius: '14px',
          p: { xs: 2, md: 3 },
          boxShadow: `0 24px 60px ${C.navy}1a`,
          border: `1px solid ${C.arena}55`,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(28px)',
          transition: 'all 1s cubic-bezier(0.2,0.7,0.2,1) 0.15s',
        }}>
          <SearchEngine />
        </Box>
      </Container>
    </Box>
  );
}
