/**
 * Marcas del directorio por categoría (catálogo + modo libre en el formulario).
 */

const sortEs = (a, b) => a.localeCompare(b, 'es');

export const MARCAS_AUDIFONOS = [
  'Phonak',
  'Oticon',
  'Signia',
  'ReSound',
  'Widex',
  'Starkey',
  'Unitron',
  'Bernafon',
  'Audio Service',
  'Rexton',
  'Hansaton',
  'Sonic',
  'Philips HearLink',
].sort(sortEs);

export const MARCAS_IMPLANTES_COCLEARES = [
  'Cochlear',
  'Advanced Bionics',
  'MED-EL',
  'Oticon Medical',
  'Neurelec',
  'SYNCHRONY',
].sort(sortEs);

export const MARCAS_ACCESORIOS = [
  'Phonak Roger',
  'Oticon ConnectClip',
  'Signia StreamLine',
  'Widex COM-DEX',
  'Unitron uStream',
  'Resound Multi Mic',
  'Starkey Surflink',
  'Estación de recarga',
  'Pilas para audífono',
  'Domos y moldes',
  'Cera para audífonos',
  'Deshumidificador',
].sort(sortEs);

export const MARCAS_FARMACIA = [
  'Audispray',
  'Otofer',
  'Quies',
  'BIO-OHR',
  'FrontLine',
  'Otosan',
].sort(sortEs);
