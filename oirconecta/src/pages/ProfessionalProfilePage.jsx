import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Rating,
  Stack,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper
} from '@mui/material';
import {
  Phone,
  Email,
  LocationOn,
  WhatsApp,
  CalendarToday,
  VideoLibrary,
  PhotoLibrary,
  Article,
  Forum,
  QuestionAnswer,
  School,
  EmojiEvents,
  Business,
  AccessTime,
  Star,
  ExpandMore,
  Send,
  PlayArrow,
  Facebook,
  Instagram,
  Language,
  VerifiedUser,
  StarBorder
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import audiologasData from '../data/bdatos_audiologas.json';

// Componentes estilizados
const BannerContainer = styled(Box)(() => ({
  height: '600px',
  width: '100%',
  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#1e293b',
  marginTop: '64px',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url(https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1400&h=600&fit=crop)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 0.1,
    zIndex: 1
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(248, 250, 252, 0.95) 0%, rgba(226, 232, 240, 0.9) 100%)',
    zIndex: 2
  }
}));

const ProfessionalAvatar = styled(Avatar)(() => ({
  width: 180,
  height: 180,
  border: '4px solid #ffffff',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
  position: 'relative',
  zIndex: 3,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.15), 0 6px 16px rgba(0, 0, 0, 0.08)'
  }
}));

const SectionCard = styled(Card)(() => ({
  height: '100%',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 24px rgba(8, 89, 70, 0.15)'
  }
}));

const ActionButton = styled(Button)(() => ({
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '14px',
  padding: '14px 28px',
  minHeight: '48px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  border: '1px solid transparent',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(0, 0, 0, 0.1)'
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
  }
}));

