import React from 'react';
import { Bluetooth, Hearing, Psychology, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'MED-EL',
  slug: 'medel',
  logo: '/logos/marcas/MedEl-logo.png',
  eslogan: 'SYNCHRONY · SONNET · RONDO',
  descripcion: 'Empresa austriaca pionera en flexibilidad quirúrgica y preservación de audición residual. Implantes SYNCHRONY y procesadores RONDO 3 (off-the-ear) y SONNET 2.',
  color: '#C9342B',
  stats: [{ value: '4.7', label: 'Rating' }, { value: '03', label: 'Familias' }, { value: 'AT', label: 'Origen' }, { value: 'EAS', label: 'Conservación' }],
};

const productos = [
  { nombre: 'SYNCHRONY 2', categoria: 'Implante interno', descripcion: 'Compatible con resonancia magnética 3T sin necesidad de cirugía adicional', caracteristicas: ['Compatible 3T MRI', 'Diseño anatómico', 'Larga durabilidad', 'EAS (audición eléctrica + acústica)'], destacado: true },
  { nombre: 'SONNET 2', categoria: 'Procesador externo', descripcion: 'Procesador detrás de la oreja con conectividad', caracteristicas: ['Resistente al agua', 'Conectividad inalámbrica', 'Personalización', 'Audífono integrado opcional'], destacado: false },
  { nombre: 'RONDO 3', categoria: 'Off-the-ear', descripcion: 'Procesador single-unit recargable', caracteristicas: ['Diseño off-the-ear único', 'Recargable inalámbrico', 'Discreto', 'Compatible app AudioKey 2'], destacado: false },
];

const tecnologias = [
  { Icon: Psychology, titulo: 'EAS', descripcion: 'Combinación eléctrica + acústica' },
  { Icon: Hearing, titulo: 'TwinPlay', descripcion: 'Dos programas simultáneos' },
  { Icon: Bluetooth, titulo: 'AudioStream', descripcion: 'Streaming Bluetooth' },
  { Icon: Smartphone, titulo: 'AudioKey 2', descripcion: 'App de control y soporte' },
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
