import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AttachMoney from '@mui/icons-material/AttachMoney';

const defaultAnamnesisClinica = () => ({
  motivoConsulta: '',
  sintomasAuditivos: {
    hipoacusia: { presente: false, grado: '', oido: '', inicio: '', evolucion: '' },
    acufeno: { presente: false, tipo: '', frecuencia: '', intensidad: '', oido: '' },
    vertigo: { presente: false, frecuencia: '', duracion: '', desencadenantes: '' },
    dificultadPercepcionHabla: { presente: false, descripcion: '' },
    dificultadInteligibilidad: { presente: false, descripcion: '' },
    dificultadLocalizacionSonora: { presente: false, descripcion: '' },
  },
  antecedentesMedicos: {
    patologiasGenerales: [], cirugias: [], medicamentos: [], alergias: [], enfermedadesCronicas: [],
  },
  antecedentesOtorrinolaringologicos: {
    otitis: { presente: false, tipo: '', frecuencia: '', tratamiento: '' },
    perforacionTimpanica: { presente: false, oido: '', fecha: '' },
    traumaAcustico: { presente: false, descripcion: '', fecha: '' },
    exposicionRuido: { presente: false, tipo: '', duracion: '', intensidad: '' },
    otros: '',
  },
  antecedentesFamiliares: { hipoacusia: { presente: false, familiar: '', grado: '' }, otrasPatologias: [] },
  desarrollo: {
    embarazo: { normal: true, complicaciones: '' },
    parto: { normal: true, tipo: '', complicaciones: '' },
    desarrolloMotor: { normal: true, observaciones: '' },
    desarrolloLenguaje: { normal: true, observaciones: '' },
  },
});

const defaultAnamnesisSocial = () => ({
  estadoCivil: '', ocupacion: '', nivelEducativo: '',
  contextoFamiliar: { composicionFamiliar: '', apoyoFamiliar: '', observaciones: '' },
  contextoLaboral: { tipoTrabajo: '', ambienteRuido: false, usoProteccionAuditiva: false, observaciones: '' },
  contextoSocial: { actividadesRecreativas: [], participacionSocial: '', limitaciones: '' },
  habitos: { tabaquismo: { presente: false, frecuencia: '', duracion: '' }, alcohol: { presente: false, frecuencia: '', cantidad: '' }, otros: '' },
});

const FRECUENCIAS = [250, 500, 1000, 2000, 4000, 8000];

/**
 * Formulario completo de historia clínica: Cita primera vez
 * 1. Anamnesis clínica (completa)
 * 2. Anamnesis social (completa)
 * 3. Audiograma
 * 4. Otoscopia, impedanciometría
 * 5. Logoaudiometría
 * 6. Pruebas de audífonos, resultados
 * 7. Informe médico
 * 8. Conclusiones
 * 9. Botón nueva cotización
 */
