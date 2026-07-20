import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { FaStar, FaUserMd } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchEngine from '../components/SearchEngine';
import otologosData from '../data/bdatos_otologos.json';
import { normalizeForSearch } from '../utils/textUtils';
import { recordMatchesProfesion, PROFESION_LABEL_TODAS, profesionesParaListing } from '../utils/profesionFilter';
import { POLIZAS_COLOMBIA, POLIZA_LABEL_TODAS } from '../config/polizasColombia';
import { slugForOtologoList } from '../utils/professionalSlug';
import ProfessionalListCard from '../components/professionals/ProfessionalListCard';
import { Box, Container, Typography, Stack } from '@mui/material';

// Generar datos de otólogos fuera del componente para evitar re-renderizados
const prepagadasDisponibles = [
  'Sura', 'Allianzs', 'Bolivar', 'Colsanitas', 'Colmedica',
  'Medplus', 'Mapfre', 'Liberty', 'Coomeva', 'Axxa'
];

const otologosConPrepagadas = otologosData.map((otologo) => {
  const numPrepagadas = Math.floor(Math.random() * 4) + 2; // entre 2 y 5
  const prepagadasOtologo = [];
  const prepagadasTemp = [...prepagadasDisponibles];
  for (let i = 0; i < numPrepagadas; i++) {
    if (prepagadasTemp.length > 0) {
      const randomIndex = Math.floor(Math.random() * prepagadasTemp.length);
      prepagadasOtologo.push(prepagadasTemp[randomIndex]);
      prepagadasTemp.splice(randomIndex, 1);
    }
  }
  
  // Generar servicios aleatorios para otólogos
  const serviciosOtologo = [
    'Cirugía de oído',
    'Tratamiento de tinnitus',
    'Implantes cocleares',
    'Audiología clínica',
    'Rehabilitación auditiva',
    'Cirugía endoscópica',
    'Otología pediátrica',
    'Tratamiento de vértigo',
    'Cirugía de oído medio',
    'Audiometría avanzada',
    'Cirugía de oído externo',
    'Tratamiento de otitis',
    'Cirugía de colesteatoma',
    'Tratamiento de hipoacusia',
    'Cirugía de estapedectomía',
    'Audiometría tonal',
    'Logoaudiometría',
    'Timpanometría',
    'Reflejos acústicos',
    'Emisiones otoacústicas'
  ];
  
  // Seleccionar 4-6 servicios aleatorios
  const numServicios = Math.floor(Math.random() * 3) + 4; // entre 4 y 6
  const serviciosSeleccionados = [];
  const serviciosTemp = [...serviciosOtologo];
  for (let i = 0; i < numServicios; i++) {
    if (serviciosTemp.length > 0) {
      const randomIndex = Math.floor(Math.random() * serviciosTemp.length);
      serviciosSeleccionados.push(serviciosTemp[randomIndex]);
      serviciosTemp.splice(randomIndex, 1);
    }
  }
  
  // Generar precio aleatorio para cada otólogo
  const precio = Math.floor(Math.random() * 150000) + 250000;
  return { 
    ...otologo, 
    prepagadas: prepagadasOtologo, 
    precio: precio,
    servicios: serviciosSeleccionados
  };
});

