# OirConecta - Plataforma de Especialistas Auditivos

## 📋 Descripción

OirConecta es una plataforma web completa que conecta pacientes con especialistas auditivos en Colombia. El proyecto incluye un directorio de profesionales, sistema de agendamiento, tienda de productos auditivos y toda la funcionalidad necesaria para una plataforma tipo Doctoralia.

## 🚀 Características Principales

### 🏠 Página Principal
- **Hero Section** con llamada a la acción
- **Motor de búsqueda** de especialistas
- **Sección de características** destacadas
- **Servicios** ofrecidos
- **Profesionales destacados**
- **Testimonios** de pacientes
- **Sección CTA** con información de contacto

### 👥 Directorio de Profesionales
- **Filtros avanzados** por especialidad, ciudad y fuente
- **Tarjetas de profesionales** con información completa
- **Perfiles individuales** con toda la información del especialista
- **Sistema de agendamiento** simulado
- **Formulario de contacto** directo
- **Información de marcas** que maneja cada profesional

### 📄 Páginas Específicas
- **Nosotros** - Información de la empresa
- **Servicios** - Catálogo de servicios auditivos
- **Audífonos** - Información sobre marcas y tipos
- **Implantes** - Soluciones avanzadas para pérdida auditiva
- **Contacto** - Formulario de contacto y información
- **Ecommerce** - Tienda de productos auditivos

### 🎯 Páginas por Especialidad
- **Audiólogos** - Especialistas en evaluación y rehabilitación auditiva
- **Otorrinolaringólogos** - Médicos especialistas en oído, nariz y garganta
- **Otólogos** - Especialistas en enfermedades del oído

## 🛠️ Tecnologías Utilizadas

- **React 19** - Framework principal
- **Material-UI (MUI)** - Componentes de interfaz
- **React Router** - Navegación entre páginas
- **React Helmet** - Gestión de meta tags para SEO
- **Vite** - Herramienta de construcción
- **ESLint** - Linting de código

## 📊 Base de Datos

### Fuentes de Datos
- **ASOAUDIO** - Asociación Colombiana de Audiología
- **ACORL** - Asociación Colombiana de Otorrinolaringología
- **ACON** - Asociación Colombiana de Otología

### Estructura de Datos
```javascript
{
  id: "único",
  nombre: "Dr. Juan Pérez",
  especialidad: "audiólogo|otorrinolaringólogo|otólogo",
  ciudad: "Bogotá|Medellín|Cali",
  telefono: "+57 300 123 4567",
  email: "juan.perez@email.com",
  direccion: "Calle 123 #45-67",
  experiencia: "15 años",
  educacion: "Universidad Nacional",
  certificaciones: ["Certificación 1", "Certificación 2"],
  marcas: ["Phonak", "Oticon", "Starkey"],
  servicios: ["Evaluación auditiva", "Audiometría"],
  horarios: "Lunes a Viernes 8:00 AM - 6:00 PM",
  fuente: "ASOAUDIO|ACORL|ACON",
  foto: "url_foto",
  genero: "masculino|femenino"
}
```

## 🎨 Diseño y UX

