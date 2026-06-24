import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Stack, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowForward, CheckCircleOutline } from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  PageHero, SectionEyebrow, SectionTitle, EditorialIntro,
  PullQuote, CTAArrowLink, C,
} from '../components/editorial/EditorialKit';
import { useReveal } from '../hooks/useReveal';

const MARCAS = [
  {
    nombre: 'Cochlear', slug: 'cochlear', color: '#F0B400', n: '01',
    headline: 'Líder mundial en implantes cocleares',
    desc: 'Sistemas Nucleus, Kanso 2 y soluciones de oído medio Baha. Procesadores con conectividad directa a iPhone y Android.',
    lineas: ['Nucleus 8', 'Kanso 2', 'Baha 6 Max'],
  },
  {
    nombre: 'Advanced Bionics', slug: 'advanced-bionics', color: '#003DA5', n: '02',
    headline: 'Tecnología HiRes™ y procesador Marvel',
    desc: 'Enfoque en claridad de habla en entornos complejos. Procesadores Naída CI con plataforma Sonova compartida.',
    lineas: ['HiRes Ultra 3D', 'Naída CI M', 'Marvel CI'],
  },
  {
    nombre: 'MED-EL', slug: 'medel', color: '#C9342B', n: '03',
    headline: 'Flexibilidad quirúrgica y rehabilitación',
    desc: 'Implantes SYNCHRONY y procesadores RONDO 3 y SONNET 2. Énfasis en preservación de audición residual.',
    lineas: ['SYNCHRONY 2', 'SONNET 2', 'RONDO 3'],
  },
];

const TIPOS = [
  {
    n: '01', titulo: 'Implante coclear',
    bajada: 'Estimula el nervio auditivo cuando la cóclea no transmite bien. Indicado para pérdida severa o profunda bilateral con poco beneficio del audífono.',
    indicaciones: ['Pérdida severa a profunda', 'Poco beneficio con audífonos', 'Niños y adultos según protocolo'],
  },
  {
    n: '02', titulo: 'Implante de oído medio',
    bajada: 'Para pérdidas conductivas o mixtas cuando no es viable un audífono convencional. Aprovecha la audición residual del paciente.',
    indicaciones: ['Conductiva persistente', 'Otosclerosis seleccionada', 'Malformaciones congénitas'],
  },
  {
    n: '03', titulo: 'Implante de tronco cerebral',
    bajada: 'Indicación muy específica para casos donde el nervio auditivo no es viable. Solo en centros de referencia con comité especializado.',
    indicaciones: ['Neurofibromatosis tipo 2', 'Ausencia o sección del nervio', 'Expectativas guiadas desde el inicio'],
  },
];

