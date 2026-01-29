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
 * Formulario de historia clínica: Entrega de mantenimiento
 * Basado en protocolos de entrega de pilas, repuestos, kit de limpieza, instructivo y revisión.
 */
const EntregaMantenimientoForm = ({ data = {}, onChange }) => {
  const d = { ...data };
  const handleChange = (field) => (e) => onChange(field, e.target.value);
  const handleBool = (field) => (e) => onChange(field, e.target.checked);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#085946', mb: 0.5 }}>
        Historia clínica — Entrega de mantenimiento (completa)
      </Typography>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>1. Productos entregados</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Pilas / baterías" multiline minRows={1} value={d.pilasEntregadas ?? ''} onChange={handleChange('pilasEntregadas')} placeholder="Cantidad, tipo (675, 13, 312, 10), zinc-aire..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Repuestos (filtros, cúpulas, domos, tubos)" multiline minRows={1} value={d.repuestosEntregados ?? ''} onChange={handleChange('repuestosEntregados')} placeholder="Filtros anticerumen, cúpulas abiertas/cerradas, tubos..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Kit de limpieza y accesorios" multiline minRows={1} value={d.kitLimpieza ?? ''} onChange={handleChange('kitLimpieza')} placeholder="Gamuza, cepillo, herramienta anticerumen, estuche..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Deshumidificador / estuche antihumedad" multiline minRows={1} value={d.deshumidificador ?? ''} onChange={handleChange('deshumidificador')} placeholder="Si se entregó y tipo..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Otros productos entregados" multiline minRows={1} value={d.productosEntregados ?? ''} onChange={handleChange('productosEntregados')} placeholder="Cualquier otro ítem entregado..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>2. Instructivo y cuidados explicados</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel control={<Checkbox checked={!!d.instructivoPilas} onChange={handleBool('instructivoPilas')} />} label="Cambio de pilas explicado" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel control={<Checkbox checked={!!d.instructivoLimpieza} onChange={handleBool('instructivoLimpieza')} />} label="Limpieza diaria explicada" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel control={<Checkbox checked={!!d.instructivoAlmacenamiento} onChange={handleBool('instructivoAlmacenamiento')} />} label="Almacenamiento y humedad explicados" />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel control={<Checkbox checked={!!d.instructivoUso} onChange={handleBool('instructivoUso')} />} label="Uso (encendido, volumen, mando) explicado" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Detalle del instructivo y cuidados explicados" multiline minRows={3} value={d.instructivoDado ?? ''} onChange={handleChange('instructivoDado')} placeholder="Qué se explicó al paciente paso a paso..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>3. Próxima revisión y seguimiento</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Próxima revisión recomendada" multiline minRows={1} value={d.proximaRevision ?? ''} onChange={handleChange('proximaRevision')} placeholder="Ej: En 6 meses, en 3 meses, según necesidad..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Recordatorio de mantenimiento (cambio filtros, etc.)" multiline minRows={1} value={d.recordatorioMantenimiento ?? ''} onChange={handleChange('recordatorioMantenimiento')} placeholder="Cada cuánto cambiar filtros, revisar tubos..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>4. Observaciones</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth label="Observaciones de la entrega" multiline minRows={3} value={d.observaciones ?? ''} onChange={handleChange('observaciones')} placeholder="Cualquier observación adicional sobre la entrega o el estado del paciente..." />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default EntregaMantenimientoForm;
