import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link as RouterLink, Navigate } from 'react-router-dom';
import { Box, Container, Typography, Stack, Button, CircularProgress, Paper, Chip } from '@mui/material';
import { VerifiedOutlined, PublicOutlined, ReviewsOutlined } from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchEngine from '../components/SearchEngine';
import DirectoryProfessionRow from '../components/directorio/DirectoryProfessionRow';
import DirectoryContactSection from '../components/directorio/DirectoryContactSection';
import DirectoryRecommendedBrands from '../components/directorio/DirectoryRecommendedBrands';
import { searchDirectoryPublic } from '../services/directorySearchService';
import { POLIZA_LABEL_TODAS } from '../config/polizasColombia';
import { PROFESION_LABEL_TODAS } from '../utils/profesionFilter';
import {
  PROFESIONES_CATALOGO,
  profilesByProfession,
  mergeDirectoryPools,
  hasActiveDirectoryFilters,
  directoryProfesionToSlug,
} from '../utils/directoryPresentation';
import { DIRECTORY_LISTADO_PATH } from '../config/directoryRoutes';

function useDirectoryFilters(searchParams) {
  return useMemo(
    () => ({
      q: searchParams.get('q') || '',
      profesion: searchParams.get('profesion') || '',
      poliza: searchParams.get('poliza') || '',
      ciudad: searchParams.get('ciudad') || '',
    }),
    [searchParams]
  );
}

