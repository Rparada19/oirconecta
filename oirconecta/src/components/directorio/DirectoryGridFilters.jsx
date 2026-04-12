import React from 'react';
import { Box, Stack, FormControl, InputLabel, Select, MenuItem, TextField, Typography } from '@mui/material';
import { PROFESIONES_CATALOGO } from '../../utils/profesionFilter';

/**
 * Filtros locales para la rejilla (profesión, ciudad, valoración mínima, texto servicios).
 */
export default function DirectoryGridFilters({ cities, value, onChange }) {
  const v = value || {
    profession: 'Todas',
    city: 'Todas',
    minRating: 0,
    serviceText: '',
  };

  const set = (patch) => onChange({ ...v, ...patch });

  return (
    <Box
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(39, 47, 80, 0.08)',
        boxShadow: '0 8px 28px rgba(30, 36, 56, 0.05)',
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
        Afinar resultados
      </Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'flex-end' }}>
        <FormControl size="small" fullWidth sx={{ maxWidth: { md: 200 } }}>
          <InputLabel id="dgf-prof">Profesión</InputLabel>
          <Select
            labelId="dgf-prof"
            label="Profesión"
            value={v.profession}
            onChange={(e) => set({ profession: e.target.value })}
          >
            <MenuItem value="Todas">Todas</MenuItem>
            {PROFESIONES_CATALOGO.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth sx={{ maxWidth: { md: 200 } }}>
          <InputLabel id="dgf-city">Ciudad</InputLabel>
          <Select labelId="dgf-city" label="Ciudad" value={v.city} onChange={(e) => set({ city: e.target.value })}>
            <MenuItem value="Todas">Todas</MenuItem>
            {(cities || []).map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth sx={{ maxWidth: { md: 200 } }}>
          <InputLabel id="dgf-rate">Valoración mín.</InputLabel>
          <Select
            labelId="dgf-rate"
            label="Valoración mín."
            value={String(v.minRating ?? 0)}
            onChange={(e) => set({ minRating: Number(e.target.value) })}
          >
            <MenuItem value="0">Cualquiera</MenuItem>
            <MenuItem value="4.5">4.5 o más</MenuItem>
            <MenuItem value="4.7">4.7 o más</MenuItem>
            <MenuItem value="4.9">4.9 o más</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          fullWidth
          label="Servicio o palabra clave"
          placeholder="Ej. adaptación, implante, rinitis…"
          value={v.serviceText}
          onChange={(e) => set({ serviceText: e.target.value })}
          sx={{ flex: 1 }}
        />
      </Stack>
    </Box>
  );
}
