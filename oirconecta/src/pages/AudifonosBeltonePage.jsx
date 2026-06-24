import React from 'react';
import { BatteryChargingFull, Bluetooth, Hearing, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'Beltone',
  slug: 'beltone',
  logo: '/logos/marcas/Beltone-logo.png',
  eslogan: 'Atención y seguimiento',
  descripcion: 'Marca americana con canales propios en Colombia y enfoque en atención cercana. Tecnología compartida con ReSound y respaldo de GN Group.',
  color: '#2E7D32',
  stats: [{ value: '4.6', label: 'Rating' }, { value: '04', label: 'Modelos' }, { value: '30h', label: 'Batería' }, { value: 'MFi', label: 'Compatible' }],
};

const productos = [
  { nombre: 'Serene', categoria: 'RIC', descripcion: 'Conversaciones claras y conexión natural', caracteristicas: ['Direccionalidad', 'Recargable', 'Bluetooth', 'App HearMax'], destacado: true },
  { nombre: 'Imagine', categoria: 'RIC', descripcion: 'Sonido inmersivo y natural', caracteristicas: ['Made for iPhone', 'Smart 3D', 'Recargable', 'Conectividad'], destacado: false },
  { nombre: 'Achieve', categoria: 'BTE', descripcion: 'Solución robusta para distintos grados', caracteristicas: ['Filtrado de ruido', 'IP68', 'Larga vida', 'Compatible apps'], destacado: false },
  { nombre: 'Origin', categoria: 'ITC', descripcion: 'Hecho a la medida de tu oído', caracteristicas: ['Custom-made', 'Discreto', 'Adaptación profesional', 'Conectividad'], destacado: false },
];

const tecnologias = [
  { Icon: Hearing, titulo: 'Smart Hearing', descripcion: 'Procesamiento adaptativo' },
  { Icon: Smartphone, titulo: 'HearMax App', descripcion: 'Control y soporte remoto' },
  { Icon: Bluetooth, titulo: 'Made for iPhone', descripcion: 'Streaming directo' },
  { Icon: BatteryChargingFull, titulo: 'Recargable', descripcion: 'Toda la jornada' },
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
