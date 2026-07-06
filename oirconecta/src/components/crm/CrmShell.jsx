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
  EventRepeat as EventRepeatIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { getMenuForRole, MENU_KEYS } from '../../utils/rolePermissions';
import { OC_COLORS } from '../../theme';

const SIDEBAR_W = 250;
const TOPBAR_H = 64;

// Look editorial (mismo lenguaje que AdminLayout y ficha profesional V2).
const CRM_SIDEBAR_BG = '#fefdfb';
const CRM_SIDEBAR_BORDER = '#eef0f3';
const CRM_NAVY = '#0F2A4A';
const CRM_ACCENT = '#6d28d9';
const CRM_MUTED = '#64748b';
const CRM_NAV_ACTIVE_BG = '#faf5ff';
const CRM_NAV_HOVER_BG = '#f8fafc';
const CRM_SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' };

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
  { key: MENU_KEYS.CONTROLES, label: 'Controles', icon: EventRepeatIcon,
    path: '/portal-crm/controles', section: 'operativo' },
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
      bgcolor: CRM_SIDEBAR_BG, borderRight: `1px solid ${CRM_SIDEBAR_BORDER}` }}>
      {/* Brand — editorial */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 2.75,
        borderBottom: `1px solid ${CRM_SIDEBAR_BORDER}`, minHeight: TOPBAR_H }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: CRM_NAVY,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, ...CRM_SERIF, fontSize: '1.15rem', fontWeight: 600 }}>
          O
        </Box>
        <Box>
          <Typography sx={{ ...CRM_SERIF, fontSize: '1.05rem', fontWeight: 600,
            color: CRM_NAVY, lineHeight: 1.05 }}>
            OírConecta
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: CRM_MUTED, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase', mt: 0.25 }}>
            CRM
          </Typography>
        </Box>
      </Box>

      {/* Nav sections */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 2.25 }}>
        {sections.map((section) => (
          <Box key={section.key} sx={{ mb: 2 }}>
            <Typography sx={{ px: 3, py: 0.75, fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.14em', color: CRM_MUTED, textTransform: 'uppercase' }}>
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
                    mx: 1.5, my: 0.25, px: 1.5, py: 0.9, borderRadius: '10px',
                    display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                    color: active ? CRM_NAVY : '#334155',
                    bgcolor: active ? CRM_NAV_ACTIVE_BG : 'transparent',
                    fontWeight: active ? 700 : 500,
                    position: 'relative',
                    transition: 'background-color 150ms ease',
                    '&:hover': { bgcolor: active ? CRM_NAV_ACTIVE_BG : CRM_NAV_HOVER_BG },
                    '&:before': active ? {
                      content: '""', position: 'absolute', left: -6, top: '20%', bottom: '20%',
                      width: 3, bgcolor: CRM_ACCENT, borderRadius: '2px',
                    } : {},
                  }}
                >
                  <Icon sx={{ fontSize: 20, color: active ? CRM_ACCENT : CRM_MUTED }} />
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 'inherit' }}>{item.label}</Typography>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Ir al sitio público */}
      <Box sx={{ borderTop: `1px solid ${CRM_SIDEBAR_BORDER}`, p: 1.5 }}>
        <Box
          role="button"
          tabIndex={0}
          onClick={() => handleClick('/')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 0.9,
            borderRadius: '10px', cursor: 'pointer', color: CRM_MUTED,
            '&:hover': { bgcolor: CRM_NAV_HOVER_BG } }}
        >
          <ArrowBack sx={{ fontSize: 17 }} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>Sitio público</Typography>
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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fafbfc' }}>
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
            color: CRM_NAVY,
            borderBottom: `1px solid ${CRM_SIDEBAR_BORDER}`,
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
              bgcolor: '#f8fafc', borderRadius: '10px', px: 1.5, py: 0.5,
              minWidth: { xs: 0, md: 360 }, flex: { xs: 1, md: 'unset' },
              border: '1px solid transparent',
              transition: 'border-color 150ms ease, background-color 150ms ease',
              '&:focus-within': { borderColor: CRM_ACCENT, bgcolor: '#fff' },
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
                  bgcolor: CRM_NAV_ACTIVE_BG, color: CRM_ACCENT, fontWeight: 700,
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
                <Typography sx={{ fontSize: 10.5, color: CRM_ACCENT,
                  textTransform: 'uppercase', letterSpacing: '0.14em', mt: 0.5, fontWeight: 700 }}>
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
