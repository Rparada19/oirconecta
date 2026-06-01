import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Grid, Stack, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import {
  PeopleOutlineOutlined, PsychologyOutlined, HearingOutlined, SupportOutlined,
  VisibilityOutlined, FlagOutlined, ArrowForward,
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';

const C = {
  navy: '#272F50', navyLight: '#4054B2', verde: '#085946',
  verdeProfundo: '#00382B', oro: '#C9A86A', blanco: '#FBFAF8',
  gris: '#6B7280', grisClaro: '#A1A7B1', arena: '#D9CDBF',
};

const HERO_IMAGE = 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=1600&h=1100&q=80&auto=format&fit=crop';

const VALORES = [
  { icon: PeopleOutlineOutlined, title: 'Cercanía humana', text: 'Personas que escuchan, no protocolos. La consulta es un encuentro, no un trámite.' },
  { icon: PsychologyOutlined,    title: 'Decisiones informadas', text: 'Información clara y honesta para que decidas con calma, sin presión comercial.' },
  { icon: HearingOutlined,       title: 'Salud auditiva integral', text: 'Acompañamos cada etapa: detección, adaptación, seguimiento y vida cotidiana.' },
  { icon: SupportOutlined,       title: 'Acompañamiento real', text: 'No te abandonamos después de la venta. Estamos antes, durante y después.' },
];

const NosotrosPage = () => (
  <>
    <Helmet>
      <title>Nosotros - OírConecta | Plataforma y red de servicios auditivos</title>
      <meta name="description" content="OírConecta: referencia de valores, educación y red de profesionales auditivos verificados en Colombia. Quiénes somos, qué hacemos y por qué importamos." />
      <link rel="canonical" href="https://oirconecta.com/nosotros" />
    </Helmet>
    <Header />

    {/* HERO */}
    <Box sx={{ position: 'relative', overflow: 'hidden', pt: { xs: 14, md: 16 }, pb: { xs: 6, md: 9 }, bgcolor: C.blanco }}>
      <Box sx={{
        position: 'absolute', top: -180, right: -180,
        width: 540, height: 540, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.arena}50 0%, transparent 70%)`,
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
              <Box sx={{ width: 32, height: 2, bgcolor: C.verde }} />
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
                fontWeight: 600, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: C.verde,
              }}>Quiénes somos</Typography>
            </Stack>
            <Typography component="h1" id="quienes-somos" sx={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.75rem' },
              fontWeight: 600, lineHeight: 1.08, color: C.navy,
              letterSpacing: '-0.018em', mb: 3,
            }}>
              Una red para{' '}
              <Box component="span" sx={{ fontStyle: 'italic', color: C.verde, fontWeight: 500 }}>
                cuidar tu audición
              </Box>{' '}toda la vida.
            </Typography>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: '1.0625rem', md: '1.1875rem' },
              lineHeight: 1.65, color: C.gris, mb: 4, maxWidth: 540,
            }}>
              OírConecta es la plataforma que conecta a personas con profesionales auditivos verificados en Colombia. Sin marketing, sin promesas vacías —solo información clara, acompañamiento y cuidado.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                component={RouterLink} to="/directorio/listado"
                variant="contained" size="large" endIcon={<ArrowForward />}
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  background: '#272F50 !important', color: '#fff !important', fontWeight: 700,
                  fontSize: '0.9375rem', px: 3.5, py: 1.75,
                  borderRadius: '6px',
                  boxShadow: `0 6px 18px ${C.navy}33`,
                  '&:hover': { background: '#1a1f38 !important', transform: 'translateY(-2px)' },
                }}
              >Conocer la red</Button>
              <Button
                component={RouterLink} to="/servicios"
                variant="outlined" size="large"
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  color: C.navy, borderColor: C.grisClaro, borderWidth: '1.5px',
                  fontWeight: 600, fontSize: '0.9375rem', px: 3.5, py: 1.75,
                  borderRadius: '6px',
                  '&:hover': { borderColor: C.navy, borderWidth: '1.5px', bgcolor: 'rgba(39,47,80,0.04)' },
                }}
              >Ver servicios</Button>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{
              position: 'relative', borderRadius: '12px', overflow: 'hidden',
              boxShadow: `0 20px 50px ${C.navy}1f`,
              aspectRatio: { xs: '4/3', md: '5/6' }, maxHeight: { md: 640 },
            }}>
              <Box component="img" src={HERO_IMAGE}
                alt="Equipo de profesionales auditivos OírConecta"
                loading="eager"
                decoding="async"
                fetchpriority="high"
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>

    {/* QUÉ HACEMOS */}
    <Box id="que-hacemos" component="section" sx={{ py: { xs: 6, md: 9 }, bgcolor: '#fff', scrollMarginTop: 96 }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 }, maxWidth: 720, mx: 'auto' }}>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.25} sx={{ mb: 2.5 }}>
            <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
              fontWeight: 600, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: C.verde,
            }}>Qué hacemos</Typography>
            <Box sx={{ width: 28, height: 2, bgcolor: C.verde }} />
          </Stack>
          <Typography component="h2" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: { xs: '2rem', md: '2.875rem' }, fontWeight: 600,
            letterSpacing: '-0.018em', lineHeight: 1.1, color: C.navy, mb: 2,
          }}>
            Cuatro principios que{' '}
            <Box component="span" sx={{ fontStyle: 'italic', color: C.verde, fontWeight: 500 }}>
              nos guían
            </Box>
          </Typography>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif', fontSize: '1.0625rem',
            color: C.gris, lineHeight: 1.6,
          }}>
            Cada decisión, cada artículo y cada profesional de la red comparten estos valores.
          </Typography>
        </Box>
        <Grid container spacing={{ xs: 2.5, md: 3 }}>
          {VALORES.map((v) => {
            const Icon = v.icon;
            return (
              <Grid item xs={12} sm={6} md={3} key={v.title}>
                <Box sx={{
                  p: 3.5, borderRadius: '10px', bgcolor: C.blanco,
                  border: `1px solid ${C.grisClaro}33`, height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: `${C.verde}55`, transform: 'translateY(-4px)',
                    boxShadow: `0 12px 28px ${C.navy}12`,
                  },
                }}>
                  <Box sx={{
                    width: 48, height: 48, borderRadius: '8px',
                    bgcolor: `${C.verde}12`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5,
                  }}><Icon sx={{ fontSize: 26, color: C.verde }} /></Box>
                  <Typography sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '1.1875rem', fontWeight: 600,
                    color: C.navy, lineHeight: 1.25, mb: 1.25,
                  }}>{v.title}</Typography>
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif', fontSize: '0.9375rem',
                    color: C.gris, lineHeight: 1.6,
                  }}>{v.text}</Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>

    {/* MISIÓN + VISIÓN */}
    <Box id="mision" component="section" sx={{ py: { xs: 6, md: 9 }, bgcolor: C.blanco, scrollMarginTop: 96 }}>
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, md: 4 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{
              position: 'relative', overflow: 'hidden', borderRadius: '12px',
              p: { xs: 4, md: 6 }, height: '100%',
              background: `linear-gradient(135deg, ${C.verde} 0%, ${C.verdeProfundo} 100%)`,
              color: '#fff',
            }}>
              <Box sx={{
                position: 'absolute', top: -80, right: -80,
                width: 280, height: 280, borderRadius: '50%',
                background: `radial-gradient(circle, ${C.oro}26 0%, transparent 70%)`,
                filter: 'blur(40px)', pointerEvents: 'none',
              }} />
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: '10px',
                  bgcolor: 'rgba(201,168,106,0.18)',
                  border: '1.5px solid rgba(201,168,106,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
                }}><FlagOutlined sx={{ fontSize: 28, color: C.oro }} /></Box>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
                  fontWeight: 600, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: C.oro, mb: 1.5,
                }}>Nuestra misión</Typography>
                <Typography component="h3" id="mision-heading" sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: { xs: '1.5rem', md: '1.875rem' }, fontWeight: 600,
                  color: '#fff', lineHeight: 1.2, mb: 2.5, letterSpacing: '-0.01em',
                }}>
                  Acompañar a cada persona en su{' '}
                  <Box component="span" sx={{ fontStyle: 'italic', color: C.oro }}>
                    camino auditivo
                  </Box>
                </Typography>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '1.0625rem',
                  color: 'rgba(255,255,255,0.85)', lineHeight: 1.65,
                }}>
                  Conectar a personas con profesionales auditivos verificados, ofrecer información clara y útil, y acompañar cada decisión —desde la primera duda hasta el seguimiento de por vida.
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6} id="vision">
            <Box sx={{
              position: 'relative', overflow: 'hidden', borderRadius: '12px',
              p: { xs: 4, md: 6 }, height: '100%',
              background: `linear-gradient(135deg, ${C.navy} 0%, ${C.navyLight} 100%)`,
              color: '#fff',
            }}>
              <Box sx={{
                position: 'absolute', top: -80, left: -80,
                width: 280, height: 280, borderRadius: '50%',
                background: `radial-gradient(circle, ${C.oro}26 0%, transparent 70%)`,
                filter: 'blur(40px)', pointerEvents: 'none',
              }} />
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: '10px',
                  bgcolor: 'rgba(201,168,106,0.18)',
                  border: '1.5px solid rgba(201,168,106,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
                }}><VisibilityOutlined sx={{ fontSize: 28, color: C.oro }} /></Box>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
                  fontWeight: 600, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: C.oro, mb: 1.5,
                }}>Nuestra visión</Typography>
                <Typography component="h3" sx={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: { xs: '1.5rem', md: '1.875rem' }, fontWeight: 600,
                  color: '#fff', lineHeight: 1.2, mb: 2.5, letterSpacing: '-0.01em',
                }}>
                  La{' '}
                  <Box component="span" sx={{ fontStyle: 'italic', color: C.oro }}>
                    referencia confiable
                  </Box>{' '}de salud auditiva en Colombia
                </Typography>
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '1.0625rem',
                  color: 'rgba(255,255,255,0.85)', lineHeight: 1.65,
                }}>
                  Ser el lugar al que cualquier persona, familia o profesional acuda primero cuando tenga una duda sobre audición —porque saben que aquí encontrarán información honesta, profesionales verificados y acompañamiento real.
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>

    {/* CTA */}
    <Box component="section" sx={{
      py: { xs: 6, md: 8 }, bgcolor: C.verdeProfundo, color: '#fff',
      position: 'relative', overflow: 'hidden',
    }}>
      <Box sx={{
        position: 'absolute', top: -100, right: -100,
        width: 380, height: 380, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.oro}26 0%, transparent 70%)`,
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif', fontSize: '0.75rem',
          fontWeight: 600, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: C.oro, mb: 2,
        }}>Empieza hoy</Typography>
        <Typography component="h2" sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: { xs: '2rem', md: '2.875rem' }, fontWeight: 600,
          lineHeight: 1.15, color: '#fff', letterSpacing: '-0.018em', mb: 2.5,
        }}>
          ¿Hablamos sobre tu{' '}
          <Box component="span" sx={{ fontStyle: 'italic', color: C.oro }}>
            audición
          </Box>?
        </Typography>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif', fontSize: '1.0625rem',
          color: 'rgba(255,255,255,0.80)', mb: 4, maxWidth: 560, mx: 'auto',
        }}>
          Conecta con un profesional verificado de la red OírConecta. Sin presión, sin venta —solo conversación honesta.
        </Typography>
        <Button
          component={RouterLink} to="/agendar"
          variant="contained" endIcon={<ArrowForward />}
          sx={{
            fontFamily: '"DM Sans", sans-serif', background: '#C9A86A !important', color: '#272F50 !important',
            fontWeight: 700, fontSize: '0.9375rem', px: 4, py: 1.75,
            borderRadius: '6px',
            boxShadow: `0 8px 24px ${C.oro}55`,
            '&:hover': { background: '#D4B97A !important', transform: 'translateY(-2px)' },
          }}
        >Agendar una valoración</Button>
      </Container>
    </Box>

    <Footer />
  </>
);

export default NosotrosPage;
