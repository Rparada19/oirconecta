import { useEffect, useState } from 'react';
import { Box, Chip, Container, Stack, Typography } from '@mui/material';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import HearingRoundedIcon from '@mui/icons-material/HearingRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';

import DirectorySearchBar from './DirectorySearchBar';
import { searchDirectoryV2, fetchProfessions, fetchCities } from '../../../services/directoryDiscoveryService';

const TRUST_POINTS = [
  { icon: VerifiedRoundedIcon, label: 'Profesionales verificados' },
  { icon: StarRoundedIcon, label: 'Reseñas reales' },
  { icon: PlaceRoundedIcon, label: 'Cobertura nacional' },
  { icon: ChatBubbleRoundedIcon, label: 'Contacto directo' },
];

/**
 * Hero del directorio (estilo Airbnb): mesh gradient + orbes decorativos
 * con blur, título grande con palabra destacada, stats sociales reales,
 * search bar y trust pills.
 */
export default function DirectoryHero({
  title,
  subtitle,
  qDraft,
  setQDraft,
  onSubmit,
  onOpenFilters,
  activeFilterCount,
  professions = [],
  selectedProfessionSlug,
  onProfessionToggle,
}) {
  const [counts, setCounts] = useState({ profiles: null, professions: null, cities: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      searchDirectoryV2({ limit: 1 }),
      fetchProfessions(),
      fetchCities({ limit: 2000 }),
    ])
      .then(([s, p, c]) => {
        if (cancelled) return;
        setCounts({
          profiles: s?.data?.data?.total ?? null,
          professions: Array.isArray(p?.data?.data) ? p.data.data.length : null,
          cities: Array.isArray(c?.data?.data) ? c.data.data.length : null,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box
      sx={{
        position: 'relative', overflow: 'hidden',
        pt: { xs: 12, md: 14 },
        pb: { xs: 5, md: 7 },
        bgcolor: '#FBFAF8',
      }}
    >
      <Box aria-hidden sx={{
        position: 'absolute', top: -180, right: -180,
        width: 540, height: 540, borderRadius: '50%',
        background: 'radial-gradient(circle, #D9CDBF50 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <Box aria-hidden sx={{
        position: 'absolute', bottom: -100, left: -60,
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(39,47,80,0.10) 0%, transparent 70%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack spacing={2.5} alignItems="center" textAlign="center" sx={{ mb: { xs: 4, md: 5 } }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.25}>
            <Box sx={{ width: 28, height: 2, bgcolor: '#085946' }} />
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
              fontWeight: 600, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: '#085946',
            }}>Directorio verificado · Colombia</Typography>
            <Box sx={{ width: 28, height: 2, bgcolor: '#085946' }} />
          </Stack>

          <Typography component="h1" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 600,
            fontSize: { xs: '2.25rem', sm: '3rem', md: '4rem' },
            lineHeight: 1.05, letterSpacing: '-0.018em',
            maxWidth: 880, color: '#272F50',
          }}>
            {title || (
              <>
                Encuentra al{' '}
                <Box component="span" sx={{ fontStyle: 'italic', color: '#085946', fontWeight: 500 }}>
                  especialista auditivo
                </Box>{' '}
                ideal
              </>
            )}
          </Typography>

          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            color: '#6B7280', maxWidth: 640,
            fontSize: { xs: '1rem', md: '1.1875rem' }, lineHeight: 1.6,
          }}>
            {subtitle ||
              'Audiólogos, fonoaudiólogos y otorrinos verificados, con reseñas reales y atención presencial o virtual.'}
          </Typography>
        </Stack>

        <DirectorySearchBar
          value={qDraft}
          onChange={setQDraft}
          onSubmit={onSubmit}
          onOpenFilters={onOpenFilters}
          activeFilterCount={activeFilterCount}
        />

        {/* Stats sociales */}
        <Stack
          direction="row"
          spacing={{ xs: 1.5, md: 4 }}
          justifyContent="center"
          flexWrap="wrap"
          rowGap={1.5}
          sx={{ mt: { xs: 3, md: 3.5 } }}
        >
          {counts.profiles !== null && (
            <StatPill icon={HearingRoundedIcon} value={counts.profiles} label="profesionales" />
          )}
          {counts.professions !== null && (
            <StatPill icon={VerifiedRoundedIcon} value={counts.professions} label="especialidades" />
          )}
          {counts.cities !== null && (
            <StatPill icon={PlaceRoundedIcon} value={counts.cities} label="ciudades" />
          )}
        </Stack>

        {/* Chips rápidos por profesión */}
        {professions.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              mt: { xs: 3, md: 4 },
              overflowX: 'auto',
              pb: 1,
              px: { xs: 1, md: 0 },
              justifyContent: { md: 'center' },
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Chip
              label="Todos"
              onClick={() => onProfessionToggle(undefined)}
              sx={{
                bgcolor: !selectedProfessionSlug ? 'primary.main' : 'rgba(255,255,255,0.85)',
                color: !selectedProfessionSlug ? '#fff' : 'text.primary',
                border: '1px solid',
                borderColor: !selectedProfessionSlug ? 'primary.main' : 'rgba(0,0,0,0.08)',
                fontWeight: 700,
                flexShrink: 0,
                backdropFilter: 'blur(6px)',
                px: 0.5,
              }}
            />
            {professions.map((p) => {
              const sel = selectedProfessionSlug === p.slug;
              return (
                <Chip
                  key={p.slug}
                  label={p.nombre + 's'}
                  onClick={() => onProfessionToggle(sel ? undefined : p.slug)}
                  sx={{
                    bgcolor: sel ? 'primary.main' : 'rgba(255,255,255,0.85)',
                    color: sel ? '#fff' : 'text.primary',
                    border: '1px solid',
                    borderColor: sel ? 'primary.main' : 'rgba(0,0,0,0.08)',
                    fontWeight: 600,
                    flexShrink: 0,
                    backdropFilter: 'blur(6px)',
                    px: 0.5,
                  }}
                />
              );
            })}
          </Stack>
        )}

        {/* Trust pills */}
        <Stack
          direction="row"
          spacing={{ xs: 1, md: 3 }}
          justifyContent="center"
          flexWrap="wrap"
          rowGap={1}
          sx={{ mt: { xs: 3.5, md: 4 } }}
        >
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <Stack
              key={label}
              direction="row"
              alignItems="center"
              spacing={0.75}
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: 8,
                bgcolor: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(0,0,0,0.06)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <Icon sx={{ fontSize: 14, color: 'primary.main' }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                {label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}

function StatPill({ icon: Icon, value, label }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 8,
          bgcolor: 'rgba(255,255,255,0.85)',
          border: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon sx={{ fontSize: 18, color: 'primary.main' }} />
      </Box>
      <Stack>
        <Typography sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1, color: 'text.primary' }}>
          {value}
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
          {label}
        </Typography>
      </Stack>
    </Stack>
  );
}
