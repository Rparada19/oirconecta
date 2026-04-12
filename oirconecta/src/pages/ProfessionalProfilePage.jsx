import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Phone,
  Email,
  LocationOn,
  WhatsApp,
  CalendarToday,
  School,
  AccessTime,
  Star,
  ExpandMore,
  Send,
  PlayArrow,
  Facebook,
  Instagram,
  Language,
  VerifiedUser,
  StarBorder,
  AttachMoney,
  MenuBook,
  Business,
  Schedule,
  ArrowForward,
  EventAvailable,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { Helmet } from 'react-helmet';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import audiologasData from '../data/bdatos_audiologas.json';
import { createAppointment, getAvailableTimeSlots } from '../services/appointmentService';
import {
  buildPublicAllies,
  buildPublicStudies,
  buildConsultationInfo,
  alliesCategoriesWithContent,
  studyCategoriesWithContent,
} from '../utils/professionalProfilePublicContent';

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
  const [pickDate, setPickDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [pickSlot, setPickSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingReason, setBookingReason] = useState('Evaluación auditiva');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  // const [selectedVideo, setSelectedVideo] = useState(null);

  // Determinar si es una audióloga o un otólogo
  const isAudiologa = window.location.pathname.includes('/audiologos/');

  // Buscar la audióloga en los datos si es una audióloga
  const audiologaEncontrada = isAudiologa && id
    ? audiologasData.find((audiologa) => {
        const cleanName = audiologa.nombre
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        return cleanName === id;
      })
    : null;
  
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

  const alliesByCategory = buildPublicAllies(isAudiologa, audiologaEncontrada);
  const studiesByCategory = buildPublicStudies(isAudiologa, audiologaEncontrada);
  const consultationInfo = buildConsultationInfo(isAudiologa, audiologaEncontrada, professional);
  const bookingProfessionalId = isAudiologa && audiologaEncontrada?.id ? audiologaEncontrada.id : null;
  const professionalNotifyEmailForBooking =
    professional.email && professional.email.includes('@') && !String(professional.email).includes('No especificado')
      ? String(professional.email).trim()
      : null;

  const allySections = alliesCategoriesWithContent(alliesByCategory);
  const studySections = studyCategoriesWithContent(studiesByCategory);

  const nextTwoWeeksDates = useMemo(() => {
    const out = [];
    const d = new Date();
    for (let i = 0; i < 14; i += 1) {
      const x = new Date(d);
      x.setDate(d.getDate() + i);
      out.push(x.toISOString().slice(0, 10));
    }
    return out;
  }, []);

  useEffect(() => {
    if (selectedTab === 1 && !pickDate && nextTwoWeeksDates[0]) {
      setPickDate(nextTwoWeeksDates[0]);
    }
  }, [selectedTab, pickDate, nextTwoWeeksDates]);

  const loadSlots = useCallback(
    async (dateStr) => {
      if (!dateStr) {
        setSlots([]);
        return;
      }
      setSlotsLoading(true);
      setPickSlot('');
      try {
        const list = await getAvailableTimeSlots(dateStr, '07:00', '18:00', bookingProfessionalId);
        setSlots(list);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    },
    [bookingProfessionalId]
  );

  useEffect(() => {
    if (pickDate) loadSlots(pickDate);
  }, [pickDate, loadSlots]);

  // Videos de ejemplo (máximo 2 en perfil público)
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
    const today = nextTwoWeeksDates[0] || '';
    setPickDate(today);
    setPickSlot('');
    setBookingDialog(true);
  };

  const handleConfirmBooking = async () => {
    if (!pickDate || !pickSlot || !bookingName.trim() || !bookingEmail.trim() || !bookingPhone.trim()) {
      setSnackbar({ open: true, message: 'Completa fecha, hora y datos de contacto.', severity: 'warning' });
      return;
    }
    setBookingSubmitting(true);
    const res = await createAppointment({
      date: pickDate,
      time: pickSlot,
      patientName: bookingName.trim(),
      patientEmail: bookingEmail.trim(),
      patientPhone: bookingPhone.trim(),
      reason: bookingReason || 'Cita desde perfil público',
      procedencia: 'visita-medica',
      professionalId: bookingProfessionalId || undefined,
      professionalNotifyEmail: professionalNotifyEmailForBooking || undefined,
      professionalDisplayName: professional.name,
    });
    setBookingSubmitting(false);
    if (res.success) {
      setSnackbar({
        open: true,
        message:
          'Cita registrada. Recibirás un correo de confirmación; el profesional también es notificado cuando el servidor de correo esté configurado.',
        severity: 'success',
      });
      setBookingDialog(false);
    } else {
      setSnackbar({ open: true, message: res.error || 'No se pudo agendar.', severity: 'error' });
    }
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
            <Box sx={{ maxWidth: 1120, mx: 'auto' }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  mb: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(125deg, rgba(8, 89, 70, 0.09) 0%, rgba(39, 47, 80, 0.07) 55%, rgba(113, 160, 149, 0.12) 100%)',
                  border: '1px solid rgba(8, 89, 70, 0.14)',
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
                  <Box>
                    <Typography
                      variant="overline"
                      sx={{ letterSpacing: 0.12, fontWeight: 700, color: '#085946', display: 'block', mb: 0.5 }}
                    >
                      Reserva en línea
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#272F50', lineHeight: 1.2, mb: 0.5 }}>
                      Agenda tu cita
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#085946', mb: 1 }}>
                      {professional.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, lineHeight: 1.65 }}>
                      Elige día y hora en los próximos 14 días. Los cupos se sincronizan con la agenda del sistema; las horas ocupadas no aparecen.
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      px: 2.5,
                      py: 1.5,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.65)',
                      border: '1px solid rgba(255,255,255,0.9)',
                      flexShrink: 0,
                    }}
                  >
                    <EventAvailable sx={{ fontSize: 40, color: '#085946' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Especialidad
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={700} color="#272F50">
                        {professional.specialty}
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>

              <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                  <SectionCard
                    sx={{
                      borderRadius: 3,
                      border: '1px solid #e8ecf1',
                      boxShadow: '0 4px 24px rgba(39, 47, 80, 0.06)',
                      overflow: 'hidden',
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: '#085946',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1rem',
                          }}
                        >
                          1
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50', lineHeight: 1.2 }}>
                            Selecciona el día
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Desliza horizontalmente en móvil
                          </Typography>
                        </Box>
                      </Stack>

                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1.25,
                          overflowX: 'auto',
                          pb: 1,
                          mb: 1,
                          mx: { xs: -0.5, md: 0 },
                          px: { xs: 0.5, md: 0 },
                          scrollbarWidth: 'thin',
                          '&::-webkit-scrollbar': { height: 6 },
                          '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(8,89,70,0.25)',
                            borderRadius: 3,
                          },
                        }}
                      >
                        {nextTwoWeeksDates.map((ds) => {
                          const selected = pickDate === ds;
                          const d = new Date(`${ds}T12:00:00`);
                          const isToday =
                            ds === new Date().toISOString().slice(0, 10);
                          return (
                            <Paper
                              key={ds}
                              component="button"
                              type="button"
                              aria-pressed={selected}
                              aria-label={`Elegir ${d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}`}
                              onClick={() => setPickDate(ds)}
                              elevation={0}
                              sx={{
                                flex: '0 0 auto',
                                minWidth: 76,
                                py: 1.75,
                                px: 1,
                                textAlign: 'center',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                border: '2px solid',
                                borderColor: selected ? '#085946' : 'transparent',
                                bgcolor: selected ? 'rgba(8, 89, 70, 0.09)' : '#f8fafc',
                                borderRadius: 2.5,
                                transition: 'all 0.2s ease',
                                boxShadow: selected ? '0 4px 14px rgba(8, 89, 70, 0.18)' : 'none',
                                '&:hover': {
                                  borderColor: '#71A095',
                                  bgcolor: 'rgba(8, 89, 70, 0.05)',
                                  transform: 'translateY(-2px)',
                                },
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  fontWeight: 700,
                                  color: selected ? '#085946' : 'text.secondary',
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.06,
                                  fontSize: '0.65rem',
                                }}
                              >
                                {d.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '')}
                              </Typography>
                              <Typography
                                sx={{
                                  fontSize: '1.65rem',
                                  fontWeight: 800,
                                  lineHeight: 1.1,
                                  color: selected ? '#085946' : '#272F50',
                                  my: 0.25,
                                }}
                              >
                                {d.getDate()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}
                              </Typography>
                              {isToday ? (
                                <Chip label="Hoy" size="small" sx={{ mt: 0.75, height: 20, fontSize: '0.65rem', bgcolor: '#e8f5f1' }} />
                              ) : (
                                <Box sx={{ height: 28 }} />
                              )}
                            </Paper>
                          );
                        })}
                      </Box>

                      <Divider sx={{ my: 3 }} />

                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 2,
                            bgcolor: pickDate ? '#272F50' : 'grey.300',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1rem',
                          }}
                        >
                          2
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50', lineHeight: 1.2 }}>
                            Elige la hora
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {pickDate
                              ? new Date(`${pickDate}T12:00:00`).toLocaleDateString('es-CO', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                })
                              : 'Primero selecciona un día'}
                          </Typography>
                        </Box>
                      </Stack>

                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 2.5,
                          bgcolor: '#f4f7f6',
                          border: '1px solid #e3ebe8',
                          minHeight: 132,
                        }}
                      >
                        {slotsLoading ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                            <CircularProgress size={36} thickness={4} sx={{ color: '#085946' }} />
                          </Box>
                        ) : slots.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              No hay cupos libres este día.
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Prueba otro día en la franja superior.
                            </Typography>
                          </Box>
                        ) : (
                          <Grid container spacing={1.25}>
                            {slots.map((t) => {
                              const active = pickSlot === t;
                              return (
                                <Grid item xs={4} sm={3} md={2} key={t}>
                                  <Button
                                    fullWidth
                                    variant={active ? 'contained' : 'outlined'}
                                    onClick={() => setPickSlot(t)}
                                    sx={{
                                      py: 1.25,
                                      borderRadius: 2,
                                      textTransform: 'none',
                                      fontWeight: 700,
                                      fontSize: '0.95rem',
                                      borderColor: active ? '#085946' : '#cfd8d4',
                                      color: active ? '#fff' : '#272F50',
                                      bgcolor: active ? '#085946' : '#fff',
                                      boxShadow: active ? '0 4px 12px rgba(8,89,70,0.25)' : 'none',
                                      '&:hover': {
                                        borderColor: '#085946',
                                        bgcolor: active ? '#064a3a' : 'rgba(8,89,70,0.06)',
                                      },
                                    }}
                                  >
                                    {t}
                                  </Button>
                                </Grid>
                              );
                            })}
                          </Grid>
                        )}
                      </Box>

                      <Paper
                        elevation={0}
                        sx={{
                          mt: 3,
                          p: 2,
                          borderRadius: 2.5,
                          bgcolor: 'rgba(8, 89, 70, 0.06)',
                          border: '1px dashed rgba(8, 89, 70, 0.25)',
                        }}
                      >
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
                          <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                              Tu selección
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={700} color="#272F50">
                              {pickDate && pickSlot
                                ? `${new Date(`${pickDate}T12:00:00`).toLocaleDateString('es-CO', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                  })} · ${pickSlot}`
                                : 'Completa día y hora para continuar'}
                            </Typography>
                          </Box>
                          <ActionButton
                            variant="contained"
                            endIcon={<ArrowForward />}
                            onClick={handleBookingClick}
                            disabled={!pickDate || !pickSlot}
                            sx={{
                              px: 3,
                              background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 100%)',
                              color: 'white',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #064a3a 0%, #085946 100%)',
                              },
                              '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' },
                            }}
                          >
                            Siguiente: tus datos
                          </ActionButton>
                        </Stack>
                      </Paper>
                    </CardContent>
                  </SectionCard>
                </Grid>

                <Grid item xs={12} lg={4}>
                  <Stack spacing={2.5}>
                    <SectionCard
                      sx={{
                        borderRadius: 3,
                        border: '1px solid #e8ecf1',
                        boxShadow: '0 4px 20px rgba(39, 47, 80, 0.05)',
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50', mb: 2 }}>
                          Antes de venir
                        </Typography>
                        <Stack spacing={1.5}>
                          {[
                            {
                              icon: <AttachMoney sx={{ color: '#085946' }} />,
                              title: 'Costos y pagos',
                              body: consultationInfo.costos,
                              defaultOpen: true,
                            },
                            {
                              icon: <MenuBook sx={{ color: '#085946' }} />,
                              title: 'Preparación',
                              body: consultationInfo.preparacion,
                            },
                            {
                              icon: <Business sx={{ color: '#085946' }} />,
                              title: 'Contacto del centro',
                              body: consultationInfo.contactoCentro,
                            },
                          ].map((item, idx) => (
                            <Accordion
                              key={item.title}
                              defaultExpanded={item.defaultOpen}
                              disableGutters
                              elevation={0}
                              sx={{
                                border: '1px solid #e8ecf1',
                                borderRadius: '12px !important',
                                overflow: 'hidden',
                                '&:before': { display: 'none' },
                              }}
                            >
                              <AccordionSummary
                                expandIcon={<ExpandMore sx={{ color: '#085946' }} />}
                                sx={{
                                  minHeight: 52,
                                  px: 1.5,
                                  bgcolor: idx === 0 ? 'rgba(8,89,70,0.04)' : 'transparent',
                                  '& .MuiAccordionSummary-content': { my: 1.25, alignItems: 'center', gap: 1.25 },
                                }}
                              >
                                {item.icon}
                                <Typography fontWeight={700} color="#272F50" sx={{ fontSize: '0.95rem' }}>
                                  {item.title}
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                                  {item.body}
                                </Typography>
                              </AccordionDetails>
                            </Accordion>
                          ))}
                        </Stack>
                      </CardContent>
                    </SectionCard>

                    <SectionCard
                      sx={{
                        borderRadius: 3,
                        border: '1px solid #e8ecf1',
                        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                          <Schedule sx={{ color: '#085946' }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50' }}>
                            Horario habitual
                          </Typography>
                        </Stack>
                        <Stack spacing={1.25} divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />}>
                          <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.04}>
                              LUNES A VIERNES
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="#272F50">
                              {professional.schedule.monday}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.04}>
                              SÁBADO
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="#272F50">
                              {professional.schedule.saturday}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.04}>
                              DOMINGO
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="#272F50">
                              {professional.schedule.sunday}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </SectionCard>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Pestaña 3: Multimedia */}
          {selectedTab === 2 && (
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h4" gutterBottom fontWeight="bold" color="#085946">
                  Videos Educativos
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  En el perfil público se publican como máximo <strong>2 videos</strong> y <strong>3 fotos</strong>.
                </Typography>
                <ImageList cols={2} rowHeight={200} gap={16}>
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
                <ImageList cols={3} rowHeight={200} gap={16}>
                  {photos.slice(0, 3).map((photo) => (
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

          {/* Pestaña 4: Preguntas */}
          {selectedTab === 3 && (
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

          {/* Pestaña 5: Aliados (solo categorías con contenido) */}
          {selectedTab === 4 && (
            <Box>
              <Typography variant="h4" gutterBottom fontWeight="bold" color="#085946">
                Aliados
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                Marcas y proveedores con los que trabaja el profesional o centro. Solo se muestran categorías que tienen al menos un aliado.
              </Typography>
              {allySections.length === 0 ? (
                <Typography color="text.secondary">Aún no hay aliados publicados en esta ficha.</Typography>
              ) : (
                allySections.map((cat) => (
                  <Box key={cat.key} sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#272F50' }}>
                      {cat.title}
                    </Typography>
                    <Grid container spacing={3}>
                      {(alliesByCategory[cat.key] || []).map((partner) => (
                        <Grid item xs={12} sm={6} md={4} key={partner.name}>
                          <SectionCard>
                            {partner.image ? (
                              <img
                                src={partner.image}
                                alt={partner.name}
                                style={{
                                  width: '100%',
                                  height: 150,
                                  objectFit: 'cover',
                                  borderTopLeftRadius: '8px',
                                  borderTopRightRadius: '8px',
                                }}
                              />
                            ) : null}
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
                ))
              )}
            </Box>
          )}

          {/* Pestaña 6: Estudios (solo categorías con contenido) */}
          {selectedTab === 5 && (
            <Box>
              <Typography variant="h4" gutterBottom fontWeight="bold" color="#085946">
                Estudios y formación
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 3 }}>
                Trayectoria académica y actualización. Solo se listan categorías con información cargada.
              </Typography>
              {studySections.length === 0 ? (
                <Typography color="text.secondary">No hay estudios publicados en esta ficha.</Typography>
              ) : (
                studySections.map((cat) => (
                  <Box key={cat.key} sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#272F50' }}>
                      {cat.title}
                    </Typography>
                    <Grid container spacing={3}>
                      {(studiesByCategory[cat.key] || []).map((study, index) => (
                        <Grid item xs={12} md={4} key={`${cat.key}-${index}`}>
                          <SectionCard>
                            <CardContent sx={{ p: 3 }}>
                              <Typography variant="h6" fontWeight="bold" color="#085946" gutterBottom>
                                {study.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {study.institution}
                              </Typography>
                              {study.period ? (
                                <Typography variant="caption" color="text.secondary">
                                  {study.period}
                                </Typography>
                              ) : null}
                            </CardContent>
                          </SectionCard>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ))
              )}
            </Box>
          )}
        </Box>
      </Container>

      {/* Diálogos */}
      <Dialog open={bookingDialog} onClose={() => setBookingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirmar cita con {professional.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Fecha: <strong>{pickDate}</strong> · Hora: <strong>{pickSlot || '—'}</strong>
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Al confirmar, se registra la cita en el sistema. Se enviará aviso al correo del paciente y al del profesional
            (registro en consola del servidor hasta configurar SMTP).
          </Alert>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre completo"
              fullWidth
              variant="outlined"
              value={bookingName}
              onChange={(e) => setBookingName(e.target.value)}
              required
            />
            <TextField
              label="Teléfono"
              fullWidth
              variant="outlined"
              value={bookingPhone}
              onChange={(e) => setBookingPhone(e.target.value)}
              required
            />
            <TextField
              label="Email"
              fullWidth
              variant="outlined"
              type="email"
              value={bookingEmail}
              onChange={(e) => setBookingEmail(e.target.value)}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Motivo de consulta</InputLabel>
              <Select
                label="Motivo de consulta"
                value={bookingReason}
                onChange={(e) => setBookingReason(e.target.value)}
              >
                <MenuItem value="Evaluación auditiva">Evaluación auditiva</MenuItem>
                <MenuItem value="Adaptación de audífonos">Adaptación de audífonos</MenuItem>
                <MenuItem value="Revisión general">Revisión general</MenuItem>
                <MenuItem value="Otro">Otro</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBookingDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#085946' }}
            onClick={handleConfirmBooking}
            disabled={bookingSubmitting}
          >
            {bookingSubmitting ? 'Guardando…' : 'Confirmar cita'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={8000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Footer />
    </>
  );
};

export default ProfessionalProfilePage; 