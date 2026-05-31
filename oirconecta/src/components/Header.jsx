import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { styled, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import MenuIcon from '@mui/icons-material/Menu';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { getWhatsAppHref } from '../config/publicSite';
import { PROFESIONES_CATALOGO } from '../utils/profesionFilter';
import { directoryProfesionToSlug } from '../utils/directoryPresentation';

const profesionesDirectorioMenuItems = PROFESIONES_CATALOGO.map((p) => ({
  label: p,
  to: `/directorio/profesion/${directoryProfesionToSlug(p)}`,
}));

const menuConfig = [
  {
    label: 'Nosotros',
    type: 'nosotros',
    items: [
      { label: 'Quiénes somos', to: '/nosotros' },
      { label: 'Qué hacemos', to: '/servicios' },
      { label: 'Visión', to: '/nosotros' },
      { label: 'Misión', to: '/nosotros' },
    ],
  },
  {
    label: 'Audífonos',
    type: 'audifonos',
    items: [
      { label: 'Widex', to: '/audifonos/widex' },
      { label: 'Oticon', to: '/audifonos/oticon' },
      { label: 'Starkey', to: '/audifonos/starkey' },
      { label: 'Resound', to: '/audifonos/resound' },
      { label: 'Signia', to: '/audifonos/signia' },
      { label: 'Rexton', to: '/audifonos/rexton' },
      { label: 'Beltone', to: '/audifonos/beltone' },
      { label: 'Phonak', to: '/audifonos/phonak' },
      { label: 'AudioService', to: '/audifonos/audioservice' },
      { label: 'Bernafon', to: '/audifonos/bernafon' },
      { label: 'Sonic', to: '/audifonos/sonic' },
      { label: 'Hansaton', to: '/audifonos/hansaton' },
      { label: 'Unitron', to: '/audifonos/unitron' },
    ],
  },
  {
    label: 'Implantes',
    type: 'implantes',
    items: [
      { label: 'Cochlear', to: '/implantes/cochlear' },
      { label: 'Advanced Bionics', to: '/implantes/advanced-bionics' },
      { label: 'MED-EL', to: '/implantes/medel' },
    ],
  },
  {
    label: 'Profesionales',
    type: 'profesionales',
    items: [...profesionesDirectorioMenuItems],
  },
  {
    label: 'Blog',
    type: 'blog',
    items: [
      { label: 'Todos los artículos', to: '/blog' },
      { label: 'Guías y educación', to: '/blog?categoria=guias' },
      { label: 'Nuevos lanzamientos', to: '/blog?categoria=lanzamientos' },
      { label: 'Comparativas', to: '/blog?categoria=comparativas' },
      { label: 'Tecnología y novedades', to: '/blog?categoria=tecnologia' },
      { label: 'Casos y testimonios', to: '/blog?categoria=casos' },
      { label: 'Glosario auditivo', to: '/blog?categoria=glosario' },
      { label: 'Mantenimiento y cuidados', to: '/blog?categoria=cuidados' },
    ],
  },
];

const mobileFlatLinks = [
  { label: 'Inicio', to: '/' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Servicios', to: '/servicios' },
  { label: 'Audífonos', to: '/audifonos' },
  { label: 'Implantes', to: '/implantes' },
  ...profesionesDirectorioMenuItems,
  { label: 'Blog', to: '/blog' },
  { label: 'Comparador', to: '/comparador' },
  { label: 'Tienda', to: '/ecommerce' },
];

const CustomMenu = styled(Menu)(() => ({
  '& .MuiPaper-root': {
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(24px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
    color: '#0f1923',
    borderRadius: 8,
    boxShadow: '0 16px 48px rgba(8,89,70,0.16), 0 4px 12px rgba(8,89,70,0.08)',
    minWidth: 240,
    marginTop: 10,
    padding: '8px 0',
    border: '1px solid rgba(255,255,255,0.75)',
  },
  '& .MuiMenuItem-root': {
    color: '#0f1923',
    fontWeight: 500,
    fontSize: '0.9375rem',
    borderRadius: 10,
    margin: '2px 8px',
    padding: '9px 16px',
    minHeight: 40,
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: 'rgba(8,89,70,0.07)',
      color: '#085946',
      paddingLeft: 20,
    },
  },
}));

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [openMenu, setOpenMenu] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenuClick = (event, menuType) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu(menuType);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setOpenMenu(null);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleMenuClose();
    setMobileOpen(false);
  };

  const handleLogoClick = () => {
    setMobileOpen(false);
    if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'auto' }), 0);
    }
  };

  const waHref = getWhatsAppHref();

  const navButtons = menuConfig.map((menu) => (
    <Box key={menu.type} sx={{ position: 'relative' }}>
      <Button
        onClick={(e) => handleMenuClick(e, menu.type)}
        endIcon={<ArrowDropDownIcon sx={{ opacity: 0.65 }} />}
        sx={{
          fontWeight: 600,
          px: 1.75,
          py: 0.75,
          minHeight: 40,
          borderRadius: '10px',
          color: '#0f1923',
          fontSize: '0.9375rem',
          letterSpacing: '-0.005em',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(8,89,70,0.07)',
            color: '#085946',
          },
        }}
      >
        {menu.label}
      </Button>
      <CustomMenu
        open={openMenu === menu.type}
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { zIndex: theme.zIndex.modal + 1 } }}
      >
        {menu.items.map((item) => (
          <MenuItem key={item.to + item.label} onClick={() => handleNavigation(item.to)}>
            {item.label}
          </MenuItem>
        ))}
      </CustomMenu>
    </Box>
  ));

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(28px) saturate(2)',
        WebkitBackdropFilter: 'blur(28px) saturate(2)',
        borderBottom: '1px solid rgba(8,89,70,0.08)',
        boxShadow: '0 1px 24px rgba(8,89,70,0.07)',
        zIndex: theme.zIndex.appBar,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          px: { xs: 2, sm: 3, md: 4 },
          minHeight: { xs: 64, sm: 70 },
          maxWidth: 1440,
          mx: 'auto',
          width: '100%',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }} onClick={handleLogoClick}>
          <img src="/logo-oirconecta.png" alt="OírConecta" style={{ height: 42, display: 'block' }} />
        </Box>

        {isMdUp ? (
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 0.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', rowGap: 0.5 }}>
              {navButtons}
            </Box>

            <DividerFlex />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              <Tooltip title="Escribir por WhatsApp">
                <IconButton
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Abrir WhatsApp"
                  size="medium"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main', bgcolor: 'rgba(8, 89, 70, 0.06)' },
                  }}
                >
                  <ChatOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                onClick={() => navigate('/comparador')}
                startIcon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />}
                sx={{
                  fontWeight: 700,
                  color: '#085946',
                  borderColor: '#085946',
                  borderRadius: '8px',
                  px: 2,
                  fontSize: '0.9rem',
                  '&:hover': { borderColor: '#085946', bgcolor: 'rgba(8,89,70,0.07)' },
                }}
              >
                Comparador IA
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/ecommerce')}
                sx={{
                  fontWeight: 500,
                  color: 'text.secondary',
                  px: 1.5,
                  minWidth: 0,
                  fontSize: '0.9375rem',
                  '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
                }}
              >
                Tienda
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={() => navigate('/ecommerce')}
              sx={{ fontWeight: 700, whiteSpace: 'nowrap', px: 2 }}
            >
              Tienda
            </Button>
            <IconButton
              color="primary"
              aria-label="Abrir menú de navegación"
              onClick={() => setMobileOpen(true)}
              edge="end"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        )}
      </Toolbar>

      <Drawer anchor="right" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 300, pt: 2, pb: 2 }} role="presentation">
          <Typography variant="subtitle2" sx={{ px: 2, pb: 1, color: 'text.secondary', fontWeight: 600 }}>
            Menú
          </Typography>
          <List dense>
            {mobileFlatLinks.map((link) => (
              <ListItemButton key={link.to + link.label} onClick={() => handleNavigation(link.to)}>
                <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItemButton>
            ))}
          </List>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              startIcon={<ChatOutlinedIcon />}
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              component="a"
            >
              WhatsApp
            </Button>
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
};

function DividerFlex() {
  return (
    <Box
      aria-hidden
      sx={{
        width: '1px',
        height: 28,
        bgcolor: 'rgba(8, 89, 70, 0.12)',
        alignSelf: 'center',
        mx: { md: 1.5, lg: 2 },
        flexShrink: 0,
        borderRadius: 1,
        display: { xs: 'none', md: 'block' },
      }}
    />
  );
}

export default Header;
