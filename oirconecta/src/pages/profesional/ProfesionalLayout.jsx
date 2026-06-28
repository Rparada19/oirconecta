import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Avatar,
  Divider,
  IconButton,
  AppBar,
  Toolbar,
  Badge,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  DashboardOutlined,
  PersonOutlined,
  StorefrontOutlined,
  MailOutlined,
  WorkspacePremiumOutlined,
  OpenInNew,
  LogoutOutlined,
  MenuOutlined,
} from '@mui/icons-material';
import { directoryApi, clearDirectoryToken, getDirectoryToken } from '../../services/directoryAccountApi';
import { DIRECTORY_API } from '../../config/directoryApi';
import TrialBadge from '../../components/profesional/TrialBadge';

const SIDEBAR_W = 240;

const NAV_ITEMS = [
  { label: 'Mi panel', icon: <DashboardOutlined />, path: '/portal-profesional' },
  { label: 'Mi perfil', icon: <PersonOutlined />, path: '/portal-profesional/perfil' },
  { label: 'Consultas recibidas', icon: <MailOutlined />, path: '/portal-profesional/consultas', inquiriesBadge: true },
  { label: 'Mi suscripción', icon: <WorkspacePremiumOutlined />, path: '/portal-profesional/suscripcion' },
];

function statusChip(status) {
  const map = {
    PENDING: { label: 'En revisión', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
    APPROVED: { label: 'Aprobado', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
    REJECTED: { label: 'Rechazado', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  };
  const s = map[status] || { label: status || 'Sin estado', color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' };
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{
        bgcolor: s.bg,
        color: s.color,
        fontWeight: 700,
        fontSize: '0.7rem',
        border: `1px solid ${s.color}40`,
      }}
    />
  );
}

export default function ProfesionalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [newInquiries, setNewInquiries] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!getDirectoryToken()) {
      navigate('/login-directorio', { replace: true });
      return;
    }
    directoryApi.get(DIRECTORY_API.me).then(({ data }) => {
      if (data?.data) setProfile(data.data);
    });
    directoryApi.get(DIRECTORY_API.meInquiries).then(({ data }) => {
      const raw = data?.data;
      const inquiries = Array.isArray(raw) ? raw : (raw?.items || []);
      setNewInquiries(inquiries.filter((i) => i.status === 'NEW').length);
    });
  }, [navigate]);

  function handleLogout() {
    clearDirectoryToken();
    navigate('/login-directorio', { replace: true });
  }

  const profileId = profile?.id || profile?.profileId || profile?.slug;
  const nombreMostrado = profile?.nombreConsultorio || profile?.nombre || profile?.email || 'Profesional';
  const iniciales = nombreMostrado.slice(0, 2).toUpperCase();

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo / Brand */}
      <Box sx={{ px: 3, py: 3 }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 800, color: '#6ee7c8', letterSpacing: '-0.5px', mb: 0.25 }}
        >
          OírConecta
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(110,231,200,0.60)', fontWeight: 500 }}>
          Portal Profesional
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(110,231,200,0.15)' }} />

      {/* Profesional info */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: '#085946', color: '#6ee7c8', fontWeight: 700, fontSize: '1rem' }}>
          {iniciales}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            sx={{ color: '#e2f5f0', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {nombreMostrado}
          </Typography>
          {profile && statusChip(profile.status)}
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(110,231,200,0.15)' }} />

      {/* Plan gratuito */}
      <Box sx={{ pt: 1.5 }}>
        <TrialBadge profile={profile} variant="sidebar" />
      </Box>

      {/* Nav */}
      <List sx={{ flex: 1, px: 1, py: 1.5 }}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === '/portal-profesional'
              ? location.pathname === '/portal-profesional'
              : location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                sx={{
                  borderRadius: '10px',
                  px: 2,
                  py: 1,
                  bgcolor: isActive ? 'rgba(110,231,200,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(110,231,200,0.25)' : '1px solid transparent',
                  '&:hover': { bgcolor: 'rgba(110,231,200,0.08)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: isActive ? '#6ee7c8' : 'rgba(255,255,255,0.55)' }}>
                  {item.inquiriesBadge && newInquiries > 0 ? (
                    <Badge badgeContent={newInquiries} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem' } }}>
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#6ee7c8' : 'rgba(255,255,255,0.75)',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        {/* Ver ficha pública */}
        {profileId && (
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component="a"
              href={`/directorio/profesional/${profileId}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                borderRadius: '10px',
                px: 2,
                py: 1,
                '&:hover': { bgcolor: 'rgba(110,231,200,0.08)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255,255,255,0.55)' }}>
                <OpenInNew fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Ver mi ficha pública"
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}
              />
            </ListItemButton>
          </ListItem>
        )}
      </List>

      <Divider sx={{ borderColor: 'rgba(110,231,200,0.15)' }} />

      {/* Cerrar sesión */}
      <Box sx={{ p: 1.5 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: '10px',
            px: 2,
            py: 1,
            '&:hover': { bgcolor: 'rgba(239,68,68,0.10)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: 'rgba(239,68,68,0.75)' }}>
            <LogoutOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Cerrar sesión"
            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(239,68,68,0.75)' }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f0f4f8' }}>
      {/* Sidebar desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: SIDEBAR_W,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_W,
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #041a12 0%, #063c2c 60%, #0d1f3c 100%)',
            border: 'none',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Sidebar mobile */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_W,
            background: 'linear-gradient(180deg, #041a12 0%, #063c2c 60%, #0d1f3c 100%)',
            border: 'none',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            display: { md: 'none' },
            bgcolor: '#041a12',
            borderBottom: '1px solid rgba(110,231,200,0.15)',
          }}
        >
          <Toolbar>
            <IconButton color="inherit" onClick={() => setMobileOpen(true)} edge="start" sx={{ mr: 1 }}>
              <MenuOutlined />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#6ee7c8', flex: 1 }}>
              OírConecta
            </Typography>
            {profile && statusChip(profile.status)}
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
          <Outlet context={{ profile, newInquiries, setNewInquiries }} />
        </Box>
      </Box>
    </Box>
  );
}
