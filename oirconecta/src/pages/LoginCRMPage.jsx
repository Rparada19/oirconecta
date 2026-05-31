import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress,
} from '@mui/material';
import {
  Person, Lock, Visibility, VisibilityOff, Login as LoginIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const LoginCRMPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    navigate('/portal-crm', { replace: true });
  }, [isAuthenticated, user, navigate]);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData((p) => ({ ...p, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (!formData.email?.trim() || !formData.password) {
      setError('Por favor, ingresa email y contraseña');
      setIsLoading(false);
      return;
    }
    const result = await login(formData.email.trim(), formData.password);
    setIsLoading(false);
    if (result.success) navigate('/portal-crm');
    else setError(result.error || 'Error al iniciar sesión');
  };

  return (
    <>
      <Helmet>
        <title>Login CRM | OírConecta</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(ellipse at 20% 40%, rgba(13,122,92,0.45) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 80% 70%, rgba(39,47,80,0.50) 0%, transparent 55%),' +
          'linear-gradient(145deg, #064a3a 0%, #085946 40%, #272F50 100%)',
      }}
    >
      {/* Decorative circles */}
      {[
        { size: 480, top: '-15%', right: '-10%', opacity: 0.07 },
        { size: 320, bottom: '-10%', left: '-8%',  opacity: 0.06 },
        { size: 180, top: '30%',   left: '5%',    opacity: 0.05 },
      ].map((c, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width:  c.size,
            height: c.size,
            borderRadius: '50%',
            border: `1.5px solid rgba(255,255,255,${c.opacity + 0.06})`,
            ...(c.top    ? { top:    c.top }    : {}),
            ...(c.bottom ? { bottom: c.bottom } : {}),
            ...(c.left   ? { left:   c.left }   : {}),
            ...(c.right  ? { right:  c.right }  : {}),
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Card */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 440,
          mx: 2,
          borderRadius: '28px',
          background: 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(32px) saturate(2)',
          WebkitBackdropFilter: 'blur(32px) saturate(2)',
          border: '1px solid rgba(255,255,255,0.75)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.28), 0 8px 24px rgba(0,0,0,0.12)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent bar */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #0d7a5c 0%, #085946 50%, #272F50 100%)',
            borderRadius: '28px 28px 0 0',
          }}
        />

        <Box sx={{ p: { xs: 4, sm: 5 }, pt: { xs: 5, sm: 5.5 } }}>
          {/* Icon + title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 72,
                height: 72,
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #0d7a5c 0%, #085946 60%, #272F50 100%)',
                mb: 2.5,
                boxShadow: '0 8px 28px rgba(8,89,70,0.40)',
              }}
            >
              <LoginIcon sx={{ fontSize: 34, color: '#ffffff' }} />
            </Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, letterSpacing: '-0.03em', color: '#0f1923', mb: 0.75 }}
            >
              Acceso CRM
            </Typography>
            <Typography variant="body2" sx={{ color: '#4a5568' }}>
              Ingresa tus credenciales para continuar
            </Typography>
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Correo electrónico"
              placeholder="admin@oirconecta.com"
              type="email"
              value={formData.email}
              onChange={handleChange('email')}
              required
              autoComplete="email"
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#085946', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              required
              autoComplete="current-password"
              sx={{ mb: 3.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#085946', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((p) => !p)} edge="end" size="small">
                      {showPassword
                        ? <VisibilityOff sx={{ fontSize: 20, color: '#4a5568' }} />
                        : <Visibility    sx={{ fontSize: 20, color: '#4a5568' }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />}
              sx={{ py: 1.5, fontSize: '1rem' }}
            >
              {isLoading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </Button>
          </Box>

          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#4a5568', mt: 3.5 }}>
            Sistema de administración · OírConecta
          </Typography>
        </Box>
      </Box>
    </Box>
    </>
  );
};

export default LoginCRMPage;
