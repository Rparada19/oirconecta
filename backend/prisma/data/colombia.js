/**
 * División político-administrativa de Colombia.
 *
 * Departamentos: los 32 + Distrito Capital (33 entidades).
 * Municipios: capitales departamentales + ciudades grandes y medianas (~140).
 *
 * Para cargar el catálogo COMPLETO (~1100 municipios), usa el CSV oficial DANE:
 *   https://www.datos.gov.co/Mapas-Nacionales/Departamentos-y-Municipios-de-Colombia/xdk5-pm3f
 * y pásalo a `loadFromDaneCsv(path)` (función abajo).
 *
 * Códigos DANE oficiales preservados como string (mantiene el "0" inicial).
 */

const DEPARTMENTS = [
  { slug: 'amazonas', nombre: 'Amazonas', codigoDane: '91', capital: 'Leticia', region: 'Amazonía', orden: 28 },
  { slug: 'antioquia', nombre: 'Antioquia', codigoDane: '05', capital: 'Medellín', region: 'Andina', orden: 1 },
  { slug: 'arauca', nombre: 'Arauca', codigoDane: '81', capital: 'Arauca', region: 'Orinoquía', orden: 24 },
  { slug: 'atlantico', nombre: 'Atlántico', codigoDane: '08', capital: 'Barranquilla', region: 'Caribe', orden: 2 },
  { slug: 'bogota-dc', nombre: 'Bogotá D.C.', codigoDane: '11', capital: 'Bogotá', region: 'Andina', orden: 0 },
  { slug: 'bolivar', nombre: 'Bolívar', codigoDane: '13', capital: 'Cartagena', region: 'Caribe', orden: 3 },
  { slug: 'boyaca', nombre: 'Boyacá', codigoDane: '15', capital: 'Tunja', region: 'Andina', orden: 4 },
  { slug: 'caldas', nombre: 'Caldas', codigoDane: '17', capital: 'Manizales', region: 'Andina', orden: 5 },
  { slug: 'caqueta', nombre: 'Caquetá', codigoDane: '18', capital: 'Florencia', region: 'Amazonía', orden: 18 },
  { slug: 'casanare', nombre: 'Casanare', codigoDane: '85', capital: 'Yopal', region: 'Orinoquía', orden: 25 },
  { slug: 'cauca', nombre: 'Cauca', codigoDane: '19', capital: 'Popayán', region: 'Pacífica', orden: 8 },
  { slug: 'cesar', nombre: 'Cesar', codigoDane: '20', capital: 'Valledupar', region: 'Caribe', orden: 9 },
  { slug: 'choco', nombre: 'Chocó', codigoDane: '27', capital: 'Quibdó', region: 'Pacífica', orden: 12 },
  { slug: 'cordoba', nombre: 'Córdoba', codigoDane: '23', capital: 'Montería', region: 'Caribe', orden: 10 },
  { slug: 'cundinamarca', nombre: 'Cundinamarca', codigoDane: '25', capital: 'Bogotá', region: 'Andina', orden: 11 },
  { slug: 'guainia', nombre: 'Guainía', codigoDane: '94', capital: 'Inírida', region: 'Amazonía', orden: 30 },
  { slug: 'guaviare', nombre: 'Guaviare', codigoDane: '95', capital: 'San José del Guaviare', region: 'Amazonía', orden: 29 },
  { slug: 'huila', nombre: 'Huila', codigoDane: '41', capital: 'Neiva', region: 'Andina', orden: 13 },
  { slug: 'la-guajira', nombre: 'La Guajira', codigoDane: '44', capital: 'Riohacha', region: 'Caribe', orden: 14 },
  { slug: 'magdalena', nombre: 'Magdalena', codigoDane: '47', capital: 'Santa Marta', region: 'Caribe', orden: 15 },
  { slug: 'meta', nombre: 'Meta', codigoDane: '50', capital: 'Villavicencio', region: 'Orinoquía', orden: 16 },
  { slug: 'narino', nombre: 'Nariño', codigoDane: '52', capital: 'Pasto', region: 'Pacífica', orden: 17 },
  { slug: 'norte-de-santander', nombre: 'Norte de Santander', codigoDane: '54', capital: 'Cúcuta', region: 'Andina', orden: 19 },
  { slug: 'putumayo', nombre: 'Putumayo', codigoDane: '86', capital: 'Mocoa', region: 'Amazonía', orden: 26 },
  { slug: 'quindio', nombre: 'Quindío', codigoDane: '63', capital: 'Armenia', region: 'Andina', orden: 6 },
  { slug: 'risaralda', nombre: 'Risaralda', codigoDane: '66', capital: 'Pereira', region: 'Andina', orden: 7 },
  { slug: 'san-andres-y-providencia', nombre: 'San Andrés y Providencia', codigoDane: '88', capital: 'San Andrés', region: 'Insular', orden: 27 },
  { slug: 'santander', nombre: 'Santander', codigoDane: '68', capital: 'Bucaramanga', region: 'Andina', orden: 20 },
  { slug: 'sucre', nombre: 'Sucre', codigoDane: '70', capital: 'Sincelejo', region: 'Caribe', orden: 21 },
  { slug: 'tolima', nombre: 'Tolima', codigoDane: '73', capital: 'Ibagué', region: 'Andina', orden: 22 },
  { slug: 'valle-del-cauca', nombre: 'Valle del Cauca', codigoDane: '76', capital: 'Cali', region: 'Pacífica', orden: 23 },
  { slug: 'vaupes', nombre: 'Vaupés', codigoDane: '97', capital: 'Mitú', region: 'Amazonía', orden: 32 },
  { slug: 'vichada', nombre: 'Vichada', codigoDane: '99', capital: 'Puerto Carreño', region: 'Orinoquía', orden: 31 },
];

