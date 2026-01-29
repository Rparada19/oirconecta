import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';

const FREC = [250, 500, 1000, 2000, 4000, 8000];

/**
 * Formulario de historia clínica: Prueba de audífonos
 * Basado en evaluación de demos, preferencia del paciente, resultados en prueba y conclusiones.
 */
const PruebaAudifonosForm = ({ data = {}, onChange }) => {
  const d = { ...data };
  const audiograma = d.audiogramaConAuxiliar ?? { od: {}, oi: {} };
  const handleChange = (field) => (e) => onChange(field, e.target.value);
  const setAudiograma = (oido, freq, val) => {
    const next = { ...audiograma, [oido]: { ...(audiograma[oido] || {}), [String(freq)]: val === '' ? '' : Number(val) || val } };
    onChange('audiogramaConAuxiliar', next);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#085946', mb: 0.5 }}>
        Historia clínica — Prueba de audífonos (completa)
      </Typography>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>1. Modelos y marcas probados</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Marcas y modelos utilizados en la prueba" multiline minRows={2} value={d.modelosProbados ?? ''} onChange={handleChange('modelosProbados')} placeholder="Ej: Phonak Audeo P90 BTE derecha, Oticon More 1 RITE izquierda..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Tipo de prueba (unilateral/bilateral, BTE/ITE, etc.)" multiline minRows={1} value={d.tipoPrueba ?? ''} onChange={handleChange('tipoPrueba')} placeholder="Bilateral, retroauricular, intracanal..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>2. Audiometría con auxiliar (si se realizó)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Table size="small" sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
            <TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>Frecuencia (Hz)</TableCell>{FREC.map((f) => <TableCell key={f} align="center">{f}</TableCell>)}</TableRow></TableHead>
            <TableBody>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>OD (dB HL)</TableCell>{FREC.map((f) => <TableCell key={f} align="center"><TextField type="number" size="small" inputProps={{ min: -10, max: 120 }} sx={{ width: 52 }} value={audiograma.od?.[f] ?? audiograma.od?.[String(f)] ?? ''} onChange={(e) => setAudiograma('od', f, e.target.value)} /></TableCell>)}</TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>OI (dB HL)</TableCell>{FREC.map((f) => <TableCell key={f} align="center"><TextField type="number" size="small" inputProps={{ min: -10, max: 120 }} sx={{ width: 52 }} value={audiograma.oi?.[f] ?? audiograma.oi?.[String(f)] ?? ''} onChange={(e) => setAudiograma('oi', f, e.target.value)} /></TableCell>)}</TableRow>
            </TableBody>
          </Table>
          <TextField fullWidth label="Observaciones del audiograma con audífonos" multiline minRows={1} value={audiograma.observaciones ?? ''} onChange={(e) => onChange('audiogramaConAuxiliar', { ...audiograma, observaciones: e.target.value })} />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>3. Preferencia y percepción del paciente</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Preferencia del paciente (comodidad, sonido, estética)" multiline minRows={3} value={d.preferenciaPaciente ?? ''} onChange={handleChange('preferenciaPaciente')} placeholder="Qué modelo/situación prefiere y por qué..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Percepción en situaciones (ruido, habla, música)" multiline minRows={2} value={d.percepcionSituaciones ?? ''} onChange={handleChange('percepcionSituaciones')} placeholder="Cómo percibe el paciente en diferentes entornos durante la prueba..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>4. Resultados en prueba (umbrales, discriminación)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth label="Umbrales y resultados durante la prueba" multiline minRows={3} value={d.umbralesObservados ?? ''} onChange={handleChange('umbralesObservados')} placeholder="Umbrales en campo libre, discriminación, PB máxima si se realizó..." />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>5. Conclusiones y recomendación</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Conclusión de la prueba" multiline minRows={2} value={d.conclusiones ?? ''} onChange={handleChange('conclusiones')} placeholder="Conclusión profesional sobre la prueba..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Recomendación (modelo, lateralidad, próxima cita)" multiline minRows={2} value={d.recomendacion ?? ''} onChange={handleChange('recomendacion')} placeholder="Recomendación de adaptación y siguientes pasos..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default PruebaAudifonosForm;
