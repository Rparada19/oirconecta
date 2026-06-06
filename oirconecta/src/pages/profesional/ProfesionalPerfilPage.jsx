import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Grid, Tabs, Tab, CircularProgress, Alert, Snackbar,
  Chip, IconButton, Divider, FormControlLabel, Checkbox, Stack,
} from '@mui/material';
import { AddOutlined, Close, SaveOutlined } from '@mui/icons-material';
import { directoryApi } from '../../services/directoryAccountApi';
import { DIRECTORY_API } from '../../config/directoryApi';
import { getServiciosSugeridos } from '../../config/serviciosPorProfesion';
import PhotoUploader from '../../components/profesional/PhotoUploader';

const glassCard = {
  background: 'rgba(255,255,255,0.90)',
  backdropFilter: 'blur(20px)',
  borderRadius: '22px',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
};
const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };
const GREEN = '#085946';

const POLIZAS = ['Sura','Sanitas','Compensar','Nueva EPS','Coomeva','Colsanitas','Famisanar','Aliansalud','SOS','Particular','Otra'];
const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const DIAS_KEYS = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
const MODALIDADES = ['Presencial','Virtual','Domicilio'];
const POBLACIONES = ['Niños','Adultos','Tercera edad'];
const PAGOS = ['Efectivo','Tarjeta','Transferencia','Daviplata','Nequi'];
const IDIOMAS_LIST = ['Español','Inglés','Francés','Portugués','Lengua de señas'];
const MARCAS_AUDIFONOS = ['Widex','Oticon','Signia','Phonak','ReSound','Starkey','Beltone','Rexton','Audioservice','Bernafon','Hansaton','Sonic','Unitron'];
const MARCAS_IMPLANTES = ['Cochlear','Advanced Bionics','MED-EL'];

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

function SectionTitle({ children }) {
  return <Typography sx={{ fontWeight: 700, fontSize: 15, color: GREEN, mb: 2 }}>{children}</Typography>;
}

function ChipToggle({ options, selected, onChange }) {
  const toggle = (opt) => {
    const next = selected.includes(opt) ? selected.filter(x => x !== opt) : [...selected, opt];
    onChange(next);
  };
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {options.map(opt => {
        const on = selected.includes(opt);
        return (
          <Chip key={opt} label={opt} clickable onClick={() => toggle(opt)}
            sx={{ fontWeight: 600, borderRadius: '10px',
              bgcolor: on ? GREEN : 'rgba(8,89,70,0.08)',
              color: on ? '#fff' : GREEN,
              border: on ? `1px solid ${GREEN}` : '1px solid rgba(8,89,70,0.25)',
              '&:hover': { bgcolor: on ? '#064a38' : 'rgba(8,89,70,0.14)' },
            }} />
        );
      })}
    </Box>
  );
}

