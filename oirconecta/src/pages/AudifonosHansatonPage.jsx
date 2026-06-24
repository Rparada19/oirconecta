import React from 'react';
import { BatteryChargingFull, Bluetooth, Hearing, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'Hansaton',
  slug: 'hansaton',
  logo: '/logos/marcas/Hansaton-logo.png',
  eslogan: 'Diseño compacto',
  descripcion: 'Marca alemana del grupo Sonova con AQ sound y conectividad Bluetooth LE Audio. Diseño compacto y discreto.',
  color: '#003DA5',
  stats: [{ value: '4.5', label: 'Rating' }, { value: '04', label: 'Modelos' }, { value: '24h', label: 'Batería' }, { value: 'LE Audio', label: 'BT' }],
};

const productos = [
  { nombre: 'beat sound SHD', categoria: 'RIC', descripcion: 'Bluetooth LE Audio para próxima generación', caracteristicas: ['Bluetooth LE Audio', 'Auracast', 'Recargable', 'App'], destacado: true },
  { nombre: 'jam stream', categoria: 'RIC', descripcion: 'Streaming directo y discreto', caracteristicas: ['Streaming directo', 'Discreto', 'Conectividad', 'Recargable'], destacado: false },
  { nombre: 'AQ', categoria: 'BTE', descripcion: 'Sonido natural y robusto', caracteristicas: ['AQ sound', 'IP68', 'Larga vida', 'Conectividad'], destacado: false },
  { nombre: 'Jam X-Mini', categoria: 'CIC', descripcion: 'Compacto y casi invisible', caracteristicas: ['Custom-made', 'Discreto', 'Procesamiento avanzado', 'Adaptación'], destacado: false },
];

const tecnologias = [
  { Icon: Hearing, titulo: 'AQ sound', descripcion: 'Procesamiento adaptativo' },
  { Icon: Bluetooth, titulo: 'LE Audio', descripcion: 'Bluetooth de nueva generación' },
  { Icon: BatteryChargingFull, titulo: 'Recargable', descripcion: 'Carga inalámbrica disponible' },
  { Icon: Smartphone, titulo: 'HANSATON Stream App', descripcion: 'Control desde tu móvil' },
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
