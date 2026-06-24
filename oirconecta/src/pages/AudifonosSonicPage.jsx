import React from 'react';
import { BatteryChargingFull, Bluetooth, Hearing, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'Sonic',
  slug: 'sonic',
  logo: '/logos/marcas/Sonic-logo.png',
  eslogan: 'Captelligence',
  descripcion: 'Marca americana con procesamiento adaptativo Captelligence y series Radiant para presupuestos ajustados sin sacrificar calidad.',
  color: '#2D2D2D',
  stats: [{ value: '4.4', label: 'Rating' }, { value: '04', label: 'Modelos' }, { value: '24h', label: 'Batería' }, { value: 'IP68', label: 'Resistencia' }],
};

const productos = [
  { nombre: 'Radiant', categoria: 'RIC', descripcion: 'Procesamiento adaptativo Captelligence', caracteristicas: ['Captelligence', 'Bluetooth', 'Recargable', 'App SoundLink 2'], destacado: true },
  { nombre: 'Enchant', categoria: 'BTE', descripcion: 'Audición clara y conectada', caracteristicas: ['Conectividad', 'IP68', 'Larga vida', 'App'], destacado: false },
  { nombre: 'Cheer', categoria: 'CIC', descripcion: 'Discreto con tecnología accesible', caracteristicas: ['Custom-made', 'Compacto', 'Procesamiento avanzado', 'Discreto'], destacado: false },
  { nombre: 'Pep', categoria: 'ITC', descripcion: 'Pequeño para vida activa', caracteristicas: ['Discreto', 'Resistente', 'Conectividad', 'Adaptación'], destacado: false },
];

const tecnologias = [
  { Icon: Hearing, titulo: 'Captelligence', descripcion: 'Procesamiento adaptativo' },
  { Icon: Bluetooth, titulo: 'Bluetooth', descripcion: 'Streaming directo' },
  { Icon: BatteryChargingFull, titulo: 'Recargable', descripcion: 'Sin pilas desechables' },
  { Icon: Smartphone, titulo: 'SoundLink 2 App', descripcion: 'Control desde tu móvil' },
];

export default function Page() {
  return (
    <BrandPageTemplate
      brand={BRAND}
      productos={productos}
      tecnologias={tecnologias}
      categoria="audifonos"
      seoTitle={`Audífonos ${BRAND.nombre} en Colombia — OírConecta`}
      seoDescription={`Conoce los audífonos ${BRAND.nombre} disponibles en Colombia. ${BRAND.eslogan}.`}
      canonical={`https://oirconecta.com/audifonos/${BRAND.slug}`}
    />
  );
}
