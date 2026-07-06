/**
 * Shell del Portal Profesional. Misma plantilla visual que el CRM:
 * sidebar blanco con secciones y barra de acento verde en el item activo,
 * topbar blanca con bottom border, área de contenido con bg #f8fafc.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, IconButton, AppBar, Toolbar, Typography,
  Avatar, Menu, MenuItem, Divider, Tooltip, Badge, useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  DashboardOutlined,
  PersonOutlined,
  StorefrontOutlined,
  MailOutlined,
  WorkspacePremiumOutlined,
  EventOutlined,
  SmartToyOutlined,
  OpenInNew,
  Logout,
  ArrowBack,
} from '@mui/icons-material';
import { directoryApi, clearDirectoryToken, getDirectoryToken, getDirectoryMustChangePassword } from '../../services/directoryAccountApi';
import { DIRECTORY_API } from '../../config/directoryApi';
import { OC_COLORS } from '../../theme';
import TrialBadge from '../../components/profesional/TrialBadge';

const SIDEBAR_W = 244;
const TOPBAR_H = 64;

const NAV_SECTIONS = [
  {
    key: 'principal',
    label: 'Principal',
    items: [
      { label: 'Mi panel', icon: DashboardOutlined, path: '/portal-profesional' },
    ],
  },
  {
    key: 'cuenta',
    label: 'Cuenta',
    items: [
      { label: 'Mi perfil',    icon: PersonOutlined,    path: '/portal-profesional/perfil' },
      { label: 'Mi agenda',    icon: EventOutlined,     path: '/portal-profesional/agenda' },
      { label: 'Agente IA',    icon: SmartToyOutlined,  path: '/portal-profesional/ia' },
      { label: 'Mis servicios',icon: StorefrontOutlined,path: '/portal-profesional/servicios' },
      { label: 'Consultas',    icon: MailOutlined,      path: '/portal-profesional/consultas', inquiriesBadge: true },
    ],
  },
  {
    key: 'planes',
    label: 'Plan',
    items: [
      { label: 'Mi suscripción', icon: WorkspacePremiumOutlined, path: '/portal-profesional/suscripcion' },
    ],
  },
];

function SidebarContent({ profile, newInquiries, currentPath, onNavigate, onLogout, onClose }) {
  const profileId = profile?.id || profile?.profileId || profile?.slug;

  const handleClick = (path) => {
    onNavigate(path);
    if (onClose) onClose();
  };

  return (
    <Box sx={{
      width: SIDEBAR_W, height: '100%', display: 'flex', flexDirection: 'column',
      bgcolor: '#fff', borderRight: '1px solid #e5e7eb',
    }}>
      {/* Brand */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 2,
        borderBottom: '1px solid #f0f2f4', minHeight: TOPBAR_H,
      }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: 1.5,
          background: 'linear-gradient(135deg, #4054B2 0%, #085946 100%)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 14,
          boxShadow: '0 2px 6px rgba(64,84,178,0.25)',
        }}>
          OC
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: OC_COLORS.navyPrincipal, lineHeight: 1.1 }}>
            OÍR Conecta
          </Typography>
          <Typography sx={{ fontSize: 11, color: OC_COLORS.grisMedio }}>
            Portal Profesional
          </Typography>
        </Box>
      </Box>

      {/* Plan badge en variante "light" sobre sidebar blanco */}
      <Box sx={{ px: 2, pt: 1.75, pb: 0.5 }}>
        <TrialBadge profile={profile} variant="card" />
      </Box>

      {/* Nav sections */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5 }}>
        {NAV_SECTIONS.map((section) => (
          <Box key={section.key} sx={{ mb: 1.5 }}>
            <Typography sx={{
              px: 2.5, py: 0.5, fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.06em', color: OC_COLORS.grisClaro, textTransform: 'uppercase',
            }}>
              {section.label}
            </Typography>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = item.path === '/portal-profesional'
                ? currentPath === '/portal-profesional'
                : currentPath.startsWith(item.path);
              return (
                <Box
                  key={item.path}
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
                  {item.inquiriesBadge && newInquiries > 0 ? (
                    <Badge badgeContent={newInquiries} color="error"
                      sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 16, minWidth: 16 } }}>
                      <Icon sx={{ fontSize: 19 }} />
                    </Badge>
                  ) : (
                    <Icon sx={{ fontSize: 19 }} />
                  )}
                  <Typography sx={{ fontSize: 13.5, fontWeight: 'inherit' }}>{item.label}</Typography>
                </Box>
              );
            })}
          </Box>
        ))}

        {/* Ver ficha pública */}
        {profileId && (
          <Box sx={{ mt: 0.5 }}>
            <Typography sx={{
              px: 2.5, py: 0.5, fontSize: 10.5, fontWeight: 700,
              letterSpacing: '0.06em', color: OC_COLORS.grisClaro, textTransform: 'uppercase',
            }}>
              Vista pública
            </Typography>
            <Box
              role="button"
              tabIndex={0}
              onClick={() => window.open(`/directorio/profesional/${profileId}`, '_blank')}
              sx={{
                mx: 1, my: 0.25, px: 1.5, py: 1, borderRadius: 1.5,
                display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                color: OC_COLORS.grisOscuro, fontWeight: 500,
                '&:hover': { bgcolor: '#f3f4f6' },
              }}
            >
              <OpenInNew sx={{ fontSize: 19 }} />
              <Typography sx={{ fontSize: 13.5 }}>Ver mi ficha</Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Footer: sitio público + logout */}
      <Box sx={{ borderTop: '1px solid #f0f2f4', p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Box
          role="button"
          tabIndex={0}
          onClick={() => handleClick('/')}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1,
            borderRadius: 1.5, cursor: 'pointer', color: OC_COLORS.grisMedio,
            '&:hover': { bgcolor: '#f3f4f6' },
          }}
        >
          <ArrowBack sx={{ fontSize: 17 }} />
          <Typography sx={{ fontSize: 12.5 }}>Sitio público</Typography>
        </Box>
        <Box
          role="button"
          tabIndex={0}
          onClick={onLogout}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1,
            borderRadius: 1.5, cursor: 'pointer', color: '#b91c1c',
            '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' },
          }}
        >
          <Logout sx={{ fontSize: 17 }} />
          <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>Cerrar sesión</Typography>
        </Box>
      </Box>
    </Box>
  );
}

