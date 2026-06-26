/**
 * Shell del CRM: sidebar fijo + topbar + Outlet de las páginas.
 *
 * Se monta como layout route para /portal-crm/* — agrega navegación
 * estable, búsqueda global y user menu sin tocar el contenido de cada
 * página. El hero verde de cada página queda dentro del área de contenido.
 */

import React, { useState, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  Box, Drawer, IconButton, AppBar, Toolbar, Typography, InputBase,
  Avatar, Menu, MenuItem, Divider, Tooltip, Badge, useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Dashboard, CalendarToday, People, Campaign,
  Assessment, Settings, ShoppingBag, NotificationsActive,
  Logout, ArrowBack, FlashOn, Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getMenuForRole, MENU_KEYS } from '../../utils/rolePermissions';
import { OC_COLORS } from '../../theme';

const SIDEBAR_W = 244;
const TOPBAR_H = 64;

const NAV_ITEMS = [
  { key: MENU_KEYS.ACCIONES_DIA, label: 'Acciones del día', icon: FlashOn,
    path: '/portal-crm/acciones-dia', section: 'principal' },
  { key: MENU_KEYS.DASHBOARD, label: 'Dashboard', icon: Dashboard,
    path: '/portal-crm/dashboard', section: 'principal' },
  { key: MENU_KEYS.CITAS, label: 'Agenda', icon: CalendarToday,
    path: '/portal-crm/citas', section: 'operativo' },
  { key: MENU_KEYS.LEADS, label: 'Leads', icon: PersonIcon,
    path: '/portal-crm/leads', section: 'operativo' },
  { key: MENU_KEYS.PACIENTES, label: 'Pacientes', icon: People,
    path: '/portal-crm/pacientes', section: 'operativo' },
  { key: MENU_KEYS.CAMPANAS, label: 'Campañas', icon: Campaign,
    path: '/portal-crm/campanas', section: 'marketing' },
  { key: MENU_KEYS.PRODUCTOS, label: 'Productos', icon: ShoppingBag,
    path: '/portal-crm/productos', section: 'marketing' },
  { key: MENU_KEYS.REPORTES, label: 'Reportes', icon: Assessment,
    path: '/portal-crm/reportes', section: 'analitica' },
  { key: MENU_KEYS.CONFIGURACION, label: 'Configuración', icon: Settings,
    path: '/portal-crm/configuracion', section: 'sistema' },
];

const SECTION_LABELS = {
  principal: 'Principal',
  operativo: 'Operativo',
  marketing: 'Marketing',
  analitica: 'Analítica',
  sistema: 'Sistema',
};