const OtologosPage = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedProfesion, setSelectedProfesion] = useState(PROFESION_LABEL_TODAS);
  const [selectedPoliza, setSelectedPoliza] = useState('');

  // Aplicar filtros desde la URL al cargar (desde la barra de búsqueda del Hero)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const ciudad = searchParams.get('ciudad') || '';
    const profesion = searchParams.get('profesion') || '';
    const poliza = searchParams.get('poliza') || '';
    if (q || ciudad) {
      setSearchTerm(q);
      setSelectedCity(ciudad);
    }
    if (profesion) {
      setSelectedProfesion(profesion);
    }
    if (poliza) {
      setSelectedPoliza(poliza);
    }
  }, [searchParams]);

  // Obtener ciudades únicas
  const ciudades = useMemo(() => {
    const cities = [...new Set(otologosConPrepagadas.map(otologo => otologo.ciudad).filter(Boolean))];
    return cities.sort();
  }, [otologosConPrepagadas]);

  // Filtrar datos aplicando los filtros activos
  const otologosFiltrados = useMemo(() => {
    return otologosConPrepagadas.filter(otologo => {
      // Filtro por término de búsqueda (nombre, ciudad) - normalizado para cruzar acentos
      const searchNorm = normalizeForSearch(searchTerm);
      const searchMatch = !searchNorm ||
        normalizeForSearch(otologo.nombre).includes(searchNorm) ||
        normalizeForSearch(otologo.ciudad).includes(searchNorm);

      // Filtro por ciudad - normalizado para cruzar "MEDELLIN" con "Medellín"
      const cityNorm = normalizeForSearch(selectedCity);
      const cityMatch = !selectedCity || selectedCity === 'Todas las ciudades' ||
        normalizeForSearch(otologo.ciudad) === cityNorm;

      const profesionMatch = recordMatchesProfesion(otologo, selectedProfesion);

      const polizaMatch =
        !selectedPoliza ||
        selectedPoliza === POLIZA_LABEL_TODAS ||
        !otologo.prepagadas?.length ||
        otologo.prepagadas.includes(selectedPoliza);

      return searchMatch && cityMatch && profesionMatch && polizaMatch;
    });
  }, [otologosConPrepagadas, searchTerm, selectedCity, selectedProfesion, selectedPoliza]);

  // Verificar que los datos existen
  if (!otologosConPrepagadas || otologosConPrepagadas.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ height: '80px' }}></div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h2>Error al cargar los datos</h2>
            <p>No se pudieron cargar los datos de otólogos. Por favor, recarga la página.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Función para manejar filtros del SearchEngine
  const handleSearchFilter = (filters) => {
    setSearchTerm(filters.query || '');
    setSelectedCity(filters.ciudad || '');
    setSelectedProfesion(filters.profesion || filters.especialidad || PROFESION_LABEL_TODAS);
    setSelectedPoliza(
      !filters.poliza || filters.poliza === POLIZA_LABEL_TODAS ? '' : filters.poliza
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Helmet>
        <title>Otorrinolaringólogos en Colombia | Directorio OírConecta</title>
        <meta name="description" content="Encuentra otorrinolaringólogos (otólogos) certificados en Colombia. Filtra por ciudad y subespecialidad. Perfiles verificados con datos de contacto." />
        <link rel="canonical" href="https://oirconecta.com/profesionales/otologos" />
        <meta property="og:title" content="Otorrinolaringólogos en Colombia | Directorio OírConecta" />
        <meta property="og:description" content="Encuentra otólogos certificados en Colombia. Filtra por ciudad y subespecialidad." />
        <meta property="og:url" content="https://oirconecta.com/profesionales/otologos" />
      </Helmet>
      <Header />

      {/* HERO editorial */}
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        pt: { xs: 14, md: 16 }, pb: { xs: 6, md: 8 },
        bgcolor: '#FBFAF8',
      }}>
        <Box aria-hidden sx={{
          position: 'absolute', top: -180, right: -180, width: 540, height: 540,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #D9CDBF55 0%, transparent 70%)',
          filter: 'blur(80px)', pointerEvents: 'none',
        }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{
            display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
            gap: { xs: 3, md: 6 }, alignItems: 'end',
          }}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Box sx={{ width: 32, height: 2, bgcolor: '#C9A86A' }} />
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.24em',
                  textTransform: 'uppercase', color: '#272F50',
                }}>
                  Profesionales · Otología
                </Typography>
              </Stack>
              <Typography component="h1" sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: { xs: '2.5rem', sm: '3.25rem', md: '4.5rem', lg: '5rem' },
                fontWeight: 500, lineHeight: 0.98, letterSpacing: '-0.025em',
                color: '#272F50', mb: 3,
              }}>
                Encuentra a tu{' '}
                <Box component="span" sx={{ fontStyle: 'italic', color: '#085946' }}>
                  otorrinolaringólogo.
                </Box>
              </Typography>
            </Box>
            <Box sx={{ pb: { md: 1.5 } }}>
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: { xs: '1.0625rem', md: '1.1875rem' },
                color: '#6B7280', lineHeight: 1.55, maxWidth: 460, mb: 3,
              }}>
                Médicos especialistas en otología y otorrinolaringología verificados, con perfil público para el cuidado de tu salud auditiva.
              </Typography>
              <Stack direction="row" spacing={3} divider={<Box sx={{ width: 1, bgcolor: 'rgba(39,47,80,0.15)' }} />}>
                {[
                  { num: otologosConPrepagadas.length, label: 'Especialistas' },
                  { num: ciudades.length, label: 'Ciudades' },
                  { num: '4.8', label: 'Promedio' },
                ].map((s) => (
                  <Box key={s.label}>
                    <Typography sx={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 600,
                      color: '#272F50', lineHeight: 1, letterSpacing: '-0.02em',
                    }}>
                      {s.num}
                    </Typography>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '0.7rem',
                      fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                      color: '#6B7280', mt: 0.75,
                    }}>
                      {s.label}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* SearchEngine */}
      <div style={{ marginTop: '-20px', marginBottom: '40px' }}>
        <SearchEngine 
          insideHero={false} 
          onFilter={handleSearchFilter} 
          isProfessionalPage={true}
          ciudades={ciudades}
          profesiones={profesionesParaListing('otorrino')}
          polizas={POLIZAS_COLOMBIA}
          initialFilters={{
            query: searchParams.get('q') || '',
            ciudad: searchParams.get('ciudad') || '',
            profesion: searchParams.get('profesion') || '',
            poliza: searchParams.get('poliza') || '',
          }}
        />
      </div>

      {/* Contenido principal */}
      <div className="main-content" style={{ flex: 1 }}>
        <div className="results-header">
          <h2 className="results-title">
            {otologosFiltrados.length} {otologosFiltrados.length === 1 ? 'Especialista encontrado' : 'Especialistas encontrados'}
          </h2>
          <div className="rating-info">
            <FaStar style={{ color: '#fbbf24' }} />
            <span>Calificación promedio: 4.8</span>
          </div>
        </div>
        
        {otologosFiltrados.length > 0 ? (
          <div className="cards-grid">
            {otologosFiltrados.map((otologo) => (
              <ProfessionalListCard
                key={`${slugForOtologoList(otologo.nombre)}-${otologo.ciudad}`}
                professional={otologo}
                roleLabel="Otólogo"
                toProfile={`/profesionales/otologos/${slugForOtologoList(otologo.nombre)}`}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <FaUserMd size={40} />
            </div>
            <h3 className="empty-title">No se encontraron especialistas</h3>
            <p className="empty-description">Intenta ajustar tus filtros de búsqueda o contacta con nosotros para más información.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCity('');
                setSelectedProfesion(PROFESION_LABEL_TODAS);
                setSelectedPoliza('');
              }}
              className="btn-clear"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default OtologosPage; 