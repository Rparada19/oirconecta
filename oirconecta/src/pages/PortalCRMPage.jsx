import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  Dashboard,
  CalendarToday,
  People,
  Settings,
  Assessment,
  ExitToApp,
  PersonAdd,
  Campaign,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const PortalCRMPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login-crm');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <Dashboard />,
      description: 'Vista general del sistema',
      color: '#085946',
      path: '/portal-crm/dashboard',
    },
    {
      title: 'Citas',
      icon: <CalendarToday />,
      description: 'Gestionar citas agendadas',
      color: '#0a6b56',
      path: '/portal-crm/citas',
    },
    {
      title: 'Leads',
      icon: <PersonAdd />,
      description: 'Gestionar leads y prospectos',
      color: '#272F50',
      path: '/portal-crm/leads',
    },
    {
      title: 'Pacientes',
      icon: <People />,
      description: 'Base de datos de pacientes',
      color: '#085946',
      path: '/portal-crm/pacientes',
    },
    {
      title: 'Campañas de Marketing',
      icon: <Campaign />,
      description: 'Gestionar campañas y promociones',
      color: '#0a6b56',
      path: '/portal-crm/campanas',
    },
    {
      title: 'Reportes',
      icon: <Assessment />,
      description: 'Estadísticas y reportes',
      color: '#272F50',
      path: '/portal-crm/reportes',
    },
    {
      title: 'Configuración',
      icon: <Settings />,
      description: 'Ajustes del sistema',
      color: '#085946',
      path: '/portal-crm/configuracion',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #085946 0%, #272F50 100%)',
          color: '#ffffff',
          py: 3,
          boxShadow: '0 4px 20px rgba(8, 89, 70, 0.2)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
                Portal CRM
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Panel de administración OírConecta
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ExitToApp />}
              onClick={handleLogout}
              sx={{
                borderColor: '#ffffff',
                color: '#ffffff',
                '&:hover': {
                  borderColor: '#ffffff',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Cerrar Sesión
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Contenido Principal */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h4"
            component="h2"
            sx={{ color: '#272F50', fontWeight: 700, mb: 1 }}
          >
            Portal de Administración
          </Typography>
          <Typography variant="body1" sx={{ color: '#86899C' }}>
            Gestiona todas las operaciones del sistema desde un solo lugar
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                onClick={() => navigate(item.path)}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid rgba(8, 89, 70, 0.1)',
                  borderRadius: 3,
                  boxShadow: '0 2px 8px rgba(8, 89, 70, 0.08)',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 32px rgba(8, 89, 70, 0.2)',
                    borderColor: item.color,
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 70,
                      height: 70,
                      borderRadius: 3,
                      bgcolor: `${item.color}15`,
                      mb: 3,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Box sx={{ color: item.color, fontSize: 36 }}>{item.icon}</Box>
                  </Box>
                  <Typography
                    variant="h5"
                    component="h3"
                    sx={{ color: '#272F50', fontWeight: 700, mb: 1.5 }}
                  >
                    {item.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#86899C',
                      lineHeight: 1.6,
                    }}
                  >
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default PortalCRMPage;
