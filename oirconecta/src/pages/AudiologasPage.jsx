import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaUserMd, FaUpload, FaFileExcel, FaDownload, FaTrash, FaInstagram, FaFacebook, FaGlobe } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SearchEngine from '../components/SearchEngine';


// Usar datos reales de audiólogas

const AudiologasPage = () => {
  const navigate = useNavigate();
  const [audiologas, setAudiologas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedPoliza, setSelectedPoliza] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadStatus, setUploadStatus] = useState('Base de datos vacía (0 audiólogas)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [detectedColumns, setDetectedColumns] = useState([]);
  const cardsPerPage = 16; // Cambiado a 16 tarjetas por página

  // Función para cargar datos de audiólogas desde localStorage
  const loadAudiologasData = () => {
    try {
      // Intentar cargar desde localStorage primero
      let savedData = localStorage.getItem('audiologasData') || localStorage.getItem('audiologas_data');
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setAudiologas(parsedData);
        setUploadStatus(`Base de datos cargada (${parsedData.length} audiólogas)`);
        console.log('📊 Datos cargados desde localStorage:', parsedData.length, 'audiólogas');
      } else {
        // Si no hay datos en localStorage, intentar cargar desde el archivo JSON
        console.log('📊 No hay datos en localStorage, intentando cargar desde archivo JSON...');
        
        // Importar datos directamente del archivo JSON
        import('../data/bdatos_audiologas.json')
          .then((module) => {
            const jsonData = module.default;
            if (jsonData && jsonData.length > 0) {
              setAudiologas(jsonData);
              setUploadStatus(`Base de datos cargada desde archivo (${jsonData.length} audiólogas)`);
              console.log('📊 Datos cargados desde archivo JSON:', jsonData.length, 'audiólogas');
              
              // Guardar en localStorage para futuras cargas
              localStorage.setItem('audiologasData', JSON.stringify(jsonData));
              localStorage.setItem('audiologas_data', JSON.stringify(jsonData));
            } else {
              setAudiologas([]);
              setUploadStatus('Base de datos vacía (0 audiólogas)');
              console.log('📊 Archivo JSON vacío o sin datos');
            }
          })
          .catch((error) => {
            console.error('❌ Error al cargar archivo JSON:', error);
            setAudiologas([]);
            setUploadStatus('Error al cargar archivo JSON');
          });
      }
    } catch (error) {
      console.error('❌ Error al cargar datos desde localStorage:', error);
      setAudiologas([]);
      setUploadStatus('Error al cargar datos');
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadAudiologasData();
  }, []);


  // Obtener ciudades únicas
  const ciudades = useMemo(() => {
    const cities = [...new Set(audiologas.map(audiologa => audiologa.ciudad).filter(Boolean))];
    return cities.sort();
  }, [audiologas]);

  // Filtrar datos aplicando los filtros activos
  const audiologasFiltradas = useMemo(() => {
    return audiologas.filter(audiologa => {
      // Filtro por término de búsqueda (nombre, ciudad)
      const searchMatch = !searchTerm || 
        audiologa.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audiologa.ciudad?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por ciudad
      const cityMatch = !selectedCity || selectedCity === 'Todas las ciudades' || 
        audiologa.ciudad === selectedCity;

      // Filtro por especialidad
      const specialtyMatch = !selectedSpecialty || selectedSpecialty === 'Todas las especialidades' || 
        audiologa.profesion === selectedSpecialty;

      // Filtro por prepagada
      const polizaMatch = !selectedPoliza || selectedPoliza === 'Todas las pólizas' || 
        (audiologa.prepagadas && audiologa.prepagadas.includes(selectedPoliza));

      return searchMatch && cityMatch && specialtyMatch && polizaMatch;
    });
  }, [audiologas, searchTerm, selectedCity, selectedSpecialty, selectedPoliza]);

  // Función para manejar el clic en una tarjeta de profesional
  const handleProfessionalClick = (audiologa) => {
    console.log('🖱️ Clic en audióloga:', audiologa.nombre);
    const professionalId = audiologa.nombre
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
      .replace(/^-|-$/g, ''); // Remover guiones del inicio y final
    console.log('🆔 ID generado:', professionalId);
    console.log('🧭 Navegando a:', `/profesionales/audiologos/${professionalId}`);
    
    navigate(`/profesionales/audiologos/${professionalId}`);
  };

  // Función para manejar filtros del SearchEngine
  const handleSearchFilter = (filters) => {
    console.log('AudiologasPage - Filtros recibidos:', filters);
    const newSearchTerm = filters.query || '';
    const newCity = filters.ciudad || '';
    const newSpecialty = filters.especialidad || '';
    const newPoliza = filters.poliza || '';
    
    // Solo resetear la página si realmente cambiaron los filtros
    if (newSearchTerm !== searchTerm || newCity !== selectedCity || 
        newSpecialty !== selectedSpecialty || newPoliza !== selectedPoliza) {
      setSearchTerm(newSearchTerm);
      setSelectedCity(newCity);
      setSelectedSpecialty(newSpecialty);
      setSelectedPoliza(newPoliza);
      setCurrentPage(1); // Resetear a la primera página solo cuando cambian los filtros
    }
  };

  // Lógica de paginación
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(audiologasFiltradas.length / cardsPerPage);
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    const currentAudiologas = audiologasFiltradas.slice(startIndex, endIndex);
    
    console.log('📊 Paginación:', {
      currentPage,
      totalPages,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, audiologasFiltradas.length),
      totalItems: audiologasFiltradas.length,
      currentAudiologasCount: currentAudiologas.length
    });
    
    return { totalPages, currentAudiologas, startIndex: startIndex + 1, endIndex: Math.min(endIndex, audiologasFiltradas.length), totalItems: audiologasFiltradas.length };
  }, [audiologasFiltradas, currentPage]);

  const handlePageChange = (newPage) => {
    console.log('🔄 Cambiando a página:', newPage, 'desde página actual:', currentPage);
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  console.log('🎯 AudiologasPage renderizando con', audiologas.length, 'audiólogas');
  console.log('📋 Primeras 3 audiólogas:', audiologas.slice(0, 3).map(a => a.nombre));

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
          <h1 className="hero-title">Encuentra tu Audióloga</h1>
          <p className="hero-subtitle">Especialistas certificadas en audiología para el cuidado de tu salud auditiva</p>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{audiologas.length}</div>
              <div className="stat-label">Especialistas</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{[...new Set(audiologas.map(audiologa => audiologa.ciudad).filter(Boolean))].length}</div>
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
          especialidades={['Audióloga']}
          polizas={[]}
        />
      </div>



                          {/* Contenido principal */}
                    <div className="main-content" style={{ flex: 1 }}>
                      
                      <div className="results-header">
          <h2 className="results-title">
            {paginationData.totalItems} {paginationData.totalItems === 1 ? 'Especialista encontrada' : 'Especialistas encontradas'}
          </h2>
          <div className="rating-info">
            <FaStar style={{ color: '#fbbf24' }} />
            <span>Calificación promedio: 4.8</span>
          </div>
        </div>
        
        {paginationData.currentAudiologas.length > 0 ? (
          <>
            <div className="cards-grid">
              {paginationData.currentAudiologas.map((audiologa, idx) => (
                <div 
                  key={idx} 
                  className="professional-card"
                  onClick={() => handleProfessionalClick(audiologa)}
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
                      Verificada
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="specialty-badge">
                      Audióloga
                    </div>
                    <h3 className="professional-name">
                      <b>{audiologa.nombre}</b>
                    </h3>
                    <div className="location-info">
                      <span style={{ fontWeight: 'bold' }}>{audiologa.ciudad}</span>
                    </div>

                    {/* Datos de contacto */}
                    <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#86899C', marginBottom: '4px' }}>
                        Teléfono: {audiologa.telefono}
                      </div>
                      <div style={{ fontSize: '12px', color: '#86899C', marginBottom: '4px' }}>
                        Email: {audiologa.email || 'No disponible'}
                      </div>
                    </div>

                    {/* Prepagadas */}
                    {audiologa.prepagadas && audiologa.prepagadas.length > 0 && (
                      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#272F50' }}>Prepagadas aceptadas</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center' }}>
                          {audiologa.prepagadas.slice(0, 3).map((prepagada, index) => (
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
                          {audiologa.prepagadas.length > 3 && (
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
                              +{audiologa.prepagadas.length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Servicios */}
                    {audiologa.servicios && audiologa.servicios.length > 0 && (
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
                          {audiologa.servicios.slice(0, 3).map((servicio, index) => (
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
                          {audiologa.servicios.length > 3 && (
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
                              +{audiologa.servicios.length - 3} más
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
                    </div>

                    {/* Sección Contáctanos */}
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
                          transition: 'all 0.3s ease'
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
                          transition: 'all 0.3s ease'
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
                          transition: 'all 0.3s ease'
                        }}
                        aria-label="Página web"
                      >
                        <FaGlobe size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {paginationData.totalPages > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '8px', 
                marginTop: '40px',
                marginBottom: '40px'
              }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #085946',
                    background: currentPage === 1 ? '#f3f4f6' : 'white',
                    color: currentPage === 1 ? '#86899C' : '#085946',
                    borderRadius: '8px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Anterior
                </button>
                
                {Array.from({ length: paginationData.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #085946',
                      background: currentPage === page ? '#085946' : 'white',
                      color: currentPage === page ? 'white' : '#085946',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      minWidth: '40px'
                    }}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === paginationData.totalPages}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #085946',
                    background: currentPage === paginationData.totalPages ? '#f3f4f6' : 'white',
                    color: currentPage === paginationData.totalPages ? '#86899C' : '#085946',
                    borderRadius: '8px',
                    cursor: currentPage === paginationData.totalPages ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
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
                setCurrentPage(1);
              }}
              className="btn-clear"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
      
      <Footer />
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .excel-uploader-section {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .excel-uploader-section:hover {
          border-color: #085946;
          box-shadow: 0 10px 15px -3px rgba(8, 89, 70, 0.1), 0 4px 6px -2px rgba(8, 89, 70, 0.05);
        }
      `}</style>
    </div>
  );
};

export default AudiologasPage; 