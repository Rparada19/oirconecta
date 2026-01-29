import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Container
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Business,
  Lock,
  Email
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'white',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(8, 89, 70, 0.15)',
  border: '1px solid rgba(8, 89, 70, 0.1)',
  maxWidth: 400,
  width: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(8, 89, 70, 0.2)',
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  textTransform: 'none',
  fontWeight: 700,
  fontSize: '1.1rem',
  padding: '14px 32px',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
  }
}));

const CMSLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simular validación de login
      if (formData.email === 'admin@oirconecta.com' && formData.password === 'admin123') {
        // Login exitoso
        localStorage.setItem('cms_user', JSON.stringify({
          email: formData.email,
          role: 'admin',
          name: 'Administrador CMS',
          token: 'cms_token_' + Date.now()
        }));
        navigate('/cms/dashboard');
      } else {
        setError('Credenciales incorrectas. Intenta con admin@oirconecta.com / admin123');
      }
    } catch (err) {
      setError('Error al iniciar sesión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #085946 0%, #0d7a5f 50%, #0a5a47 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Container maxWidth="sm">
        <StyledCard>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mb: 2 
              }}>
                <Business sx={{ 
                  fontSize: 48, 
                  color: '#085946', 
                  mr: 2 
                }} />
                <Typography variant="h4" sx={{ 
                  fontWeight: 800, 
                  color: '#085946',
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}>
                  OirConecta CMS
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ 
                color: '#666',
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}>
                Sistema de Administración de Contenido
              </Typography>
            </Box>

            {/* Formulario */}
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                name="email"
                label="Correo Electrónico"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: '#085946' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                name="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#085946' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Botón de Login */}
              <StyledButton
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  backgroundColor: '#085946',
                  '&:hover': {
                    backgroundColor: '#0a5a47',
                  },
                  '&:disabled': {
                    backgroundColor: '#ccc',
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  'Acceder al CMS'
                )}
              </StyledButton>
            </form>

            {/* Información de Demo */}
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              backgroundColor: '#f8f9fa', 
              borderRadius: 2,
              border: '1px solid #e9ecef'
            }}>
              <Typography variant="body2" sx={{ 
                color: '#666', 
                textAlign: 'center',
                fontSize: '0.85rem'
              }}>
                <strong>Credenciales de Demo:</strong><br />
                Email: admin@oirconecta.com<br />
                Contraseña: admin123
              </Typography>
            </Box>
          </CardContent>
        </StyledCard>
      </Container>
    </Box>
  );
};

export default CMSLoginPage; 