function MarcaCard({ m, delay }) {
  const { ref, visible } = useReveal({ threshold: 0.18 });
  return (
    <Box
      ref={ref}
      component={RouterLink}
      to={`/implantes/${m.slug}`}
      sx={{
        display: 'flex', flexDirection: 'column',
        height: '100%',
        textDecoration: 'none', color: 'inherit',
        bgcolor: '#fff', border: `1px solid ${C.border}`,
        borderRadius: '14px', p: { xs: 3.5, md: 4 },
        position: 'relative', overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.85s cubic-bezier(0.2,0.7,0.2,1) ${delay}s, transform 0.4s ease, border-color 0.3s ease, box-shadow 0.3s ease`,
        '&:hover': {
          borderColor: m.color,
          transform: 'translateY(-6px)',
          boxShadow: `0 28px 60px ${C.navy}1f`,
        },
        '&:hover .oc-mark-name': { color: m.color },
        '&:hover .oc-mark-arrow': { gap: 1.85, color: m.color },
      }}
    >
      {/* Número editorial + barra color */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Typography sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontStyle: 'italic', fontSize: '1.5rem', color: m.color, fontWeight: 600,
        }}>
          №{m.n}
        </Typography>
        <Box sx={{ flex: 1, height: 1, bgcolor: `${C.border}` }} />
      </Stack>

      <Typography className="oc-mark-name" sx={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: { xs: '1.875rem', md: '2.25rem' }, fontWeight: 500,
        color: C.navy, lineHeight: 1.05, mb: 1.5,
        letterSpacing: '-0.015em',
        transition: 'color 0.3s ease',
      }}>
        {m.nombre}
      </Typography>

      <Typography sx={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: m.color, mb: 2,
      }}>
        {m.headline}
      </Typography>

      <Typography sx={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.95rem', color: C.gris, lineHeight: 1.6, mb: 3,
      }}>
        {m.desc}
      </Typography>

      <Box sx={{ flex: 1 }} />

      {/* Líneas */}
      <Box sx={{ mb: 3, pt: 2, borderTop: `1px solid ${C.border}` }}>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: C.gris, mb: 1.5,
        }}>Líneas actuales</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
          {m.lineas.map((l) => (
            <Box key={l} sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.75rem', fontWeight: 600, color: C.navy,
              bgcolor: `${m.color}14`, px: 1.25, py: 0.5, borderRadius: '4px',
            }}>{l}</Box>
          ))}
        </Stack>
      </Box>

      <Box className="oc-mark-arrow" sx={{
        display: 'inline-flex', alignItems: 'center', gap: 1.25,
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.85rem', fontWeight: 700, color: C.navy,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        transition: 'gap 0.3s ease, color 0.3s ease',
      }}>
        Ver marca <ArrowForward sx={{ fontSize: 16 }} />
      </Box>
    </Box>
  );
}

function TipoRow({ t, delay }) {
  const { ref, visible } = useReveal({ threshold: 0.18 });
  return (
    <Box ref={ref} sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '60px 1fr', md: '90px 1fr 240px' },
      gap: { xs: 2.5, md: 4 }, alignItems: 'flex-start',
      py: { xs: 4, md: 5 },
      borderBottom: `1px solid ${C.border}`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `all 0.85s cubic-bezier(0.2,0.7,0.2,1) ${delay}s`,
    }}>
      <Typography sx={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: { xs: '1.5rem', md: '2.25rem' }, fontWeight: 600,
        color: `${C.navy}55`, lineHeight: 1,
      }}>
        {t.n}
      </Typography>
      <Box>
        <Typography component="h3" sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: { xs: '1.4rem', md: '1.875rem' }, fontWeight: 500,
          color: C.navy, lineHeight: 1.2, mb: 1.25, letterSpacing: '-0.01em',
        }}>
          {t.titulo}
        </Typography>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: { xs: '0.95rem', md: '1.05rem' }, lineHeight: 1.55,
          color: C.gris, maxWidth: 580,
        }}>
          {t.bajada}
        </Typography>
      </Box>
      <Stack spacing={1.25} sx={{ pt: { md: 0.5 } }}>
        {t.indicaciones.map((ind) => (
          <Stack key={ind} direction="row" spacing={1.25} alignItems="flex-start">
            <CheckCircleOutline sx={{ fontSize: 16, color: C.verde, mt: 0.25, flexShrink: 0 }} />
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.85rem', color: C.navy, lineHeight: 1.4,
            }}>
              {ind}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export default function ImplantesPage() {
  return (
    <Box component="main" sx={{ bgcolor: C.blanco, minHeight: '100vh' }}>
      <Helmet>
        <title>Implantes cocleares y auditivos en Colombia — OírConecta</title>
        <meta name="description" content="Información clara sobre implantes cocleares, implantes de oído medio y dispositivos Baha en Colombia. Marcas Cochlear, Advanced Bionics y MED-EL." />
        <link rel="canonical" href="https://oirconecta.com/implantes" />
        <meta property="og:title" content="Implantes auditivos — OírConecta" />
        <meta property="og:url" content="https://oirconecta.com/implantes" />
        <meta property="og:image" content="https://oirconecta.com/img/audifono-tecnologia-moderna.jpg" />
      </Helmet>

      <Header />

      <PageHero
        eyebrow="Implantes auditivos · Edición №01"
        titleBefore="Cuando los audífonos"
        titleAccent="ya no alcanzan."
        intro="Un implante coclear o de oído medio puede restituir el acceso al sonido cuando la pérdida es severa o profunda. Aquí te explicamos cuándo, cómo y con qué marcas — sin tecnicismos."
        image="/img/audifono-tecnologia-moderna.jpg"
        imageAlt="Implante auditivo de tecnología moderna"
        imageTag="3 fabricantes · Colombia"
        imageCaption="No todos los pacientes son candidatos. La indicación la define un equipo especializado."
        cta={{ label: 'Buscar especialista', to: '/directorio/listado' }}
        ctaSecondary={{ label: 'Leer guía completa', to: '/blog/implante-coclear-guia' }}
      />

      {/* TIPOS DE IMPLANTE */}
      <Box component="section" sx={{ bgcolor: C.cremaCalida, py: { xs: 8, md: 14 } }}>
        <Container maxWidth="lg">
          <Box sx={{
            display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
            gap: { xs: 4, md: 6 }, alignItems: 'end', mb: { xs: 5, md: 8 },
          }}>
            <Box>
              <SectionEyebrow color={C.navy} dash={C.oro} sx={{ mb: 3 }}>
                Tres categorías
              </SectionEyebrow>
              <SectionTitle before="No todo es" accent="coclear." size="lg" />
            </Box>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: '1.05rem', md: '1.15rem' }, color: C.gris,
              lineHeight: 1.6, maxWidth: 540, pb: { md: 1.5 },
            }}>
              Hay tres familias de implantes auditivos, cada una para una situación distinta.
              Conoce qué hace cada una antes de hablar con un especialista.
            </Typography>
          </Box>
          <Box sx={{ borderTop: `1px solid ${C.border}` }}>
            {TIPOS.map((t, i) => <TipoRow key={t.n} t={t} delay={i * 0.06} />)}
          </Box>
        </Container>
      </Box>

      {/* PULL QUOTE */}
      <Box component="section" sx={{ bgcolor: C.blanco, py: { xs: 7, md: 11 } }}>
        <Container maxWidth="lg">
          <PullQuote author="Equipo OírConecta">
            Un implante coclear no es una decisión de un día. Es una conversación
            multidisciplinaria con audiólogo, otorrino, paciente y familia.
          </PullQuote>
        </Container>
      </Box>

      {/* MARCAS */}
      <Box component="section" sx={{ bgcolor: C.blanco, py: { xs: 7, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: { xs: 5, md: 7 } }}>
            <SectionEyebrow color={C.navy} dash={C.verde} sx={{ mb: 3 }}>
              Fabricantes
            </SectionEyebrow>
            <SectionTitle before="Las tres marcas en" accent="Colombia." size="md" />
          </Box>

          <Grid container spacing={3}>
            {MARCAS.map((m, i) => (
              <Grid item xs={12} md={4} key={m.slug}>
                <MarcaCard m={m} delay={i * 0.08} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA FINAL */}
      <Box component="section" sx={{
        bgcolor: C.navy, color: '#fff', py: { xs: 8, md: 12 },
        position: 'relative', overflow: 'hidden',
      }}>
        <Box aria-hidden sx={{
          position: 'absolute', top: -120, right: -120, width: 400, height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.oro}33 0%, transparent 70%)`,
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative' }}>
          <SectionEyebrow color={C.oro} dash={C.oro} sx={{ mb: 3, justifyContent: 'center', display: 'inline-flex' }}>
            Próximo paso
          </SectionEyebrow>
          <SectionTitle
            before="Habla con un"
            accent="otorrino o audiólogo"
            after="especializado."
            size="lg"
            sx={{ color: '#fff', mb: 3 }}
          />
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '1.05rem', color: '#D9CDBFcc', mb: 4, maxWidth: 580, mx: 'auto',
          }}>
            La candidatura a un implante exige imágenes, audiometría avanzada y a veces evaluación
            psicológica. Empieza por una conversación honesta.
          </Typography>
          <Box
            component={RouterLink}
            to="/directorio/listado"
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
            Buscar especialista
            <ArrowForward sx={{ fontSize: 18 }} />
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
