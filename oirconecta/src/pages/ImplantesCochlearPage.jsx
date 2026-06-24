import React from 'react';
import { BatteryChargingFull, Bluetooth, Hearing, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'Cochlear',
  slug: 'cochlear',
  logo: '/logos/marcas/Cochlear-logo.png',
  eslogan: 'Nucleus · Kanso · Baha',
  descripcion: 'Líder mundial en implantes cocleares con presencia en más de 180 países. Sistemas Nucleus para implante coclear y Baha para conducción ósea.',
  color: '#F0B400',
  stats: [{ value: '4.9', label: 'Rating' }, { value: '03', label: 'Familias' }, { value: '+180', label: 'Países' }, { value: 'Líder', label: 'Global' }],
};

const productos = [
  { nombre: 'Nucleus 8', categoria: 'Procesador externo', descripcion: 'El procesador coclear más avanzado', caracteristicas: ['Bluetooth LE Audio', 'Auracast', 'Conectividad iPhone/Android', 'Resistente al agua IP57'], destacado: true },
  { nombre: 'Kanso 2', categoria: 'Off-the-ear', descripcion: 'Procesador discreto fuera del oído', caracteristicas: ['Diseño off-the-ear', 'IP68', 'Recargable', 'Bluetooth'], destacado: false },
  { nombre: 'Baha 6 Max', categoria: 'Conducción ósea', descripcion: 'Para pérdida conductiva o única lateral', caracteristicas: ['Conducción ósea', 'Bluetooth', 'Recargable', 'App control'], destacado: false },
];

const tecnologias = [
  { Icon: Hearing, titulo: 'SmartSound iQ', descripcion: 'Procesamiento adaptativo en tiempo real' },
  { Icon: Bluetooth, titulo: 'Conectividad directa', descripcion: 'Streaming iPhone/Android sin accesorios' },
  { Icon: BatteryChargingFull, titulo: 'Recargable', descripcion: 'Toda la jornada con una sola carga' },
  { Icon: Smartphone, titulo: 'Nucleus Smart App', descripcion: 'Control completo desde tu móvil' },
];

export default function Page() {
  return (
    <BrandPageTemplate
      brand={BRAND}
      productos={productos}
      tecnologias={tecnologias}
      categoria="implantes"
      seoTitle={`Audífonos ${BRAND.nombre} en Colombia — OírConecta`}
      seoDescription={`Conoce los audífonos ${BRAND.nombre} disponibles en Colombia. ${BRAND.eslogan}.`}
      canonical={`https://oirconecta.com/implantes/${BRAND.slug}`}
    />
  );
}
