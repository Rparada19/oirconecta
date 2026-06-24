import React from 'react';
import { Bluetooth, Hearing, Psychology, Smartphone } from '@mui/icons-material';
import BrandPageTemplate from '../components/editorial/BrandPageTemplate';

const BRAND = {
  nombre: 'Advanced Bionics',
  slug: 'advanced-bionics',
  logo: '/logos/marcas/AdvancedBionics-logo.png',
  eslogan: 'HiRes™ · Marvel CI',
  descripcion: 'Empresa estadounidense del grupo Sonova con tecnología HiRes™ y procesadores Marvel CI compartidos con la plataforma Phonak. Enfoque en claridad de habla.',
  color: '#003DA5',
  stats: [{ value: '4.8', label: 'Rating' }, { value: '03', label: 'Familias' }, { value: 'Marvel', label: 'Plataforma' }, { value: 'Sonova', label: 'Grupo' }],
};

const productos = [
  { nombre: 'HiRes Ultra 3D', categoria: 'Implante interno', descripcion: 'Compatible con resonancia magnética 3T', caracteristicas: ['Compatible 3T MRI', 'HiRes™ Fidelity 120', 'Bilateral hearing', 'Garantía 10 años'], destacado: true },
  { nombre: 'Naída CI M', categoria: 'Procesador externo', descripcion: 'Procesador Marvel para implante coclear', caracteristicas: ['Marvel Tech', 'Bluetooth universal', 'Roger compatible', 'Recargable'], destacado: false },
  { nombre: 'Sky CI M', categoria: 'Pediátrico', descripcion: 'Diseñado para niños y adolescentes', caracteristicas: ['Pediátrico', 'IP68', 'Conectividad escolar', 'Robusto'], destacado: false },
];

const tecnologias = [
  { Icon: Hearing, titulo: 'HiRes™', descripcion: 'Tecnología de procesamiento de alta resolución' },
  { Icon: Bluetooth, titulo: 'Marvel Tech', descripcion: 'Compatibilidad universal Bluetooth' },
  { Icon: Smartphone, titulo: 'AB Remote App', descripcion: 'Control completo desde móvil' },
  { Icon: Psychology, titulo: 'Roger compatible', descripcion: 'Para entornos ruidosos exigentes' },
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
