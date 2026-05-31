import React from 'react';
import { Helmet } from 'react-helmet';
import { Breadcrumbs, Link as MuiLink, Typography, Box } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link as RouterLink } from 'react-router-dom';

const SITE = 'https://oirconecta.com';

export default function SeoBreadcrumbs({ items = [], sx }) {
  if (!items.length) return null;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      item: it.to ? `${SITE}${it.to}` : undefined,
    })),
  };

  return (
    <Box sx={{ py: 1.5, ...sx }}>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(ld)}</script>
      </Helmet>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
        {items.map((it, i) =>
          i === items.length - 1 || !it.to ? (
            <Typography key={i} color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
              {it.label}
            </Typography>
          ) : (
            <MuiLink
              key={i}
              component={RouterLink}
              to={it.to}
              underline="hover"
              sx={{ fontSize: '0.875rem', color: '#085946' }}
            >
              {it.label}
            </MuiLink>
          )
        )}
      </Breadcrumbs>
    </Box>
  );
}
