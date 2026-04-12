import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Pagination,
  Paper,
  Chip,
} from '@mui/material';
import DirectoryProfessionalCard from './DirectoryProfessionalCard';
import { DIRECTORY_LISTADO_PATH } from '../../config/directoryRoutes';

/**
 * Bloque reutilizable: título según filtros, chips, rejilla y paginación.
 */
export default function DirectorySearchResultsPanel({
  filters,
  profesionLabelTodas,
  polizaLabelTodas,
  resultsHeadline,
  navigateWithFilters,
  gridItems,
  gridTotal,
  loadingFiltered,
  filterError,
  page,
  pageCount,
  onPageChange,
  demoFallback = false,
}) {
  return (
    <Box component="section" sx={{ mt: { xs: 1, md: 2 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          borderRadius: 3,
          border: '1px solid rgba(8, 89, 70, 0.1)',
          bgcolor: 'background.paper',
          boxShadow: '0 12px 40px rgba(8, 89, 70, 0.06)',
        }}
      >
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Typography
            component="h1"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#0f1f18',
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
              lineHeight: 1.15,
              maxWidth: 900,
            }}
          >
            {resultsHeadline.title}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 640, lineHeight: 1.65, fontSize: { xs: '0.9375rem', md: '1.0625rem' } }}
          >
            {resultsHeadline.subtitle}
          </Typography>
          {demoFallback ? (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Mostrando fichas de demostración que coinciden con su búsqueda (sin resultados en servidor).
            </Typography>
          ) : null}
          <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={1} useFlexGap sx={{ pt: 0.5 }}>
            {filters.profesion && filters.profesion !== profesionLabelTodas ? (
              <Chip
                label={filters.profesion}
                onDelete={() => navigateWithFilters({ profesion: profesionLabelTodas })}
                color="primary"
                variant="outlined"
              />
            ) : null}
            {filters.ciudad && filters.ciudad !== '' && filters.ciudad !== 'Todas las ciudades' ? (
              <Chip
                label={filters.ciudad}
                onDelete={() => navigateWithFilters({ ciudad: '' })}
                color="primary"
                variant="outlined"
              />
            ) : null}
            {filters.poliza && filters.poliza !== polizaLabelTodas ? (
              <Chip
                label={filters.poliza}
                onDelete={() => navigateWithFilters({ poliza: polizaLabelTodas })}
                color="primary"
                variant="outlined"
              />
            ) : null}
            {filters.q?.trim() ? (
              <Chip
                label={`“${filters.q.trim().slice(0, 24)}${filters.q.trim().length > 24 ? '…' : ''}”`}
                onDelete={() => navigateWithFilters({ q: '' })}
                color="primary"
                variant="outlined"
              />
            ) : null}
          </Stack>
          <Button
            component={RouterLink}
            to={`${DIRECTORY_LISTADO_PATH}#buscar-directorio`}
            variant="text"
            size="small"
            sx={{ fontWeight: 700, textTransform: 'none' }}
          >
            Ajustar filtros en el buscador
          </Button>
          {!loadingFiltered && !filterError ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {gridTotal === 0
                ? 'Sin resultados con estos criterios'
                : `${gridTotal} ${gridTotal === 1 ? 'profesional encontrado' : 'profesionales encontrados'}`}
            </Typography>
          ) : null}
          {loadingFiltered ? <CircularProgress size={32} sx={{ color: 'primary.main' }} /> : null}
        </Stack>
      </Paper>

      {filterError && !demoFallback ? (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {filterError}
        </Alert>
      ) : null}

      {!loadingFiltered && !filterError && gridItems.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 3,
            borderRadius: 3,
            border: '1px dashed rgba(8, 89, 70, 0.35)',
            bgcolor: 'rgba(8, 89, 70, 0.03)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: '#1a2332' }}>
            No hay profesionales que coincidan
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.65, maxWidth: 560 }}>
            Pruebe quitar la ciudad o la póliza, cambiar de especialidad o limpiar el texto de búsqueda. También puede volver al
            directorio principal para ver las especialidades destacadas.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
            {filters.ciudad && filters.ciudad !== 'Todas las ciudades' ? (
              <Button variant="outlined" onClick={() => navigateWithFilters({ ciudad: '' })} sx={{ borderRadius: 2 }}>
                Quitar ciudad
              </Button>
            ) : null}
            {filters.poliza && filters.poliza !== polizaLabelTodas ? (
              <Button variant="outlined" onClick={() => navigateWithFilters({ poliza: polizaLabelTodas })} sx={{ borderRadius: 2 }}>
                Quitar póliza
              </Button>
            ) : null}
            {filters.q?.trim() ? (
              <Button variant="outlined" onClick={() => navigateWithFilters({ q: '' })} sx={{ borderRadius: 2 }}>
                Quitar búsqueda
              </Button>
            ) : null}
            <Button variant="contained" component={RouterLink} to="/directorio" sx={{ borderRadius: 2 }}>
              Directorio principal
            </Button>
          </Stack>
        </Paper>
      )}

      <Grid container spacing={{ xs: 2.25, md: 3 }}>
        {gridItems.map((row) => (
          <Grid item xs={12} sm={6} md={4} key={row.id}>
            <DirectoryProfessionalCard profile={row} variant="standard" dense />
          </Grid>
        ))}
      </Grid>

      {pageCount > 1 ? (
        <Stack alignItems="center" sx={{ mt: 4 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            color="primary"
            shape="rounded"
            siblingCount={1}
            boundaryCount={1}
          />
        </Stack>
      ) : null}
    </Box>
  );
}
