import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Stack, Grid } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  PageHero, SectionEyebrow, SectionTitle, EditorialIntro, PullQuote,
  CTAArrowLink, C,
} from '../components/editorial/EditorialKit';
import { useReveal } from '../hooks/useReveal';

const VALORES = [
  {
    n: '01',
    titulo: 'Sin presión comercial',
    bajada: 'No recomendamos marcas, no recibimos comisión por venta. Los profesionales del directorio cumplen criterios públicos de admisión.',
  },
  {
    n: '02',
    titulo: 'Lenguaje claro',
    bajada: 'Traducimos los tecnicismos. La gente decide mejor cuando entiende lo que le explican, no cuando escucha palabras que parecen importantes.',
  },
  {
    n: '03',
    titulo: 'Personas, no leads',
    bajada: 'Cada formulario lo lee una persona del equipo OírConecta. No usamos chatbots para responder dudas sobre salud auditiva.',
  },
  {
    n: '04',
    titulo: 'Verificación humana',
    bajada: 'Cada profesional pasa por revisión de tarjeta profesional y referencias antes de aparecer en el directorio.',
  },
];

const NUMBERS = [
  { value: '+50', label: 'Artículos publicados' },
  { value: '13', label: 'Marcas en Colombia' },
  { value: '04', label: 'Especialidades verificadas' },
  { value: '24/7', label: 'WhatsApp orientación' },
];

function NumberCard({ n, delay }) {
  const { ref, visible } = useReveal({ threshold: 0.3 });
  return (
    <Box ref={ref} sx={{
      borderTop: `2px solid ${C.oro}`, pt: 2.5,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `all 0.85s cubic-bezier(0.2,0.7,0.2,1) ${delay}s`,
    }}>
      <Typography sx={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 600,
        color: C.navy, lineHeight: 1, letterSpacing: '-0.025em',
      }}>
        {n.value}
      </Typography>
      <Typography sx={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: C.gris, mt: 1,
      }}>
        {n.label}
      </Typography>
    </Box>
  );
}

function ValorRow({ v, delay }) {
  const { ref, visible } = useReveal({ threshold: 0.2 });
  return (
    <Box ref={ref} sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '60px 1fr', md: '90px 1fr' }, gap: { xs: 2, md: 4 },
      py: { xs: 3.5, md: 4.5 },
      borderTop: `1px solid ${C.border}`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `all 0.85s cubic-bezier(0.2,0.7,0.2,1) ${delay}s`,
    }}>
      <Typography sx={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: { xs: '1.5rem', md: '2.25rem' }, fontWeight: 600,
        color: `${C.navy}55`, lineHeight: 1,
      }}>
        {v.n}
      </Typography>
      <Box>
        <Typography component="h3" sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: { xs: '1.4rem', md: '1.85rem' }, fontWeight: 500,
          color: C.navy, lineHeight: 1.2, mb: 1.25, letterSpacing: '-0.01em',
        }}>
          {v.titulo}
        </Typography>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: { xs: '0.95rem', md: '1.05rem' }, lineHeight: 1.6,
          color: C.gris, maxWidth: 620,
        }}>
          {v.bajada}
        </Typography>
      </Box>
    </Box>
  );
}

