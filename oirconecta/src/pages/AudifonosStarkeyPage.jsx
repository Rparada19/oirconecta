import React from 'react';
import { BatteryChargingFull, Hearing, Psychology, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'Starkey',
  slug: 'starkey',
  logo: '/logos/marcas/Starkey-logo.png',
  eslogan: 'IA en salud auditiva',
  descripcion: 'Audífonos estadounidenses con inteligencia artificial integrada que monitorean actividad física, detectan caídas y traducen idiomas. Pioneros en hearables.',
  color: '#F0B400',
  stats: [{ value: '4.8', label: 'Rating' }, { value: '04', label: 'Modelos' }, { value: '24h', label: 'Batería' }, { value: 'IA', label: 'Inteligencia' }],
};

const productos = [
  { nombre: 'Genesis AI', categoria: 'RIC', descripcion: 'Procesador Neuro de nueva generación', caracteristicas: ['Procesador Neuro', 'Edge Mode+', 'Recargable', 'Salud y bienestar'], destacado: true },
  { nombre: 'Evolv AI', categoria: 'RIC', descripcion: 'Sonido más natural con Edge Mode', caracteristicas: ['Edge Mode', 'Salud auditiva', 'Recargable', 'App Thrive'], destacado: false },
  { nombre: 'Custom', categoria: 'ITC', descripcion: 'Hecho a medida para tu oído', caracteristicas: ['Custom-made', 'Salud y traducción', 'App Thrive', 'Discreto'], destacado: false },
  { nombre: 'Picasso', categoria: 'CIC', descripcion: 'Casi invisible con IA', caracteristicas: ['Discretísimo', 'Procesador AI', 'Conectividad', 'Custom-made'], destacado: false },
];

const tecnologias = [
  { Icon: Psychology, titulo: 'Procesador Neuro', descripcion: 'Reproduce procesos del cerebro' },
  { Icon: Hearing, titulo: 'Edge Mode+', descripcion: 'Optimización en entornos difíciles' },
  { Icon: Smartphone, titulo: 'My Starkey', descripcion: 'Salud, ejercicio y traducción' },
  { Icon: BatteryChargingFull, titulo: 'Recargable', descripcion: 'Carga rápida 7 min = 3.5h' },
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
