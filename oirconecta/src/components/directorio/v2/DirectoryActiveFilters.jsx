import { Box, Chip, Stack } from '@mui/material';

const SORT_LABELS = {
  ranking: 'Recomendados',
  rating: 'Mejor calificados',
  reviews: 'Más reseñados',
  recent: 'Más recientes',
};

/**
 * Chips de filtros activos. Cada chip tiene `onDelete` para quitar ese filtro
 * sin abrir el drawer. El sort se muestra como informativo (no removible).
 */
export default function DirectoryActiveFilters({ value, professions = [], cities = [], onChange }) {
  if (!value) return null;
  const chips = [];

  if (value.professionSlug) {
    const p = professions.find((x) => x.slug === value.professionSlug);
    chips.push({
      key: 'prof',
      label: p ? p.nombre : value.professionSlug,
      onDelete: () => onChange({ ...value, professionSlug: undefined }),
    });
  }
  if (value.citySlug) {
    const c = cities.find((x) => x.slug === value.citySlug);
    chips.push({
      key: 'city',
      label: c ? c.nombre : value.citySlug,
      onDelete: () => onChange({ ...value, citySlug: undefined }),
    });
  }
  if (value.modalidad) {
    chips.push({
      key: 'modalidad',
      label: value.modalidad.charAt(0).toUpperCase() + value.modalidad.slice(1),
      onDelete: () => onChange({ ...value, modalidad: undefined }),
    });
  }
  if (value.minRating) {
    chips.push({
      key: 'rating',
      label: `${value.minRating}+ ★`,
      onDelete: () => onChange({ ...value, minRating: undefined }),
    });
  }
  if (value.q) {
    chips.push({
      key: 'q',
      label: `"${value.q}"`,
      onDelete: () => onChange({ ...value, q: '' }),
    });
  }

  if (chips.length === 0 && !value.sort) return null;

  return (
    <Box sx={{ overflowX: 'auto', py: 1, mx: -2, px: 2 }}>
      <Stack direction="row" spacing={1} sx={{ minWidth: 'min-content' }}>
        {chips.map((c) => (
          <Chip
            key={c.key}
            label={c.label}
            onDelete={c.onDelete}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'grey.200',
              fontWeight: 600,
              '& .MuiChip-deleteIcon': { color: 'text.secondary' },
            }}
          />
        ))}
        {value.sort && value.sort !== 'ranking' && (
          <Chip
            label={`Orden: ${SORT_LABELS[value.sort] || value.sort}`}
            sx={{
              bgcolor: 'primary.main',
              color: '#fff',
              fontWeight: 700,
              border: '1px solid',
              borderColor: 'primary.main',
            }}
          />
        )}
      </Stack>
    </Box>
  );
}
