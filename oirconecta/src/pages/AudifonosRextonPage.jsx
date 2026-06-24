import React from 'react';
import { BatteryChargingFull, Bluetooth, Hearing, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'Rexton',
  slug: 'rexton',
  logo: '/logos/marcas/Rexton-logo.png',
  eslogan: 'Relación calidad-precio',
  descripcion: 'Marca alemana con relación calidad-precio destacada. Comparte tecnologías con Signia y ofrece soluciones robustas para distintos grados de pérdida.',
  color: '#F0B400',
  stats: [{ value: '4.5', label: 'Rating' }, { value: '04', label: 'Modelos' }, { value: '30h', label: 'Batería' }, { value: 'IP68', label: 'Resistencia' }],
};

const productos = [
  { nombre: 'Reach', categoria: 'RIC', descripcion: 'Audífono moderno con conectividad', caracteristicas: ['Bluetooth', 'Recargable', 'App control', 'Discreto'], destacado: true },
  { nombre: 'M-Core', categoria: 'BTE', descripcion: 'Potencia para pérdidas severas', caracteristicas: ['Potencia', 'IP68', 'Robusto', 'Conectividad'], destacado: false },
  { nombre: 'Inox', categoria: 'CIC', descripcion: 'Pequeño y casi invisible', caracteristicas: ['Discreto', 'Compacto', 'Procesamiento avanzado', 'Custom-made'], destacado: false },
  { nombre: 'Stellar', categoria: 'RIC', descripcion: 'Tecnología premium accesible', caracteristicas: ['Bluetooth', 'Recargable', 'App', 'Streaming'], destacado: false },
];

const tecnologias = [
  { Icon: Hearing, titulo: 'Procesamiento avanzado', descripcion: 'Calidad sin compromiso' },
  { Icon: Bluetooth, titulo: 'Bluetooth', descripcion: 'Streaming directo a tu audífono' },
  { Icon: BatteryChargingFull, titulo: 'Recargable', descripcion: 'Sin pilas desechables' },
  { Icon: Smartphone, titulo: 'Rexton App', descripcion: 'Ajustes en tu móvil' },
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
