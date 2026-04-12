import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Grid, Paper, Card, CardContent } from '@mui/material';
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

      <Box sx={{ py: 8, backgroundColor: 'grey.50', pt: { xs: 14, md: 16 } }}>
        <Container maxWidth="lg">
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 700 }}>
              Sobre OírConecta
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
              Somos una plataforma cuyo foco es <strong>promover y visibilizar los servicios</strong> de audiólogos, otólogos,
              otorrinolaringólogos y centros que suscriben su presencia. El paciente explora, compara y contacta; la atención
              clínica y comercial es responsabilidad de cada profesional o centro.
            </Typography>
          </Box>

          <Paper elevation={2} sx={{ p: 4, mb: 8, borderLeft: 4, borderColor: 'primary.main' }}>
            <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'primary.main' }}>
              Qué hace OírConecta
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Estos seis ejes definen el valor que buscamos entregar a las personas y a la red de suscriptores:
            </Typography>
            <Box
              component="ol"
              sx={{
                pl: 2.75,
                m: 0,
                '& li': { mb: 1.25, pl: 0.5 },
              }}
            >
              {[
                'Informar mensualmente los valores de referencia de audífonos y accesorios.',
                'Educar para tomar mejores decisiones sobre salud auditiva.',
                'Ayudar a ubicar al profesional o centro que mejor encaje con cada caso.',
                'Acompañar la toma de decisiones con información clara y ordenada.',
                'Ofertar y visibilizar todos los servicios que la red promueve en un solo canal.',
                'Informar sobre las distintas marcas y opciones presentes en el mercado.',
              ].map((text) => (
                <Typography key={text} component="li" variant="body1" color="text.primary">
                  {text}
                </Typography>
              ))}
            </Box>
          </Paper>

          {/* Misión y Visión */}
          <Grid container spacing={4} sx={{ mb: 8 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
                <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
                  Misión
                </Typography>
                <Typography variant="body1" paragraph>
                  Dar a los pacientes un <strong>punto de entrada claro</strong> para descubrir servicios de evaluación,
                  audífonos, implantes y rehabilitación, y ponerlos en contacto con quienes integran la red.
                </Typography>
                <Typography variant="body1">
                  Dar a los profesionales y centros suscritos <strong>visibilidad y herramientas</strong> para comunicar lo
                  que ofrecen, sin sustituir su criterio médico ni su relación con el paciente.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
                <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
                  Visión
                </Typography>
                <Typography variant="body1" paragraph>
                  Ser el canal de referencia en Colombia para que las personas encuentren <strong>servicios auditivos</strong>{' '}
                  ofrecidos por una red amplia y actualizada de especialistas y centros aliados.
                </Typography>
                <Typography variant="body1">
                  Crecer con criterios de calidad en la información publicada y con un modelo sostenible de suscripción para
                  quienes desean formar parte de la red.
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Valores */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h3" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 6, color: 'primary.main' }}>
              Valores
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', textAlign: 'center' }}>
                  <CardContent sx={{ p: 3 }}>
                    <People sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Confianza
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Claridad sobre qué hace la plataforma y qué hace cada profesional; la confianza clínica se construye en la consulta.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', textAlign: 'center' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Psychology sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Excelencia
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Impulsamos buenas prácticas en la información mostrada; la excelencia asistencial la asegura cada especialista en su ámbito.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', textAlign: 'center' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Hearing sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Accesibilidad
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Búsqueda por ciudad y especialidad para acercar opciones reales a quien las necesita.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', textAlign: 'center' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Support sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Compromiso
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mejora continua del producto digital y acompañamiento a la red de suscriptores.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Historia */}
          <Paper elevation={3} sx={{ p: 6 }}>
            <Typography variant="h3" component="h2" gutterBottom sx={{ color: 'primary.main', mb: 4 }}>
              Historia del proyecto
            </Typography>
            <Typography variant="body1" paragraph>
              OírConecta surge de la experiencia en salud auditiva y de la constatación de que los pacientes necesitan un lugar donde{' '}
              <strong>ver qué servicios existen</strong> y <strong>con quién pueden acudir</strong>, sin recorrer decenas de sitios
              dispersos.
            </Typography>
            <Typography variant="body1" paragraph>
              La plataforma combina contenido sobre audífonos e implantes con directorios de profesionales y, para quienes se suscriben,
              mayor visibilidad y herramientas operativas. Así el modelo alinea al paciente informado con la oferta real del mercado.
            </Typography>
            <Typography variant="body1">
              Hoy el sitio está orientado a <strong>promover los servicios de la red</strong>: no sustituye al centro ni al
              consultorio, los potencia en un solo canal.
            </Typography>
          </Paper>
        </Container>
      </Box>

      <Footer />
    </>
  );
};

export default NosotrosPage; 