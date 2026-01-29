import React from 'react';
import { Box, Typography, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Person, Email, Phone, Description, Source } from '@mui/icons-material';
import { getProcedenciaOptions } from '../../utils/procedenciaUtils';

const PatientForm = ({ patientData, onDataChange }) => {
  const handleChange = (field) => (event) => {
    onDataChange(field, event.target.value);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Person sx={{ color: '#085946', mr: 1 }} />
        <Typography variant="h6" sx={{ color: '#272F50', fontWeight: 600 }}>
          Información del Paciente
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          label="Nombre Completo"
          placeholder="Ingresa tu nombre completo"
          value={patientData.patientName}
          onChange={handleChange('patientName')}
          required
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Person sx={{ color: '#86899C' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: '#085946',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#085946',
              },
            },
          }}
        />

        <TextField
          label="Email"
          type="email"
          placeholder="tu@email.com"
          value={patientData.patientEmail}
          onChange={handleChange('patientEmail')}
          required
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Email sx={{ color: '#86899C' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: '#085946',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#085946',
              },
            },
          }}
        />

        <TextField
          label="Teléfono"
          type="tel"
          placeholder="+57 300 123 4567"
          value={patientData.patientPhone}
          onChange={handleChange('patientPhone')}
          required
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Phone sx={{ color: '#86899C' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: '#085946',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#085946',
              },
            },
          }}
        />

        <FormControl fullWidth required>
          <InputLabel>Procedencia</InputLabel>
          <Select
            value={patientData.procedencia || 'visita-medica'}
            onChange={handleChange('procedencia')}
            label="Procedencia"
            startAdornment={
              <InputAdornment position="start">
                <Source sx={{ color: '#86899C', mr: 1 }} />
              </InputAdornment>
            }
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#085946',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#085946',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#085946',
              },
            }}
          >
            {getProcedenciaOptions().map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Motivo de la Cita (Opcional)"
          placeholder="Describe brevemente el motivo de tu consulta"
          value={patientData.reason}
          onChange={handleChange('reason')}
          fullWidth
          multiline
          rows={4}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Description sx={{ color: '#86899C' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: '#085946',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#085946',
              },
            },
          }}
        />
      </Box>

      <Box sx={{ mt: 3, p: 2, backgroundColor: '#f0f4f3', borderRadius: 2 }}>
        <Typography variant="body2" sx={{ color: '#86899C', fontSize: '0.875rem' }}>
          <strong>Nota:</strong> Los campos marcados con * son obligatorios. 
          Te contactaremos para confirmar tu cita.
        </Typography>
      </Box>
    </Box>
  );
};

export default PatientForm;
