import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Campaign,
  ArrowBack,
  Add,
  Edit,
  Delete,
  Visibility,
  TrendingUp,
  People,
  CalendarToday,
} from '@mui/icons-material';
import { getCampaigns, createCampaign, MARCAS } from '../../services/campaignService';

const CampanasPage = () => {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [campaigns, setCampaignsState] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    nombre: '',
    tipo: 'email',
    fechaInicio: '',
    fechaFin: '',
    fabricante: '',
    descuentoAprobado: 0,
    descripcion: '',
  });

  const loadCampaigns = async () => {
    try {
      const list = await getCampaigns();
      setCampaignsState(list);
    } catch (e) {
      console.error('[CampanasPage] Error al cargar campañas:', e);
    }
  };

  useEffect(() => {
    loadCampaigns();
    const interval = setInterval(loadCampaigns, 15000);
    return () => clearInterval(interval);
  }, []);

  const getEstadoChip = (estado) => {
    switch (estado) {
      case 'activa':
        return (
          <Chip
            label="Activa"
            size="small"
            sx={{ bgcolor: '#e8f5e9', color: '#085946', fontWeight: 600 }}
          />
        );
      case 'pausada':
        return (
          <Chip
            label="Pausada"
            size="small"
            sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 600 }}
          />
        );
      default:
        return (
          <Chip
            label="Finalizada"
            size="small"
            sx={{ bgcolor: '#f5f5f5', color: '#757575', fontWeight: 600 }}
          />
        );
    }
  };

  const calculateRate = (value, total) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
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
                Campañas de Marketing
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Gestiona tus campañas y promociones
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#085946',
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                  },
                }}
              >
                Nueva Campaña
              </Button>
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
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Estadísticas Generales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="h4" sx={{ color: '#085946', fontWeight: 700 }}>
                {campaigns.length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C' }}>
                Total Campañas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="h4" sx={{ color: '#272F50', fontWeight: 700 }}>
                {campaigns.filter((c) => c.estado === 'activa').length}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C' }}>
                Campañas Activas
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="h4" sx={{ color: '#0a6b56', fontWeight: 700 }}>
                {campaigns.reduce((sum, c) => sum + c.destinatarios, 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C' }}>
                Total Destinatarios
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                border: '1px solid rgba(8, 89, 70, 0.1)',
                borderRadius: 3,
                textAlign: 'center',
                p: 2,
              }}
            >
              <Typography variant="h4" sx={{ color: '#085946', fontWeight: 700 }}>
                {Math.round(
                  (campaigns.reduce((sum, c) => sum + c.clicks, 0) /
                    campaigns.reduce((sum, c) => sum + c.destinatarios, 0)) *
                    100
                ) || 0}
                %
              </Typography>
              <Typography variant="body2" sx={{ color: '#86899C' }}>
                Tasa de Clics Promedio
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Lista de Campañas */}
        <Grid container spacing={3}>
          {campaigns.map((campaign) => (
            <Grid item xs={12} key={campaign.id}>
              <Card
                sx={{
                  border: '1px solid rgba(8, 89, 70, 0.1)',
                  borderRadius: 3,
                  boxShadow: '0 4px 16px rgba(8, 89, 70, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(8, 89, 70, 0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="h5" sx={{ color: '#272F50', fontWeight: 700 }}>
                          {campaign.nombre}
                        </Typography>
                        {getEstadoChip(campaign.estado)}
                        <Chip
                          label={campaign.tipo}
                          size="small"
                          sx={{
                            bgcolor: '#f0f4f3',
                            color: '#085946',
                            fontWeight: 500,
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ color: '#86899C', mb: 2 }}>
                        <CalendarToday sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                        {new Date(campaign.fechaInicio + 'T00:00:00').toLocaleDateString('es-ES')} -{' '}
                        {new Date(campaign.fechaFin + 'T00:00:00').toLocaleDateString('es-ES')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" sx={{ color: '#085946' }}>
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" sx={{ color: '#085946' }}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" sx={{ color: '#c62828' }}>
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <People sx={{ fontSize: 32, color: '#085946', mb: 1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#272F50' }}>
                          {campaign.destinatarios.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#86899C' }}>
                          Destinatarios
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <TrendingUp sx={{ fontSize: 32, color: '#0a6b56', mb: 1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#272F50' }}>
                          {campaign.abiertos.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#86899C' }}>
                          Abiertos ({calculateRate(campaign.abiertos, campaign.destinatarios)}%)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <TrendingUp sx={{ fontSize: 32, color: '#272F50', mb: 1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#272F50' }}>
                          {campaign.clicks.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#86899C' }}>
                          Clics ({calculateRate(campaign.clicks, campaign.destinatarios)}%)
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#085946' }}>
                          {calculateRate(campaign.clicks, campaign.abiertos)}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#86899C' }}>
                          Tasa de Conversión
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Dialog Crear Campaña */}
      <Dialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setCreateForm({ nombre: '', tipo: 'email', fechaInicio: '', fechaFin: '', fabricante: '', descuentoAprobado: 0, descripcion: '' });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#085946', color: '#ffffff', fontWeight: 700 }}>
          Nueva Campaña de Marketing
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Nombre de la Campaña"
            margin="normal"
            required
            value={createForm.nombre}
            onChange={(e) => setCreateForm((f) => ({ ...f, nombre: e.target.value }))}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
            <InputLabel>Tipo de Campaña</InputLabel>
            <Select
              label="Tipo de Campaña"
              value={createForm.tipo}
              onChange={(e) => setCreateForm((f) => ({ ...f, tipo: e.target.value }))}
            >
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="redes">Redes Sociales</MenuItem>
              <MenuItem value="web">Sitio Web</MenuItem>
            </Select>
          </FormControl>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Fecha de Inicio"
                type="date"
                InputLabelProps={{ shrink: true }}
                required
                value={createForm.fechaInicio}
                onChange={(e) => setCreateForm((f) => ({ ...f, fechaInicio: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Fecha de Fin"
                type="date"
                InputLabelProps={{ shrink: true }}
                required
                value={createForm.fechaFin}
                onChange={(e) => setCreateForm((f) => ({ ...f, fechaFin: e.target.value }))}
              />
            </Grid>
          </Grid>
          <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
            <InputLabel>Fabricante</InputLabel>
            <Select
              label="Fabricante"
              value={createForm.fabricante}
              onChange={(e) => setCreateForm((f) => ({ ...f, fabricante: e.target.value }))}
            >
              <MenuItem value="">
                <em>Seleccione</em>
              </MenuItem>
              {MARCAS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Descuento aprobado (%)"
            type="number"
            inputProps={{ min: 0, max: 100 }}
            value={createForm.descuentoAprobado}
            onChange={(e) => setCreateForm((f) => ({ ...f, descuentoAprobado: parseFloat(e.target.value) || 0 }))}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Descripción"
            multiline
            rows={3}
            margin="normal"
            value={createForm.descripcion}
            onChange={(e) => setCreateForm((f) => ({ ...f, descripcion: e.target.value }))}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setCreateDialogOpen(false);
              setCreateForm({ nombre: '', tipo: 'email', fechaInicio: '', fechaFin: '', fabricante: '', descuentoAprobado: 0, descripcion: '' });
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#085946' }}
            disabled={!createForm.nombre?.trim() || !createForm.fechaInicio || !createForm.fechaFin || createLoading}
            onClick={async () => {
              if (!createForm.nombre?.trim() || !createForm.fechaInicio || !createForm.fechaFin) return;
              setCreateLoading(true);
              const tipoLabel = { email: 'Email', sms: 'SMS', redes: 'Redes Sociales', web: 'Sitio Web' }[createForm.tipo] || 'Email';
              const result = await createCampaign({
                nombre: createForm.nombre.trim(),
                tipo: tipoLabel,
                fechaInicio: createForm.fechaInicio,
                fechaFin: createForm.fechaFin,
                fabricante: createForm.fabricante?.trim() || '',
                descuentoAprobado: createForm.descuentoAprobado ?? 0,
              });
              setCreateLoading(false);
              if (result.success) {
                setCreateForm({ nombre: '', tipo: 'email', fechaInicio: '', fechaFin: '', fabricante: '', descuentoAprobado: 0, descripcion: '' });
                setCreateDialogOpen(false);
                loadCampaigns();
              }
            }}
          >
            {createLoading ? 'Creando…' : 'Crear Campaña'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CampanasPage;
