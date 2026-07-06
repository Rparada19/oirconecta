import { useEffect, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, Tab, Tabs, TextField, Typography, Drawer, IconButton,
  Alert, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { adminFetch } from './adminAuth';
import { exportRowsToExcel, exportRowsToPdf } from '../../utils/adminExport';

const TABS = [
  { label: 'Nuevos', estado: 'NUEVO' },
  { label: 'Respondidos', estado: 'RESPONDIDO' },
  { label: 'Archivados', estado: 'ARCHIVADO' },
];

const ESTADO_COLOR = {
  NUEVO: { bg: 'rgba(109,40,217,0.10)', color: '#6d28d9' },
  RESPONDIDO: { bg: 'rgba(64,84,178,0.12)', color: '#272F50' },
  ARCHIVADO: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
};

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const rowsToExport = (items) => items.map((m) => ({
  Nombre: m.nombre, Email: m.email, Teléfono: m.telefono || '', Asunto: m.asunto || '',
  Mensaje: m.mensaje, Estado: m.estado, 'Email enviado': m.emailSent ? 'Sí' : 'No',
  Recibido: formatDate(m.createdAt),
}));

export default function AdminContactosPage() {
  const [tab, setTab] = useState(0);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await adminFetch('/api/public/admin/contact-messages?limit=500');
    if (err) setError(err);
    else {
      const list = data?.data ?? data;
      setMessages(Array.isArray(list) ? list : []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const messagesArr = Array.isArray(messages) ? messages : [];
  const filtered = messagesArr
    .filter((m) => m.estado === TABS[tab].estado)
    .filter((m) => {
      if (!filter) return true;
      const f = filter.toLowerCase();
      return (m.nombre || '').toLowerCase().includes(f)
        || (m.email || '').toLowerCase().includes(f)
        || (m.mensaje || '').toLowerCase().includes(f)
        || (m.asunto || '').toLowerCase().includes(f);
    });

  const updateEstado = async (id, estado) => {
    setActionLoading(true);
    const { error: err } = await adminFetch(`/api/public/admin/contact-messages/${id}`, {
      method: 'PATCH', body: JSON.stringify({ estado }),
    });
    setActionLoading(false);
    if (!err) {
      setMessages((arr) => arr.map((m) => m.id === id ? { ...m, estado } : m));
      if (selected?.id === id) setSelected((s) => ({ ...s, estado }));
    }
  };

  const counts = TABS.map((t) => messagesArr.filter((m) => m.estado === t.estado).length);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-end' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 600, color: '#6d28d9', letterSpacing: '-0.01em',
          }}>
            Buzón de contacto
          </Typography>
          <Typography sx={{ color: '#6b7280', mt: 0.5 }}>
            Mensajes enviados desde el formulario de contacto del sitio.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined" startIcon={<FileDownloadOutlinedIcon />}
            onClick={() => exportRowsToExcel(rowsToExport(messagesArr), 'buzon-contacto')}
            disabled={!messagesArr.length}
          >Excel</Button>
          <Button
            variant="outlined" startIcon={<FileDownloadOutlinedIcon />}
            onClick={() => exportRowsToPdf(rowsToExport(messagesArr), 'buzon-contacto', 'Buzón de contacto')}
            disabled={!messagesArr.length}
          >PDF</Button>
        </Stack>
      </Stack>

      {/* Stats */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        {TABS.map((t, i) => (
          <Box key={t.estado} sx={{
            flex: 1, p: 2.5, borderRadius: '12px', bgcolor: '#fff',
            border: '1px solid rgba(109,40,217,0.10)', display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: '50%',
              bgcolor: ESTADO_COLOR[t.estado].bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <InboxOutlinedIcon sx={{ color: ESTADO_COLOR[t.estado].color }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#0f1923', lineHeight: 1 }}>
                {counts[i]}
              </Typography>
              <Typography sx={{ fontSize: 13, color: '#6b7280' }}>{t.label}</Typography>
            </Box>
          </Box>
        ))}
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {TABS.map((t, i) => (
          <Tab key={t.estado} label={`${t.label} (${counts[i]})`} />
        ))}
      </Tabs>

      <TextField
        fullWidth size="small" placeholder="Buscar por nombre, correo, asunto o mensaje…"
        value={filter} onChange={(e) => setFilter(e.target.value)}
        sx={{ mb: 2, maxWidth: 480 }}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(109,40,217,0.08)', bgcolor: '#fff' }}>
        {loading ? (
          <Stack alignItems="center" py={6}><CircularProgress size={28} sx={{ color: '#6d28d9' }} /></Stack>
        ) : filtered.length === 0 ? (
          <Stack alignItems="center" py={6} spacing={1}>
            <InboxOutlinedIcon sx={{ fontSize: 36, color: 'rgba(8,89,70,0.30)' }} />
            <Typography sx={{ color: '#6b7280' }}>No hay mensajes en esta categoría.</Typography>
          </Stack>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Remitente</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Asunto</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mensaje</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Recibido</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((m) => (
                <TableRow key={m.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelected(m)}>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: '#0f1923' }}>{m.nombre}</Typography>
                    <Typography sx={{ fontSize: 13, color: '#6b7280' }}>{m.email}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>{m.asunto || '—'}</TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>
                    <Typography sx={{
                      fontSize: 14, color: '#374151',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>{m.mensaje}</Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', color: '#6b7280', fontSize: 13 }}>
                    {formatDate(m.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={m.estado}
                      size="small"
                      sx={{
                        bgcolor: ESTADO_COLOR[m.estado]?.bg, color: ESTADO_COLOR[m.estado]?.color,
                        fontWeight: 700, fontSize: 11,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

      {/* Drawer detalle */}
      <Drawer
        anchor="right" open={Boolean(selected)} onClose={() => setSelected(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 }, p: 3 } }}
      >
        {selected && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography sx={{
                fontFamily: '"Playfair Display", serif', fontWeight: 600, fontSize: 22, color: '#6d28d9',
              }}>
                Mensaje recibido
              </Typography>
              <IconButton onClick={() => setSelected(null)}><CloseIcon /></IconButton>
            </Stack>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#0f1923', mb: 0.5 }}>
                {selected.nombre}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ color: '#6d28d9', mb: 0.5 }}>
                <MailOutlineIcon sx={{ fontSize: 16 }} />
                <Typography sx={{ fontSize: 14 }}>
                  <a href={`mailto:${selected.email}`} style={{ color: '#6d28d9', textDecoration: 'underline' }}>
                    {selected.email}
                  </a>
                </Typography>
              </Stack>
              {selected.telefono && (
                <Stack direction="row" alignItems="center" spacing={1} sx={{ color: '#6d28d9', mb: 0.5 }}>
                  <PhoneOutlinedIcon sx={{ fontSize: 16 }} />
                  <Typography sx={{ fontSize: 14 }}>
                    <a href={`tel:${selected.telefono}`} style={{ color: '#6d28d9', textDecoration: 'underline' }}>
                      {selected.telefono}
                    </a>
                  </Typography>
                </Stack>
              )}
              <Stack direction="row" alignItems="center" spacing={1} sx={{ color: '#6b7280' }}>
                <AccessTimeIcon sx={{ fontSize: 16 }} />
                <Typography sx={{ fontSize: 13 }}>{formatDate(selected.createdAt)}</Typography>
              </Stack>
            </Box>

            {selected.asunto && (
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 0.5 }}>
                  Asunto
                </Typography>
                <Typography sx={{ fontSize: 15, color: '#0f1923', fontWeight: 600 }}>{selected.asunto}</Typography>
              </Box>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1 }}>
                Mensaje
              </Typography>
              <Box sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: 2, border: '1px solid #e5e7eb' }}>
                <Typography sx={{ fontSize: 14, color: '#0f1923', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
                  {selected.mensaje}
                </Typography>
              </Box>
            </Box>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Cambiar estado</InputLabel>
              <Select
                value={selected.estado} label="Cambiar estado"
                onChange={(e) => updateEstado(selected.id, e.target.value)}
                disabled={actionLoading}
              >
                {TABS.map((t) => <MenuItem key={t.estado} value={t.estado}>{t.label.slice(0, -1)}</MenuItem>)}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
              <Button
                fullWidth variant="contained"
                href={`mailto:${selected.email}?subject=Re:%20${encodeURIComponent(selected.asunto || 'Tu consulta a OírConecta')}`}
                sx={{ background: '#085946 !important', color: '#fff !important', fontWeight: 700 }}
              >Responder</Button>
              {selected.telefono && (
                <Button
                  fullWidth variant="outlined"
                  href={`https://wa.me/${selected.telefono.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  sx={{ borderColor: '#25D366', color: '#25D366', fontWeight: 700 }}
                >WhatsApp</Button>
              )}
            </Stack>

            {selected.emailSent === false && selected.emailError && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                El email automático falló al enviar: {selected.emailError}
              </Alert>
            )}

            <Typography sx={{ fontSize: 11, color: '#9ca3af', mt: 3 }}>
              ID: {selected.id}
            </Typography>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}
