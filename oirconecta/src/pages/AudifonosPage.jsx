import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Stack, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { ArrowForward } from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  PageHero, SectionEyebrow, SectionTitle, EditorialIntro,
  PullQuote, CTAArrowLink, C,
} from '../components/editorial/EditorialKit';
import { useReveal } from '../hooks/useReveal';

const MARCAS = [
  { nombre: 'Widex',        slug: 'widex',        color: '#1A1A1A', tag: 'Tecnología PureSound™',     desc: 'Sonido natural y conectividad; líneas para distintos grados de pérdida.' },
  { nombre: 'Oticon',       slug: 'oticon',       color: '#6E2585', tag: 'BrainHearing™',             desc: 'Enfoque centrado en el cerebro y amplia gama RIC, BTE e ITE.' },
  { nombre: 'Phonak',       slug: 'phonak',       color: '#008C45', tag: 'Roger™ · AutoSense',        desc: 'Conectividad universal y soluciones para entornos exigentes.' },
  { nombre: 'Signia',       slug: 'signia',       color: '#DC143C', tag: 'Own Voice Processing',      desc: 'Procesamiento avanzado y estilos recargables y miniaturizados.' },
  { nombre: 'ReSound',      slug: 'resound',      color: '#C9342B', tag: 'Smart Hearing',             desc: 'Direccionalidad y apps para control fino del listening.' },
  { nombre: 'Starkey',      slug: 'starkey',      color: '#F0B400', tag: 'IA en salud auditiva',      desc: 'Tecnología Evolv y diseños custom y RIC con seguimiento de salud.' },
  { nombre: 'Beltone',      slug: 'beltone',      color: '#2E7D32', tag: 'Atención y seguimiento',    desc: 'Canales propios con adaptación y soporte cercano.' },
  { nombre: 'Rexton',       slug: 'rexton',       color: '#F0B400', tag: 'Relación calidad-precio',   desc: 'Opciones BTE y RIC robustas con conectividad estándar.' },
  { nombre: 'Bernafon',     slug: 'bernafon',     color: '#C9342B', tag: 'Sonido cristalino',         desc: 'Series Alpha XT con procesamiento de canales abierto.' },
  { nombre: 'AudioService', slug: 'audioservice', color: '#FCD303', tag: 'Hecho en Alemania',         desc: 'Líneas G6 y Mood con procesamiento DEEP de 48 canales.' },
  { nombre: 'Hansaton',     slug: 'hansaton',     color: '#003DA5', tag: 'Diseño compacto',           desc: 'AQ sound de Sonova con conectividad Bluetooth LE Audio.' },
  { nombre: 'Unitron',      slug: 'unitron',      color: '#0066B2', tag: 'Flex:trial™',               desc: 'Prueba antes de decidir con las gamas Blu y Discover.' },
  { nombre: 'Sonic',        slug: 'sonic',        color: '#2D2D2D', tag: 'Captelligence',             desc: 'Procesamiento adaptativo y series Radiant para presupuestos ajustados.' },
];

const TIPOS = [
  { code: 'RIC', nombre: 'Receptor en canal',
    desc: 'El más vendido hoy. Discreto, cómodo y versátil. Sirve para pérdidas leves a severas.' },
  { code: 'BTE', nombre: 'Retroauricular',
    desc: 'Detrás de la oreja, más robusto y con mayor potencia. Ideal para pérdidas severas a profundas.' },
  { code: 'ITC', nombre: 'Intracanal',
    desc: 'Se ubica dentro del canal auditivo. Estética muy discreta para pérdidas leves a moderadas.' },
  { code: 'CIC', nombre: 'Completamente en canal',
    desc: 'Casi invisible. Para pérdidas leves a moderadas y oídos con canal amplio.' },
];

