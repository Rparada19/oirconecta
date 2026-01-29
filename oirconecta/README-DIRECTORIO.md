# 📋 Directorio de Profesionales - OirConecta

## 🎯 Descripción General

Sistema completo de directorio de profesionales especializados en audición, otorrinolaringología y otología en Colombia. Desarrollado con React, optimizado para SEO y escalable.

## 🏗️ Estructura del Sistema

### 📁 Organización de Archivos

```
src/
├── data/
│   ├── profesionales.js          # Base de datos principal
│   ├── acon.json                 # Datos de ACON (otólogos)
│   ├── acorl.json                # Datos de ACORL (otorrinolaringólogos)
│   ├── asoaudio.json             # Datos de ASOAUDIO (audiólogos)
│   └── profesionales.json        # Archivo combinado
├── components/
│   ├── ProfessionalCard.jsx      # Tarjeta de profesional
│   ├── ProfessionalsDirectory.jsx # Listado con filtros
│   └── ProfessionalProfile.jsx   # Perfil individual
├── pages/
│   ├── AudiologosPage.jsx        # Página de audiólogos
│   ├── OtorrinolaringologosPage.jsx # Página de otorrinolaringólogos
│   ├── OtologosPage.jsx          # Página de otólogos
│   └── ProfessionalProfilePage.jsx # Página de perfil individual
└── App.jsx                       # Rutas principales
```

## 🚀 Características Implementadas

### ✅ Funcionalidades Principales

1. **Listado de Profesionales**
   - Filtros por especialidad, ciudad y búsqueda
   - Ordenamiento por nombre, calificación y ciudad
   - Estadísticas en tiempo real
   - Diseño responsive

2. **Perfil Individual**
   - Información completa del profesional
   - Sistema de agendamiento de citas
   - Formulario de contacto
   - Sección de marcas con las que trabaja
   - Horarios de atención
   - Calificaciones y reseñas

3. **SEO Optimizado**
   - Meta tags dinámicos
   - URLs amigables
   - Schema.org markup
   - Estructura semántica H1, H2, H3
   - Open Graph tags

4. **Diseño y UX**
   - Manual de marca OirConecta (colores verdes)
   - Fotos de muestra según género
   - Iconos intuitivos
   - Animaciones suaves
   - Diseño mobile-first

## 📊 Base de Datos

### Estructura de un Profesional

```javascript
{
  id: "acon_001",
  nombre: "ANA MARIA OTOYA TONO",
  especialidad: "Otólogo",
  titulo: "MD. Otología",
  ciudad: "Bogotá",
  departamento: "Cundinamarca",
  direccion: "Calle 93b # 13-92, Centro Profesional",
  telefono: "3204549290",
  celular: "3204549290",
  email: "ana.otoya@ejemplo.com",
  sitioWeb: "",
  horarios: "Lunes a Viernes 8:00 AM - 5:00 PM",
  subespecialidades: ["Otología", "Neurotología", "Implantes Cocleares"],
  servicios: ["Consulta médica", "Cirugía otológica", "Implantes cocleares"],
  hospitales: ["Hospital General", "Clínica Especializada"],
  certificaciones: ["Miembro ACON"],
  experiencia: "Especialista en otología y neurotología con más de 10 años de experiencia",
  idiomas: ["Español"],
  redes: { facebook: "", instagram: "", linkedin: "", twitter: "" },
  foto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
  resena: "Otólogo especializado en diagnóstico y tratamiento de trastornos del oído y la audición.",
  calificacion: 4.8,
  reseñas: [],
  agenda: [
    { dia: "Lunes", horas: ["08:00", "09:00", "10:00", "14:00", "15:00"] },
    // ... más días
  ],
  disponible: true,
  fuente: "ACON",
  genero: "femenino",
  marcas: ["Cochlear", "Med-El", "Advanced Bionics"],
  fechaActualizacion: "2024-01-15"
}
```

### Fuentes de Datos