/**
 * Municipios. `dep` = slug del departamento.
 * `cat`: capital_departamento (cabecera) | ciudad_grande (>200k hab.) | municipio.
 * Categoría se usa en el front para destacar/ordenar (capitales primero).
 */
const MUNICIPALITIES = [
  // Bogotá D.C.
  { slug: 'bogota', nombre: 'Bogotá', dep: 'bogota-dc', cat: 'capital_departamento', lat: 4.711, lng: -74.0721 },

  // Antioquia
  { slug: 'medellin', nombre: 'Medellín', dep: 'antioquia', cat: 'capital_departamento', lat: 6.2442, lng: -75.5812 },
  { slug: 'bello', nombre: 'Bello', dep: 'antioquia', cat: 'ciudad_grande' },
  { slug: 'itagui', nombre: 'Itagüí', dep: 'antioquia', cat: 'ciudad_grande' },
  { slug: 'envigado', nombre: 'Envigado', dep: 'antioquia', cat: 'ciudad_grande' },
  { slug: 'rionegro', nombre: 'Rionegro', dep: 'antioquia', cat: 'municipio' },
  { slug: 'apartado', nombre: 'Apartadó', dep: 'antioquia', cat: 'municipio' },
  { slug: 'turbo', nombre: 'Turbo', dep: 'antioquia', cat: 'municipio' },
  { slug: 'sabaneta', nombre: 'Sabaneta', dep: 'antioquia', cat: 'municipio' },
  { slug: 'caldas-ant', nombre: 'Caldas', dep: 'antioquia', cat: 'municipio' },
  { slug: 'la-estrella', nombre: 'La Estrella', dep: 'antioquia', cat: 'municipio' },
  { slug: 'copacabana', nombre: 'Copacabana', dep: 'antioquia', cat: 'municipio' },
  { slug: 'la-ceja', nombre: 'La Ceja', dep: 'antioquia', cat: 'municipio' },

  // Atlántico
  { slug: 'barranquilla', nombre: 'Barranquilla', dep: 'atlantico', cat: 'capital_departamento', lat: 10.9685, lng: -74.7813 },
  { slug: 'soledad', nombre: 'Soledad', dep: 'atlantico', cat: 'ciudad_grande' },
  { slug: 'malambo', nombre: 'Malambo', dep: 'atlantico', cat: 'municipio' },
  { slug: 'sabanagrande', nombre: 'Sabanagrande', dep: 'atlantico', cat: 'municipio' },
  { slug: 'galapa', nombre: 'Galapa', dep: 'atlantico', cat: 'municipio' },
  { slug: 'puerto-colombia', nombre: 'Puerto Colombia', dep: 'atlantico', cat: 'municipio' },
  { slug: 'baranoa', nombre: 'Baranoa', dep: 'atlantico', cat: 'municipio' },

  // Bolívar
  { slug: 'cartagena', nombre: 'Cartagena', dep: 'bolivar', cat: 'capital_departamento', lat: 10.391, lng: -75.4794 },
  { slug: 'magangue', nombre: 'Magangué', dep: 'bolivar', cat: 'municipio' },
  { slug: 'turbaco', nombre: 'Turbaco', dep: 'bolivar', cat: 'municipio' },
  { slug: 'arjona', nombre: 'Arjona', dep: 'bolivar', cat: 'municipio' },
  { slug: 'el-carmen-de-bolivar', nombre: 'El Carmen de Bolívar', dep: 'bolivar', cat: 'municipio' },

  // Boyacá
  { slug: 'tunja', nombre: 'Tunja', dep: 'boyaca', cat: 'capital_departamento', lat: 5.5446, lng: -73.3578 },
  { slug: 'duitama', nombre: 'Duitama', dep: 'boyaca', cat: 'municipio' },
  { slug: 'sogamoso', nombre: 'Sogamoso', dep: 'boyaca', cat: 'municipio' },
  { slug: 'chiquinquira', nombre: 'Chiquinquirá', dep: 'boyaca', cat: 'municipio' },
  { slug: 'paipa', nombre: 'Paipa', dep: 'boyaca', cat: 'municipio' },

  // Caldas
  { slug: 'manizales', nombre: 'Manizales', dep: 'caldas', cat: 'capital_departamento', lat: 5.0689, lng: -75.5174 },
  { slug: 'la-dorada', nombre: 'La Dorada', dep: 'caldas', cat: 'municipio' },
  { slug: 'chinchina', nombre: 'Chinchiná', dep: 'caldas', cat: 'municipio' },
  { slug: 'villamaria', nombre: 'Villamaría', dep: 'caldas', cat: 'municipio' },
  { slug: 'riosucio-cal', nombre: 'Riosucio', dep: 'caldas', cat: 'municipio' },

  // Caquetá
  { slug: 'florencia', nombre: 'Florencia', dep: 'caqueta', cat: 'capital_departamento', lat: 1.6144, lng: -75.6062 },

  // Cauca
  { slug: 'popayan', nombre: 'Popayán', dep: 'cauca', cat: 'capital_departamento', lat: 2.4448, lng: -76.6147 },
  { slug: 'santander-de-quilichao', nombre: 'Santander de Quilichao', dep: 'cauca', cat: 'municipio' },
  { slug: 'puerto-tejada', nombre: 'Puerto Tejada', dep: 'cauca', cat: 'municipio' },
  { slug: 'patia', nombre: 'Patía', dep: 'cauca', cat: 'municipio' },

  // Cesar
  { slug: 'valledupar', nombre: 'Valledupar', dep: 'cesar', cat: 'capital_departamento', lat: 10.4631, lng: -73.2532 },
  { slug: 'aguachica', nombre: 'Aguachica', dep: 'cesar', cat: 'municipio' },
  { slug: 'bosconia', nombre: 'Bosconia', dep: 'cesar', cat: 'municipio' },
  { slug: 'codazzi', nombre: 'Agustín Codazzi', dep: 'cesar', cat: 'municipio' },

  // Chocó
  { slug: 'quibdo', nombre: 'Quibdó', dep: 'choco', cat: 'capital_departamento', lat: 5.6919, lng: -76.6583 },
  { slug: 'istmina', nombre: 'Istmina', dep: 'choco', cat: 'municipio' },
  { slug: 'tado', nombre: 'Tadó', dep: 'choco', cat: 'municipio' },

  // Córdoba
  { slug: 'monteria', nombre: 'Montería', dep: 'cordoba', cat: 'capital_departamento', lat: 8.748, lng: -75.881 },
  { slug: 'lorica', nombre: 'Lorica', dep: 'cordoba', cat: 'municipio' },
  { slug: 'cerete', nombre: 'Cereté', dep: 'cordoba', cat: 'municipio' },
  { slug: 'sahagun', nombre: 'Sahagún', dep: 'cordoba', cat: 'municipio' },
  { slug: 'tierralta', nombre: 'Tierralta', dep: 'cordoba', cat: 'municipio' },
  { slug: 'planeta-rica', nombre: 'Planeta Rica', dep: 'cordoba', cat: 'municipio' },

  // Cundinamarca
  { slug: 'soacha', nombre: 'Soacha', dep: 'cundinamarca', cat: 'ciudad_grande' },
  { slug: 'facatativa', nombre: 'Facatativá', dep: 'cundinamarca', cat: 'municipio' },
  { slug: 'chia', nombre: 'Chía', dep: 'cundinamarca', cat: 'municipio' },
  { slug: 'zipaquira', nombre: 'Zipaquirá', dep: 'cundinamarca', cat: 'municipio' },
  { slug: 'mosquera', nombre: 'Mosquera', dep: 'cundinamarca', cat: 'municipio' },
  { slug: 'madrid', nombre: 'Madrid', dep: 'cundinamarca', cat: 'municipio' },
  { slug: 'funza', nombre: 'Funza', dep: 'cundinamarca', cat: 'municipio' },
  { slug: 'cajica', nombre: 'Cajicá', dep: 'cundinamarca', cat: 'municipio' },
  { slug: 'girardot', nombre: 'Girardot', dep: 'cundinamarca', cat: 'municipio' },
  { slug: 'fusagasuga', nombre: 'Fusagasugá', dep: 'cundinamarca', cat: 'municipio' },
  { slug: 'la-calera', nombre: 'La Calera', dep: 'cundinamarca', cat: 'municipio' },
  { slug: 'cota', nombre: 'Cota', dep: 'cundinamarca', cat: 'municipio' },
  { slug: 'tenjo', nombre: 'Tenjo', dep: 'cundinamarca', cat: 'municipio' },

  // Huila
  { slug: 'neiva', nombre: 'Neiva', dep: 'huila', cat: 'capital_departamento', lat: 2.9273, lng: -75.2819 },
  { slug: 'pitalito', nombre: 'Pitalito', dep: 'huila', cat: 'municipio' },
  { slug: 'garzon', nombre: 'Garzón', dep: 'huila', cat: 'municipio' },
  { slug: 'la-plata-hui', nombre: 'La Plata', dep: 'huila', cat: 'municipio' },

  // La Guajira
  { slug: 'riohacha', nombre: 'Riohacha', dep: 'la-guajira', cat: 'capital_departamento', lat: 11.5444, lng: -72.9072 },
  { slug: 'maicao', nombre: 'Maicao', dep: 'la-guajira', cat: 'municipio' },
  { slug: 'uribia', nombre: 'Uribia', dep: 'la-guajira', cat: 'municipio' },
  { slug: 'manaure', nombre: 'Manaure', dep: 'la-guajira', cat: 'municipio' },
  { slug: 'san-juan-del-cesar', nombre: 'San Juan del Cesar', dep: 'la-guajira', cat: 'municipio' },

  // Magdalena
  { slug: 'santa-marta', nombre: 'Santa Marta', dep: 'magdalena', cat: 'capital_departamento', lat: 11.2408, lng: -74.199 },
  { slug: 'cienaga', nombre: 'Ciénaga', dep: 'magdalena', cat: 'municipio' },
  { slug: 'fundacion', nombre: 'Fundación', dep: 'magdalena', cat: 'municipio' },
  { slug: 'aracataca', nombre: 'Aracataca', dep: 'magdalena', cat: 'municipio' },
  { slug: 'el-banco', nombre: 'El Banco', dep: 'magdalena', cat: 'municipio' },

  // Meta
  { slug: 'villavicencio', nombre: 'Villavicencio', dep: 'meta', cat: 'capital_departamento', lat: 4.142, lng: -73.6266 },
  { slug: 'acacias', nombre: 'Acacías', dep: 'meta', cat: 'municipio' },
  { slug: 'granada-meta', nombre: 'Granada', dep: 'meta', cat: 'municipio' },
  { slug: 'puerto-lopez', nombre: 'Puerto López', dep: 'meta', cat: 'municipio' },

  // Nariño
  { slug: 'pasto', nombre: 'Pasto', dep: 'narino', cat: 'capital_departamento', lat: 1.2136, lng: -77.2811 },
  { slug: 'tumaco', nombre: 'Tumaco', dep: 'narino', cat: 'municipio' },
  { slug: 'ipiales', nombre: 'Ipiales', dep: 'narino', cat: 'municipio' },
  { slug: 'tuquerres', nombre: 'Túquerres', dep: 'narino', cat: 'municipio' },

  // Norte de Santander
  { slug: 'cucuta', nombre: 'Cúcuta', dep: 'norte-de-santander', cat: 'capital_departamento', lat: 7.8939, lng: -72.5078 },
  { slug: 'ocana', nombre: 'Ocaña', dep: 'norte-de-santander', cat: 'municipio' },
  { slug: 'pamplona', nombre: 'Pamplona', dep: 'norte-de-santander', cat: 'municipio' },
  { slug: 'villa-del-rosario', nombre: 'Villa del Rosario', dep: 'norte-de-santander', cat: 'municipio' },
  { slug: 'los-patios', nombre: 'Los Patios', dep: 'norte-de-santander', cat: 'municipio' },

  // Quindío
  { slug: 'armenia', nombre: 'Armenia', dep: 'quindio', cat: 'capital_departamento', lat: 4.5339, lng: -75.6811 },
  { slug: 'calarca', nombre: 'Calarcá', dep: 'quindio', cat: 'municipio' },
  { slug: 'montenegro', nombre: 'Montenegro', dep: 'quindio', cat: 'municipio' },
  { slug: 'la-tebaida', nombre: 'La Tebaida', dep: 'quindio', cat: 'municipio' },
  { slug: 'quimbaya', nombre: 'Quimbaya', dep: 'quindio', cat: 'municipio' },

  // Risaralda
  { slug: 'pereira', nombre: 'Pereira', dep: 'risaralda', cat: 'capital_departamento', lat: 4.8133, lng: -75.6961 },
  { slug: 'dosquebradas', nombre: 'Dosquebradas', dep: 'risaralda', cat: 'ciudad_grande' },
  { slug: 'la-virginia', nombre: 'La Virginia', dep: 'risaralda', cat: 'municipio' },
  { slug: 'santa-rosa-de-cabal', nombre: 'Santa Rosa de Cabal', dep: 'risaralda', cat: 'municipio' },

  // Santander
  { slug: 'bucaramanga', nombre: 'Bucaramanga', dep: 'santander', cat: 'capital_departamento', lat: 7.1193, lng: -73.1227 },
  { slug: 'floridablanca', nombre: 'Floridablanca', dep: 'santander', cat: 'ciudad_grande' },
  { slug: 'giron', nombre: 'Girón', dep: 'santander', cat: 'ciudad_grande' },
  { slug: 'piedecuesta', nombre: 'Piedecuesta', dep: 'santander', cat: 'ciudad_grande' },
  { slug: 'barrancabermeja', nombre: 'Barrancabermeja', dep: 'santander', cat: 'ciudad_grande' },
  { slug: 'san-gil', nombre: 'San Gil', dep: 'santander', cat: 'municipio' },
  { slug: 'socorro', nombre: 'Socorro', dep: 'santander', cat: 'municipio' },
  { slug: 'malaga', nombre: 'Málaga', dep: 'santander', cat: 'municipio' },

  // Sucre
  { slug: 'sincelejo', nombre: 'Sincelejo', dep: 'sucre', cat: 'capital_departamento', lat: 9.305, lng: -75.3978 },
  { slug: 'corozal', nombre: 'Corozal', dep: 'sucre', cat: 'municipio' },
  { slug: 'san-marcos-suc', nombre: 'San Marcos', dep: 'sucre', cat: 'municipio' },

  // Tolima
  { slug: 'ibague', nombre: 'Ibagué', dep: 'tolima', cat: 'capital_departamento', lat: 4.4389, lng: -75.2322 },
  { slug: 'espinal', nombre: 'Espinal', dep: 'tolima', cat: 'municipio' },
  { slug: 'honda', nombre: 'Honda', dep: 'tolima', cat: 'municipio' },
  { slug: 'melgar', nombre: 'Melgar', dep: 'tolima', cat: 'municipio' },
  { slug: 'mariquita', nombre: 'San Sebastián de Mariquita', dep: 'tolima', cat: 'municipio' },
  { slug: 'chaparral', nombre: 'Chaparral', dep: 'tolima', cat: 'municipio' },

  // Valle del Cauca
  { slug: 'cali', nombre: 'Cali', dep: 'valle-del-cauca', cat: 'capital_departamento', lat: 3.4516, lng: -76.532 },
  { slug: 'palmira', nombre: 'Palmira', dep: 'valle-del-cauca', cat: 'ciudad_grande' },
  { slug: 'buenaventura', nombre: 'Buenaventura', dep: 'valle-del-cauca', cat: 'ciudad_grande' },
  { slug: 'tulua', nombre: 'Tuluá', dep: 'valle-del-cauca', cat: 'ciudad_grande' },
  { slug: 'cartago', nombre: 'Cartago', dep: 'valle-del-cauca', cat: 'municipio' },
  { slug: 'buga', nombre: 'Guadalajara de Buga', dep: 'valle-del-cauca', cat: 'municipio' },
  { slug: 'yumbo', nombre: 'Yumbo', dep: 'valle-del-cauca', cat: 'municipio' },
  { slug: 'jamundi', nombre: 'Jamundí', dep: 'valle-del-cauca', cat: 'municipio' },
  { slug: 'candelaria-val', nombre: 'Candelaria', dep: 'valle-del-cauca', cat: 'municipio' },

  // Arauca
  { slug: 'arauca-ciu', nombre: 'Arauca', dep: 'arauca', cat: 'capital_departamento', lat: 7.0883, lng: -70.7611 },
  { slug: 'saravena', nombre: 'Saravena', dep: 'arauca', cat: 'municipio' },
  { slug: 'tame', nombre: 'Tame', dep: 'arauca', cat: 'municipio' },

  // Casanare
  { slug: 'yopal', nombre: 'Yopal', dep: 'casanare', cat: 'capital_departamento', lat: 5.3392, lng: -72.4019 },
  { slug: 'aguazul', nombre: 'Aguazul', dep: 'casanare', cat: 'municipio' },
  { slug: 'paz-de-ariporo', nombre: 'Paz de Ariporo', dep: 'casanare', cat: 'municipio' },

  // Putumayo
  { slug: 'mocoa', nombre: 'Mocoa', dep: 'putumayo', cat: 'capital_departamento', lat: 1.1517, lng: -76.6469 },
  { slug: 'puerto-asis', nombre: 'Puerto Asís', dep: 'putumayo', cat: 'municipio' },
  { slug: 'orito', nombre: 'Orito', dep: 'putumayo', cat: 'municipio' },

  // San Andrés y Providencia
  { slug: 'san-andres', nombre: 'San Andrés', dep: 'san-andres-y-providencia', cat: 'capital_departamento', lat: 12.5847, lng: -81.7006 },
  { slug: 'providencia', nombre: 'Providencia', dep: 'san-andres-y-providencia', cat: 'municipio' },

  // Amazonas
  { slug: 'leticia', nombre: 'Leticia', dep: 'amazonas', cat: 'capital_departamento', lat: -4.2153, lng: -69.9406 },
  { slug: 'puerto-narino', nombre: 'Puerto Nariño', dep: 'amazonas', cat: 'municipio' },

  // Guainía
  { slug: 'inirida', nombre: 'Inírida', dep: 'guainia', cat: 'capital_departamento', lat: 3.8653, lng: -67.9239 },

  // Guaviare
  { slug: 'san-jose-del-guaviare', nombre: 'San José del Guaviare', dep: 'guaviare', cat: 'capital_departamento', lat: 2.5708, lng: -72.6411 },

  // Vaupés
  { slug: 'mitu', nombre: 'Mitú', dep: 'vaupes', cat: 'capital_departamento', lat: 1.2536, lng: -70.2336 },

  // Vichada
  { slug: 'puerto-carreno', nombre: 'Puerto Carreño', dep: 'vichada', cat: 'capital_departamento', lat: 6.1853, lng: -67.4836 },
];

