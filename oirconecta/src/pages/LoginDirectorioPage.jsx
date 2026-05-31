import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { Person, Lock, Visibility, VisibilityOff, Login as LoginIcon, PersonAddAltOutlined } from '@mui/icons-material';
import { directoryApi, setDirectoryToken, getDirectoryToken } from '../services/directoryAccountApi';
import { DIRECTORY_API } from '../config/directoryApi';

function isDirectorySchemaError(raw) {
  if (!raw || typeof raw !== 'string') return false;
  return /directory_accounts|directory_profiles|does not exist|relation.*does not exist|prisma\.directory/i.test(raw);
}

export default function LoginDirectorioPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (getDirectoryToken()) {
      navigate('/portal-profesional', { replace: true });
    }
  }, [navigate]);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.email?.trim() || !formData.password) {
      setError('Por favor, ingresa correo y contraseña');
      setIsLoading(false);
      return;
    }

    const { data, error: err } = await directoryApi.post(
      DIRECTORY_API.login,
      { email: formData.email.trim(), password: formData.password },
      { skipAuth: true }
    );
    setIsLoading(false);

    if (err) {
      setError(isDirectorySchemaError(err) ? '__DIRECTORY_DB__' : err);
      return;
    }
    const token = data?.data?.token;
    if (!token) {
      setError('Respuesta inválida del servidor');
      return;
    }
    setDirectoryToken(token);
    navigate('/portal-profesional', { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Login profesionales | OírConecta</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse 90% 70% at 10% 20%, rgba(13,122,92,0.42) 0%, transparent 55%),' +
          'radial-gradient(ellipse 70% 60% at 90% 80%, rgba(39,47,80,0.55) 0%, transparent 55%),' +
          'linear-gradient(160deg, #063c2c 0%, #085946 35%, #1a2240 70%, #272F50 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: '22px',
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.80)', boxShadow: '0 20px 60px rgba(0,0,0,0.20)' }}>
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#085946' }}>
            Directorio — acceso profesionales
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Entra con el correo y la contraseña de tu cuenta del directorio para completar o actualizar tu ficha pública.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error === '__DIRECTORY_DB__' ? (
                <>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.25 }}>
                    La base de datos aún no tiene las tablas del directorio público (o no están alineadas con el código).
                  </Typography>
                  <Typography variant="body2" component="div" sx={{ lineHeight: 1.65, color: 'rgba(0,0,0,0.78)' }}>
                    En la carpeta <strong>backend</strong>, con <code style={{ fontSize: '0.85em' }}>DATABASE_URL</code> correcto:
                  </Typography>
                  <Box component="ol" sx={{ m: 0, pl: 2.5, mt: 1, mb: 0, '& li': { mb: 0.75 } }}>
                    <Typography component="li" variant="body2" sx={{ lineHeight: 1.6 }}>
                      Prueba primero: <strong>npx prisma migrate deploy</strong>
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ lineHeight: 1.6 }}>
                      Si ves el error <strong>P3005</strong> (base ya con tablas y sin historial de migraciones), en{' '}
                      <strong>desarrollo</strong> suele bastar: <strong>npx prisma db push</strong> y luego{' '}
                      <strong>npm run db:seed</strong> para el usuario demo.
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ lineHeight: 1.6 }}>
                      Reinicia la API y vuelve a intentar el inicio de sesión.
                    </Typography>
                  </Box>
                </>
              ) : (
                error
              )}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Correo"
              type="email"
              margin="normal"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange('email')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange('password')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" aria-label="mostrar contraseña">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
              <Button
                component={RouterLink}
                to="/registro-profesional"
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<PersonAddAltOutlined />}
                sx={{ fontWeight: 700, textTransform: 'none', borderWidth: 2, borderColor: '#085946', color: '#085946' }}
              >
                Registrarme
              </Button>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                sx={{ py: 1.5, bgcolor: '#085946', fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#064a38' } }}
              >
                {isLoading ? 'Ingresando…' : 'Iniciar sesión'}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
    </>
  );
}
