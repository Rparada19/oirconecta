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
  Typography,
  Stack,
} from '@mui/material';
import {
  Search,
  LocationOn,
  HealthAndSafety,
  Clear,
  BadgeOutlined,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import {
  PROFESION_LABEL_TODAS,
  PROFESIONES_CATALOGO,
} from '../utils/profesionFilter';
import { POLIZAS_COLOMBIA, POLIZA_LABEL_TODAS } from '../config/polizasColombia';
import { DIRECTORY_LISTADO_PATH } from '../config/directoryRoutes';

const SearchCard = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  backdropFilter: 'blur(12px)',
  borderRadius: 16,
  padding: theme.spacing(4),
  boxShadow: '0 16px 48px rgba(30, 36, 56, 0.1)',
  border: '1px solid rgba(39, 47, 80, 0.08)',
  position: 'relative',
  zIndex: 2,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    borderRadius: 14,
  },
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
    pointerEvents: 'none',
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
      backgroundColor: 'rgba(255, 255, 255, 1)',
    },
    '&.Mui-focused': {
      borderColor: '#085946',
      backgroundColor: 'rgba(255, 255, 255, 1)',
      boxShadow: '0 0 0 3px rgba(8, 89, 70, 0.1)',
    },
  },
  '& .MuiInputBase-input': {
    color: '#272F50',
    fontSize: '1rem',
    fontWeight: 500,
    '&::placeholder': {
      color: '#86899C',
      opacity: 1,
    },
  },
  '& .MuiSelect-select': {
    color: '#272F50',
    fontSize: '1rem',
    fontWeight: 500,
    paddingLeft: 48,
    '&:focus': {
      backgroundColor: 'transparent',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& .MuiSelect-icon': {
    color: '#86899C',
    right: 16,
  },
}));

const CustomSelect = styled(Select)(() => ({
  '& .MuiSelect-select': {
    color: '#272F50',
    fontSize: '1rem',
    fontWeight: 500,
    '&:focus': {
      backgroundColor: 'transparent',
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& .MuiSelect-icon': {
    color: '#86899C',
  },
}));

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
  'CUCUTA',
];

/**
 * @param {object} props
 * @param {boolean} [props.insideHero]
 * @param {function} [props.onFilter] — recibe { query, ciudad, poliza, profesion }
 * @param {boolean} [props.isProfessionalPage]
 * @param {boolean} [props.directoryMode] — copy y tono para la página principal del directorio
 * @param {boolean} [props.directoryCompact] — menos padding; títulos más discretos (búsqueda secundaria a carruseles)
 * @param {boolean} [props.embeddedInHero] — sin `Container` externo; estilo vidrio para hero a ancho completo del directorio
 * @param {string[]|null} [props.ciudades] — sin incluir "Todas las ciudades"
 * @param {string[]|null} [props.profesiones] — por defecto las cuatro profesiones del oído (sin “todas”; esa la añade el componente)
 * @param {string[]|null} [props.polizas] — si null en página profesional, se usa POLIZAS_COLOMBIA
 * @param {{ query?: string, ciudad?: string, poliza?: string, profesion?: string }|null} [props.initialFilters]
 * @param {string} [props.directoryNavigateBase] — destino del submit en modo directorio (default: listado filtrado)
 */
