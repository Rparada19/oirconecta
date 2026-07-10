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
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LogoutIcon from '@mui/icons-material/Logout';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { getAdminToken, clearAdminToken, getAdminUser } from './adminAuth';
import { canAccessAllAdminPages, canUseSalesCrm, ROLES } from '../../utils/rolePermissions';

const SIDEBAR_WIDTH = 250;

// Look editorial: cream, hairlines, tipografía Playfair para logo/titulares.
const SIDEBAR_BG = '#fefdfb';
const SIDEBAR_BORDER = '#eef0f3';
const NAVY = '#0F2A4A';
const ACCENT = '#6d28d9';
const MUTED = '#64748b';
const NAV_ACTIVE_BG = '#faf5ff';
const NAV_HOVER_BG = '#f8fafc';
const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' };

function NavSection({ title, items, isActive }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{
        px: 3, py: 0.75,
        fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em',
        color: MUTED, textTransform: 'uppercase',
      }}>
        {title}
      </Typography>
      <List disablePadding>
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ px: 1.5, mb: 0.25 }}>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                sx={{
                  borderRadius: '10px',
                  py: 0.9, px: 1.5,
                  background: active ? NAV_ACTIVE_BG : 'transparent',
                  position: 'relative',
                  '&:hover': { background: active ? NAV_ACTIVE_BG : NAV_HOVER_BG },
                  transition: 'background 0.15s ease',
                }}
              >
                {active && (
                  <Box sx={{
                    position: 'absolute', left: -6, top: '20%', bottom: '20%',
                    width: 3, borderRadius: '2px', bgcolor: ACCENT,
                  }} />
                )}
                <ListItemIcon sx={{
                  minWidth: 34,
                  color: active ? ACCENT : MUTED,
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? NAVY : '#334155',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

// Items full admin (todo) — solo ADMIN.
const ADMIN_FULL_NAV = [
  { label: 'Dashboard', icon: <DashboardOutlinedIcon />, path: '/portal-admin' },
  { label: 'Blog', icon: <ArticleOutlinedIcon />, path: '/portal-admin/blog' },
  { label: 'Profesionales', icon: <PeopleOutlinedIcon />, path: '/portal-admin/profesionales' },
  { label: 'Marketplace', icon: <StorefrontOutlinedIcon />, path: '/portal-admin/marketplace' },
  { label: 'Pedidos', icon: <ReceiptLongOutlinedIcon />, path: '/portal-admin/pedidos' },
  { label: 'Comparador', icon: <CompareArrowsOutlinedIcon />, path: '/portal-admin/comparador' },
  { label: 'Newsletter', icon: <MailOutlineRoundedIcon />, path: '/portal-admin/newsletter' },
  { label: 'Comunicaciones', icon: <DraftsOutlinedIcon />, path: '/portal-admin/comunicaciones' },
  { label: 'WhatsApp captación', icon: <WhatsAppIcon />, path: '/portal-admin/whatsapp' },
  { label: 'Marketing & Ventas', icon: <CampaignOutlinedIcon />, path: '/portal-admin/marketing' },
  { label: 'Insights del sitio',  icon: <InsightsOutlinedIcon />, path: '/portal-admin/marketing/insights' },
  { label: 'Buzón de contacto', icon: <InboxOutlinedIcon />, path: '/portal-admin/contactos' },
  { label: 'Suscripciones', icon: <WorkspacePremiumOutlinedIcon />, path: '/portal-admin/suscripciones' },
  { label: 'Agente IA', icon: <SmartToyOutlinedIcon />, path: '/portal-admin/ia' },
];

// Items del CRM Sales (captación outbound) — ADMIN + EJECUTIVO_COMERCIAL.
const SALES_NAV = [
  { label: 'Mi día',   icon: <WbSunnyOutlinedIcon />,    path: '/portal-admin/sales' },
  { label: 'Leads',    icon: <PeopleAltOutlinedIcon />,  path: '/portal-admin/sales/leads' },
  { label: 'Reportes', icon: <InsightsOutlinedIcon />,   path: '/portal-admin/sales/reportes' },
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
  const role = user?.role || ROLES.ADMIN;
  const showFullAdmin = canAccessAllAdminPages(role);
  const showSales = canUseSalesCrm(role);

  const isActive = (path) => {
    if (path === '/portal-admin') return location.pathname === '/portal-admin';
    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fafbfc' }}>
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
            borderRight: `1px solid ${SIDEBAR_BORDER}`,
            boxShadow: 'none',
          },
        }}
      >
        {/* Logo */}
        <Box sx={{
          px: 3, py: 2.75,
          borderBottom: `1px solid ${SIDEBAR_BORDER}`,
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '10px',
            background: NAVY, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            ...SERIF, fontSize: '1.15rem', fontWeight: 600,
          }}>
            O
          </Box>
          <Box>
            <Typography sx={{
              ...SERIF, color: NAVY, fontWeight: 600,
              fontSize: '1.05rem', lineHeight: 1.05,
            }}>
              OírConecta
            </Typography>
            <Typography sx={{
              color: MUTED, fontSize: '0.65rem',
              fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', mt: 0.25,
            }}>
              Portal admin
            </Typography>
          </Box>
        </Box>

        {/* Nav items */}
        <Box sx={{ flex: 1, py: 2.25, overflowY: 'auto' }}>
          {showFullAdmin && (
            <NavSection title="Administración" items={ADMIN_FULL_NAV} isActive={isActive} />
          )}
          {showSales && (
            <NavSection title="Captación comercial" items={SALES_NAV} isActive={isActive} />
          )}

          <Divider sx={{ borderColor: SIDEBAR_BORDER, mx: 2, my: 1.5 }} />

          <List disablePadding>
            <ListItem disablePadding sx={{ px: 1.5, mb: 0.25 }}>
              <ListItemButton
                component="a"
                href="https://oirconecta.com"
                target="_blank" rel="noopener noreferrer"
                sx={{
                  borderRadius: '10px', py: 0.9, px: 1.5,
                  '&:hover': { background: NAV_HOVER_BG },
                }}
              >
                <ListItemIcon sx={{ minWidth: 34, color: MUTED }}>
                  <OpenInNewIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Ver sitio público"
                  primaryTypographyProps={{
                    fontSize: '0.85rem', fontWeight: 500, color: MUTED,
                  }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>

        {/* User footer */}
        <Box sx={{
          px: 2, py: 2,
          borderTop: `1px solid ${SIDEBAR_BORDER}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.25 }}>
            <Avatar sx={{
              width: 34, height: 34, bgcolor: NAV_ACTIVE_BG,
              color: ACCENT, fontSize: '0.85rem', fontWeight: 700,
            }}>
              {userInitial}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography sx={{
                color: NAVY, fontSize: '0.82rem', fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {userName}
              </Typography>
              <Typography sx={{ color: MUTED, fontSize: '0.68rem' }}>
                Administrador
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Cerrar sesión">
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: '10px', py: 0.75, px: 1.5,
                '&:hover': { background: '#fef2f2' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: '#b91c1c' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Cerrar sesión"
                primaryTypographyProps={{
                  fontSize: '0.8rem', fontWeight: 600, color: '#b91c1c',
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
          flex: 1, minHeight: '100vh',
          bgcolor: '#fafbfc',
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
