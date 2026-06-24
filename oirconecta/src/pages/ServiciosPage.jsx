import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  PageHero, SectionEyebrow, SectionTitle, CTAArrowLink, C,
} from '../components/editorial/EditorialKit';
import { useReveal } from '../hooks/useReveal';
import {
  AssessmentOutlined, HearingOutlined, SupportOutlined,
  PsychologyOutlined, SchoolOutlined, GroupOutlined, ArrowForward,
} from '@mui/icons-material';

const SERVICIOS = [
  {
    n: '01',
    titulo: 'Evaluación auditiva',
    desc: 'Audiometría, impedanciometría y pruebas complementarias para caracterizar tu pérdida y orientar el tratamiento.',
    Icon: AssessmentOutlined,
    image: '/img/audiologo-prueba-audicion.jpg',
    tag: 'Diagnóstico',
  },
  {
    n: '02',
    titulo: 'Adaptación de audífonos',
    desc: 'Selección, prueba en consulta y ajuste fino según tu estilo de vida, tipo de pérdida y preferencias estéticas.',
    Icon: HearingOutlined,
    image: '/img/audifono-tecnologia-moderna.jpg',
    tag: 'Tratamiento',
  },
  {
    n: '03',
    titulo: 'Implantes cocleares',
    desc: 'Información sobre candidatura, proceso multidisciplinario y seguimiento; coordinación con marcas líderes.',
    Icon: SupportOutlined,
    image: '/img/centro-auditivo-colombia.jpg',
    tag: 'Avanzado',
  },
  {
    n: '04',
    titulo: 'Rehabilitación y terapia',
    desc: 'Acompañamiento en habla auditiva y adaptación a dispositivos para niños, jóvenes y adultos mayores.',
    Icon: PsychologyOutlined,
    image: '/img/audiologo-paciente-consulta.jpg',
    tag: 'Acompañamiento',
  },
  {
    n: '05',
    titulo: 'Audiología pediátrica',
    desc: 'Tamizaje neonatal, evaluación adaptada a la edad y seguimiento con enfoque familiar sensible.',
    Icon: SchoolOutlined,
    image: '/img/clinica-audiologia-tratamiento.jpg',
    tag: 'Niños',
  },
  {
    n: '06',
    titulo: 'Audiología laboral',
    desc: 'Evaluaciones ocupacionales y recomendaciones para conservación auditiva en entornos de alto ruido.',
    Icon: GroupOutlined,
    image: '/img/clinica-auditiva-equipo-profesional.jpg',
    tag: 'Empresas',
  },
];

function ServicioRow({ s, reverse, delay }) {
  const { ref, visible } = useReveal({ threshold: 0.18 });
  return (
    <Box ref={ref} sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: reverse ? '5fr 7fr' : '7fr 5fr' },
      gap: { xs: 4, md: 8 }, alignItems: 'center',
      py: { xs: 5, md: 10 },
      borderBottom: `1px solid ${C.border}`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `all 0.95s cubic-bezier(0.2,0.7,0.2,1) ${delay}s`,
    }}>
      {/* Texto */}
      <Box sx={{
        order: { xs: 2, md: reverse ? 2 : 1 },
        pr: { md: reverse ? 0 : 4 }, pl: { md: reverse ? 4 : 0 },
      }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
          <Typography sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontStyle: 'italic', fontSize: '1.5rem', color: C.oro, fontWeight: 600,
          }}>
            №{s.n}
          </Typography>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: C.navy,
          }}>
            · {s.tag}
          </Typography>
        </Stack>
        <Typography component="h2" sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 500,
          color: C.navy, lineHeight: 1.05, letterSpacing: '-0.025em', mb: 2.5,
        }}>
          {s.titulo}
        </Typography>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.6,
          color: C.gris, mb: 4, maxWidth: 540,
        }}>
          {s.desc}
        </Typography>
        <CTAArrowLink to="/directorio/listado" label="Buscar profesional" primary />
      </Box>

      {/* Imagen */}
      <Box sx={{
        order: { xs: 1, md: reverse ? 1 : 2 },
        position: 'relative',
        borderRadius: '12px', overflow: 'hidden',
        aspectRatio: { xs: '16/10', md: '4/5' },
        maxHeight: { md: 540 },
        boxShadow: `0 24px 60px ${C.navy}1f`,
      }}>
        <Box component="img" src={s.image} alt={s.titulo} loading="lazy"
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        {/* Ícono flotante */}
        <Box sx={{
          position: 'absolute', top: 20, left: 20,
          width: 56, height: 56, borderRadius: '12px',
          bgcolor: 'rgba(255,255,255,0.96)', color: C.navy,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          <s.Icon sx={{ fontSize: 28 }} />
        </Box>
      </Box>
    </Box>
  );
}

