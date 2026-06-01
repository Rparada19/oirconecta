import React, { useEffect } from 'react';
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
  Avatar,
  Divider,
  Tooltip,
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LogoutIcon from '@mui/icons-material/Logout';
import { getAdminToken, clearAdminToken, getAdminUser } from './adminAuth';

const SIDEBAR_WIDTH = 240;

const SIDEBAR_BG = 'linear-gradient(180deg, #041a12 0%, #063c2c 60%, #0d1f3c 100%)';
const ACCENT = '#6ee7c8';
const NAV_ACTIVE_BG = 'rgba(110,231,200,0.13)';
const NAV_HOVER_BG = 'rgba(110,231,200,0.07)';

const navItems = [
  { label: 'Dashboard', icon: <DashboardOutlinedIcon />, path: '/portal-admin' },
  { label: 'Blog', icon: <ArticleOutlinedIcon />, path: '/portal-admin/blog' },
  { label: 'Profesionales', icon: <PeopleOutlinedIcon />, path: '/portal-admin/profesionales' },
  { label: 'Marketplace', icon: <StorefrontOutlinedIcon />, path: '/portal-admin/marketplace' },
  { label: 'Pedidos', icon: <ReceiptLongOutlinedIcon />, path: '/portal-admin/pedidos' },
  { label: 'Comparador', icon: <CompareArrowsOutlinedIcon />, path: '/portal-admin/comparador' },
  { label: 'Newsletter', icon: <MailOutlineRoundedIcon />, path: '/portal-admin/newsletter' },
  { label: 'Buzón de contacto', icon: <InboxOutlinedIcon />, path: '/portal-admin/contactos' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!getAdminToken()) navigate('/admin-login', { replace: true });
  }, [navigate]);

  const handleLogout = () => {
    clearAdminToken();
    navigate('/admin-login', { replace: true });
  };

  const user = getAdminUser();
  const userName = user?.nombre || user?.name || user?.email || 'Admin';
  const userInitial = userName.charAt(0).toUpperCase();

  const isActive = (path) => {
    if (path === '/portal-admin') return location.pathname === '/portal-admin';
    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f0f4f8' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            background: SIDEBAR_BG,
            border: 'none',
            boxShadow: '4px 0 24px rgba(4,26,18,0.3)',
          },
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            px: 2.5,
            py: 2.5,
            borderBottom: '1px solid rgba(110,231,200,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #085946, #6ee7c8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1rem' }}>O</Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                color: '#fff',
                fontWeight: 800,
                fontSize: '1rem',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              OírConecta
            </Typography>
            <Typography sx={{ color: ACCENT, fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em' }}>
              PORTAL ADMIN
            </Typography>
          </Box>
        </Box>

        {/* Nav items */}
        <Box sx={{ flex: 1, py: 2 }}>
          <List disablePadding>
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <ListItem key={item.path} disablePadding sx={{ px: 1.5, mb: 0.5 }}>
                  <ListItemButton
                    component={RouterLink}
                    to={item.path}
                    sx={{
                      borderRadius: '12px',
                      py: 1,
                      px: 1.5,
                      background: active ? NAV_ACTIVE_BG : 'transparent',
                      border: active ? `1px solid rgba(110,231,200,0.22)` : '1px solid transparent',
                      '&:hover': { background: NAV_HOVER_BG },
                      transition: 'all 0.2s',
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 36,
                        color: active ? ACCENT : 'rgba(255,255,255,0.55)',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: active ? 700 : 500,
                        color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                        letterSpacing: '-0.01em',
                      }}
                    />
                    {active && (
                      <Box
                        sx={{
                          width: 4,
                          height: 20,
                          borderRadius: '2px',
                          background: `linear-gradient(180deg, ${ACCENT}, #085946)`,
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>

          <Divider sx={{ borderColor: 'rgba(110,231,200,0.12)', mx: 2, my: 2 }} />

          {/* External link */}
          <List disablePadding>
            <ListItem disablePadding sx={{ px: 1.5, mb: 0.5 }}>
              <ListItemButton
                component="a"
                href="https://oirconecta.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  borderRadius: '12px',
                  py: 1,
                  px: 1.5,
                  '&:hover': { background: NAV_HOVER_BG },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255,255,255,0.45)' }}>
                  <OpenInNewIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Ir al sitio"
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.5)',
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>

        {/* User footer */}
        <Box
          sx={{
            px: 2,
            py: 2,
            borderTop: '1px solid rgba(110,231,200,0.12)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            <Avatar
              sx={{
                width: 34,
                height: 34,
                background: 'linear-gradient(135deg, #085946, #6ee7c8)',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              {userInitial}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography
                sx={{
                  color: '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {userName}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>
                Administrador
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Cerrar sesión">
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: '10px',
                py: 0.75,
                px: 1.5,
                '&:hover': { background: 'rgba(239,68,68,0.12)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'rgba(239,68,68,0.7)' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Cerrar sesión"
                primaryTypographyProps={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'rgba(239,68,68,0.7)',
                }}
              />
            </ListItemButton>
          </Tooltip>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: '100vh',
          bgcolor: '#f0f4f8',
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