function StringListField({ label, placeholder, values, onChange }) {
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#041a12' }}>{label}</Typography>
      {values.map((v, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField fullWidth size="small" value={v} placeholder={placeholder || 'https://...'}
            onChange={e => { const n = [...values]; n[i] = e.target.value; onChange(n); }}
            sx={fieldSx} />
          <IconButton size="small" onClick={() => onChange(values.filter((_, idx) => idx !== i))} sx={{ color: '#EF4444' }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Button size="small" startIcon={<AddOutlined />} onClick={() => onChange([...values, ''])}
        sx={{ textTransform: 'none', color: GREEN, fontWeight: 600 }}>
        Agregar
      </Button>
    </Box>
  );
}

function ServiciosEditor({ servicios, onChange, profesion, profesionesAdicionales = [], esEmpresa = false }) {
  function add(nombre = '', prof = '') { onChange([...servicios, { nombre, descripcion: '', precio: '', duracion: '', profesion: prof }]); }
  function remove(i) { onChange(servicios.filter((_, idx) => idx !== i)); }
  function update(i, field, val) { const n = servicios.map((s, idx) => idx === i ? { ...s, [field]: val } : s); onChange(n); }

  // Lista única de profesiones a sugerir (sin duplicados)
  const profesionesActivas = Array.from(new Set([profesion, ...(profesionesAdicionales || [])].filter(Boolean)));
  const yaAgregados = new Set(servicios.map((s) => (s.nombre || '').trim().toLowerCase()));

  return (
    <Box>
      {profesionesActivas.length === 0 && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
          Define tu <strong>profesión</strong> en la pestaña <strong>Datos básicos</strong> y aparecerán automáticamente los servicios típicos de tu especialidad listos para agregar con un click.
        </Alert>
      )}

      {profesionesActivas.map((prof) => {
        const sugeridos = getServiciosSugeridos(prof);
        if (sugeridos.length === 0) return null;
        return (
          <Box key={prof} sx={{ mb: 3, p: 2, borderRadius: '12px', bgcolor: 'rgba(8,89,70,0.04)', border: '1px dashed rgba(8,89,70,0.25)' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: GREEN, mb: 1.5 }}>
              {esEmpresa ? `Servicios de ${prof}` : 'Servicios sugeridos para tu profesión'}
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 1.5 }}>
              Haz clic en cualquier servicio para agregarlo a tu perfil. Puedes ajustar precio, duración y descripción después.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {sugeridos.map((s) => {
                const isAdded = yaAgregados.has(s.toLowerCase());
                return (
                  <Chip
                    key={s}
                    label={s}
                    size="small"
                    onClick={isAdded ? undefined : () => add(s, prof)}
                    icon={isAdded ? <Close style={{ fontSize: 14, color: 'rgba(8,89,70,0.6)' }} /> : <AddOutlined style={{ fontSize: 14 }} />}
                    sx={{
                      cursor: isAdded ? 'default' : 'pointer',
                      bgcolor: isAdded ? 'rgba(8,89,70,0.12)' : '#fff',
                      color: isAdded ? 'rgba(8,89,70,0.7)' : GREEN,
                      border: '1px solid rgba(8,89,70,0.25)',
                      fontWeight: 600,
                      '&:hover': { bgcolor: isAdded ? 'rgba(8,89,70,0.12)' : 'rgba(8,89,70,0.08)' },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        );
      })}

      {servicios.map((s, i) => (
        <Card key={i} elevation={0} sx={{ mb: 2, p: 2, borderRadius: '14px', border: '1px solid rgba(8,89,70,0.15)', bgcolor: 'rgba(8,89,70,0.02)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: GREEN }}>Servicio {i + 1}</Typography>
              {esEmpresa && s.profesion && (
                <Chip size="small" label={s.profesion} sx={{ bgcolor: 'rgba(8,89,70,0.10)', color: GREEN, fontWeight: 600, height: 20, fontSize: '0.65rem' }} />
              )}
            </Box>
            <IconButton size="small" onClick={() => remove(i)} sx={{ color: '#EF4444' }}><Close fontSize="small" /></IconButton>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={esEmpresa ? 4 : 6}><TextField fullWidth size="small" label="Nombre del servicio *" value={s.nombre} onChange={e => update(i, 'nombre', e.target.value)} sx={fieldSx} /></Grid>
            {esEmpresa && (
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel>Profesión</InputLabel>
                  <Select value={s.profesion || ''} label="Profesión" onChange={e => update(i, 'profesion', e.target.value)}>
                    <MenuItem value="">— Sin asociar —</MenuItem>
                    {profesionesActivas.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={6} sm={esEmpresa ? 2 : 3}><TextField fullWidth size="small" label="Precio (COP)" value={s.precio} onChange={e => update(i, 'precio', e.target.value)} placeholder="Ej: 80000" sx={fieldSx} /></Grid>
            <Grid item xs={6} sm={esEmpresa ? 2 : 3}><TextField fullWidth size="small" label="Duración" value={s.duracion} onChange={e => update(i, 'duracion', e.target.value)} placeholder="Ej: 50 min" sx={fieldSx} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Descripción" value={s.descripcion} onChange={e => update(i, 'descripcion', e.target.value)} multiline rows={2} sx={fieldSx} /></Grid>
          </Grid>
        </Card>
      ))}
      <Button startIcon={<AddOutlined />} onClick={() => add('')} variant="outlined" size="small"
        sx={{ borderRadius: '10px', textTransform: 'none', borderColor: GREEN, color: GREEN, fontWeight: 700 }}>
        + Agregar servicio personalizado
      </Button>
    </Box>
  );
}

function QAEditor({ qaList, onChange }) {
  function add() { onChange([...qaList, { pregunta: '', respuesta: '' }]); }
  function remove(i) { onChange(qaList.filter((_, idx) => idx !== i)); }
  function update(i, field, val) { const n = qaList.map((q, idx) => idx === i ? { ...q, [field]: val } : q); onChange(n); }
  return (
    <Box>
      {qaList.map((q, i) => (
        <Card key={i} elevation={0} sx={{ mb: 2, p: 2, borderRadius: '14px', border: '1px solid rgba(8,89,70,0.15)', bgcolor: 'rgba(8,89,70,0.02)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: GREEN }}>Pregunta {i + 1}</Typography>
            <IconButton size="small" onClick={() => remove(i)} sx={{ color: '#EF4444' }}><Close fontSize="small" /></IconButton>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField fullWidth size="small" label="Pregunta" value={q.pregunta} onChange={e => update(i, 'pregunta', e.target.value)} sx={fieldSx} /></Grid>
            <Grid item xs={12}><TextField fullWidth size="small" label="Respuesta" value={q.respuesta} onChange={e => update(i, 'respuesta', e.target.value)} multiline rows={3} sx={fieldSx} /></Grid>
          </Grid>
        </Card>
      ))}
      <Button startIcon={<AddOutlined />} onClick={add} variant="outlined" size="small"
        sx={{ borderRadius: '10px', textTransform: 'none', borderColor: GREEN, color: GREEN, fontWeight: 700 }}>
        + Agregar pregunta
      </Button>
    </Box>
  );
}

function WorkplaceList({ workplaces, onChange }) {
  function add() { onChange([...workplaces, { nombreCentro: '', ciudad: '', direccion: '', telefono: '', esPrincipal: false }]); }
  function remove(i) { onChange(workplaces.filter((_, idx) => idx !== i)); }
  function update(i, field, val) { const n = workplaces.map((w, idx) => idx === i ? { ...w, [field]: val } : w); onChange(n); }
  return (
    <Box>
      {workplaces.map((w, i) => (
        <Card key={i} elevation={0} sx={{ mb: 2, p: 2, borderRadius: '14px', border: '1px solid rgba(8,89,70,0.15)', bgcolor: 'rgba(8,89,70,0.02)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: GREEN }}>Sede {i + 1}</Typography>
            <IconButton size="small" onClick={() => remove(i)} sx={{ color: '#EF4444' }}><Close fontSize="small" /></IconButton>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Nombre del centro" value={w.nombreCentro} onChange={e => update(i, 'nombreCentro', e.target.value)} sx={fieldSx} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Ciudad" value={w.ciudad} onChange={e => update(i, 'ciudad', e.target.value)} sx={fieldSx} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Dirección" value={w.direccion} onChange={e => update(i, 'direccion', e.target.value)} sx={fieldSx} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Teléfono" value={w.telefono} onChange={e => update(i, 'telefono', e.target.value)} sx={fieldSx} /></Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={!!w.esPrincipal} onChange={e => update(i, 'esPrincipal', e.target.checked)} sx={{ color: GREEN, '&.Mui-checked': { color: GREEN } }} />}
                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Sede principal</Typography>} />
            </Grid>
          </Grid>
        </Card>
      ))}
      <Button startIcon={<AddOutlined />} onClick={add} variant="outlined" size="small"
        sx={{ borderRadius: '10px', textTransform: 'none', borderColor: GREEN, color: GREEN, fontWeight: 700 }}>
        + Agregar sede
      </Button>
    </Box>
  );
}

function DisponibilidadEditor({ disponibilidad, onChange }) {
  const [days, setDays] = useState(() => {
    const r = {};
    DIAS_KEYS.forEach(k => { r[k] = { activo: !!(disponibilidad && disponibilidad[k]), inicio: disponibilidad?.[k]?.inicio || '08:00', fin: disponibilidad?.[k]?.fin || '17:00' }; });
    return r;
  });
  useEffect(() => {
    const r = {};
    DIAS_KEYS.forEach(k => { if (days[k].activo) r[k] = { inicio: days[k].inicio, fin: days[k].fin }; });
    onChange(r);
  }, [days]);
  return (
    <Box>
      {DIAS.map((d, i) => {
        const k = DIAS_KEYS[i];
        return (
          <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
            <FormControlLabel sx={{ minWidth: 120 }}
              control={<Checkbox checked={days[k].activo} onChange={() => setDays(p => ({ ...p, [k]: { ...p[k], activo: !p[k].activo } }))} sx={{ color: GREEN, '&.Mui-checked': { color: GREEN } }} />}
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{d}</Typography>} />
            {days[k].activo && (<>
              <TextField size="small" type="time" label="Desde" value={days[k].inicio}
                onChange={e => setDays(p => ({ ...p, [k]: { ...p[k], inicio: e.target.value } }))}
                sx={{ width: 140, ...fieldSx }} InputLabelProps={{ shrink: true }} />
              <TextField size="small" type="time" label="Hasta" value={days[k].fin}
                onChange={e => setDays(p => ({ ...p, [k]: { ...p[k], fin: e.target.value } }))}
                sx={{ width: 140, ...fieldSx }} InputLabelProps={{ shrink: true }} />
            </>)}
          </Box>
        );
      })}
    </Box>
  );
}

const EMPTY_FORM = {
  nombreConsultorio: '', profesion: '', profesionesAdicionales: [], generoFicha: '', descripcion: '',
  personaTipo: '', documentoIdentidad: '', registroProfesional: '', anosExperiencia: '',
  telefonoPublico: '', whatsappPublico: '', emailPublico: '', direccionPublica: '',
  fotoPerfilUrl: '', bannerUrl: '',
  googleMapsEmbedUrl: '', googleMapsLugarUrl: '',
  photoUrls: [], videoUrls: [],
  redesSociales: { instagram: '', facebook: '', linkedin: '', youtube: '', tiktok: '', web: '' },
  servicios: [],
  allies: [], // marcas
  polizasAceptadas: [],
  idiomas: [], modalidadAtencion: [], poblacionAtiende: [], metodoPago: [],
  studies: [], // estudios y reconocimientos [{ titulo, institucion, anio }]
  workplaces: [],
  availability: {},
  qaList: [],
  blogMarkdown: '',
};

export default function ProfesionalPerfilPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    directoryApi.get(DIRECTORY_API.me).then(({ data, error: err }) => {
      if (err) { setError(err); setLoading(false); return; }
      const d = data?.data || {};
      setForm({
        nombreConsultorio: d.nombreConsultorio || '',
        profesion: d.profesion || '',
        profesionesAdicionales: Array.isArray(d.profesionesAdicionales) ? d.profesionesAdicionales : [],
        generoFicha: d.generoFicha || '',
        descripcion: d.descripcion || '',
        personaTipo: d.personaTipo || '',
        documentoIdentidad: d.documentoIdentidad || '',
        registroProfesional: d.registroProfesional || '',
        anosExperiencia: d.anosExperiencia ?? '',
        telefonoPublico: d.telefonoPublico || '',
        whatsappPublico: d.whatsappPublico || '',
        emailPublico: d.emailPublico || '',
        direccionPublica: d.direccionPublica || '',
        fotoPerfilUrl: d.fotoPerfilUrl || '',
        bannerUrl: d.bannerUrl || '',
        googleMapsEmbedUrl: d.googleMapsEmbedUrl || '',
        googleMapsLugarUrl: d.googleMapsLugarUrl || '',
        photoUrls: d.photoUrls || [],
        videoUrls: d.videoUrls || [],
        redesSociales: d.redesSociales || { instagram: '', facebook: '', linkedin: '', youtube: '', tiktok: '', web: '' },
        servicios: d.servicios || [],
        allies: d.allies || [],
        polizasAceptadas: d.polizasAceptadas || [],
        idiomas: d.idiomas || [],
        modalidadAtencion: d.modalidadAtencion || [],
        poblacionAtiende: d.poblacionAtiende || [],
        metodoPago: d.metodoPago || [],
        studies: d.studies || [],
        workplaces: d.workplaces || [],
        availability: d.availability || {},
        qaList: d.qaList || [],
        blogMarkdown: d.blogMarkdown || '',
      });
      setLoading(false);
    });
  }, []);

  function f(key) { return { value: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) }; }
  function set(key, val) { setForm(p => ({ ...p, [key]: val })); }
  function setRed(key, val) { setForm(p => ({ ...p, redesSociales: { ...p.redesSociales, [key]: val } })); }

  async function handleSave() {
    setSaving(true); setError('');
    const payload = { ...form, anosExperiencia: form.anosExperiencia === '' ? null : Number(form.anosExperiencia) };
    const { error: err } = await directoryApi.patch(DIRECTORY_API.me, payload);
    setSaving(false);
    if (err) { setError(err); setSnack({ open: true, msg: `Error: ${err}`, sev: 'error' }); }
    else setSnack({ open: true, msg: 'Perfil actualizado correctamente', sev: 'success' });
  }

  const TABS = [
    'Datos básicos','Contacto','Redes sociales','Servicios','Marcas',
    'Aseguradoras','Estudios','Horarios','Galería','Preguntas','Blog',
  ];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: GREEN }} /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#041a12', letterSpacing: '-0.5px' }}>Mi perfil</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Edita la información que aparece en tu ficha pública del directorio</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

      <Card elevation={0} sx={glassCard}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
            sx={{ mb: 0, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' }, '& .Mui-selected': { color: GREEN, fontWeight: 700 }, '& .MuiTabs-indicator': { bgcolor: GREEN } }}>
            {TABS.map((t, i) => <Tab key={i} label={t} />)}
          </Tabs>
          <Divider sx={{ mb: 0 }} />

          {/* 0 — Datos básicos */}
          <TabPanel value={tab} index={0}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Nombre / Consultorio / Centro *" {...f('nombreConsultorio')} sx={fieldSx} /></Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={fieldSx}>
                  <InputLabel>{form.personaTipo === 'JURIDICA' ? 'Profesión principal' : 'Profesión'}</InputLabel>
                  <Select value={form.profesion} label={form.personaTipo === 'JURIDICA' ? 'Profesión principal' : 'Profesión'} onChange={e => set('profesion', e.target.value)}>
                    {['Audiología','Fonoaudiología','Otorrinolaringología','Otología'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              {form.personaTipo === 'JURIDICA' && (
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: GREEN, mb: 1 }}>
                    Profesiones adicionales en el centro
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 1.5 }}>
                    Selecciona todas las profesiones que se prestan en tu centro. Los servicios sugeridos se mostrarán agrupados por cada una.
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {['Audiología','Fonoaudiología','Otorrinolaringología','Otología']
                      .filter(p => p !== form.profesion)
                      .map(p => {
                        const checked = form.profesionesAdicionales.includes(p);
                        return (
                          <Chip key={p} label={p} clickable
                            onClick={() => {
                              const cur = form.profesionesAdicionales;
                              set('profesionesAdicionales', checked ? cur.filter(x => x !== p) : [...cur, p]);
                            }}
                            sx={{
                              bgcolor: checked ? GREEN : '#fff',
                              color: checked ? '#fff' : GREEN,
                              border: `1px solid ${GREEN}`,
                              fontWeight: 600,
                              '&:hover': { bgcolor: checked ? '#064a3a' : 'rgba(8,89,70,0.08)' },
                            }} />
                        );
                      })}
                  </Box>
                </Grid>
              )}
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth sx={fieldSx}>
                  <InputLabel>Tipo de cuenta</InputLabel>
                  <Select value={form.personaTipo} label="Tipo de cuenta" onChange={e => set('personaTipo', e.target.value)}>
                    <MenuItem value="NATURAL">Profesional independiente</MenuItem>
                    <MenuItem value="JURIDICA">Centro / Clínica / Empresa</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth sx={fieldSx}>
                  <InputLabel>Género de la ficha</InputLabel>
                  <Select value={form.generoFicha} label="Género de la ficha" onChange={e => set('generoFicha', e.target.value)}>
                    <MenuItem value="">Neutro</MenuItem>
                    <MenuItem value="MASCULINO">Masculino</MenuItem>
                    <MenuItem value="FEMENINO">Femenino</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Años de experiencia" type="number" {...f('anosExperiencia')} sx={fieldSx} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Cédula / NIT" {...f('documentoIdentidad')} sx={fieldSx} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Tarjeta profesional (RETHUS)" {...f('registroProfesional')} placeholder="Ej: 25000-XXX" sx={fieldSx} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline rows={4} label="Descripción pública *" {...f('descripcion')} sx={fieldSx} helperText="Escribe en primera persona. Sé específico sobre tu especialidad y enfoque." /></Grid>
              <Grid item xs={12}>
                <SectionTitle>Modalidad de atención</SectionTitle>
                <ChipToggle options={MODALIDADES} selected={form.modalidadAtencion} onChange={v => set('modalidadAtencion', v)} />
              </Grid>
              <Grid item xs={12}>
                <SectionTitle>Población que atiendes</SectionTitle>
                <ChipToggle options={POBLACIONES} selected={form.poblacionAtiende} onChange={v => set('poblacionAtiende', v)} />
              </Grid>
              <Grid item xs={12}>
                <SectionTitle>Idiomas de atención</SectionTitle>
                <ChipToggle options={IDIOMAS_LIST} selected={form.idiomas} onChange={v => set('idiomas', v)} />
              </Grid>
            </Grid>
          </TabPanel>

          {/* 1 — Contacto */}
          <TabPanel value={tab} index={1}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Teléfono público" {...f('telefonoPublico')} placeholder="+57 300 000 0000" sx={fieldSx} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="WhatsApp (con código de país)" {...f('whatsappPublico')} placeholder="573157939569" sx={fieldSx} helperText="Solo números, sin espacios ni + (ej: 573157939569)" /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Email público" type="email" {...f('emailPublico')} sx={fieldSx} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Dirección principal" {...f('direccionPublica')} sx={fieldSx} /></Grid>
              <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Google Maps — iframe embed" {...f('googleMapsEmbedUrl')} multiline rows={3} sx={fieldSx} helperText='En Google Maps → Compartir → Insertar mapa → copia el iframe completo' /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Google Maps — enlace del lugar" {...f('googleMapsLugarUrl')} placeholder="https://maps.app.goo.gl/..." sx={fieldSx} /></Grid>
              <Grid item xs={12}>
                <SectionTitle>Métodos de pago aceptados</SectionTitle>
                <ChipToggle options={PAGOS} selected={form.metodoPago} onChange={v => set('metodoPago', v)} />
              </Grid>
            </Grid>
          </TabPanel>

          {/* 2 — Redes sociales */}
          <TabPanel value={tab} index={2}>
            <Grid container spacing={2.5}>
              {[
                { key: 'instagram', label: 'Instagram', ph: 'https://instagram.com/tu_usuario' },
                { key: 'facebook',  label: 'Facebook',  ph: 'https://facebook.com/tu_pagina' },
                { key: 'linkedin',  label: 'LinkedIn',  ph: 'https://linkedin.com/in/tu_perfil' },
                { key: 'youtube',   label: 'YouTube',   ph: 'https://youtube.com/@tu_canal' },
                { key: 'tiktok',    label: 'TikTok',    ph: 'https://tiktok.com/@tu_usuario' },
                { key: 'web',       label: 'Sitio web', ph: 'https://tu-sitio.com' },
              ].map(({ key, label, ph }) => (
                <Grid item xs={12} sm={6} key={key}>
                  <TextField fullWidth label={label} value={form.redesSociales[key] || ''} onChange={e => setRed(key, e.target.value)} placeholder={ph} sx={fieldSx} />
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* 3 — Servicios */}
          <TabPanel value={tab} index={3}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Lista los servicios que ofreces. El precio es opcional.
            </Typography>
            <ServiciosEditor servicios={form.servicios} onChange={v => set('servicios', v)}
              profesion={form.profesion}
              profesionesAdicionales={form.profesionesAdicionales}
              esEmpresa={form.personaTipo === 'JURIDICA'} />
          </TabPanel>

          {/* 4 — Marcas */}
          <TabPanel value={tab} index={4}>
            <SectionTitle>Audífonos</SectionTitle>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Widex, Oticon, Signia, Phonak, ReSound, Starkey, Beltone, Rexton, Audioservice, Bernafon, Hansaton, Sonic, Unitron</Typography>
            <ChipToggle
              options={MARCAS_AUDIFONOS}
              selected={(Array.isArray(form.allies) ? form.allies : []).filter(a => MARCAS_AUDIFONOS.includes(a))}
              onChange={v => set('allies', [...v, ...(Array.isArray(form.allies) ? form.allies.filter(a => MARCAS_IMPLANTES.includes(a)) : [])])}
            />
            <Divider sx={{ my: 3 }} />
            <SectionTitle>Implantes cocleares</SectionTitle>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Cochlear, Advanced Bionics, MED-EL</Typography>
            <ChipToggle
              options={MARCAS_IMPLANTES}
              selected={(Array.isArray(form.allies) ? form.allies : []).filter(a => MARCAS_IMPLANTES.includes(a))}
              onChange={v => set('allies', [...v, ...(Array.isArray(form.allies) ? form.allies.filter(a => MARCAS_AUDIFONOS.includes(a)) : [])])}
            />
          </TabPanel>

          {/* 5 — Aseguradoras */}
          <TabPanel value={tab} index={5}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Selecciona las aseguradoras / EPS con las que trabajas.</Typography>
            <ChipToggle options={POLIZAS} selected={form.polizasAceptadas} onChange={v => set('polizasAceptadas', v)} />
          </TabPanel>

          {/* 6 — Estudios y reconocimientos */}
          <TabPanel value={tab} index={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Agrega tus títulos, especializaciones, certificaciones y reconocimientos.</Typography>
            {(Array.isArray(form.studies) ? form.studies : []).map((s, i) => (
              <Card key={i} elevation={0} sx={{ mb: 2, p: 2, borderRadius: '14px', border: '1px solid rgba(8,89,70,0.15)', bgcolor: 'rgba(8,89,70,0.02)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: GREEN }}>Estudio {i + 1}</Typography>
                  <IconButton size="small" onClick={() => set('studies', form.studies.filter((_, idx) => idx !== i))} sx={{ color: '#EF4444' }}><Close fontSize="small" /></IconButton>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Título / Certificación" value={s.titulo || ''} onChange={e => { const n = [...form.studies]; n[i] = { ...n[i], titulo: e.target.value }; set('studies', n); }} sx={fieldSx} /></Grid>
                  <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Institución" value={s.institucion || ''} onChange={e => { const n = [...form.studies]; n[i] = { ...n[i], institucion: e.target.value }; set('studies', n); }} sx={fieldSx} /></Grid>
                  <Grid item xs={12} sm={2}><TextField fullWidth size="small" label="Año" value={s.anio || ''} onChange={e => { const n = [...form.studies]; n[i] = { ...n[i], anio: e.target.value }; set('studies', n); }} sx={fieldSx} /></Grid>
                </Grid>
              </Card>
            ))}
            <Button startIcon={<AddOutlined />} onClick={() => set('studies', [...(Array.isArray(form.studies) ? form.studies : []), { titulo: '', institucion: '', anio: '' }])} variant="outlined" size="small"
              sx={{ borderRadius: '10px', textTransform: 'none', borderColor: GREEN, color: GREEN, fontWeight: 700 }}>
              + Agregar estudio
            </Button>
          </TabPanel>

          {/* 7 — Horarios y sedes */}
          <TabPanel value={tab} index={7}>
            <SectionTitle>Horarios de atención</SectionTitle>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Marca los días en que atiendes y el horario correspondiente.</Typography>
            <DisponibilidadEditor disponibilidad={form.availability} onChange={v => set('availability', v)} />
            <Divider sx={{ my: 3 }} />
            <SectionTitle>Sedes / Consultorios</SectionTitle>
            <WorkplaceList workplaces={form.workplaces} onChange={v => set('workplaces', v)} />
          </TabPanel>

          {/* 8 — Galería */}
          <TabPanel value={tab} index={8}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <SectionTitle>Foto de perfil</SectionTitle>
                <PhotoUploader
                  value={form.fotoPerfilUrl}
                  onChange={(url) => set('fotoPerfilUrl', url)}
                  label="Subir foto de perfil"
                  aspectRatio="1/1"
                  hint="Cuadrada, idealmente 600×600 px. Aparece en tu tarjeta del directorio."
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <SectionTitle>Banner / cabecera</SectionTitle>
                <PhotoUploader
                  value={form.bannerUrl}
                  onChange={(url) => set('bannerUrl', url)}
                  label="Subir banner"
                  aspectRatio="3/1"
                  hint="Imagen ancha, 1800×600 px aprox. Aparece encima de tu ficha pública."
                />
              </Grid>
              <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
              <Grid item xs={12}>
                <SectionTitle>Fotos adicionales</SectionTitle>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Hasta {form.photoUrls.length} fotos extras: consultorio, equipo, ambiente, etc.
                </Typography>
                <Grid container spacing={2}>
                  {form.photoUrls.map((url, i) => (
                    <Grid item xs={6} sm={3} key={i}>
                      <PhotoUploader
                        value={url}
                        onChange={(u) => {
                          const next = [...form.photoUrls];
                          if (u) next[i] = u; else next.splice(i, 1);
                          set('photoUrls', next);
                        }}
                        label="Subir foto"
                        aspectRatio="1/1"
                        maxMB={8}
                      />
                    </Grid>
                  ))}
                  <Grid item xs={6} sm={3}>
                    <PhotoUploader
                      value=""
                      onChange={(u) => { if (u) set('photoUrls', [...form.photoUrls, u]); }}
                      label="+ Agregar foto"
                      aspectRatio="1/1"
                      maxMB={8}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
              <Grid item xs={12}>
                <StringListField label="Videos (URLs de YouTube o Vimeo)" placeholder="https://youtube.com/watch?v=..." values={form.videoUrls} onChange={v => set('videoUrls', v)} />
              </Grid>
            </Grid>
          </TabPanel>

          {/* 9 — Preguntas y respuestas */}
          <TabPanel value={tab} index={9}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Responde las preguntas frecuentes de tus pacientes. Aparecen en tu ficha pública.
            </Typography>
            <QAEditor qaList={form.qaList} onChange={v => set('qaList', v)} />
          </TabPanel>

          {/* 10 — Blog */}
          <TabPanel value={tab} index={10}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Escribe artículos en formato Markdown. Aparecen en tu ficha pública y pueden destacarse en el blog de OírConecta.
            </Typography>
            <TextField fullWidth multiline rows={16} label="Contenido (Markdown)" value={form.blogMarkdown}
              onChange={e => set('blogMarkdown', e.target.value)} sx={fieldSx}
              helperText="Usa ## para títulos, **negrita**, - para listas" />
          </TabPanel>

        </CardContent>
      </Card>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" size="large" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
          sx={{ bgcolor: GREEN, borderRadius: '12px', fontWeight: 800, textTransform: 'none', px: 4, '&:hover': { bgcolor: '#064a38' } }}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </Box>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.sev} sx={{ borderRadius: '12px', fontWeight: 600 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
