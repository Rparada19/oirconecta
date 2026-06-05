/**
 * Banner sidebar sticky (A3) — solo desktop, 300×600.
 * Para colocar en páginas internas con sidebar (directorio).
 */
import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import { useMarketingCampaign } from '../../hooks/useMarketingCampaign';

export default function BannerSidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { camp, ref, href, onClick } = useMarketingCampaign('BANNER_SIDEBAR', { device: 'desktop' });

  if (isMobile || !camp) return null;
  const isVideo = camp.creativeType === 'video';

  return (
    <Box sx={{ position: 'sticky', top: 96, alignSelf: 'flex-start' }}>
      <Box ref={ref} component={href ? 'a' : 'div'}
        href={href || undefined} target="_blank" rel="noopener noreferrer"
        onClick={onClick}
        sx={{
          position: 'relative', display: 'block', cursor: href ? 'pointer' : 'default',
          width: 300, height: 600,
          borderRadius: '10px', overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(15,25,35,0.08)',
          textDecoration: 'none',
        }}>
        {isVideo ? (
          <Box component="video" src={camp.creativeUrl} autoPlay muted playsInline loop
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <Box component="img" src={camp.creativeUrl} alt="" loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
        <Box sx={{
          position: 'absolute', top: 6, right: 6,
          px: 0.75, py: 0.25, borderRadius: '4px',
          bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
          fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase',
          fontFamily: '"DM Sans", sans-serif',
        }}>
          Publicidad
        </Box>
      </Box>
    </Box>
  );
}
