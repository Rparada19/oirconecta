import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaUserMd, FaInstagram, FaFacebook, FaGlobe } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchEngine from '../components/SearchEngine';
import otologosData from '../data/bdatos_otologos.json';

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
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedPoliza, setSelectedPoliza] = useState('');

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
      // Filtro por término de búsqueda (nombre, ciudad)
      const searchMatch = !searchTerm || 
        otologo.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        otologo.ciudad?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por ciudad
      const cityMatch = !selectedCity || selectedCity === 'Todas las ciudades' || 
        otologo.ciudad === selectedCity;

      // Filtro por especialidad
      const specialtyMatch = !selectedSpecialty || selectedSpecialty === 'Todas las especialidades' || 
        otologo.especialidad === selectedSpecialty;

      // Filtro por prepagada
      const polizaMatch = !selectedPoliza || selectedPoliza === 'Todas las pólizas' || 
        (otologo.prepagadas && otologo.prepagadas.includes(selectedPoliza));

      return searchMatch && cityMatch && specialtyMatch && polizaMatch;
    });
  }, [otologosConPrepagadas, searchTerm, selectedCity, selectedSpecialty, selectedPoliza]);

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
    setSelectedSpecialty(filters.especialidad || '');
    setSelectedPoliza(filters.poliza || '');
  };

  // Función para manejar el clic en una tarjeta de profesional
  const handleProfessionalClick = (otologo) => {
    console.log('Clic en otólogo:', otologo.nombre);
    const professionalId = otologo.nombre.toLowerCase().replace(/\s+/g, '-');
    console.log('ID generado:', professionalId);
    console.log('Navegando a:', `/profesionales/otologos/${professionalId}`);
    navigate(`/profesionales/otologos/${professionalId}`);
  };

  // Función para mostrar prepagadas
  const mostrarPrepagadas = (prepagadas) => {
    if (!prepagadas || prepagadas.length === 0) {
      return <span style={{ color: '#86899C', fontSize: '12px' }}>No especificado</span>;
    }

    const prepagadasMostrar = prepagadas.slice(0, 3);
    const prepagadasRestantes = prepagadas.length - 3;

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
        {prepagadasMostrar.map((prepagada, index) => (
          <span
            key={index}
            style={{
              background: 'rgba(8, 89, 70, 0.1)',
              color: '#085946',
              padding: '2px 6px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '500'
            }}
          >
            {prepagada}
          </span>
        ))}
        {prepagadasRestantes > 0 && (
          <span
            style={{
              background: '#f3f4f6',
              color: '#86899C',
              padding: '2px 6px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '500'
            }}
          >
            +{prepagadasRestantes} más
          </span>
        )}
      </div>
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
          especialidades={['Otólogo']}
          polizas={prepagadasDisponibles}
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
            {otologosFiltrados.map((otologo, idx) => (
              <div 
                key={idx} 
                className="professional-card"
                onClick={() => handleProfessionalClick(otologo)}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 25px rgba(8, 89, 70, 0.2)'
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(8, 89, 70, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div className="card-header">
                  <div className="card-image-container">
                    <div className="card-image">
                      {/* Placeholder para imagen */}
                    </div>
                  </div>
                  <div className="verified-badge">
                    <FaStar size={12} />
                    Verificado
                  </div>
                </div>
                <div className="card-content">
                  <div className="specialty-badge">
                    Otólogo
                  </div>
                  <h3 className="professional-name">
                    <b>{otologo.nombre}</b>
                  </h3>
                  <div className="location-info">
                    <span style={{ fontWeight: 'bold' }}>{otologo.ciudad}</span>
                  </div>

                  {/* Datos de contacto */}
                  <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#86899C', marginBottom: '4px' }}>
                      Teléfono: {otologo.telefono}
                    </div>
                    <div style={{ fontSize: '12px', color: '#86899C', marginBottom: '4px' }}>
                      Email: {otologo.email || 'No disponible'}
                    </div>
                  </div>

                  {/* Prepagadas */}
                  {otologo.prepagadas && otologo.prepagadas.length > 0 && (
                    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#272F50' }}>Prepagadas aceptadas</span>
                      </div>
                      {mostrarPrepagadas(otologo.prepagadas)}
                    </div>
                  )}

                  {/* Servicios */}
                  {otologo.servicios && otologo.servicios.length > 0 && (
                    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#272F50' }}>Servicios principales</span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '4px', 
                        justifyContent: 'center',
                        maxHeight: '60px',
                        overflow: 'hidden'
                      }}>
                        {otologo.servicios.slice(0, 3).map((servicio, index) => (
                          <span
                            key={index}
                            style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              backgroundColor: 'rgba(8, 89, 70, 0.1)',
                              color: '#085946',
                              borderRadius: '4px',
                              fontWeight: '500',
                              border: '1px solid rgba(8, 89, 70, 0.2)'
                            }}
                          >
                            {servicio}
                          </span>
                        ))}
                        {otologo.servicios.length > 3 && (
                          <span
                            style={{
                              fontSize: '9px',
                              padding: '2px 6px',
                              backgroundColor: '#f3f4f6',
                              color: '#86899C',
                              borderRadius: '4px',
                              fontWeight: '500'
                            }}
                          >
                            +{otologo.servicios.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}



                  <div className="action-buttons">
                    <button className="btn-contact" style={{ marginBottom: '10px' }}>
                      Agendar cita
                    </button>
                    <button className="btn-contact" style={{ marginBottom: '5px' }}>
                      Llamar
                    </button>
                    

                    <div style={{ 
                      textAlign: 'center', 
                      marginBottom: '5px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#272F50'
                    }}>
                      Contáctanos
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: '12px', 
                      padding: '8px 0'
                    }}>
                      <a 
                        href="#" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{
                          color: '#085946',
                          textDecoration: 'none',
                          padding: '8px',
                          borderRadius: '50%',
                          background: 'rgba(8, 89, 70, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          ':hover': {
                            background: 'rgba(8, 89, 70, 0.3)',
                            color: '#272F50',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 8px rgba(8, 89, 70, 0.2)'
                          }
                        }}
                        aria-label="Instagram"
                      >
                        <FaInstagram size={16} />
                      </a>
                      <a 
                        href="#" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{
                          color: '#085946',
                          textDecoration: 'none',
                          padding: '8px',
                          borderRadius: '50%',
                          background: 'rgba(8, 89, 70, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          ':hover': {
                            background: 'rgba(8, 89, 70, 0.3)',
                            color: '#272F50',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 8px rgba(8, 89, 70, 0.2)'
                          }
                        }}
                        aria-label="Facebook"
                      >
                        <FaFacebook size={16} />
                      </a>
                      <a 
                        href="#" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{
                          color: '#085946',
                          textDecoration: 'none',
                          padding: '8px',
                          borderRadius: '50%',
                          background: 'rgba(8, 89, 70, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.3s ease',
                          ':hover': {
                            background: 'rgba(8, 89, 70, 0.3)',
                            color: '#272F50',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 8px rgba(8, 89, 70, 0.2)'
                          }
                        }}
                        aria-label="Página web"
                      >
                        <FaGlobe size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
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
                setSelectedSpecialty('');
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