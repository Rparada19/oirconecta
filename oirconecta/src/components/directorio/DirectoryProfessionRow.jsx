import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import DirectoryProfessionalCard from './DirectoryProfessionalCard';
import { directoryProfessionSubtitle, pickFeaturedFromProfessionList } from '../../utils/directoryPresentation';

const scrollRowSx = {
  display: 'flex',
  gap: { xs: 2, md: 2.5 },
  overflowX: 'auto',
  pb: 1.5,
  mx: { xs: -2, sm: 0 },
  px: { xs: 2, sm: 0 },
  justifyContent: { xs: 'flex-start', md: 'center' },
  flexWrap: { md: 'wrap' },
  scrollSnapType: { xs: 'x mandatory', sm: 'none' },
  WebkitOverflowScrolling: 'touch',
  '&::-webkit-scrollbar': { height: 6 },
  '&::-webkit-scrollbar-thumb': {
    bgcolor: 'rgba(8, 89, 70, 0.25)',
    borderRadius: 3,
  },
};

/**
 * Carril curado por especialidad: solo perfiles destacados (máx. 3).
 */
export default function DirectoryProfessionRow({ title, profiles }) {
  const featured = useMemo(() => pickFeaturedFromProfessionList(profiles || [], 3), [profiles]);

  if (!profiles || profiles.length === 0) return null;

  return (
    <Box
      component="section"
      sx={{
        mb: { xs: 6, md: 8 },
        pt: { xs: 4, md: 5 },
        pb: { xs: 3, md: 4 },
        borderTop: '1px solid rgba(8, 89, 70, 0.08)',
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          maxWidth: 920,
          mx: 'auto',
          px: { xs: 1, sm: 2 },
          mb: { xs: 3, md: 4 },
        }}
      >
        <Typography
          component="h2"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.035em',
            color: '#0f1f18',
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
            lineHeight: 1.12,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            mt: { xs: 1.5, md: 2 },
            mx: 'auto',
            maxWidth: 720,
            lineHeight: 1.65,
            fontSize: { xs: '0.9375rem', sm: '1rem', md: '1.0625rem' },
          }}
        >
          {directoryProfessionSubtitle(title)}
        </Typography>
      </Box>

      <Box sx={{ ...scrollRowSx, gap: { xs: 2, md: 2.5 } }}>
        {featured.map((profile, i) => (
          <Box
            key={profile.id}
            sx={{
              flex: { md: '0 0 auto' },
              width: { xs: 'min(90vw, 320px)', sm: 320, md: 340 },
              scrollSnapAlign: 'start',
            }}
          >
            <DirectoryProfessionalCard
              profile={profile}
              variant="featured"
              showSpotlightBadge={i < featured.length}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
