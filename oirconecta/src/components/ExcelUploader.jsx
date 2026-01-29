import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Alert, 
  CircularProgress,
  Chip,
  IconButton
} from '@mui/material';
import { AttachFile, Delete, CheckCircle } from '@mui/icons-material';
import { processExcelData } from '../utils/excelProcessor';

const ExcelUploader = ({ onDataProcessed }) => {
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => {
      const isValidType = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                         file.type === 'application/vnd.ms-excel' ||
                         file.name.endsWith('.xlsx') ||
                         file.name.endsWith('.xls');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB máximo
      
      if (!isValidType) {
        setError(`El archivo ${file.name} no es un archivo Excel válido`);
        return false;
      }
      
      if (!isValidSize) {
        setError(`El archivo ${file.name} es demasiado grande. Máximo 10MB`);
        return false;
      }
      
      return true;
    });

    setAttachedFiles(prev => [...prev, ...validFiles]);
    setError('');
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (attachedFiles.length === 0) {
      setError('Por favor selecciona al menos un archivo Excel');
      return;
    }

    setProcessing(true);
    setError('');
    setSuccess('');

    try {
      const allProcessedData = [];
      let dataType = '';
      let processingResult = null;
      
      for (const file of attachedFiles) {
        const result = await processExcelData(file);
        allProcessedData.push(...result.data);
        dataType = result.type;
        // const storageKey = result.storageKey;
        processingResult = result; // Guardar el resultado completo del último archivo
      }

      // Filtrar datos válidos
      const validData = allProcessedData.filter(item => item.nombre && item.nombre.trim() !== '');
      
      if (validData.length === 0) {
        setError('No se encontraron datos válidos en los archivos Excel');
        return;
      }

      // Llamar a la función callback con los datos procesados y el resultado completo
      if (onDataProcessed) {
        onDataProcessed(validData, processingResult);
      }

      setSuccess(`✅ Se procesaron ${validData.length} ${dataType === 'ORL' ? 'otorrinolaringólogos' : 'audiólogas'} exitosamente de ${processingResult?.sheets?.length || 1} hojas`);
      
      // Limpiar archivos después del procesamiento
      setAttachedFiles([]);
      
    } catch (error) {
      console.error('Error procesando archivos:', error);
      setError(`Error procesando archivos: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
        Subir Base de Datos de Profesionales
      </Typography>
      
      {/* Área de subida de archivos */}
      <Box sx={{ 
        border: '2px dashed #e0e0e0', 
        borderRadius: 2, 
        p: 3, 
        textAlign: 'center',
        backgroundColor: '#fafafa',
        mb: 2,
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: '#f5f5f5'
        }
      }}>
        <input
          type="file"
          multiple
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="excel-file-upload"
        />
        <label htmlFor="excel-file-upload">
          <Button
            component="span"
            variant="outlined"
            startIcon={<AttachFile />}
            sx={{ mb: 2 }}
          >
            Seleccionar Archivos Excel
          </Button>
        </label>
        <Typography variant="body2" color="text.secondary">
          Formatos aceptados: .xlsx, .xls (Máximo 10MB por archivo)
        </Typography>
      </Box>

      {/* Lista de archivos adjuntos */}
      {attachedFiles.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Archivos seleccionados ({attachedFiles.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {attachedFiles.map((file, index) => (
              <Chip
                key={index}
                label={file.name}
                onDelete={() => handleRemoveFile(index)}
                deleteIcon={<Delete />}
                variant="outlined"
                sx={{ 
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  '& .MuiChip-deleteIcon': {
                    color: 'primary.contrastText'
                  }
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Botón de procesamiento */}
      {attachedFiles.length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            onClick={processFiles}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <CheckCircle />}
            sx={{
              backgroundColor: 'primary.main',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            {processing ? 'Procesando...' : 'Procesar Datos'}
          </Button>
          
          {processing && (
            <Typography variant="body2" color="text.secondary">
              Procesando {attachedFiles.length} archivo(s)...
            </Typography>
          )}
        </Box>
      )}

      {/* Mensajes de estado */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
    </Box>
  );
};

export default ExcelUploader; 