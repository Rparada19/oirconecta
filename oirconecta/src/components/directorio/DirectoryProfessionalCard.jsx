import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Stack,
  Button,
  Rating,
} from '@mui/material';
import {
  LocationOn,
  Verified,
  AutoAwesome,
  ChevronRight,
} from '@mui/icons-material';
import {
  directoryInitials,
  directoryPrimaryCity,
  directoryPrimaryPhonePublic,
  directoryPublicDisplayName,
  directoryPublicEmail,
  directoryShortTagline,
  directoryServiceChips,
  directoryAllyBrandNames,
  directoryProfilePhoto,
  waMeHrefFromPhone,
} from '../../utils/directoryPresentation';

/**
 * Tarjeta de profesional del directorio público (API Prisma).
 * @param {{ profile: object; variant?: 'standard' | 'featured'; showSpotlightBadge?: boolean; dense?: boolean }} props
 */
export default function DirectoryProfessionalCard({
  profile,
  variant = 'standard',
  showSpotlightBadge = false,
  dense = false,
}) {
  const name = directoryPublicDisplayName(profile);
  const photo = directoryProfilePhoto(profile);
  const city = directoryPrimaryCity(profile?.workplaces);
  const phone = directoryPrimaryPhonePublic(profile);
  const publicEmail = directoryPublicEmail(profile);
  const waHref = waMeHrefFromPhone(phone);
  const chipMax = dense ? 2 : 3;
  const chips = directoryServiceChips(profile, chipMax);
  const allies = directoryAllyBrandNames(profile?.allies, 3);
  const tagline = directoryShortTagline(profile);
  const isFeatured = variant === 'featured';
  const profileTo = `/directorio/profesional/${profile.id}`;
  const demo = profile?._demo;
  const rating = typeof demo?.rating === 'number' ? demo.rating : null;
  const reviewCount = typeof demo?.reviewCount === 'number' ? demo.reviewCount : null;
  const snippet = demo?.testimonialSnippet;

  return (
    <Card
      component="article"
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 3,
        border: '1px solid',
        borderBottom: 'none',
        borderColor: isFeatured
          ? { xs: 'rgba(8, 89, 70, 0.22)', md: 'rgba(8, 89, 70, 0.28)' }
          : { xs: 'rgba(39, 47, 80, 0.08)', md: 'rgba(8, 89, 70, 0.14)' },
        boxShadow: isFeatured ? '0 20px 48px rgba(8, 89, 70, 0.12)' : '0 8px 32px rgba(30, 36, 56, 0.06)',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderBottom: 'none',
          boxShadow: isFeatured ? '0 24px 56px rgba(8, 89, 70, 0.16)' : '0 14px 40px rgba(30, 36, 56, 0.1)',
          borderColor: 'rgba(8, 89, 70, 0.28)',
        },
      }}
    >
      <CardContent
        sx={{
          p: isFeatured ? { xs: 2.25, md: 2.75 } : { xs: 2, md: 2.25 },
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          gap: dense ? 1 : 1.35,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ minHeight: 26 }}>
            <Chip
              icon={<Verified sx={{ '&&': { fontSize: 16 } }} />}
              label="Verificado"
              size="small"
              sx={{
                height: 26,
                fontWeight: 600,
                fontSize: '0.7rem',
                bgcolor: 'rgba(8, 89, 70, 0.08)',
                color: 'primary.dark',
                border: 'none',
                '& .MuiChip-icon': { color: 'primary.main' },
              }}
            />
            {showSpotlightBadge ? (
              <Chip
                icon={<AutoAwesome sx={{ '&&': { fontSize: 15 } }} />}
                label="Destacado"
                size="small"
                sx={{
                  height: 26,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  bgcolor: 'rgba(39, 47, 80, 0.06)',
                  color: 'secondary.dark',
                }}
              />
            ) : null}
            {!dense && demo?.premium ? (
              <Chip
                label="Premium"
                size="small"
                sx={{
                  height: 26,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  bgcolor: 'rgba(39, 47, 80, 0.88)',
                  color: 'common.white',
                }}
              />
            ) : null}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar
            src={photo || undefined}
            alt=""
            sx={{
              width: isFeatured ? 72 : 56,
              height: isFeatured ? 72 : 56,
              fontWeight: 700,
              fontSize: isFeatured ? '1.25rem' : '1rem',
              bgcolor: 'primary.main',
              color: 'common.white',
              boxShadow: '0 4px 16px rgba(8, 89, 70, 0.25)',
            }}
          >
            {!photo ? directoryInitials(name) : null}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              component="h3"
              variant={isFeatured ? 'h6' : 'subtitle1'}
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                color: '#1a2332',
                ...(!isFeatured && { fontSize: { xs: undefined, md: '1.0625rem' } }),
                ...(isFeatured && { fontSize: { xs: undefined, md: '1.25rem' } }),
              }}
            >
              {name}
            </Typography>
            {profile.profesion ? (
              <Typography
                variant="body2"
                sx={{ mt: 0.25, color: 'primary.main', fontWeight: 600, fontSize: { md: '0.9375rem' } }}
              >
                {profile.profesion}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary', fontSize: { md: '0.9375rem' } }}>
                Especialista auditivo
              </Typography>
            )}
            {city ? (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5, color: 'text.secondary' }}>
                <LocationOn sx={{ fontSize: 18, opacity: 0.75 }} />
                <Typography variant="body2" noWrap sx={{ fontSize: { md: '0.9375rem' } }}>
                  {city}
                </Typography>
              </Stack>
            ) : null}
            {!dense && publicEmail ? (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ mt: 0.5, display: 'block' }}>
                {publicEmail}
              </Typography>
            ) : null}
          </Box>
        </Stack>

        {!dense && rating != null ? (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Rating value={rating} precision={0.1} readOnly size="small" sx={{ color: 'warning.main' }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {rating.toFixed(1)}
            </Typography>
            {reviewCount != null ? (
              <Typography variant="caption" color="text.disabled">
                ({reviewCount} opiniones)
              </Typography>
            ) : null}
          </Stack>
        ) : null}

        {!dense && snippet ? (
          <Typography
            variant="body2"
            sx={{
              fontStyle: 'italic',
              color: 'text.secondary',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            “{snippet}”
          </Typography>
        ) : null}

        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: dense ? 2 : snippet ? 1 : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: dense ? 36 : snippet ? 24 : 44,
            fontSize: { md: '0.9375rem' },
          }}
        >
          {tagline}
        </Typography>

        {chips.length > 0 ? (
          <Stack direction="row" flexWrap="wrap" gap={0.75} useFlexGap>
            {chips.map((c) => (
              <Chip
                key={c}
                label={c}
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  fontWeight: 500,
                  fontSize: '0.72rem',
                  borderColor: 'rgba(39, 47, 80, 0.14)',
                  bgcolor: 'rgba(255,255,255,0.7)',
                }}
              />
            ))}
          </Stack>
        ) : null}

        {!dense && allies.length > 0 ? (
          <Typography variant="caption" sx={{ color: 'text.disabled', letterSpacing: '0.02em' }}>
            Trabaja con: {allies.join(' · ')}
          </Typography>
        ) : null}

        <Box sx={{ flexGrow: 1 }} />

        <Stack direction="column" spacing={1} sx={{ pt: 1 }}>
          <Button
            component={RouterLink}
            to={profileTo}
            variant="contained"
            size="medium"
            fullWidth
            endIcon={<ChevronRight />}
            sx={{
              fontWeight: 800,
              borderRadius: 2,
              textTransform: 'none',
              py: 1.1,
              boxShadow: 'none',
              '&:hover': { boxShadow: '0 4px 14px rgba(8, 89, 70, 0.25)' },
            }}
          >
            Ver perfil completo
          </Button>
          {waHref ? (
            <Button
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              variant="text"
              size="medium"
              fullWidth
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                color: 'primary.dark',
              }}
            >
              WhatsApp
            </Button>
          ) : (
            <Button
              component={RouterLink}
              to="/agendar"
              variant="text"
              size="medium"
              fullWidth
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                textTransform: 'none',
                color: 'primary.dark',
              }}
            >
              Solicitar cita
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
