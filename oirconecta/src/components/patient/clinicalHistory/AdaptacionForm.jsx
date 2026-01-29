import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  FormControlLabel,
  Switch,
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';

/**
 * Formulario de historia clínica: Cita de adaptación
 * Basado en protocolos de adaptación de prótesis auditivas y seguimiento.
 * Información que debe reposar en la cita de adaptación:
 * - Anamnesis de seguimiento: motivo, antecedentes desde última cita, equipo en adaptación (trazabilidad)
 * - Otoscopia de control
 * - Estado de la adaptación: uso, tolerancia, valoración profesional
 * - Molestias y quejas reportadas
 * - Ganancia funcional y verificación en vivo (si se realizó)
 * - Ajustes de programación y físicos realizados
 * - Satisfacción y formación reforzada del paciente
 * - Próxima cita y conclusiones
 */
const AdaptacionForm = ({ data = {}, onChange }) => {
  const d = { ...data };
  const handleChange = (field) => (e) => onChange(field, e.target.value);
  const handleBool = (field) => (e) => onChange(field, e.target.checked);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#085946', mb: 0.5 }}>
        Historia clínica — Cita de adaptación (completa)
      </Typography>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>1. Anamnesis de seguimiento</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Motivo de la cita de seguimiento" multiline minRows={2} value={d.motivoSeguimiento ?? ''} onChange={handleChange('motivoSeguimiento')} placeholder="Por qué asiste el paciente a esta cita de adaptación (revisión programada, molestia, ajuste, etc.)..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Equipo en adaptación (opcional)" multiline minRows={1} value={d.equipoEnAdaptacion ?? ''} onChange={handleChange('equipoEnAdaptacion')} placeholder="Marca, modelo y oído(s) — ej. Signia AX OI/OD, Phonak Audeo P 90 OI..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Antecedentes otológicos desde última cita" multiline minRows={2} value={d.antecedentesDesdeUltima ?? ''} onChange={handleChange('antecedentesDesdeUltima')} placeholder="Otitis, tapones, cambios en la audición, cirugías o tratamientos recientes..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>2. Otoscopia de control</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth label="Hallazgos de otoscopia" multiline minRows={3} value={d.otoscopiaControl ?? ''} onChange={handleChange('otoscopiaControl')} placeholder="Estado del conducto auditivo externo, cerumen, integridad timpánica..." />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>3. Estado de la adaptación</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Uso de los audífonos (horas/día, situaciones)" multiline minRows={2} value={d.usoDiario ?? ''} onChange={handleChange('usoDiario')} placeholder="Ej: 8 h/día, en trabajo y reuniones..." />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel control={<Switch checked={!!d.toleraBien} onChange={handleBool('toleraBien')} color="primary" />} label="Tolera bien la amplificación" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Estado general de la adaptación" multiline minRows={2} value={d.estadoAdaptacion ?? ''} onChange={handleChange('estadoAdaptacion')} placeholder="Cómo lleva el paciente la adaptación según valoración profesional..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>4. Molestias y quejas reportadas</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth label="Molestias o quejas del paciente" multiline minRows={3} value={d.molestiasReportadas ?? ''} onChange={handleChange('molestiasReportadas')} placeholder="Acúfenos aumentados, feedback, molestia por volumen, incomodidad física..." />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>5. Ganancia funcional y audición</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Ganancia funcional observada" multiline minRows={2} value={d.gananciaFuncional ?? ''} onChange={handleChange('gananciaFuncional')} placeholder="Mejoría en audición, comunicación, entorno ruidoso..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Verificación en vivo / mediciones (si se realizaron)" multiline minRows={1} value={d.verificacionVivo ?? ''} onChange={handleChange('verificacionVivo')} placeholder="Umbrales con audífonos, discriminación..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>6. Ajustes realizados</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Ajustes de programación" multiline minRows={2} value={d.ajustesProgramacion ?? ''} onChange={handleChange('ajustesProgramacion')} placeholder="Cambios de ganancia, compresión, canales..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Ajustes físicos (moldes, cúpulas, domos)" multiline minRows={1} value={d.ajustesFisicos ?? ''} onChange={handleChange('ajustesFisicos')} placeholder="Recambio de cúpulas, remodelado, etc." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Resumen de ajustes realizados" multiline minRows={2} value={d.ajustesRealizados ?? ''} onChange={handleChange('ajustesRealizados')} placeholder="Resumen general de cambios en esta cita..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>7. Satisfacción y formación del paciente</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth label="Satisfacción / observaciones del paciente" multiline minRows={2} value={d.satisfaccion ?? ''} onChange={handleChange('satisfaccion')} placeholder="Comentarios del paciente sobre la adaptación..." />
          <TextField fullWidth label="Formación o instructivo reforzado" multiline minRows={1} value={d.formacionReforzada ?? ''} onChange={handleChange('formacionReforzada')} placeholder="Uso del mando, limpieza, pilas..." sx={{ mt: 2 }} />
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>8. Próxima cita y conclusiones</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Próxima cita / plan de seguimiento" multiline minRows={1} value={d.proximaCita ?? ''} onChange={handleChange('proximaCita')} placeholder="Fecha o plazo para próxima revisión (ej: 1 mes, 6 meses)..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Conclusiones de la cita de adaptación" multiline minRows={2} value={d.conclusiones ?? ''} onChange={handleChange('conclusiones')} placeholder="Resumen y plan a seguir..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default AdaptacionForm;
