/**
 * BrandPageTemplate — Plantilla editorial compartida para las 16 páginas de
 * marca (13 audífonos + 3 implantes). Cada página solo pasa data; el template
 * renderiza con el sistema de diseño OírConecta editorial.
 *
 * Props:
 *   brand: {
 *     nombre: 'Widex',
 *     logo: '/logos/marcas/Widex-logo.jpg',
 *     eslogan: 'Tecnología PureSound™',
 *     descripcion: '...',
 *     color: '#1A1A1A',      // color signature de la marca
 *     stats: [{ value: '4.8', label: 'Rating' }, ...]
 *   }
 *   productos: [{ nombre, categoria, descripcion, caracteristicas[] }]
 *   tecnologias: [{ Icon, titulo, descripcion }]
 *   categoria: 'audifonos' | 'implantes'   (para breadcrumb)
 *   seoTitle, seoDescription, canonical
 */
import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Grid, Stack } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ArrowForward, CheckCircleOutline } from '@mui/icons-material';
import Header from '../Header';
import Footer from '../Footer';
import {
  SectionEyebrow, SectionTitle, CTAArrowLink, C,
} from './EditorialKit';
import { useReveal } from '../../hooks/useReveal';
import { Swoosh } from '../brand/BrandMark';

function BrandHero({ brand, productosCount }) {
  const text = useReveal({ threshold: 0.1 });
  const card = useReveal({ threshold: 0.15 });

  const stats = brand.stats || [
    { value: brand.rating || '—', label: 'Rating' },
    { value: String(productosCount).padStart(2, '0'), label: 'Modelos' },
  ];

  return (
    <Box component="section" sx={{
      position: 'relative', overflow: 'hidden',
      bgcolor: C.blanco,
      pt: { xs: 13, md: 15 }, pb: { xs: 7, md: 11 },
    }}>
      {/* Swoosh signature */}
      <Box aria-hidden sx={{
        position: 'absolute', top: '8%', left: -120,
        width: { xs: 480, md: 720 }, opacity: 0.05, pointerEvents: 'none',
        transform: 'rotate(-8deg)',
      }}>
        <Swoosh width="100%" color={C.navy} accent={brand.color} />
      </Box>
      {/* Halo color marca arriba derecha */}
      <Box aria-hidden sx={{
        position: 'absolute', top: -160, right: -160, width: 480, height: 480,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${brand.color}1f 0%, transparent 70%)`,
        filter: 'blur(80px)', pointerEvents: 'none',
      }} />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
          {/* Texto */}
          <Grid item xs={12} md={7}>
            <Box ref={text.ref} sx={{
              opacity: text.visible ? 1 : 0,
              transform: text.visible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'all 0.9s cubic-bezier(0.2,0.7,0.2,1)',
            }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                <Box component={RouterLink} to="/" sx={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '0.78rem', color: C.gris,
                  textDecoration: 'none', '&:hover': { color: C.navy },
                }}>Inicio</Box>
                <Typography sx={{ color: C.grisClaro, fontSize: '0.78rem' }}>/</Typography>
                <Box component={RouterLink} to="/audifonos" sx={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '0.78rem', color: C.gris,
                  textDecoration: 'none', '&:hover': { color: C.navy },
                }}>Audífonos</Box>
                <Typography sx={{ color: C.grisClaro, fontSize: '0.78rem' }}>/</Typography>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '0.78rem',
                  fontWeight: 700, color: C.navy,
                }}>{brand.nombre}</Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1.75} sx={{ mb: 4 }}>
                <Box sx={{ width: 32, height: 2, bgcolor: brand.color }} />
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.24em',
                  textTransform: 'uppercase', color: brand.color,
                }}>
                  Marca · {brand.nombre}
                </Typography>
              </Stack>

              <Typography component="h1" sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: { xs: '2.75rem', sm: '3.5rem', md: '5rem', lg: '5.75rem' },
                fontWeight: 500, lineHeight: 0.98,
                letterSpacing: '-0.025em',
                color: C.navy, mb: 2,
              }}>
                {brand.nombre}
                <Box component="span" sx={{
                  display: 'block',
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontStyle: 'italic', color: brand.color,
                  fontSize: { xs: '1.5rem', md: '2.5rem' }, fontWeight: 500,
                  lineHeight: 1, mt: 2, letterSpacing: '-0.015em',
                }}>
                  — {brand.eslogan}
                </Box>
              </Typography>

              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: { xs: '1.0625rem', md: '1.1875rem' },
                color: C.gris, lineHeight: 1.6, mb: 4.5, maxWidth: 600,
              }}>
                {brand.descripcion}
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} alignItems={{ sm: 'center' }}>
                <Box
                  component={RouterLink}
                  to={`/contacto?asunto=${encodeURIComponent(`Solicitud de información - ${brand.nombre}`)}`}
                  sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 1.25,
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.95rem', fontWeight: 700,
                    bgcolor: C.navy, color: '#fff',
                    px: 3.5, py: 1.85, borderRadius: '6px',
                    textDecoration: 'none', letterSpacing: '0.02em',
                    boxShadow: `0 10px 28px ${C.navy}33`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: C.navyDark, transform: 'translateY(-2px)',
                      boxShadow: `0 14px 32px ${C.navy}44`,
                    },
                  }}
                >
                  Solicitar información
                  <ArrowForward sx={{ fontSize: 18 }} />
                </Box>
                <CTAArrowLink to="/directorio/listado" label="Buscar audiólogo cerca" />
              </Stack>
            </Box>
          </Grid>

          {/* Card visual marca */}
          <Grid item xs={12} md={5}>
            <Box ref={card.ref} sx={{
              opacity: card.visible ? 1 : 0,
              transform: card.visible ? 'translateY(0)' : 'translateY(28px)',
              transition: 'all 1s cubic-bezier(0.2,0.7,0.2,1) 0.15s',
            }}>
              <Box sx={{
                borderRadius: '14px', overflow: 'hidden',
                bgcolor: '#fff',
                border: `1px solid ${C.border}`,
                boxShadow: `0 24px 60px ${C.navy}1a`,
                p: { xs: 3, md: 3.5 },
              }}>
                {/* Logo grande */}
                <Box sx={{
                  bgcolor: C.cremaCalida,
                  borderRadius: '10px', p: 3.5, mb: 3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  minHeight: 120,
                  borderLeft: `4px solid ${brand.color}`,
                }}>
                  <Box component="img" src={brand.logo} alt={brand.nombre}
                    sx={{ maxHeight: 72, maxWidth: '85%', objectFit: 'contain' }}
                  />
                </Box>

                {/* Stats */}
                <Grid container spacing={1.5}>
                  {stats.map((s) => (
                    <Grid item xs={6} key={s.label}>
                      <Box sx={{
                        borderRadius: '8px', p: 1.75,
                        bgcolor: `${brand.color}08`,
                        border: `1px solid ${brand.color}22`,
                        textAlign: 'center',
                      }}>
                        <Typography sx={{
                          fontFamily: '"Playfair Display", Georgia, serif',
                          fontSize: '1.5rem', fontWeight: 600,
                          color: C.navy, lineHeight: 1, mb: 0.5,
                          letterSpacing: '-0.02em',
                        }}>
                          {s.value}
                        </Typography>
                        <Typography sx={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em',
                          textTransform: 'uppercase', color: C.gris,
                        }}>
                          {s.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function ProductoCard({ producto, brand, n, delay }) {
  const { ref, visible } = useReveal({ threshold: 0.18 });
  return (
    <Box ref={ref} sx={{
      bgcolor: '#fff',
      border: `1px solid ${C.border}`,
      borderRadius: '12px', p: { xs: 3, md: 3.5 },
      height: '100%',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `all 0.85s cubic-bezier(0.2,0.7,0.2,1) ${delay}s`,
      '&:hover': {
        borderColor: brand.color,
        transform: 'translateY(-6px)',
        boxShadow: `0 24px 48px ${C.navy}1a`,
      },
    }}>
      {producto.destacado && (
        <Box sx={{
          position: 'absolute', top: 16, right: 16,
          bgcolor: brand.color, color: '#fff',
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.18em',
          textTransform: 'uppercase', px: 1.25, py: 0.5, borderRadius: '4px',
        }}>
          Destacado
        </Box>
      )}

      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Typography sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontStyle: 'italic', fontSize: '1.5rem', color: brand.color, fontWeight: 600,
        }}>
          №{String(n).padStart(2, '0')}
        </Typography>
        {producto.categoria && (
          <Box sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: C.gris,
            border: `1px solid ${C.border}`, px: 1.25, py: 0.4, borderRadius: '4px',
          }}>
            {producto.categoria}
          </Box>
        )}
      </Stack>

      <Typography component="h3" sx={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: { xs: '1.5rem', md: '1.75rem' }, fontWeight: 500,
        color: C.navy, lineHeight: 1.15, mb: 1.5, letterSpacing: '-0.01em',
      }}>
        {producto.nombre}
      </Typography>

      <Typography sx={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.95rem', color: C.gris, lineHeight: 1.55, mb: 3,
      }}>
        {producto.descripcion}
      </Typography>

      <Box sx={{ mt: 'auto' }}>
        {producto.caracteristicas?.slice(0, 4).map((c) => (
          <Stack key={c} direction="row" spacing={1.25} alignItems="flex-start" sx={{ mb: 0.85 }}>
            <CheckCircleOutline sx={{ fontSize: 15, color: brand.color, mt: 0.4, flexShrink: 0 }} />
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.85rem', color: C.navy, lineHeight: 1.45,
            }}>
              {c}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}

function TecnologiaCard({ t, brand, delay }) {
  const { ref, visible } = useReveal({ threshold: 0.2 });
  return (
    <Box ref={ref} sx={{
      bgcolor: '#fff',
      border: `1px solid ${C.border}`,
      borderRadius: '12px', p: 3.5,
      height: '100%',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `all 0.85s cubic-bezier(0.2,0.7,0.2,1) ${delay}s`,
      '&:hover': {
        borderColor: brand.color,
        transform: 'translateY(-4px)',
        boxShadow: `0 16px 36px ${C.navy}14`,
      },
    }}>
      <Box sx={{
        width: 52, height: 52, borderRadius: '10px',
        bgcolor: `${brand.color}14`, color: brand.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5,
      }}>
        {t.Icon && <t.Icon sx={{ fontSize: 26 }} />}
      </Box>
      <Typography component="h3" sx={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: '1.25rem', fontWeight: 600,
        color: C.navy, mb: 1.25, lineHeight: 1.2, letterSpacing: '-0.01em',
      }}>
        {t.titulo}
      </Typography>
      <Typography sx={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.92rem', color: C.gris, lineHeight: 1.55,
      }}>
        {t.descripcion}
      </Typography>
    </Box>
  );
}

export default function BrandPageTemplate({
  brand, productos = [], tecnologias = [],
  categoria = 'audifonos',
  seoTitle, seoDescription, canonical,
}) {
  const navigate = useNavigate();
  const baseUrl = `https://oirconecta.com/${categoria}/${brand.slug || ''}`;

  return (
    <Box component="main" sx={{ bgcolor: C.blanco, minHeight: '100vh' }}>
      <Helmet>
        <title>{seoTitle || `Audífonos ${brand.nombre} en Colombia — OírConecta`}</title>
        <meta name="description" content={seoDescription || `Conoce los audífonos ${brand.nombre} disponibles en Colombia. ${brand.eslogan}.`} />
        <link rel="canonical" href={canonical || baseUrl} />
        <meta property="og:title" content={seoTitle || `${brand.nombre} — OírConecta`} />
        <meta property="og:url" content={canonical || baseUrl} />
      </Helmet>

      <Header />

      <BrandHero brand={brand} productosCount={productos.length} />

      {/* PRODUCTOS */}
      {productos.length > 0 && (
        <Box component="section" sx={{ bgcolor: C.cremaCalida, py: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Box sx={{
              display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
              gap: { xs: 4, md: 6 }, alignItems: 'end', mb: { xs: 5, md: 7 },
            }}>
              <Box>
                <SectionEyebrow color={C.navy} dash={brand.color} sx={{ mb: 3 }}>
                  Línea actual
                </SectionEyebrow>
                <SectionTitle before={`${productos.length} modelos de`} accent={brand.nombre} size="md" accentColor={brand.color} />
              </Box>
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: { xs: '1.05rem', md: '1.15rem' }, color: C.gris,
                lineHeight: 1.6, maxWidth: 540, pb: { md: 1.5 },
              }}>
                Disponibles a través de los audiólogos verificados de la red OírConecta.
                Pregunta a tu profesional cuál se adapta mejor a tu pérdida.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {productos.map((p, i) => (
                <Grid item xs={12} sm={6} md={3} key={p.nombre}>
                  <ProductoCard producto={p} brand={brand} n={i + 1} delay={i * 0.05} />
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* TECNOLOGÍAS */}
      {tecnologias.length > 0 && (
        <Box component="section" sx={{ bgcolor: C.blanco, py: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Box sx={{ mb: { xs: 5, md: 7 } }}>
              <SectionEyebrow color={C.navy} dash={C.oro} sx={{ mb: 3 }}>
                Tecnología
              </SectionEyebrow>
              <SectionTitle before="Innovación que" accent="se siente." size="md" />
            </Box>
            <Grid container spacing={3}>
              {tecnologias.map((t, i) => (
                <Grid item xs={12} sm={6} md={3} key={t.titulo}>
                  <TecnologiaCard t={t} brand={brand} delay={i * 0.06} />
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* CTA FINAL */}
      <Box component="section" sx={{
        bgcolor: C.navy, color: '#fff', py: { xs: 8, md: 12 },
        position: 'relative', overflow: 'hidden',
      }}>
        <Box aria-hidden sx={{
          position: 'absolute', top: -120, right: -120, width: 400, height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${brand.color}44 0%, transparent 70%)`,
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
          <SectionEyebrow color={C.oro} dash={brand.color} sx={{ mb: 3, justifyContent: 'center', display: 'inline-flex' }}>
            Próximo paso
          </SectionEyebrow>
          <SectionTitle
            before="¿Quieres conocer"
            accent={brand.nombre}
            after="con un especialista?"
            size="lg"
            accentColor={brand.color}
            sx={{ color: '#fff', mb: 3 }}
          />
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '1.05rem', color: '#D9CDBFcc', mb: 4, maxWidth: 580, mx: 'auto',
          }}>
            Un audiólogo verificado de OírConecta te orienta sobre los modelos {brand.nombre} que mejor se adaptan a tu caso.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" alignItems="center">
            <Box
              component={RouterLink}
              to={`/contacto?asunto=${encodeURIComponent(`Solicitud de información - ${brand.nombre}`)}`}
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1.25,
                bgcolor: C.oro, color: C.navy,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.95rem', fontWeight: 700,
                px: 4, py: 1.85, borderRadius: '6px',
                textDecoration: 'none', letterSpacing: '0.02em',
                boxShadow: `0 10px 28px ${C.oro}55`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: '#D4B97A', transform: 'translateY(-2px)',
                  boxShadow: `0 14px 32px ${C.oro}66`,
                },
              }}
            >
              Solicitar información
              <ArrowForward sx={{ fontSize: 18 }} />
            </Box>
            <CTAArrowLink to={`/${categoria}`} label="Ver más marcas" />
          </Stack>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
