/**
 * Perfiles de demostración para el directorio (no persisten en API).
 * Activar: entorno DEV, o VITE_DIRECTORY_DEMO=true|1, o VITE_DIRECTORY_DEMO=when_empty (solo si la API no devuelve fichas).
 */

const PR = ['Fonoaudiología', 'Audiología', 'Otorrinolaringología', 'Otología'];

const NAMES = [
  ['Dra. Marcela Rincón', 'Lic. Tomás Duarte', 'Dra. Valentina Soto', 'Lic. Esteban Murillo'],
  ['Dra. Carolina Mejía', 'Dr. Felipe Arango', 'Dra. Lucía Herrera', 'Dr. David Cárdenas'],
  ['Dr. Andrés Villamizar', 'Dra. Paula Gómez', 'Dr. Ricardo Nieto', 'Dra. Isabel Cuesta'],
  ['Dr. Hernán Delgado', 'Dra. Mónica Prieto', 'Dr. Javier Lozano', 'Dra. Adriana Franco'],
];

const CONS = [
  ['Centro Voz y Oído', 'Integral Fonoaudiología', 'Conecta Lenguaje', 'Audición Familiar'],
  ['Audición Clara', 'Centro Auditivo del Valle', 'Escucha Activa', 'Bienestar Sonoro'],
  ['ORL Chapinero', 'Instituto ORL Norte', 'Cuidado ORL Antioquia', 'Oído y Equilibrio'],
  ['Otología Avanzada', 'Instituto del Oído', 'Neuro-oto Bogotá', 'Otología Caribe'],
];

const SNIPPETS = [
  'Te explica con calma y sin tecnicismos innecesarios.',
  'Equipo humano; te sientes escuchado desde la primera visita.',
  'Muy ordenados con tiempos y seguimiento después de la valoración.',
  'Ideal si buscas segunda opinión antes de decidir.',
];

const QUOTES = [
  { text: 'Salí con un plan claro y sin presión para comprar.', author: 'Paciente verificado' },
  { text: 'Mi mamá entendió todo; eso para nosotros valió oro.', author: 'Familiar' },
];

const PHOTOS = (u) => `https://i.pravatar.cc/400?img=${u}`;

function demoGeneroFichaFromNombre(nombre) {
  const n = String(nombre || '').trim();
  if (/^dra\.?/i.test(n)) return 'FEMENINO';
  if (/^dr\.?/i.test(n) && !/^dra/i.test(n)) return 'MASCULINO';
  if (/^lic\./i.test(n)) {
    if (/marcela|carolina|valentina|paula|lucía|isabel|mónica|adriana/i.test(n)) return 'FEMENINO';
    if (/tomás|esteban|felipe|david|andrés|ricardo|javier|hernán/i.test(n)) return 'MASCULINO';
  }
  return null;
}

function demoWorkplaces(city, phone, i) {
  const c2 = city === 'Bogotá' ? 'Chía' : city === 'Medellín' ? 'Envigado' : 'Localidad cercana';
  return [
    {
      id: `dw-${i}-1`,
      nombreCentro: i % 2 === 0 ? 'Consulta principal' : 'Centro auditivo',
      ciudad: city,
      direccion: 'Zona de fácil acceso',
      telefono: phone,
      esPrincipal: true,
      orden: 0,
    },
    {
      id: `dw-${i}-2`,
      nombreCentro: 'Sede adicional',
      ciudad: c2,
      telefono: null,
      esPrincipal: false,
      orden: 1,
    },
  ];
}

function buildProfiles() {
  const list = [];
  let idx = 1;
  PR.forEach((profesion, pi) => {
    for (let j = 0; j < 4; j++) {
      const id = `demo-${pi}-${j}`;
      const name = NAMES[pi][j];
      const city = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla'][j];
      const phone = `+57 300 ${200 + idx} ${1000 + idx}`;
      const rating = 4.5 + (idx % 5) * 0.1;
      const reviews = 12 + idx * 3;
      const premium = idx % 5 === 0 || idx % 7 === 0;
      const allies = [
        { name: ['Phonak', 'Oticon', 'Widex', 'Signia'][idx % 4] },
        { name: ['Resound', 'Starkey', 'Bernafon', 'Unitron'][(idx + 1) % 4] },
      ];
      const services = [
        ['Valoración integral', 'Rehabilitación', 'Teleconsulta'][(idx + j) % 3],
        ['Adaptación de audífonos', 'Pruebas auditivas', 'Seguimiento'][(idx + j + 1) % 3],
        ['Consulta ORL', 'Endoscopia', 'Rinitis y sinusitis'][(idx) % 3],
      ].filter((_, k) => k < 2 + (idx % 2));

      list.push({
        id,
        status: 'APPROVED',
        esCentro: false,
        generoFicha: demoGeneroFichaFromNombre(name),
        profesion,
        nombreConsultorio: CONS[pi][j],
        polizasAceptadas: [['Sura', 'Sanitas'][idx % 2], 'Colsanitas'].filter((_, k) => k < 1 + (idx % 2)),
        photoUrls: [PHOTOS(10 + idx)],
        allies: {
          audifonos: allies,
          implantes: idx % 3 === 0 ? [{ name: 'Cochlear' }] : [],
          medicamentos: [],
          accesorios: [{ name: 'Consumibles y pilas' }],
        },
        workplaces: demoWorkplaces(city, phone, idx),
        account: {
          id: `acc-${id}`,
          nombre: name,
          email: `demo.perfil.${id}@oirconecta.local`,
        },
        consultation: { costos: '', preparacion: '', contactoCentro: '' },
        _demo: {
          tagline: `${name} acompaña procesos de ${profesion.toLowerCase()} en ${city}. ${SNIPPETS[idx % SNIPPETS.length]}`,
          rating: Math.round(rating * 10) / 10,
          reviewCount: reviews,
          testimonialSnippet: QUOTES[idx % QUOTES.length].text,
          testimonials: [QUOTES[idx % QUOTES.length], QUOTES[(idx + 1) % QUOTES.length]],
          premium,
          services,
        },
      });
      idx += 1;
    }
  });
  return list;
}

const PROFILES = buildProfiles();

/** Mapa id → perfil (detalle sin API). */
export const DEMO_PROFILE_MAP = Object.fromEntries(PROFILES.map((p) => [p.id, p]));

export function getDirectoryDemoProfiles() {
  return PROFILES;
}

export function shouldMergeDirectoryDemo(apiCount) {
  const v = import.meta.env.VITE_DIRECTORY_DEMO;
  if (v === 'true' || v === '1' || v === 'always') return true;
  if (v === 'when_empty' && apiCount === 0) return true;
  if (import.meta.env.DEV) return true;
  return false;
}

