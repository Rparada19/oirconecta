import React from 'react';
import { BatteryChargingFull, Bluetooth, Hearing, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'AudioService',
  slug: 'audioservice',
  logo: '/logos/marcas/AudioService-logo.png',
  eslogan: 'Hecho en Alemania',
  descripcion: 'Fabricante alemán independiente con líneas G6 y Mood. Procesamiento DEEP de 48 canales y enfoque en personalización.',
  color: '#FCD303',
  stats: [{ value: '4.6', label: 'Rating' }, { value: '04', label: 'Modelos' }, { value: '48ch', label: 'Procesamiento' }, { value: 'DE', label: 'Origen' }],
};

const productos = [
  { nombre: 'G6', categoria: 'RIC', descripcion: 'Procesamiento DEEP de 48 canales', caracteristicas: ['48 canales', 'Adaptación fina', 'Bluetooth', 'Recargable'], destacado: true },
  { nombre: 'Mood', categoria: 'BTE', descripcion: 'Sonido natural y personalizable', caracteristicas: ['Personalización', 'IP68', 'Conectividad', 'Discreto'], destacado: false },
  { nombre: 'Sun', categoria: 'CIC', descripcion: 'Discreto con tecnología alemana', caracteristicas: ['Custom-made', 'Compacto', 'Procesamiento avanzado', 'Adaptación profesional'], destacado: false },
  { nombre: 'Genius', categoria: 'RIC', descripcion: 'Línea premium con todas las features', caracteristicas: ['Premium features', 'Recargable', 'Bluetooth', 'App'], destacado: false },
];

const tecnologias = [
  { Icon: Hearing, titulo: 'Procesamiento DEEP', descripcion: '48 canales para máxima precisión' },
  { Icon: Smartphone, titulo: 'Connexx', descripcion: 'Ajustes profesionales avanzados' },
  { Icon: Bluetooth, titulo: 'Conectividad', descripcion: 'Streaming directo' },
  { Icon: BatteryChargingFull, titulo: 'Recargable', descripcion: 'Carga rápida' },
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
