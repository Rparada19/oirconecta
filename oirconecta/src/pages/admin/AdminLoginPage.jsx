import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert, InputAdornment, IconButton, CircularProgress } from '@mui/material';
import { Visibility, VisibilityOff, AdminPanelSettings } from '@mui/icons-material';
import { ADMIN_TOKEN_KEY } from './adminAuth';

const API = import.meta.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (localStorage.getItem(ADMIN_TOKEN_KEY)) navigate('/portal-admin', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.data?.token) {
        setError(data?.error || 'Credenciales incorrectas');
        return;
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, data.data.token);
      localStorage.setItem('oirconecta_admin_user', JSON.stringify(data.data.user));
      navigate('/portal-admin', { replace: true });
    } catch {
      setError('No se pudo conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 70% at 20% 30%, rgba(8,89,70,0.45) 0%, transparent 55%),' +
        'radial-gradient(ellipse 60% 60% at 80% 70%, rgba(39,47,80,0.50) 0%, transparent 55%),' +
        'linear-gradient(160deg, #041a12 0%, #063c2c 40%, #0d1f3c 100%)',
    }}>
      {/* Grain */}
      <Box sx={{ position: 'fixed', inset: 0, opacity: 0.35, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />

      <Box component="form" onSubmit={handleSubmit} sx={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, mx: 2,
        background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.14)', borderRadius: '28px',
        p: { xs: 4, sm: 5 }, boxShadow: '0 32px 80px rgba(0,0,0,0.40)',
      }}>
        {/* Icon */}
        <Box sx={{ width: 64, height: 64, borderRadius: '18px', mx: 'auto', mb: 3,
          background: 'linear-gradient(135deg, #085946, #0d7a5f)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 30px rgba(8,89,70,0.45)' }}>
          <AdminPanelSettings sx={{ color: '#fff', fontSize: 34 }} />
        </Box>

        <Typography sx={{ fontWeight: 900, fontSize: '1.75rem', color: '#fff',
          textAlign: 'center', letterSpacing: '-0.03em', mb: 0.5 }}>
          Portal Admin
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.55)', textAlign: 'center',
          fontSize: '0.9rem', mb: 4 }}>
          OírConecta — Administración del sitio
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError('')}
            sx={{ mb: 3, borderRadius: '12px', bgcolor: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.30)', color: '#fca5a5',
              '& .MuiAlert-icon': { color: '#f87171' } }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Correo electrónico" type="email" value={email} required fullWidth
            onChange={(e) => setEmail(e.target.value)}
            sx={fieldSx}
          />
          <TextField
            label="Contraseña" type={showPwd ? 'text' : 'password'} value={password} required fullWidth
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPwd(!showPwd)} edge="end"
                    sx={{ color: 'rgba(255,255,255,0.50)' }}>
                    {showPwd ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
          />
        </Box>

        <Button type="submit" fullWidth variant="contained" disabled={loading}
          sx={{ mt: 3.5, py: 1.6, borderRadius: '14px', fontWeight: 800, fontSize: '1rem',
            background: 'linear-gradient(135deg, #0d7a5c, #085946)',
            boxShadow: '0 8px 24px rgba(8,89,70,0.45)',
            '&:hover': { boxShadow: '0 12px 32px rgba(8,89,70,0.55)' } }}>
          {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Entrar al panel'}
        </Button>

        <Typography sx={{ textAlign: 'center', mt: 3.5, fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.30)' }}>
          Sistema de administración · OírConecta
        </Typography>
      </Box>
    </Box>
  );
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    bgcolor: 'rgba(255,255,255,0.07)',
    color: '#fff',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.35)' },
    '&.Mui-focused fieldset': { borderColor: '#6ee7c8' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.50)' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#6ee7c8' },
};
