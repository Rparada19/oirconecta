import React from 'react';
import { Bluetooth, Hearing, Psychology, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'Oticon',
  slug: 'oticon',
  logo: '/logos/marcas/Oticon-logo.png.webp',
  eslogan: 'BrainHearing™',
  descripcion: 'La experiencia auditiva debe tener en cuenta cada necesidad única. Descubre una audición más natural y clara con audífonos inteligentes diseñados para trabajar con tu cerebro.',
  color: '#6E2585',
  stats: [{ value: '4.7', label: 'Rating' }, { value: '04', label: 'Modelos' }, { value: '28h', label: 'Batería' }, { value: 'IFTTT', label: 'Plataforma' }],
};

const productos = [
  { nombre: 'Real™', categoria: 'RIC', descripcion: 'Procesamiento del sonido por el cerebro', caracteristicas: ['BrainHearing™', 'MoreSound Intelligence™', 'Bluetooth Low Energy', 'Conectividad iPhone/Android'], destacado: true },
  { nombre: 'More™', categoria: 'RIC', descripcion: 'Audífono con inteligencia artificial', caracteristicas: ['Aprendizaje profundo', 'Conectividad total', 'Recargable', 'App móvil'], destacado: false },
  { nombre: 'Zircon', categoria: 'BTE', descripcion: 'Solución accesible y robusta', caracteristicas: ['Filtrado de ruido', 'IP68', 'Compatible con accesorios', 'Larga vida útil'], destacado: false },
  { nombre: 'Own™', categoria: 'ITC', descripcion: 'Personalizado con tu propio nombre', caracteristicas: ['Custom-made', 'Discreto', 'Adaptación profesional', 'Garantía Oticon'], destacado: false },
];

const tecnologias = [
  { Icon: Psychology, titulo: 'BrainHearing™', descripcion: 'Audífonos que trabajan con tu cerebro' },
  { Icon: Hearing, titulo: 'MoreSound™', descripcion: 'Sonido natural en 360°' },
  { Icon: Bluetooth, titulo: 'Conectividad', descripcion: 'Bluetooth LE y streaming' },
  { Icon: Smartphone, titulo: 'Oticon Companion', descripcion: 'Control desde la app' },
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
