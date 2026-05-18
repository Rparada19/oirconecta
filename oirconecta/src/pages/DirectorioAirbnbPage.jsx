import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

import Header from '../components/Header';
import Footer from '../components/Footer';
import DirectoryCardV2 from '../components/directorio/v2/DirectoryCardV2';
import DirectoryCardSkeleton from '../components/directorio/v2/DirectoryCardSkeleton';
import DirectorySearchBar from '../components/directorio/v2/DirectorySearchBar';
import DirectoryFiltersDrawer from '../components/directorio/v2/DirectoryFiltersDrawer';
import DirectoryActiveFilters from '../components/directorio/v2/DirectoryActiveFilters';

import {
  fetchProfessions,
  fetchDepartments,
  fetchFeatured,
  searchDirectoryV2,
} from '../services/directoryDiscoveryService';

const PAGE_SIZE = 24;

function readFiltersFromUrl(sp) {
  return {
    q: sp.get('q') || '',
    professionSlug: sp.get('profesion') || undefined,
    departmentSlug: sp.get('depto') || undefined,
    citySlug: sp.get('ciudad') || undefined,
    modalidad: sp.get('modalidad') || undefined,
    minRating: sp.get('rating') ? Number(sp.get('rating')) : undefined,
    sort: sp.get('orden') || 'ranking',
  };
}

function writeFiltersToUrl(filters) {
  const out = {};
  if (filters.q) out.q = filters.q;
  if (filters.professionSlug) out.profesion = filters.professionSlug;
  if (filters.departmentSlug) out.depto = filters.departmentSlug;
  if (filters.citySlug) out.ciudad = filters.citySlug;
  if (filters.modalidad) out.modalidad = filters.modalidad;
  if (filters.minRating) out.rating = String(filters.minRating);
  if (filters.sort && filters.sort !== 'ranking') out.orden = filters.sort;
  return out;
}

function countActive(filters) {
  let n = 0;
  if (filters.professionSlug) n++;
  if (filters.departmentSlug) n++;
  if (filters.citySlug) n++;
  if (filters.modalidad) n++;
  if (filters.minRating) n++;
  return n;
}

