import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Divider,
  FormControlLabel,
  Checkbox,
  Stack,
} from '@mui/material';
import { AddOutlined, Close, SaveOutlined } from '@mui/icons-material';
import { directoryApi } from '../../services/directoryAccountApi';
import { DIRECTORY_API } from '../../config/directoryApi';

const glassCard = {
  background: 'rgba(255,255,255,0.90)',
  backdropFilter: 'blur(20px)',
  borderRadius: '22px',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
};

const POLIZAS = [
  'Sura', 'Sanitas', 'Compensar', 'Nueva EPS', 'Coomeva',
  'Colsanitas', 'Famisanar', 'Aliansalud', 'SOS', 'Particular', 'Otra',
];

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_KEYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

function StringListField({ label, values, onChange }) {
  function add() {
    onChange([...values, '']);
  }
  function remove(i) {
    onChange(values.filter((_, idx) => idx !== i));
  }
  function update(i, val) {
    const next = [...values];
    next[i] = val;
    onChange(next);
  }
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#041a12' }}>
        {label}
      </Typography>
      {values.map((v, i) => (
        <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            fullWidth
            size="small"
            value={v}
            onChange={(e) => update(i, e.target.value)}
            placeholder="https://..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <IconButton size="small" onClick={() => remove(i)} sx={{ color: '#EF4444' }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Button
        size="small"
        startIcon={<AddOutlined />}
        onClick={add}
        sx={{ textTransform: 'none', color: '#085946', fontWeight: 600 }}
      >
        Agregar
      </Button>
    </Box>
  );
}

function WorkplaceList({ workplaces, onChange }) {
  function add() {
    onChange([...workplaces, { nombreCentro: '', ciudad: '', direccion: '', telefono: '', esPrincipal: false }]);
  }
  function remove(i) {
    onChange(workplaces.filter((_, idx) => idx !== i));
  }
  function update(i, field, val) {
    const next = workplaces.map((w, idx) => (idx === i ? { ...w, [field]: val } : w));
    onChange(next);
  }
  return (
    <Box>
      {workplaces.map((w, i) => (
        <Card key={i} elevation={0} sx={{ mb: 2, p: 2, borderRadius: '14px', border: '1px solid rgba(8,89,70,0.15)', bgcolor: 'rgba(8,89,70,0.03)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#085946' }}>
              Sede {i + 1}
            </Typography>
            <IconButton size="small" onClick={() => remove(i)} sx={{ color: '#EF4444' }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Nombre del centro" value={w.nombreCentro} onChange={(e) => update(i, 'nombreCentro', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Ciudad" value={w.ciudad} onChange={(e) => update(i, 'ciudad', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Dirección" value={w.direccion} onChange={(e) => update(i, 'direccion', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Teléfono" value={w.telefono} onChange={(e) => update(i, 'telefono', e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={!!w.esPrincipal} onChange={(e) => update(i, 'esPrincipal', e.target.checked)} sx={{ color: '#085946', '&.Mui-checked': { color: '#085946' } }} />}
                label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Sede principal</Typography>}
              />
            </Grid>
          </Grid>
        </Card>
      ))}
      <Button startIcon={<AddOutlined />} onClick={add} variant="outlined" size="small"
        sx={{ borderRadius: '10px', textTransform: 'none', borderColor: '#085946', color: '#085946', fontWeight: 700 }}>
        + Agregar sede
      </Button>
    </Box>
  );
}

function DisponibilidadEditor({ disponibilidad, onChange }) {
  const [days, setDays] = useState(() => {
    const result = {};
    DIAS_KEYS.forEach((k) => {
      result[k] = {
        activo: !!(disponibilidad && disponibilidad[k]),
        inicio: disponibilidad?.[k]?.inicio || '08:00',
        fin: disponibilidad?.[k]?.fin || '17:00',
      };
    });
    return result;
  });

  useEffect(() => {
    const result = {};
    DIAS_KEYS.forEach((k) => {
      if (days[k].activo) result[k] = { inicio: days[k].inicio, fin: days[k].fin };
    });
    onChange(result);
  }, [days]);

  function toggle(k) {
    setDays((prev) => ({ ...prev, [k]: { ...prev[k], activo: !prev[k].activo } }));
  }
  function updateTime(k, field, val) {
    setDays((prev) => ({ ...prev, [k]: { ...prev[k], [field]: val } }));
  }

  return (
    <Box>
      {DIAS.map((d, i) => {
        const k = DIAS_KEYS[i];
        return (
          <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
            <FormControlLabel
              sx={{ minWidth: 120 }}
              control={<Checkbox checked={days[k].activo} onChange={() => toggle(k)} sx={{ color: '#085946', '&.Mui-checked': { color: '#085946' } }} />}
              label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{d}</Typography>}
            />
            {days[k].activo && (
              <>
                <TextField size="small" type="time" label="Desde" value={days[k].inicio}
                  onChange={(e) => updateTime(k, 'inicio', e.target.value)}
                  sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} InputLabelProps={{ shrink: true }} />
                <TextField size="small" type="time" label="Hasta" value={days[k].fin}
                  onChange={(e) => updateTime(k, 'fin', e.target.value)}
                  sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} InputLabelProps={{ shrink: true }} />
              </>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px' } };

export default function ProfesionalPerfilPage() {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });

  const [form, setForm] = useState({
    nombreConsultorio: '',
    profesion: '',
    genero: '',
    descripcion: '',
    tipoPersona: '',
    documentoIdentidad: '',
    telefonoPublico: '',
    emailPublico: '',
    direccionPublica: '',
    fotoPerfil: '',
    fotoBanner: '',
    fotosAdicionales: [],
    videos: [],
    googleMapsEmbed: '',
    googleMapsUrl: '',
    polizasAceptadas: [],
    workplaces: [],
    disponibilidad: {},
  });

  useEffect(() => {
    directoryApi.get(DIRECTORY_API.me).then(({ data, error: err }) => {
      if (err) { setError(err); setLoading(false); return; }
      const d = data?.data || {};
      setForm({
        nombreConsultorio: d.nombreConsultorio || '',
        profesion: d.profesion || '',
        genero: d.genero || '',
        descripcion: d.descripcion || '',
        tipoPersona: d.tipoPersona || '',
        documentoIdentidad: d.documentoIdentidad || '',
        telefonoPublico: d.telefonoPublico || '',
        emailPublico: d.emailPublico || '',
        direccionPublica: d.direccionPublica || '',
        fotoPerfil: d.fotoPerfil || '',
        fotoBanner: d.fotoBanner || '',
        fotosAdicionales: d.fotosAdicionales || [],
        videos: d.videos || [],
        googleMapsEmbed: d.googleMapsEmbed || '',
        googleMapsUrl: d.googleMapsUrl || '',
        polizasAceptadas: d.polizasAceptadas || [],
        workplaces: d.workplaces || [],
        disponibilidad: d.disponibilidad || {},
      });
      setLoading(false);
    });
  }, []);

  function field(key) {
    return {
      value: form[key],
      onChange: (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    };
  }

  function togglePoliza(pol) {
    setForm((prev) => {
      const arr = prev.polizasAceptadas.includes(pol)
        ? prev.polizasAceptadas.filter((p) => p !== pol)
        : [...prev.polizasAceptadas, pol];
      return { ...prev, polizasAceptadas: arr };
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    const { data, error: err } = await directoryApi.patch(DIRECTORY_API.me, form);
    setSaving(false);
    if (err) {
      setError(err);
      setSnack({ open: true, msg: `Error al guardar: ${err}`, sev: 'error' });
    } else {
      setSnack({ open: true, msg: 'Perfil actualizado correctamente', sev: 'success' });
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: '#085946' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#041a12', letterSpacing: '-0.5px' }}>
          Mi perfil
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Edita la información que aparece en tu ficha pública del directorio
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

      <Card elevation={0} sx={glassCard}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 0,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' },
              '& .Mui-selected': { color: '#085946', fontWeight: 700 },
              '& .MuiTabs-indicator': { bgcolor: '#085946' },
            }}
          >
            <Tab label="Datos básicos" />
            <Tab label="Fotos y media" />
            <Tab label="Pólizas" />
            <Tab label="Sedes" />
            <Tab label="Disponibilidad" />
          </Tabs>

          <Divider sx={{ mb: 0 }} />

          {/* Tab 1: Datos básicos */}
          <TabPanel value={tab} index={0}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Nombre del consultorio / centro" {...field('nombreConsultorio')} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Profesión" {...field('profesion')} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={fieldSx}>
                  <InputLabel>Género de la ficha</InputLabel>
                  <Select value={form.genero} label="Género de la ficha" onChange={(e) => setForm((p) => ({ ...p, genero: e.target.value }))}>
                    <MenuItem value="masculino">Masculino</MenuItem>
                    <MenuItem value="femenino">Femenino</MenuItem>
                    <MenuItem value="neutro">Neutro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={fieldSx}>
                  <InputLabel>Tipo de persona</InputLabel>
                  <Select value={form.tipoPersona} label="Tipo de persona" onChange={(e) => setForm((p) => ({ ...p, tipoPersona: e.target.value }))}>
                    <MenuItem value="NATURAL">Natural</MenuItem>
                    <MenuItem value="JURIDICA">Jurídica</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={4} label="Descripción pública" {...field('descripcion')} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Documento de identidad" {...field('documentoIdentidad')} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Teléfono público" {...field('telefonoPublico')} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Email público" type="email" {...field('emailPublico')} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Dirección pública" {...field('direccionPublica')} sx={fieldSx} />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 2: Fotos y media */}
          <TabPanel value={tab} index={1}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="URL foto de perfil" {...field('fotoPerfil')} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="URL banner" {...field('fotoBanner')} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="URL Google Maps embed" {...field('googleMapsEmbed')} sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="URL Google Maps lugar" {...field('googleMapsUrl')} sx={fieldSx} />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ mb: 2 }} />
                <StringListField
                  label="Fotos adicionales"
                  values={form.fotosAdicionales}
                  onChange={(v) => setForm((p) => ({ ...p, fotosAdicionales: v }))}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ mb: 2 }} />
                <StringListField
                  label="Videos (URLs)"
                  values={form.videos}
                  onChange={(v) => setForm((p) => ({ ...p, videos: v }))}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 3: Pólizas */}
          <TabPanel value={tab} index={2}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Selecciona las pólizas de salud que aceptas en tu consultorio.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {POLIZAS.map((pol) => {
                const selected = form.polizasAceptadas.includes(pol);
                return (
                  <Chip
                    key={pol}
                    label={pol}
                    clickable
                    onClick={() => togglePoliza(pol)}
                    sx={{
                      fontWeight: 600,
                      borderRadius: '10px',
                      bgcolor: selected ? '#085946' : 'rgba(8,89,70,0.08)',
                      color: selected ? '#fff' : '#085946',
                      border: selected ? '1px solid #085946' : '1px solid rgba(8,89,70,0.25)',
                      '&:hover': { bgcolor: selected ? '#064a38' : 'rgba(8,89,70,0.14)' },
                    }}
                  />
                );
              })}
            </Box>
          </TabPanel>

          {/* Tab 4: Sedes */}
          <TabPanel value={tab} index={3}>
            <WorkplaceList
              workplaces={form.workplaces}
              onChange={(v) => setForm((p) => ({ ...p, workplaces: v }))}
            />
          </TabPanel>

          {/* Tab 5: Disponibilidad */}
          <TabPanel value={tab} index={4}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Marca los días en que atiendes y el horario correspondiente.
            </Typography>
            <DisponibilidadEditor
              disponibilidad={form.disponibilidad}
              onChange={(v) => setForm((p) => ({ ...p, disponibilidad: v }))}
            />
          </TabPanel>
        </CardContent>
      </Card>

      {/* Save button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
          sx={{
            bgcolor: '#085946',
            borderRadius: '12px',
            fontWeight: 800,
            textTransform: 'none',
            px: 4,
            '&:hover': { bgcolor: '#064a38' },
          }}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.sev} sx={{ borderRadius: '12px', fontWeight: 600 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
