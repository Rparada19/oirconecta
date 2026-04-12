import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import { Send } from '@mui/icons-material';

export default function DirectoryContactSection() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    mensaje: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent('Consulta desde el directorio Oír Conecta');
    const body = encodeURIComponent(
      `Nombre: ${form.nombre}\nEmail: ${form.email}\nTeléfono: ${form.telefono || '—'}\n\nMensaje:\n${form.mensaje}`
    );
    window.location.href = `mailto:info@oirconecta.com?subject=${subject}&body=${body}`;
    setSnackbar({
      open: true,
      message: 'Se abrirá tu correo para enviar el mensaje a info@oirconecta.com.',
    });
    setForm({ nombre: '', email: '', telefono: '', mensaje: '' });
  };

  return (
    <Box component="section" aria-labelledby="directorio-contacto-titulo" sx={{ mt: { xs: 4, md: 5 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          border: '1px solid rgba(8, 89, 70, 0.1)',
          boxShadow: '0 16px 48px rgba(8, 89, 70, 0.07)',
          bgcolor: 'background.paper',
        }}
      >
        <Stack spacing={2} sx={{ mb: 3, textAlign: { xs: 'left', md: 'center' }, maxWidth: 640, mx: { md: 'auto' } }}>
          <Typography
            id="directorio-contacto-titulo"
            variant="h5"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#12221a',
              fontSize: { xs: '1.25rem', md: '1.5rem' },
            }}
          >
            Asesoría para orientar su búsqueda
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65, fontSize: { md: '1.0625rem' } }}>
            Indique ciudad, tipo de consulta o inquietudes generales; el equipo revisará su mensaje y orientará los siguientes pasos.
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.25} sx={{ maxWidth: 560, mx: 'auto' }}>
            <TextField
              required
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange('nombre')}
              autoComplete="name"
              fullWidth
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              required
              type="email"
              label="Correo electrónico"
              name="email"
              value={form.email}
              onChange={handleChange('email')}
              autoComplete="email"
              fullWidth
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Teléfono (opcional)"
              name="telefono"
              value={form.telefono}
              onChange={handleChange('telefono')}
              autoComplete="tel"
              fullWidth
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              required
              label="Mensaje"
              name="mensaje"
              value={form.mensaje}
              onChange={handleChange('mensaje')}
              multiline
              minRows={4}
              placeholder="Ej.: Busco audiólogo en Medellín para adaptación…"
              fullWidth
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              endIcon={<Send />}
              sx={{ mt: 1, py: 1.5, borderRadius: 2, fontWeight: 700, alignSelf: { xs: 'stretch', sm: 'center' }, px: 4 }}
            >
              Enviar mensaje
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ open: false, message: '' })}>
        <Alert severity="success" variant="filled" onClose={() => setSnackbar({ open: false, message: '' })} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
