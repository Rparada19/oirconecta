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
 * Formulario de historia clínica: Cita de exámenes
 * Basado en protocolos de estudio audiológico: audiometría tonal, impedanciometría/timpanometría,
 * OEA, logoaudiometría, resultados e informe.
 */
const ExamenesForm = ({ data = {}, onChange }) => {
  const d = { ...data };
  const audiograma = d.audiograma ?? { od: {}, oi: {}, viaAerea: true };
  const handleChange = (field) => (e) => onChange(field, e.target.value);
  const setAudiograma = (oido, freq, val) => {
    const next = { ...audiograma, [oido]: { ...(audiograma[oido] || {}), [String(freq)]: val === '' ? '' : Number(val) || val } };
    onChange('audiograma', next);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#085946', mb: 0.5 }}>
        Historia clínica — Cita de exámenes (completa)
      </Typography>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>1. Exámenes realizados</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Listado de exámenes realizados" multiline minRows={2} value={d.examenesRealizados ?? ''} onChange={handleChange('examenesRealizados')} placeholder="Audiometría tonal liminar, impedanciometría/timpanometría, OEA, logoaudiometría, etc." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>2. Audiometría tonal (vía aérea / ósea)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>Umbrales en dB HL por frecuencia (250–8000 Hz)</Typography>
          <Table size="small" sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
            <TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>Frecuencia (Hz)</TableCell>{FREC.map((f) => <TableCell key={f} align="center">{f}</TableCell>)}</TableRow></TableHead>
            <TableBody>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>OD (dB HL)</TableCell>{FREC.map((f) => <TableCell key={f} align="center"><TextField type="number" size="small" inputProps={{ min: -10, max: 120 }} sx={{ width: 52 }} value={audiograma.od?.[f] ?? audiograma.od?.[String(f)] ?? ''} onChange={(e) => setAudiograma('od', f, e.target.value)} /></TableCell>)}</TableRow>
              <TableRow><TableCell sx={{ fontWeight: 600 }}>OI (dB HL)</TableCell>{FREC.map((f) => <TableCell key={f} align="center"><TextField type="number" size="small" inputProps={{ min: -10, max: 120 }} sx={{ width: 52 }} value={audiograma.oi?.[f] ?? audiograma.oi?.[String(f)] ?? ''} onChange={(e) => setAudiograma('oi', f, e.target.value)} /></TableCell>)}</TableRow>
            </TableBody>
          </Table>
          <TextField fullWidth label="Tipo (vía aérea / vía ósea) y observaciones" multiline minRows={1} value={d.audiometriaObservaciones ?? ''} onChange={handleChange('audiometriaObservaciones')} placeholder="Vía aérea, vía ósea, máscara si aplica..." />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>3. Impedanciometría / timpanometría</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Resultados de impedanciometría (OD / OI)" multiline minRows={3} value={d.impedanciometria ?? ''} onChange={handleChange('impedanciometria')} placeholder="Compliance, presión, tipo de curva (A, B, C), reflexos estapediales..." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Interpretación timpanometría" multiline minRows={2} value={d.timpanometriaInterpretacion ?? ''} onChange={handleChange('timpanometriaInterpretacion')} placeholder="Oído medio normal, disfunción tubárica, serosidad, etc." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>4. Otoemisiones acústicas (OEA)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth label="Resultados de OEA" multiline minRows={3} value={d.oea ?? ''} onChange={handleChange('oea')} placeholder="OEA transitorias o por producto de distorsión, presentes/ausentes por frecuencia, OD/OI..." />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>5. Logoaudiometría</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth label="Resultados de logoaudiometría" multiline minRows={3} value={d.logoaudiometria ?? ''} onChange={handleChange('logoaudiometria')} placeholder="Umbral de recepción del habla (SRT), discriminación (PB), listas de palabras, OD/OI..." />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>6. Conclusiones diagnósticas</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth label="Conclusiones del estudio audiológico" multiline minRows={3} value={d.conclusiones ?? ''} onChange={handleChange('conclusiones')} placeholder="Tipo y grado de hipoacusia, reserva coclear, diagnóstico audiológico..." />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>7. Derivación e informe médico</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Derivación (si aplica)" multiline minRows={2} value={d.derivacion ?? ''} onChange={handleChange('derivacion')} placeholder="Derivación a ORL, otología, implante coclear, etc." />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Resumen para informe médico" multiline minRows={3} value={d.informeMedico ?? ''} onChange={handleChange('informeMedico')} placeholder="Texto resumido para informe o carta al médico tratante..." />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default ExamenesForm;