### Paleta de Colores
- **Primario**: Verde (#085946) - Confianza y salud
- **Secundario**: Azul (#272F50) - Profesionalismo
- **Acentos**: Verde claro (#A1AFB5) - Elementos secundarios

### Características de Diseño
- **Responsive** - Adaptable a todos los dispositivos
- **Accesible** - Cumple estándares de accesibilidad
- **SEO Optimizado** - Meta tags y estructura semántica
- **UX Moderna** - Interfaz intuitiva y fácil de usar

## 📱 Funcionalidades

### Sistema de Búsqueda
- Filtros por especialidad
- Filtros por ciudad
- Búsqueda por nombre
- Ordenamiento por relevancia

### Perfiles de Profesionales
- Información completa del especialista
- Sistema de agendamiento
- Formulario de contacto
- Galería de marcas
- Información de servicios

### Sistema de Agendamiento
- Selección de fecha y hora
- Tipos de consulta
- Confirmación de cita
- Recordatorios (simulado)

### Tienda Ecommerce
- Catálogo de productos
- Filtros por categoría
- Sistema de carrito
- Wishlist
- Información de marcas

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone [url-del-repositorio]
cd oirconecta

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

### Variables de Entorno
```env
VITE_APP_TITLE=OirConecta
VITE_APP_DESCRIPTION=Conectamos pacientes con especialistas auditivos
```

## 📁 Estructura del Proyecto

```
oirconecta/
├── public/
│   ├── logo.png
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   ├── SearchEngine.jsx
│   │   ├── FeaturesSection.jsx
│   │   ├── ServicesSection.jsx
│   │   ├── FeaturedProfessionals.jsx
│   │   ├── TestimonialsSection.jsx
│   │   ├── CTASection.jsx
│   │   ├── Footer.jsx
│   │   ├── ProfessionalCard.jsx
│   │   └── ProfessionalsDirectory.jsx
│   ├── pages/
│   │   ├── NosotrosPage.jsx
│   │   ├── ServiciosPage.jsx
│   │   ├── AudifonosPage.jsx
│   │   ├── ImplantesPage.jsx
│   │   ├── ContactoPage.jsx
│   │   ├── EcommercePage.jsx
│   │   ├── AudiologosPage.jsx
│   │   ├── OtorrinolaringologosPage.jsx
│   │   ├── OtologosPage.jsx
│   │   ├── ProfessionalProfilePage.jsx
│   │   └── ProfessionalsDirectory.jsx
│   ├── data/
│   │   ├── database.js
│   │   └── profesionales.js
│   ├── App.jsx
│   ├── main.jsx
│   ├── theme.js
│   └── index.css
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Ejecutar en modo desarrollo
npm run build        # Construir para producción
npm run preview      # Previsualizar build de producción
npm run lint         # Ejecutar ESLint
```

## 📈 SEO y Rendimiento

### Meta Tags Optimizados
- Títulos únicos para cada página
- Descripciones específicas
- Keywords relevantes
- URLs canónicas

### Estructura Semántica
- Uso correcto de etiquetas HTML5
- Jerarquía de encabezados
- Datos estructurados
- Imágenes con alt text

### Rendimiento
- Lazy loading de componentes
- Optimización de imágenes
- Bundle splitting
- Caching eficiente

## 🔄 Mantenimiento y Escalabilidad

### Agregar Nuevos Profesionales
1. Editar `src/data/profesionales.js`
2. Agregar objeto con estructura correcta
3. Asignar ID único
4. Incluir foto según género

### Agregar Nuevas Especialidades
1. Crear nueva página en `src/pages/`
2. Agregar ruta en `App.jsx`
3. Actualizar filtros en `ProfessionalsDirectory.jsx`
4. Agregar datos en `profesionales.js`

### Personalizar Diseño
1. Editar `src/theme.js` para colores
2. Modificar componentes en `src/components/`
3. Actualizar estilos CSS en `src/index.css`

## 📊 Estadísticas del Proyecto

- **Total de Profesionales**: 40+
- **Especialidades**: 3 (Audiólogos, Otorrinolaringólogos, Otólogos)
- **Ciudades**: 3 (Bogotá, Medellín, Cali)
- **Páginas**: 12+
- **Componentes**: 15+
- **Marcas de Audífonos**: 6 (Phonak, Oticon, Starkey, Widex, ReSound, Signia)

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Email**: info@oirconecta.com
- **Teléfono**: +57 300 123 4567
- **Sitio Web**: https://oirconecta.com

## 🙏 Agradecimientos

- **ASOAUDIO** - Por proporcionar datos de audiólogos
- **ACORL** - Por proporcionar datos de otorrinolaringólogos  
- **ACON** - Por proporcionar datos de otólogos
- **Material-UI** - Por los componentes de interfaz
- **React Team** - Por el framework increíble

---

**OirConecta** - Conectando pacientes con los mejores especialistas auditivos de Colombia. 🦻✨