export default function ServiciosPage() {
  return (
    <Box component="main" sx={{ bgcolor: C.blanco, minHeight: '100vh' }}>
      <Helmet>
        <title>Servicios — OírConecta · Salud auditiva en Colombia</title>
        <meta name="description" content="Servicios auditivos que ofrecen los profesionales verificados de OírConecta: evaluación, adaptación de audífonos, implantes cocleares, rehabilitación y más." />
        <link rel="canonical" href="https://oirconecta.com/servicios" />
        <meta property="og:title" content="Servicios — OírConecta" />
        <meta property="og:url" content="https://oirconecta.com/servicios" />
        <meta property="og:image" content="https://oirconecta.com/img/audiologo-prueba-audicion.jpg" />
      </Helmet>

      <Header />

      <PageHero
        eyebrow="Servicios · Seis áreas"
        titleBefore="Lo que los"
        titleAccent="profesionales"
        titleAfter="hacen por ti."
        intro="Cada profesional del directorio OírConecta cubre uno o varios de estos servicios. Conoce qué incluye cada uno antes de agendar tu primera consulta."
        image="/img/audiologo-prueba-audicion.jpg"
        imageAlt="Audiólogo realizando prueba de audición"
        imageTag="Servicios · 2026"
        cta={{ label: 'Buscar especialista', to: '/directorio/listado' }}
        ctaSecondary={{ label: 'Ver señales de alerta', to: '/blog/tipos-de-perdida-auditiva' }}
      />

      {/* SERVICIOS — filas alternadas */}
      <Box component="section" sx={{ bgcolor: C.blanco, py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: { xs: 4, md: 6 } }}>
            <SectionEyebrow color={C.navy} dash={C.oro} sx={{ mb: 3 }}>
              Catálogo editorial
            </SectionEyebrow>
            <SectionTitle before="Seis maneras de" accent="cuidar tu audición." size="md" />
          </Box>
          <Box sx={{ borderTop: `1px solid ${C.border}` }}>
            {SERVICIOS.map((s, i) => (
              <ServicioRow key={s.n} s={s} reverse={i % 2 === 1} delay={i * 0.05} />
            ))}
          </Box>
        </Container>
      </Box>

      {/* CTA */}
      <Box component="section" sx={{ bgcolor: C.cremaCalida, py: { xs: 8, md: 12 } }}>
        <Container maxWidth="md" sx={{ textAlign: 'center' }}>
          <SectionEyebrow color={C.navy} dash={C.verde} sx={{ mb: 3, justifyContent: 'center', display: 'inline-flex' }}>
            ¿Listo?
          </SectionEyebrow>
          <SectionTitle
            before="Cada servicio empieza con una"
            accent="conversación."
            size="md"
            sx={{ textAlign: 'center', mb: 3 }}
          />
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '1.05rem', color: C.gris, mb: 4, maxWidth: 560, mx: 'auto',
          }}>
            Encuentra a un profesional cerca de ti, filtra por especialidad o cobertura, y agenda directamente.
          </Typography>
          <Box
            component={RouterLink}
            to="/directorio/listado"
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 1.25,
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.95rem', fontWeight: 700,
              bgcolor: C.navy, color: '#fff',
              px: 4, py: 1.85, borderRadius: '6px',
              textDecoration: 'none', letterSpacing: '0.02em',
              boxShadow: `0 10px 28px ${C.navy}33`,
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: C.navyDark,
                transform: 'translateY(-2px)',
                boxShadow: `0 14px 32px ${C.navy}44`,
              },
            }}
          >
            Explorar el directorio
            <ArrowForward sx={{ fontSize: 18 }} />
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