/**
 * Loader opcional: lee un CSV oficial DANE (Departamentos y Municipios) y devuelve
 * el array completo de ~1100 municipios listo para upsert.
 *
 * Formato esperado del CSV (variantes comunes del portal datos.gov.co):
 *   "Código Departamento";"Nombre Departamento";"Código Municipio";"Nombre Municipio"
 *
 * @param {string} filePath  Ruta absoluta al CSV.
 * @returns {Promise<Array<{ slug, nombre, dep, codigoDane, cat }>>}
 */
async function loadFromDaneCsv(filePath) {
  const fs = require('fs/promises');
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).slice(1).filter(Boolean);
  const slugify = (s) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const byDanedep = Object.fromEntries(DEPARTMENTS.map((d) => [d.codigoDane, d.slug]));
  return lines.map((line) => {
    const cells = line.split(';').map((c) => c.replace(/^"|"$/g, '').trim());
    const [codDep, , codMun, nomMun] = cells;
    return {
      slug: `${slugify(nomMun)}-${codMun}`,
      nombre: nomMun,
      dep: byDanedep[codDep] || null,
      codigoDane: codMun,
      cat: 'municipio',
    };
  });
}

module.exports = { DEPARTMENTS, MUNICIPALITIES, loadFromDaneCsv };