export default function SearchEngine({
  insideHero,
  onFilter,
  isProfessionalPage = false,
  directoryMode = false,
  directoryCompact = false,
  embeddedInHero = false,
  ciudades = null,
  profesiones = null,
  polizas = null,
  initialFilters = null,
  directoryNavigateBase = DIRECTORY_LISTADO_PATH,
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialFilters?.query ?? '');
  const [profesion, setProfesion] = useState(initialFilters?.profesion ?? PROFESION_LABEL_TODAS);
  const [ciudad, setCiudad] = useState(initialFilters?.ciudad ?? '');
  const [poliza, setPoliza] = useState(initialFilters?.poliza != null && initialFilters.poliza !== '' ? initialFilters.poliza : POLIZA_LABEL_TODAS);

  const profesionesOpciones = profesiones?.length ? profesiones : PROFESIONES_CATALOGO;
  const profesionesList = [PROFESION_LABEL_TODAS, ...profesionesOpciones];

  const ciudadesList = ciudades ? ['Todas las ciudades', ...ciudades] : ciudadesDefault;
  const polizasOpciones = polizas != null && Array.isArray(polizas) && polizas.length > 0 ? polizas : POLIZAS_COLOMBIA;
  const polizasList = [POLIZA_LABEL_TODAS, ...polizasOpciones];

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.query !== undefined) setQuery(initialFilters.query);
      if (initialFilters.profesion !== undefined) setProfesion(initialFilters.profesion || PROFESION_LABEL_TODAS);
      if (initialFilters.ciudad !== undefined) setCiudad(initialFilters.ciudad);
      if (initialFilters.poliza !== undefined) {
        setPoliza(initialFilters.poliza && initialFilters.poliza !== POLIZA_LABEL_TODAS ? initialFilters.poliza : POLIZA_LABEL_TODAS);
      }
    }
  }, [initialFilters?.query, initialFilters?.profesion, initialFilters?.ciudad, initialFilters?.poliza]);

  useEffect(() => {
    if (onFilter) {
      onFilter({
        query,
        profesion,
        ciudad,
        poliza,
      });
    }
  }, [query, profesion, ciudad, poliza, onFilter]);

  const appendDirectoryParams = () => {
    const searchParams = new URLSearchParams();
    if (query) searchParams.append('q', query);
    if (ciudad && ciudad !== 'Todas las ciudades') searchParams.append('ciudad', ciudad);
    if (profesion && profesion !== PROFESION_LABEL_TODAS) searchParams.append('profesion', profesion);
    if (poliza && poliza !== POLIZA_LABEL_TODAS) searchParams.append('poliza', poliza);
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
  };

  const handleSearch = (e) => {
    e.preventDefault();

    if (onFilter) {
      onFilter({
        query,
        profesion,
        ciudad,
        poliza,
      });
      return;
    }

    const base = directoryMode ? directoryNavigateBase || DIRECTORY_LISTADO_PATH : '/directorio';
    navigate(`${base}${appendDirectoryParams()}`);
  };

  const handleClearFilters = () => {
    setQuery('');
    setProfesion(PROFESION_LABEL_TODAS);
    setCiudad('');
    setPoliza(POLIZA_LABEL_TODAS);

    if (onFilter) {
      onFilter({
        query: '',
        profesion: PROFESION_LABEL_TODAS,
        ciudad: '',
        poliza: POLIZA_LABEL_TODAS,
      });
    } else if (directoryMode) {
      navigate('/directorio');
    }
  };

  const hasActiveFilters =
    query ||
    (profesion && profesion !== PROFESION_LABEL_TODAS) ||
    (ciudad && ciudad !== 'Todas las ciudades') ||
    (poliza && poliza !== POLIZA_LABEL_TODAS);

  const colMd = isProfessionalPage ? 2 : 2;

  const compactPad = directoryMode && (directoryCompact || embeddedInHero);
  const directoryHuman = directoryMode && (directoryCompact || embeddedInHero);

  const fieldLabelSx = {
    fontWeight: 700,
    color: '#3d4a5c',
    fontSize: directoryMode ? { xs: '0.8125rem', md: '0.9375rem' } : '0.8125rem',
    lineHeight: 1.25,
    mb: 0.5,
    display: 'block',
  };

  const searchCardSx = embeddedInHero
    ? {
        width: '100%',
        maxWidth: 1120,
        py: { xs: 2.75, md: 3.5 },
        px: { xs: 2.25, sm: 3.25 },
        borderRadius: { xs: 14, md: 16 },
        boxShadow: '0 22px 56px rgba(6, 45, 36, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.75)',
        bgcolor: 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }
    : {
        width: '100%',
        maxWidth: 1280,
        py: compactPad ? 2.75 : undefined,
        px: compactPad ? { xs: 2, sm: 3 } : undefined,
        ...(directoryMode
          ? {
              boxShadow: compactPad
                ? '0 8px 32px rgba(8, 89, 70, 0.06)'
                : '0 24px 64px rgba(8, 89, 70, 0.1)',
              border: compactPad ? '1px solid rgba(8, 89, 70, 0.08)' : '1px solid rgba(8, 89, 70, 0.1)',
              bgcolor: compactPad ? 'rgba(255,255,255,0.94)' : undefined,
            }
          : {}),
      };

  const inner = (
    <>
        {!isProfessionalPage && !directoryMode && (
          <Typography
            component="h2"
            variant="h5"
            sx={{
              mb: 1,
              color: 'text.primary',
              fontWeight: 700,
              textAlign: 'center',
              letterSpacing: '-0.02em',
            }}
          >
            Encuentra a tu especialista
          </Typography>
        )}
        {!isProfessionalPage && directoryMode && (
          <Typography
            component="h2"
            variant={directoryCompact || embeddedInHero ? 'subtitle1' : 'h5'}
            sx={{
              mb: directoryCompact || embeddedInHero ? 0.5 : 1,
              color: 'text.primary',
              fontWeight: 800,
              textAlign: 'center',
              letterSpacing: '-0.02em',
              fontSize: embeddedInHero ? { xs: '1.05rem', md: '1.3rem' } : directoryCompact ? { md: '1.2rem' } : undefined,
            }}
          >
            {embeddedInHero
              ? 'Criterios opcionales de búsqueda'
              : directoryCompact
                ? 'Refinamiento de criterios'
                : 'Búsqueda en el directorio'}
          </Typography>
        )}
        {!isProfessionalPage && directoryMode && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              textAlign: 'center',
              mb: directoryCompact || embeddedInHero ? 2.25 : 3,
              maxWidth: 560,
              mx: 'auto',
              lineHeight: 1.65,
              fontSize: embeddedInHero
                ? { xs: '0.9375rem', md: '1.0625rem' }
                : directoryCompact
                  ? { xs: '0.875rem', md: '1rem' }
                  : { md: '1.0625rem' },
            }}
          >
            {embeddedInHero
              ? 'Complete únicamente los campos de los que disponga; el resto puede permanecer sin selección.'
              : directoryCompact
                ? 'Palabras clave, ciudad o especialidad: todos los campos son opcionales.'
                : 'Nombre, consultorio o ciudad; de ser aplicable, profesión y póliza. Listados integrados en la red Oír Conecta.'}
          </Typography>
        )}
        {!isProfessionalPage && !directoryMode && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: 'center', mb: 3, maxWidth: 680, mx: 'auto', lineHeight: 1.65 }}
          >
            Busca por nombre del profesional o del consultorio, y combina profesión, póliza de salud y ciudad. Los suscriptores aprobados
            viven en una sola base de datos; las listas clásicas del sitio siguen como referencia.
          </Typography>
        )}
        <Box component="form" onSubmit={handleSearch} noValidate>
          <Grid
            container
            spacing={directoryMode ? 2.5 : compactPad ? 2.25 : 2}
            alignItems="stretch"
            justifyContent="center"
            sx={{ '& .MuiGrid-item': { display: 'flex' } }}
          >
            {directoryMode ? (
              <>
                <Grid item xs={12} sm={6} md={3} sx={{ flexDirection: 'column' }}>
                  <Stack spacing={0.5} sx={{ width: '100%' }}>
                    <Typography sx={fieldLabelSx}>Ciudad</Typography>
                    <InputWrapper sx={{ width: '100%', flex: 1 }}>
                      <LocationOn className="icon" />
                      <FormControl fullWidth>
                        <CustomSelect
                          value={ciudad && ciudad !== '' ? ciudad : 'Todas las ciudades'}
                          onChange={(e) => setCiudad(e.target.value)}
                          displayEmpty
                          inputProps={{ 'aria-label': 'Ciudad' }}
                          renderValue={(selected) => {
                            if (!selected || selected === 'Todas las ciudades') {
                              return (
                                <span style={{ color: '#86899C' }}>
                                  {directoryHuman ? 'Todas' : 'Todas las ciudades'}
                                </span>
                              );
                            }
                            return selected;
                          }}
                        >
                          {ciudadesList.map((c) => (
                            <MenuItem
                              key={c}
                              value={c}
                              sx={{
                                color: c.includes('Todas') ? '#86899C' : '#272F50',
                                textAlign: 'left',
                              }}
                            >
                              {c}
                            </MenuItem>
                          ))}
                        </CustomSelect>
                      </FormControl>
                    </InputWrapper>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ flexDirection: 'column' }}>
                  <Stack spacing={0.5} sx={{ width: '100%' }}>
                    <Typography sx={fieldLabelSx}>Nombre del profesional</Typography>
                    <InputWrapper sx={{ width: '100%', flex: 1 }}>
                      <Search className="icon" />
                      <TextField
                        fullWidth
                        id="directorio-campo-nombre"
                        placeholder="Ej. apellido o clínica"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        variant="outlined"
                        inputProps={{
                          'aria-label': 'Nombre del profesional o consultorio',
                        }}
                        InputProps={{
                          style: { color: '#272F50' },
                        }}
                      />
                    </InputWrapper>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ flexDirection: 'column' }}>
                  <Stack spacing={0.5} sx={{ width: '100%' }}>
                    <Typography sx={fieldLabelSx}>Seguro</Typography>
                    <InputWrapper sx={{ width: '100%', flex: 1 }}>
                      <HealthAndSafety className="icon" />
                      <FormControl fullWidth>
                        <CustomSelect
                          value={poliza}
                          onChange={(e) => setPoliza(e.target.value)}
                          displayEmpty
                          inputProps={{ 'aria-label': 'Seguro o póliza de salud' }}
                          renderValue={(selected) => {
                            if (!selected || selected === POLIZA_LABEL_TODAS) {
                              return (
                                <span style={{ color: '#86899C' }}>
                                  {directoryHuman ? 'Todos' : POLIZA_LABEL_TODAS}
                                </span>
                              );
                            }
                            return selected;
                          }}
                        >
                          {polizasList.map((pol) => (
                            <MenuItem
                              key={pol}
                              value={pol}
                              sx={{
                                color: pol === POLIZA_LABEL_TODAS ? '#86899C' : '#272F50',
                                textAlign: 'left',
                              }}
                            >
                              {pol}
                            </MenuItem>
                          ))}
                        </CustomSelect>
                      </FormControl>
                    </InputWrapper>
                  </Stack>
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ flexDirection: 'column' }}>
                  <Stack spacing={0.5} sx={{ width: '100%' }}>
                    <Typography sx={fieldLabelSx}>Profesión</Typography>
                    <InputWrapper sx={{ width: '100%', flex: 1 }}>
                      <BadgeOutlined className="icon" />
                      <FormControl fullWidth>
                        <CustomSelect
                          value={profesion}
                          onChange={(e) => setProfesion(e.target.value)}
                          displayEmpty
                          inputProps={{ 'aria-label': 'Profesión' }}
                          renderValue={(selected) => {
                            if (!selected || selected === PROFESION_LABEL_TODAS) {
                              return (
                                <span style={{ color: '#86899C' }}>
                                  {directoryHuman ? 'Todas' : PROFESION_LABEL_TODAS}
                                </span>
                              );
                            }
                            return selected;
                          }}
                        >
                          {profesionesList.map((opt) => (
                            <MenuItem
                              key={opt}
                              value={opt}
                              sx={{
                                color: opt === PROFESION_LABEL_TODAS ? '#86899C' : '#272F50',
                                textAlign: 'left',
                              }}
                            >
                              {opt}
                            </MenuItem>
                          ))}
                        </CustomSelect>
                      </FormControl>
                    </InputWrapper>
                  </Stack>
                </Grid>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2, pt: 0.5 }}>
                  <Button
                    variant="contained"
                    size="large"
                    type="submit"
                    aria-label="Ver resultados en el directorio"
                    sx={{
                      bgcolor: 'primary.main',
                      minHeight: 52,
                      px: 4,
                      borderRadius: 2,
                      fontWeight: 700,
                      minWidth: { xs: '100%', sm: 280 },
                      maxWidth: 440,
                      transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                        boxShadow: '0 6px 20px rgba(8, 89, 70, 0.22)',
                      },
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.light',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    Ver resultados
                  </Button>
                  {hasActiveFilters ? (
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={handleClearFilters}
                      aria-label="Borrar filtros"
                      startIcon={<Clear />}
                      sx={{
                        minHeight: 52,
                        borderRadius: 2,
                        borderColor: 'error.main',
                        color: 'error.main',
                        fontWeight: 600,
                        minWidth: { xs: '100%', sm: 'auto' },
                        '&:hover': {
                          bgcolor: 'error.main',
                          color: 'common.white',
                        },
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  ) : null}
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} md={colMd} sx={{ alignItems: 'stretch' }}>
                  <InputWrapper sx={{ width: '100%' }}>
                    <Search className="icon" />
                    <TextField
                      fullWidth
                      placeholder="Nombre del profesional, consultorio o ciudad…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      variant="outlined"
                      inputProps={{
                        'aria-label': 'Buscar por nombre del profesional, consultorio o ciudad',
                      }}
                      InputProps={{
                        style: { color: '#272F50' },
                      }}
                    />
                  </InputWrapper>
                </Grid>
                <Grid item xs={12} md={colMd}>
                  <InputWrapper sx={{ width: '100%' }}>
                    <BadgeOutlined className="icon" />
                    <FormControl fullWidth>
                      <CustomSelect
                        value={profesion}
                        onChange={(e) => setProfesion(e.target.value)}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Especialidad o profesión' }}
                        renderValue={(selected) => {
                          if (!selected || selected === PROFESION_LABEL_TODAS) {
                            return <span style={{ color: '#86899C' }}>{PROFESION_LABEL_TODAS}</span>;
                          }
                          return selected;
                        }}
                      >
                        {profesionesList.map((opt) => (
                          <MenuItem
                            key={opt}
                            value={opt}
                            sx={{
                              color: opt === PROFESION_LABEL_TODAS ? '#86899C' : '#272F50',
                              textAlign: 'left',
                            }}
                          >
                            {opt}
                          </MenuItem>
                        ))}
                      </CustomSelect>
                    </FormControl>
                  </InputWrapper>
                </Grid>
                <Grid item xs={12} md={colMd}>
                  <InputWrapper sx={{ width: '100%' }}>
                    <HealthAndSafety className="icon" />
                    <FormControl fullWidth>
                      <CustomSelect
                        value={poliza}
                        onChange={(e) => setPoliza(e.target.value)}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Póliza de salud (opcional)' }}
                        renderValue={(selected) => {
                          if (!selected || selected === POLIZA_LABEL_TODAS) {
                            return <span style={{ color: '#86899C' }}>{POLIZA_LABEL_TODAS}</span>;
                          }
                          return selected;
                        }}
                      >
                        {polizasList.map((pol) => (
                          <MenuItem
                            key={pol}
                            value={pol}
                            sx={{
                              color: pol === POLIZA_LABEL_TODAS ? '#86899C' : '#272F50',
                              textAlign: 'left',
                            }}
                          >
                            {pol}
                          </MenuItem>
                        ))}
                      </CustomSelect>
                    </FormControl>
                  </InputWrapper>
                </Grid>
                <Grid item xs={12} md={colMd}>
                  <InputWrapper sx={{ width: '100%' }}>
                    <LocationOn className="icon" />
                    <FormControl fullWidth>
                      <CustomSelect
                        value={ciudad && ciudad !== '' ? ciudad : 'Todas las ciudades'}
                        onChange={(e) => setCiudad(e.target.value)}
                        displayEmpty
                        inputProps={{ 'aria-label': 'Ciudad' }}
                        renderValue={(selected) => {
                          if (!selected || selected === 'Todas las ciudades') {
                            return <span style={{ color: '#86899C' }}>Todas las ciudades</span>;
                          }
                          return selected;
                        }}
                      >
                        {ciudadesList.map((c) => (
                          <MenuItem
                            key={c}
                            value={c}
                            sx={{
                              color: c.includes('Todas') ? '#86899C' : '#272F50',
                              textAlign: 'center',
                            }}
                          >
                            {c}
                          </MenuItem>
                        ))}
                      </CustomSelect>
                    </FormControl>
                  </InputWrapper>
                </Grid>
                <Grid item xs={12} md={isProfessionalPage ? 4 : 4}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    type="submit"
                    aria-label={
                      isProfessionalPage ? 'Filtrar profesionales' : 'Buscar en directorio'
                    }
                    sx={{
                      bgcolor: 'primary.main',
                      height: 56,
                      borderRadius: 2,
                      fontWeight: 700,
                      transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                        boxShadow: '0 6px 20px rgba(8, 89, 70, 0.22)',
                      },
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.light',
                        outlineOffset: 2,
                      },
                    }}
                  >
                    {isProfessionalPage ? 'Filtrar' : 'Buscar'}
                  </Button>
                </Grid>
                {hasActiveFilters && (
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={handleClearFilters}
                      aria-label="Borrar filtros"
                      startIcon={<Clear />}
                      sx={{
                        height: 48,
                        borderRadius: 2,
                        borderColor: 'error.main',
                        color: 'error.main',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: 'error.main',
                          color: 'common.white',
                        },
                      }}
                    >
                      Limpiar filtros
                    </Button>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </Box>
    </>
  );

  const card = <SearchCard sx={searchCardSx}>{inner}</SearchCard>;

  if (embeddedInHero) {
    return (
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          my: { xs: 0.5, md: 1 },
        }}
      >
        {card}
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: insideHero ? -2 : 4, mb: insideHero ? 2 : 4, display: 'flex', justifyContent: 'center' }}>
      {card}
    </Container>
  );
}
