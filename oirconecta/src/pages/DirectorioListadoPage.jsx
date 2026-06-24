import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Stack, Button, Breadcrumbs, Paper, CircularProgress } from '@mui/material';
import NavigateNext from '@mui/icons-material/NavigateNext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchEngine from '../components/SearchEngine';
import DirectorySearchResultsPanel from '../components/directorio/DirectorySearchResultsPanel';
import { searchDirectoryPublic } from '../services/directorySearchService';
import { POLIZA_LABEL_TODAS } from '../config/polizasColombia';
import { PROFESION_LABEL_TODAS } from '../utils/profesionFilter';
import { DIRECTORY_LISTADO_PATH } from '../config/directoryRoutes';
import { getDirectoryDemoProfiles, shouldMergeDirectoryDemo } from '../data/directoryDemoData';
import {
  mergeDirectoryPools,
  buildDirectoryResultsHeadline,
  directoryFiltersToSearchParams,
  hasActiveDirectoryFilters,
  filterDirectoryDemoProfiles,
} from '../utils/directoryPresentation';

const PAGE_SIZE = 12;
const FILTER_LABELS = { profesionTodas: PROFESION_LABEL_TODAS, polizaTodas: POLIZA_LABEL_TODAS };

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

export default function DirectorioListadoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const filters = useDirectoryFilters(searchParams);
  const activeFilters = useMemo(() => hasActiveDirectoryFilters(filters), [filters]);

  const [explorePool, setExplorePool] = useState([]);
  const [loadingExplore, setLoadingExplore] = useState(true);
  const [filteredPayload, setFilteredPayload] = useState(null);
  const [loadingFiltered, setLoadingFiltered] = useState(false);
  const [filterError, setFilterError] = useState(null);
  const [page, setPage] = useState(1);

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
    setPage(1);
  }, [filters.q, filters.profesion, filters.poliza, filters.ciudad]);

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

  useEffect(() => {
    if (!activeFilters) {
      setFilteredPayload(null);
      setFilterError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setFilteredPayload(null);
      setLoadingFiltered(true);
      setFilterError(null);
      const { data, error: err } = await searchDirectoryPublic({
        q: filters.q?.trim() || undefined,
        profesion:
          filters.profesion && filters.profesion !== PROFESION_LABEL_TODAS ? filters.profesion : undefined,
        poliza: filters.poliza && filters.poliza !== POLIZA_LABEL_TODAS ? filters.poliza : undefined,
        ciudad: filters.ciudad && filters.ciudad !== 'Todas las ciudades' ? filters.ciudad : undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      });
      if (cancelled) return;
      if (err) {
        setFilterError(typeof err === 'string' ? err : 'No se pudo consultar el directorio');
        setFilteredPayload(null);
      } else if (data?.success && data?.data) {
        setFilteredPayload(data.data);
      } else {
        setFilterError('Respuesta inesperada del servidor');
        setFilteredPayload(null);
      }
      setLoadingFiltered(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeFilters, filters.q, filters.profesion, filters.poliza, filters.ciudad, page]);

  const mergedExplore = useMemo(() => mergeDirectoryPools(explorePool), [explorePool]);

  const resultsHeadline = useMemo(() => buildDirectoryResultsHeadline(filters, FILTER_LABELS), [filters]);

  const navigateWithFilters = useCallback(
    (patch) => {
      const next = { ...filters, ...patch };
      const p = directoryFiltersToSearchParams(next, FILTER_LABELS);
      const qs = p.toString();
      navigate(qs ? `${DIRECTORY_LISTADO_PATH}?${qs}` : DIRECTORY_LISTADO_PATH);
    },
    [filters, navigate]
  );

  const { gridItems, gridTotal, pageCount, demoFallback } = useMemo(() => {
    if (!activeFilters) {
      return { gridItems: [], gridTotal: 0, pageCount: 1, demoFallback: false };
    }
    const apiItems = filteredPayload?.items || [];
    const apiTotal = filteredPayload?.total ?? 0;
    const canDemo = shouldMergeDirectoryDemo(mergedExplore.length);
    const useDemo = canDemo && !loadingFiltered && (filterError || apiTotal === 0);

    if (!useDemo) {
      return {
        gridItems: apiItems,
        gridTotal: apiTotal,
        pageCount: Math.max(1, Math.ceil(apiTotal / PAGE_SIZE)),
        demoFallback: false,
      };
    }

    const demos = filterDirectoryDemoProfiles(filters, getDirectoryDemoProfiles(), FILTER_LABELS);
    const t = demos.length;
    const slice = demos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return {
      gridItems: slice,
      gridTotal: t,
      pageCount: Math.max(1, Math.ceil(t / PAGE_SIZE)),
      demoFallback: true,
    };
  }, [activeFilters, filteredPayload, filterError, loadingFiltered, mergedExplore.length, filters, page]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#FBFAF8' }}>
      <Helmet>
        <title>Directorio de profesionales auditivos en Colombia | OírConecta</title>
        <meta name="description" content="Directorio completo de audiólogos, otorrinolaringólogos y fonoaudiólogos en Colombia. Filtra por ciudad, profesión y póliza. Perfiles verificados." />
        <link rel="canonical" href="https://oirconecta.com/directorio/listado" />
        <meta property="og:title" content="Directorio de profesionales auditivos en Colombia | OírConecta" />
        <meta property="og:description" content="Audiólogos, otólogos y fonoaudiólogos en Colombia. Filtra por ciudad, profesión y póliza." />
        <meta property="og:url" content="https://oirconecta.com/directorio/listado" />
      </Helmet>
      <Header />

      {/* Hero editorial — asimétrico, más respiro */}
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        bgcolor: '#FBFAF8',
        pt: { xs: 14, md: 16 }, pb: { xs: 5, md: 7 },
      }}>
        {/* Halo arena decorativo */}
        <Box aria-hidden sx={{
          position: 'absolute', top: -180, right: -180,
          width: 540, height: 540, borderRadius: '50%',
          background: 'radial-gradient(circle, #D9CDBF55 0%, transparent 70%)',
          filter: 'blur(80px)', pointerEvents: 'none',
        }} />
        {/* Línea editorial */}
        <Box aria-hidden sx={{
          position: 'absolute', top: { md: 110 }, left: '8%', right: '8%', height: 1,
          bgcolor: 'rgba(39,47,80,0.06)', display: { xs: 'none', md: 'block' },
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, px: { xs: 2, sm: 3 } }}>
          <Breadcrumbs separator={<NavigateNext fontSize="small" sx={{ color: '#A1A7B1' }} />} sx={{ mb: 3.5, '& .MuiBreadcrumbs-separator': { mx: 0.5 } }}>
            <Button component={RouterLink} to="/directorio" sx={{
              textTransform: 'none', fontWeight: 600, color: '#6B7280',
              fontFamily: '"DM Sans", sans-serif', minWidth: 0, p: 0,
              '&:hover': { color: '#272F50', bgcolor: 'transparent' },
            }}>
              Directorio
            </Button>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif', fontWeight: 700, color: '#272F50',
            }}>Listado</Typography>
          </Breadcrumbs>

          <Box sx={{
            display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
            gap: { xs: 3, md: 6 }, alignItems: 'end',
          }}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Box sx={{ width: 32, height: 2, bgcolor: '#C9A86A' }} />
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '0.7rem',
                  fontWeight: 700, letterSpacing: '0.24em',
                  textTransform: 'uppercase', color: '#272F50',
                }}>
                  Directorio nacional · Red verificada
                </Typography>
              </Stack>

              <Typography component="h1" sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: { xs: '2.5rem', sm: '3.25rem', md: '4.5rem', lg: '5rem' },
                fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 0.98,
                color: '#272F50', mb: { xs: 2.5, md: 3 },
              }}>
                Encuentra a tu{' '}
                <Box component="span" sx={{ fontStyle: 'italic', color: '#085946' }}>
                  especialista.
                </Box>
              </Typography>
            </Box>

            <Box sx={{ pb: { md: 1.5 } }}>
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: { xs: '1.0625rem', md: '1.1875rem' },
                color: '#6B7280', lineHeight: 1.55, maxWidth: 480,
              }}>
                Audiólogos, otorrinolaringólogos y fonoaudiólogos verificados en toda Colombia.
                Filtra por especialidad, ciudad o cobertura.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, flex: 1, px: { xs: 2, sm: 3 } }}>
        <Paper
          id="buscar-directorio"
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3.5 },
            mb: 5,
            borderRadius: '14px',
            border: '1px solid #E5E0D6',
            bgcolor: '#fff',
            boxShadow: '0 24px 60px rgba(39,47,80,0.08)',
            scrollMarginTop: 96,
          }}
        >
          <SearchEngine directoryMode directoryCompact initialFilters={initialFilters} directoryNavigateBase={DIRECTORY_LISTADO_PATH} />
        </Paper>

        {!activeFilters && (
          <Stack spacing={2} alignItems="flex-start" sx={{ maxWidth: 640 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Seleccione criterios para ver resultados
            </Typography>
            <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
              Use el formulario de arriba: puede filtrar solo por profesión, combinar ciudad y póliza, o buscar por nombre. Cada
              combinación tiene su propia página de resultados en esta misma dirección.
            </Typography>
            <Button component={RouterLink} to="/directorio" variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
              Volver al directorio principal
            </Button>
          </Stack>
        )}

        {activeFilters && loadingExplore && (
          <Stack alignItems="center" py={4}>
            <CircularProgress size={36} />
          </Stack>
        )}

        {activeFilters && !loadingExplore && (
          <DirectorySearchResultsPanel
            filters={filters}
            profesionLabelTodas={PROFESION_LABEL_TODAS}
            polizaLabelTodas={POLIZA_LABEL_TODAS}
            resultsHeadline={resultsHeadline}
            navigateWithFilters={navigateWithFilters}
            gridItems={gridItems}
            gridTotal={gridTotal}
            loadingFiltered={loadingFiltered}
            filterError={filterError}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            demoFallback={demoFallback}
          />
        )}
      </Container>

      <Footer />
    </Box>
  );
}
