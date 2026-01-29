import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import HearingIcon from '@mui/icons-material/Hearing';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';
import { styled } from '@mui/material/styles';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const menuConfig = [
  {
    label: 'Nosotros',
    type: 'nosotros',
    items: [
      { label: 'Quiénes somos', to: '/nosotros' },
      { label: 'Qué hacemos', to: '/servicios' },
      { label: 'Visión', to: '/nosotros' },
      { label: 'Misión', to: '/nosotros' },
    ]
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
    ]
  },
  {
    label: 'Implantes',
    type: 'implantes',
    items: [
      { label: 'Cochlear', to: '/implantes/cochlear' },
      { label: 'Advanced Bionics', to: '/implantes/advanced-bionics' },
      { label: 'MED-EL', to: '/implantes/medel' },
    ]
  },
  {
    label: 'Profesionales',
    type: 'profesionales',
    items: [
      { label: 'Audiólogos', to: '/profesionales/audiologos' },
      { label: 'Otólogos', to: '/profesionales/otologos' },
    ]
  }
];

// Menú personalizado con nueva paleta de colores
const CustomMenu = styled(Menu)(() => ({
  '& .MuiPaper-root': {
    backgroundColor: '#f8fafc',
    color: '#272F50',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(8, 89, 70, 0.18)',
    minWidth: 200,
    marginTop: 10,
    padding: '8px 0',
    border: '1px solid rgba(8, 89, 70, 0.08)',
    transition: 'box-shadow 0.3s, background 0.3s',
  },
  '& .MuiMenuItem-root': {
    color: '#272F50',
    fontWeight: 500,
    fontSize: '1.08rem',
    borderRadius: 8,
    margin: '2px 8px',
    padding: '10px 18px',
    transition: 'background 0.2s, color 0.2s',
      '&:hover': {
        backgroundColor: '#f0f4f3',
        color: '#085946',
      },
  },
}));

const Header = () => {
  const navigate = useNavigate();
  // const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

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
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(8, 89, 70, 0.1)',
        boxShadow: '0 2px 20px rgba(8, 89, 70, 0.1)',
        zIndex: 1000
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        {/* Logo */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 }
          }}
          onClick={handleLogoClick}
        >
          <img
            src="/logo-oirconecta.png"
            alt="OírConecta Logo"
            style={{ height: 48, marginRight: 16 }}
          />
        </Box>

        {/* Menús de navegación */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          {menuConfig.map((menu) => (
            <Box key={menu.type} sx={{ position: 'relative' }}>
              <Button
                onClick={(e) => handleMenuClick(e, menu.type)}
                endIcon={<ArrowDropDownIcon />}
                sx={{ 
                  fontWeight: 500, 
                  mx: 1, 
                  borderRadius: 2,
                  color: '#272F50',
                  '&:hover': {
                    backgroundColor: '#f0f4f3',
                    color: '#085946',
                  }
                }}
              >
                {menu.label}
              </Button>
              
              <CustomMenu
                open={openMenu === menu.type}
                anchorEl={anchorEl}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                style={{ zIndex: 1300 }}
              >
                {menu.items.map((item, index) => (
                  <MenuItem
                    key={index}
                    onClick={() => handleNavigation(item.to)}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </CustomMenu>
            </Box>
          ))}
          
          {/* Botones adicionales - Contacto y Tienda */}
          <Button 
            color="primary" 
            sx={{ 
              fontWeight: 500, 
              mx: 1, 
              borderRadius: 2,
              color: '#272F50',
              '&:hover': {
                backgroundColor: '#f0f4f3',
                color: '#085946',
              }
            }}
            onClick={() => navigate('/contacto')}
          >
            Contacto
          </Button>
          
          <Button 
            variant="contained"
            startIcon={<HearingIcon />}
            sx={{ 
              fontWeight: 600, 
              mx: 1, 
              borderRadius: 2,
              bgcolor: '#085946',
              '&:hover': {
                bgcolor: '#272F50',
              }
            }}
            onClick={() => navigate('/ecommerce')}
          >
            Tienda
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;