const PrimeraVezForm = ({ data = {}, onChange, onNuevaCotizacion }) => {
  const ac = { ...defaultAnamnesisClinica(), ...(data.anamnesisClinica || {}) };
  const as = { ...defaultAnamnesisSocial(), ...(data.anamnesisSocial || {}) };
  const audiograma = data.audiograma || { od: {}, oi: {}, observaciones: '' };
  const otoscopiaImpedancia = data.otoscopiaImpedanciometria ?? '';
  const logoaudiometria = data.logoaudiometria ?? '';
  const pruebasAudifonos = data.pruebasAudifonos ?? '';
  const informeMedico = data.informeMedico ?? '';
  const conclusiones = data.conclusiones ?? '';

  const setAc = (next) => onChange('anamnesisClinica', { ...ac, ...next });
  const setAs = (next) => onChange('anamnesisSocial', { ...as, ...next });
  const setSintomas = (key, subKey, val) => setAc({ sintomasAuditivos: { ...ac.sintomasAuditivos, [key]: typeof val === 'object' ? val : { ...ac.sintomasAuditivos[key], [subKey]: val } } });
  const setAntecedentes = (key, val) => setAc({ antecedentesMedicos: { ...ac.antecedentesMedicos, [key]: Array.isArray(val) ? val : val } });
  const setAntecedentesORL = (key, val) => setAc({ antecedentesOtorrinolaringologicos: { ...ac.antecedentesOtorrinolaringologicos, [key]: val } });
  const setDesarrollo = (key, val) => setAc({ desarrollo: { ...ac.desarrollo, [key]: val } });
  const setContextoFamiliar = (key, val) => setAs({ contextoFamiliar: { ...as.contextoFamiliar, [key]: val } });
  const setContextoLaboral = (key, val) => setAs({ contextoLaboral: { ...as.contextoLaboral, [key]: val } });
  const setContextoSocial = (key, val) => setAs({ contextoSocial: { ...as.contextoSocial, [key]: Array.isArray(val) ? val : val } });
  const setHabitos = (key, val) => setAs({ habitos: { ...as.habitos, [key]: val } });

  const setAudiogramaCell = (oido, freq, value) => {
    const next = { ...audiograma, [oido]: { ...(audiograma[oido] || {}), [String(freq)]: value === '' ? '' : Number(value) || value } };
    onChange('audiograma', next);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#085946', mb: 1 }}>
        Historia clínica — Cita primera vez (completa)
      </Typography>

      {/* 1. Anamnesis clínica */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>1. Anamnesis clínica</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Motivo de consulta" multiline minRows={2} value={ac.motivoConsulta} onChange={(e) => setAc({ motivoConsulta: e.target.value })} />
            </Grid>
            <Grid item xs={12}><Typography variant="overline">Síntomas auditivos</Typography></Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel control={<Switch checked={ac.sintomasAuditivos.hipoacusia.presente} onChange={(e) => setSintomas('hipoacusia', 'presente', e.target.checked)} />} label="Hipoacusia" />
              {ac.sintomasAuditivos.hipoacusia.presente && (
                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                  <Grid item xs={6}><FormControl fullWidth size="small"><InputLabel>Grado</InputLabel><Select value={ac.sintomasAuditivos.hipoacusia.grado} label="Grado" onChange={(e) => setSintomas('hipoacusia', 'grado', e.target.value)}><MenuItem value="leve">Leve</MenuItem><MenuItem value="moderada">Moderada</MenuItem><MenuItem value="severa">Severa</MenuItem><MenuItem value="profunda">Profunda</MenuItem></Select></FormControl></Grid>
                  <Grid item xs={6}><FormControl fullWidth size="small"><InputLabel>Oído</InputLabel><Select value={ac.sintomasAuditivos.hipoacusia.oido} label="Oído" onChange={(e) => setSintomas('hipoacusia', 'oido', e.target.value)}><MenuItem value="derecho">Derecho</MenuItem><MenuItem value="izquierdo">Izquierdo</MenuItem><MenuItem value="ambos">Ambos</MenuItem></Select></FormControl></Grid>
                  <Grid item xs={6}><TextField fullWidth size="small" label="Inicio" value={ac.sintomasAuditivos.hipoacusia.inicio} onChange={(e) => setSintomas('hipoacusia', 'inicio', e.target.value)} /></Grid>
                  <Grid item xs={6}><TextField fullWidth size="small" label="Evolución" value={ac.sintomasAuditivos.hipoacusia.evolucion} onChange={(e) => setSintomas('hipoacusia', 'evolucion', e.target.value)} /></Grid>
                </Grid>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel control={<Switch checked={ac.sintomasAuditivos.acufeno.presente} onChange={(e) => setSintomas('acufeno', 'presente', e.target.checked)} />} label="Acúfeno (Tinnitus)" />
              {ac.sintomasAuditivos.acufeno.presente && (
                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                  <Grid item xs={6}><TextField fullWidth size="small" label="Tipo" value={ac.sintomasAuditivos.acufeno.tipo} onChange={(e) => setSintomas('acufeno', 'tipo', e.target.value)} /></Grid>
                  <Grid item xs={6}><TextField fullWidth size="small" label="Oído" value={ac.sintomasAuditivos.acufeno.oido} onChange={(e) => setSintomas('acufeno', 'oido', e.target.value)} /></Grid>
                </Grid>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel control={<Switch checked={ac.sintomasAuditivos.vertigo.presente} onChange={(e) => setSintomas('vertigo', 'presente', e.target.checked)} />} label="Vértigo / Mareo" />
              {ac.sintomasAuditivos.vertigo.presente && (
                <TextField fullWidth size="small" sx={{ mt: 0.5 }} label="Frecuencia, duración, desencadenantes" value={[ac.sintomasAuditivos.vertigo.frecuencia, ac.sintomasAuditivos.vertigo.duracion, ac.sintomasAuditivos.vertigo.desencadenantes].filter(Boolean).join(' • ')} onChange={(e) => { const v = e.target.value.split(' • '); setSintomas('vertigo', 'frecuencia', v[0]||''); setSintomas('vertigo', 'duracion', v[1]||''); setSintomas('vertigo', 'desencadenantes', v[2]||''); }} />
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={2} label="Antecedentes médicos (patologías, cirugías, medicamentos, alergias)" value={ac.antecedentesMedicosResumen || [...(ac.antecedentesMedicos?.patologiasGenerales||[]), ...(ac.antecedentesMedicos?.cirugias||[]), ...(ac.antecedentesMedicos?.medicamentos||[]), ...(ac.antecedentesMedicos?.alergias||[])].join(', ')} onChange={(e) => setAc({ antecedentesMedicosResumen: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={2} label="Antecedentes ORL (otitis, traumatismo, exposición a ruido, otros)" value={ac.antecedentesOtorrinolaringologicos.otros || ''} onChange={(e) => setAntecedentesORL('otros', e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={1} label="Antecedentes familiares (hipoacusia, otros)" value={ac.antecedentesFamiliares.hipoacusia?.familiar ? `${ac.antecedentesFamiliares.hipoacusia.familiar} - ${ac.antecedentesFamiliares.hipoacusia.grado}` : ''} onChange={(e) => setAc({ antecedentesFamiliares: { ...ac.antecedentesFamiliares, hipoacusia: { presente: true, familiar: e.target.value.split(' - ')[0]||'', grado: e.target.value.split(' - ')[1]||'' } } })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={2} label="Desarrollo (embarazo, parto, motor, lenguaje)" value={ac.desarrolloResumen || [ac.desarrollo?.embarazo?.complicaciones, ac.desarrollo?.parto?.complicaciones, ac.desarrollo?.desarrolloMotor?.observaciones, ac.desarrollo?.desarrolloLenguaje?.observaciones].filter(Boolean).join(' | ')} onChange={(e) => setAc({ desarrolloResumen: e.target.value })} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 2. Anamnesis social */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>2. Anamnesis social</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small"><InputLabel>Estado civil</InputLabel><Select value={as.estadoCivil} label="Estado civil" onChange={(e) => setAs({ estadoCivil: e.target.value })}><MenuItem value="soltero">Soltero(a)</MenuItem><MenuItem value="casado">Casado(a)</MenuItem><MenuItem value="divorciado">Divorciado(a)</MenuItem><MenuItem value="viudo">Viudo(a)</MenuItem><MenuItem value="union-libre">Unión libre</MenuItem></Select></FormControl>
            </Grid>
            <Grid item xs={12} sm={4}><TextField fullWidth size="small" label="Ocupación" value={as.ocupacion} onChange={(e) => setAs({ ocupacion: e.target.value })} /></Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small"><InputLabel>Nivel educativo</InputLabel><Select value={as.nivelEducativo} label="Nivel educativo" onChange={(e) => setAs({ nivelEducativo: e.target.value })}><MenuItem value="primaria">Primaria</MenuItem><MenuItem value="secundaria">Secundaria</MenuItem><MenuItem value="tecnico">Técnico</MenuItem><MenuItem value="universitario">Universitario</MenuItem><MenuItem value="postgrado">Postgrado</MenuItem></Select></FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Contexto familiar" value={[as.contextoFamiliar?.composicionFamiliar, as.contextoFamiliar?.apoyoFamiliar].filter(Boolean).join(' — ')} onChange={(e) => setContextoFamiliar('composicionFamiliar', e.target.value)} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Contexto laboral (tipo de trabajo, ruido, protección auditiva)" value={as.contextoLaboral?.tipoTrabajo || ''} onChange={(e) => setContextoLaboral('tipoTrabajo', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={as.contextoLaboral?.ambienteRuido || false} onChange={(e) => setContextoLaboral('ambienteRuido', e.target.checked)} />} label="Ambiente con ruido" /></Grid>
            <Grid item xs={12} sm={6}><FormControlLabel control={<Switch checked={as.contextoLaboral?.usoProteccionAuditiva || false} onChange={(e) => setContextoLaboral('usoProteccionAuditiva', e.target.checked)} />} label="Usa protección auditiva" /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={2} label="Contexto social (actividades, participación, limitaciones)" value={as.contextoSocial?.participacionSocial || ''} onChange={(e) => setContextoSocial('participacionSocial', e.target.value)} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline minRows={1} label="Hábitos (tabaquismo, alcohol, otros)" value={as.habitos?.otros || ''} onChange={(e) => setHabitos('otros', e.target.value)} /></Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* 3. Audiograma */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>3. Audiograma (audiometría)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper variant="outlined" sx={{ overflow: 'auto', mb: 2 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Frecuencia (Hz)</TableCell>
                  {FRECUENCIAS.map((f) => (<TableCell key={f} align="center">{f}</TableCell>))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>OD (dB HL)</TableCell>
                  {FRECUENCIAS.map((f) => (
                    <TableCell key={f} align="center">
                      <TextField type="number" size="small" inputProps={{ min: -10, max: 120 }} sx={{ width: 56 }} value={audiograma.od?.[f] ?? audiograma.od?.[String(f)] ?? ''} onChange={(e) => setAudiogramaCell('od', f, e.target.value)} />
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>OI (dB HL)</TableCell>
                  {FRECUENCIAS.map((f) => (
                    <TableCell key={f} align="center">
                      <TextField type="number" size="small" inputProps={{ min: -10, max: 120 }} sx={{ width: 56 }} value={audiograma.oi?.[f] ?? audiograma.oi?.[String(f)] ?? ''} onChange={(e) => setAudiogramaCell('oi', f, e.target.value)} />
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </Paper>
          <TextField fullWidth multiline minRows={2} label="Observaciones del audiograma" value={audiograma.observaciones || ''} onChange={(e) => onChange('audiograma', { ...audiograma, observaciones: e.target.value })} />
        </AccordionDetails>
      </Accordion>

      {/* 4. Otoscopia, impedanciometría */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>4. Otoscopia e impedanciometría</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth multiline minRows={4} placeholder="Hallazgos de otoscopia e impedanciometría..." value={otoscopiaImpedancia} onChange={(e) => onChange('otoscopiaImpedanciometria', e.target.value)} />
        </AccordionDetails>
      </Accordion>

      {/* 5. Logoaudiometría */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>5. Logoaudiometría</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth multiline minRows={4} placeholder="Resultados de logoaudiometría (SRT, discriminación, etc.)..." value={logoaudiometria} onChange={(e) => onChange('logoaudiometria', e.target.value)} />
        </AccordionDetails>
      </Accordion>

      {/* 6. Pruebas de audífonos, resultados */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>6. Pruebas de audífonos y resultados obtenidos</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth multiline minRows={4} placeholder="Pruebas realizadas y resultados..." value={pruebasAudifonos} onChange={(e) => onChange('pruebasAudifonos', e.target.value)} />
        </AccordionDetails>
      </Accordion>

      {/* 7. Informe médico */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>7. Informe médico</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth multiline minRows={4} placeholder="Informe médico de la consulta..." value={informeMedico} onChange={(e) => onChange('informeMedico', e.target.value)} />
        </AccordionDetails>
      </Accordion>

      {/* 8. Conclusiones */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>8. Conclusiones</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField fullWidth multiline minRows={3} placeholder="Conclusiones de la valoración..." value={conclusiones} onChange={(e) => onChange('conclusiones', e.target.value)} />
        </AccordionDetails>
      </Accordion>

      {/* 9. Botón nueva cotización */}
      {onNuevaCotizacion && (
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" startIcon={<AttachMoney />} onClick={onNuevaCotizacion} sx={{ bgcolor: '#085946' }}>
            Ir a nueva cotización
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PrimeraVezForm;
