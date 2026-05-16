import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Grid } from '@mui/material';
import { People, Psychology, Hearing, Support } from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';

const NosotrosPage = () => {
  return (
    <>
      <Helmet>
        <title>Nosotros - OírConecta | Plataforma y red de servicios auditivos</title>
        <meta name="description" content="OírConecta: referencia de valores de audífonos y accesorios, educación, ubicación de profesionales, acompañamiento en decisiones, oferta de servicios de la red e información sobre marcas." />
        <meta name="keywords" content="OirConecta, especialistas auditivos, Colombia, audiólogos, otorrinolaringólogos, otólogos, salud auditiva" />
        <link rel="canonical" href="https://oirconecta.com/nosotros" />
      </Helmet>

      <Header />

      {/* Hero */}
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        background:
          'radial-gradient(ellipse 90% 70% at 10% 20%, rgba(13,122,92,0.42) 0%, transparent 55%),' +
          'radial-gradient(ellipse 70% 60% at 90% 80%, rgba(39,47,80,0.55) 0%, transparent 55%),' +
          'linear-gradient(160deg, #063c2c 0%, #085946 35%, #1a2240 70%, #272F50 100%)',
        color: '#fff', pt: { xs: 14, md: 16 }, pb: { xs: 8, md: 10 },
      }}>
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.625,
            borderRadius: '20px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)', mb: 3 }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)' }}>
              OírConecta
            </Typography>
          </Box>
          <Typography component="h1" sx={{ fontSize: { xs: '2.25rem', md: '3.5rem' }, fontWeight: 900,
            letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', mb: 2.5 }}>
            Sobre{' '}
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #6ee7c8 0%, #a7f3d0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              OírConecta
            </Box>
          </Typography>
          <Typography sx={{ fontSize: { xs: '1.0625rem', md: '1.25rem' }, color: 'rgba(255,255,255,0.80)',
            maxWidth: 700, mx: 'auto', lineHeight: 1.6 }}>
            Plataforma que visibiliza los servicios de audiólogos, otólogos y centros. El paciente explora y contacta; la atención clínica es responsabilidad de cada especialista.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>

        {/* What we do */}
        <Box sx={{ mb: 8, borderRadius: '22px', p: { xs: 3, md: 4 },
          background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 16px rgba(8,89,70,0.07)',
          borderLeft: '4px solid #085946' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.375rem', color: '#0f1923', letterSpacing: '-0.02em', mb: 1 }}>
            Qué hace OírConecta
          </Typography>
          <Typography sx={{ color: '#4a5568', mb: 2.5, fontSize: '0.9375rem' }}>
            Estos seis ejes definen el valor que buscamos entregar a las personas y a la red de suscriptores:
          </Typography>
          <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
            {[
              'Informar mensualmente los valores de referencia de audífonos y accesorios.',
              'Educar para tomar mejores decisiones sobre salud auditiva.',
              'Ayudar a ubicar al profesional o centro que mejor encaje con cada caso.',
              'Acompañar la toma de decisiones con información clara y ordenada.',
              'Ofertar y visibilizar todos los servicios que la red promueve en un solo canal.',
              'Informar sobre las distintas marcas y opciones presentes en el mercado.',
            ].map((text) => (
              <Typography key={text} component="li" sx={{ fontSize: '0.9375rem', color: '#4a5568', mb: 1.25, lineHeight: 1.6 }}>
                {text}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* Misión y Visión */}
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {[
            {
              titulo: 'Misión',
              texto: 'Dar a los pacientes un punto de entrada claro para descubrir servicios de evaluación, audífonos, implantes y rehabilitación, y conectarlos con quienes integran la red. Dar a los profesionales visibilidad y herramientas para comunicar lo que ofrecen, sin sustituir su criterio médico.',
              gradient: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
            },
            {
              titulo: 'Visión',
              texto: 'Ser el canal de referencia en Colombia para que las personas encuentren servicios auditivos ofrecidos por una red amplia y actualizada de especialistas. Crecer con criterios de calidad y un modelo sostenible de suscripción.',
              gradient: 'linear-gradient(135deg, #272F50 0%, #085946 100%)',
            },
          ].map((item) => (
            <Grid item xs={12} md={6} key={item.titulo}>
              <Box sx={{
                height: '100%', borderRadius: '22px', p: 3.5,
                background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 16px rgba(8,89,70,0.07)',
                transition: 'all 0.28s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 40px rgba(8,89,70,0.12)' },
              }}>
                <Box sx={{ width: 40, height: 4, borderRadius: '4px', background: item.gradient, mb: 2 }} />
                <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f1923', letterSpacing: '-0.02em', mb: 1.5 }}>
                  {item.titulo}
                </Typography>
                <Typography sx={{ fontSize: '0.9375rem', color: '#4a5568', lineHeight: 1.7 }}>
                  {item.texto}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Valores */}
        <Box sx={{ mb: 8 }}>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.75rem', md: '2.25rem' }, letterSpacing: '-0.03em',
            textAlign: 'center', mb: 5, color: '#0f1923' }}>
            Nuestros{' '}
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              valores
            </Box>
          </Typography>
          <Grid container spacing={3}>
            {[
              { icon: People, label: 'Confianza', desc: 'Claridad sobre qué hace la plataforma y qué hace cada profesional; la confianza clínica se construye en la consulta.', gradient: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)', glow: 'rgba(8,89,70,0.20)' },
              { icon: Psychology, label: 'Excelencia', desc: 'Impulsamos buenas prácticas en la información mostrada; la excelencia asistencial la asegura cada especialista.', gradient: 'linear-gradient(135deg, #272F50 0%, #085946 100%)', glow: 'rgba(39,47,80,0.20)' },
              { icon: Hearing, label: 'Accesibilidad', desc: 'Búsqueda por ciudad y especialidad para acercar opciones reales a quien las necesita.', gradient: 'linear-gradient(135deg, #71A095 0%, #085946 100%)', glow: 'rgba(113,160,149,0.25)' },
              { icon: Support, label: 'Compromiso', desc: 'Mejora continua del producto digital y acompañamiento a la red de suscriptores.', gradient: 'linear-gradient(135deg, #085946 0%, #272F50 100%)', glow: 'rgba(8,89,70,0.20)' },
            ].map((v) => (
              <Grid item xs={12} sm={6} md={3} key={v.label}>
                <Box sx={{
                  height: '100%', borderRadius: '22px', p: 3, textAlign: 'center',
                  background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 16px rgba(8,89,70,0.07)',
                  transition: 'all 0.28s ease',
                  '&:hover': { transform: 'translateY(-6px)', boxShadow: `0 20px 48px ${v.glow}` },
                }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: '14px', background: v.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                    boxShadow: `0 8px 20px ${v.glow}` }}>
                    <v.icon sx={{ color: '#fff', fontSize: 28 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f1923', mb: 1 }}>
                    {v.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: 1.65 }}>
                    {v.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Historia */}
        <Box sx={{ borderRadius: '22px', p: { xs: 3, md: 5 },
          background: 'rgba(255,255,255,0.90)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 16px rgba(8,89,70,0.07)' }}>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: '1.5rem', md: '2rem' }, letterSpacing: '-0.03em', color: '#0f1923', mb: 3 }}>
            Historia del{' '}
            <Box component="span" sx={{ background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              proyecto
            </Box>
          </Typography>
          <Typography sx={{ fontSize: '0.9375rem', color: '#4a5568', lineHeight: 1.75, mb: 2 }}>
            OírConecta surge de la experiencia en salud auditiva y de la constatación de que los pacientes necesitan un lugar donde <strong style={{ color: '#0f1923' }}>ver qué servicios existen</strong> y <strong style={{ color: '#0f1923' }}>con quién pueden acudir</strong>, sin recorrer decenas de sitios dispersos.
          </Typography>
          <Typography sx={{ fontSize: '0.9375rem', color: '#4a5568', lineHeight: 1.75, mb: 2 }}>
            La plataforma combina contenido sobre audífonos e implantes con directorios de profesionales y, para quienes se suscriben, mayor visibilidad y herramientas operativas. Así el modelo alinea al paciente informado con la oferta real del mercado.
          </Typography>
          <Typography sx={{ fontSize: '0.9375rem', color: '#4a5568', lineHeight: 1.75 }}>
            Hoy el sitio está orientado a <strong style={{ color: '#0f1923' }}>promover los servicios de la red</strong>: no sustituye al centro ni al consultorio, los potencia en un solo canal.
          </Typography>
        </Box>
      </Container>

      <Footer />
    </>
  );
};

export default NosotrosPage; 