export default function NosotrosPage() {
  const story = useReveal({ threshold: 0.15 });

  return (
    <Box component="main" sx={{ bgcolor: C.blanco, minHeight: '100vh' }}>
      <Helmet>
        <title>Nosotros — OírConecta · Salud auditiva sin presión</title>
        <meta name="description" content="Conoce el equipo y la misión de OírConecta: conectar a cada persona con profesionales auditivos verificados en Colombia, sin presión comercial." />
        <link rel="canonical" href="https://oirconecta.com/nosotros" />
        <meta property="og:title" content="Nosotros — OírConecta" />
        <meta property="og:url" content="https://oirconecta.com/nosotros" />
        <meta property="og:image" content="https://oirconecta.com/img/clinica-auditiva-equipo-profesional.jpg" />
      </Helmet>

      <Header />

      <PageHero
        eyebrow="Sobre OírConecta · Edición №01"
        titleBefore="Cuidamos personas,"
        titleAccent="no clientes."
        intro="Somos un equipo colombiano que reúne audiólogos, otorrinos, fonoaudiólogos y centros auditivos verificados — para que encontrar ayuda auditiva no se sienta como pelear con un vendedor."
        image="/img/clinica-auditiva-equipo-profesional.jpg"
        imageAlt="Equipo profesional de clínica auditiva en Colombia"
        imageTag="Equipo · 2026"
        imageCaption="Detrás de cada perfil hay una persona verificada."
        cta={{ label: 'Explorar el directorio', to: '/directorio/listado' }}
        ctaSecondary={{ label: 'Ver señales de alerta', to: '/blog/tipos-de-perdida-auditiva' }}
      />

      {/* HISTORIA */}
      <Box component="section" sx={{ bgcolor: C.cremaCalida, py: { xs: 8, md: 14 } }}>
        <Container maxWidth="md" ref={story.ref} sx={{
          opacity: story.visible ? 1 : 0,
          transform: story.visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.95s cubic-bezier(0.2,0.7,0.2,1)',
        }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <SectionEyebrow color={C.navy} dash={C.verde} sx={{ justifyContent: 'center', display: 'inline-flex' }}>
              Nuestra historia
            </SectionEyebrow>
          </Box>
          <SectionTitle
            before="Nació de una"
            accent="frustración"
            after="real."
            size="lg"
            sx={{ textAlign: 'center', mb: 6 }}
          />
          <EditorialIntro dropCap>
            En 2024 perdimos meses tratando de ayudar a un familiar mayor a encontrar un audífono que de verdad sirviera para su pérdida. Cada centro nos vendía la marca con la que tenían convenio. Cada profesional repetía argumentos de comercial. Nadie nos explicaba qué pasaba en su oído, qué tipo de pérdida tenía, ni por qué un equipo costaba el triple del otro.
          </EditorialIntro>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: { xs: '1.05rem', md: '1.15rem' }, lineHeight: 1.65,
            color: C.navy, mt: 3.5,
          }}>
            Cuando finalmente dimos con un audiólogo honesto, fue por suerte — un comentario en un grupo de WhatsApp. Eso nos pareció demasiado azaroso para algo que cambia tanto la vida de la gente. Entonces hicimos OírConecta.
          </Typography>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: { xs: '1.05rem', md: '1.15rem' }, lineHeight: 1.65,
            color: C.navy, mt: 2.5,
          }}>
            Hoy somos un directorio nacional con profesionales verificados, contenidos educativos en lenguaje claro, y una experiencia interactiva para que entiendas qué siente tu mamá, tu papá o tu pareja cuando dejan de oír. Sin comisión por venta, sin presión, sin promesas mágicas.
          </Typography>
        </Container>
      </Box>

      {/* PULL QUOTE */}
      <Box component="section" sx={{ bgcolor: C.blanco, py: { xs: 7, md: 11 } }}>
        <Container maxWidth="lg">
          <PullQuote author="Equipo OírConecta">
            Si tu mamá no contesta, no es que te ignore. Si tu papá sube la TV, no es por molestar.
            Estamos para que ese vínculo no se pierda.
          </PullQuote>
        </Container>
      </Box>

      {/* PRINCIPIOS */}
      <Box component="section" sx={{ bgcolor: C.blanco, py: { xs: 7, md: 11 } }}>
        <Container maxWidth="lg">
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
            gap: { xs: 4, md: 6 }, alignItems: 'end', mb: { xs: 5, md: 8 },
          }}>
            <Box>
              <SectionEyebrow color={C.navy} dash={C.oro} sx={{ mb: 3 }}>
                Cuatro principios
              </SectionEyebrow>
              <SectionTitle before="Lo que" accent="defendemos." size="lg" />
            </Box>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: '1.05rem', md: '1.15rem' }, color: C.gris,
              lineHeight: 1.6, maxWidth: 540, pb: { md: 1 },
            }}>
              No son frases bonitas para una pared. Son reglas operativas que
              guían cómo elegimos profesionales, cómo escribimos contenido y
              cómo te tratamos cuando nos escribes.
            </Typography>
          </Box>
          <Box sx={{ borderBottom: `1px solid ${C.border}` }}>
            {VALORES.map((v, i) => (
              <ValorRow key={v.n} v={v} delay={i * 0.08} />
            ))}
          </Box>
        </Container>
      </Box>

      {/* NÚMEROS */}
      <Box component="section" sx={{ bgcolor: C.cremaCalida, py: { xs: 7, md: 12 } }}>
        <Container maxWidth="lg">
          <SectionEyebrow color={C.navy} dash={C.verde} sx={{ mb: 4 }}>
            En cifras
          </SectionEyebrow>
          <Grid container spacing={{ xs: 4, md: 6 }}>
            {NUMBERS.map((n, i) => (
              <Grid item xs={6} md={3} key={n.label}>
                <NumberCard n={n} delay={i * 0.1} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box component="section" sx={{ bgcolor: C.navy, color: '#fff', py: { xs: 8, md: 12 }, position: 'relative', overflow: 'hidden' }}>
        <Box aria-hidden sx={{
          position: 'absolute', top: -120, right: -120, width: 400, height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.oro}33 0%, transparent 70%)`,
          filter: 'blur(60px)', pointerEvents: 'none',
        }} />
        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative' }}>
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.24em',
            textTransform: 'uppercase', color: C.oro, mb: 2,
          }}>
            ¿Vamos?
          </Typography>
          <SectionTitle
            before="Encuentra"
            accent="a tu especialista."
            size="lg"
            sx={{ color: '#fff', mb: 3 }}
          />
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '1.05rem', color: '#D9CDBFcc', mb: 4.5, maxWidth: 560, mx: 'auto',
          }}>
            Audiólogos, otorrinos, fonoaudiólogos y centros auditivos verificados en toda Colombia.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" alignItems="center">
            <Box
              component="a"
              href="/directorio/listado"
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1.25,
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.95rem', fontWeight: 700,
                bgcolor: C.oro, color: C.navy,
                px: 4, py: 1.85, borderRadius: '6px',
                textDecoration: 'none', letterSpacing: '0.02em',
                boxShadow: `0 10px 28px ${C.oro}55`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: '#D4B97A',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 14px 32px ${C.oro}66`,
                },
              }}
            >
              Buscar profesional →
            </Box>
            <CTAArrowLink to="/ponte-en-sus-oidos" label="Probar el simulador" />
          </Stack>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