export default function DirectorioAirbnbPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => readFiltersFromUrl(searchParams));
  const [qDraft, setQDraft] = useState(filters.q || '');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [professions, setProfessions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Catálogos arriba (una vez).
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProfessions(), fetchDepartments(), fetchFeatured(8)])
      .then(([p, d, f]) => {
        if (cancelled) return;
        if (p?.data?.data) setProfessions(p.data.data);
        if (d?.data?.data) setDepartments(d.data.data);
        if (f?.data?.data) setFeatured(f.data.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Búsqueda principal cada vez que cambian los filtros.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setOffset(0);
    searchDirectoryV2({ ...filters, limit: PAGE_SIZE, offset: 0 })
      .then((res) => {
        if (cancelled) return;
        if (res?.data?.success) {
          const d = res.data.data || {};
          setItems(d.items || []);
          setTotal(d.total || 0);
        } else {
          setError('No pudimos cargar el directorio. Intenta de nuevo.');
        }
      })
      .catch(() => {
        if (!cancelled) setError('Error de red al consultar el directorio.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  // Sincroniza filtros → URL (sin recargar página).
  useEffect(() => {
    const next = writeFiltersToUrl(filters);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    const nextOffset = offset + PAGE_SIZE;
    if (nextOffset >= total) return;
    setLoadingMore(true);
    try {
      const res = await searchDirectoryV2({ ...filters, limit: PAGE_SIZE, offset: nextOffset });
      if (res?.data?.success) {
        const d = res.data.data || {};
        setItems((prev) => [...prev, ...(d.items || [])]);
        setOffset(nextOffset);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, offset, total, filters]);

  const handleApplyFilters = (next) => setFilters({ ...filters, ...next });
  const handleClearFilters = () =>
    setFilters({ q: '', sort: 'ranking', professionSlug: undefined, departmentSlug: undefined, citySlug: undefined, modalidad: undefined, minRating: undefined });

  const activeCount = countActive(filters);
  const hasMore = items.length < total;

  const heroTitle = useMemo(() => {
    if (filters.professionSlug) {
      const p = professions.find((x) => x.slug === filters.professionSlug);
      return p ? `${p.nombre}s en Colombia` : 'Profesionales auditivos';
    }
    if (filters.departmentSlug) {
      const d = departments.find((x) => x.slug === filters.departmentSlug);
      return d ? `Profesionales en ${d.nombre}` : 'Profesionales por departamento';
    }
    return 'Encuentra al especialista auditivo ideal';
  }, [filters, professions, departments]);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Helmet>
        <title>Directorio de profesionales auditivos | Oír Conecta</title>
        <meta
          name="description"
          content="Encuentra audiólogos, fonoaudiólogos y otorrinos verificados en Colombia. Compara experiencia, reseñas y modalidad presencial o virtual."
        />
      </Helmet>
      <Header />

      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 4, md: 8 },
          pb: { xs: 4, md: 6 },
          background: 'radial-gradient(circle at 20% 0%, rgba(8,89,70,0.10), transparent 55%), radial-gradient(circle at 90% 30%, rgba(39,47,80,0.10), transparent 50%)',
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={2} alignItems="center" textAlign="center" sx={{ mb: { xs: 3, md: 5 } }}>
            <Chip
              label="Directorio verificado"
              sx={{
                bgcolor: 'rgba(8,89,70,0.10)',
                color: 'primary.main',
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 0.5,
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: 30, sm: 38, md: 48 },
                lineHeight: 1.1,
                maxWidth: 760,
                color: 'text.primary',
              }}
            >
              {heroTitle}
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: 'text.secondary', maxWidth: 560, fontSize: { xs: 14, md: 16 } }}
            >
              Audiólogos, fonoaudiólogos y otorrinos con reseñas reales. Filtra por
              ciudad, modalidad y calificación.
            </Typography>
          </Stack>

          <DirectorySearchBar
            value={qDraft}
            onChange={setQDraft}
            onSubmit={() => setFilters((f) => ({ ...f, q: qDraft }))}
            onOpenFilters={() => setDrawerOpen(true)}
            activeFilterCount={activeCount}
          />

          {/* Chips rápidos por profesión */}
          {professions.length > 0 && (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                mt: 3,
                overflowX: 'auto',
                pb: 1,
                justifyContent: { md: 'center' },
                px: { xs: 1, md: 0 },
              }}
            >
              <Chip
                label="Todos"
                onClick={() => setFilters((f) => ({ ...f, professionSlug: undefined }))}
                sx={{
                  bgcolor: !filters.professionSlug ? 'primary.main' : 'background.paper',
                  color: !filters.professionSlug ? '#fff' : 'text.primary',
                  border: '1px solid',
                  borderColor: !filters.professionSlug ? 'primary.main' : 'grey.200',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              />
              {professions.map((p) => {
                const sel = filters.professionSlug === p.slug;
                return (
                  <Chip
                    key={p.slug}
                    label={p.nombre + 's'}
                    onClick={() =>
                      setFilters((f) => ({ ...f, professionSlug: sel ? undefined : p.slug }))
                    }
                    sx={{
                      bgcolor: sel ? 'primary.main' : 'background.paper',
                      color: sel ? '#fff' : 'text.primary',
                      border: '1px solid',
                      borderColor: sel ? 'primary.main' : 'grey.200',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  />
                );
              })}
            </Stack>
          )}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ pb: 10 }}>
        <DirectoryActiveFilters
          value={filters}
          professions={professions}
          departments={departments}
          cities={[]}
          onChange={setFilters}
        />

        {/* Sección destacados (solo cuando no hay filtros aplicados) */}
        {activeCount === 0 && !filters.q && featured.length > 0 && (
          <Box sx={{ mt: 3, mb: 5 }}>
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Profesionales destacados
              </Typography>
              <Button
                component={RouterLink}
                to="/directorio?orden=rating"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Ver más
              </Button>
            </Stack>
            <Grid container spacing={2}>
              {featured.slice(0, 4).map((p) => (
                <Grid item xs={12} sm={6} md={3} key={p.id}>
                  <DirectoryCardV2 profile={p} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Resultados */}
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mt: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {loading ? 'Buscando…' : `${total} resultado${total === 1 ? '' : 's'}`}
          </Typography>
          {!loading && total > 0 && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Mostrando {items.length} de {total}
            </Typography>
          )}
        </Stack>

        {error && (
          <Box sx={{ p: 3, bgcolor: 'error.light', color: '#fff', borderRadius: 2, my: 2 }}>
            <Typography fontWeight={700}>{error}</Typography>
          </Box>
        )}

        <Grid container spacing={2.5}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={`sk-${i}`}>
                  <DirectoryCardSkeleton />
                </Grid>
              ))
            : items.map((p) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
                  <DirectoryCardV2 profile={p} />
                </Grid>
              ))}
        </Grid>

        {!loading && items.length === 0 && !error && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Sin resultados para tu búsqueda
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Prueba quitando filtros o buscando por otra ciudad o profesión.
            </Typography>
            <Button
              variant="contained"
              onClick={handleClearFilters}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
            >
              Limpiar filtros
            </Button>
          </Box>
        )}

        {hasMore && !loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <Button
              onClick={loadMore}
              disabled={loadingMore}
              variant="outlined"
              sx={{
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 700,
                px: 4,
                py: 1.25,
                borderColor: 'primary.main',
                color: 'primary.main',
              }}
            >
              {loadingMore ? 'Cargando…' : 'Ver más profesionales'}
            </Button>
          </Box>
        )}
      </Container>

      <DirectoryFiltersDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        value={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <Footer />
    </Box>
  );
}
