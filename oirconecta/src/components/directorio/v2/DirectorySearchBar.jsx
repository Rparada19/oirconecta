import { Box, IconButton, InputBase, Paper } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';

/**
 * Barra de búsqueda principal del directorio, estilo Airbnb (píldora flotante).
 * En mobile, el botón de tune abre un Drawer con filtros avanzados.
 */
export default function DirectorySearchBar({ value, onChange, onSubmit, onOpenFilters, activeFilterCount = 0 }) {
  const handleKey = (e) => {
    if (e.key === 'Enter' && typeof onSubmit === 'function') {
      e.preventDefault();
      onSubmit();
    }
  };
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 1,
        borderRadius: 999,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.200',
        boxShadow: '0 12px 40px -24px rgba(8,89,70,0.35)',
        maxWidth: 720,
        mx: 'auto',
      }}
    >
      <SearchRoundedIcon sx={{ color: 'text.secondary' }} />
      <InputBase
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Busca por nombre, profesión, ciudad…"
        sx={{ flex: 1, fontSize: 15, '& input::placeholder': { opacity: 0.7 } }}
        inputProps={{ 'aria-label': 'Buscar profesionales' }}
      />
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={onOpenFilters}
          aria-label="Abrir filtros"
          sx={{
            bgcolor: activeFilterCount > 0 ? 'primary.main' : 'grey.50',
            color: activeFilterCount > 0 ? '#fff' : 'text.primary',
            border: '1px solid',
            borderColor: activeFilterCount > 0 ? 'primary.main' : 'grey.200',
            '&:hover': { bgcolor: activeFilterCount > 0 ? 'primary.dark' : 'grey.100' },
          }}
        >
          <TuneRoundedIcon />
        </IconButton>
        {activeFilterCount > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              right: -2,
              bgcolor: 'secondary.main',
              color: '#fff',
              minWidth: 18,
              height: 18,
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 0.5,
              border: '2px solid #fff',
            }}
          >
            {activeFilterCount}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
