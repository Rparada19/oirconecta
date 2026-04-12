import React, { useState, useMemo, useEffect } from 'react';
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

  // Debug: verificar que los datos se cargan
  console.log('OtologosPage - Datos cargados:', otologosConPrepagadas);
  console.log('OtologosPage - Número de otólogos:', otologosConPrepagadas.length);

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
    console.error('No se pudieron cargar los datos de otólogos');
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
    console.log('OtologosPage - Filtros recibidos:', filters);
    setSearchTerm(filters.query || '');
    setSelectedCity(filters.ciudad || '');
    setSelectedProfesion(filters.profesion || filters.especialidad || PROFESION_LABEL_TODAS);
    setSelectedPoliza(
      !filters.poliza || filters.poliza === POLIZA_LABEL_TODAS ? '' : filters.poliza
    );
  };

  console.log('OtologosPage - Otólogos filtrados:', otologosFiltrados.length);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <div style={{ height: '80px' }}></div>
      
      {/* Hero Section */}
      <div className="hero-header">
        <div className="hero-content">
          <div className="hero-icon">
            <FaUserMd size={40} />
          </div>
          <h1 className="hero-title">Encuentra tu Otólogo</h1>
          <p className="hero-subtitle">Especialistas certificados en otología y audiología para el cuidado de tu salud auditiva</p>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{otologosConPrepagadas.length}</div>
              <div className="stat-label">Especialistas</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{ciudades.length}</div>
              <div className="stat-label">Ciudades</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">4.8</div>
              <div className="stat-label">Calificación Promedio</div>
            </div>
          </div>
        </div>
      </div>

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