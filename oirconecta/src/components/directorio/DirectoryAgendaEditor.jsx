import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Switch,
  FormControlLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Schedule } from '@mui/icons-material';
import {
  DIRECTORY_DIAS_AGENDA,
  DIRECTORY_DIAS_LABEL,
  defaultDirectoryAvailability,
  parseDirectoryAvailability,
} from '../../utils/directoryAgendaDefaults';

/**
 * Editor de disponibilidad semanal (misma idea que horarios del CRM).
 * @param {{ value: object; onChange: (next: object) => void }} props
 */
export default function DirectoryAgendaEditor({ value, onChange }) {
  const agenda = useMemo(() => parseDirectoryAvailability(value), [value]);

  const setAgenda = (patch) => {
    onChange({ ...agenda, ...patch });
  };

  const setDia = (dia, field, v) => {
    setAgenda({
      horarioPorDia: {
        ...agenda.horarioPorDia,
        [dia]: { ...agenda.horarioPorDia[dia], [field]: v },
      },
    });
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Schedule color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          Agenda pública (días y franjas)
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Esto orienta a los pacientes sobre cuándo sueles atender; el agendamiento real puede seguir siendo el flujo de OírConecta
        o el que definas por WhatsApp.
      </Typography>

      <FormControl fullWidth size="small" sx={{ maxWidth: 280, mb: 2 }}>
        <InputLabel id="dur-cita-label">Duración orientativa de cita</InputLabel>
        <Select
          labelId="dur-cita-label"
          label="Duración orientativa de cita"
          value={agenda.duracionCitaMinutos}
          onChange={(e) => setAgenda({ duracionCitaMinutos: Number(e.target.value) })}
        >
          {[15, 20, 30, 45, 60].map((m) => (
            <MenuItem key={m} value={m}>
              {m} minutos
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack spacing={1.5}>
        {DIRECTORY_DIAS_AGENDA.map((dia) => {
          const d = agenda.horarioPorDia[dia] || defaultDirectoryAvailability().horarioPorDia[dia];
          return (
            <Paper key={dia} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!d.enabled}
                    onChange={(e) => setDia(dia, 'enabled', e.target.checked)}
                    color="primary"
                  />
                }
                label={<Typography sx={{ fontWeight: 700, minWidth: 100 }}>{DIRECTORY_DIAS_LABEL[dia]}</Typography>}
              />
              {d.enabled ? (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                  <TextField
                    label="Inicio"
                    type="time"
                    size="small"
                    value={d.inicio}
                    onChange={(e) => setDia(dia, 'inicio', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 130 }}
                  />
                  <TextField
                    label="Fin"
                    type="time"
                    size="small"
                    value={d.fin}
                    onChange={(e) => setDia(dia, 'fin', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 130 }}
                  />
                  <TextField
                    label="Almuerzo desde"
                    type="time"
                    size="small"
                    value={d.almuerzoInicio}
                    onChange={(e) => setDia(dia, 'almuerzoInicio', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 150 }}
                  />
                  <TextField
                    label="Almuerzo hasta"
                    type="time"
                    size="small"
                    value={d.almuerzoFin}
                    onChange={(e) => setDia(dia, 'almuerzoFin', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 150 }}
                  />
                </Stack>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Día no disponible para citas
                </Typography>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
