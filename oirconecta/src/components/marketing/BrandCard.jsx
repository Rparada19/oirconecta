/**
 * Tarjeta de marca (BRAND_CARD_DIRECTORY) que se inserta entre tarjetas
 * de profesionales en el listado del directorio.
 *
 * - Mismo tamaño/grid que DirectoryCardV2
 * - Badge "Publicidad" sutil
 * - Click abre destino del anunciante con UTMs
 * - Reporta impresión via IntersectionObserver y click
 */

import React, { useEffect, useRef } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { trackImpression, trackClick, buildDestinationUrl } from '../../services/marketingPublicApi';

const ACCENT = '#085946';
const NAVY = '#272F50';
const GOLD = '#C9A86A';

export default function BrandCard({ campaign }) {
  const ref = useRef(null);
  const impressedRef = useRef(false);

  useEffect(() => {
    if (!campaign?.id || !ref.current || impressedRef.current) return;
    const el = ref.current;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !impressedRef.current) {
        impressedRef.current = true;
        trackImpression(campaign.id);
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [campaign?.id]);

  if (!campaign) return null;
  const url = buildDestinationUrl(campaign);

  const onClick = () => {
    trackClick(campaign.id);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box
      ref={ref}
      onClick={onClick}
      sx={{
        position: 'relative',
        cursor: url ? 'pointer' : 'default',
        height: '100%',
        display: 'flex', flexDirection: 'column',
        borderRadius: '12px',
        bgcolor: '#fff',
        border: `1.5px solid ${GOLD}55`,
        boxShadow: '0 4px 16px rgba(201,168,106,0.12)',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': url ? {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 28px rgba(201,168,106,0.20)',
        } : {},
      }}
    >
      {/* Badge Publicidad */}
      <Box sx={{
        position: 'absolute', top: 10, right: 10, zIndex: 2,
        bgcolor: 'rgba(255,255,255,0.95)', borderRadius: '4px',
        px: 0.75, py: 0.25,
        fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8',
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        Publicidad
      </Box>

      {/* Hero / Logo */}
      <Box sx={{
        aspectRatio: '16/10',
        background: campaign.creativeUrl
          ? `url(${campaign.creativeUrl}) center/cover no-repeat`
          : `linear-gradient(135deg, ${ACCENT}10, ${GOLD}20)`,
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!campaign.creativeUrl && campaign.advertiser?.logoUrl && (
          <Box component="img" src={campaign.advertiser.logoUrl} alt={campaign.advertiser?.nombre || ''}
            sx={{ maxWidth: '70%', maxHeight: '70%', objectFit: 'contain' }} />
        )}
      </Box>

      {/* Contenido */}
      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: GOLD, mb: 0.5,
        }}>
          {campaign.advertiser?.nombre || 'Marca aliada'}
        </Typography>
        <Typography sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: '1.0625rem', fontWeight: 600, color: NAVY,
          lineHeight: 1.2, letterSpacing: '-0.01em', mb: 1,
        }}>
          {campaign.nombre || campaign.advertiser?.nombre}
        </Typography>

        <Box sx={{ flex: 1 }} />

        {url && (
          <Stack direction="row" alignItems="center" spacing={0.5}
            sx={{ color: ACCENT, fontSize: '0.8125rem', fontWeight: 700, mt: 1 }}>
            <span>Ver más</span>
            <OpenInNewRoundedIcon sx={{ fontSize: 14 }} />
          </Stack>
        )}
      </Box>
    </Box>
  );
}
