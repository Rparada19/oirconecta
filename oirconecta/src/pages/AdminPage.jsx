import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Alert,
  Snackbar,
  Divider,
  Chip
} from '@mui/material';
import { 
  Upload, 
  FileUpload, 
  DataUsage, 
  CheckCircle, 
  Error,
  CloudUpload
} from '@mui/icons-material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ExcelUploader from '../components/ExcelUploader';

const AdminPage = () => {
  const [otorrinolaringologosData, setOtorrinolaringologosData] = useState(null);
  const [audiologasData, setAudiologasData] = useState(null);
  const [otorrinolaringologosResult, setOtorrinolaringologosResult] = useState(null);
  const [audiologasResult, setAudiologasResult] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleOtorrinolaringologosDataProcessed = (data, result) => {
    console.log('Datos de otorrinolaringólogos procesados:', data);
    console.log('Información del procesamiento:', result);
    console.log('Estadísticas por hoja:', result?.sheetStats);
    console.log('Hojas encontradas:', result?.sheets);
    
    setOtorrinolaringologosData(data);
    setOtorrinolaringologosResult(result);
    
    // Crear mensaje detallado con estadísticas
    let message = `✅ ${data.length} otorrinolaringólogos procesados correctamente`;
    if (result.sheetStats) {
      const totalRows = result.sheetStats.reduce((sum, stat) => sum + stat.totalRows, 0);
      const totalProcessed = result.sheetStats.reduce((sum, stat) => sum + stat.processedRows, 0);
      const hojasConDatos = result.sheetStats.filter(stat => stat.processedRows > 0).length;
      message += ` de ${hojasConDatos} hojas con datos (${totalProcessed} válidos de ${totalRows} filas totales)`;
    }
    
    setSnackbar({
      open: true,
      message: message,
      severity: 'success'
    });
  };

  const handleAudiologasDataProcessed = (data, result) => {
    console.log('Datos de audiólogas procesados:', data);
    console.log('Información del procesamiento:', result);
    setAudiologasData(data);
    setAudiologasResult(result);
    
    // Crear mensaje detallado con estadísticas
    let message = `✅ ${data.length} audiólogas procesadas correctamente`;
    if (result.sheetStats) {
      const totalRows = result.sheetStats.reduce((sum, stat) => sum + stat.totalRows, 0);
      const totalProcessed = result.sheetStats.reduce((sum, stat) => sum + stat.processedRows, 0);
      message += ` de ${result.sheets.length} hojas (${totalProcessed} válidos de ${totalRows} filas totales)`;
    }
    
    setSnackbar({
      open: true,
      message: message,
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const downloadJSON = (data, filename) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Helmet>
        <title>Administración - OirConecta</title>
        <meta name="description" content="Panel de administración para cargar datos de especialistas" />
      </Helmet>

      <Header />

      <Box sx={{ py: 8, backgroundColor: 'grey.50', pt: 12 }}>
        <Container maxWidth="lg">
          {/* Hero Section */}
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ color: 'primary.main', fontWeight: 700 }}>
              Panel de Administración
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
              Carga y procesa archivos Excel para actualizar la base de datos de especialistas
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {/* Otorrinolaringólogos */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <DataUsage sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" component="h2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        Otorrinolaringólogos
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Carga archivo: "BASE DE DATOS ORL.xlsx"
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  <ExcelUploader onDataProcessed={handleOtorrinolaringologosDataProcessed} />

                  {otorrinolaringologosData && (
                    <Box sx={{ mt: 3 }}>
                      <Chip 
                        icon={<CheckCircle />} 
                        label={`${otorrinolaringologosData.length} especialistas cargados`}
                        color="success"
                        sx={{ mb: 2 }}
                      />
                      {otorrinolaringologosResult && otorrinolaringologosResult.sheets && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          <strong>Hojas procesadas:</strong> {otorrinolaringologosResult.sheets.join(', ')}
                        </Typography>
                      )}
                      {otorrinolaringologosResult && otorrinolaringologosResult.sheetStats && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    <strong>Estadísticas por hoja:</strong>
                                  </Typography>
                                  {otorrinolaringologosResult.sheetStats.map((stat, index) => (
                                    <Typography key={index} variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                      • {stat.sheetName}: {stat.processedRows} registros procesados de {stat.totalRows} filas 
                                      {stat.status && ` (${stat.status})`}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => downloadJSON(otorrinolaringologosData, 'otorrinolaringologos.json')}
                        startIcon={<CloudUpload />}
                      >
                        Descargar JSON
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Audiólogas */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <DataUsage sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="h4" component="h2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        Audiólogas
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Carga archivo: "BD_audiologia_oirconecta.xlsx"
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  <ExcelUploader onDataProcessed={handleAudiologasDataProcessed} />

                  {audiologasData && (
                    <Box sx={{ mt: 3 }}>
                      <Chip 
                        icon={<CheckCircle />} 
                        label={`${audiologasData.length} especialistas cargados`}
                        color="success"
                        sx={{ mb: 2 }}
                      />
                      {audiologasResult && audiologasResult.sheets && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          <strong>Hojas procesadas:</strong> {audiologasResult.sheets.join(', ')}
                        </Typography>
                      )}
                      {audiologasResult && audiologasResult.sheetStats && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Estadísticas por hoja:</strong>
                          </Typography>
                          {audiologasResult.sheetStats.map((stat, index) => (
                            <Typography key={index} variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              • {stat.sheetName}: {stat.processedRows} registros procesados de {stat.totalRows} filas
                            </Typography>
                          ))}
                        </Box>
                      )}
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => downloadJSON(audiologasData, 'audiologas.json')}
                        startIcon={<CloudUpload />}
                      >
                        Descargar JSON
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Instrucciones */}
          <Card sx={{ mt: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" component="h3" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                Instrucciones
              </Typography>
              <Typography variant="body1" paragraph>
                <strong>Archivos requeridos:</strong>
              </Typography>
              <Box component="ul" sx={{ pl: 2, mb: 3 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>"BASE DE DATOS ORL.xlsx"</strong> - Para otorrinolaringólogos
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>"BD_audiologia_oirconecta.xlsx"</strong> - Para audiólogas
                </Typography>
              </Box>
              <Typography variant="body1" paragraph>
                <strong>Formato requerido del Excel:</strong>
              </Typography>
              <Box component="ul" sx={{ pl: 2, mb: 3 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>nombre:</strong> Nombre completo del especialista
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>ciudad:</strong> Ciudad donde ejerce
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>telefono:</strong> Número de teléfono de contacto
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>email:</strong> Correo electrónico (opcional)
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Los archivos JSON generados se pueden usar directamente en las páginas correspondientes.
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>

      <Footer />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdminPage; 