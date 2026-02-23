import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Paper,
  InputAdornment,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Settings,
  ArrowBack,
  Save,
  Schedule,
  Notifications,
  Business,
  CalendarToday,
  Add,
  Delete,
  MeetingRoom,
  Person,
  LocationOn,
  ShoppingCart,
  Build,
  Upload,
  ExpandMore,
  ExpandLess,
  Edit,
} from '@mui/icons-material';
import { getConfig, saveConfig, addAppointmentReason, removeAppointmentReason, DEFAULT_APPOINTMENT_REASONS } from '../../services/configService';

const DIAS_SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DIAS_LABEL = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo' };

const ConfiguracionPage = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [newMotivo, setNewMotivo] = useState({ label: '', duration: 30 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    setConfig(getConfig());
  }, []);

  const handleSave = () => {
    const res = saveConfig(config);
    setSnackbar({ open: true, message: res.success ? 'Configuración guardada' : 'Error al guardar', severity: res.success ? 'success' : 'error' });
  };

  const handleChange = (section) => (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleEmpresaChange = (field) => (e) => {
    let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (e.target.type === 'file') {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => setConfig((prev) => ({ ...prev, empresa: { ...prev.empresa, logo: reader.result } }));
        reader.readAsDataURL(file);
      }
      return;
    }
    setConfig((prev) => ({ ...prev, empresa: { ...prev.empresa, [field]: value } }));
  };

  const handleHorarioDia = (dia, field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setConfig((prev) => {
      const h = prev.horarios?.horarioPorDia || {};
      return {
        ...prev,
        horarios: {
          ...prev.horarios,
          horarioPorDia: { ...h, [dia]: { ...(h[dia] || {}), [field]: value } },
        },
      };
    });
  };

  const handleAddMotivo = () => {
    if (!newMotivo.label?.trim()) return;
    const res = addAppointmentReason({ label: newMotivo.label.trim(), duration: Number(newMotivo.duration) || 30 });
    if (res.success) {
      setConfig(getConfig());
      setNewMotivo({ label: '', duration: 30 });
      setSnackbar({ open: true, message: 'Motivo agregado', severity: 'success' });
    }
  };

  const handleRemoveMotivo = (value) => {
    const m = (config?.citas?.motivosCita || []).find((x) => x.value === value);
    if (m && !m.editable) return;
    const cfg = { ...config };
    cfg.citas = { ...cfg.citas, motivosCita: (cfg.citas?.motivosCita || []).filter((x) => x.value !== value) };
    saveConfig(cfg);
    setConfig(getConfig());
    setSnackbar({ open: true, message: 'Motivo eliminado', severity: 'success' });
  };

  if (!config) return <Box sx={{ p: 4 }}>Cargando...</Box>;

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #085946 0%, #272F50 100%)', color: '#ffffff', py: 3, boxShadow: '0 4px 20px rgba(8, 89, 70, 0.2)' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Configuración del Sistema</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Ajusta los parámetros del sistema</Typography>
            </Box>
            <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/portal-crm')} sx={{ borderColor: '#fff', color: '#fff', '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
              Volver
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<Schedule />} iconPosition="start" label="Horarios" />
          <Tab icon={<CalendarToday />} iconPosition="start" label="Citas" />
          <Tab icon={<Notifications />} iconPosition="start" label="Notificaciones" />
          <Tab icon={<Business />} iconPosition="start" label="Empresa" />
          <Tab icon={<LocationOn />} iconPosition="start" label="Sedes" />
          <Tab icon={<Person />} iconPosition="start" label="Profesionales" />
          <Tab icon={<Build />} iconPosition="start" label="Servicios" />
          <Tab icon={<ShoppingCart />} iconPosition="start" label="Marketplace" />
        </Tabs>

        {/* 1. Horarios */}
        {activeTab === 0 && (
          <Card sx={{ border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50', mb: 3 }}>Horarios de Atención</Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mb: 2 }}>Horario general (para días no configurados individualmente)</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Hora Inicio" type="time" value={config.horarios?.horarioInicio || '07:00'} onChange={handleChange('horarios')('horarioInicio')} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Hora Fin" type="time" value={config.horarios?.horarioFin || '18:00'} onChange={handleChange('horarios')('horarioFin')} InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Horario por día (habilitar/deshabilitar días laborables)</Typography>
              {DIAS_SEMANA.map((dia) => {
                const h = config.horarios?.horarioPorDia?.[dia] || {};
                return (
                  <Paper key={dia} variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                      <FormControlLabel
                        control={<Switch checked={!!h.enabled} onChange={handleHorarioDia(dia, 'enabled')} color="primary" />}
                        label={DIAS_LABEL[dia]}
                      />
                      {h.enabled && (
                        <>
                          <TextField label="Inicio" type="time" size="small" value={h.inicio || '07:00'} onChange={handleHorarioDia(dia, 'inicio')} InputLabelProps={{ shrink: true }} sx={{ width: 120 }} />
                          <TextField label="Fin" type="time" size="small" value={h.fin || '18:00'} onChange={handleHorarioDia(dia, 'fin')} InputLabelProps={{ shrink: true }} sx={{ width: 120 }} />
                          <TextField label="Almuerzo Inicio" type="time" size="small" value={h.almuerzoInicio || ''} onChange={handleHorarioDia(dia, 'almuerzoInicio')} InputLabelProps={{ shrink: true }} placeholder="12:00" sx={{ width: 140 }} />
                          <TextField label="Almuerzo Fin" type="time" size="small" value={h.almuerzoFin || ''} onChange={handleHorarioDia(dia, 'almuerzoFin')} InputLabelProps={{ shrink: true }} placeholder="13:00" sx={{ width: 140 }} />
                        </>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* 2. Citas - Motivos */}
        {activeTab === 1 && (
          <Card sx={{ border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50', mb: 2 }}>Configuración de Citas</Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Duración por defecto (min)" type="number" value={config.citas?.duracionCita ?? 50} onChange={handleChange('citas')('duracionCita')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Descanso entre citas (min)" type="number" value={config.citas?.descansoEntreCitas ?? 10} onChange={handleChange('citas')('descansoEntreCitas')} />
                </Grid>
              </Grid>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Motivos de cita (predeterminados y personalizados)</Typography>
              <List>
                {(config.citas?.motivosCita || DEFAULT_APPOINTMENT_REASONS).map((m) => (
                  <ListItem key={m.value}>
                    <ListItemText primary={m.label} secondary={`${m.duration} min`} />
                    {m.editable && (
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemoveMotivo(m.value)} color="error" size="small"><Delete /></IconButton>
                      </ListItemSecondaryAction>
                    )}
                    {!m.editable && <Chip label="Predeterminado" size="small" sx={{ ml: 1 }} />}
                  </ListItem>
                ))}
              </List>
              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <TextField label="Nuevo motivo" value={newMotivo.label} onChange={(e) => setNewMotivo((p) => ({ ...p, label: e.target.value }))} size="small" sx={{ minWidth: 200 }} />
                <TextField label="Duración (min)" type="number" value={newMotivo.duration} onChange={(e) => setNewMotivo((p) => ({ ...p, duration: e.target.value }))} size="small" sx={{ width: 120 }} InputProps={{ inputProps: { min: 5, max: 120 } }} />
                <Button variant="outlined" startIcon={<Add />} onClick={handleAddMotivo} disabled={!newMotivo.label?.trim()}>Agregar</Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* 3. Notificaciones */}
        {activeTab === 2 && (
          <Card sx={{ border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50', mb: 3 }}>Notificaciones</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel control={<Switch checked={config.notificaciones?.notificacionesEmail} onChange={handleChange('notificaciones')('notificacionesEmail')} color="primary" />} label="Notificaciones por Email" />
                <FormControlLabel control={<Switch checked={config.notificaciones?.notificacionesSMS} onChange={handleChange('notificaciones')('notificacionesSMS')} color="primary" />} label="Notificaciones por SMS" />
                <FormControlLabel control={<Switch checked={config.notificaciones?.recordatorioCita} onChange={handleChange('notificaciones')('recordatorioCita')} color="primary" />} label="Recordatorio de Citas" />
                <FormControlLabel control={<Switch checked={config.notificaciones?.confirmacionAutomatica} onChange={handleChange('notificaciones')('confirmacionAutomatica')} color="primary" />} label="Confirmación Automática" />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* 4. Empresa */}
        {activeTab === 3 && (
          <Card sx={{ border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50', mb: 3 }}>Información de la Empresa</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Nombre" value={config.empresa?.nombre || ''} onChange={handleEmpresaChange('nombre')} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Representante Legal" value={config.empresa?.representanteLegal || ''} onChange={handleEmpresaChange('representanteLegal')} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Email" type="email" value={config.empresa?.email || ''} onChange={handleEmpresaChange('email')} /></Grid>
                <Grid item xs={12} sm={6}><TextField fullWidth label="Teléfono" value={config.empresa?.telefono || ''} onChange={handleEmpresaChange('telefono')} /></Grid>
                <Grid item xs={12}><TextField fullWidth label="Dirección" multiline rows={2} value={config.empresa?.direccion || ''} onChange={handleEmpresaChange('direccion')} /></Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ mb: 1 }}>Logo</Typography>
                  <Button variant="outlined" component="label">Seleccionar logo <input type="file" hidden accept="image/*" onChange={handleEmpresaChange('logo')} /></Button>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: '#86899C' }}>Las sedes se configuran en la pestaña &quot;Sedes&quot;.</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* 5. Sedes (con consultorios y profesionales habilitados) */}
        {activeTab === 4 && (
          <Card sx={{ border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50', mb: 2 }}>Sedes</Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mb: 3 }}>Cada sede aperturada debe tener consultorios y profesionales habilitados.</Typography>
              {(config.sedes || []).map((sede, si) => (
                <Paper key={sede.id} variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <TextField fullWidth label="Nombre" size="small" value={sede.nombre || ''} onChange={(e) => {
                        const sedes = [...(config.sedes || [])];
                        sedes[si] = { ...sedes[si], nombre: e.target.value };
                        setConfig((p) => ({ ...p, sedes }));
                      }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField fullWidth label="Dirección" size="small" value={sede.direccion || ''} onChange={(e) => {
                        const sedes = [...(config.sedes || [])];
                        sedes[si] = { ...sedes[si], direccion: e.target.value };
                        setConfig((p) => ({ ...p, sedes }));
                      }} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <TextField fullWidth label="Teléfono" size="small" value={sede.telefono || ''} onChange={(e) => {
                        const sedes = [...(config.sedes || [])];
                        sedes[si] = { ...sedes[si], telefono: e.target.value };
                        setConfig((p) => ({ ...p, sedes }));
                      }} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <FormControlLabel control={<Switch checked={!!sede.activo} onChange={(e) => {
                        const sedes = [...(config.sedes || [])];
                        sedes[si] = { ...sedes[si], activo: e.target.checked };
                        setConfig((p) => ({ ...p, sedes }));
                      }} color="primary" />} label="Activa" />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Consultorios</Typography>
                      {(sede.consultorios || []).map((c, ci) => (
                        <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <TextField size="small" label="Nombre" value={c.nombre || ''} onChange={(e) => {
                            const sedes = [...(config.sedes || [])];
                            const cons = [...(sedes[si].consultorios || [])];
                            cons[ci] = { ...cons[ci], nombre: e.target.value };
                            sedes[si] = { ...sedes[si], consultorios: cons };
                            setConfig((p) => ({ ...p, sedes }));
                          }} sx={{ minWidth: 180 }} />
                          <FormControlLabel control={<Switch size="small" checked={!!c.activo} onChange={(e) => {
                            const sedes = [...(config.sedes || [])];
                            const cons = [...(sedes[si].consultorios || [])];
                            cons[ci] = { ...cons[ci], activo: e.target.checked };
                            sedes[si] = { ...sedes[si], consultorios: cons };
                            setConfig((p) => ({ ...p, sedes }));
                          }} />} label="Activo" />
                          <IconButton size="small" color="error" onClick={() => {
                            const sedes = [...(config.sedes || [])];
                            sedes[si].consultorios = (sedes[si].consultorios || []).filter((_, i) => i !== ci);
                            setConfig((p) => ({ ...p, sedes }));
                          }}><Delete fontSize="small" /></IconButton>
                        </Box>
                      ))}
                      <Button size="small" startIcon={<Add />} onClick={() => {
                        const sedes = [...(config.sedes || [])];
                        const cons = sedes[si].consultorios || [];
                        cons.push({ id: `c_${Date.now()}`, nombre: `Consultorio ${cons.length + 1}`, activo: true });
                        sedes[si] = { ...sedes[si], consultorios: cons };
                        setConfig((p) => ({ ...p, sedes }));
                      }}>Agregar consultorio</Button>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Profesionales habilitados en esta sede</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {(config.profesionales || []).map((prof) => {
                          const hab = (sede.profesionalesHabilitados || []).includes(prof.id);
                          return (
                            <Chip key={prof.id} label={prof.nombre || prof.id} size="small" color={hab ? 'primary' : 'default'} variant={hab ? 'filled' : 'outlined'} onClick={() => {
                              const sedes = [...(config.sedes || [])];
                              const list = sede.profesionalesHabilitados || [];
                              const next = hab ? list.filter((id) => id !== prof.id) : [...list, prof.id];
                              sedes[si] = { ...sedes[si], profesionalesHabilitados: next };
                              setConfig((p) => ({ ...p, sedes }));
                            }} />
                          );
                        })}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              <Button startIcon={<Add />} variant="outlined" size="small" onClick={() => {
                const sedes = [...(config.sedes || [])];
                sedes.push({ id: `sede_${Date.now()}`, nombre: '', direccion: '', telefono: '', activo: true, consultorios: [{ id: `c_${Date.now()}`, nombre: 'Consultorio 1', activo: true }], profesionalesHabilitados: [] });
                setConfig((p) => ({ ...p, sedes }));
              }}>Agregar sede</Button>
            </CardContent>
          </Card>
        )}

        {/* 6. Profesionales */}
        {activeTab === 5 && (
          <Card sx={{ border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50', mb: 2 }}>Profesionales</Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mb: 3 }}>Cada profesional está atado a consultorio(s) por sede. Puedes cargar hoja de vida, asignar servicios/productos para cotizar y gestionar horarios.</Typography>
              {(config.profesionales || []).map((p, i) => (
                <Paper key={p.id} variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <TextField fullWidth label="Nombre" size="small" value={p.nombre || ''} onChange={(e) => {
                        const prof = [...(config.profesionales || [])];
                        prof[i] = { ...prof[i], nombre: e.target.value };
                        setConfig((prev) => ({ ...prev, profesionales: prof }));
                      }} />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField fullWidth label="Especialidad" size="small" value={p.especialidad || ''} onChange={(e) => {
                        const prof = [...(config.profesionales || [])];
                        prof[i] = { ...prof[i], especialidad: e.target.value };
                        setConfig((prev) => ({ ...prev, profesionales: prof }));
                      }} />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <FormControlLabel control={<Switch checked={!!p.activo} onChange={(e) => {
                        const prof = [...(config.profesionales || [])];
                        prof[i] = { ...prof[i], activo: e.target.checked };
                        setConfig((prev) => ({ ...prev, profesionales: prof }));
                      }} color="primary" />} label="Activo" />
                    </Grid>
                    <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button variant="outlined" size="small" component="label" startIcon={<Upload />}>
                        {p.cvUrl ? 'CV cargado' : 'Cargar CV'}
                        <input type="file" hidden accept=".pdf,.doc,.docx,image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const prof = [...(config.profesionales || [])];
                              prof[i] = { ...prof[i], cvUrl: reader.result, cvNombre: file.name };
                              setConfig((prev) => ({ ...prev, profesionales: prof }));
                              setSnackbar({ open: true, message: 'Hoja de vida cargada', severity: 'success' });
                            };
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </Button>
                      {p.cvUrl && (
                        <IconButton size="small" color="error" onClick={() => {
                          const prof = [...(config.profesionales || [])];
                          prof[i] = { ...prof[i], cvUrl: null, cvNombre: null };
                          setConfig((prev) => ({ ...prev, profesionales: prof }));
                        }} title="Quitar CV"><Delete fontSize="small" /></IconButton>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Sede y consultorio (asignaciones)</Typography>
                      {(p.asignaciones || []).map((asig, ai) => {
                        const sede = (config.sedes || []).find((s) => s.id === asig.sedeId);
                        const consultorios = sede?.consultorios || [];
                        return (
                          <Paper key={asig.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} sm={3}>
                                <FormControl size="small" fullWidth>
                                  <InputLabel>Sede</InputLabel>
                                  <Select value={asig.sedeId || ''} label="Sede" onChange={(e) => {
                                    const prof = [...(config.profesionales || [])];
                                    const asigs = [...(prof[i].asignaciones || [])];
                                    asigs[ai] = { ...asigs[ai], sedeId: e.target.value, consultorioId: (config.sedes?.find((s) => s.id === e.target.value)?.consultorios?.[0]?.id) || '' };
                                    prof[i] = { ...prof[i], asignaciones: asigs };
                                    setConfig((prev) => ({ ...prev, profesionales: prof }));
                                  }}>
                                    {(config.sedes || []).map((s) => (
                                      <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={3}>
                                <FormControl size="small" fullWidth>
                                  <InputLabel>Consultorio</InputLabel>
                                  <Select value={asig.consultorioId || ''} label="Consultorio" onChange={(e) => {
                                    const prof = [...(config.profesionales || [])];
                                    const asigs = [...(prof[i].asignaciones || [])];
                                    asigs[ai] = { ...asigs[ai], consultorioId: e.target.value };
                                    prof[i] = { ...prof[i], asignaciones: asigs };
                                    setConfig((prev) => ({ ...prev, profesionales: prof }));
                                  }}>
                                    {consultorios.map((c) => (
                                      <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <FormControlLabel control={<Switch size="small" checked={!!asig.activo} onChange={(e) => {
                                  const prof = [...(config.profesionales || [])];
                                  const asigs = [...(prof[i].asignaciones || [])];
                                  asigs[ai] = { ...asigs[ai], activo: e.target.checked };
                                  prof[i] = { ...prof[i], asignaciones: asigs };
                                  setConfig((prev) => ({ ...prev, profesionales: prof }));
                                }} />} label="Activa" />
                              </Grid>
                              <Grid item xs={12} sm={2}>
                                <IconButton size="small" color="error" onClick={() => {
                                  const prof = [...(config.profesionales || [])];
                                  prof[i].asignaciones = (prof[i].asignaciones || []).filter((_, idx) => idx !== ai);
                                  setConfig((prev) => ({ ...prev, profesionales: prof }));
                                }}><Delete fontSize="small" /></IconButton>
                              </Grid>
                            </Grid>
                            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Horario por día (usa el general de la pestaña Horarios si no se define específico)</Typography>
                          </Paper>
                        );
                      })}
                      <Button size="small" startIcon={<Add />} onClick={() => {
                        const prof = [...(config.profesionales || [])];
                        const firstSede = config.sedes?.[0];
                        const firstCons = firstSede?.consultorios?.[0];
                        const defaultHorario = DIAS_SEMANA.reduce((a, d) => ({ ...a, [d]: { enabled: d !== 'sabado' && d !== 'domingo', inicio: '07:00', fin: '18:00', almuerzoInicio: '12:00', almuerzoFin: '13:00' } }), {});
                      prof[i].asignaciones = [...(prof[i].asignaciones || []), { id: `asig_${Date.now()}`, sedeId: firstSede?.id || '1', consultorioId: firstCons?.id || 'c1', horarioPorDia: prof[i].asignaciones?.[0]?.horarioPorDia ? { ...prof[i].asignaciones[0].horarioPorDia } : defaultHorario, activo: true }];
                        setConfig((prev) => ({ ...prev, profesionales: prof }));
                      }}>Agregar sede/consultorio</Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Servicios que puede cotizar</Typography>
                      <FormControl size="small" fullWidth>
                        <Select multiple value={p.servicioIds || []} onChange={(e) => {
                          const prof = [...(config.profesionales || [])];
                          prof[i] = { ...prof[i], servicioIds: e.target.value };
                          setConfig((prev) => ({ ...prev, profesionales: prof }));
                        }} renderValue={(sel) => (config.servicios || []).filter((s) => sel.includes(s.id)).map((s) => s.nombre).join(', ') || 'Ninguno'}
                        >
                          {(config.servicios || []).map((s) => (
                            <MenuItem key={s.id} value={s.id}>{s.nombre}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Productos que puede cotizar</Typography>
                      <FormControl size="small" fullWidth>
                        <Select multiple value={p.productoIds || []} onChange={(e) => {
                          const prof = [...(config.profesionales || [])];
                          prof[i] = { ...prof[i], productoIds: e.target.value };
                          setConfig((prev) => ({ ...prev, profesionales: prof }));
                        }} renderValue={(sel) => {
                          const prods = (config.marketplace?.productos || []);
                          return prods.filter((x) => sel.includes(x.id)).map((x) => x.nombre).join(', ') || 'Ninguno';
                        }}
                        >
                          {(config.marketplace?.productos || []).map((x) => (
                            <MenuItem key={x.id} value={x.id}>{x.nombre}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Button variant="outlined" color="error" size="small" startIcon={<Delete />} onClick={() => {
                        if (window.confirm('¿Eliminar este profesional?')) {
                          const prof = (config.profesionales || []).filter((_, idx) => idx !== i);
                          setConfig((prev) => ({ ...prev, profesionales: prof }));
                          setSnackbar({ open: true, message: 'Profesional eliminado', severity: 'success' });
                        }
                      }}>Eliminar profesional</Button>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
              <Button startIcon={<Add />} variant="outlined" size="small" onClick={() => {
                const firstSede = config.sedes?.[0];
                const firstCons = firstSede?.consultorios?.[0];
                const prof = [...(config.profesionales || []), {
                  id: `prof_${Date.now()}`,
                  nombre: '',
                  especialidad: 'Audiólogo/a',
                  activo: true,
                  cvUrl: null,
                  servicioIds: [],
                  productoIds: [],
                  asignaciones: [{ id: `asig_${Date.now()}`, sedeId: firstSede?.id || '1', consultorioId: firstCons?.id || 'c1', horarioPorDia: DIAS_SEMANA.reduce((a, d) => ({ ...a, [d]: { enabled: d !== 'sabado' && d !== 'domingo', inicio: '07:00', fin: '18:00', almuerzoInicio: '12:00', almuerzoFin: '13:00' } }), {}), activo: true }],
                }];
                setConfig((prev) => ({ ...prev, profesionales: prof }));
              }}>Agregar profesional</Button>
            </CardContent>
          </Card>
        )}

        {/* 7. Servicios */}
        {activeTab === 6 && (
          <Card sx={{ border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50', mb: 2 }}>Servicios</Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mb: 3 }}>Servicios que ofrece el centro.</Typography>
              {(config.servicios || []).map((s, i) => (
                <Paper key={s.id || i} variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <TextField size="small" label="Nombre" value={s.nombre || ''} onChange={(e) => {
                    const svc = [...(config.servicios || [])];
                    svc[i] = { ...svc[i], nombre: e.target.value };
                    setConfig((prev) => ({ ...prev, servicios: svc }));
                  }} sx={{ minWidth: 200 }} />
                  <TextField size="small" type="number" label="Duración (min)" value={s.duracion ?? 30} onChange={(e) => {
                    const svc = [...(config.servicios || [])];
                    svc[i] = { ...svc[i], duracion: Number(e.target.value) || 30 };
                    setConfig((prev) => ({ ...prev, servicios: svc }));
                  }} sx={{ width: 120 }} InputProps={{ inputProps: { min: 5, max: 120 } }} />
                  <FormControlLabel control={<Switch checked={!!s.activo} onChange={(e) => {
                    const svc = [...(config.servicios || [])];
                    svc[i] = { ...svc[i], activo: e.target.checked };
                    setConfig((prev) => ({ ...prev, servicios: svc }));
                  }} color="primary" />} label="Activo" />
                </Paper>
              ))}
              <Button startIcon={<Add />} variant="outlined" size="small" onClick={() => {
                const svc = [...(config.servicios || []), { id: `s_${Date.now()}`, nombre: '', duracion: 30, activo: true }];
                setConfig((prev) => ({ ...prev, servicios: svc }));
              }}>Agregar servicio</Button>
            </CardContent>
          </Card>
        )}

        {/* 8. Marketplace */}
        {activeTab === 7 && (
          <Card sx={{ border: '1px solid rgba(8, 89, 70, 0.1)', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#272F50', mb: 2 }}>Marketplace</Typography>
              <Typography variant="body2" sx={{ color: '#86899C', mb: 3 }}>Productos y servicios que se facturan.</Typography>
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Productos</Typography>
                {(config.marketplace?.productos || []).map((prod, i) => (
                  <Paper key={prod.id} variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{prod.nombre || `Producto ${i + 1}`}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <FormControlLabel control={<Switch size="small" checked={!!prod.activo} onChange={(e) => {
                          const prods = [...(config.marketplace?.productos || [])];
                          prods[i] = { ...prods[i], activo: e.target.checked };
                          setConfig((prev) => ({ ...prev, marketplace: { ...prev.marketplace, productos: prods } }));
                        }} />} label="Activo" />
                        <IconButton size="small" color="error" onClick={() => {
                          const prods = (config.marketplace?.productos || []).filter((_, idx) => idx !== i);
                          setConfig((prev) => ({ ...prev, marketplace: { ...prev.marketplace, productos: prods } }));
                        }}><Delete fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Nombre" value={prod.nombre || ''} onChange={(e) => { const prods = [...(config.marketplace?.productos || [])]; prods[i] = { ...prods[i], nombre: e.target.value }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, productos: prods } })); }} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Marca" value={prod.marca || ''} onChange={(e) => { const prods = [...(config.marketplace?.productos || [])]; prods[i] = { ...prods[i], marca: e.target.value }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, productos: prods } })); }} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Tecnología" value={prod.tecnologia || ''} onChange={(e) => { const prods = [...(config.marketplace?.productos || [])]; prods[i] = { ...prods[i], tecnologia: e.target.value }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, productos: prods } })); }} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Plataforma" value={prod.plataforma || ''} onChange={(e) => { const prods = [...(config.marketplace?.productos || [])]; prods[i] = { ...prods[i], plataforma: e.target.value }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, productos: prods } })); }} /></Grid>
                      <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Valor unitario" value={prod.valorUnitario ?? ''} onChange={(e) => { const prods = [...(config.marketplace?.productos || [])]; prods[i] = { ...prods[i], valorUnitario: e.target.value ? Number(e.target.value) : null }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, productos: prods } })); }} /></Grid>
                      <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Valor total" value={prod.valorTotal ?? ''} onChange={(e) => { const prods = [...(config.marketplace?.productos || [])]; prods[i] = { ...prods[i], valorTotal: e.target.value ? Number(e.target.value) : null }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, productos: prods } })); }} /></Grid>
                      <Grid item xs={12} sm={4}><TextField fullWidth size="small" type="number" label="Años de garantía" value={prod.anosGarantia ?? ''} onChange={(e) => { const prods = [...(config.marketplace?.productos || [])]; prods[i] = { ...prods[i], anosGarantia: e.target.value ? Number(e.target.value) : null }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, productos: prods } })); }} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Proveedor" value={prod.proveedor || ''} onChange={(e) => { const prods = [...(config.marketplace?.productos || [])]; prods[i] = { ...prods[i], proveedor: e.target.value }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, productos: prods } })); }} /></Grid>
                      <Grid item xs={12}><TextField fullWidth size="small" label="Descripción" multiline rows={2} value={prod.descripcion || ''} onChange={(e) => { const prods = [...(config.marketplace?.productos || [])]; prods[i] = { ...prods[i], descripcion: e.target.value }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, productos: prods } })); }} /></Grid>
                      <Grid item xs={12}><TextField fullWidth size="small" label="Modo de uso" multiline rows={2} value={prod.modoUso || ''} onChange={(e) => { const prods = [...(config.marketplace?.productos || [])]; prods[i] = { ...prods[i], modoUso: e.target.value }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, productos: prods } })); }} /></Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Imágenes</Typography>
                        <Button size="small" variant="outlined" component="label">Cargar imagen
                          <input type="file" hidden accept="image/*" multiple onChange={(e) => {
                            const files = e.target.files;
                            if (files?.length) {
                              const readers = Array.from(files).map((f) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); }));
                              Promise.all(readers).then((urls) => {
                                const prods = [...(config.marketplace?.productos || [])];
                                prods[i] = { ...prods[i], imagenes: [...(prods[i].imagenes || []), ...urls] };
                                setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, productos: prods } }));
                              });
                            }
                          }} />
                        </Button>
                        {(prod.imagenes || []).length > 0 && (
                          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                            {(prod.imagenes || []).map((img, ii) => (
                              <Box key={ii} sx={{ position: 'relative' }}>
                                <Box component="img" src={img} alt="" sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 1, border: '1px solid #ddd' }} />
                                <IconButton size="small" sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#fff', '&:hover': { bgcolor: '#fff' } }} onClick={() => { const prods = [...(config.marketplace?.productos || [])]; prods[i].imagenes = (prods[i].imagenes || []).filter((_, idx) => idx !== ii); setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, productos: prods } })); }}><Delete fontSize="small" color="error" /></IconButton>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
                <Button startIcon={<Add />} variant="outlined" size="small" onClick={() => {
                  const prods = [...(config.marketplace?.productos || []), { id: `prod_${Date.now()}`, nombre: '', descripcion: '', tecnologia: '', plataforma: '', marca: '', valorUnitario: null, valorTotal: null, imagenes: [], anosGarantia: null, modoUso: '', proveedor: '', activo: true }];
                  setConfig((prev) => ({ ...prev, marketplace: { ...prev.marketplace, productos: prods } }));
                }}>Agregar producto</Button>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Servicios facturables</Typography>
                {(config.marketplace?.serviciosFacturables || []).map((svc, i) => (
                  <Paper key={svc.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{svc.nombre || `Servicio ${i + 1}`}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <FormControlLabel control={<Switch size="small" checked={!!svc.activo} onChange={(e) => { const list = [...(config.marketplace?.serviciosFacturables || [])]; list[i] = { ...list[i], activo: e.target.checked }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, serviciosFacturables: list } })); }} />} label="Activo" />
                        <IconButton size="small" color="error" onClick={() => { const list = (config.marketplace?.serviciosFacturables || []).filter((_, idx) => idx !== i); setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, serviciosFacturables: list } })); }}><Delete fontSize="small" /></IconButton>
                      </Box>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Nombre de servicio" value={svc.nombre || ''} onChange={(e) => { const list = [...(config.marketplace?.serviciosFacturables || [])]; list[i] = { ...list[i], nombre: e.target.value }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, serviciosFacturables: list } })); }} /></Grid>
                      <Grid item xs={12} sm={3}><TextField fullWidth size="small" type="number" label="Valor unitario" value={svc.valorUnitario ?? ''} onChange={(e) => { const list = [...(config.marketplace?.serviciosFacturables || [])]; list[i] = { ...list[i], valorUnitario: e.target.value ? Number(e.target.value) : null }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, serviciosFacturables: list } })); }} /></Grid>
                      <Grid item xs={12} sm={3}><TextField fullWidth size="small" type="number" label="Valor total" value={svc.valorTotal ?? ''} onChange={(e) => { const list = [...(config.marketplace?.serviciosFacturables || [])]; list[i] = { ...list[i], valorTotal: e.target.value ? Number(e.target.value) : null }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, serviciosFacturables: list } })); }} /></Grid>
                      <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Garantía" value={svc.garantia || ''} onChange={(e) => { const list = [...(config.marketplace?.serviciosFacturables || [])]; list[i] = { ...list[i], garantia: e.target.value }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, serviciosFacturables: list } })); }} /></Grid>
                      <Grid item xs={12}><TextField fullWidth size="small" label="Descripción" multiline rows={2} value={svc.descripcion || ''} onChange={(e) => { const list = [...(config.marketplace?.serviciosFacturables || [])]; list[i] = { ...list[i], descripcion: e.target.value }; setConfig((p) => ({ ...p, marketplace: { ...p.marketplace, serviciosFacturables: list } })); }} /></Grid>
                    </Grid>
                  </Paper>
                ))}
                <Button startIcon={<Add />} variant="outlined" size="small" onClick={() => {
                  const list = [...(config.marketplace?.serviciosFacturables || []), { id: `svcf_${Date.now()}`, nombre: '', valorUnitario: null, valorTotal: null, garantia: '', descripcion: '', activo: true }];
                  setConfig((prev) => ({ ...prev, marketplace: { ...prev.marketplace, serviciosFacturables: list } }));
                }}>Agregar servicio facturable</Button>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" size="large" startIcon={<Save />} onClick={handleSave} sx={{ bgcolor: '#085946', px: 4, py: 1.5, fontWeight: 700, '&:hover': { bgcolor: '#272F50' } }}>
            Guardar Configuración
          </Button>
        </Box>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        message={snackbar.message}
        ContentProps={{ sx: { bgcolor: snackbar.severity === 'success' ? '#4caf50' : '#f44336', color: '#fff' } }}
      />
    </Box>
  );
};

export default ConfiguracionPage;
