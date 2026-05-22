import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  IconButton, TextField, Grid, Divider, Alert, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';

const formatPrice = (p) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p || 0);

const EMPTY_FORM = {
  nombre: '', email: '', telefono: '', documento: '',
  direccion: '', ciudad: '', departamento: '', notas: '',
};

export default function ShopCartDialog({ open, onClose, cart, setCart }) {
  const [step, setStep] = useState('cart'); // cart | form | done
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const subtotal = cart.reduce((s, it) => s + it.precio * it.cantidad, 0);

  const setQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, cantidad: it.cantidad + delta } : it))
        .filter((it) => it.cantidad > 0),
    );
  };
  const removeItem = (id) => setCart((prev) => prev.filter((it) => it.id !== id));
  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleClose = () => {
    onClose();
    // Reset tras cerrar (si terminó, limpiar carrito)
    setTimeout(() => {
      if (step === 'done') { setCart([]); setForm(EMPTY_FORM); }
      setStep('cart'); setError(null); setResult(null);
    }, 200);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim()) {
      setError('Nombre, email y teléfono son obligatorios.'); return;
    }
    if (!form.direccion.trim() || !form.ciudad.trim()) {
      setError('Dirección y ciudad de envío son obligatorias.'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/shop/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((it) => ({ productId: it.id, cantidad: it.cantidad })),
          contacto: {
            nombre: form.nombre.trim(), email: form.email.trim(),
            telefono: form.telefono.trim(), documento: form.documento.trim() || null,
          },
          envio: {
            direccion: form.direccion.trim(), ciudad: form.ciudad.trim(),
            departamento: form.departamento.trim() || null, notas: form.notas.trim() || null,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json?.error || 'No se pudo crear el pedido.');
      } else {
        setResult(json.data);
        // Iniciar pago. Si la pasarela devuelve redirectUrl, redirigir.
        try {
          const payRes = await fetch(`${getApiBaseUrl()}/api/shop/orders/${json.data.id}/pay`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
          });
          const payJson = await payRes.json();
          if (payJson?.data?.redirectUrl) {
            window.location.href = payJson.data.redirectUrl;
            return;
          }
        } catch { /* sin pasarela: el pedido queda pendiente de pago */ }
        setStep('done');
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {step === 'cart' && 'Tu carrito'}
        {step === 'form' && 'Datos de contacto y envío'}
        {step === 'done' && 'Pedido recibido'}
      </DialogTitle>
      <DialogContent>
        {step === 'cart' && (
          cart.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>Tu carrito está vacío.</Typography>
          ) : (
            <Box>
              {cart.map((it) => (
                <Box key={it.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.2, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{it.nombre}</Typography>
                    <Typography variant="body2" color="text.secondary">{formatPrice(it.precio)} c/u</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setQty(it.id, -1)}><RemoveIcon fontSize="small" /></IconButton>
                  <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{it.cantidad}</Typography>
                  <IconButton size="small" onClick={() => setQty(it.id, +1)} disabled={it.stock != null && it.cantidad >= it.stock}><AddIcon fontSize="small" /></IconButton>
                  <Typography sx={{ minWidth: 90, textAlign: 'right', fontWeight: 700 }}>{formatPrice(it.precio * it.cantidad)}</Typography>
                  <IconButton size="small" onClick={() => removeItem(it.id)} sx={{ color: '#ef4444' }}><DeleteOutlineIcon fontSize="small" /></IconButton>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>Subtotal</Typography>
                <Typography sx={{ fontWeight: 800, color: '#085946' }}>{formatPrice(subtotal)}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">El costo de envío se coordina al confirmar el pedido.</Typography>
            </Box>
          )
        )}

        {step === 'form' && (
          <Box>
            {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>{error}</Alert>}
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6}><TextField label="Nombre completo" value={form.nombre} onChange={setField('nombre')} fullWidth size="small" required /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Teléfono" value={form.telefono} onChange={setField('telefono')} fullWidth size="small" required /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Email" type="email" value={form.email} onChange={setField('email')} fullWidth size="small" required /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Documento (opcional)" value={form.documento} onChange={setField('documento')} fullWidth size="small" /></Grid>
              <Grid item xs={12}><TextField label="Dirección de envío" value={form.direccion} onChange={setField('direccion')} fullWidth size="small" required /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Ciudad" value={form.ciudad} onChange={setField('ciudad')} fullWidth size="small" required /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Departamento" value={form.departamento} onChange={setField('departamento')} fullWidth size="small" /></Grid>
              <Grid item xs={12}><TextField label="Notas (opcional)" value={form.notas} onChange={setField('notas')} fullWidth size="small" multiline rows={2} /></Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 700 }}>Total</Typography>
              <Typography sx={{ fontWeight: 800, color: '#085946' }}>{formatPrice(subtotal)}</Typography>
            </Box>
          </Box>
        )}

        {step === 'done' && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 56, color: '#085946', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>¡Gracias por tu pedido!</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Tu pedido <strong>#{result?.numero}</strong> fue registrado. Te contactaremos para coordinar el pago y la entrega.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2, gap: 1 }}>
        {step === 'cart' && (
          <>
            <Button onClick={handleClose} sx={{ borderRadius: '10px' }}>Seguir comprando</Button>
            <Button variant="contained" disabled={cart.length === 0} onClick={() => setStep('form')}
              sx={{ borderRadius: '10px', fontWeight: 700, background: '#085946', '&:hover': { background: '#064a3a' } }}>
              Continuar
            </Button>
          </>
        )}
        {step === 'form' && (
          <>
            <Button onClick={() => setStep('cart')} sx={{ borderRadius: '10px' }}>Atrás</Button>
            <Button variant="contained" disabled={submitting} onClick={handleSubmit}
              sx={{ borderRadius: '10px', fontWeight: 700, background: '#085946', '&:hover': { background: '#064a3a' } }}>
              {submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Confirmar pedido'}
            </Button>
          </>
        )}
        {step === 'done' && (
          <Button variant="contained" onClick={handleClose}
            sx={{ borderRadius: '10px', fontWeight: 700, background: '#085946', '&:hover': { background: '#064a3a' } }}>
            Cerrar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
