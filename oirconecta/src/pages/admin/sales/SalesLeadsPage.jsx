/**
 * Lista de leads del CRM Sales con filtros + import CSV + crear lead.
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Container, TextField, MenuItem,
  CircularProgress, Snackbar, Alert, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Tooltip,
} from '@mui/material';
import {
  PeopleAltOutlined, Search, FilterListOutlined, AddOutlined,
  UploadFileOutlined, PhoneOutlined, WhatsApp, EmailOutlined, OpenInNew,
} from '@mui/icons-material';
import { salesApi, parseCsv, telHref, waMeHref, mailtoHref, PIPELINE_STAGES, STATUS_META } from '../../../services/salesApi';
import { SalesPageHeader, softCard, StatusPill } from './SalesShell';

export default function SalesLeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [snack, setSnack] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const fileRef = useRef(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status) params.status = status;
      if (q.trim()) params.q = q.trim();
      const data = await salesApi.listLeads(params);
      setLeads(data || []);
    } catch (e) {
      setSnack({ severity: 'error', msg: e.message });
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => { reload(); }, [reload]);

  const handleCsv = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) throw new Error('CSV vacío');
      const result = await salesApi.importCsv(rows);
      setSnack({ severity: 'success', msg: `Importados ${result.imported} · saltados ${result.skipped}` });
      setCsvOpen(false);
      reload();
    } catch (e) {
      setSnack({ severity: 'error', msg: e.message });
    }
  };

  const counts = leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {});

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <SalesPageHeader
        icon={PeopleAltOutlined}
        title="Leads"
        subtitle={`${leads.length} en la lista`}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setCsvOpen(true)} startIcon={<UploadFileOutlined />}
              sx={{ textTransform: 'none', color: '#4054B2', fontWeight: 700, borderRadius: 1.5,
                bgcolor: '#eef0fb', '&:hover': { bgcolor: '#dde0f5' } }}>
              Importar CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)} startIcon={<AddOutlined />} variant="contained"
              sx={{ bgcolor: '#085946', textTransform: 'none', fontWeight: 700, borderRadius: 1.5,
                '&:hover': { bgcolor: '#064a38' } }}>
              Nuevo lead
            </Button>
          </Box>
        }
      />

      {/* Stage pills */}
      <Box sx={{ display: 'flex', gap: 0.875, flexWrap: 'wrap', mb: 2 }}>
        <StagePill label="Todos" count={leads.length} active={!status} onClick={() => setStatus('')} color="#272F50" bg="#eef0fb" />
        {PIPELINE_STAGES.map((s) => (
          <StagePill key={s}
            label={STATUS_META[s].label} count={counts[s] || 0}
            active={status === s} onClick={() => setStatus(s)}
            color={STATUS_META[s].color} bg={STATUS_META[s].bg} />
        ))}
      </Box>

      {/* Toolbar */}
      <Box sx={{
        ...softCard, p: 1.5, mb: 2,
        display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <Search sx={{ fontSize: 18, color: '#5b6b7a', ml: 0.5 }} />
        <TextField
          placeholder="Buscar por nombre, email, teléfono, empresa…"
          value={q} onChange={(e) => setQ(e.target.value)}
          variant="standard" InputProps={{ disableUnderline: true }}
          sx={{ flex: 1, minWidth: 220, '& input': { fontSize: 13.5 } }}
        />
      </Box>

      {/* Tabla */}
      <Box sx={softCard}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#085946' }} /></Box>
        ) : leads.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
            <PeopleAltOutlined sx={{ fontSize: 44, color: 'rgba(8,89,70,0.20)', mb: 1.5 }} />
            <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#041a12', mb: 0.5 }}>
              Sin leads con esos filtros
            </Typography>
            <Typography sx={{ fontSize: 13, color: '#5b6b7a' }}>
              Crea uno nuevo o importa un CSV con tu lista.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{
              width: '100%', borderCollapse: 'collapse', minWidth: 760,
              '& th': { textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: '#5b6b7a', py: 1.25, px: 2, borderBottom: '1px solid #f0f2f4' },
              '& td': { py: 1.5, px: 2, borderBottom: '1px solid #f0f2f4', fontSize: 13.5, color: '#0f1923', verticalAlign: 'middle' },
              '& tr:hover td': { bgcolor: 'rgba(64,84,178,0.03)' },
            }}>
              <thead>
                <tr><th>Nombre</th><th>Profesión</th><th>Ciudad</th><th>Estado</th><th>Último contacto</th><th style={{ textAlign: 'right' }}>Acciones</th></tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const tel = telHref(l.telefono);
                  const wa = waMeHref(l.telefono, `Hola ${l.nombre}, te contacto de OírConecta.`);
                  const mail = mailtoHref(l.email, 'Hola desde OírConecta', `Hola ${l.nombre},`);
                  return (
                    <Box component="tr" key={l.id} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/portal-admin/sales/leads/${l.id}`)}>
                      <td>
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{l.nombre}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: '#5b6b7a' }}>{l.email || '—'}</Typography>
                      </td>
                      <td><Typography sx={{ fontSize: 13 }}>{l.profesion || '—'}</Typography></td>
                      <td><Typography sx={{ fontSize: 13 }}>{l.ciudad || '—'}</Typography></td>
                      <td><StatusPill status={l.status} /></td>
                      <td>
                        <Typography sx={{ fontSize: 12.5, color: '#5b6b7a' }}>
                          {l.lastActivityAt ? new Date(l.lastActivityAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '—'}
                        </Typography>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          {tel && <ActionBtn href={tel} icon={PhoneOutlined} color="#4054B2" title="Llamar" />}
                          {wa && <ActionBtn href={wa} icon={WhatsApp} color="#25D366" title="WhatsApp" external />}
                          {mail && <ActionBtn href={mail} icon={EmailOutlined} color="#8b5cf6" title="Email" />}
                          <Tooltip title="Abrir detalle">
                            <IconButton size="small" onClick={() => navigate(`/portal-admin/sales/leads/${l.id}`)}>
                              <OpenInNew sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </td>
                    </Box>
                  );
                })}
              </tbody>
            </Box>
          </Box>
        )}
      </Box>

      {/* Dialog Crear */}
      <NewLeadDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); reload(); }} setSnack={setSnack} />

      {/* Dialog CSV */}
      <Dialog open={csvOpen} onClose={() => setCsvOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#272F50' }}>Importar lista de prospectos</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13.5, color: '#5b6b7a', mb: 2 }}>
            CSV con encabezados <strong>nombre, email, telefono, profesion, empresa, ciudad</strong>.
            Idempotente: los duplicados por email o teléfono se omiten.
          </Typography>
          <input type="file" accept=".csv,text/csv" ref={fileRef} onChange={(e) => handleCsv(e.target.files?.[0])} hidden />
          <Button onClick={() => fileRef.current?.click()} variant="contained" startIcon={<UploadFileOutlined />}
            sx={{ bgcolor: '#4054B2', textTransform: 'none', fontWeight: 700, borderRadius: 1.5, '&:hover': { bgcolor: '#32449a' } }}>
            Elegir archivo CSV
          </Button>
        </DialogContent>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={2400} onClose={() => setSnack(null)}>
        {snack ? <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert> : null}
      </Snackbar>
    </Container>
  );
}

function StagePill({ label, count, active, onClick, color, bg }) {
  return (
    <Box onClick={onClick} role="button" tabIndex={0}
      sx={{
        cursor: 'pointer', px: 1.25, py: 0.625, borderRadius: 1,
        bgcolor: active ? color : bg, color: active ? '#fff' : color,
        border: `1px solid ${active ? color : `${color}25`}`,
        fontSize: 12, fontWeight: 700, letterSpacing: '0.02em',
        whiteSpace: 'nowrap', transition: 'all 120ms ease',
        '&:hover': { bgcolor: active ? color : `${color}18` },
      }}>
      {label} · {count}
    </Box>
  );
}

function ActionBtn({ href, icon: Icon, color, title, external }) {
  return (
    <Tooltip title={title}>
      <Box component="a" href={href} target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        sx={{
          width: 28, height: 28, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: `${color}15`, color, textDecoration: 'none',
          '&:hover': { bgcolor: `${color}25` },
        }}>
        <Icon sx={{ fontSize: 14 }} />
      </Box>
    </Tooltip>
  );
}

function NewLeadDialog({ open, onClose, onCreated, setSnack }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', profesion: '', empresa: '', ciudad: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async () => {
    if (!form.nombre.trim()) { setSnack({ severity: 'error', msg: 'Nombre es requerido' }); return; }
    setSaving(true);
    try {
      await salesApi.createLead(form);
      setSnack({ severity: 'success', msg: 'Lead creado' });
      setForm({ nombre: '', email: '', telefono: '', profesion: '', empresa: '', ciudad: '' });
      onCreated();
    } catch (e) { setSnack({ severity: 'error', msg: e.message }); }
    finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#272F50' }}>Nuevo lead</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
          <TextField label="Nombre *" value={form.nombre} onChange={set('nombre')} size="small" />
          <TextField label="Profesión" value={form.profesion} onChange={set('profesion')} size="small" select>
            {['Audióloga','Fonoaudióloga','ORL','Centro auditivo','Otro'].map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
          </TextField>
          <TextField label="Email" type="email" value={form.email} onChange={set('email')} size="small" />
          <TextField label="Teléfono" value={form.telefono} onChange={set('telefono')} size="small" />
          <TextField label="Empresa / Centro" value={form.empresa} onChange={set('empresa')} size="small" />
          <TextField label="Ciudad" value={form.ciudad} onChange={set('ciudad')} size="small" />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#5b6b7a' }}>Cancelar</Button>
        <Button onClick={submit} disabled={saving} variant="contained"
          sx={{ bgcolor: '#085946', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#064a38' } }}>
          {saving ? 'Guardando…' : 'Crear lead'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