export default function DirectorioResultadosPage() {
  const [searchParams] = useSearchParams();
  const filters = useDirectoryFilters(searchParams);
  const activeFilters = useMemo(() => hasActiveDirectoryFilters(filters), [filters]);

  const [explorePool, setExplorePool] = useState([]);
  const [loadingExplore, setLoadingExplore] = useState(true);

  const initialFilters = useMemo(
    () => ({
      query: filters.q || '',
      profesion: filters.profesion && filters.profesion !== PROFESION_LABEL_TODAS ? filters.profesion : PROFESION_LABEL_TODAS,
      ciudad: filters.ciudad && filters.ciudad !== 'Todas las ciudades' ? filters.ciudad : 'Todas las ciudades',
      poliza: filters.poliza && filters.poliza !== POLIZA_LABEL_TODAS ? filters.poliza : POLIZA_LABEL_TODAS,
    }),
    [filters.q, filters.profesion, filters.ciudad, filters.poliza]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingExplore(true);
      const { data, error: err } = await searchDirectoryPublic({ limit: 100 });
      if (cancelled) return;
      if (err) {
        setExplorePool([]);
      } else {
        setExplorePool(data?.data?.items || []);
      }
      setLoadingExplore(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mergedExplore = useMemo(() => mergeDirectoryPools(explorePool), [explorePool]);

  const showDiscovery = !loadingExplore && mergedExplore.length > 0;
  const showDirectoryClosing = !activeFilters && !loadingExplore;

  if (activeFilters) {
    const qs = searchParams.toString();
    return <Navigate replace to={`${DIRECTORY_LISTADO_PATH}${qs ? `?${qs}` : ''}`} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f4f7f6' }}>
      <Header />
      <Box sx={{ height: 72 }} />

      <Box
        component="section"
        aria-labelledby="directorio-hero-title"
        sx={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          minHeight: { xs: 'clamp(400px, 58vh, 760px)', md: 'clamp(460px, 64vh, 860px)' },
          borderBottom: '1px solid rgba(8, 89, 70, 0.08)',
          bgcolor: '#e6f1ec',
          backgroundImage: [
            'radial-gradient(120% 90% at 12% 0%, rgba(255,255,255,0.95) 0%, transparent 52%)',
            'radial-gradient(90% 70% at 100% 18%, rgba(113, 160, 149, 0.42) 0%, transparent 55%)',
            'radial-gradient(70% 55% at 0% 100%, rgba(8, 89, 70, 0.11) 0%, transparent 50%)',
            'linear-gradient(185deg, #f7fcfa 0%, #e9f4ef 42%, #dceae3 100%)',
          ].join(', '),
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: { xs: '-18%', md: '-22%' },
            right: { xs: '-35%', md: '-12%' },
            width: { xs: '95%', md: '58%' },
            height: { xs: '75%', md: '95%' },
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 40%, rgba(113,160,149,0.35) 0%, transparent 62%)',
            pointerEvents: 'none',
            transition: 'opacity 0.4s ease',
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            bottom: { xs: '-28%', md: '-35%' },
            left: { xs: '-20%', md: '-8%' },
            width: { xs: '85%', md: '48%' },
            height: { xs: '60%', md: '78%' },
            borderRadius: '50%',
            background: 'radial-gradient(circle at 55% 45%, rgba(8,89,70,0.09) 0%, transparent 58%)',
            pointerEvents: 'none',
          }}
        />

        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            zIndex: 1,
            px: { xs: 2, sm: 3 },
            py: { xs: 5, sm: 6, md: 8 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: { xs: 'clamp(400px, 58vh, 760px)', md: 'clamp(460px, 64vh, 860px)' },
          }}
        >
          <Stack spacing={{ xs: 2.5, md: 3.25 }} alignItems="center" sx={{ width: '100%', textAlign: 'center' }}>
            <Chip
              icon={<VerifiedOutlined sx={{ '&&': { fontSize: { xs: 18, md: 20 } } }} />}
              label="Directorio profesional verificado"
              size="small"
              sx={{
                fontWeight: 600,
                color: 'primary.dark',
                bgcolor: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.85)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 8px 28px rgba(8, 89, 70, 0.08)',
                fontSize: { xs: '0.8125rem', md: '0.875rem' },
                height: { md: 32 },
                '& .MuiChip-icon': { color: 'primary.main' },
              }}
            />
            <Typography
              id="directorio-hero-title"
              component="h1"
              variant="h3"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: '#0f1f18',
                fontSize: { xs: '1.85rem', sm: '2.15rem', md: '2.85rem' },
                lineHeight: 1.12,
                maxWidth: 840,
                mx: 'auto',
                textShadow: '0 1px 0 rgba(255,255,255,0.65)',
              }}
            >
              Directorio clínico por especialidad
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(26, 35, 50, 0.78)',
                maxWidth: 640,
                mx: 'auto',
                lineHeight: 1.65,
                fontSize: { xs: '1.05rem', md: '1.2rem' },
                fontWeight: 500,
              }}
            >
              Fichas revisadas en la red. Elija especialidad, ciudad o póliza y obtenga listados acotados al instante.
            </Typography>
            <Stack
              component="ul"
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1.25, sm: 0 }}
              sx={{
                listStyle: 'none',
                m: 0,
                p: 0,
                mx: 'auto',
                maxWidth: 680,
                alignItems: 'center',
                justifyContent: 'center',
                gap: { sm: 2.5, md: 3.5 },
                flexWrap: 'wrap',
              }}
            >
              <Stack
                component="li"
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{
                  color: 'rgba(26, 35, 50, 0.78)',
                  typography: 'body2',
                  fontWeight: 700,
                  fontSize: { xs: '0.8125rem', md: '0.9375rem' },
                }}
              >
                <VerifiedOutlined sx={{ fontSize: { xs: 18, md: 20 }, color: 'primary.main', opacity: 0.9 }} aria-hidden />
                Perfiles verificados en la red
              </Stack>
              <Stack
                component="li"
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{
                  color: 'rgba(26, 35, 50, 0.78)',
                  typography: 'body2',
                  fontWeight: 700,
                  fontSize: { xs: '0.8125rem', md: '0.9375rem' },
                }}
              >
                <PublicOutlined sx={{ fontSize: { xs: 18, md: 20 }, color: 'primary.main', opacity: 0.9 }} aria-hidden />
                Presencia en varias ciudades
              </Stack>
              <Stack
                component="li"
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{
                  color: 'rgba(26, 35, 50, 0.78)',
                  typography: 'body2',
                  fontWeight: 700,
                  fontSize: { xs: '0.8125rem', md: '0.9375rem' },
                }}
              >
                <ReviewsOutlined sx={{ fontSize: { xs: 18, md: 20 }, color: 'primary.main', opacity: 0.9 }} aria-hidden />
                Reseñas cuando el profesional las publica
              </Stack>
            </Stack>

            <Box
              id="buscar-directorio"
              sx={{
                scrollMarginTop: 96,
                width: '100%',
                maxWidth: 1140,
                mt: { xs: 0.5, md: 1 },
              }}
            >
              <SearchEngine embeddedInHero directoryMode initialFilters={initialFilters} />
            </Box>
            <Stack spacing={1.5} alignItems="center" sx={{ mt: 2, width: '100%', maxWidth: 900 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                Listados por especialidad (página dedicada)
              </Typography>
              <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1} useFlexGap>
                {PROFESIONES_CATALOGO.map((p) => (
                  <Button
                    key={p}
                    component={RouterLink}
                    to={`/directorio/profesion/${directoryProfesionToSlug(p)}`}
                    variant="outlined"
                    size="small"
                    sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
                  >
                    {p}
                  </Button>
                ))}
              </Stack>
              <Button
                component={RouterLink}
                to={DIRECTORY_LISTADO_PATH}
                variant="text"
                size="small"
                sx={{ fontWeight: 700, textTransform: 'none' }}
              >
                Abrir página de búsqueda y filtros combinados
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 }, flex: 1, px: { xs: 2, sm: 3 } }}>
        {loadingExplore && (
          <Stack alignItems="center" py={6}>
            <CircularProgress sx={{ color: 'primary.main' }} />
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2, fontSize: { md: '1.0625rem' } }}>
              Cargando el directorio…
            </Typography>
          </Stack>
        )}

        {!loadingExplore && mergedExplore.length === 0 && !activeFilters && (
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid rgba(39,47,80,0.08)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: { md: '1.25rem' } }}>
              Aún no hay fichas publicadas
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2, lineHeight: 1.65, fontSize: { md: '1.0625rem' } }}>
              Para datos de demostración, active <code>VITE_DIRECTORY_DEMO=true</code> o utilice el entorno de desarrollo.
            </Typography>
            <Button component={RouterLink} to="/profesionales/audiologos" variant="contained" sx={{ mr: 1, borderRadius: 2 }}>
              Material de referencia
            </Button>
            <Button component={RouterLink} to="/profesionales/otologos" variant="outlined" sx={{ borderRadius: 2 }}>
              ORL de referencia
            </Button>
          </Paper>
        )}

        {showDiscovery &&
          PROFESIONES_CATALOGO.map((prof) => (
            <DirectoryProfessionRow
              key={prof}
              title={prof}
              profiles={profilesByProfession(mergedExplore, prof)}
            />
          ))}

        {!loadingExplore && !activeFilters && <DirectoryRecommendedBrands />}

        {showDirectoryClosing && <DirectoryContactSection />}
      </Container>

      <Footer />
    </Box>
  );
}
