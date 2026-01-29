import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Avatar,
  Divider,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Article,
  ContactMail,
  Image,
  People,
  Settings,
  Add,
  Edit,
  Upload,
  Analytics,
  ExitToApp,
  Person
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px rgba(8, 89, 70, 0.15)',
  }
}));

const CMSDashboard = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user] = useState({
    name: 'Administrador',
    email: 'admin@oirconecta.com',
    role: 'Super Admin'
  });

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <Dashboard />,
      path: '/cms/dashboard',
      description: 'Vista general del sistema'
    },
    {
      title: 'Contenido',
      icon: <Article />,
      path: '/cms/content',
      description: 'Editar páginas principales'
    },
    {
      title: 'Blog',
      icon: <Article />,
      path: '/cms/blog',
      description: 'Gestionar artículos y noticias'
    },
    {
      title: 'Especialistas',
      icon: <People />,
      path: '/cms/professionals',
      description: 'Administrar base de datos'
    },
    {
      title: 'Multimedia',
      icon: <Image />,
      path: '/cms/media',
      description: 'Imágenes, logos y archivos'
    },
    {
      title: 'Contacto',
      icon: <ContactMail />,
      path: '/cms/contact',
      description: 'Datos de contacto del sitio'
    },
    {
      title: 'Configuración',
      icon: <Settings />,
      path: '/cms/settings',
      description: 'Ajustes del sistema'
    }
  ];

  const stats = [
    { title: 'Páginas', value: '12', color: '#085946' },
    { title: 'Artículos', value: '8', color: '#0d7a5f' },
    { title: 'Especialistas', value: '156', color: '#0a5a47' },
    { title: 'Imágenes', value: '45', color: '#085946' }
  ];

  const handleMenuClick = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('cms_user');
    navigate('/cms/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#085946' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            OirConecta CMS
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              <Person />
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ color: 'white' }}>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {user.role}
              </Typography>
            </Box>
            <IconButton color="inherit" onClick={handleLogout}>
              <ExitToApp />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            backgroundColor: '#085946',
            color: 'white'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item, index) => (
              <ListItem
                key={index}
                button
                onClick={() => handleMenuClick(item.path)}
                sx={{
                  mx: 1,
                  mb: 1,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.title}
                  secondary={item.description}
                  secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, color: '#085946', mb: 2 }}>
              Panel de Control
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Administra todo el contenido de OirConecta desde un solo lugar
            </Typography>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ backgroundColor: stat.color, color: 'white' }}>
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body1">
                      {stat.title}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Quick Actions */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: '#085946' }}>
            Acciones Rápidas
          </Typography>
          
          <Grid container spacing={3}>
            {menuItems.slice(1).map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <StyledCard onClick={() => handleMenuClick(item.path)}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      mb: 2,
                      color: '#085946'
                    }}>
                      {item.icon}
                    </Box>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {item.description}
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      sx={{ borderColor: '#085946', color: '#085946' }}
                    >
                      Administrar
                    </Button>
                  </CardContent>
                </StyledCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default CMSDashboard; 