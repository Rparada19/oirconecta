import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, CircularProgress, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem,
} from '@mui/material';
import { adminFetch, getAdminToken } from './adminAuth';

const GLASS_CARD = {
  background: 'rgba(255,255,255,0.90)',
  backdropFilter: 'blur(20px)',
  borderRadius: '22px',
  border: '1px solid rgba(255,255,255,0.6)',
  boxShadow: '0 4px 24px rgba(8,89,70,0.08)',
};
const HEADER_GRADIENT = {
  background: 'linear-gradient(135deg, #085946 0%, #6ee7c8 100%)',
  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
};

const ESTADOS = [
  { value: 'PENDIENTE_PAGO', label: 'Pendiente de pago', color: 'warning' },
  { value: 'PAGADO', label: 'Pagado', color: 'info' },
  { value: 'EN_PREPARACION', label: 'En preparación', color: 'info' },
  { value: 'ENVIADO', label: 'Enviado', color: 'primary' },
  { value: 'ENTREGADO', label: 'Entregado', color: 'success' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'error' },
];
const estadoInfo = (v) => ESTADOS.find((e) => e.value === v) || { label: v || '—', color: 'default' };

const formatPrice = (p) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p || 0);
const formatDate = (d) => (d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function AdminPedidosPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  useEffect(() => {
    if (!getAdminToken()) { navigate('/admin-login', { replace: true }); return; }
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true); setError(null);
    const [o, c] = await Promise.all([
      adminFetch('/api/shop/admin/orders'),
      adminFetch('/api/shop/admin/customers'),
    ]);
    if (!o.ok) setError(o.data?.error || 'No se pudieron cargar los pedidos');
    else setOrders(o.data?.data || []);
    if (c.ok) setCustomers(c.data?.data || []);
    setLoading(false);
  }

  async function changeEstado(order, estado) {
    const { ok, data } = await adminFetch(`/api/shop/admin/orders/${order.id}`, { method: 'PATCH', body: JSON.stringify({ estado }) });
    if (!ok) setSnack({ open: true, msg: `Error: ${data?.error || ''}`, severity: 'error' });
    else { setSnack({ open: true, msg: 'Estado actualizado.', severity: 'success' }); fetchAll(); }
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, ...HEADER_GRADIENT, mb: 0.5 }}>Pedidos y clientes</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Tienda OírConecta — seguimiento de pedidos y recompras</Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}
        sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none' }, '& .Mui-selected': { color: '#085946' }, '& .MuiTabs-indicator': { backgroundColor: '#085946' } }}>
        <Tab label={`Pedidos (${orders.length})`} />
        <Tab label={`Clientes (${customers.length})`} />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

      <Card sx={GLASS_CARD}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#085946' }} /></Box>
          ) : tab === 0 ? (
            orders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}><Typography variant="body2" color="text.secondary">Aún no hay pedidos.</Typography></Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: 'rgba(8,89,70,0.03)' }}>
                      {['#', 'Cliente', 'Items', 'Total', 'Estado', 'Fecha', ''].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', py: 1.8 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orders.map((o) => {
                      const st = estadoInfo(o.estado);
                      return (
                        <TableRow key={o.id} sx={{ '&:hover': { background: 'rgba(8,89,70,0.03)' } }}>
                          <TableCell sx={{ fontWeight: 700 }}>#{o.numero}</TableCell>
                          <TableCell sx={{ fontSize: '0.82rem' }}>
                            {o.customer?.nombre || o.envioNombre}<br />
                            <Typography variant="caption" color="text.secondary">{o.customer?.telefono || o.envioTelefono}</Typography>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.82rem' }}>{(o.items || []).reduce((s, i) => s + i.cantidad, 0)}</TableCell>
                          <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatPrice(o.total)}</TableCell>
                          <TableCell>
                            <Select value={o.estado} size="small" onChange={(e) => changeEstado(o, e.target.value)}
                              sx={{ fontSize: '0.78rem', '& .MuiSelect-select': { py: 0.5 } }}>
                              {ESTADOS.map((e) => <MenuItem key={e.value} value={e.value} sx={{ fontSize: '0.8rem' }}>{e.label}</MenuItem>)}
                            </Select>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{formatDate(o.createdAt)}</TableCell>
                          <TableCell><Button size="small" onClick={() => setDetail(o)} sx={{ color: '#085946' }}>Ver</Button></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          ) : (
            customers.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}><Typography variant="body2" color="text.secondary">Aún no hay clientes.</Typography></Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: 'rgba(8,89,70,0.03)' }}>
                      {['Cliente', 'Contacto', 'Ciudad', 'Pedidos', 'Total gastado', 'Última compra'].map((h) => (
                        <TableCell key={h} sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', py: 1.8 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customers.map((c) => (
                      <TableRow key={c.id} sx={{ '&:hover': { background: 'rgba(8,89,70,0.03)' } }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {c.nombre} {c.esRecompra && <Chip label="Recompra" size="small" color="success" sx={{ ml: 1, fontWeight: 700, fontSize: '0.65rem' }} />}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{c.email}<br />{c.telefono}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{c.ciudad || '—'}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{c.pedidos}</TableCell>
                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatPrice(c.totalGastado)}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{formatDate(c.ultimaCompra)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )
          )}
        </CardContent>
      </Card>

      {/* Detalle de pedido */}
      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Pedido #{detail?.numero}</DialogTitle>
        <DialogContent>
          {detail && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Envío</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {detail.envioNombre} · {detail.envioTelefono} · {detail.envioEmail}<br />
                {detail.envioDireccion}, {detail.envioCiudad}{detail.envioDepartamento ? `, ${detail.envioDepartamento}` : ''}
                {detail.envioNotas ? <><br />Notas: {detail.envioNotas}</> : null}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Items</Typography>
              {(detail.items || []).map((it) => (
                <Box key={it.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2">{it.cantidad}× {it.nombre}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatPrice(it.subtotal)}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1.5, mt: 1, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                <Typography sx={{ fontWeight: 700 }}>Total</Typography>
                <Typography sx={{ fontWeight: 800, color: '#085946' }}>{formatPrice(detail.total)}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setDetail(null)} sx={{ borderRadius: '10px' }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: '12px', fontWeight: 600 }} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
