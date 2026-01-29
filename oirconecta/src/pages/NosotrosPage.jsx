import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Grid, Paper, Card, CardContent } from '@mui/material';
import { People, Psychology, Hearing, Support } from '@mui/icons-material';

const NosotrosPage = () => {
  return (
    <>
      <Helmet>
        <title>Nosotros - OirConecta | Conectando Pacientes con Especialistas Auditivos</title>
        <meta name="description" content="Conoce más sobre OirConecta, la plataforma que conecta pacientes con los mejores especialistas auditivos de Colombia. Nuestra misión es mejorar la calidad de vida de las personas con problemas auditivos." />
        <meta name="keywords" content="OirConecta, especialistas auditivos, Colombia, audiólogos, otorrinolaringólogos, otólogos, salud auditiva" />
        <link rel="canonical" href="https://oirconecta.com/nosotros" />
      </Helmet>

      <Box sx={{ py: 8, backgroundColor: 'grey.50' }}>
        <Container maxWidth="lg">
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 700 }}>
              Sobre OirConecta
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
              Conectamos pacientes con los mejores especialistas auditivos de Colombia para mejorar la calidad de vida de las personas con problemas auditivos.
            </Typography>
          </Box>

          {/* Misión y Visión */}
          <Grid container spacing={4} sx={{ mb: 8 }}>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
                <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
                  Nuestra Misión
                </Typography>
                <Typography variant="body1" paragraph>
                  Facilitar el acceso a especialistas auditivos de alta calidad, proporcionando una plataforma confiable que conecte pacientes con profesionales certificados en Colombia.
                </Typography>
                <Typography variant="body1">
                  Buscamos democratizar el acceso a la salud auditiva, eliminando barreras geográficas y económicas que impiden a las personas recibir la atención que necesitan.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
                <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
                  Nuestra Visión
                </Typography>
                <Typography variant="body1" paragraph>
                  Ser la plataforma líder en Colombia para la conexión entre pacientes y especialistas auditivos, contribuyendo significativamente a mejorar la calidad de vida de las personas con problemas auditivos.
                </Typography>
                <Typography variant="body1">
                  Aspiramos a crear una comunidad donde la salud auditiva sea accesible, de calidad y centrada en el paciente.
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Valores */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h3" component="h2" gutterBottom sx={{ textAlign: 'center', mb: 6, color: 'primary.main' }}>
              Nuestros Valores
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
                      Construimos relaciones basadas en la transparencia y la confianza mutua entre pacientes y profesionales.
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
                      Trabajamos con los mejores especialistas certificados para garantizar la más alta calidad en la atención.
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
                      Facilitamos el acceso a la salud auditiva para todas las personas, sin importar su ubicación.
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
                      Estamos comprometidos con el bienestar y la mejora de la calidad de vida de nuestros usuarios.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Historia */}
          <Paper elevation={3} sx={{ p: 6 }}>
            <Typography variant="h3" component="h2" gutterBottom sx={{ color: 'primary.main', mb: 4 }}>
              Nuestra Historia
            </Typography>
            <Typography variant="body1" paragraph>
              OirConecta nació de la necesidad de conectar a pacientes con problemas auditivos con especialistas calificados en Colombia. 
              Identificamos que muchas personas tenían dificultades para encontrar profesionales confiables y accesibles en su área.
            </Typography>
            <Typography variant="body1" paragraph>
              Nuestro equipo, conformado por profesionales de la salud y tecnología, desarrolló una plataforma integral que no solo 
              conecta pacientes con especialistas, sino que también proporciona información valiosa sobre salud auditiva y recursos educativos.
            </Typography>
            <Typography variant="body1">
              Hoy, OirConecta es una plataforma confiable que ha ayudado a miles de pacientes a encontrar la atención auditiva que necesitan, 
              contribuyendo significativamente a mejorar su calidad de vida.
            </Typography>
          </Paper>
        </Container>
      </Box>
      
    </>
  );
};

export default NosotrosPage; 