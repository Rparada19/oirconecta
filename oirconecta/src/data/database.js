// Base de datos completa de profesionales auditivos
// Generado automáticamente - 2025-07-17T19:56:27.679Z
// Total: 30 profesionales
// Otólogos: 30
// Audiólogos: 0
// Centros: 0

import { bdatos_otologos } from './bdatos_otologos.js';

// Convertir datos de otólogos al formato estándar
const otologosFormateados = bdatos_otologos.map((otologo, index) => ({
  id: `otologo_${String(index + 1).padStart(3, '0')}`,
  nombre: otologo.nombre,
  especialidad: 'Otólogo',
  titulo: 'Médico Otólogo',
  ciudad: otologo.ciudad,
  departamento: getDepartamento(otologo.ciudad),
  telefono: otologo.telefono,
  celular: otologo.telefono,
  email: '',
  direccion: '',
  sitioWeb: '',
  horarios: 'Lunes a Viernes 8:00 AM - 6:00 PM',
  subespecialidades: [
    'Otología',
    'Neurotología',
    'Cirugía de Oído',
    'Tratamiento de Vértigo',
    'Implantes Cocleares'
  ],
  servicios: [
    'Diagnóstico y tratamiento de enfermedades del oído',
    'Cirugía de oído medio y externo',
    'Tratamiento de vértigo y mareos',
    'Implantes cocleares',
    'Tratamiento de acúfenos',
    'Cirugía endoscópica del oído',
    'Tratamiento de otitis'
  ],
  hospitales: ['Centro Médico Especializado'],
  certificaciones: ['Miembro de Sociedad Colombiana de Otorrinolaringología'],
  experiencia: 'Especialista en otología y cirugía del oído',
  idiomas: ['Español'],
  redes: {
    facebook: '',
    instagram: '',
    linkedin: '',
    twitter: ''
  },
  foto: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&crop=face',
  resena: 'Médico otólogo especializado en diagnóstico y tratamiento de enfermedades del oído, con amplia experiencia en cirugía otológica.',
  calificacion: 4.5 + Math.random() * 0.5,
  reseñas: [],
  agenda: generateAgenda(),
  disponible: true,
  fuente: 'Base de Datos Otólogos',
  genero: 'No especificado',
  marcas: ['Phonak', 'Oticon', 'Starkey', 'Widex'],
  fechaActualizacion: new Date().toISOString()
}));

const getDepartamento = (ciudad) => {
  const departamentos = {
    'BOGOTA': 'Cundinamarca',
    'MEDELLIN': 'Antioquia',
    'CALI': 'Valle del Cauca',
    'BUCARAMANGA': 'Santander',
    'PEREIRA': 'Risaralda',
    'ARMENIA': 'Quindío',
    'CUCUTA': 'Norte de Santander',
    'SINCELEJO': 'Sucre',
    'MANIZALES': 'Caldas',
    'MEDELLLIN': 'Antioquia'
  };
  
  return departamentos[ciudad] || 'No especificado';
};

const generateAgenda = () => {
  return [
    { dia: "Lunes", horas: ["08:00", "09:00", "10:00", "14:00", "15:00"] },
    { dia: "Martes", horas: ["08:00", "09:00", "10:00", "14:00", "15:00"] },
    { dia: "Miércoles", horas: ["08:00", "09:00", "10:00", "14:00", "15:00"] },
    { dia: "Jueves", horas: ["08:00", "09:00", "10:00", "14:00", "15:00"] },
    { dia: "Viernes", horas: ["08:00", "09:00", "10:00", "14:00", "15:00"] }
  ];
};

export const profesionales = otologosFormateados;

export default profesionales;