const ProfessionalProfilePage = () => {
  const { id, nombre } = useParams();
  const [selectedTab, setSelectedTab] = useState(0);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [chatDialog, setChatDialog] = useState(false);
  // const [selectedVideo, setSelectedVideo] = useState(null);

  // Determinar si es una audióloga o un otólogo
  const isAudiologa = window.location.pathname.includes('/audiologos/');
  
  console.log('🔍 Debug ProfessionalProfilePage:');
  console.log('📍 URL actual:', window.location.pathname);
  console.log('🆔 ID recibido:', id);
  console.log('📝 Nombre recibido:', nombre);
  console.log('👩‍⚕️ ¿Es audióloga?', isAudiologa);
  console.log('📊 Total audiólogas en datos:', audiologasData.length);
  
  // Buscar la audióloga en los datos si es una audióloga
  const audiologaEncontrada = isAudiologa && id ? 
    audiologasData.find(audiologa => {
      const cleanName = audiologa.nombre
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      console.log('🔍 Comparando:', cleanName, 'con', id);
      return cleanName === id;
    }) : null;
    
  console.log('✅ Audióloga encontrada:', audiologaEncontrada);
  
  // Convertir el ID a nombre legible
  const nameFromId = id ? id.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') : 'Profesional';

  // Datos del profesional basado en el ID o datos reales de audióloga
  const professional = audiologaEncontrada ? {
    name: audiologaEncontrada.nombre,
    specialty: audiologaEncontrada.especialidad || 'Audióloga',
    city: audiologaEncontrada.ciudad || 'No especificado',
    rating: parseFloat(audiologaEncontrada.calificacion) || 4.5,
    reviews: audiologaEncontrada.pacientes || 100,
    experience: 'Especialista en audiología',
    phone: audiologaEncontrada.telefono || 'No especificado',
    email: audiologaEncontrada.email || 'No especificado',
    whatsapp: audiologaEncontrada.celular || audiologaEncontrada.telefono || 'No especificado',
    verified: true,
    premium: audiologaEncontrada.destacado || false,
    avatar: audiologaEncontrada.foto || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face',
    banner: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=300&fit=crop',
    // Redes sociales y web
    website: audiologaEncontrada.sitioWeb || 'No especificado',
    instagram: 'No especificado',
    facebook: 'No especificado',
    linkedin: 'No especificado',
    // Ubicación
    address: audiologaEncontrada.direccion || 'No especificado',
    neighborhood: audiologaEncontrada.departamento || 'No especificado',
    coordinates: { lat: 4.6682, lng: -74.0539 },
    // Horarios
    schedule: {
      monday: audiologaEncontrada.horarios || '8:00 AM - 6:00 PM',
      tuesday: audiologaEncontrada.horarios || '8:00 AM - 6:00 PM',
      wednesday: audiologaEncontrada.horarios || '8:00 AM - 6:00 PM',
      thursday: audiologaEncontrada.horarios || '8:00 AM - 6:00 PM',
      friday: audiologaEncontrada.horarios || '8:00 AM - 6:00 PM',
      saturday: 'Cerrado',
      sunday: 'Cerrado'
    }
  } : {
    name: `Dr. ${nameFromId}`,
    specialty: 'Otorrinolaringólogo',
    city: 'Bogotá',
    rating: 4.9,
    reviews: 127,
    experience: '15 años',
    phone: '+57 300 123 4567',
    email: `${id.replace(/-/g, '.')}@oirconecta.com`,
    whatsapp: '+57 300 123 4567',
    verified: true,
    premium: true,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face',
    banner: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=300&fit=crop',
    // Redes sociales y web
    website: `https://${id}.com`,
    instagram: `@${id.replace(/-/g, '.')}`,
    facebook: `${nameFromId} ORL`,
    linkedin: id.replace(/-/g, '-'),
    // Ubicación
    address: 'Calle 123 #45-67, Oficina 302',
    neighborhood: 'Chapinero',
    coordinates: { lat: 4.6682, lng: -74.0539 },
    // Horarios
    schedule: {
      monday: '8:00 AM - 6:00 PM',
      tuesday: '8:00 AM - 6:00 PM',
      wednesday: '8:00 AM - 6:00 PM',
      thursday: '8:00 AM - 6:00 PM',
      friday: '8:00 AM - 4:00 PM',
      saturday: '8:00 AM - 12:00 PM',
      sunday: 'Cerrado'
    }
  };

  // Videos de ejemplo
  const videos = [
    {
      id: 1,
      title: '¿Cómo detectar problemas auditivos?',
      thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop',
      duration: '5:32',
      views: '2.3k'
    },
    {
      id: 2,
      title: 'Cuidados del oído en niños',
      thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173fba988a5?w=300&h=200&fit=crop',
      duration: '8:15',
      views: '1.8k'
    },
    {
      id: 3,
      title: 'Implantes cocleares: Todo lo que debes saber',
      thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop',
      duration: '12:45',
      views: '3.1k'
    }
  ];

  // Fotos de ejemplo
  const photos = [
    {
      id: 1,
      title: 'Consultorio principal',
      img: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      description: 'Sala de espera y recepción'
    },
    {
      id: 2,
      title: 'Equipo de diagnóstico',
      img: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
      description: 'Tecnología avanzada para evaluaciones'
    },
    {
      id: 3,
      title: 'Sala de procedimientos',
      img: 'https://images.unsplash.com/photo-1576091160550-2173fba988a5?w=400&h=300&fit=crop',
      description: 'Ambiente estéril para cirugías'
    }
  ];

  // Blogs de ejemplo
  // const blogs = [
  //   {
  //     id: 1,
  //     title: 'Pérdida auditiva en adultos mayores: Prevención y tratamiento',
  //     excerpt: 'La pérdida auditiva es una condición común en adultos mayores que puede afectar significativamente la calidad de vida...',
  //     date: '15 de Marzo, 2024',
  //     readTime: '5 min',
  //     image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=250&fit=crop'
  //   },
  //   {
  //     id: 2,
  //     title: 'Audífonos digitales: Tecnología que mejora la audición',
  //     excerpt: 'Los audífonos digitales modernos ofrecen una calidad de sonido superior y características avanzadas...',
  //     date: '10 de Marzo, 2024',
  //     readTime: '7 min',
  //     image: 'https://images.unsplash.com/photo-1576091160550-2173fba988a5?w=400&h=250&fit=crop'
  //   },
  //   {
  //     id: 3,
  //     title: 'Tinnitus: Causas, síntomas y tratamientos',
  //     excerpt: 'El tinnitus es una condición que afecta a millones de personas en todo el mundo...',
  //     date: '5 de Marzo, 2024',
  //     readTime: '6 min',
  //     image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop'
  //   }
  // ];

  // Servicios
  // const services = [
  //   {
  //     id: 1,
  //     title: 'Evaluación auditiva completa',
  //     description: 'Examen exhaustivo del sistema auditivo',
  //     icon: '👂',
  //     price: 'Desde $150.000'
  //   },
  //   {
  //     id: 2,
  //     title: 'Adaptación de audífonos',
  //     description: 'Selección y ajuste personalizado',
  //     icon: '🔊',
  //     price: 'Desde $2.500.000'
  //   },
  //   {
  //     id: 3,
  //     title: 'Terapia de rehabilitación auditiva',
  //     description: 'Programas de entrenamiento auditivo',
  //     icon: '🎧',
  //     price: 'Desde $300.000'
  //   },
  //   {
  //     id: 4,
  //     title: 'Screening auditivo neonatal',
  //     description: 'Detección temprana en recién nacidos',
  //     icon: '👶',
  //     price: 'Desde $80.000'
  //   },
  //   {
  //     id: 5,
  //     title: 'Evaluación vestibular',
  //     description: 'Análisis del equilibrio y vértigo',
  //     icon: '⚖️',
  //     price: 'Desde $200.000'
  //   },
  //   {
  //     id: 6,
  //     title: 'Asesoría en implantes cocleares',
  //     description: 'Evaluación y seguimiento',
  //     icon: '🔌',
  //     price: 'Consulta gratuita'
  //   }
  // ];

  // Prepagadas
  // const prepagadas = [
  //   'Sura', 'Colsanitas', 'Compensar', 'Famisanar', 'Nueva EPS', 'Salud Total'
  // ];

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleBookingClick = () => {
    setBookingDialog(true);
  };

  const handleChatClick = () => {
    setChatDialog(true);
  };

  const handleVideoClick = () => {
    // setSelectedVideo(video);
  };

  return (
    <>
      <Header />
      <Helmet>
        <title>{`${professional.name} - ${professional.specialty} | OirConecta`}</title>
        <meta name="description" content={`Perfil profesional de ${professional.name}, especialista en ${professional.specialty.toLowerCase()} con ${professional.experience} de experiencia. Agenda tu cita en ${professional.city}.`} />
        <meta name="keywords" content={`${professional.specialty.toLowerCase()}, ${professional.city}, audífonos, implantes cocleares, ${professional.name}`} />
        <link rel="canonical" href={`https://oirconecta.com/profesionales/otologos/${id}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${professional.name} - ${professional.specialty}`} />
        <meta property="og:description" content={`Especialista en ${professional.specialty.toLowerCase()} con ${professional.experience} de experiencia. Agenda tu cita en ${professional.city}.`} />
        <meta property="og:image" content={professional.avatar} />
        <meta property="og:url" content={`https://oirconecta.com/profesionales/otologos/${id}`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${professional.name} - ${professional.specialty}`} />
        <meta name="twitter:description" content={`Especialista en ${professional.specialty.toLowerCase()} con ${professional.experience} de experiencia.`} />
        <meta name="twitter:image" content={professional.avatar} />
      </Helmet>

      {/* Banner y foto profesional */}
      <BannerContainer sx={{ zIndex: 1, position: 'relative' }}>
        <Container maxWidth="xl" sx={{ height: '100%' }}>
          <Box sx={{ 
            position: 'relative', 
            zIndex: 3, 
            textAlign: 'center',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <ProfessionalAvatar src={professional.avatar} alt={professional.name} />
            <Typography variant="h2" sx={{ 
              mt: 4, 
              fontWeight: 900, 
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
              letterSpacing: '0.02em',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {professional.name}
            </Typography>
            <Typography variant="h4" sx={{ 
              mt: 2, 
              opacity: 0.95, 
              fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.9rem' },
              fontWeight: 300,
              letterSpacing: '0.05em',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}>
              {professional.specialty}
            </Typography>
            
            {/* Extracto del profesional */}
            <Typography variant="body1" sx={{ 
              mt: 3, 
              maxWidth: '600px',
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
              lineHeight: 1.6,
              opacity: 0.9,
              textAlign: 'center',
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              Especialista con {professional.experience} de experiencia en el diagnóstico y tratamiento de problemas auditivos. 
              Comprometido con la excelencia médica y la atención personalizada para cada paciente.
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 5, gap: 3, flexWrap: 'wrap' }}>
              <Rating value={professional.rating} precision={0.1} readOnly size="large" />
              <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                {professional.rating} ({professional.reviews} reseñas)
              </Typography>
              {professional.verified && (
                <Chip icon={<VerifiedUser />} label="Verificado" color="primary" size="large" />
              )}
              {professional.premium && (
                <Chip icon={<Star />} label="Premium" color="warning" size="large" />
              )}
            </Box>
            {/* NO BOTONES EN EL BANNER - SOLO INFORMACIÓN */}
          </Box>
        </Container>
      </BannerContainer>

      {/* Sección de botones de acción - FUERA DEL BANNER */}
      <Box sx={{ 
        background: 'white', 
        py: 6, 
        mt: 0,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        zIndex: 3
      }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
            <ActionButton
              variant="contained"
              startIcon={<CalendarToday sx={{ fontSize: 20 }} />}
              onClick={handleBookingClick}
              sx={{
                background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
                color: 'white',
                border: '2px solid transparent',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0d7a5f 0%, #085946 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              Agendar Cita
            </ActionButton>
            <ActionButton
              variant="outlined"
              startIcon={<WhatsApp sx={{ fontSize: 20 }} />}
              onClick={() => window.open(`https://wa.me/${professional.whatsapp}`, '_blank')}
              sx={{
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: 'white',
                border: '2px solid #25D366',
                '&:hover': {
                  background: 'linear-gradient(135deg, #128C7E 0%, #25D366 100%)',
                  border: '2px solid #128C7E',
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: '0 12px 32px rgba(37, 211, 102, 0.4)'
                }
              }}
            >
              WhatsApp
            </ActionButton>
            <ActionButton
              variant="outlined"
              startIcon={<Phone sx={{ fontSize: 20 }} />}
              onClick={() => window.open(`tel:${professional.phone}`)}
              sx={{
                background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                color: 'white',
                border: '2px solid #2196F3',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976D2 0%, #2196F3 100%)',
                  border: '2px solid #1976D2',
                  transform: 'translateY(-4px) scale(1.02)',
                  boxShadow: '0 12px 32px rgba(33, 150, 243, 0.4)'
                }
              }}
            >
              Llamar
            </ActionButton>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 6, mb: 8 }}>
        {/* Navegación por pestañas */}
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          mb: 4,
          overflowX: 'auto',
          backgroundColor: '#fafafa',
          borderRadius: '12px',
          padding: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          '&::-webkit-scrollbar': {
            height: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '4px',
            '&:hover': {
              background: '#a8a8a8'
            }
          }
        }}>
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange} 
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                minWidth: 'auto',
                px: 3,
                py: 2,
                fontSize: '14px',
                fontWeight: 600,
                textTransform: 'none',
                color: '#666',
                '&.Mui-selected': {
                  color: '#085946',
                  fontWeight: 700
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#085946',
                height: '3px'
              }
            }}
          >
            <Tab label="Contacto" />
            <Tab label="Agendar Cita" />
            <Tab label="Multimedia" />
            <Tab label="Hablemos" />
            <Tab label="Preguntas" />
            <Tab label="Aliados" />
            <Tab label="Estudios Profesionales" />
          </Tabs>
        </Box>

        {/* Contenido de las pestañas */}
        <Box sx={{ minHeight: '600px' }}>
          {/* Pestaña 1: Información de Contacto */}
          {selectedTab === 0 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <SectionCard>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                      Datos de Contacto
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <Phone color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Teléfono" 
                          secondary={professional.phone}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Email color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Email" 
                          secondary={professional.email}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <LocationOn color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Ciudad" 
                          secondary={professional.city}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <WhatsApp color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="WhatsApp" 
                          secondary={professional.whatsapp}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Language color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Sitio Web" 
                          secondary={professional.website}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Instagram color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Instagram" 
                          secondary={professional.instagram}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Facebook color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Facebook" 
                          secondary={professional.facebook}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </SectionCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SectionCard>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                      Información Profesional
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <School color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Especialidad" 
                          secondary={professional.specialty}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <AccessTime color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Experiencia" 
                          secondary={`${professional.experience} de experiencia`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Star color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Calificación" 
                          secondary={`${professional.rating}/5.0 (${professional.reviews} reseñas)`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </SectionCard>
              </Grid>
            </Grid>
          )}

          {/* Pestaña 2: Agendar Cita */}
          {selectedTab === 1 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <SectionCard>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                      Calendario de Disponibilidad
                    </Typography>
                    <Box sx={{ 
                      height: '400px', 
                      bgcolor: 'grey.100', 
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Typography variant="h6" color="text.secondary">
                        Calendario de citas integrado
                      </Typography>
                    </Box>
                  </CardContent>
                </SectionCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <SectionCard>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                      Horarios de Atención
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Lunes - Viernes" 
                          secondary="8:00 AM - 6:00 PM"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Sábados" 
                          secondary="9:00 AM - 2:00 PM"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Domingos" 
                          secondary="Cerrado"
                        />
                      </ListItem>
                    </List>
                    <Box sx={{ mt: 3 }}>
                      <ActionButton
                        variant="contained"
                        fullWidth
                        startIcon={<CalendarToday />}
                        onClick={handleBookingClick}
                        sx={{
                          background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0d7a5f 0%, #085946 100%)'
                          }
                        }}
                      >
                        Agendar Cita
                      </ActionButton>
                    </Box>
                  </CardContent>
                </SectionCard>
              </Grid>
            </Grid>
          )}

          {/* Pestaña 3: Multimedia */}
          {selectedTab === 2 && (
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h4" gutterBottom fontWeight="bold" color="#085946">
                  Videos Educativos
                </Typography>
                <ImageList cols={{ xs: 1, sm: 2, md: 3 }} rowHeight={200} gap={16}>
                  {videos.map((video) => (
                    <ImageListItem key={video.id} sx={{ cursor: 'pointer' }} onClick={() => handleVideoClick(video)}>
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        loading="lazy"
                        style={{ borderRadius: '8px' }}
                      />
                      <ImageListItemBar
                        title={video.title}
                        subtitle={`${video.duration} • ${video.views} vistas`}
                        actionIcon={
                          <IconButton
                            sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                            aria-label={`ver ${video.title}`}
                          >
                            <PlayArrow />
                          </IconButton>
                        }
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h4" gutterBottom fontWeight="bold" color="#085946">
                  Galería de Fotos
                </Typography>
                <ImageList cols={{ xs: 1, sm: 2, md: 3 }} rowHeight={200} gap={16}>
                  {photos.map((photo) => (
                    <ImageListItem key={photo.id}>
                      <img
                        src={photo.img}
                        alt={photo.title}
                        loading="lazy"
                        style={{ borderRadius: '8px' }}
                      />
                      <ImageListItemBar
                        title={photo.title}
                        subtitle={photo.description}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </Grid>
            </Grid>
          )}

          {/* Pestaña 4: Hablemos */}
          {selectedTab === 3 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <SectionCard>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                      Chat Directo
                    </Typography>
                    <Typography variant="body1" paragraph>
                      ¿Tienes una pregunta específica? Chatea directamente con el Dr. {nameFromId}.
                    </Typography>
                    <ActionButton
                      variant="contained"
                      fullWidth
                      startIcon={<QuestionAnswer />}
                      onClick={handleChatClick}
                      sx={{
                        background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                        color: 'white',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)'
                        }
                      }}
                    >
                      Iniciar Chat
                    </ActionButton>
                  </CardContent>
                </SectionCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <SectionCard>
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h2" sx={{ mb: 2, fontWeight: 900, color: '#085946' }}>
                      {professional.rating}
                    </Typography>
                    <Rating value={professional.rating} precision={0.1} readOnly size="large" />
                    <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: '#085946' }}>
                      Calificación Promedio
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Basado en {professional.reviews} reseñas
                    </Typography>
                  </CardContent>
                </SectionCard>
              </Grid>
              <Grid item xs={12} md={4}>
                <SectionCard>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                      Opiniones de Nuestros Pacientes
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>MG</Avatar>
                          <Typography variant="body2" fontWeight="bold">María González</Typography>
                        </Box>
                        <Rating value={5} readOnly size="small" />
                        <Typography variant="caption" color="text.secondary">Hace 2 semanas</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Excelente atención. El Dr. {nameFromId} es muy profesional y me ayudó mucho con mi problema auditivo. Muy recomendado.
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>CR</Avatar>
                          <Typography variant="body2" fontWeight="bold">Carlos Rodríguez</Typography>
                        </Box>
                        <Rating value={5} readOnly size="small" />
                        <Typography variant="caption" color="text.secondary">Hace 1 mes</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Muy buen diagnóstico y tratamiento. El consultorio es moderno y la atención es personalizada.
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>AM</Avatar>
                          <Typography variant="body2" fontWeight="bold">Ana Martínez</Typography>
                        </Box>
                        <Rating value={5} readOnly size="small" />
                        <Typography variant="caption" color="text.secondary">Hace 3 semanas</Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          El Dr. {nameFromId} es muy paciente y explica todo muy bien. Me siento muy satisfecha con el tratamiento.
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </SectionCard>
              </Grid>
            </Grid>
          )}

          {/* Pestaña 5: Preguntas */}
          {selectedTab === 4 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <SectionCard>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                      Enviar Pregunta
                    </Typography>
                    <Typography variant="body1" paragraph>
                      ¿Tienes alguna pregunta específica? Envíanosla y te responderemos lo antes posible.
                    </Typography>
                    <Stack spacing={3}>
                      <TextField
                        label="Nombre completo **"
                        fullWidth
                        variant="outlined"
                      />
                      <TextField
                        label="Email **"
                        fullWidth
                        variant="outlined"
                        type="email"
                      />
                      <TextField
                        label="Teléfono **"
                        fullWidth
                        variant="outlined"
                      />
                      <TextField
                        label="Tu pregunta **"
                        fullWidth
                        variant="outlined"
                        multiline
                        rows={4}
                      />
                      <ActionButton
                        variant="contained"
                        fullWidth
                        startIcon={<Send />}
                        sx={{
                          background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
                          color: 'white',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0d7a5f 0%, #085946 100%)'
                          }
                        }}
                      >
                        Enviar Pregunta
                      </ActionButton>
                    </Stack>
                  </CardContent>
                </SectionCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <SectionCard>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                      Preguntas Frecuentes
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          ¿Qué debo hacer si mi hijo tiene problemas de audición?
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Es importante realizar una evaluación temprana. Los primeros años son cruciales para el desarrollo del lenguaje. Te recomiendo agendar una cita para una evaluación completa.
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Respondido por Dr. {nameFromId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Hace 1 día • 12 👍
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          ¿Los audífonos son dolorosos?
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Los audífonos modernos están diseñados para ser cómodos. Durante el período de adaptación puede haber cierta molestia, pero esto es normal y temporal.
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Respondido por Dr. {nameFromId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Hace 3 días • 8 👍
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          ¿Cuánto tiempo toma adaptarse a los audífonos?
                        </Typography>
                        <Typography variant="body2" paragraph>
                          El período de adaptación varía entre 2-4 semanas. Es importante usar los audífonos gradualmente, empezando con pocas horas al día.
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Respondido por Dr. {nameFromId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Hace 1 semana • 15 👍
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                </SectionCard>
              </Grid>
            </Grid>
          )}

          {/* Pestaña 6: Aliados */}
          {selectedTab === 5 && (
            <Box>
              <Typography variant="h4" gutterBottom fontWeight="bold" color="#085946">
                Nuestros Aliados Comerciales
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 4 }}>
                Trabajamos con las mejores marcas del mercado para garantizar la mejor calidad en audífonos e implantes cocleares.
              </Typography>
              <Grid container spacing={3}>
                {[
                  { name: 'Phonak', description: 'Audífonos de alta tecnología', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop' },
                  { name: 'Oticon', description: 'Soluciones auditivas innovadoras', image: 'https://images.unsplash.com/photo-1576091160550-2173fba988a5?w=300&h=200&fit=crop' },
                  { name: 'Starkey', description: 'Audífonos personalizados', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop' },
                  { name: 'Cochlear', description: 'Implantes cocleares', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=300&h=200&fit=crop' },
                  { name: 'Med-El', description: 'Tecnología de implantes', image: 'https://images.unsplash.com/photo-1576091160550-2173fba988a5?w=300&h=200&fit=crop' },
                  { name: 'Advanced Bionics', description: 'Sistemas de implantes', image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=200&fit=crop' }
                ].map((partner, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <SectionCard>
                      <img
                        src={partner.image}
                        alt={partner.name}
                        style={{ 
                          width: '100%', 
                          height: 150, 
                          objectFit: 'cover',
                          borderTopLeftRadius: '8px',
                          borderTopRightRadius: '8px'
                        }}
                      />
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {partner.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {partner.description}
                        </Typography>
                      </CardContent>
                    </SectionCard>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Pestaña 7: Estudios Profesionales */}
          {selectedTab === 6 && (
            <Box>
              <Typography variant="h4" gutterBottom fontWeight="bold" color="#085946">
                Estudios y Certificaciones
              </Typography>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                  { title: 'Médico Cirujano', institution: 'Universidad Nacional de Colombia', period: '2005-2011' },
                  { title: 'Especialización en Otorrinolaringología', institution: 'Universidad de los Andes', period: '2012-2016' },
                  { title: 'Fellowship en Cirugía Endoscópica', institution: 'Hospital Johns Hopkins', period: '2017' }
                ].map((study, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <SectionCard>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="h6" fontWeight="bold" color="#085946">
                            {study.title}
                          </Typography>
                          <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: 'grey.100', 
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="caption" color="text.secondary">?</Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {study.institution}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {study.period}
                        </Typography>
                      </CardContent>
                    </SectionCard>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h4" gutterBottom fontWeight="bold" color="#085946">
                Premios y Reconocimientos
              </Typography>
              <Grid container spacing={3}>
                {[
                  { title: 'Mejor Otorrinolaringólogo del Año', institution: 'Asociación Colombiana de Otorrinolaringología' },
                  { title: 'Premio a la Excelencia Médica', institution: 'Ministerio de Salud' }
                ].map((award, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <SectionCard>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6" fontWeight="bold" color="#085946">
                            {award.title}
                          </Typography>
                          <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            bgcolor: 'grey.100', 
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Typography variant="caption" color="text.secondary">?</Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {award.institution}
                        </Typography>
                      </CardContent>
                    </SectionCard>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </Container>

      {/* Diálogos */}
      <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agendar Cita con {professional.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Nombre completo"
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Teléfono"
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Email"
              fullWidth
              variant="outlined"
              type="email"
            />
            <FormControl fullWidth>
              <InputLabel>Motivo de consulta</InputLabel>
              <Select label="Motivo de consulta">
                <MenuItem value="evaluacion">Evaluación auditiva</MenuItem>
                <MenuItem value="audifonos">Adaptación de audífonos</MenuItem>
                <MenuItem value="revision">Revisión general</MenuItem>
                <MenuItem value="otro">Otro</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Fecha preferida"
              fullWidth
              variant="outlined"
              type="date"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialog(false)}>Cancelar</Button>
          <Button variant="contained" sx={{ bgcolor: '#085946' }}>
            Confirmar Cita
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={chatDialog} onClose={() => setChatDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Contactar a {professional.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Nombre completo"
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Email"
              fullWidth
              variant="outlined"
              type="email"
            />
            <TextField
              label="Mensaje"
              fullWidth
              variant="outlined"
              multiline
              rows={4}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChatDialog(false)}>Cancelar</Button>
          <Button variant="contained" sx={{ bgcolor: '#085946' }}>
            Enviar Mensaje
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </>
  );
};

export default ProfessionalProfilePage; 