import React from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import { TRUST_POINTS } from '../config/homeContent';

const icons = [<VerifiedOutlinedIcon key="0" />, <GroupsOutlinedIcon key="1" />, <FavoriteBorderOutlinedIcon key="2" />];

export default function HomeTrustStrip() {
  return (
    <Box
      component="section"
      aria-label="Por qué confiar"
      sx={{
        py: { xs: 3, md: 4 },
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'rgba(8, 89, 70, 0.08)',
        bgcolor: 'background.paper',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, md: 4 }} alignItems="flex-start">
          {TRUST_POINTS.map((item, i) => (
            <Grid item xs={12} md={4} key={item.title}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    color: 'primary.main',
                    opacity: 0.9,
                    '& svg': { fontSize: 32 },
                    mt: 0.25,
                  }}
                  aria-hidden
                >
                  {icons[i]}
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                    {item.subtitle}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
