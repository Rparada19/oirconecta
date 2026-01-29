import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';

/**
 * Formulario de historia clínica: Cita control
 * Visita de control (30 min): motivo, otoscopia si se hizo, estado general,
 * ajustes menores y próximos pasos.
 */
const ControlForm = ({ data = {}, onChange }) => {
  const d = { ...data };
  const handleChange = (field) => (e) => onChange(field, e.target.value);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#085946', mb: 0.5 }}>
        Historia clínica — Cita control (completa)
      </Typography>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>1. Motivo del control</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth label="Motivo de la cita de control" multiline minRows={2} value={d.motivoControl ?? ''} onChange={handleChange('motivoControl')} placeholder="Por qué asiste el paciente a esta cita de control (seguimiento, revisión programada, molestia puntual, etc.)..." />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>2. Otoscopia (si se realizó)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth label="Hallazgos de otoscopia" multiline minRows={2} value={d.otoscopia ?? ''} onChange={handleChange('otoscopia')} placeholder="Estado del conducto y tímpano OD/OI. Si no se realizó, indicar." />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>3. Estado general</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Estado de audición y/o uso de audífonos" multiline minRows={2} value={d.estadoGeneral ?? ''} onChange={handleChange('estadoGeneral')} placeholder="Cómo refiere el paciente su audición, uso de prótesis, tolerancia..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Quejas o síntomas desde última visita" multiline minRows={1} value={d.quejasSintomas ?? ''} onChange={handleChange('quejasSintomas')} placeholder="Acúfenos, molestias, feedback, taponamiento, etc. Si no hay, indicar." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>4. Ajustes o intervenciones realizadas</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth label="Ajustes o intervenciones en esta cita" multiline minRows={2} value={d.ajustesIntervenciones ?? ''} onChange={handleChange('ajustesIntervenciones')} placeholder="Cambios de programación, limpieza, orientación, recambio de pilas/filtros, etc." />
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>5. Conclusiones y próxima cita</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Conclusión del control" multiline minRows={2} value={d.conclusiones ?? ''} onChange={handleChange('conclusiones')} placeholder="Resumen del control y valoración..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Próxima cita o seguimiento" multiline minRows={1} value={d.proximaCita ?? ''} onChange={handleChange('proximaCita')} placeholder="Fecha o tipo de próxima cita (control, revisión, adaptación, etc.)..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ControlForm;
