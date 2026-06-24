import React from 'react';
import { BatteryChargingFull, Bluetooth, Hearing, Psychology } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'Phonak',
  slug: 'phonak',
  logo: '/logos/marcas/Phonak-logo.svg.png',
  eslogan: 'Roger™ · AutoSense',
  descripcion: 'Soluciones auditivas suizas con conectividad universal y tecnología Roger™ para entornos exigentes. Pioneros en innovación auditiva desde 1947.',
  color: '#008C45',
  stats: [{ value: '4.6', label: 'Rating' }, { value: '04', label: 'Modelos' }, { value: '24h', label: 'Batería' }, { value: 'Roger™', label: 'Tecnología' }],
};

const productos = [
  { nombre: 'Audéo Lumity', categoria: 'RIC', descripcion: 'AutoSense OS™ 5.0 con SmartSpeech™', caracteristicas: ['AutoSense 5.0', 'SmartSpeech', 'Bluetooth universal', 'Recargable'], destacado: true },
  { nombre: 'Naída Lumity', categoria: 'BTE', descripcion: 'Para pérdidas severas a profundas', caracteristicas: ['Potencia máxima', 'Roger compatible', 'IP68', 'Streaming'], destacado: false },
  { nombre: 'Audéo Sphere', categoria: 'RIC', descripcion: 'Primer audífono con IA dedicada al habla', caracteristicas: ['IA en chip dedicado', 'Reducción de ruido', 'Recargable', 'Bluetooth LE'], destacado: false },
  { nombre: 'Slim', categoria: 'RIC', descripcion: 'Diseño moderno y discreto', caracteristicas: ['Diseño slim', 'Recargable', 'Bluetooth', 'IP68'], destacado: false },
];

const tecnologias = [
  { Icon: Hearing, titulo: 'AutoSense OS™', descripcion: 'Reconoce entornos en tiempo real' },
  { Icon: Bluetooth, titulo: 'Bluetooth universal', descripcion: 'Streaming desde cualquier dispositivo' },
  { Icon: BatteryChargingFull, titulo: 'Recargable', descripcion: 'Carga rápida toda la jornada' },
  { Icon: Psychology, titulo: 'Roger™', descripcion: 'Micrófonos para entornos ruidosos' },
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
