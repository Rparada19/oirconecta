/**
 * Cotizaciones: todas las propuestas comerciales en un solo lugar.
 *
 * - Incluye las cotizaciones que ya existían (creadas desde la ficha del
 *   paciente) como propuestas de una opción.
 * - El seguimiento comercial vive dentro de cada cotización: contactos,
 *   resultado, etapa y fecha del próximo contacto.
 * - Las propuestas nuevas llevan hasta 3 opciones y generan el PDF de marca.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Container, Grid, Typography, Chip, CircularProgress, Button, Drawer, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip,
  Snackbar, Alert, TextField, MenuItem, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, Autocomplete, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  RequestQuote, Refresh, WhatsApp, Add, Close, PictureAsPdf, Phone, Email, Chat,
  Storefront, EventNote, EmojiEvents, DeleteOutline,
} from '@mui/icons-material';
import PageHeader from '../../components/crm/ui/PageHeader';
import { api } from '../../services/apiClient';
import { getPatients } from '../../services/patientService';
import {
  CATALOGO_COTIZACION, descargarPropuestaPdf, propuestaDesdeApi, LOGOS, PROPUESTA_DEFAULTS,
} from '../../utils/propuestaPdf';

// Formato propio: el espacio duro de Intl se dibuja mal con Gotham.
const cop = (n) => `$ ${Math.round(n || 0).toLocaleString('es-CO')}`;
const fecha = (v) => (v ? new Date(v).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '—');
const fechaHora = (v) => (v ? new Date(v).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
const isoDia = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const ETAPAS = {
  enviada: { label: 'Enviada', color: '#1d4ed8', bg: 'rgba(29,78,216,0.10)' },
  en_prueba: { label: 'En prueba', color: '#7c3aed', bg: 'rgba(124,58,237,0.10)' },
  negociacion: { label: 'Negociación', color: '#b45309', bg: 'rgba(217,119,6,0.14)' },
  ganada: { label: 'Ganada', color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  perdida: { label: 'Perdida', color: '#64748b', bg: 'rgba(100,116,139,0.14)' },
};
const RESULTADOS = ['Interesado', 'Lo está pensando', 'Pidió prueba', 'Objeción de precio', 'Lo consulta con la familia', 'No contesta', 'Otro'];
const CANALES = [
  { v: 'phone', label: 'Llamada', Icon: Phone },
  { v: 'whatsapp', label: 'WhatsApp', Icon: WhatsApp },
  { v: 'email', label: 'Correo', Icon: Email },
  { v: 'in_person', label: 'Visita', Icon: Storefront },
  { v: 'system', label: 'Nota', Icon: Chat },
];

const urgencia = (dias) => {
  if (dias == null) return { label: 'sin contactar', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' };
  if (dias <= 2) return { label: `hace ${dias}d`, color: '#059669', bg: 'rgba(5,150,105,0.12)' };
  if (dias <= 7) return { label: `hace ${dias}d`, color: '#b45309', bg: 'rgba(217,119,6,0.14)' };
  return { label: `hace ${dias}d`, color: '#dc2626', bg: 'rgba(220,38,38,0.12)' };
};

const waLink = (tel, nombre) => {
  const num = String(tel || '').replace(/\D/g, '');
  const e164 = num.length === 10 && num.startsWith('3') ? `57${num}` : num;
  const texto = encodeURIComponent(`Hola ${(nombre || '').split(' ')[0]}, te escribimos de OírConecta. ¿Pudiste revisar con calma la propuesta que te enviamos? Cualquier duda, aquí estamos.`);
  return `https://wa.me/${e164}?text=${texto}`;
};

const TH = { fontWeight: 800, fontSize: '0.75rem', color: '#475569', bgcolor: '#f8fafc', whiteSpace: 'nowrap' };

const Kpi = ({ label, value, hint, color = '#0F2A4A' }) => (
  <Box sx={{ p: 2.5, borderRadius: '16px', bgcolor: '#fff', border: '1px solid #e5e7eb', height: '100%' }}>
    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</Typography>
    <Typography sx={{ fontSize: '1.75rem', fontWeight: 900, color, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{value}</Typography>
    {hint && <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5 }}>{hint}</Typography>}
  </Box>
);

const EtapaChip = ({ etapa }) => {
  const e = ETAPAS[etapa] || ETAPAS.enviada;
  return <Chip size="small" label={e.label} sx={{ fontWeight: 800, color: e.color, bgcolor: e.bg }} />;
};

/* ------------------------------------------------------------------ */
/* Detalle con seguimiento                                              */
/* ------------------------------------------------------------------ */
function DetalleDrawer({ id, onClose, onChanged, notify }) {
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ canal: 'phone', resultado: '', nota: '', proximoContacto: '', etapa: '' });
  const [saving, setSaving] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [ganadora, setGanadora] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data } = await api.get(`/api/crm/cotizaciones/${id}`);
    const d = data?.data || null;
    setP(d);
    setForm({ canal: 'phone', resultado: '', nota: '', proximoContacto: isoDia(d?.proximoContacto), etapa: d?.etapa || '' });
    setGanadora(d?.opciones?.[0]?.id || '');
    setLoading(false);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const guardarSeguimiento = async () => {
    setSaving(true);
    const body = {
      canal: form.canal, resultado: form.resultado || undefined, nota: form.nota || undefined,
      proximoContacto: form.proximoContacto || null,
      etapa: form.etapa && form.etapa !== p.etapa ? form.etapa : undefined,
      opcionGanadaId: form.etapa === 'ganada' ? ganadora : undefined,
    };
    const { data, error } = await api.post(`/api/crm/cotizaciones/${id}/seguimiento`, body);
    setSaving(false);
    if (error) return notify(`No se pudo guardar: ${error}`, 'error');
    setP(data.data);
    setForm((f) => ({ ...f, resultado: '', nota: '', etapa: data.data.etapa }));
    notify('Seguimiento registrado.');
    onChanged();
  };

  const pdf = async () => {
    setPdfBusy(true);
    try {
      const nombre = `Cotizacion_${(p.paciente?.nombre || 'paciente').replace(/\s+/g, '_')}_${p.numero}.pdf`;
      await descargarPropuestaPdf(propuestaDesdeApi(p), LOGOS, nombre);
    } catch {
      notify('No se pudo generar el PDF.', 'error');
    }
    setPdfBusy(false);
  };

  return (
    <Drawer anchor="right" open={Boolean(id)} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 560 } } }}>
      {loading || !p ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em' }}>{p.numero}</Typography>
                <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F2A4A' }}>{p.paciente?.nombre}</Typography>
                <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {p.paciente?.telefono || 'sin teléfono'}{p.paciente?.email ? ` · ${p.paciente.email}` : ''}
                </Typography>
              </Box>
              <IconButton onClick={onClose} aria-label="Cerrar"><Close /></IconButton>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }} alignItems="center">
              <EtapaChip etapa={p.etapa} />
              <Chip size="small" variant="outlined" label={`Creada ${fecha(p.createdAt)} · vence ${fecha(p.venceEl)}`} />
              {p.profesional && <Chip size="small" variant="outlined" label={p.profesional} />}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button variant="contained" startIcon={pdfBusy ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdf />} onClick={pdf} disabled={pdfBusy}
                sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}>Descargar PDF</Button>
              {p.paciente?.telefono && (
                <Button variant="outlined" startIcon={<WhatsApp />} href={waLink(p.paciente.telefono, p.paciente.nombre)} target="_blank" rel="noopener"
                  sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}>WhatsApp</Button>
              )}
            </Stack>
          </Box>

          <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
            <Typography sx={{ fontWeight: 800, mb: 1.5, color: '#0F2A4A' }}>Opciones cotizadas</Typography>
            <Stack spacing={1.25} sx={{ mb: 3 }}>
              {p.opciones.map((o) => (
                <Box key={o.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', p: 1.5, borderRadius: '12px', border: '1px solid #e5e7eb',
                  bgcolor: o.estado === 'CONVERTED' ? 'rgba(5,150,105,0.06)' : '#fff' }}>
                  <Box sx={{ width: 52, height: 52, borderRadius: '10px', bgcolor: '#f1f5fb', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {o.imagen ? <Box component="img" src={o.imagen} alt="" sx={{ maxWidth: 44, maxHeight: 44, objectFit: 'contain' }} /> : <RequestQuote sx={{ color: '#94a3b8' }} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{o.nombre}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {cop(o.valorPorUnidad)} c/u{o.descuento ? ` · −${o.descuento}%` : ''} · {o.cantidad} unidad{o.cantidad > 1 ? 'es' : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontWeight: 800, color: '#0F2A4A', fontSize: '0.92rem' }}>{cop(o.valorTotal)}</Typography>
                    {o.estado === 'CONVERTED' && <Chip size="small" icon={<EmojiEvents sx={{ fontSize: 14 }} />} label="Elegida" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} color="success" />}
                  </Box>
                </Box>
              ))}
            </Stack>

            {!['ganada', 'perdida'].includes(p.etapa) && (
              <Box sx={{ p: 2, borderRadius: '14px', bgcolor: '#f8fafc', border: '1px solid #e5e7eb', mb: 3 }}>
                <Typography sx={{ fontWeight: 800, mb: 1.5, color: '#0F2A4A' }}>Registrar seguimiento</Typography>
                <ToggleButtonGroup size="small" exclusive value={form.canal} onChange={(_, v) => v && setForm({ ...form, canal: v })} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
                  {CANALES.map(({ v, label, Icon }) => (
                    <ToggleButton key={v} value={v} sx={{ textTransform: 'none', fontWeight: 700, gap: 0.5 }}><Icon sx={{ fontSize: 16 }} />{label}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField select fullWidth size="small" label="Resultado" value={form.resultado} onChange={(e) => setForm({ ...form, resultado: e.target.value })}>
                      <MenuItem value="">—</MenuItem>
                      {RESULTADOS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField select fullWidth size="small" label="Etapa" value={form.etapa} onChange={(e) => setForm({ ...form, etapa: e.target.value })}>
                      {Object.entries(ETAPAS).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
                    </TextField>
                  </Grid>
                  {form.etapa === 'ganada' && p.opciones.length > 1 && (
                    <Grid item xs={12}>
                      <TextField select fullWidth size="small" label="Opción que eligió" value={ganadora} onChange={(e) => setGanadora(e.target.value)}>
                        {p.opciones.map((o) => <MenuItem key={o.id} value={o.id}>{o.nombre} · {cop(o.valorTotal)}</MenuItem>)}
                      </TextField>
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <TextField fullWidth size="small" multiline minRows={2} label="Nota" placeholder="Qué dijo, qué quedó pendiente…"
                      value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} />
                  </Grid>
                  {!['ganada', 'perdida'].includes(form.etapa) && (
                    <Grid item xs={12} sm={6}>
                      <TextField fullWidth size="small" type="date" label="Próximo contacto" InputLabelProps={{ shrink: true }}
                        value={form.proximoContacto} onChange={(e) => setForm({ ...form, proximoContacto: e.target.value })} />
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button fullWidth variant="contained" onClick={guardarSeguimiento} disabled={saving}
                      sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}>
                      {saving ? 'Guardando…' : 'Guardar seguimiento'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}

            <Typography sx={{ fontWeight: 800, mb: 1.5, color: '#0F2A4A' }}>Seguimiento comercial</Typography>
            {p.seguimiento.length === 0 ? (
              <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 3 }}>Aún no hay contactos registrados en esta cotización.</Typography>
            ) : (
              <Box sx={{ mb: 3, borderLeft: '2px solid #dbe3f4', pl: 2, ml: 0.75 }}>
                {p.seguimiento.map((s) => (
                  <Box key={s.id} sx={{ mb: 2, position: 'relative' }}>
                    <Box sx={{ position: 'absolute', left: -23, top: 4, width: 10, height: 10, borderRadius: '50%', bgcolor: '#4054B2' }} />
                    <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>{fechaHora(s.fecha)}</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.86rem' }}>{s.titulo}</Typography>
                    {s.nota && <Typography sx={{ fontSize: '0.84rem', color: '#334155', whiteSpace: 'pre-line' }}>{s.nota}</Typography>}
                    {s.etapa && <Box sx={{ mt: 0.5 }}><EtapaChip etapa={s.etapa} /></Box>}
                  </Box>
                ))}
              </Box>
            )}

            {p.otrosContactos?.length > 0 && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography sx={{ fontWeight: 800, mb: 1, color: '#0F2A4A', fontSize: '0.9rem' }}>Otros contactos con el paciente</Typography>
                {p.otrosContactos.map((o) => (
                  <Typography key={o.id} sx={{ fontSize: '0.8rem', color: '#475569', mb: 0.5 }}>
                    {fecha(o.fecha)} · {o.titulo}
                  </Typography>
                ))}
              </>
            )}
            {p.codigoFirma && (
              <Typography sx={{ mt: 3, fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'ui-monospace, monospace' }}>
                Código de firma: {p.codigoFirma}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  );
}

/* ------------------------------------------------------------------ */
/* Nueva propuesta                                                      */
/* ------------------------------------------------------------------ */
const opcionDesdeCatalogo = (k) => {
  const c = CATALOGO_COTIZACION[k];
  return {
    key: `${k}-${Math.random().toString(36).slice(2, 7)}`,
    nombre: c.nombre, linea: c.linea, sub: c.sub, corto: c.corto, etiqueta: c.tag, imagen: c.img,
    valorUnitario: c.precio, descuento: c.dto,
    atributosTxt: c.feats.filter((f) => f.t).map((f) => `${f.t}: ${f.d}`).join('\n'),
    iconos: c.feats.map((f) => f.i),
    marca: k === 'blank' ? '' : 'Widex',
  };
};

function NuevaPropuestaDialog({ open, onClose, onCreated, notify }) {
  const [buscar, setBuscar] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [paciente, setPaciente] = useState(null);
  const [nuevo, setNuevo] = useState({ nombre: '', telefono: '', email: '' });
  const [modoNuevo, setModoNuevo] = useState(false);
  const [profesional, setProfesional] = useState('Dra. Piedad Marín');
  const [cargo, setCargo] = useState('Audióloga');
  const [cantidad, setCantidad] = useState(2);
  const [vigencia, setVigencia] = useState(15);
  const [opciones, setOpciones] = useState([opcionDesdeCatalogo('allure')]);
  const [agregar, setAgregar] = useState('smartric');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(async () => {
      const { patients } = await getPatients({ search: buscar, limit: 20, includeProspectos: true });
      setPacientes(patients);
    }, 250);
    return () => clearTimeout(t);
  }, [buscar, open]);

  const setOp = (i, k, v) => setOpciones((ops) => ops.map((o, j) => (j === i ? { ...o, [k]: v } : o)));

  const crear = async () => {
    let patientId = paciente?.id;
    if (modoNuevo) {
      if (!nuevo.nombre.trim() || !nuevo.telefono.trim()) return notify('Escribe nombre y teléfono del paciente.', 'warning');
      const { data, error } = await api.post('/api/patients', {
        nombre: nuevo.nombre.trim(), telefono: nuevo.telefono.trim(), email: nuevo.email.trim() || undefined,
      });
      if (error || !data?.data?.id) return notify(`No se pudo crear el paciente: ${error || ''}`, 'error');
      patientId = data.data.id;
    }
    if (!patientId) return notify('Elige un paciente.', 'warning');
    setSaving(true);
    const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const body = {
      patientId, profesional, cargo, cantidad, vigenciaDias: vigencia,
      numero: `COT-OC-${hoy}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      garantias: PROPUESTA_DEFAULTS.garantias, plan: PROPUESTA_DEFAULTS.plan, condiciones: PROPUESTA_DEFAULTS.condiciones,
      opciones: opciones.map((o) => ({
        nombre: o.nombre, marca: o.marca || o.nombre.split(' ')[0], tecnologia: o.corto, linea: o.linea, sub: o.sub, corto: o.corto,
        etiqueta: o.etiqueta, imagen: o.imagen, valorUnitario: Number(o.valorUnitario) || 0, descuento: Number(o.descuento) || 0,
        atributos: o.atributosTxt.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 6).map((l, j) => {
          const [t, ...rest] = l.split(':');
          return { i: o.iconos[j] || 'check', t: t.trim(), d: rest.join(':').trim() };
        }),
      })),
    };
    const { data, error } = await api.post('/api/crm/cotizaciones', body);
    setSaving(false);
    if (error) return notify(`No se pudo crear la propuesta: ${error}`, 'error');
    notify('Propuesta creada.');
    onCreated(data.data);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 800 }}>Nueva propuesta</DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontWeight: 800, mb: 1 }}>Paciente</Typography>
        {!modoNuevo ? (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
            <Autocomplete sx={{ flex: 1 }} options={pacientes} value={paciente} onChange={(_, v) => setPaciente(v)}
              getOptionLabel={(o) => `${o.nombre}${o.telefono ? ` · ${o.telefono}` : ''}`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              onInputChange={(_, v) => setBuscar(v)} filterOptions={(x) => x}
              renderInput={(params) => <TextField {...params} size="small" label="Buscar por nombre, teléfono o correo" />} />
            <Button onClick={() => setModoNuevo(true)} sx={{ textTransform: 'none', fontWeight: 700 }}>Paciente nuevo</Button>
          </Stack>
        ) : (
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></Grid>
            <Grid item xs={12} sm={3}><TextField fullWidth size="small" label="Teléfono" value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} /></Grid>
            <Grid item xs={12} sm={3}><TextField fullWidth size="small" label="Correo (opcional)" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} /></Grid>
            <Grid item xs={12} sm={2}><Button fullWidth onClick={() => setModoNuevo(false)} sx={{ textTransform: 'none' }}>Buscar existente</Button></Grid>
          </Grid>
        )}

        <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
          <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Profesional" value={profesional} onChange={(e) => setProfesional(e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth size="small" label="Cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}>
            <TextField select fullWidth size="small" label="Adaptación" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))}>
              <MenuItem value={2}>Binaural (2)</MenuItem><MenuItem value={1}>Monoaural (1)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2}><TextField fullWidth size="small" type="number" label="Vigencia (días)" value={vigencia} onChange={(e) => setVigencia(Number(e.target.value) || 15)} /></Grid>
        </Grid>

        <Typography sx={{ fontWeight: 800, mb: 1 }}>Opciones ({opciones.length}/3)</Typography>
        <Stack spacing={1.5}>
          {opciones.map((o, i) => (
            <Box key={o.key} sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: '12px' }}>
              <Grid container spacing={1.25} alignItems="center">
                <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Producto" value={o.nombre} onChange={(e) => setOp(i, 'nombre', e.target.value)} /></Grid>
                <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Valor unitario" value={o.valorUnitario} onChange={(e) => setOp(i, 'valorUnitario', e.target.value)} /></Grid>
                <Grid item xs={6} sm={2}><TextField fullWidth size="small" type="number" label="Descuento %" value={o.descuento} onChange={(e) => setOp(i, 'descuento', e.target.value)} /></Grid>
                <Grid item xs={9} sm={2}>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>Neto c/u</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.88rem' }}>{cop((Number(o.valorUnitario) || 0) * (1 - (Number(o.descuento) || 0) / 100))}</Typography>
                </Grid>
                <Grid item xs={3} sm={1} sx={{ textAlign: 'right' }}>
                  <Tooltip title="Quitar opción"><span>
                    <IconButton disabled={opciones.length === 1} onClick={() => setOpciones((ops) => ops.filter((_, j) => j !== i))}><DeleteOutline /></IconButton>
                  </span></Tooltip>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" multiline minRows={2} label="Atributos (uno por línea, «Título: descripción»)"
                    value={o.atributosTxt} onChange={(e) => setOp(i, 'atributosTxt', e.target.value)} />
                </Grid>
              </Grid>
            </Box>
          ))}
        </Stack>
        {opciones.length < 3 && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <TextField select size="small" value={agregar} onChange={(e) => setAgregar(e.target.value)} sx={{ minWidth: 220 }}>
              <MenuItem value="allure">Widex Allure 220</MenuItem>
              <MenuItem value="smartric">Widex SmartRIC 220</MenuItem>
              <MenuItem value="moment">Widex Moment 220</MenuItem>
              <MenuItem value="blank">Otro producto</MenuItem>
            </TextField>
            <Button startIcon={<Add />} onClick={() => setOpciones((ops) => [...ops, opcionDesdeCatalogo(agregar)])} sx={{ textTransform: 'none', fontWeight: 700 }}>Agregar opción</Button>
          </Stack>
        )}
        <Typography sx={{ mt: 2, fontSize: '0.78rem', color: '#64748b' }}>
          Garantías, plan audiológico y condiciones van con los valores estándar de OírConecta.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancelar</Button>
        <Button variant="contained" onClick={crear} disabled={saving} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>
          {saving ? 'Creando…' : 'Crear propuesta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
export default function CotizacionesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [verCerradas, setVerCerradas] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [abierta, setAbierta] = useState(null);
  const [nueva, setNueva] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const notify = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

  const load = useCallback(async () => {
    setLoading(true);
    const { data: res } = await api.get(`/api/crm/cotizaciones?incluirCerradas=${verCerradas}`);
    setData(res?.data || null);
    setLoading(false);
  }, [verCerradas]);
  useEffect(() => { load(); }, [load]);

  const items = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    const lista = data?.items || [];
    if (!q) return lista;
    return lista.filter((p) => [p.paciente?.nombre, p.paciente?.telefono, p.numero, ...p.opciones.map((o) => o.nombre)]
      .filter(Boolean).some((t) => t.toLowerCase().includes(q)));
  }, [data, filtro]);

  const hoy = Date.now();

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100%' }}>
      <PageHeader
        title="Cotizaciones"
        subtitle="Propuestas, seguimiento comercial y a quién hay que contactar hoy"
        icon={RequestQuote}
        actions={
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField size="small" placeholder="Buscar paciente o producto" value={filtro} onChange={(e) => setFiltro(e.target.value)} sx={{ minWidth: 220 }} />
            <Button size="small" variant={verCerradas ? 'contained' : 'outlined'} onClick={() => setVerCerradas((v) => !v)}
              sx={{ borderRadius: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>{verCerradas ? 'Viendo todas' : 'Solo abiertas'}</Button>
            <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={load} sx={{ borderRadius: '10px', fontWeight: 700 }}>Actualizar</Button>
            <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setNueva(true)} sx={{ borderRadius: '10px', fontWeight: 700 }}>Nueva propuesta</Button>
          </Box>
        }
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
        ) : !data ? (
          <Typography sx={{ color: '#94a3b8' }}>No se pudieron cargar las cotizaciones.</Typography>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}><Kpi label="En juego" value={cop(data.resumen.enJuego)} color="#059669" hint={`${data.resumen.abiertas} propuesta(s) abiertas`} /></Grid>
              <Grid item xs={12} sm={6} md={3}><Kpi label="Contactar hoy" value={data.resumen.paraHoy} color={data.resumen.paraHoy ? '#4054B2' : '#0F2A4A'} hint="Próximo contacto vencido o para hoy" /></Grid>
              <Grid item xs={12} sm={6} md={3}><Kpi label="Sin contacto reciente" value={data.resumen.sinContactoReciente} color={data.resumen.sinContactoReciente ? '#dc2626' : '#0F2A4A'} hint="Más de 7 días sin hablar con ellos" /></Grid>
              <Grid item xs={12} sm={6} md={3}><Kpi label="Tasa de cierre" value={data.resumen.tasaCierre == null ? '—' : `${data.resumen.tasaCierre}%`} hint="Ganadas sobre cerradas" /></Grid>
            </Grid>

            <Box sx={{ borderRadius: '16px', bgcolor: '#fff', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': TH }}>
                      <TableCell>Paciente</TableCell>
                      <TableCell>Opciones</TableCell>
                      <TableCell align="right">Valor</TableCell>
                      <TableCell>Etapa</TableCell>
                      <TableCell>Creada</TableCell>
                      <TableCell>Último contacto</TableCell>
                      <TableCell>Próximo contacto</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow><TableCell colSpan={8} sx={{ py: 5, textAlign: 'center', color: '#94a3b8' }}>
                        No hay cotizaciones {verCerradas ? 'registradas' : 'abiertas'}. Crea una con «Nueva propuesta».
                      </TableCell></TableRow>
                    ) : items.map((p) => {
                      const u = urgencia(p.diasSinContacto);
                      const vencido = p.proximoContacto && new Date(p.proximoContacto).getTime() <= hoy;
                      return (
                        <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => setAbierta(p.id)}>
                          <TableCell>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.paciente?.nombre || '—'}</Typography>
                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{p.paciente?.telefono || 'sin teléfono'}</Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 280 }}>
                            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                              {p.opciones.map((o) => <Chip key={o.id} size="small" label={o.nombre} variant="outlined" sx={{ fontSize: '0.72rem' }} />)}
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {p.valorMin === p.valorMax ? cop(p.valorMax) : `${cop(p.valorMin)} – ${cop(p.valorMax)}`}
                          </TableCell>
                          <TableCell><EtapaChip etapa={p.etapa} /></TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{fecha(p.createdAt)} · {p.diasAbierta}d</TableCell>
                          <TableCell><Chip size="small" label={u.label} sx={{ fontWeight: 700, color: u.color, bgcolor: u.bg }} /></TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            {p.proximoContacto ? (
                              <Chip size="small" icon={<EventNote sx={{ fontSize: 15 }} />} label={fecha(p.proximoContacto)}
                                sx={{ fontWeight: 700, color: vencido ? '#dc2626' : '#334155', bgcolor: vencido ? 'rgba(220,38,38,0.10)' : '#f1f5f9' }} />
                            ) : <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>—</Typography>}
                          </TableCell>
                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            {p.paciente?.telefono && (
                              <Tooltip title="Escribir por WhatsApp">
                                <IconButton size="small" href={waLink(p.paciente.telefono, p.paciente.nombre)} target="_blank" rel="noopener" sx={{ color: '#16a34a' }}>
                                  <WhatsApp fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Button size="small" onClick={() => setAbierta(p.id)} sx={{ textTransform: 'none', fontWeight: 700 }}>Seguimiento</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}
      </Container>

      <DetalleDrawer id={abierta} onClose={() => setAbierta(null)} onChanged={load} notify={notify} />
      <NuevaPropuestaDialog open={nueva} onClose={() => setNueva(false)} notify={notify}
        onCreated={(p) => { setNueva(false); load(); setAbierta(p.id); }} />
      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