function MarcaCard({ m, delay }) {
  const { ref, visible } = useReveal({ threshold: 0.15 });
  return (
    <Box
      ref={ref}
      component={RouterLink}
      to={`/audifonos/${m.slug}`}
      sx={{
        display: 'block', textDecoration: 'none', color: 'inherit',
        bgcolor: '#fff', border: `1px solid ${C.border}`,
        borderRadius: '12px', p: { xs: 3, md: 3.5 },
        position: 'relative', overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `all 0.85s cubic-bezier(0.2,0.7,0.2,1) ${delay}s, border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease`,
        '&:hover': {
          borderColor: m.color,
          transform: 'translateY(-6px)',
          boxShadow: `0 24px 48px ${C.navy}1f`,
        },
        '&:hover .oc-brand-name': { color: m.color },
        '&:hover .oc-brand-arrow': { gap: 2, color: m.color },
        '&:hover .oc-brand-bar': { width: 64 },
      }}
    >
      <Box className="oc-brand-bar" sx={{
        width: 28, height: 4, bgcolor: m.color, mb: 2.5,
        transition: 'width 0.4s cubic-bezier(0.2,0.7,0.2,1)',
      }} />
      <Typography className="oc-brand-name" sx={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: { xs: '1.625rem', md: '2rem' }, fontWeight: 600,
        color: C.navy, lineHeight: 1.1, mb: 0.75,
        letterSpacing: '-0.01em',
        transition: 'color 0.3s ease',
      }}>
        {m.nombre}
      </Typography>
      <Typography sx={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: m.color, mb: 1.75,
      }}>
        {m.tag}
      </Typography>
      <Typography sx={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.92rem', color: C.gris, lineHeight: 1.55, mb: 2.5,
        minHeight: 64,
      }}>
        {m.desc}
      </Typography>
      <Box className="oc-brand-arrow" sx={{
        display: 'inline-flex', alignItems: 'center', gap: 1,
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.8rem', fontWeight: 700, color: C.navy,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        transition: 'gap 0.3s ease, color 0.3s ease',
      }}>
        Ver marca <ArrowForward sx={{ fontSize: 14 }} />
      </Box>
    </Box>
  );
}

function TipoRow({ t, delay }) {
  const { ref, visible } = useReveal({ threshold: 0.2 });
  return (
    <Box ref={ref} sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '80px 1fr', md: '120px 1fr auto' },
      gap: { xs: 2.5, md: 4 }, alignItems: 'center',
      py: { xs: 3, md: 4 },
      borderBottom: `1px solid ${C.border}`,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(16px)',
      transition: `all 0.8s cubic-bezier(0.2,0.7,0.2,1) ${delay}s`,
    }}>
      <Typography sx={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontSize: { xs: '1.75rem', md: '2.5rem' }, fontWeight: 700,
        color: C.oro, fontStyle: 'italic', lineHeight: 1,
        letterSpacing: '-0.01em',
      }}>
        {t.code}
      </Typography>
      <Box>
        <Typography component="h3" sx={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: { xs: '1.25rem', md: '1.625rem' }, fontWeight: 500,
          color: C.navy, lineHeight: 1.2, mb: 0.75, letterSpacing: '-0.01em',
        }}>
          {t.nombre}
        </Typography>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: { xs: '0.95rem', md: '1.05rem' }, lineHeight: 1.55,
          color: C.gris, maxWidth: 620,
        }}>
          {t.desc}
        </Typography>
      </Box>
      <Box sx={{
        display: { xs: 'none', md: 'inline-flex' }, alignItems: 'center', gap: 1,
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '0.78rem', fontWeight: 700, color: `${C.navy}66`,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>
        Tipo {t.code}
      </Box>
    </Box>
  );
}