function SidebarContent({ allowedKeys, currentPath, onNavigate, onClose }) {
  const sections = useMemo(() => {
    const items = NAV_ITEMS.filter((n) => allowedKeys.includes(n.key));
    return Array.from(new Set(items.map((i) => i.section))).map((s) => ({
      key: s,
      label: SECTION_LABELS[s] || s,
      items: items.filter((i) => i.section === s),
    }));
  }, [allowedKeys]);

  const handleClick = (path) => {
    onNavigate(path);
    if (onClose) onClose();
  };

  return (
    <Box sx={{ width: SIDEBAR_W, height: '100%', display: 'flex', flexDirection: 'column',
      bgcolor: '#fff', borderRight: '1px solid #e5e7eb' }}>
      {/* Brand */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 2,
        borderBottom: '1px solid #f0f2f4', minHeight: TOPBAR_H }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: OC_COLORS.verdeBienestar,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 14 }}>OC</Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: OC_COLORS.navyPrincipal, lineHeight: 1.1 }}>
            OÍR Conecta
          </Typography>
          <Typography sx={{ fontSize: 11, color: OC_COLORS.grisMedio }}>CRM</Typography>
        </Box>
      </Box>

      {/* Nav sections */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5 }}>
        {sections.map((section) => (
          <Box key={section.key} sx={{ mb: 1.5 }}>
            <Typography sx={{ px: 2.5, py: 0.5, fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.06em', color: OC_COLORS.grisClaro, textTransform: 'uppercase' }}>
              {section.label}
            </Typography>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = currentPath === item.path
                || (item.path !== '/portal-crm' && currentPath.startsWith(item.path));
              return (
                <Box
                  key={item.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleClick(item.path)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(item.path); }}
                  sx={{
                    mx: 1, my: 0.25, px: 1.5, py: 1, borderRadius: 1.5,
                    display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                    color: active ? OC_COLORS.verdeBienestar : OC_COLORS.grisOscuro,
                    bgcolor: active ? 'rgba(8,89,70,0.08)' : 'transparent',
                    fontWeight: active ? 600 : 500,
                    position: 'relative',
                    transition: 'background-color 120ms ease',
                    '&:hover': { bgcolor: active ? 'rgba(8,89,70,0.10)' : '#f3f4f6' },
                    '&:before': active ? {
                      content: '""', position: 'absolute', left: -8, top: 8, bottom: 8, width: 3,
                      bgcolor: OC_COLORS.verdeBienestar, borderRadius: 1.5,
                    } : {},
                  }}
                >
                  <Icon sx={{ fontSize: 19 }} />
                  <Typography sx={{ fontSize: 13.5, fontWeight: 'inherit' }}>{item.label}</Typography>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Ir al sitio público */}
      <Box sx={{ borderTop: '1px solid #f0f2f4', p: 1.5 }}>
        <Box
          role="button"
          tabIndex={0}
          onClick={() => handleClick('/')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1,
            borderRadius: 1.5, cursor: 'pointer', color: OC_COLORS.grisMedio,
            '&:hover': { bgcolor: '#f3f4f6' } }}
        >
          <ArrowBack sx={{ fontSize: 17 }} />
          <Typography sx={{ fontSize: 12.5 }}>Sitio público</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function CrmShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery('(max-width:900px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(null);

  const allowedKeys = useMemo(() => getMenuForRole(user?.role), [user?.role]);

  const handleLogout = () => {
    setUserMenu(null);
    logout();
    navigate('/login-crm');
  };

  const userInitials = (user?.nombre || user?.email || '?')
    .split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Helmet>
        <title>CRM · OÍR Conecta</title>
      </Helmet>

      {/* Sidebar — fijo en desktop, drawer en mobile */}
      {isMobile ? (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
        >
          <SidebarContent
            allowedKeys={allowedKeys}
            currentPath={location.pathname}
            onNavigate={navigate}
            onClose={() => setDrawerOpen(false)}
          />
        </Drawer>
      ) : (
        <Box sx={{ width: SIDEBAR_W, flexShrink: 0, position: 'sticky', top: 0,
          height: '100vh', alignSelf: 'flex-start' }}>
          <SidebarContent
            allowedKeys={allowedKeys}
            currentPath={location.pathname}
            onNavigate={navigate}
          />
        </Box>
      )}

      {/* Área principal */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: '#fff',
            color: OC_COLORS.navyPrincipal,
            borderBottom: '1px solid #e5e7eb',
            height: TOPBAR_H,
            justifyContent: 'center',
          }}
        >
          <Toolbar sx={{ minHeight: `${TOPBAR_H}px !important`, gap: 1.5 }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}

            {/* Búsqueda global (placeholder) */}
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              bgcolor: '#f3f4f6', borderRadius: 2, px: 1.5, py: 0.5,
              minWidth: { xs: 0, md: 360 }, flex: { xs: 1, md: 'unset' },
              border: '1px solid transparent',
              transition: 'border-color 120ms ease, background-color 120ms ease',
              '&:focus-within': { borderColor: OC_COLORS.verdeBienestar, bgcolor: '#fff' },
            }}>
              <SearchIcon sx={{ fontSize: 18, color: OC_COLORS.grisMedio }} />
              <InputBase
                placeholder="Buscar paciente, lead, cita…"
                sx={{ flex: 1, fontSize: 13.5 }}
                inputProps={{ 'aria-label': 'Búsqueda global' }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') e.currentTarget.blur();
                }}
              />
              <Box sx={{
                display: { xs: 'none', sm: 'flex' }, alignItems: 'center',
                px: 0.75, py: 0.1, border: '1px solid #d1d5db', borderRadius: 0.75,
                fontSize: 10.5, color: OC_COLORS.grisMedio, fontFamily: 'ui-monospace, monospace',
              }}>⌘ K</Box>
            </Box>

            <Box sx={{ flex: 1 }} />

            {/* Notificaciones */}
            <Tooltip title="Notificaciones">
              <IconButton size="small" sx={{ color: OC_COLORS.grisOscuro }}>
                <Badge variant="dot" color="error" invisible>
                  <NotificationsActive sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Usuario */}
            <Tooltip title={user?.email || ''}>
              <IconButton onClick={(e) => setUserMenu(e.currentTarget)} size="small">
                <Avatar sx={{
                  width: 32, height: 32, fontSize: 12,
                  bgcolor: OC_COLORS.verdeBienestar, color: '#fff', fontWeight: 600,
                }}>
                  {userInitials}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={userMenu}
              open={Boolean(userMenu)}
              onClose={() => setUserMenu(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                  {user?.nombre || 'Usuario'}
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: OC_COLORS.grisMedio }}>
                  {user?.email}
                </Typography>
                <Typography sx={{ fontSize: 10.5, color: OC_COLORS.verdeBienestar,
                  textTransform: 'uppercase', letterSpacing: '0.04em', mt: 0.5, fontWeight: 700 }}>
                  {user?.role}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { setUserMenu(null); navigate('/'); }}>
                Ir al sitio público
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <Logout sx={{ fontSize: 17, mr: 1 }} /> Cerrar sesión
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Contenido de la página activa */}
        <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
