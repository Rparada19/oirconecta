/**
 * Cotizaciones: todas las propuestas comerciales en un solo lugar.
 *
 * - Incluye las cotizaciones que ya existían (creadas desde la ficha del
 *   paciente) como propuestas de una opción.
 * - El seguimiento comercial vive dentro de cada cotización: contactos,
 *   resultado, etapa y fecha del próximo contacto.
 * - Las propuestas nuevas llevan hasta 3 opciones y generan el PDF de marca.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box, Container, Grid, Typography, Chip, CircularProgress, Button, Drawer, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip,
  Snackbar, Alert, TextField, MenuItem, Stack, Dialog,
  Autocomplete, ToggleButton, ToggleButtonGroup, Tabs, Tab, Checkbox,
} from '@mui/material';
import {
  RequestQuote, Refresh, WhatsApp, Add, Close, PictureAsPdf, Phone, Email, Chat,
  Storefront, EventNote, EmojiEvents, DeleteOutline,
} from '@mui/icons-material';
import PageHeader from '../../components/crm/ui/PageHeader';
import CatalogoTab from '../../components/crm/cotizaciones/CatalogoTab';
import { api } from '../../services/apiClient';
import { getPatients } from '../../services/patientService';
import {
  descargarPropuestaPdf, propuestaDesdeApi, renderPropuestaPages, LOGOS, PROPUESTA_DEFAULTS, PROPUESTA_CSS, EMPRESA,
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

const normTxt = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
/** Fichas técnicas de todas las opciones de una propuesta, sin repetir. */
const fichasDe = (p) => {
  const vistas = new Set();
  return (p?.opciones || []).flatMap((o) => o.fichas || []).filter((f) => f?.url && !vistas.has(f.url) && vistas.add(f.url));
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

  const pdf = async (conFichas = false) => {
    setPdfBusy(true);
    try {
      const nombre = `Cotizacion_${(p.paciente?.nombre || 'paciente').replace(/\s+/g, '_')}_${p.numero}.pdf`;
      await descargarPropuestaPdf(propuestaDesdeApi(p), LOGOS, nombre, { fichas: conFichas ? fichasDe(p) : [] });
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
              <Button variant="contained" startIcon={pdfBusy ? <CircularProgress size={16} color="inherit" /> : <PictureAsPdf />} onClick={() => pdf(false)} disabled={pdfBusy}
                sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}>Descargar PDF</Button>
              {fichasDe(p).length > 0 && (
                <Button variant="outlined" onClick={() => pdf(true)} disabled={pdfBusy}
                  sx={{ borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}>PDF + fichas</Button>
              )}
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
                      {cop(o.valorPorUnidad)} c/u{o.descuento ? ` · −${o.descuento}%` : ''} · {o.cantidad} unidad{o.cantidad > 1 ? 'es' : ''}{o.campana ? ` · ${o.campana}` : ''}
                    </Typography>
                    {o.fichas?.length > 0 && o.fichas.map((f) => (
                      <Typography key={f.url} component="a" href={f.url} target="_blank" rel="noopener" sx={{ fontSize: '0.72rem', color: '#4054B2', mr: 1 }}>Ficha técnica</Typography>
                    ))}
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
const ICONOS_BASE = ['onda', 'bateria', 'celular', 'bluetooth', 'ia', 'agua'];
const opcionDesdeProducto = (p) => ({
  key: `${p?.id || 'otro'}-${Math.random().toString(36).slice(2, 7)}`,
  catalogoProductoId: p?.id || null,
  nombre: p?.nombre || '', linea: p?.linea || '', sub: p?.sub || '', corto: p?.plataforma || p?.tecnologia || '',
  etiqueta: p?.etiqueta || '', imagen: p?.imagen || '', marca: p?.marca || '', tecnologia: p?.tecnologia || '',
  valorUnitario: p?.valor || 0, descuento: 0, campaignId: '',
  atributosTxt: (p?.atributos || []).map((a) => `${a.t}${a.d ? `: ${a.d}` : ''}`).join('\n'),
  iconos: (p?.atributos || []).map((a) => a.i),
  campanas: (p?.campanas || []).filter((c) => c.vigente),
  fichas: (p?.fichas || []).filter((f) => f.url),
  fotos: (p?.fotos || []).filter((f) => f.url),
});

const atributosDe = (o) => String(o.atributosTxt || '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 6).map((l, j) => {
  const [t, ...rest] = l.split(':');
  return { i: o.iconos?.[j] || ICONOS_BASE[j] || 'check', t: t.trim(), d: rest.join(':').trim() };
});

/** Descuento promedio por unidad que deja una campaña (igual que el backend). */
const dtoCampana = (c, cantidad) => {
  const d = Number(c?.descuentoAprobado) || 0;
  return c?.aplicacionDescuento === 'SEGUNDO_AUDIFONO' && cantidad >= 2 ? Math.round((d / cantidad) * 100) / 100 : d;
};

function NuevaPropuestaDialog({ open, onClose, onCreated, notify, catalogo }) {
  const productos = catalogo?.productos || [];
  const [buscar, setBuscar] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [paciente, setPaciente] = useState(null);
  const [nuevo, setNuevo] = useState({ nombre: '', telefono: '', email: '' });
  const [modoNuevo, setModoNuevo] = useState(false);
  const [profesional, setProfesional] = useState('Dra. Piedad Marín');
  const [cargo, setCargo] = useState('Audióloga');
  const [cantidad, setCantidad] = useState(2);
  const [vigencia, setVigencia] = useState(15);
  const [intro, setIntro] = useState(PROPUESTA_DEFAULTS.intro);
  const [adjuntarFichas, setAdjuntarFichas] = useState(true);
  const [opciones, setOpciones] = useState([]);
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

  const crear = async (descargar) => {
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
    if (!opciones.length || opciones.some((o) => !o.nombre.trim())) return notify('Agrega al menos una opción con nombre.', 'warning');
    setSaving(true);
    const hoy = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const body = {
      patientId, profesional, cargo, cantidad, vigenciaDias: vigencia, intro,
      numero: `COT-OC-${hoy}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      garantias: PROPUESTA_DEFAULTS.garantias, plan: PROPUESTA_DEFAULTS.plan, condiciones: PROPUESTA_DEFAULTS.condiciones,
      opciones: opciones.map((o) => ({
        nombre: o.nombre, marca: o.marca || o.nombre.split(' ')[0], tecnologia: o.tecnologia || o.corto, linea: o.linea, sub: o.sub, corto: o.corto,
        etiqueta: o.etiqueta, imagen: o.imagen, valorUnitario: Number(o.valorUnitario) || 0, descuento: Number(o.descuento) || 0,
        campaignId: o.campaignId || undefined, catalogoProductoId: o.catalogoProductoId || undefined, fichas: o.fichas || [],
        atributos: atributosDe(o),
      })),
    };
    const { data, error } = await api.post('/api/crm/cotizaciones', body);
    setSaving(false);
    if (error) return notify(`No se pudo crear la propuesta: ${error}`, 'error');
    notify('Propuesta creada.');
    if (descargar) {
      try {
        const p = data.data;
        await descargarPropuestaPdf(propuestaDesdeApi(p), LOGOS, `Cotizacion_${(p.paciente?.nombre || 'paciente').replace(/\s+/g, '_')}_${p.numero}.pdf`,
          { fichas: adjuntarFichas ? fichasDe(p) : [] });
      } catch {
        notify('La propuesta se creó, pero no se pudo generar el PDF. Descárgalo desde el detalle.', 'warning');
      }
    }
    onCreated(data.data);
  };

  // Vista previa en vivo: mismas 3 hojas del PDF, escaladas al panel derecho.
  const previewRef = useRef(null);
  const [escala, setEscala] = useState(0.6);
  useEffect(() => {
    if (!open) return undefined;
    const el = previewRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setEscala(Math.min(1, (el.clientWidth - 48) / 816)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const nombrePaciente = modoNuevo ? nuevo.nombre : (paciente?.nombre || '');
  const datosPreview = useMemo(() => ({
    numero: 'COT-OC-(se asigna al crear)',
    fecha: new Date().toISOString().slice(0, 10), vigencia, cantidad,
    paciente: nombrePaciente || 'Nombre del paciente', profesional, cargo, intro,
    productos: opciones.map((o) => ({
      nombre: o.nombre || 'Producto', linea: o.linea, sub: o.sub, corto: o.corto, tag: o.etiqueta, img: o.imagen,
      precio: Number(o.valorUnitario) || 0, dto: Number(o.descuento) || 0, feats: atributosDe(o),
    })),
    garantias: PROPUESTA_DEFAULTS.garantias, plan: PROPUESTA_DEFAULTS.plan, planNota: PROPUESTA_DEFAULTS.planNota,
    condiciones: PROPUESTA_DEFAULTS.condiciones, e: EMPRESA, firma: { on: true }, codigoFirma: 'se genera al crear',
  }), [opciones, vigencia, cantidad, nombrePaciente, profesional, cargo, intro]);
  const hojas = useMemo(() => (opciones.length ? renderPropuestaPages(datosPreview, LOGOS) : []), [datosPreview, opciones.length]);

  const Seccion = ({ children }) => (
    <Typography sx={{ fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 800, color: '#4054B2', mb: 1.25 }}>{children}</Typography>
  );

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '420px 1fr' }, height: '100%', minHeight: 0 }}>
        {/* PANEL DE DATOS */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, borderRight: '1px solid #e5e7eb', bgcolor: '#fff' }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem' }}>Nueva propuesta</Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>Llena los datos y revisa la propuesta a la derecha.</Typography>
            </Box>
            <IconButton onClick={onClose} aria-label="Cerrar"><Close /></IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
            <Seccion>Paciente</Seccion>
            {!modoNuevo ? (
              <>
                <Autocomplete options={pacientes} value={paciente} onChange={(_, v) => setPaciente(v)}
                  getOptionLabel={(o) => `${o.nombre}${o.telefono ? ` · ${o.telefono}` : ''}`}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  onInputChange={(_, v) => setBuscar(v)} filterOptions={(x) => x}
                  renderInput={(params) => <TextField {...params} size="small" label="Buscar paciente" placeholder="Nombre, teléfono o correo" />} />
                <Button size="small" onClick={() => setModoNuevo(true)} sx={{ textTransform: 'none', fontWeight: 700, mt: 0.5, px: 0 }}>+ Paciente nuevo</Button>
              </>
            ) : (
              <Stack spacing={1.25}>
                <TextField size="small" label="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} />
                <Stack direction="row" spacing={1.25}>
                  <TextField size="small" fullWidth label="Teléfono" value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} />
                  <TextField size="small" fullWidth label="Correo (opcional)" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} />
                </Stack>
                <Button size="small" onClick={() => setModoNuevo(false)} sx={{ textTransform: 'none', alignSelf: 'flex-start', px: 0 }}>Buscar un paciente existente</Button>
              </Stack>
            )}

            <Divider sx={{ my: 2 }} />
            <Seccion>{`Productos (${opciones.length}/3)`}</Seccion>
            <Stack spacing={1}>
              {opciones.map((o, i) => (
                <Box key={o.key} component="details" open={i === opciones.length - 1}
                  sx={{ border: '1px solid #e5e7eb', borderRadius: '12px', '& > summary': { listStyle: 'none', cursor: 'pointer' }, '& > summary::-webkit-details-marker': { display: 'none' } }}>
                  <Box component="summary" sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25 }}>
                    <Box sx={{ width: 40, height: 40, borderRadius: '9px', bgcolor: '#f1f5fb', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      {o.imagen ? <Box component="img" src={o.imagen} alt="" sx={{ maxWidth: 34, maxHeight: 34, objectFit: 'contain' }} /> : <RequestQuote sx={{ fontSize: 18, color: '#94a3b8' }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.86rem' }} noWrap>{o.nombre || 'Producto sin nombre'}</Typography>
                      <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }} noWrap>
                        {o.campaignId ? (o.campanas.find((c) => c.id === o.campaignId)?.nombre || 'Campaña') : (Number(o.descuento) ? `−${o.descuento}%` : 'Sin descuento')}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.84rem', whiteSpace: 'nowrap' }}>
                      {cop((Number(o.valorUnitario) || 0) * (1 - (Number(o.descuento) || 0) / 100))}
                    </Typography>
                  </Box>
                  <Stack spacing={1.25} sx={{ px: 1.25, pb: 1.25 }}>
                    {o.fotos?.length > 1 && (
                      <Box>
                        <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mb: 0.5 }}>Foto para la propuesta</Typography>
                        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', rowGap: 0.75 }}>
                          {o.fotos.map((f) => (
                            <Box key={f.url} onClick={() => setOp(i, 'imagen', f.url)}
                              sx={{ width: 52, height: 52, borderRadius: '9px', bgcolor: '#f1f5fb', cursor: 'pointer', overflow: 'hidden',
                                border: f.url === o.imagen ? '2px solid #4054B2' : '1px solid #e5e7eb' }}>
                              <Box component="img" src={f.url} alt={f.color || ''} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}
                    <TextField size="small" label="Nombre del producto" value={o.nombre} onChange={(e) => setOp(i, 'nombre', e.target.value)} />
                    <Stack direction="row" spacing={1.25}>
                      <TextField size="small" fullWidth type="number" label="Valor unitario" value={o.valorUnitario} onChange={(e) => setOp(i, 'valorUnitario', e.target.value)} />
                      <TextField size="small" sx={{ width: 110 }} type="number" label="Dto. %" value={o.descuento} disabled={Boolean(o.campaignId)}
                        onChange={(e) => setOp(i, 'descuento', e.target.value)} />
                    </Stack>
                    <TextField select size="small" label="Campaña" value={o.campaignId}
                      onChange={(e) => {
                        const c = o.campanas.find((x) => x.id === e.target.value);
                        setOpciones((ops) => ops.map((x, j) => (j === i ? { ...x, campaignId: e.target.value, descuento: c ? dtoCampana(c, cantidad) : 0 } : x)));
                      }}
                      helperText={o.campaignId ? 'El descuento lo define la campaña.' : (o.campanas.length ? '' : 'Sin campañas vigentes para este producto.')}>
                      <MenuItem value="">Sin campaña</MenuItem>
                      {o.campanas.map((c) => <MenuItem key={c.id} value={c.id}>{c.nombre} · {c.descuentoAprobado}%{c.aplicacionDescuento === 'SEGUNDO_AUDIFONO' ? ' en el 2.º' : ''}</MenuItem>)}
                    </TextField>
                    <TextField size="small" multiline minRows={3} label="Atributos (uno por línea, «Título: descripción»)"
                      value={o.atributosTxt} onChange={(e) => setOp(i, 'atributosTxt', e.target.value)} />
                    <Button size="small" color="error" startIcon={<DeleteOutline />} disabled={opciones.length === 1}
                      onClick={() => setOpciones((ops) => ops.filter((_, j) => j !== i))} sx={{ textTransform: 'none', alignSelf: 'flex-start' }}>Quitar producto</Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
            {opciones.length < 3 && (
              <Box sx={{ mt: 1.25 }}>
                <Autocomplete
                  options={productos} value={null} blurOnSelect clearOnBlur
                  getOptionLabel={(p) => p.nombre || ''}
                  filterOptions={(opts, { inputValue }) => {
                    const t = normTxt(inputValue).split(' ').filter(Boolean);
                    if (!t.length) return opts;
                    return opts.filter((p) => { const h = normTxt([p.nombre, p.marca, p.plataforma, p.tecnologia, p.etiqueta, p.linea, p.recargable === 'SI' ? 'recargable' : 'pila bateria'].join(' ')); return t.every((w) => h.includes(w)); });
                  }}
                  onChange={(_, p) => { if (p) setOpciones((ops) => [...ops, opcionDesdeProducto(p)]); }}
                  noOptionsText="Sin coincidencias en el catálogo"
                  renderOption={(props, p) => (
                    <Box component="li" {...props} key={p.id} sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
                      <Box sx={{ width: 44, height: 44, borderRadius: '9px', bgcolor: '#f1f5fb', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        {p.imagen ? <Box component="img" src={p.imagen} alt="" sx={{ maxWidth: 38, maxHeight: 38, objectFit: 'contain' }} /> : <RequestQuote sx={{ fontSize: 18, color: '#94a3b8' }} />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.86rem' }} noWrap>{p.nombre}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }} noWrap>
                          {cop(p.valor)}{(p.campanas || []).filter((c) => c.vigente).length ? ` · ${(p.campanas || []).filter((c) => c.vigente).map((c) => c.nombre).join(', ')}` : ''}
                          {(p.fotos || []).length > 1 ? ` · ${p.fotos.length} fotos` : ''}{(p.fichas || []).length ? ' · ficha' : ''}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => <TextField {...params} size="small" label="Buscar producto en el catálogo" placeholder="Ej. allure 220, recargable, phonak…" />}
                />
                <Button size="small" onClick={() => setOpciones((ops) => [...ops, opcionDesdeProducto(null)])} sx={{ textTransform: 'none', mt: 0.5, px: 0 }}>+ Producto manual (fuera del catálogo)</Button>
              </Box>
            )}
            {opciones.some((o) => o.fichas?.length) && (
              <Stack direction="row" alignItems="center" sx={{ mt: 1 }}>
                <Checkbox size="small" checked={adjuntarFichas} onChange={(e) => setAdjuntarFichas(e.target.checked)} />
                <Typography sx={{ fontSize: '0.82rem' }}>Adjuntar las fichas técnicas al final del PDF</Typography>
              </Stack>
            )}
            <Divider sx={{ my: 2 }} />
            <Seccion>Profesional y condiciones</Seccion>
            <Stack spacing={1.25}>
              <Stack direction="row" spacing={1.25}>
                <TextField size="small" fullWidth label="Profesional" value={profesional} onChange={(e) => setProfesional(e.target.value)} />
                <TextField size="small" sx={{ width: 150 }} label="Cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} />
              </Stack>
              <Stack direction="row" spacing={1.25}>
                <TextField select size="small" fullWidth label="Adaptación" value={cantidad} onChange={(e) => {
                  const q = Number(e.target.value); setCantidad(q);
                  setOpciones((ops) => ops.map((o) => (o.campaignId ? { ...o, descuento: dtoCampana(o.campanas.find((c) => c.id === o.campaignId), q) } : o)));
                }}>
                  <MenuItem value={2}>Binaural (2 unidades)</MenuItem><MenuItem value={1}>Monoaural (1 unidad)</MenuItem>
                </TextField>
                <TextField size="small" sx={{ width: 150 }} type="number" label="Vigencia (días)" value={vigencia} onChange={(e) => setVigencia(Number(e.target.value) || 15)} />
              </Stack>
              <TextField size="small" multiline minRows={3} maxRows={6} label="Mensaje al paciente" value={intro} onChange={(e) => setIntro(e.target.value)}
                helperText="Puedes usar {nombre} y {profesional}." />
            </Stack>

            <Typography sx={{ mt: 2, fontSize: '0.74rem', color: '#94a3b8' }}>
              Garantías, plan audiológico y condiciones van con los valores estándar de OírConecta.
            </Typography>
          </Box>

          <Box sx={{ px: 2.5, py: 1.75, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={() => crear(true)} disabled={saving} startIcon={<PictureAsPdf />}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>{saving ? 'Creando…' : 'Crear y descargar PDF'}</Button>
            <Button variant="outlined" onClick={() => crear(false)} disabled={saving} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}>Solo crear</Button>
          </Box>
        </Box>

        {/* VISTA PREVIA */}
        <Box ref={previewRef} sx={{ bgcolor: '#eef2f7', overflowY: 'auto', py: 3, display: { xs: 'none', md: 'block' } }}>
          <style>{PROPUESTA_CSS}</style>
          <Stack spacing={3} alignItems="center">
            {hojas.length === 0 && (
              <Box sx={{ mt: 12, textAlign: 'center', color: '#64748b', maxWidth: 360 }}>
                <RequestQuote sx={{ fontSize: 48, color: '#94a3b8' }} />
                <Typography sx={{ fontWeight: 800, mt: 1 }}>Busca un producto para empezar</Typography>
                <Typography sx={{ fontSize: '0.85rem' }}>Al elegirlo se traen la foto, los atributos, la campaña vigente y la ficha técnica, y aquí ves la propuesta armándose.</Typography>
              </Box>
            )}
            {hojas.map((h, i) => (
              <Box key={i} sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.66rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', mb: 1 }}>
                  Página {i + 1} de 3
                </Typography>
                <Box sx={{ width: 816 * escala, height: 1056 * escala, position: 'relative', overflow: 'hidden', bgcolor: '#fff', boxShadow: '0 8px 28px rgba(15,23,42,0.16)' }}>
                  <Box sx={{ position: 'absolute', left: 0, top: 0, transform: `scale(${escala})`, transformOrigin: '0 0', textAlign: 'left' }}
                    dangerouslySetInnerHTML={{ __html: h }} />
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
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
  const [tab, setTab] = useState('propuestas');
  const [catalogo, setCatalogo] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const notify = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

  const load = useCallback(async () => {
    setLoading(true);
    const { data: res } = await api.get(`/api/crm/cotizaciones?incluirCerradas=${verCerradas}`);
    setData(res?.data || null);
    setLoading(false);
  }, [verCerradas]);
  useEffect(() => { load(); }, [load]);

  const loadCatalogo = useCallback(async () => {
    const { data: res } = await api.get('/api/crm/catalogo');
    setCatalogo(res?.data || { productos: [], campanas: [] });
  }, []);
  useEffect(() => { loadCatalogo(); }, [loadCatalogo]);

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
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #e5e7eb', '& .MuiTab-root': { textTransform: 'none', fontWeight: 700 } }}>
          <Tab value="propuestas" label="Propuestas y seguimiento" />
          <Tab value="catalogo" label={`Catálogo${catalogo ? ` (${catalogo.productos.length})` : ''}`} />
        </Tabs>
        {tab === 'catalogo' ? (
          <CatalogoTab catalogo={catalogo} onChanged={loadCatalogo} notify={notify} />
        ) : loading ? (
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
      <NuevaPropuestaDialog open={nueva} onClose={() => setNueva(false)} notify={notify} catalogo={catalogo}
        onCreated={(p) => { setNueva(false); load(); setAbierta(p.id); }} />
      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.sev} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