- **ACON**: Asociación Colombiana de Otología y Neurotología (Otólogos)
- **ACORL**: Asociación Colombiana de Otorrinolaringología (Otorrinolaringólogos)
- **ASOAUDIO**: Asociación Colombiana de Audiología (Audiólogos)

## 🔗 Rutas del Sistema

### URLs Principales

```
/profesionales                    # Directorio general
/profesionales/audiologos         # Solo audiólogos
/profesionales/otorrinolaringologos # Solo otorrinolaringólogos
/profesionales/otologos           # Solo otólogos
/profesional/:id/:slug            # Perfil individual
```

### Ejemplo de URL de Perfil

```
/profesional/acon_001/ana-maria-otoya-tono-otologo-bogota
```

## 🛠️ Cómo Agregar Nuevos Profesionales

### 1. Agregar a la Base de Datos

```javascript
// En src/data/profesionales.js
export const profesionales = [
  // ... profesionales existentes
  {
    id: "nuevo_001",
    nombre: "NUEVO PROFESIONAL",
    especialidad: "Audiólogo", // o "Otorrinolaringólogo" o "Otólogo"
    // ... resto de campos
  }
];
```

### 2. Actualizar Estadísticas

Las estadísticas se calculan automáticamente con la función `getEstadisticas()`.

### 3. Verificar SEO

- Las páginas incluyen meta tags automáticos
- Los perfiles individuales tienen Schema.org markup
- URLs se generan automáticamente

## 📱 Responsive Design

El sistema está optimizado para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Pantallas grandes (1280px+)

## 🎨 Manual de Marca

### Colores Principales
- **Verde Principal**: `#16a34a` (green-600)
- **Verde Claro**: `#22c55e` (green-500)
- **Verde Oscuro**: `#15803d` (green-700)
- **Fondo Verde**: `#f0fdf4` (green-50)

### Tipografía
- **Títulos**: Font-bold, text-gray-900
- **Subtítulos**: Font-semibold, text-green-600
- **Texto**: Text-gray-700
- **Texto secundario**: Text-gray-600

## 🔍 SEO y Indexación

### Meta Tags Automáticos
- Títulos dinámicos por página
- Descripciones optimizadas
- Keywords relevantes
- Open Graph tags
- Canonical URLs

### Schema.org Markup
- Physician schema para profesionales
- MedicalProcedure para servicios
- Hospital schema para centros médicos
- PostalAddress para ubicaciones

### Estructura Semántica
- H1: Título principal de la página
- H2: Secciones principales
- H3: Subsecciones
- Alt text en imágenes
- Enlaces descriptivos

## 🚀 Cómo Ejecutar

### Instalación
```bash
npm install
```

### Dependencias Principales
```bash
npm install react-icons react-helmet
```

### Ejecutar en Desarrollo
```bash
npm run dev
```

### Construir para Producción
```bash
npm run build
```

## 📈 Escalabilidad

### Para Agregar Nuevas Especialidades

1. **Actualizar el mapeo de especialidades** en `ProfessionalsDirectory.jsx`
2. **Crear nueva página** en `pages/`
3. **Agregar ruta** en `App.jsx`
4. **Actualizar filtros** en el componente de directorio

### Para Agregar Nuevas Fuentes

1. **Crear archivo JSON** en `data/`
2. **Importar en profesionales.js**
3. **Actualizar función de estadísticas**

## 🔧 Mantenimiento

### Actualización de Datos
- Los datos se pueden actualizar editando `profesionales.js`
- Cada profesional tiene `fechaActualizacion`
- Las estadísticas se recalculan automáticamente

### Monitoreo
- Verificar que las URLs funcionen correctamente
- Revisar que las imágenes se carguen
- Validar que los formularios funcionen
- Comprobar SEO con herramientas como Google Search Console

## 📞 Soporte

Para dudas o problemas:
1. Revisar este README
2. Verificar la estructura de datos
3. Comprobar las rutas en `App.jsx`
4. Validar que las dependencias estén instaladas

---

**Desarrollado para OirConecta** 🎧  
*Conectando pacientes con especialistas auditivos en Colombia* 