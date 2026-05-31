import React from 'react';
import { Helmet } from 'react-helmet';
import { Box, Container, Typography, Grid, Button, Chip, Avatar } from '@mui/material';
import {
  Dashboard, CalendarToday, People, Settings, Assessment,
  ExitToApp, PersonAdd, Campaign, NotificationsActive, ShoppingBag,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMenuForRole, MENU_KEYS } from '../utils/rolePermissions';

const ROLE_LABELS = {
  ADMIN: 'Administrador',
  VENDEDOR: 'Vendedor',
  AUDIOLOGA: 'Audióloga',
  RECEPCION: 'Recepción',
  SOLO_LECTURA: 'Solo lectura',
  PROFESIONAL_WEB: 'Profesional',
};

const ALL_MENU_ITEMS = [
  {
    key: MENU_KEYS.DASHBOARD,
    title: 'Dashboard',
    icon: <Dashboard sx={{ fontSize: 28 }} />,
    description: 'Vista general y métricas del sistema',
    gradient: 'linear-gradient(135deg, #0d7a5c 0%, #085946 100%)',
    glow: 'rgba(8,89,70,0.35)',
    path: '/portal-crm/dashboard',
  },
  {
    key: MENU_KEYS.ACCIONES_DIA,
    title: 'Acciones del día',
    icon: <NotificationsActive sx={{ fontSize: 28 }} />,
    description: 'Alertas de consumibles, garantías y recordatorios',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    glow: 'rgba(234,88,12,0.30)',
    path: '/portal-crm/acciones-dia',
  },
  {
    key: MENU_KEYS.CITAS,
    title: 'Agenda',
    icon: <CalendarToday sx={{ fontSize: 28 }} />,
    description: 'Gestiona citas y disponibilidad del consultorio',
    gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    glow: 'rgba(2,132,199,0.30)',
    path: '/portal-crm/citas',
  },
  {
    key: MENU_KEYS.LEADS,
    title: 'Leads',
    icon: <PersonAdd sx={{ fontSize: 28 }} />,
    description: 'Prospectos y pipeline de conversión',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
    glow: 'rgba(124,58,237,0.30)',
    path: '/portal-crm/leads',
  },
  {
    key: MENU_KEYS.PACIENTES,
    title: 'Pacientes',
    icon: <People sx={{ fontSize: 28 }} />,
    description: 'Base de datos, historial clínico y seguimiento',
    gradient: 'linear-gradient(135deg, #0d7a5c 0%, #085946 100%)',
    glow: 'rgba(8,89,70,0.30)',
    path: '/portal-crm/pacientes',
  },
  {
    key: MENU_KEYS.CAMPANAS,
    title: 'Campañas',
    icon: <Campaign sx={{ fontSize: 28 }} />,
    description: 'Marketing, promociones y seguimiento de resultados',
    gradient: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
    glow: 'rgba(219,39,119,0.28)',
    path: '/portal-crm/campanas',
  },
  {
    key: MENU_KEYS.REPORTES,
    title: 'Reportes',
    icon: <Assessment sx={{ fontSize: 28 }} />,
    description: 'Estadísticas, exportación PDF y Excel',
    gradient: 'linear-gradient(135deg, #272F50 0%, #1a1f38 100%)',
    glow: 'rgba(39,47,80,0.30)',
    path: '/portal-crm/reportes',
  },
  {
    key: MENU_KEYS.PRODUCTOS,
    title: 'Catálogo',
    icon: <ShoppingBag sx={{ fontSize: 28 }} />,
    description: 'Productos para cotización y facturación',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
    glow: 'rgba(79,70,229,0.28)',
    path: '/portal-crm/productos',
  },
  {
    key: MENU_KEYS.CONFIGURACION,
    title: 'Configuración',
    icon: <Settings sx={{ fontSize: 28 }} />,
    description: 'Ajustes del sistema, usuarios y permisos',
    gradient: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    glow: 'rgba(71,85,105,0.28)',
    path: '/portal-crm/configuracion',
  },
];

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const PortalCRMPage = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => { logout(); navigate('/login-crm'); };

  const role = user?.role || 'RECEPCION';
  const allowedKeys = getMenuForRole(role);
  const menuItems = ALL_MENU_ITEMS.filter((item) => allowedKeys.includes(item.key));

  const initials = (user?.nombre || 'U')
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <>
      <Helmet>
        <title>Portal CRM | OírConecta</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #e8f0ec 0%, #f0f4f2 40%, #edf2f7 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: '-30%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(8,89,70,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'fixed',
          bottom: '-20%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(39,47,80,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
      }}
    >
      {/* ── Top bar ── */}
      <Box
        sx={{
          background: 'rgba(255,255,255,0.70)',
          backdropFilter: 'blur(28px) saturate(2)',
          WebkitBackdropFilter: 'blur(28px) saturate(2)',
          borderBottom: '1px solid rgba(8,89,70,0.09)',
          boxShadow: '0 1px 20px rgba(8,89,70,0.07)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              py: 1.5,
              gap: 2,
            }}
          >
            {/* Logo + role */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0d7a5c 0%, #085946 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(8,89,70,0.30)',
                  flexShrink: 0,
                }}
              >
                <Box sx={{ color: '#fff', fontSize: 18, fontWeight: 800, fontFamily: 'Inter' }}>O</Box>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.0625rem', color: '#0f1923', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                  OírConecta CRM
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#085946', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {ROLE_LABELS[role] || role}
                </Typography>
              </Box>
            </Box>

            {/* User + logout */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f1923', lineHeight: 1.2 }}>
                  {user?.nombre || 'Usuario'}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#4a5568' }}>{user?.email || ''}</Typography>
              </Box>
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  background: 'linear-gradient(135deg, #0d7a5c 0%, #272F50 100%)',
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  border: '2px solid rgba(8,89,70,0.20)',
                  flexShrink: 0,
                }}
              >
                {initials}
              </Avatar>
              <Button
                variant="outlined"
                startIcon={<ExitToApp sx={{ fontSize: 18 }} />}
                onClick={handleLogout}
                size="small"
                sx={{
                  borderColor: 'rgba(8,89,70,0.25)',
                  color: '#085946',
                  borderWidth: '1.5px',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  px: 1.75,
                  py: 0.75,
                  borderRadius: '10px',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: '#085946',
                    bgcolor: 'rgba(8,89,70,0.06)',
                  },
                }}
              >
                Salir
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── Hero ── */}
      <Container maxWidth="lg" sx={{ pt: 5, pb: 3, position: 'relative', zIndex: 1 }}>
        <Box sx={{ mb: 5 }}>
          <Chip
            label={`${GREETING()}, ${user?.nombre?.split(' ')[0] || 'bienvenido'}`}
            sx={{
              background: 'rgba(8,89,70,0.09)',
              color: '#085946',
              fontWeight: 700,
              fontSize: '0.8125rem',
              letterSpacing: '0.02em',
              border: '1px solid rgba(8,89,70,0.18)',
              borderRadius: '8px',
              mb: 2,
              px: 0.5,
            }}
          />
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#0f1923',
              mb: 1,
              lineHeight: 1.1,
            }}
          >
            Panel de{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #0d7a5c 0%, #085946 50%, #272F50 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Control
            </Box>
          </Typography>
          <Typography variant="body1" sx={{ color: '#4a5568', maxWidth: 480 }}>
            Gestiona todas las operaciones del consultorio desde un solo lugar.
          </Typography>
        </Box>

        {/* ── Grid de módulos ── */}
        <Grid container spacing={2.5}>
          {menuItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.key}>
              <Box
                onClick={() => navigate(item.path)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.82)',
                  backdropFilter: 'blur(20px) saturate(1.8)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
                  border: '1px solid rgba(255,255,255,0.72)',
                  boxShadow: '0 2px 12px rgba(8,89,70,0.07), 0 1px 4px rgba(8,89,70,0.04)',
                  p: 3,
                  transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 16px 48px ${item.glow}, 0 4px 12px rgba(0,0,0,0.06)`,
                    border: '1px solid rgba(255,255,255,0.92)',
                    '& .module-icon': {
                      transform: 'scale(1.08)',
                      boxShadow: `0 8px 24px ${item.glow}`,
                    },
                    '& .module-arrow': { opacity: 1, transform: 'translateX(4px)' },
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '80px',
                    height: '80px',
                    borderRadius: '0 20px 0 80px',
                    background: `${item.gradient.replace('135deg', '135deg').split('(')[0]}(135deg, ${item.glow.replace('rgba', 'rgba').replace(')', ', 0.08)').replace(/0\.\d+\)$/, '0.10)')}, transparent)`,
                    opacity: 0.7,
                    pointerEvents: 'none',
                  },
                }}
              >
                {/* Icon */}
                <Box
                  className="module-icon"
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '6px',
                    background: item.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2.5,
                    color: '#ffffff',
                    boxShadow: `0 4px 16px ${item.glow}`,
                    transition: 'all 0.28s cubic-bezier(0.4,0,0.2,1)',
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </Box>

                {/* Text */}
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '1.125rem',
                    color: '#0f1923',
                    letterSpacing: '-0.02em',
                    mb: 0.75,
                    lineHeight: 1.25,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: 1.55 }}>
                  {item.description}
                </Typography>

                {/* Arrow indicator */}
                <Box
                  className="module-arrow"
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    right: 18,
                    opacity: 0,
                    transition: 'all 0.22s ease',
                    fontSize: '1.375rem',
                    color: '#4a5568',
                    fontWeight: 300,
                  }}
                >
                  →
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
    </>
  );
};

export default PortalCRMPage;