export default function AudifonosPage() {
  return (
    <Box component="main" sx={{ bgcolor: C.blanco, minHeight: '100vh' }}>
      <Helmet>
        <title>Audífonos en Colombia — OírConecta · Marcas, tipos y guía</title>
        <meta name="description" content="Las 13 marcas de audífonos disponibles en Colombia explicadas sin tecnicismos. Aprende a elegir RIC, BTE, ITC o CIC según tu pérdida y estilo de vida." />
        <link rel="canonical" href="https://oirconecta.com/audifonos" />
        <meta property="og:title" content="Audífonos en Colombia — OírConecta" />
        <meta property="og:url" content="https://oirconecta.com/audifonos" />
        <meta property="og:image" content="https://oirconecta.com/img/audifono-retroauricular-bte.jpg" />
      </Helmet>

      <Header />

      <PageHero
        eyebrow="Audífonos · Edición №01"
        titleBefore="Cada"
        titleAccent="audífono"
        titleAfter="es una decisión."
        intro="No hay una marca mejor para todos. Hay una que se adapta mejor a tu pérdida, a tu vida y a tu presupuesto. Aquí están las 13 disponibles en Colombia, sin recomendaciones interesadas."
        image="/img/audifono-retroauricular-bte.jpg"
        imageAlt="Audífonos modernos retroauriculares y receptor en canal"
        imageTag="13 marcas · Colombia"
        imageCaption="Tu audiólogo va a tener una opinión informada. La elección final es tuya."
        cta={{ label: 'Buscar audiólogo', to: '/directorio/listado' }}
        ctaSecondary={{ label: 'Probar el simulador', to: '/ponte-en-sus-oidos' }}
      />

      {/* TIPOS */}
      <Box component="section" sx={{ bgcolor: C.cremaCalida, py: { xs: 8, md: 14 } }}>
        <Container maxWidth="lg">
          <Box sx={{
            display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
            gap: { xs: 4, md: 6 }, alignItems: 'end', mb: { xs: 5, md: 8 },
          }}>
            <Box>
              <SectionEyebrow color={C.navy} dash={C.oro} sx={{ mb: 3 }}>
                Antes de la marca · Cuatro tipos
              </SectionEyebrow>
              <SectionTitle before="Primero," accent="el formato." size="lg" />
            </Box>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: '1.05rem', md: '1.15rem' }, color: C.gris,
              lineHeight: 1.6, maxWidth: 540, pb: { md: 1.5 },
            }}>
              La pregunta clave no es qué marca, sino qué formato encaja con tu pérdida
              y tu estilo de vida. Cada tipo cubre rangos distintos y se ve diferente.
            </Typography>
          </Box>
          <Box sx={{ borderTop: `1px solid ${C.border}` }}>
            {TIPOS.map((t, i) => <TipoRow key={t.code} t={t} delay={i * 0.06} />)}
          </Box>
        </Container>
      </Box>

      {/* PULL QUOTE */}
      <Box component="section" sx={{ bgcolor: C.blanco, py: { xs: 7, md: 11 } }}>
        <Container maxWidth="lg">
          <PullQuote author="Equipo OírConecta">
            La mejor marca de audífono no existe. Existe la marca correcta para ti,
            elegida con un profesional que entiende tu pérdida.
          </PullQuote>
        </Container>
      </Box>

      {/* MARCAS GRID */}
      <Box component="section" sx={{ bgcolor: C.blanco, py: { xs: 7, md: 12 } }}>
        <Container maxWidth="xl">
          <Box sx={{
            display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' },
            gap: { xs: 4, md: 6 }, alignItems: 'end', mb: { xs: 5, md: 8 },
          }}>
            <Box>
              <SectionEyebrow color={C.navy} dash={C.verde} sx={{ mb: 3 }}>
                Catálogo nacional
              </SectionEyebrow>
              <SectionTitle before="Las trece" accent="marcas" after="disponibles." size="lg" />
            </Box>
            <Typography sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: { xs: '1.05rem', md: '1.15rem' }, color: C.gris,
              lineHeight: 1.6, maxWidth: 540, pb: { md: 1.5 },
            }}>
              Toca una marca para conocer sus líneas, tecnologías y dónde encontrarla
              en Colombia. No tenemos convenios ni comisiones por venta.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {MARCAS.map((m, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={m.slug}>
                <MarcaCard m={m} delay={i * 0.04} />
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
          position: 'absolute', top: -120, left: -120, width: 400, height: 400,
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
            accent="profesional"
            after="antes de comprar."
            size="lg"
            sx={{ color: '#fff', mb: 3 }}
          />
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '1.05rem', color: '#D9CDBFcc', mb: 4, maxWidth: 580, mx: 'auto',
          }}>
            Un audiólogo verificado interpreta tu audiometría, te explica qué tipo de pérdida tienes
            y recomienda formato + marca sin presión.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" alignItems="center">
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
              Buscar audiólogo cerca
              <ArrowForward sx={{ fontSize: 18 }} />
            </Box>
            <CTAArrowLink to="/ponte-en-sus-oidos" label="Probar el simulador" />
          </Stack>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