function statusChip(status) {
  const map = {
    PENDING:  { label: 'En revisión', color: '#b45309', bg: '#fef3c7' },
    APPROVED: { label: 'Aprobado',    color: '#047857', bg: '#d1fae5' },
    REJECTED: { label: 'Rechazado',   color: '#b91c1c', bg: '#fee2e2' },
  };
  const s = map[status] || { label: status || '—', color: '#6b7280', bg: '#f3f4f6' };
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', px: 1, py: 0.25,
      bgcolor: s.bg, color: s.color, borderRadius: 1,
      fontSize: 10.5, fontWeight: 700, letterSpacing: '0.02em',
    }}>
      {s.label}
    </Box>
  );
}

export default function ProfesionalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:900px)');
  const [profile, setProfile] = useState(null);
  const [newInquiries, setNewInquiries] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(null);

  useEffect(() => {
    if (!getDirectoryToken()) {
      navigate('/login-directorio', { replace: true });
      return;
    }
    if (getDirectoryMustChangePassword()) {
      navigate('/portal-profesional/cambiar-clave', { replace: true });
      return;
    }
    directoryApi.get(DIRECTORY_API.me).then(({ data }) => {
      if (data?.data) {
        setProfile(data.data);
        // Auto-lanzar wizard si completitud < 30% y no lo ha rechazado en esta sesión.
        try {
          const dismissed = sessionStorage.getItem('oirconecta_wizard_dismissed_v1') === '1';
          const compl = Number(data.data.completeness || 0);
          const alreadyIn = window.location.pathname.startsWith('/portal-profesional/wizard');
          if (!dismissed && !alreadyIn && compl > 0 && compl < 30) {
            navigate('/portal-profesional/wizard', { replace: true });
          }
        } catch { /* ignore */ }
      }
    });
    directoryApi.get(DIRECTORY_API.meInquiries).then(({ data }) => {
      const raw = data?.data;
      const inquiries = Array.isArray(raw) ? raw : (raw?.items || []);
      setNewInquiries(inquiries.filter((i) => i.status === 'NEW').length);
    });
  }, [navigate]);

  const handleLogout = () => {
    clearDirectoryToken();
    navigate('/login-directorio', { replace: true });
  };

  const nombreMostrado = profile?.nombreConsultorio || profile?.nombre || profile?.email || 'Profesional';
  const userInitials = nombreMostrado
    .split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
        >
          <SidebarContent
            profile={profile}
            newInquiries={newInquiries}
            currentPath={location.pathname}
            onNavigate={navigate}
            onLogout={handleLogout}
            onClose={() => setDrawerOpen(false)}
          />
        </Drawer>
      ) : (
        <Box sx={{
          width: SIDEBAR_W, flexShrink: 0, position: 'sticky', top: 0,
          height: '100vh', alignSelf: 'flex-start',
        }}>
          <SidebarContent
            profile={profile}
            newInquiries={newInquiries}
            currentPath={location.pathname}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        </Box>
      )}

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar
          position="sticky" elevation={0}
          sx={{
            bgcolor: '#fff', color: OC_COLORS.navyPrincipal,
            borderBottom: '1px solid #e5e7eb',
            height: TOPBAR_H, justifyContent: 'center',
          }}
        >
          <Toolbar sx={{ minHeight: `${TOPBAR_H}px !important`, gap: 1.5 }}>
            {isMobile && (
              <IconButton edge="start" onClick={() => setDrawerOpen(true)}>
                <MenuIcon />
              </IconButton>
            )}

            <Box sx={{ flex: 1 }} />

            {/* Estado del perfil */}
            {profile && statusChip(profile.status)}

            {/* Usuario */}
            <Tooltip title={profile?.email || ''}>
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
                  {nombreMostrado}
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: OC_COLORS.grisMedio }}>
                  {profile?.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { setUserMenu(null); navigate('/portal-profesional/perfil'); }}>
                Editar mi perfil
              </MenuItem>
              <MenuItem onClick={() => { setUserMenu(null); navigate('/'); }}>
                Ir al sitio público
              </MenuItem>
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <Logout sx={{ fontSize: 17, mr: 1 }} /> Cerrar sesión
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3 } }}>
          <Outlet context={{ profile, newInquiries, setNewInquiries }} />
        </Box>
      </Box>
    </Box>
  );
}
