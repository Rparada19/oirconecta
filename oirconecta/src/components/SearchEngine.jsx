import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Grid,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Button,
  InputAdornment
} from '@mui/material';
import {
  Search,
  LocationOn,
  MedicalServices,
  HealthAndSafety,
  Clear
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const SearchCard = styled(Box)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: 16,
  padding: theme.spacing(4),
  boxShadow: '0 8px 32px rgba(8, 89, 70, 0.15)',
  border: '1px solid rgba(8, 89, 70, 0.1)',
  position: 'relative',
  zIndex: 2
}));

const InputWrapper = styled(Box)(() => ({
  position: 'relative',
  '& .icon': {
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#86899C',
    zIndex: 1,
    pointerEvents: 'none'
  },
  '& .MuiInputBase-root': {
    paddingLeft: 48,
    height: 56,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(8, 89, 70, 0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      borderColor: '#085946',
      backgroundColor: 'rgba(255, 255, 255, 1)'
    },
    '&.Mui-focused': {
      borderColor: '#085946',
      backgroundColor: 'rgba(255, 255, 255, 1)',
      boxShadow: '0 0 0 3px rgba(8, 89, 70, 0.1)'
    }
  },
  '& .MuiInputBase-input': {
    color: '#272F50',
    fontSize: '1rem',
    fontWeight: 500,
    '&::placeholder': {
      color: '#86899C',
      opacity: 1
    }
  },
  '& .MuiSelect-select': {
    color: '#272F50',
    fontSize: '1rem',
    fontWeight: 500,
    paddingLeft: 48,
    '&:focus': {
      backgroundColor: 'transparent'
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  },
  '& .MuiSelect-icon': {
    color: '#86899C',
    right: 16
  }
}));

const CustomSelect = styled(Select)(() => ({
  '& .MuiSelect-select': {
    color: '#272F50',
    fontSize: '1rem',
    fontWeight: 500,
    '&:focus': {
      backgroundColor: 'transparent'
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  },
  '& .MuiSelect-icon': {
    color: '#86899C'
  }
}));

// Datos estáticos por defecto
const especialidadesDefault = [
  'Todas las especialidades',
  'Audiólogo',
  'Otorrinolaringólogo',
  'Otólogo',
  'Fonoaudiólogo'
];

const ciudadesDefault = [
  'Todas las ciudades',
  'BOGOTA',
  'MEDELLIN',
  'CALI',
  'BUCARAMANGA',
  'PEREIRA',
  'ARMENIA',
  'MANIZALES',
  'SINCELEJO',
  'CUCUTA'
];

const polizasSaludDefault = [
  'Todas las pólizas',
  'Sura',
  'Allianzs',
  'Bolivar',
  'Colsanitas',
  'Colmedica',
  'Medplus',
  'Mapfre',
  'Liberty',
  'Coomeva',
  'Axxa'
];

export default function SearchEngine({ 
  insideHero, 
  onFilter, 
  isProfessionalPage = false,
  ciudades = null,
  especialidades = null,
  polizas = null,
  initialFilters = null
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialFilters?.query ?? '');
  const [especialidad, setEspecialidad] = useState(initialFilters?.especialidad ?? '');
  const [ciudad, setCiudad] = useState(initialFilters?.ciudad ?? '');
  const [poliza, setPoliza] = useState(initialFilters?.poliza ?? '');

  // Usar datos dinámicos si están disponibles, sino usar los estáticos
  const especialidadesList = especialidades ? ['Todas las especialidades', ...especialidades] : especialidadesDefault;
  const ciudadesList = ciudades ? ['Todas las ciudades', ...ciudades] : ciudadesDefault;
  const polizasList = polizas ? ['Todas las pólizas', ...polizas] : polizasSaludDefault;

  // Sincronizar con initialFilters (ej. cuando se llega con URL params)
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.query !== undefined) setQuery(initialFilters.query);
      if (initialFilters.especialidad !== undefined) setEspecialidad(initialFilters.especialidad);
      if (initialFilters.ciudad !== undefined) setCiudad(initialFilters.ciudad);
      if (initialFilters.poliza !== undefined) setPoliza(initialFilters.poliza);
    }
  }, [initialFilters?.query, initialFilters?.especialidad, initialFilters?.ciudad, initialFilters?.poliza]);

  // Aplicar filtros automáticamente cuando cambien los valores
  useEffect(() => {
    if (onFilter) {
      const filters = {
        query: query,
        especialidad: especialidad,
        ciudad: ciudad,
        poliza: poliza
      };
      onFilter(filters);
    }
  }, [query, especialidad, ciudad, poliza, onFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Si hay una función onFilter, usarla para filtros locales (páginas de profesionales)
    if (onFilter) {
      onFilter({
        query: query,
        especialidad: especialidad,
        ciudad: ciudad,
        poliza: poliza
      });
      return;
    }
    
    // Navegación desde Hero: conectar con páginas según especialidad
    const searchParams = new URLSearchParams();
    if (query) searchParams.append('q', query);
    if (ciudad && ciudad !== 'Todas las ciudades') searchParams.append('ciudad', ciudad);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    
    // Mapear especialidad a la página correspondiente
    const esp = especialidad && especialidad !== 'Todas las especialidades' ? especialidad : '';
    if (esp === 'Audiólogo' || esp === 'Fonoaudiólogo') {
      navigate(`/profesionales/audiologos${queryString}`);
      return;
    }
    if (esp === 'Otólogo' || esp === 'Otorrinolaringólogo') {
      navigate(`/profesionales/otologos${queryString}`);
      return;
    }
    // Sin especialidad o "Todas": ir a audiólogas por defecto
    navigate(`/profesionales/audiologos${queryString}`);
  };

  const handleClearFilters = () => {
    setQuery('');
    setEspecialidad('');
    setCiudad('');
    setPoliza('');
    
    // Si hay una función onFilter, llamarla con filtros vacíos
    if (onFilter) {
      onFilter({
        query: '',
        especialidad: '',
        ciudad: '',
        poliza: ''
      });
    }
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = query || 
    (especialidad && especialidad !== 'Todas las especialidades') || 
    (ciudad && ciudad !== 'Todas las ciudades') || 
    (poliza && poliza !== 'Todas las pólizas');

  return (
    <Container maxWidth="lg" sx={{ mt: insideHero ? -4 : 4, mb: insideHero ? 0 : 4, display: 'flex', justifyContent: 'center' }}>
      <SearchCard sx={{ width: '100%', maxWidth: '1000px' }}>
        <Box component="form" onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center" justifyContent="center">
            <Grid item xs={12} md={isProfessionalPage ? 4 : 4}>
              <InputWrapper>
                <Search className="icon" />
                <TextField
                  fullWidth
                  placeholder="Buscar por nombre, especialidad o ciudad..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  variant="outlined"
                  InputProps={{
                    style: { color: '#272F50' }
                  }}
                />
              </InputWrapper>
            </Grid>
            {!isProfessionalPage && (
              <Grid item xs={12} md={2}>
                <InputWrapper>
                  <MedicalServices className="icon" />
                  <FormControl fullWidth>
                    <CustomSelect
                      value={especialidad}
                      onChange={(e) => setEspecialidad(e.target.value)}
                      displayEmpty
                      inputProps={{ 'aria-label': 'Seleccionar especialidad' }}
                    >
                      {especialidadesList.map(esp => (
                        <MenuItem key={esp} value={esp} sx={{ 
                          color: esp.includes('Todas') ? '#86899C' : '#272F50',
                          textAlign: 'center'
                        }}>
                          {esp}
                        </MenuItem>
                      ))}
                    </CustomSelect>
                  </FormControl>
                </InputWrapper>
              </Grid>
            )}
            <Grid item xs={12} md={isProfessionalPage ? 3 : 2}>
              <InputWrapper>
                <LocationOn className="icon" />
                <FormControl fullWidth>
                  <CustomSelect
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    displayEmpty
                    inputProps={{ 'aria-label': 'Seleccionar ciudad' }}
                  >
                    {ciudadesList.map(ciudad => (
                      <MenuItem key={ciudad} value={ciudad} sx={{ 
                        color: ciudad.includes('Todas') ? '#86899C' : '#272F50',
                        textAlign: 'center'
                      }}>
                        {ciudad}
                      </MenuItem>
                    ))}
                  </CustomSelect>
                </FormControl>
              </InputWrapper>
            </Grid>
            {isProfessionalPage && (
              <Grid item xs={12} md={3}>
                <InputWrapper>
                  <HealthAndSafety className="icon" />
                  <FormControl fullWidth>
                    <CustomSelect
                      value={poliza}
                      onChange={(e) => setPoliza(e.target.value)}
                      displayEmpty
                      inputProps={{ 'aria-label': 'Seleccionar póliza de salud' }}
                    >
                      {polizasList.map(poliza => (
                        <MenuItem key={poliza} value={poliza} sx={{ 
                          color: poliza.includes('Todas') ? '#86899C' : '#272F50',
                          textAlign: 'center'
                        }}>
                          {poliza}
                        </MenuItem>
                      ))}
                    </CustomSelect>
                  </FormControl>
                </InputWrapper>
              </Grid>
            )}
            <Grid item xs={12} md={isProfessionalPage ? 2 : 2}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                aria-label={isProfessionalPage ? "Filtrar profesionales" : "Buscar especialistas"}
                sx={{
                  bgcolor: '#085946',
                  height: '56px',
                  borderRadius: 2,
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    bgcolor: '#272F50',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(8, 89, 70, 0.3)'
                  }
                }}
              >
                {isProfessionalPage ? 'Filtrar' : 'Buscar'}
              </Button>
            </Grid>
            {hasActiveFilters && (
              <Grid item xs={12} md={1}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={handleClearFilters}
                  aria-label="Borrar filtros"
                  sx={{
                    height: '56px',
                    borderRadius: 2,
                    borderColor: '#dc3545',
                    color: '#dc3545',
                    fontWeight: 600,
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      bgcolor: '#dc3545',
                      color: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 16px rgba(220, 53, 69, 0.3)'
                    }
                  }}
                >
                  <Clear />
                </Button>
              </Grid>
            )}
          </Grid>
        </Box>
      </SearchCard>
    </Container>
  );
} 