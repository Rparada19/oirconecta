import React from 'react';
import { BatteryChargingFull, Bluetooth, Hearing, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'Widex',
  slug: 'widex',
  logo: '/logos/marcas/Widex-logo.jpg',
  eslogan: 'Tecnología PureSound™',
  descripcion: 'Su pérdida auditiva es tan única como su huella digital. Con la ayuda de un profesional de la audición, puede encontrar un audífono que se adapte a su audición, a su vida y a su estilo.',
  color: '#1A1A1A',
  stats: [{ value: '4.8', label: 'Rating' }, { value: '04', label: 'Modelos' }, { value: '30h', label: 'Batería' }, { value: 'BT 5.0', label: 'Conectividad' }],
};

const productos = [
  { nombre: 'Moment Sheer™', categoria: 'RIC', descripcion: 'Sonido natural con tecnología PureSound™', caracteristicas: ['PureSound™ Technology', 'Bluetooth 5.0', 'Batería recargable 30h', 'App móvil inteligente'], destacado: true },
  { nombre: 'Evoke™', categoria: 'BTE', descripcion: 'Audífono inteligente con aprendizaje automático', caracteristicas: ['SoundSense Learn', 'Conectividad universal', 'Batería de larga duración', 'Control por voz'], destacado: false },
  { nombre: 'SmartRIC™', categoria: 'RIC', descripcion: 'Diseño discreto con máxima conectividad', caracteristicas: ['Diseño ultra-discreto', 'Conectividad avanzada', 'Audio streaming directo', 'Resistente al agua'], destacado: false },
  { nombre: 'Moment™', categoria: 'RIC', descripcion: 'Audífono premium con tecnología avanzada', caracteristicas: ['PureSound™ Technology', 'Conectividad Bluetooth', 'Batería recargable 24h', 'Control por app'], destacado: false },
];

const tecnologias = [
  { Icon: Hearing, titulo: 'PureSound™', descripcion: 'Tecnología de sonido natural sin distorsión' },
  { Icon: Bluetooth, titulo: 'Conectividad total', descripcion: 'Bluetooth 5.0 y streaming directo' },
  { Icon: BatteryChargingFull, titulo: 'Batería inteligente', descripcion: 'Hasta 30 horas de uso continuo' },
  { Icon: Smartphone, titulo: 'App avanzada', descripcion: 'Control personalizado desde tu móvil' },
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
