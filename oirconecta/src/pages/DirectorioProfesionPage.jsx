import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Box, Button, Container, Grid, Stack, Typography } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RecordVoiceOverOutlinedIcon from '@mui/icons-material/RecordVoiceOverOutlined';
import HearingOutlinedIcon from '@mui/icons-material/HearingOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';

import Header from '../components/Header';
import Footer from '../components/Footer';
import DirectoryCardV2 from '../components/directorio/v2/DirectoryCardV2';
import DirectoryCardSkeleton from '../components/directorio/v2/DirectoryCardSkeleton';
import { fetchFeaturedByProfession, searchDirectoryV2 } from '../services/directoryDiscoveryService';

const PAGE_SIZE = 24;

// Contexto por profesión (imagen + qué hace + cuándo consultar)
const PROFESSION_CONTEXT = {
  fonoaudiologia: {
    icon: RecordVoiceOverOutlinedIcon,
    image: 'https://images.pexels.com/photos/8613122/pexels-photo-8613122.jpeg?w=1200&h=900&auto=compress&cs=tinysrgb&fit=crop',
    descripcion: 'El fonoaudiólogo evalúa y rehabilita la comunicación: lenguaje, habla, voz y audición. Es clave en la adaptación de audífonos y en la terapia auditivo-verbal de niños y adultos.',
    queHacen: [
      'Evaluación de lenguaje, habla y voz',
      'Terapia auditivo-verbal post audífono o implante',
      'Tratamiento de tartamudez y trastornos del habla',
      'Acompañamiento en rehabilitación auditiva',
    ],
    cuandoConsultar: [
      'Niño que no habla a su edad esperada',
      'Adulto con dificultad para entender después de adaptarse audífono',
      'Cambios recientes en la voz o el habla',
      'Post implante coclear (rehabilitación)',
    ],
  },
  audiologia: {
    icon: HearingOutlinedIcon,
    image: 'https://images.pexels.com/photos/36670377/pexels-photo-36670377.jpeg?w=1200&h=900&auto=compress&cs=tinysrgb&fit=crop',
    descripcion: 'El audiólogo es el especialista en la evaluación, diagnóstico y adaptación de audífonos. Hace tu audiometría, te orienta sobre tecnología y te acompaña en la programación y seguimiento.',
    queHacen: [
      'Audiometrías y pruebas auditivas completas',
      'Adaptación y programación de audífonos',
      'Seguimiento del proceso auditivo',
      'Asesoría en prevención y conservación auditiva',
    ],
    cuandoConsultar: [
      'Sospecha de pérdida auditiva (subes mucho el TV)',
      'Antes de comprar tu primer audífono',
      'Para ajustar un audífono que no funciona como esperas',
      'Audiometría preventiva (cada 2-3 años después de los 50)',
    ],
  },
  otorrinolaringologia: {
    icon: MedicalServicesOutlinedIcon,
    image: 'https://images.pexels.com/photos/5206946/pexels-photo-5206946.jpeg?w=1200&h=900&auto=compress&cs=tinysrgb&fit=crop',
    descripcion: 'El otorrinolaringólogo (ORL) es el médico especialista en oído, nariz y garganta. Diagnostica y trata enfermedades del oído, prescribe medicamentos y realiza cirugías cuando hace falta.',
    queHacen: [
      'Diagnóstico médico de enfermedades del oído',
      'Tratamiento de otitis, vértigo, tinnitus',
      'Cirugías de oído medio y externo',
      'Manejo de pérdidas auditivas con causa médica',
    ],
    cuandoConsultar: [
      'Pérdida auditiva súbita (¡urgencia!)',
      'Otitis recurrentes o crónicas',
      'Vértigo, mareo o problemas de equilibrio',
      'Zumbido persistente (tinnitus)',
      'Dolor de oído o secreciones',
    ],
  },
  otologia: {
    icon: BiotechOutlinedIcon,
    image: 'https://images.pexels.com/photos/5206942/pexels-photo-5206942.jpeg?w=1200&h=900&auto=compress&cs=tinysrgb&fit=crop',
    descripcion: 'El otólogo es el ORL sub-especializado en oído. Maneja casos complejos: implantes cocleares, cirugías de oído medio, schwannomas y patologías del nervio auditivo.',
    queHacen: [
      'Cirugía de implante coclear',
      'Cirugía de oído medio (otosclerosis, colesteatoma)',
      'Evaluación de candidatura a implantes auditivos',
      'Tratamiento de patología compleja del oído',
    ],
    cuandoConsultar: [
      'Pérdida auditiva severa o profunda',
      'Evaluación para implante coclear',
      'Otosclerosis confirmada',
      'Referencia de ORL para caso quirúrgico complejo',
    ],
  },
};

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

      {/* BANNER CONTEXTO PROFESIÓN */}
      {PROFESSION_CONTEXT[slug] && (
        <Box sx={{ py: { xs: 5, md: 7 }, bgcolor: '#fff' }}>
          <Container maxWidth="lg">
            <Box sx={{
              position: 'relative', borderRadius: '12px', overflow: 'hidden',
              boxShadow: `0 20px 50px ${C.navy}14`,
              border: `1px solid ${C.grisClaro}33`,
            }}>
              <Grid container>
                {/* Imagen profesión */}
                <Grid item xs={12} md={5} sx={{ position: 'relative', minHeight: { xs: 280, md: 'auto' } }}>
                  <Box
                    component="img"
                    src={PROFESSION_CONTEXT[slug].image}
                    alt={`${profession?.nombre || 'Profesión'} - OírConecta`}
                    loading="lazy"
                    sx={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover', display: 'block',
                    }}
                  />
                  <Box sx={{
                    position: 'absolute', inset: 0,
                    background: { xs: `linear-gradient(180deg, transparent 40%, ${C.verdeProfundo}DD 100%)`,
                                  md: `linear-gradient(to right, transparent 50%, rgba(255,255,255,0.05) 100%)` },
                  }} />
                  <Box sx={{
                    position: 'absolute', bottom: { xs: 20, md: 24 }, left: { xs: 20, md: 24 },
                    bgcolor: 'rgba(255,255,255,0.95)', borderRadius: '8px',
                    px: 1.75, py: 0.875, display: 'flex', alignItems: 'center', gap: 1,
                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                  }}>
                    {(() => {
                      const Icon = PROFESSION_CONTEXT[slug].icon;
                      return <Icon sx={{ fontSize: 20, color: C.verde }} />;
                    })()}
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
                      fontWeight: 700, color: C.navy, letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}>
                      {profession?.nombre || 'Profesión'}
                    </Typography>
                  </Box>
                </Grid>

                {/* Contenido */}
                <Grid item xs={12} md={7}>
                  <Box sx={{ p: { xs: 3.5, md: 5 } }}>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
                      fontWeight: 600, letterSpacing: '0.18em',
                      textTransform: 'uppercase', color: C.verde, mb: 1.5,
                    }}>¿Qué hacen?</Typography>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: { xs: '1rem', md: '1.0625rem' },
                      color: C.gris, lineHeight: 1.65, mb: 3.5,
                    }}>
                      {PROFESSION_CONTEXT[slug].descripcion}
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Typography sx={{
                          fontFamily: '"Playfair Display", Georgia, serif',
                          fontSize: '1.0625rem', fontWeight: 600,
                          color: C.navy, mb: 1.5,
                        }}>Qué hacen</Typography>
                        <Stack spacing={1}>
                          {PROFESSION_CONTEXT[slug].queHacen.map((q) => (
                            <Box key={q} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <CheckCircleOutlineIcon sx={{ fontSize: 16, color: C.verde, mt: '3px', flexShrink: 0 }} />
                              <Typography sx={{
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: '0.875rem', color: C.navy, lineHeight: 1.5,
                              }}>{q}</Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography sx={{
                          fontFamily: '"Playfair Display", Georgia, serif',
                          fontSize: '1.0625rem', fontWeight: 600,
                          color: C.navy, mb: 1.5,
                        }}>Cuándo consultar</Typography>
                        <Stack spacing={1}>
                          {PROFESSION_CONTEXT[slug].cuandoConsultar.map((c) => (
                            <Box key={c} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <Box sx={{
                                width: 6, height: 6, borderRadius: '50%',
                                bgcolor: C.oro, mt: '7px', flexShrink: 0,
                              }} />
                              <Typography sx={{
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: '0.875rem', color: C.navy, lineHeight: 1.5,
                              }}>{c}</Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Container>
        </Box>
      )}

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
