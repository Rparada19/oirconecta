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
import Header from '../components/Header';
import Footer from '../components/Footer';

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

const ProfessionalProfileDemoPage = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [chatDialog, setChatDialog] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Datos del profesional demo
  const professional = {
    name: 'Dr. Carlos Andrés Mendoza',
    specialty: 'Otorrinolaringólogo',
    city: 'Bogotá',
    rating: 4.9,
    reviews: 127,
    experience: '15 años',
    phone: '+57 300 123 4567',
    email: 'dr.mendoza@oirconecta.com',
    whatsapp: '+57 300 123 4567',
    verified: true,
    premium: true,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=300&fit=crop&crop=face',
    banner: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200&h=300&fit=crop',
    // Redes sociales y web
    website: 'https://dr-mendoza.com',
    instagram: '@dr.mendoza.orl',
    facebook: 'Dr. Carlos Mendoza ORL',
    linkedin: 'carlos-mendoza-orl',
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
  const blogs = [
    {
      id: 1,
      title: 'Pérdida auditiva en adultos mayores: Prevención y tratamiento',
      excerpt: 'La pérdida auditiva es una condición común en adultos mayores que puede afectar significativamente la calidad de vida...',
      date: '15 de Marzo, 2024',
      readTime: '5 min',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=250&fit=crop'
    },
    {
      id: 2,
      title: 'Audífonos modernos: Tecnología y beneficios',
      excerpt: 'Los audífonos actuales incorporan tecnología avanzada que permite una audición natural y cómoda...',
      date: '8 de Marzo, 2024',
      readTime: '7 min',
      image: 'https://images.unsplash.com/photo-1576091160550-2173fba988a5?w=400&h=250&fit=crop'
    }
  ];

  // Marcas con las que trabaja
  const brands = [
    {
      id: 1,
      name: 'Phonak',
      logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=150&h=80&fit=crop',
      description: 'Audífonos de alta tecnología'
    },
    {
      id: 2,
      name: 'Oticon',
      logo: 'https://images.unsplash.com/photo-1576091160550-2173fba988a5?w=150&h=80&fit=crop',
      description: 'Soluciones auditivas innovadoras'
    },
    {
      id: 3,
      name: 'Starkey',
      logo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=150&h=80&fit=crop',
      description: 'Audífonos personalizados'
    },
    {
      id: 4,
      name: 'Cochlear',
      logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=150&h=80&fit=crop',
      description: 'Implantes cocleares'
    },
    {
      id: 5,
      name: 'Med-El',
      logo: 'https://images.unsplash.com/photo-1576091160550-2173fba988a5?w=150&h=80&fit=crop',
      description: 'Tecnología de implantes'
    },
    {
      id: 6,
      name: 'Advanced Bionics',
      logo: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=150&h=80&fit=crop',
      description: 'Sistemas de implantes'
    }
  ];

  // Opiniones de pacientes
  const patientReviews = [
    {
      id: 1,
      name: 'María González',
      rating: 5,
      date: 'Hace 2 semanas',
      comment: 'Excelente atención. El Dr. Mendoza es muy profesional y me ayudó mucho con mi problema auditivo. Muy recomendado.',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face'
    },
    {
      id: 2,
      name: 'Carlos Rodríguez',
      rating: 5,
      date: 'Hace 1 mes',
      comment: 'Muy buen diagnóstico y tratamiento. El consultorio es moderno y la atención es personalizada.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face'
    },
    {
      id: 3,
      name: 'Ana Martínez',
      rating: 5,
      date: 'Hace 3 semanas',
      comment: 'El Dr. Mendoza es muy paciente y explica todo muy bien. Me siento muy satisfecha con el tratamiento.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face'
    },
    {
      id: 4,
      name: 'Luis Pérez',
      rating: 5,
      date: 'Hace 2 meses',
      comment: 'Excelente profesional. Me ayudó a resolver mi problema de audición con tecnología de vanguardia.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
    }
  ];

  // Preguntas y respuestas
  const questions = [
    {
      id: 1,
      question: '¿Qué debo hacer si mi hijo tiene problemas de audición?',
      answer: 'Es importante realizar una evaluación temprana. Los primeros años son cruciales para el desarrollo del lenguaje. Te recomiendo agendar una cita para una evaluación completa.',
      author: 'Dr. Carlos Mendoza',
      date: 'Hace 1 día',
      likes: 12
    },
    {
      id: 2,
      question: '¿Los audífonos son dolorosos?',
      answer: 'Los audífonos modernos están diseñados para ser cómodos. Durante el período de adaptación puede haber cierta molestia, pero esto es normal y temporal.',
      author: 'Dr. Carlos Mendoza',
      date: 'Hace 3 días',
      likes: 8
    },
    {
      id: 3,
      question: '¿Cuánto tiempo toma adaptarse a los audífonos?',
      answer: 'El período de adaptación varía entre 2-4 semanas. Es importante usar los audífonos gradualmente, empezando con pocas horas al día.',
      author: 'Dr. Carlos Mendoza',
      date: 'Hace 1 semana',
      likes: 15
    }
  ];

  // Preguntas frecuentes
  // const faqs = [
  //   {
  //     question: '¿Qué debo llevar a mi primera consulta?',
  //     answer: 'Es importante llevar tu historia clínica, estudios previos si los tienes, y una lista de medicamentos que consumes actualmente.'
  //   },
  //   {
  //     question: '¿Cuánto dura una evaluación auditiva?',
  //     answer: 'Una evaluación completa puede durar entre 30 minutos y 1 hora, dependiendo de la complejidad del caso.'
  //   },
  //   {
  //     question: '¿Los audífonos son cubiertos por mi seguro?',
  //     answer: 'La cobertura varía según tu póliza. Te recomendamos consultar directamente con tu aseguradora.'
  //   }
  // ];

  // Estudios y certificaciones
  const education = [
    {
      title: 'Médico Cirujano',
      institution: 'Universidad Nacional de Colombia',
      year: '2005-2011',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=200&h=150&fit=crop'
    },
    {
      title: 'Especialización en Otorrinolaringología',
      institution: 'Universidad de los Andes',
      year: '2012-2016',
      image: 'https://images.unsplash.com/photo-1576091160550-2173fba988a5?w=200&h=150&fit=crop'
    },
    {
      title: 'Fellowship en Cirugía Endoscópica',
      institution: 'Hospital Johns Hopkins',
      year: '2017',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=200&h=150&fit=crop'
    }
  ];

  // Premios y reconocimientos
  const awards = [
    {
      title: 'Mejor Otorrinolaringólogo del Año',
      organization: 'Asociación Colombiana de Otorrinolaringología',
      year: '2023',
      image: 'https://images.unsplash.com/photo-1576091160550-2173fba988a5?w=200&h=150&fit=crop'
    },
    {
      title: 'Premio a la Excelencia Médica',
      organization: 'Ministerio de Salud',
      year: '2022',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=200&h=150&fit=crop'
    }
  ];



  // Puntos de atención
  // const locations = [
  //   {
  //     name: 'Consultorio Principal',
  //     address: 'Calle 123 #45-67, Oficina 301',
  //     city: 'Bogotá',
  //     phone: '+57 1 234 5678',
  //     hours: 'Lun-Vie: 8:00 AM - 6:00 PM',
  //     image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop'
  //   },
  //   {
  //     name: 'Centro Médico Norte',
  //     address: 'Carrera 15 #93-47, Local 2',
  //     city: 'Bogotá',
  //     phone: '+57 1 345 6789',
  //     hours: 'Lun-Vie: 9:00 AM - 5:00 PM',
  //     image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=250&fit=crop'
  //   }
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

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
  };

  return (
    <>
      <Header />
      <Helmet>
        <title>Dr. Carlos Mendoza - Otorrinolaringólogo | OirConecta</title>
        <meta name="description" content="Perfil profesional del Dr. Carlos Mendoza, especialista en otorrinolaringología con 15 años de experiencia. Agenda tu cita en Bogotá." />
        <meta name="keywords" content="otorrinolaringólogo, Bogotá, audífonos, implantes cocleares, Dr. Carlos Mendoza" />
        <link rel="canonical" href="https://oirconecta.com/profesional/dr-carlos-mendoza" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Dr. Carlos Mendoza - Otorrinolaringólogo" />
        <meta property="og:description" content="Especialista en otorrinolaringología con 15 años de experiencia. Agenda tu cita en Bogotá." />
        <meta property="og:image" content={professional.avatar} />
        <meta property="og:url" content="https://oirconecta.com/profesional/dr-carlos-mendoza" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Dr. Carlos Mendoza - Otorrinolaringólogo" />
        <meta name="twitter:description" content="Especialista en otorrinolaringología con 15 años de experiencia." />
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
                borderRadius: '8px',
                margin: '0 4px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: '#1976d2',
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)'
                },
                '&.Mui-selected': {
                  color: '#085946',
                  fontWeight: 700,
                  backgroundColor: 'rgba(8, 89, 70, 0.08)',
                  '&:hover': {
                    color: '#085946',
                    backgroundColor: 'rgba(8, 89, 70, 0.12)'
                  }
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#085946',
                height: '3px',
                borderRadius: '2px'
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
                                         <ActionButton
                       variant="contained"
                       fullWidth
                       startIcon={<CalendarToday sx={{ fontSize: 18 }} />}
                       onClick={handleBookingClick}
                       sx={{
                         background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
                         color: 'white',
                         mt: 3,
                         border: '2px solid transparent',
                         '&:hover': {
                           background: 'linear-gradient(135deg, #0d7a5f 0%, #085946 100%)',
                           border: '2px solid rgba(255, 255, 255, 0.3)',
                           transform: 'translateY(-4px) scale(1.02)',
                           boxShadow: '0 12px 32px rgba(8, 89, 70, 0.4)'
                         }
                       }}
                     >
                       Agendar Cita
                     </ActionButton>
                  </CardContent>
                </SectionCard>
              </Grid>
            </Grid>
          )}

          {/* Pestaña 2: Contenido Multimedia */}
          {selectedTab === 2 && (
            <Grid container spacing={4}>
              {/* Videos */}
              <Grid item xs={12}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                  Videos Educativos
                </Typography>
                <ImageList cols={3} gap={16}>
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
                          <IconButton sx={{ color: 'white' }}>
                            <PlayArrow />
                          </IconButton>
                        }
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </Grid>

              {/* Fotos */}
              <Grid item xs={12}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                  Galería de Fotos
                </Typography>
                <ImageList cols={3} gap={16}>
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

              {/* Blogs */}
              <Grid item xs={12}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                  Artículos y Blog
                </Typography>
                <Grid container spacing={3}>
                  {blogs.map((blog) => (
                    <Grid item xs={12} md={6} key={blog.id}>
                      <SectionCard>
                        <img
                          src={blog.image}
                          alt={blog.title}
                          style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                        />
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                            {blog.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {blog.excerpt}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {blog.date}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {blog.readTime} de lectura
                            </Typography>
                          </Box>
                        </CardContent>
                      </SectionCard>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}



          {/* Pestaña 3: Hablemos */}
          {selectedTab === 3 && (
            <Grid container spacing={4}>
              {/* Chat Directo */}
              <Grid item xs={12} md={4}>
                <SectionCard>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                      Chat Directo
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      ¿Tienes una pregunta específica? Chatea directamente con el Dr. Mendoza.
                    </Typography>
                    <ActionButton
                      variant="contained"
                      startIcon={<Forum sx={{ fontSize: 20 }} />}
                      onClick={handleChatClick}
                      fullWidth
                      sx={{
                        background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                        color: 'white',
                        border: '2px solid transparent',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #7B1FA2 0%, #9C27B0 100%)',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          transform: 'translateY(-4px) scale(1.02)',
                          boxShadow: '0 12px 32px rgba(156, 39, 176, 0.4)'
                        }
                      }}
                    >
                      Iniciar Chat
                    </ActionButton>
                  </CardContent>
                </SectionCard>
              </Grid>

              {/* Estadísticas */}
              <Grid item xs={12} md={4}>
                <SectionCard>
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#085946', mb: 1 }}>
                      {professional.rating}
                    </Typography>
                    <Rating value={professional.rating} readOnly size="large" sx={{ mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                      Calificación Promedio
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Basado en {professional.reviews} reseñas
                    </Typography>
                  </CardContent>
                </SectionCard>
              </Grid>

              {/* Opiniones */}
              <Grid item xs={12} md={4}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                  Opiniones de Nuestros Pacientes
                </Typography>
                <Grid container spacing={3}>
                  {patientReviews.slice(0, 3).map((review) => (
                    <Grid item xs={12} key={review.id}>
                      <SectionCard>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar src={review.avatar} sx={{ mr: 2, width: 40, height: 40 }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {review.name}
                              </Typography>
                              <Rating value={review.rating} readOnly size="small" />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {review.date}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: '0.875rem' }}>
                            "{review.comment}"
                          </Typography>
                        </CardContent>
                      </SectionCard>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Pestaña 4: Preguntas y Respuestas */}
          {selectedTab === 4 && (
            <Grid container spacing={4}>
              {/* Formulario para enviar pregunta */}
              <Grid item xs={12} md={4}>
                <SectionCard>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                      Enviar Pregunta
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      ¿Tienes alguna pregunta específica? Envíanosla y te responderemos lo antes posible.
                    </Typography>
                    <Box component="form" sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        label="Nombre completo *"
                        variant="outlined"
                        required
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Email *"
                        type="email"
                        variant="outlined"
                        required
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Teléfono *"
                        variant="outlined"
                        required
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        label="Tu pregunta *"
                        variant="outlined"
                        multiline
                        rows={4}
                        required
                        sx={{ mb: 3 }}
                      />
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{
                          background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
                          color: 'white',
                          py: 1.5,
                          fontWeight: 600,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0d7a5f 0%, #085946 100%)'
                          }
                        }}
                      >
                        Enviar Pregunta
                      </Button>
                    </Box>
                  </CardContent>
                </SectionCard>
              </Grid>

              {/* Preguntas existentes */}
              <Grid item xs={12} md={8}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                  Preguntas Frecuentes
                </Typography>
                <Grid container spacing={3}>
                  {questions.map((q) => (
                    <Grid item xs={12} key={q.id}>
                      <SectionCard>
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#085946' }}>
                            {q.question}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {q.answer}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Respondido por {q.author}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {q.date} • {q.likes} 👍
                            </Typography>
                          </Box>
                        </CardContent>
                      </SectionCard>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}

          

          {/* Pestaña 5: Aliados */}
          {selectedTab === 5 && (
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                  Nuestros Aliados Comerciales
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Trabajamos con las mejores marcas del mercado para garantizar la mejor calidad en audífonos e implantes cocleares.
                </Typography>
                <Grid container spacing={3}>
                  {brands.map((brand) => (
                    <Grid item xs={6} md={4} key={brand.id}>
                      <SectionCard>
                        <CardContent sx={{ textAlign: 'center', p: 3 }}>
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            style={{ width: '100%', height: '80px', objectFit: 'contain', marginBottom: '16px' }}
                          />
                          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                            {brand.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {brand.description}
                          </Typography>
                        </CardContent>
                      </SectionCard>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* Pestaña 6: Estudios Profesionales */}
          {selectedTab === 6 && (
            <Grid container spacing={4}>
              {/* Estudios */}
              <Grid item xs={12}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                  Estudios y Certificaciones
                </Typography>
                <Grid container spacing={3}>
                  {education.map((edu, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <SectionCard>
                        <img
                          src={edu.image}
                          alt={edu.title}
                          style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                        />
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                            {edu.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {edu.institution}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {edu.year}
                          </Typography>
                        </CardContent>
                      </SectionCard>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Premios */}
              <Grid item xs={12}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: '#085946' }}>
                  Premios y Reconocimientos
                </Typography>
                <Grid container spacing={3}>
                  {awards.map((award, index) => (
                    <Grid item xs={12} md={6} key={index}>
                      <SectionCard>
                        <img
                          src={award.image}
                          alt={award.title}
                          style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                        />
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                            {award.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {award.organization}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {award.year}
                          </Typography>
                        </CardContent>
                      </SectionCard>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          )}
        </Box>
      </Container>

      {/* Diálogo de agendamiento */}
      <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Agendar Cita con Dr. Mendoza</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre completo"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Teléfono"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de consulta</InputLabel>
                <Select label="Tipo de consulta">
                  <MenuItem value="evaluacion">Evaluación auditiva</MenuItem>
                  <MenuItem value="audifonos">Adaptación de audífonos</MenuItem>
                  <MenuItem value="cirugia">Consulta quirúrgica</MenuItem>
                  <MenuItem value="control">Control de seguimiento</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fecha preferida"
                type="date"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mensaje (opcional)"
                multiline
                rows={3}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => setBookingDialog(false)}>
            Confirmar Cita
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de chat */}
      <Dialog open={chatDialog} onClose={() => setChatDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chat con Dr. Mendoza</DialogTitle>
        <DialogContent>
          <Box sx={{ height: '300px', bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Sistema de chat integrado
            </Typography>
          </Box>
          <TextField
            fullWidth
            label="Escribe tu mensaje..."
            multiline
            rows={2}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChatDialog(false)}>Cerrar</Button>
          <Button variant="contained" startIcon={<Send />}>
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de video */}
      <Dialog 
        open={!!selectedVideo} 
        onClose={() => setSelectedVideo(null)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>{selectedVideo?.title}</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            height: '400px', 
            bgcolor: 'black', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: 1
          }}>
            <IconButton sx={{ color: 'white' }}>
              <PlayArrow sx={{ fontSize: 60 }} />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedVideo(null)}>Cerrar</Button>
                 </DialogActions>
       </Dialog>
       <Footer />
     </>
   );
};

export default ProfessionalProfileDemoPage; 