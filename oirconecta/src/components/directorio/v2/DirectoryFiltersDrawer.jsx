import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Select,
  Slider,
  Stack,
  Typography,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { fetchProfessions, fetchDepartments, fetchCities } from '../../../services/directoryDiscoveryService';

const SORT_OPTIONS = [
  { value: 'ranking', label: 'Recomendados' },
  { value: 'rating', label: 'Mejor calificados' },
  { value: 'reviews', label: 'Más reseñados' },
  { value: 'recent', label: 'Más recientes' },
];

const MODALIDAD_OPTIONS = [
  { value: '', label: 'Cualquiera' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'ambos', label: 'Ambos' },
];

/**
 * Drawer de filtros (lateral en desktop, bottom-sheet en mobile).
 * Estado controlado por el padre vía `value`/`onApply`. Mantiene un buffer
 * interno para que el usuario pueda descartar cambios sin aplicar.
 */
export default function DirectoryFiltersDrawer({ open, onClose, value, onApply, onClear }) {
  const [buffer, setBuffer] = useState(value || {});
  const [professions, setProfessions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (open) setBuffer(value || {});
  }, [open, value]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchProfessions(), fetchDepartments()])
      .then(([profRes, depRes]) => {
        if (cancelled) return;
        if (profRes && profRes.data && Array.isArray(profRes.data.data)) setProfessions(profRes.data.data);
        if (depRes && depRes.data && Array.isArray(depRes.data.data)) setDepartments(depRes.data.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Carga ciudades cuando cambia el departamento elegido.
  useEffect(() => {
    let cancelled = false;
    const slug = buffer.departmentSlug;
    if (!slug) {
      setCities([]);
      return;
    }
    fetchCities({ departmentSlug: slug, limit: 200 })
      .then((res) => {
        if (!cancelled && res && res.data && Array.isArray(res.data.data)) setCities(res.data.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [buffer.departmentSlug]);

  const setField = (key, val) => setBuffer((b) => ({ ...b, [key]: val }));

  const apply = () => {
    onApply(buffer);
    onClose();
  };

  const clear = () => {
    const empty = { sort: 'ranking' };
    setBuffer(empty);
    onClear?.();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          maxWidth: '100vw',
          bgcolor: 'background.default',
          borderTopLeftRadius: { xs: 0, sm: 24 },
          borderBottomLeftRadius: { xs: 0, sm: 24 },
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Filtros
        </Typography>
        <IconButton onClick={onClose} aria-label="Cerrar filtros">
          <CloseRoundedIcon />
        </IconButton>
      </Box>
      <Divider />

      <Box sx={{ px: 3, py: 3, flex: 1, overflowY: 'auto' }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Profesión
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
              {professions.map((p) => {
                const selected = buffer.professionSlug === p.slug;
                return (
                  <Chip
                    key={p.slug}
                    label={p.nombre}
                    clickable
                    onClick={() => setField('professionSlug', selected ? undefined : p.slug)}
                    sx={{
                      fontWeight: 600,
                      bgcolor: selected ? 'primary.main' : 'background.paper',
                      color: selected ? '#fff' : 'text.primary',
                      border: '1px solid',
                      borderColor: selected ? 'primary.main' : 'grey.200',
                      '&:hover': { bgcolor: selected ? 'primary.dark' : 'grey.50' },
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Departamento
            </Typography>
            <Select
              fullWidth
              size="small"
              value={buffer.departmentSlug || ''}
              onChange={(e) => {
                setField('departmentSlug', e.target.value || undefined);
                setField('citySlug', undefined);
              }}
              displayEmpty
              sx={{ mt: 1, bgcolor: 'background.paper', borderRadius: 2 }}
            >
              <MenuItem value="">Todos los departamentos</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.slug} value={d.slug}>
                  {d.nombre}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {buffer.departmentSlug && cities.length > 0 && (
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>
                Ciudad / Municipio
              </Typography>
              <Select
                fullWidth
                size="small"
                value={buffer.citySlug || ''}
                onChange={(e) => setField('citySlug', e.target.value || undefined)}
                displayEmpty
                sx={{ mt: 1, bgcolor: 'background.paper', borderRadius: 2 }}
              >
                <MenuItem value="">Todas las ciudades</MenuItem>
                {cities.map((c) => (
                  <MenuItem key={c.slug} value={c.slug}>
                    {c.nombre}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}

          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Modalidad
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
              {MODALIDAD_OPTIONS.map((m) => {
                const selected = (buffer.modalidad || '') === m.value;
                return (
                  <Chip
                    key={m.value || 'any'}
                    label={m.label}
                    clickable
                    onClick={() => setField('modalidad', m.value || undefined)}
                    sx={{
                      fontWeight: 600,
                      bgcolor: selected ? 'secondary.main' : 'background.paper',
                      color: selected ? '#fff' : 'text.primary',
                      border: '1px solid',
                      borderColor: selected ? 'secondary.main' : 'grey.200',
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Calificación mínima: {buffer.minRating ? `${buffer.minRating}+ ★` : 'cualquiera'}
            </Typography>
            <Slider
              value={buffer.minRating || 0}
              min={0}
              max={5}
              step={0.5}
              marks
              valueLabelDisplay="auto"
              onChange={(_, v) => setField('minRating', v || undefined)}
              sx={{ mt: 1, color: 'primary.main' }}
            />
          </Box>

          <Box>
            <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              Ordenar por
            </Typography>
            <Select
              fullWidth
              size="small"
              value={buffer.sort || 'ranking'}
              onChange={(e) => setField('sort', e.target.value)}
              sx={{ mt: 1, bgcolor: 'background.paper', borderRadius: 2 }}
            >
              {SORT_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </Stack>
      </Box>

      <Divider />
      <Box sx={{ px: 3, py: 2, display: 'flex', gap: 1, bgcolor: 'background.paper' }}>
        <Button onClick={clear} sx={{ flex: 0, color: 'text.secondary', textTransform: 'none', fontWeight: 700 }}>
          Limpiar
        </Button>
        <Button
          onClick={apply}
          variant="contained"
          sx={{
            flex: 1,
            borderRadius: 999,
            textTransform: 'none',
            fontWeight: 800,
            py: 1.25,
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' },
          }}
        >
          Aplicar filtros
        </Button>
      </Box>
    </Drawer>
  );
}
