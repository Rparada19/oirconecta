/**
 * Hoja de cuenta del anunciante (B2B account profile).
 * Drawer lateral con 3 tabs: Datos · Timeline · Campañas + Métricas.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Drawer, Box, Typography, Tabs, Tab, TextField, MenuItem, Button, Grid,
  Stack, Chip, IconButton, Divider, Avatar, Table, TableHead, TableBody,
  TableRow, TableCell, CircularProgress, Alert, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { adminFetch } from './adminAuth';
import { downloadAdvertiserPdf } from '../../utils/advertiserPdfExport';

const ACCENT = '#6d28d9';
const NAVY = '#272F50';
const GOLD = '#C9A86A';

const PIPELINE = [
  { code: 'PROSPECT',    label: 'Prospecto',   color: '#64748b' },
  { code: 'NEGOCIATING', label: 'Negociando',  color: '#6d28d9' },
  { code: 'ACTIVE',      label: 'Activo',      color: '#15803d' },
  { code: 'PAUSED',      label: 'Pausado',     color: '#a16207' },
  { code: 'LOST',        label: 'Perdido',     color: '#b91c1c' },
];
const PIPELINE_BY = Object.fromEntries(PIPELINE.map((p) => [p.code, p]));

const FREQ = [
  { code: 'MENSUAL', label: 'Mensual' },
  { code: 'TRIMESTRAL', label: 'Trimestral' },
  { code: 'SEMESTRAL', label: 'Semestral' },
  { code: 'ANUAL', label: 'Anual' },
  { code: 'EVENTUAL', label: 'Eventual' },
];

const ACTIVITY_TYPES = [
  { code: 'LLAMADA',   label: 'Llamada',   icon: '📞' },
  { code: 'REUNION',   label: 'Reunión',   icon: '🤝' },
  { code: 'EMAIL',     label: 'Email',     icon: '✉️' },
  { code: 'PROPUESTA', label: 'Propuesta', icon: '📄' },
  { code: 'CONTRATO',  label: 'Contrato',  icon: '📝' },
  { code: 'NOTA',      label: 'Nota',      icon: '📌' },
];

const fmtCOP = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export default function AdvertiserDetailDrawer({ open, advertiserId, onClose, onUpdated }) {
  const [tab, setTab] = useState(0);
  const [adv, setAdv] = useState(null);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [contactDialog, setContactDialog] = useState(null);
  const [activityDialog, setActivityDialog] = useState(null);

  const reload = async () => {
    if (!advertiserId) return;
    setLoading(true);
    const [r, b] = await Promise.all([
      adminFetch(`/api/marketing/admin/advertisers/${advertiserId}`),
      adminFetch('/api/marketing/admin/brands'),
    ]);
    if (r?.data?.success) {
      setAdv(r.data.data);
      setForm(r.data.data);
    }
    if (b?.data?.success) setBrands(b.data.data || []);
    setLoading(false);
  };
  useEffect(() => { if (open) reload(); /* eslint-disable-next-line */ }, [open, advertiserId]);

  const saveDatos = async () => {
    setSaving(true);
    const r = await adminFetch(`/api/marketing/admin/advertisers/${advertiserId}`, {
      method: 'PATCH', body: JSON.stringify(form),
    });
    setSaving(false);
    if (r?.data?.success) { setEditing(false); reload(); onUpdated?.(); }
  };

  if (!open) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', md: 720 }, bgcolor: '#fafbfc' } }}>
      {loading || !adv ? (
        <Box sx={{ p: 6, textAlign: 'center' }}><CircularProgress /></Box>
      ) : (
        <Box>
          {/* Header */}
          <Box sx={{ p: 3, bgcolor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={adv.logoUrl || undefined} sx={{ width: 56, height: 56, bgcolor: `${ACCENT}15`, color: ACCENT, fontWeight: 800, fontSize: '1.25rem' }}>
                  {(adv.nombre || '?').slice(0, 2).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '1.25rem', lineHeight: 1.2 }}>
                    {adv.nombre}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    {adv.pipelineStage && (() => {
                      const p = PIPELINE_BY[adv.pipelineStage] || PIPELINE_BY.PROSPECT;
                      return <Chip size="small" label={p.label}
                        sx={{ bgcolor: `${p.color}15`, color: p.color, fontWeight: 700, height: 22, fontSize: '0.7rem' }} />;
                    })()}
                    {adv.marcaPrincipal && (
                      <Chip size="small" label={adv.marcaPrincipal}
                        sx={{ bgcolor: '#f1f5f9', color: '#475569', height: 22, fontSize: '0.7rem' }} />
                    )}
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>{adv.tipo}</Typography>
                  </Stack>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  size="small" variant="contained" startIcon={<PictureAsPdfOutlinedIcon />}
                  onClick={async () => {
                    try {
                      const r = await adminFetch(`/api/marketing/admin/advertisers/${advertiserId}/full-report`);
                      if (!r.ok || !r.data?.success) throw new Error(r.data?.error || `HTTP ${r.status}`);
                      await downloadAdvertiserPdf(r.data.data);
                    } catch (e) {
                      alert(`No se pudo generar el informe: ${e.message}`);
                    }
                  }}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px',
                    background: ACCENT, '&:hover': { background: ACCENT, filter: 'brightness(0.95)' } }}>
                  Informe PDF
                </Button>
                <IconButton onClick={onClose}><CloseRoundedIcon /></IconButton>
              </Stack>
            </Stack>

            {/* Resumen rápido */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={6} sm={3}>
                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total invertido</Typography>
                <Typography sx={{ fontWeight: 800, color: ACCENT, fontSize: '1rem' }}>{fmtCOP(adv.resumen.totalInvertidoCOP)}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Campañas</Typography>
                <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '1rem' }}>
                  {adv.resumen.totalCampanas} <span style={{ fontWeight: 500, color: '#94a3b8', fontSize: '0.75rem' }}>· {adv.resumen.campanasActivas} act.</span>
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Impresiones</Typography>
                <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '1rem' }}>{adv.resumen.totalImpresiones.toLocaleString('es-CO')}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>CTR global</Typography>
                <Typography sx={{ fontWeight: 800, color: NAVY, fontSize: '1rem' }}>{adv.resumen.ctrGlobal ? `${adv.resumen.ctrGlobal}%` : '—'}</Typography>
              </Grid>
            </Grid>

            {adv.nextFollowUpAt && new Date(adv.nextFollowUpAt) > new Date() && (
              <Alert severity="info" sx={{ mt: 2, borderRadius: '8px', py: 0.5 }}>
                <strong>Próximo follow-up:</strong> {fmtDateTime(adv.nextFollowUpAt)}
              </Alert>
            )}
          </Box>

          {/* Tabs */}
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #e5e7eb', bgcolor: '#fff',
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700 },
              '& .Mui-selected': { color: ACCENT },
              '& .MuiTabs-indicator': { backgroundColor: ACCENT } }}>
            <Tab label="Datos" />
            <Tab label={`Timeline (${adv.activities.length})`} />
            <Tab label={`Campañas (${adv.campaigns.length})`} />
          </Tabs>

          {/* Contenido */}
          <Box sx={{ p: 3 }}>
            {tab === 0 && (
              <DatosTab adv={adv} form={form} setForm={setForm} editing={editing} setEditing={setEditing}
                saving={saving} onSave={saveDatos} brands={brands}
                onAddContact={() => setContactDialog({ new: true })}
                onEditContact={(c) => setContactDialog({ data: c })}
                onDeleteContact={async (c) => {
                  if (!confirm(`¿Eliminar contacto ${c.nombre}?`)) return;
                  await adminFetch(`/api/marketing/admin/contacts/${c.id}`, { method: 'DELETE' });
                  reload(); onUpdated?.();
                }} />
            )}

            {tab === 1 && (
              <TimelineTab adv={adv}
                onAdd={() => setActivityDialog({})}
                onDelete={async (a) => {
                  if (!confirm('¿Eliminar esta entrada?')) return;
                  await adminFetch(`/api/marketing/admin/activities/${a.id}`, { method: 'DELETE' });
                  reload();
                }} />
            )}

            {tab === 2 && <CampanasTab campaigns={adv.campaigns} />}
          </Box>
        </Box>
      )}

      <ContactDialog open={!!contactDialog} data={contactDialog?.data} advertiserId={advertiserId}
        onClose={() => setContactDialog(null)}
        onSaved={() => { setContactDialog(null); reload(); onUpdated?.(); }} />

      <ActivityDialog open={!!activityDialog} advertiserId={advertiserId}
        onClose={() => setActivityDialog(null)}
        onSaved={() => { setActivityDialog(null); reload(); }} />
    </Drawer>
  );
}

