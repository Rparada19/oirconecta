/**
 * Cambio de clave obligatorio al primer login cuando la cuenta nace por
 * captación comercial. Se le pide la clave temporal (que recibió por email)
 * y la nueva. Tras el cambio entra al panel.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, TextField, Button, Alert, IconButton } from '@mui/material';
import { LockResetOutlined, VisibilityOff, Visibility } from '@mui/icons-material';
import { directoryApi, setDirectoryMustChangePassword } from '../../services/directoryAccountApi';

export default function CambiarClavePage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setError('');
    if (next.length < 8) return setError('La nueva clave debe tener mínimo 8 caracteres');
    if (next !== confirm) return setError('La confirmación no coincide');
    if (next === current) return setError('La nueva clave debe ser diferente a la temporal');
    setBusy(true);
    try {
      const { data, error: err } = await directoryApi.post('/api/directory/me/change-password', {
        currentPassword: current,
        newPassword: next,
      });
      if (err || !data?.success) {
        setError(data?.error || err || 'No se pudo actualizar la clave');
        return;
      }
      setDirectoryMustChangePassword(false);
      setOk(true);
      setTimeout(() => navigate('/portal-profesional', { replace: true }), 800);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #272F50 0%, #1f3a6b 50%, #085946 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
    }}>
      <Container maxWidth="xs">
        <Box sx={{
          bgcolor: '#fff', borderRadius: 3, p: { xs: 3, sm: 4 },
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}>
          <Box sx={{ textAlign: 'center', mb: 2.5 }}>
            <Box sx={{
              width: 56, height: 56, mx: 'auto', mb: 1.5, borderRadius: 2,
              background: 'linear-gradient(135deg, #4054B2 0%, #085946 100%)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LockResetOutlined sx={{ fontSize: 28 }} />
            </Box>
            <Typography sx={{ fontSize: 21, fontWeight: 800, color: '#041a12', mb: 0.5 }}>
              Cambia tu clave
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: '#5b6b7a' }}>
              Recibiste una clave temporal por email. Define una nueva para empezar a usar tu cuenta.
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {ok    && <Alert severity="success" sx={{ mb: 2 }}>Clave actualizada — entrando…</Alert>}

          <form onSubmit={submit}>
            <TextField
              label="Clave temporal (la que recibiste)"
              value={current} onChange={(e) => setCurrent(e.target.value)}
              type={show ? 'text' : 'password'}
              fullWidth size="small" sx={{ mb: 1.75 }}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShow((s) => !s)} edge="end" size="small">
                    {show ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              label="Nueva clave"
              value={next} onChange={(e) => setNext(e.target.value)}
              type={show ? 'text' : 'password'}
              fullWidth size="small" sx={{ mb: 1.75 }}
              helperText="Mínimo 8 caracteres. Te recomendamos mezclar letras, números y símbolos."
            />
            <TextField
              label="Confirmar nueva clave"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              type={show ? 'text' : 'password'}
              fullWidth size="small" sx={{ mb: 2.5 }}
            />
            <Button type="submit" fullWidth variant="contained" disabled={busy || !current || !next || !confirm}
              sx={{
                py: 1.25, textTransform: 'none', fontWeight: 800, fontSize: 14, borderRadius: 1.5,
                background: 'linear-gradient(135deg, #4054B2 0%, #085946 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #32449a 0%, #064a38 100%)' },
              }}>
              {busy ? 'Actualizando…' : 'Cambiar clave y entrar'}
            </Button>
          </form>
        </Box>
      </Container>
    </Box>
  );
}
