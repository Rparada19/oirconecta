/**
 * Dialog que reemplaza "Agendar/Reservar cita" en perfiles del directorio
 * para profesionales que NO son consultorio propio de OírConecta.
 *
 * Envía POST /api/directory/profiles/:profileId/inquiry — el backend persiste
 * la consulta y envía email al emailPublico del profesional + acuse al
 * paciente.
 */

import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Button, Stack, Typography, Box, Alert, CircularProgress,
} from '@mui/material';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

const API = import.meta.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';
const ACCENT = '#085946';
const NAVY = '#272F50';

export default function ContactoProfesionalDialog({ open, onClose, profileId, profesionalNombre, initialMessage = '' }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', mensaje: initialMessage });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    if (open) setForm((f) => ({ ...f, mensaje: initialMessage || f.mensaje }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialMessage]);

  const reset = () => {
    setForm({ nombre: '', email: '', telefono: '', mensaje: '' });
    setDone(false); setError(null);
  };
  const handleClose = () => { if (!sending) { onClose(); setTimeout(reset, 250); } };

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setSending(true);
    try {
      const r = await fetch(`${API}/api/directory/profiles/${profileId}/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim(),
          mensaje: form.mensaje.trim() || `Quisiera agendar una cita${profesionalNombre ? ` con ${profesionalNombre}` : ''}.`,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.success) throw new Error(j.error || 'No se pudo enviar');
      setDone(true);
    } catch (e2) {
      setError(e2.message || 'Error al enviar la solicitud');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '14px' } }}>
      <DialogTitle sx={{ pb: 0 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ p: 1, borderRadius: '10px', bgcolor: `${ACCENT}15`, display: 'flex' }}>
            <CalendarMonthOutlinedIcon sx={{ color: ACCENT }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '1.15rem' }}>
              Solicitar cita
            </Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: '#64748b' }}>
              {profesionalNombre ? `Con ${profesionalNombre}` : 'Con el profesional'}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {done ? (
          <Alert severity="success" sx={{ borderRadius: '8px' }}>
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>¡Solicitud enviada!</Typography>
            Tus datos llegaron directamente al profesional. Te contactará por correo
            o teléfono lo antes posible.
          </Alert>
        ) : (
          <Box component="form" onSubmit={submit}>
            <Typography sx={{ fontSize: '0.875rem', color: '#475569', mb: 2 }}>
              Deja tus datos y el profesional te contactará para coordinar la cita.
              No agendamos directamente desde esta página.
            </Typography>
            <Stack spacing={2}>
              <TextField label="Nombre completo *" required fullWidth size="small"
                value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              <TextField label="Correo electrónico *" type="email" required fullWidth size="small"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <TextField label="Teléfono *" required fullWidth size="small"
                value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              <TextField label="Mensaje (opcional)" multiline rows={3} fullWidth size="small"
                placeholder="Cuéntale brevemente qué necesitas..."
                value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} />
            </Stack>
            {error && <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>{error}</Alert>}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {done ? (
          <Button onClick={handleClose} variant="contained"
            sx={{ background: ACCENT, borderRadius: '8px', textTransform: 'none', fontWeight: 700,
              '&:hover': { background: '#064a3a' } }}>
            Cerrar
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={sending}>Cancelar</Button>
            <Button onClick={submit} disabled={sending || !form.nombre || !form.email || !form.telefono}
              variant="contained"
              startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendRoundedIcon />}
              sx={{ background: ACCENT, borderRadius: '8px', textTransform: 'none', fontWeight: 700,
                '&:hover': { background: '#064a3a' } }}>
              Enviar solicitud
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
