import React from 'react';
import { BatteryChargingFull, Bluetooth, Hearing, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'Resound',
  slug: 'resound',
  logo: '/logos/marcas/Resound-logo.png',
  eslogan: 'Smart Hearing',
  descripcion: 'Tecnología danesa con apps avanzadas para control fino del listening y direccionalidad inteligente. Pioneros en audífonos Made for iPhone.',
  color: '#C9342B',
  stats: [{ value: '4.5', label: 'Rating' }, { value: '04', label: 'Modelos' }, { value: '30h', label: 'Batería' }, { value: 'MFi', label: 'Compatible' }],
};

const productos = [
  { nombre: 'OMNIA', categoria: 'RIC', descripcion: 'Conversaciones más claras en cualquier entorno', caracteristicas: ['Smart Hearing', 'Made for iPhone', 'Recargable', 'App ReSound Smart 3D'], destacado: true },
  { nombre: 'ONE', categoria: 'RIC', descripcion: 'Sonido individualizado con M&RIE', caracteristicas: ['Mic & Receiver In Ear', 'Direccionalidad', 'Recargable', 'Bluetooth'], destacado: false },
  { nombre: 'Nexia', categoria: 'RIC', descripcion: 'Bluetooth LE Audio para próxima generación', caracteristicas: ['Bluetooth LE Audio', 'Auracast', 'Recargable', 'App'], destacado: false },
  { nombre: 'Key', categoria: 'BTE', descripcion: 'Solución accesible para todos los grados', caracteristicas: ['Conectividad básica', 'Robusto', 'Larga vida útil', 'Compatible apps'], destacado: false },
];

const tecnologias = [
  { Icon: Hearing, titulo: 'Smart Hearing', descripcion: 'Direccionalidad inteligente' },
  { Icon: Bluetooth, titulo: 'Made for iPhone', descripcion: 'Streaming directo MFi' },
  { Icon: Smartphone, titulo: 'Smart 3D App', descripcion: 'Control fino del audio' },
  { Icon: BatteryChargingFull, titulo: 'Recargable', descripcion: 'Carga inalámbrica disponible' },
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
