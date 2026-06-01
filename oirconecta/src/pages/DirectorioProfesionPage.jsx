import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Box, Button, Container, Grid, Stack, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

import Header from '../components/Header';
import Footer from '../components/Footer';
import DirectoryCardV2 from '../components/directorio/v2/DirectoryCardV2';
import DirectoryCardSkeleton from '../components/directorio/v2/DirectoryCardSkeleton';
import { fetchFeaturedByProfession, searchDirectoryV2 } from '../services/directoryDiscoveryService';

const PAGE_SIZE = 24;

export default function DirectorioProfesionPage() {
  const { slug } = useParams();
  const [profession, setProfession] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchFeaturedByProfession(slug, 6),
      searchDirectoryV2({ professionSlug: slug, limit: PAGE_SIZE }),
    ])
      .then(([fRes, sRes]) => {
        if (cancelled) return;
        if (fRes?.data?.success) {
          setProfession(fRes.data.data?.profession || null);
          setFeatured(fRes.data.data?.items || []);
        }
        if (sRes?.data?.success) {
          const d = sRes.data.data || {};
          setItems(d.items || []);
          setTotal(d.total || 0);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const tituloPlural = profession ? `${profession.nombre}s` : 'Profesionales';

  const C = { navy: '#272F50', verde: '#085946', verdeProfundo: '#00382B',
    oro: '#C9A86A', blanco: '#FBFAF8', gris: '#6B7280', grisClaro: '#A1A7B1', arena: '#D9CDBF' };

  return (
    <Box sx={{ bgcolor: C.blanco, minHeight: '100vh' }}>
      <Helmet>
        <title>{`${tituloPlural} en Colombia | OírConecta`}</title>
        <meta name="description" content={`Encuentra ${tituloPlural.toLowerCase()} verificados en Colombia. Compara reseñas, ciudad y modalidad.`} />
      </Helmet>
      <Header />

      {/* HERO */}
      <Box sx={{ position: 'relative', overflow: 'hidden', pt: { xs: 14, md: 16 }, pb: { xs: 4, md: 6 }, bgcolor: C.blanco }}>
        <Box sx={{
          position: 'absolute', top: -180, right: -180,
          width: 480, height: 480, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.arena}50 0%, transparent 70%)`,
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Button
            component={RouterLink} to="/directorio"
            startIcon={<ArrowBackRoundedIcon />}
            sx={{
              fontFamily: '"DM Sans", sans-serif', textTransform: 'none',
              fontWeight: 600, color: C.gris, mb: 3, p: 0,
              '&:hover': { color: C.navy, bgcolor: 'transparent' },
            }}
          >Todo el directorio</Button>

          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.5 }}>
            <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
              fontWeight: 600, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: C.verde,
            }}>Directorio · {profession?.nombre || 'Profesionales'}</Typography>
          </Stack>

          <Typography component="h1" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '2.25rem', md: '3.5rem' }, fontWeight: 600,
            lineHeight: 1.08, color: C.navy, letterSpacing: '-0.018em', mb: 2.5,
          }}>
            {tituloPlural}{' '}
            <Box component="span" sx={{ fontStyle: 'italic', color: C.verde, fontWeight: 500 }}>
              en Colombia
            </Box>
          </Typography>

          {profession?.descripcion && (
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: '1.0625rem', md: '1.1875rem' },
              color: C.gris, lineHeight: 1.6, maxWidth: 720, mb: 2,
            }}>
              {profession.descripcion}
            </Typography>
          )}

          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            px: 1.75, py: 0.875, borderRadius: '6px',
            bgcolor: `${C.verde}12`, border: `1px solid ${C.verde}33`,
          }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: C.verde }} />
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif', fontSize: '0.875rem',
              fontWeight: 600, color: C.verdeProfundo,
            }}>
              {total} profesional{total === 1 ? '' : 'es'} disponible{total === 1 ? '' : 's'}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Box sx={{ pb: 6 }}>
        <Container maxWidth="lg">
          {featured.length > 0 && (
            <Box sx={{ mb: 6 }}>
              <Typography component="h2" sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: { xs: '1.5rem', md: '1.875rem' }, fontWeight: 600,
                color: C.navy, letterSpacing: '-0.01em', mb: 3,
              }}>
                Mejor{' '}
                <Box component="span" sx={{ fontStyle: 'italic', color: C.verde, fontWeight: 500 }}>
                  calificados
                </Box>
              </Typography>
              <Grid container spacing={{ xs: 2.5, md: 3 }}>
                {featured.slice(0, 4).map((p) => (
                  <Grid item xs={12} sm={6} md={3} key={p.id}>
                    <DirectoryCardV2 profile={p} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Typography component="h2" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '1.5rem', md: '1.875rem' }, fontWeight: 600,
            color: C.navy, letterSpacing: '-0.01em', mb: 3,
          }}>
            Todos los {tituloPlural.toLowerCase()}
          </Typography>
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

          {!loading && items.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Aún no hay {tituloPlural.toLowerCase()} registrados
              </Typography>
              <Button
                component={RouterLink}
                to="/directorio"
                variant="contained"
                sx={{ mt: 2, borderRadius: 8, textTransform: 'none', fontWeight: 700 }}
              >
                Ver todo el directorio
              </Button>
            </Box>
          )}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
