import React from 'react';
import { BatteryChargingFull, Bluetooth, Hearing, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'Signia',
  slug: 'signia',
  logo: '/logos/marcas/Signia-logo.png',
  eslogan: 'Own Voice Processing',
  descripcion: 'Audífonos con procesamiento avanzado de la voz propia y diseños recargables miniaturizados que ofrecen una experiencia auditiva natural en cualquier entorno.',
  color: '#DC143C',
  stats: [{ value: '4.9', label: 'Rating' }, { value: '04', label: 'Modelos' }, { value: '36h', label: 'Batería' }, { value: 'OVP', label: 'Tecnología' }],
};

const productos = [
  { nombre: 'Pure Charge&Go', categoria: 'RIC', descripcion: 'Recargable con Own Voice Processing', caracteristicas: ['Own Voice Processing', 'Recargable', 'Bluetooth', 'Conectividad'], destacado: true },
  { nombre: 'Motion Charge&Go', categoria: 'BTE', descripcion: 'Movimiento y rendimiento avanzado', caracteristicas: ['Motion sensors', 'Recargable', 'IP68', 'Conectividad'], destacado: false },
  { nombre: 'Styletto', categoria: 'RIC', descripcion: 'Diseño elegante y discreto', caracteristicas: ['Diseño slim', 'Recargable', 'Bluetooth', 'Estilo único'], destacado: false },
  { nombre: 'Active', categoria: 'CIC', descripcion: 'Pequeño y potente para vida activa', caracteristicas: ['Compacto', 'Resistente', 'Procesamiento avanzado', 'Discreto'], destacado: false },
];

const tecnologias = [
  { Icon: Hearing, titulo: 'Own Voice Processing', descripcion: 'Voz propia natural y cómoda' },
  { Icon: BatteryChargingFull, titulo: 'Charge&Go', descripcion: 'Carga rápida + 36h de uso' },
  { Icon: Bluetooth, titulo: 'Conectividad', descripcion: 'Bluetooth y accesorios' },
  { Icon: Smartphone, titulo: 'Signia App', descripcion: 'Control desde tu móvil' },
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
