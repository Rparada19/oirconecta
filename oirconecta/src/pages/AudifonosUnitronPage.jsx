import React from 'react';
import { BatteryChargingFull, Bluetooth, Hearing, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'Unitron',
  slug: 'unitron',
  logo: '/logos/marcas/Unitron-logo.png',
  eslogan: 'Flex:trial™',
  descripcion: 'Marca canadiense del grupo Sonova. Pioneros en pruebas Flex:trial™ — usa el audífono varios días antes de decidir. Líneas Blu y Discover.',
  color: '#0066B2',
  stats: [{ value: '4.6', label: 'Rating' }, { value: '04', label: 'Modelos' }, { value: '24h', label: 'Batería' }, { value: 'Flex:trial™', label: 'Prueba' }],
};

const productos = [
  { nombre: 'Blu RT', categoria: 'RIC', descripcion: 'Recargable con conectividad universal', caracteristicas: ['Bluetooth universal', 'Recargable', 'Audífono dual', 'App'], destacado: true },
  { nombre: 'Vivante', categoria: 'RIC', descripcion: 'Audífono con coaching de adaptación', caracteristicas: ['Coaching adaptativo', 'Recargable', 'Bluetooth', 'App Unitron Remote Plus'], destacado: false },
  { nombre: 'Moxi V', categoria: 'BTE', descripcion: 'Robusto y resistente para vida activa', caracteristicas: ['IP68', 'Conectividad', 'Larga vida', 'Discreto'], destacado: false },
  { nombre: 'Discover Next', categoria: 'CIC', descripcion: 'Custom-made con la última tecnología', caracteristicas: ['Custom-made', 'Discreto', 'Procesamiento avanzado', 'Adaptación'], destacado: false },
];

const tecnologias = [
  { Icon: Hearing, titulo: 'SoundCore', descripcion: 'Plataforma de procesamiento' },
  { Icon: Bluetooth, titulo: 'Bluetooth universal', descripcion: 'iPhone, Android y más' },
  { Icon: BatteryChargingFull, titulo: 'Recargable', descripcion: 'Una carga, todo el día' },
  { Icon: Smartphone, titulo: 'Flex:trial™', descripcion: 'Prueba antes de comprar' },
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
