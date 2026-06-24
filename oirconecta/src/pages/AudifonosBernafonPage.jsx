import React from 'react';
import { BatteryChargingFull, Bluetooth, Hearing, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'Bernafon',
  slug: 'bernafon',
  logo: '/logos/marcas/Bernafon-logo.png',
  eslogan: 'Sonido cristalino',
  descripcion: 'Marca suiza con series Alpha XT y procesamiento de canales abierto. Tradición de fabricación europea y precios competitivos.',
  color: '#C9342B',
  stats: [{ value: '4.5', label: 'Rating' }, { value: '04', label: 'Modelos' }, { value: '24h', label: 'Batería' }, { value: 'CH', label: 'Origen' }],
};

const productos = [
  { nombre: 'Alpha XT', categoria: 'RIC', descripcion: 'Procesamiento de canales abierto', caracteristicas: ['Open Sound Optimizer', 'Bluetooth', 'Recargable', 'App EasyControl'], destacado: true },
  { nombre: 'Encanta', categoria: 'BTE', descripcion: 'Audición clara y conectada', caracteristicas: ['Connect Bluetooth', 'IP68', 'Compatible accesorios', 'Discreto'], destacado: false },
  { nombre: 'Leox', categoria: 'ITC', descripcion: 'Custom-made para pérdidas leves a moderadas', caracteristicas: ['Custom-made', 'Discreto', 'Procesamiento avanzado', 'Adaptación'], destacado: false },
  { nombre: 'Acriva', categoria: 'RIC', descripcion: 'Tecnología accesible con buena calidad', caracteristicas: ['Procesamiento estándar', 'Conectividad', 'Larga vida', 'Robusto'], destacado: false },
];

const tecnologias = [
  { Icon: Hearing, titulo: 'Open Sound', descripcion: 'Sonido natural sin compresión' },
  { Icon: Bluetooth, titulo: 'Connect', descripcion: 'Streaming directo iPhone/Android' },
  { Icon: BatteryChargingFull, titulo: 'Recargable', descripcion: 'Una sola carga al día' },
  { Icon: Smartphone, titulo: 'EasyControl App', descripcion: 'Ajustes simples' },
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
