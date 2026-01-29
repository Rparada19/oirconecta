import React, { useState } from 'react';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Settings,
  ArrowBack,
  Save,
  Schedule,
  Notifications,
  Security,
  Business,
  CalendarToday,
} from '@mui/icons-material';

const ConfiguracionPage = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    horarioInicio: '07:00',
    horarioFin: '16:00',
    horarioFinViernes: '15:00',
    duracionCita: 50,
    descansoEntreCitas: 10,
    horaAlmuerzoInicio: '12:00',
    horaAlmuerzoFin: '13:00',
    notificacionesEmail: true,
    notificacionesSMS: false,
    recordatorioCita: true,
    confirmacionAutomatica: false,
  });

  const handleSettingChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    // Aquí iría la lógica para guardar la configuración
    console.log('Configuración guardada:', settings);
    // Mostrar mensaje de éxito
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #085946 0%, #272F50 100%)',
          color: '#ffffff',
          py: 3,
          boxShadow: '0 4px 20px rgba(8, 89, 70, 0.2)',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
                Configuración del Sistema
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Ajusta los parámetros del sistema
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/portal-crm')}
              sx={{
                borderColor: '#ffffff',
                color: '#ffffff',
                '&:hover': {
                  borderColor: '#ffffff',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Volver
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Configuración de Horarios */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Schedule sx={{ color: '#085946', fontSize: 28 }} />
                  <Typography variant="h5" sx={{ color: '#272F50', fontWeight: 700 }}>
                    Horarios de Atención
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Hora de Inicio"
                      type="time"
                      value={settings.horarioInicio}
                      onChange={handleSettingChange('horarioInicio')}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Hora de Fin (Lunes - Jueves)"
                      type="time"
                      value={settings.horarioFin}
                      onChange={handleSettingChange('horarioFin')}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Hora de Fin (Viernes)"
                      type="time"
                      value={settings.horarioFinViernes}
                      onChange={handleSettingChange('horarioFinViernes')}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Hora de Almuerzo (Inicio)"
                      type="time"
                      value={settings.horaAlmuerzoInicio}
                      onChange={handleSettingChange('horaAlmuerzoInicio')}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Hora de Almuerzo (Fin)"
                      type="time"
                      value={settings.horaAlmuerzoFin}
                      onChange={handleSettingChange('horaAlmuerzoFin')}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Configuración de Citas */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <CalendarToday sx={{ color: '#085946', fontSize: 28 }} />
                  <Typography variant="h5" sx={{ color: '#272F50', fontWeight: 700 }}>
                    Configuración de Citas
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Duración de Cita (minutos)"
                      type="number"
                      value={settings.duracionCita}
                      onChange={handleSettingChange('duracionCita')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Descanso entre Citas (minutos)"
                      type="number"
                      value={settings.descansoEntreCitas}
                      onChange={handleSettingChange('descansoEntreCitas')}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Notificaciones */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Notifications sx={{ color: '#085946', fontSize: 28 }} />
                  <Typography variant="h5" sx={{ color: '#272F50', fontWeight: 700 }}>
                    Notificaciones
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notificacionesEmail}
                        onChange={handleSettingChange('notificacionesEmail')}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#085946',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#085946',
                          },
                        }}
                      />
                    }
                    label="Notificaciones por Email"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notificacionesSMS}
                        onChange={handleSettingChange('notificacionesSMS')}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#085946',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#085946',
                          },
                        }}
                      />
                    }
                    label="Notificaciones por SMS"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.recordatorioCita}
                        onChange={handleSettingChange('recordatorioCita')}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#085946',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#085946',
                          },
                        }}
                      />
                    }
                    label="Recordatorio de Citas"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.confirmacionAutomatica}
                        onChange={handleSettingChange('confirmacionAutomatica')}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#085946',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#085946',
                          },
                        }}
                      />
                    }
                    label="Confirmación Automática"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Información de la Empresa */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                height: '100%',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Business sx={{ color: '#085946', fontSize: 28 }} />
                  <Typography variant="h5" sx={{ color: '#272F50', fontWeight: 700 }}>
                    Información de la Empresa
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Nombre de la Empresa" defaultValue="OírConecta" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Email de Contacto" type="email" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Teléfono de Contacto" type="tel" />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Dirección" multiline rows={2} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Botón Guardar */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Save />}
            onClick={handleSave}
            sx={{
              bgcolor: '#085946',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 700,
              '&:hover': {
                bgcolor: '#272F50',
              },
            }}
          >
            Guardar Configuración
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default ConfiguracionPage;
