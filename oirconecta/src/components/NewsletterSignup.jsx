import { useState } from 'react';
import { Box, Button, Stack, TextField, Typography, Alert } from '@mui/material';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import { subscribeNewsletter } from '../services/newsletterService';

/**
 * Formulario de suscripción al boletín. Reutilizable (footer, blog, home).
 * Captura nombre, email, teléfono y ciudad. `source` identifica de dónde vino.
 */
export default function NewsletterSignup({ source = 'web', compact = false, title, subtitle }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', ciudad: '' });
  const [state, setState] = useState('idle'); // idle | loading | done | error
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim()) {
      setError('Nombre y correo son obligatorios.');
      return;
    }
    setState('loading');
    setError('');
    try {
      const res = await subscribeNewsletter({ ...form, source });
      if (res?.data?.success) {
        setState('done');
      } else {
        setError(res?.error || 'No pudimos completar la suscripción.');
        setState('error');
      }
    } catch {
      setError('Error de red. Intenta de nuevo.');
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <Alert
        icon={<MarkEmailReadRoundedIcon />}
        severity="success"
        sx={{ borderRadius: 3, fontWeight: 600 }}
      >
        ¡Listo! Te enviamos un correo de bienvenida. Revisa tu bandeja (y la carpeta de spam por si acaso).
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={submit}>
      {title && (
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
          {title}
        </Typography>
      )}
      {subtitle && (
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {subtitle}
        </Typography>
      )}
      <Stack spacing={1.5} direction={compact ? 'column' : { xs: 'column', sm: 'row' }} sx={{ flexWrap: 'wrap' }}>
        <TextField
          label="Nombre"
          value={form.nombre}
          onChange={set('nombre')}
          size="small"
          required
          sx={{ flex: 1, minWidth: 160, bgcolor: 'background.paper', borderRadius: 1 }}
        />
        <TextField
          label="Correo"
          type="email"
          value={form.email}
          onChange={set('email')}
          size="small"
          required
          sx={{ flex: 1, minWidth: 180, bgcolor: 'background.paper', borderRadius: 1 }}
        />
        <TextField
          label="Teléfono (opcional)"
          value={form.telefono}
          onChange={set('telefono')}
          size="small"
          sx={{ flex: 1, minWidth: 150, bgcolor: 'background.paper', borderRadius: 1 }}
        />
        <TextField
          label="Ciudad (opcional)"
          value={form.ciudad}
          onChange={set('ciudad')}
          size="small"
          sx={{ flex: 1, minWidth: 140, bgcolor: 'background.paper', borderRadius: 1 }}
        />
      </Stack>
      {error && (
        <Typography variant="caption" sx={{ color: 'error.main', mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}
      <Button
        type="submit"
        variant="contained"
        disabled={state === 'loading'}
        sx={{
          mt: 2,
          borderRadius: 999,
          textTransform: 'none',
          fontWeight: 800,
          px: 4,
          py: 1.1,
          bgcolor: 'primary.main',
          '&:hover': { bgcolor: 'primary.dark' },
        }}
      >
        {state === 'loading' ? 'Suscribiendo…' : 'Suscribirme al boletín'}
      </Button>
      <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'text.secondary' }}>
        Recibirás contenido de salud auditiva cada 15 días. Cancela cuando quieras.
      </Typography>
    </Box>
  );
}
