/**
 * Banner footer (A4) — banda horizontal al fondo de todas las páginas.
 * 970×90 desktop · 375×60 mobile.
 */
import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useMarketingCampaign, pickCreative } from '../../hooks/useMarketingCampaign';
import { usePreviewMode } from '../../hooks/usePreviewMode';
import SlotPreviewWrapper from './SlotPreviewWrapper';

export default function BannerFooter() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const preview = usePreviewMode();
  const { camp, ref, href, onClick } = useMarketingCampaign('BANNER_FOOTER',
    { device: isMobile ? 'mobile' : 'desktop' });

  if (!camp && !preview) return null;
  if (!camp && preview) {
    return (
      <Box sx={{ p: 2 }}>
        <SlotPreviewWrapper slotId="BANNER_FOOTER" slotLabel="Banner footer" active={false} minHeight={90} />
      </Box>
    );
  }
  const creative = pickCreative(camp, isMobile ? 'mobile' : 'desktop');
  const isVideo = camp.creativeType === 'video';

  const content = (
    <Box sx={{
      width: '100%',
      bgcolor: '#0a0a0a',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      py: 0.5,
    }}>
      <Box ref={ref} component={href ? 'a' : 'div'}
        href={href || undefined} target="_blank" rel="noopener noreferrer"
        onClick={onClick}
        sx={{
          position: 'relative', display: 'block', cursor: href ? 'pointer' : 'default',
          width: { xs: 375, md: 970 }, height: { xs: 60, md: 90 },
          borderRadius: '6px', overflow: 'hidden', textDecoration: 'none',
        }}>
        {isVideo ? (
          <Box component="video" src={creative.url} autoPlay muted playsInline loop
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <Box component="img" src={creative.url} alt={camp.titulo || camp.advertiser?.nombre || 'Publicidad'} loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        <Box sx={{
          position: 'absolute', top: 4, right: 6,
          px: 0.75, py: 0.125, borderRadius: '3px',
          bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
          fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase',
          fontFamily: '"DM Sans", sans-serif',
        }}>
          Publicidad
        </Box>
      </Box>
    </Box>
  );

  return preview ? (
    <Box sx={{ p: 1 }}>
      <SlotPreviewWrapper slotId="BANNER_FOOTER" slotLabel="Banner footer" active={!!camp}>
        {content}
      </SlotPreviewWrapper>
    </Box>
  ) : content;
}
