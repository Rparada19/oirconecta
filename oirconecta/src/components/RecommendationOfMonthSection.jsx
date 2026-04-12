import React from 'react';
import { Box, Container, Typography, Button, Paper, Stack } from '@mui/material';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { Link as RouterLink } from 'react-router-dom';
import { RECOMMENDATION_OF_MONTH } from '../config/homeContent';

export default function RecommendationOfMonthSection() {
  const r = RECOMMENDATION_OF_MONTH;

  return (
    <Box component="section" aria-label="Recomendación del mes" sx={{ py: { xs: 8, md: 10 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Typography
          variant="overline"
          sx={{ display: 'block', color: 'primary.main', fontWeight: 700, letterSpacing: '0.12em', mb: 2 }}
        >
          {r.label}
        </Typography>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'rgba(8, 89, 70, 0.12)',
            bgcolor: 'background.paper',
            maxWidth: 880,
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'flex-start' }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                bgcolor: 'rgba(8, 89, 70, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                flexShrink: 0,
              }}
              aria-hidden
            >
              <LightbulbOutlinedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Box>
              <Typography component="h2" variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.5, letterSpacing: '-0.02em' }}>
                {r.product}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
                {r.brandLine}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.65, color: 'text.primary' }}>
                <strong>Ideal si…</strong> {r.forWho}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.65, fontStyle: 'italic' }}>
                {r.disclaimer}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                component={RouterLink}
                to={r.ctaTo}
                sx={{ fontWeight: 700 }}
              >
                {r.ctaLabel}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
