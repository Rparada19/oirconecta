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
  Checkbox,
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';

/**
 * Formulario de historia clínica: Revisión de audífonos
 * Basado en protocolos de revisión profesional: estado del equipo, limpieza,
 * baterías, verificación técnica, ajustes y componentes cambiados.
 */
const RevisionAudifonosForm = ({ data = {}, onChange }) => {
  const d = { ...data };
  const handleChange = (field) => (e) => onChange(field, e.target.value);
  const handleBool = (field) => (e) => onChange(field, e.target.checked);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#085946', mb: 0.5 }}>
        Historia clínica — Revisión de audífonos (completa)
      </Typography>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>1. Estado del equipo</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Estado general de audífonos y moldes/cúpulas" multiline minRows={2} value={d.estadoEquipo ?? ''} onChange={handleChange('estadoEquipo')} placeholder="Integridad, desgaste, fisuras, tubos..." />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel control={<Checkbox checked={!!d.microfonoOk} onChange={handleBool('microfonoOk')} />} label="Micrófono OK" />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel control={<Checkbox checked={!!d.receptorOk} onChange={handleBool('receptorOk')} />} label="Receptor OK" />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel control={<Checkbox checked={!!d.procesadorOk} onChange={handleBool('procesadorOk')} />} label="Procesador OK" />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>2. Limpieza realizada</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Limpieza profunda realizada" multiline minRows={2} value={d.limpiezaRealizada ?? ''} onChange={handleChange('limpiezaRealizada')} placeholder="Limpieza de cerumen, filtros, rejillas, tubos..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Filtros y componentes de limpieza (cambio, estado)" multiline minRows={1} value={d.filtrosEstado ?? ''} onChange={handleChange('filtrosEstado')} placeholder="Filtros cambiados, cúpulas limpiadas..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>3. Baterías / pilas</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Estado de baterías o pilas" multiline minRows={1} value={d.baterias ?? ''} onChange={handleChange('baterias')} placeholder="Recambio realizado, recargables cargadas, duración estimada..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Pilas entregadas en esta revisión (si aplica)" multiline minRows={1} value={d.pilasEntregadas ?? ''} onChange={handleChange('pilasEntregadas')} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>4. Verificación técnica y rendimiento</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth label="Verificación del rendimiento (análisis, test en vivo)" multiline minRows={2} value={d.verificacionTecnica ?? ''} onChange={handleChange('verificacionTecnica')} placeholder="Resultados de análisis de ganancia, SPL, etc. si se realizaron..." />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>5. Ajustes realizados</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Ajustes de programación según cambios auditivos" multiline minRows={2} value={d.ajustesProgramacion ?? ''} onChange={handleChange('ajustesProgramacion')} placeholder="Cambios de ganancia o programas por evolución..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Ajustes físicos (moldes, cúpulas, tubos)" multiline minRows={1} value={d.ajustesRealizados ?? ''} onChange={handleChange('ajustesRealizados')} placeholder="Componentes desgastados cambiados..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Componentes cambiados en esta revisión" multiline minRows={1} value={d.componentesCambiados ?? ''} onChange={handleChange('componentesCambiados')} placeholder="Filtros, cúpulas, tubos, pilas..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>6. Recomendaciones y próxima revisión</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Recomendaciones al paciente" multiline minRows={2} value={d.recomendaciones ?? ''} onChange={handleChange('recomendaciones')} placeholder="Cuidados, uso del deshumidificador, próxima revisión..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Próxima revisión programada" multiline minRows={1} value={d.proximaRevision ?? ''} onChange={handleChange('proximaRevision')} placeholder="Ej: En 6 meses, trimestral..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default RevisionAudifonosForm;