// ─── Tab Datos ───
function DatosTab({ adv, form, setForm, editing, setEditing, saving, onSave, brands, onAddContact, onEditContact, onDeleteContact }) {
  return (
    <Stack spacing={3}>
      {/* Edición datos */}
      <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 800, color: NAVY }}>Información general</Typography>
          {editing ? (
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => { setForm(adv); setEditing(false); }} disabled={saving}>Cancelar</Button>
              <Button size="small" variant="contained" onClick={onSave} disabled={saving}
                sx={{ background: ACCENT, '&:hover': { background: '#064a3a' } }}>
                {saving ? <CircularProgress size={16} color="inherit" /> : 'Guardar'}
              </Button>
            </Stack>
          ) : (
            <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setEditing(true)}
              sx={{ color: ACCENT }}>
              Editar
            </Button>
          )}
        </Stack>

        {editing ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField label="Nombre *" fullWidth size="small" value={form.nombre || ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select label="Pipeline" fullWidth size="small" value={form.pipelineStage || 'PROSPECT'}
                onChange={(e) => setForm({ ...form, pipelineStage: e.target.value })}>
                {PIPELINE.map((p) => <MenuItem key={p.code} value={p.code}>{p.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select label="Marca principal" fullWidth size="small" value={form.marcaPrincipal || ''}
                onChange={(e) => setForm({ ...form, marcaPrincipal: e.target.value })}>
                <MenuItem value="">— Sin marca —</MenuItem>
                {brands.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select label="Tipo" fullWidth size="small" value={form.tipo || 'CASA_COMERCIAL'} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {['CASA_COMERCIAL','PROFESIONAL','CLINICA','MARCA','OTRO'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Sitio web" fullWidth size="small" placeholder="https://..." value={form.sitioWeb || ''} onChange={(e) => setForm({ ...form, sitioWeb: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="LinkedIn" fullWidth size="small" placeholder="https://linkedin.com/..." value={form.linkedinUrl || ''} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Región" fullWidth size="small" value={form.region || ''} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Ciudad" fullWidth size="small" value={form.ciudad || ''} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField type="number" label="Presupuesto anual estimado (COP)" fullWidth size="small"
                value={form.presupuestoAnualCOP || ''} onChange={(e) => setForm({ ...form, presupuestoAnualCOP: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField select label="Frecuencia de pauta" fullWidth size="small" value={form.frecuenciaPauta || ''}
                onChange={(e) => setForm({ ...form, frecuenciaPauta: e.target.value })}>
                <MenuItem value="">—</MenuItem>
                {FREQ.map((f) => <MenuItem key={f.code} value={f.code}>{f.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="NIT" fullWidth size="small" value={form.nit || ''} onChange={(e) => setForm({ ...form, nit: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Email facturación" fullWidth size="small" value={form.emailFacturacion || ''} onChange={(e) => setForm({ ...form, emailFacturacion: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField type="datetime-local" label="Próximo follow-up" InputLabelProps={{ shrink: true }} fullWidth size="small"
                value={form.nextFollowUpAt ? new Date(form.nextFollowUpAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => setForm({ ...form, nextFollowUpAt: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notas internas" fullWidth size="small" multiline rows={3}
                value={form.notas || ''} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <DatoRow label="Sitio web" value={adv.sitioWeb} link />
            <DatoRow label="LinkedIn" value={adv.linkedinUrl} link />
            <DatoRow label="Marca principal" value={adv.marcaPrincipal} />
            <DatoRow label="Tipo" value={adv.tipo} />
            <DatoRow label="Región" value={adv.region} />
            <DatoRow label="Ciudad" value={adv.ciudad} />
            <DatoRow label="Presupuesto anual" value={adv.presupuestoAnualCOP ? fmtCOP(adv.presupuestoAnualCOP) : null} />
            <DatoRow label="Frecuencia" value={adv.frecuenciaPauta} />
            <DatoRow label="NIT" value={adv.nit} />
            <DatoRow label="Email facturación" value={adv.emailFacturacion} />
            {adv.notas && (
              <Grid item xs={12}>
                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notas</Typography>
                <Typography sx={{ fontSize: '0.875rem', color: '#475569', whiteSpace: 'pre-line', mt: 0.5 }}>{adv.notas}</Typography>
              </Grid>
            )}
          </Grid>
        )}
      </Box>

      {/* Contactos */}
      <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', p: 2.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography sx={{ fontWeight: 800, color: NAVY }}>Contactos ({adv.contacts.length})</Typography>
          <Button size="small" startIcon={<AddRoundedIcon />} onClick={onAddContact}
            sx={{ color: ACCENT, textTransform: 'none', fontWeight: 600 }}>
            Agregar
          </Button>
        </Stack>
        {adv.contacts.length === 0 ? (
          <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', py: 2 }}>
            Sin contactos. Agrega el decision maker y otros stakeholders.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {adv.contacts.map((c) => (
              <Stack key={c.id} direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#f8fafc' }}>
                {c.esPrincipal && <StarRoundedIcon sx={{ color: GOLD }} />}
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: NAVY }}>{c.nombre}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>{c.cargo || '—'}</Typography>
                </Box>
                {c.email && <Tooltip title={c.email}><IconButton size="small" component="a" href={`mailto:${c.email}`}><EmailOutlinedIcon fontSize="small" /></IconButton></Tooltip>}
                {c.telefono && <Tooltip title={c.telefono}><IconButton size="small" component="a" href={`tel:${c.telefono}`}><PhoneOutlinedIcon fontSize="small" /></IconButton></Tooltip>}
                <IconButton size="small" onClick={() => onEditContact(c)}><EditOutlinedIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => onDeleteContact(c)} sx={{ color: '#b91c1c' }}><DeleteOutlineIcon fontSize="small" /></IconButton>
              </Stack>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

function DatoRow({ label, value, link }) {
  if (!value) return null;
  return (
    <Grid item xs={12} sm={6}>
      <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</Typography>
      {link ? (
        <Typography component="a" href={value} target="_blank" rel="noreferrer"
          sx={{ fontSize: '0.875rem', color: ACCENT, fontWeight: 600, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}>
          {value} <OpenInNewIcon fontSize="inherit" />
        </Typography>
      ) : (
        <Typography sx={{ fontSize: '0.875rem', color: NAVY, fontWeight: 600 }}>{value}</Typography>
      )}
    </Grid>
  );
}

// ─── Tab Timeline ───
function TimelineTab({ adv, onAdd, onDelete }) {
  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={{ fontWeight: 800, color: NAVY }}>Bitácora de relación</Typography>
        <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} onClick={onAdd}
          sx={{ background: ACCENT, borderRadius: '8px', textTransform: 'none', fontWeight: 700,
            '&:hover': { background: '#064a3a' } }}>
          Registrar
        </Button>
      </Stack>
      {adv.activities.length === 0 ? (
        <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', p: 4, textAlign: 'center' }}>
          <EventOutlinedIcon sx={{ fontSize: 36, color: '#cbd5e1', mb: 1 }} />
          <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
            Aún no hay actividad registrada. Registra la primera llamada o nota.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {adv.activities.map((a) => {
            const t = ACTIVITY_TYPES.find((x) => x.code === a.tipo) || { icon: '•', label: a.tipo };
            return (
              <Box key={a.id} sx={{ bgcolor: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb', p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontSize: '1.1rem' }}>{t.icon}</Typography>
                    <Typography sx={{ fontWeight: 700, color: NAVY, fontSize: '0.875rem' }}>{t.label}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>· {fmtDateTime(a.fecha)}</Typography>
                  </Stack>
                  <IconButton size="small" onClick={() => onDelete(a)} sx={{ color: '#b91c1c' }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <Typography sx={{ fontSize: '0.875rem', color: '#475569', whiteSpace: 'pre-line' }}>{a.descripcion}</Typography>
                {a.autorEmail && (
                  <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 0.5 }}>por {a.autorEmail}</Typography>
                )}
                {a.reminderAt && (
                  <Chip size="small" label={`Recordar el ${fmtDateTime(a.reminderAt)}`}
                    sx={{ mt: 1, bgcolor: '#fef3c7', color: '#a16207', fontSize: '0.7rem' }} />
                )}
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}

// ─── Tab Campañas ───
function CampanasTab({ campaigns }) {
  if (campaigns.length === 0) {
    return (
      <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', p: 4, textAlign: 'center' }}>
        <Typography sx={{ color: '#64748b', fontSize: '0.875rem' }}>
          Este anunciante no tiene campañas todavía.
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <Table size="small">
        <TableHead sx={{ bgcolor: '#f8fafc' }}>
          <TableRow>
            {['Campaña', 'Tipo', 'Periodo', 'Estado', 'Precio'].map((h) => (
              <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#475569', textTransform: 'uppercase' }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {campaigns.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>{c.nombre}</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{c.slug}</Typography>
              </TableCell>
              <TableCell sx={{ fontSize: '0.8125rem' }}>{c.actionType}</TableCell>
              <TableCell sx={{ fontSize: '0.75rem' }}>
                {fmtDate(c.startDate)}<br />
                <span style={{ color: '#94a3b8' }}>↓ {fmtDate(c.endDate)}</span>
              </TableCell>
              <TableCell>
                <Chip size="small" label={c.isActive ? c.status : 'OFF'}
                  sx={{ bgcolor: c.isActive ? '#dcfce7' : '#f3f4f6', color: c.isActive ? '#15803d' : '#64748b', fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
              </TableCell>
              <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>{fmtCOP(c.priceCOP)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

// ─── Dialog contacto ───
function ContactDialog({ open, data, advertiserId, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setForm(data || { esPrincipal: false }); }, [open, data]);

  const save = async () => {
    setSaving(true);
    const url = data?.id ? `/api/marketing/admin/contacts/${data.id}` : `/api/marketing/admin/advertisers/${advertiserId}/contacts`;
    const method = data?.id ? 'PATCH' : 'POST';
    await adminFetch(url, { method, body: JSON.stringify(form) });
    setSaving(false);
    onSaved();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>{data?.id ? 'Editar contacto' : 'Nuevo contacto'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Nombre *" fullWidth size="small" value={form.nombre || ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <TextField label="Cargo" fullWidth size="small" value={form.cargo || ''} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
          <TextField label="Email" fullWidth size="small" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Teléfono" fullWidth size="small" value={form.telefono || ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <Stack direction="row" spacing={1} alignItems="center">
            <input type="checkbox" id="es-principal" checked={!!form.esPrincipal} onChange={(e) => setForm({ ...form, esPrincipal: e.target.checked })} />
            <label htmlFor="es-principal" style={{ fontSize: '0.875rem', color: '#475569' }}>
              Contacto principal (decision maker)
            </label>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={save} disabled={saving || !form.nombre}
          sx={{ background: ACCENT, '&:hover': { background: '#064a3a' } }}>
          {saving ? <CircularProgress size={18} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Dialog actividad ───
function ActivityDialog({ open, advertiserId, onClose, onSaved }) {
  const [form, setForm] = useState({ tipo: 'LLAMADA', descripcion: '', fecha: new Date().toISOString().slice(0, 16) });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setForm({ tipo: 'LLAMADA', descripcion: '', fecha: new Date().toISOString().slice(0, 16) }); }, [open]);

  const save = async () => {
    setSaving(true);
    await adminFetch(`/api/marketing/admin/advertisers/${advertiserId}/activities`, {
      method: 'POST', body: JSON.stringify(form),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: NAVY }}>Registrar actividad</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField select label="Tipo" fullWidth size="small" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            {ACTIVITY_TYPES.map((t) => <MenuItem key={t.code} value={t.code}>{t.icon} {t.label}</MenuItem>)}
          </TextField>
          <TextField type="datetime-local" label="Fecha" InputLabelProps={{ shrink: true }} fullWidth size="small"
            value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          <TextField label="Descripción *" fullWidth size="small" multiline rows={4}
            placeholder="¿Qué pasó? ¿Qué hablaron? ¿Próximo paso?"
            value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <TextField type="datetime-local" label="Recordatorio (opcional)" InputLabelProps={{ shrink: true }} fullWidth size="small"
            value={form.reminderAt || ''} onChange={(e) => setForm({ ...form, reminderAt: e.target.value })} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={save} disabled={saving || !form.descripcion}
          sx={{ background: ACCENT, '&:hover': { background: '#064a3a' } }}>
          {saving ? <CircularProgress size={18} /> : 'Registrar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
