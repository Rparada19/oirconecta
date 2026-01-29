import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Alert,
  Snackbar
} from '@mui/material';
import { Phone, Email, LocationOn, Schedule, Send } from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ContactoPage = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    asunto: '',
    mensaje: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí se enviaría el formulario
    console.log('Formulario enviado:', formData);
    
    setSnackbar({
      open: true,
      message: '¡Gracias por tu mensaje! Te contactaremos pronto.',
      severity: 'success'
    });
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      asunto: '',
      mensaje: ''
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const contactInfo = [
    {
      icon: <Phone sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Teléfono',
      info: '+57 300 123 4567',
      description: 'Lunes a Viernes 8:00 AM - 6:00 PM'
    },
    {
      icon: <Email sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Email',
      info: 'info@oirconecta.com',
      description: 'Respondemos en menos de 24 horas'
    },
    {
      icon: <LocationOn sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Oficina Principal',
      info: 'Bogotá, Colombia',
      description: 'Calle 123 #45-67, Oficina 901'
    },
    {
      icon: <Schedule sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Horario de Atención',
      info: 'Lunes a Viernes',
      description: '8:00 AM - 6:00 PM'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Contacto - OirConecta | Conectamos Pacientes con Especialistas Auditivos</title>
        <meta name="description" content="Contáctanos para obtener información sobre nuestros servicios de salud auditiva. Encuentra especialistas auditivos en Colombia." />
        <meta name="keywords" content="contacto, OirConecta, especialistas auditivos, Colombia, salud auditiva" />
        <link rel="canonical" href="https://oirconecta.com/contacto" />
      </Helmet>

      <Header />

      <Box sx={{ py: 8, backgroundColor: 'grey.50', pt: 12 }}>
        <Container maxWidth="lg">
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 700 }}>
              Contáctanos
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
              Estamos aquí para ayudarte. Contáctanos para obtener información sobre nuestros servicios o para encontrar el especialista que necesitas.
            </Typography>
          </Box>

          <Grid container spacing={6}>
            {/* Información de Contacto */}
            <Grid item xs={12} md={4}>
              <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'primary.main', mb: 4 }}>
                Información de Contacto
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                {contactInfo.map((item, index) => (
                  <Card key={index} sx={{ mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {item.icon}
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="h6" gutterBottom>
                            {item.title}
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {item.info}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>

              {/* Horarios de Atención */}
              <Card sx={{ mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    Horarios de Atención
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      <strong>Lunes a Viernes:</strong> 8:00 AM - 6:00 PM
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      <strong>Sábados:</strong> 9:00 AM - 2:00 PM
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      <strong>Domingos:</strong> Cerrado
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Formulario de Contacto */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'primary.main', mb: 4 }}>
                    Envíanos un Mensaje
                  </Typography>
                  
                  <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Nombre completo"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Teléfono"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Asunto</InputLabel>
                          <Select
                            name="asunto"
                            value={formData.asunto}
                            onChange={handleChange}
                            label="Asunto"
                          >
                            <MenuItem value="consulta">Consulta General</MenuItem>
                            <MenuItem value="cita">Solicitar Cita</MenuItem>
                            <MenuItem value="especialista">Buscar Especialista</MenuItem>
                            <MenuItem value="audifonos">Información sobre Audífonos</MenuItem>
                            <MenuItem value="implantes">Información sobre Implantes</MenuItem>
                            <MenuItem value="otro">Otro</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Mensaje"
                          name="mensaje"
                          multiline
                          rows={6}
                          value={formData.mensaje}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          startIcon={<Send />}
                          sx={{
                            px: 4,
                            py: 1.5,
                            backgroundColor: 'primary.main',
                            '&:hover': {
                              backgroundColor: 'primary.dark',
                            },
                          }}
                        >
                          Enviar Mensaje
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Mapa o Información Adicional */}
          <Box sx={{ mt: 8 }}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h4" component="h2" gutterBottom sx={{ color: 'primary.main', textAlign: 'center', mb: 4 }}>
                  ¿Por qué elegir OirConecta?
                </Typography>
                
                <Grid container spacing={4}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                        Especialistas Certificados
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Trabajamos únicamente con profesionales certificados y con amplia experiencia en salud auditiva.
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                        Atención Personalizada
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cada paciente recibe atención personalizada según sus necesidades específicas.
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                        Seguimiento Continuo
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Acompañamos a nuestros pacientes durante todo su proceso de rehabilitación auditiva.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Box>

      <Footer />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ContactoPage; 