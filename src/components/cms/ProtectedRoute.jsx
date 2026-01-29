import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import authService from '../../services/cms/authService';

const ProtectedRoute = ({ children }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar si el usuario está autenticado
        const authenticated = authService.isAuthenticated();
        
        if (!authenticated) {
          // Si no está autenticado, redirigir al login
          navigate('/cms/login');
          return;
        }

        // Verificar si el token ha expirado
        if (authService.isTokenExpired()) {
          // Intentar renovar el token
          const renewal = authService.renewToken();
          if (!renewal.success) {
            // Si no se puede renovar, hacer logout
            authService.logout();
            navigate('/cms/login');
            return;
          }
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/cms/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5'
        }}
      >
        <CircularProgress size={60} sx={{ color: '#085946', mb: 3 }} />
        <Typography variant="h6" color="text.secondary">
          Verificando autenticación...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
};

export default ProtectedRoute; 