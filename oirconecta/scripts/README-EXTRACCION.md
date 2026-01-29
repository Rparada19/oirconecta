# 📊 Extracción de Datos de Directorios Oficiales

Este script permite extraer automáticamente los datos de profesionales auditivos de los directorios oficiales de las asociaciones colombianas.

## 🎯 Directorios a Extraer

1. **ASOAUDIO** - Audiólogos
   - URL: https://asoaudio.org.co/directorio/
   - Especialidad: Audiólogos

2. **ACORL** - Otorrinolaringólogos
   - URL: https://acorl.org.co/directorio-otorrino
   - Especialidad: Otorrinolaringólogos

3. **ACON** - Otólogos
   - URL: https://www.acon.com.co/directorio-de-especialistas/
   - Especialidad: Otólogos

## 🚀 Instalación y Uso

### 1. Instalar Dependencias

```bash
cd oirconecta/scripts
npm install
```

### 2. Ejecutar Extracción

```bash
# Extraer datos de todos los directorios
npm run extract

# O ejecutar directamente
node extractData.js
```

### 3. Procesar Datos

```bash
# Procesar y limpiar los datos extraídos
node processData.js
```

## 📁 Archivos Generados

- `extracted_data.json` - Datos extraídos sin procesar
- `extracted_data.js` - Datos en formato JavaScript
- `processed_data.json` - Datos procesados y limpios
- `processed_data.js` - Datos procesados en formato JavaScript

## 🔧 Configuración

### Ajustar Selectores CSS

Si los sitios web cambian su estructura, puedes modificar los selectores en `extractData.js`:

```javascript
// Buscar elementos que contengan información de profesionales
const cards = document.querySelectorAll('.professional-card, .member-card, .directorio-item, [class*="card"], [class*="member"]');
```

### Personalizar Campos

Puedes modificar los campos extraídos en cada función de extracción:

```javascript
const nombre = card.querySelector('h3, h4, .nombre, .name, [class*="nombre"], [class*="name"]')?.textContent?.trim();
const ciudad = card.querySelector('.ciudad, .city, [class*="ciudad"], [class*="city"]')?.textContent?.trim();
```

## 📊 Estructura de Datos

Cada profesional extraído tiene la siguiente estructura:

```javascript
{
  id: 'aud_001',
  nombre: 'Dr. Juan Pérez',
  especialidad: 'Audiólogo',
  titulo: 'MSc. Audiología',
  registro: 'AUD-001',
  ciudad: 'Bogotá',
  departamento: 'Cundinamarca',
  direccion: 'Calle 123 #45-67',
  telefono: '321 960 0000',
  celular: '300 123 4567',
  email: 'juan.perez@email.com',
  sitioWeb: 'https://juan-perez.com',
  horarios: 'Lunes a Viernes 8:00 AM - 6:00 PM',
  servicios: ['Evaluación auditiva', 'Adaptación de audífonos'],
  marcas: ['Widex', 'Oticon', 'Starkey'],
  certificaciones: ['Certificación Internacional ASOAUDIO'],
  experiencia: '15 años de experiencia',
  idiomas: ['Español', 'Inglés'],
  redes: {
    facebook: '',
    instagram: '',
    linkedin: '',
    twitter: ''
  },
  foto: 'https://images.unsplash.com/photo-...',
  resena: 'Especialista en audiología...',
  calificacion: 4.8,
  reseñas: [],
  agenda: [
    { dia: 'Lunes', horas: ['09:00', '10:00', '11:00'] }
  ],
  disponible: true,
  fuente: 'ASOAUDIO',
  fechaActualizacion: '2024-01-15T10:30:00.000Z'
}
```

## ⚠️ Consideraciones Importantes

### Respeto a los Sitios Web

- El script incluye delays para no sobrecargar los servidores
- Usa un user agent realista para evitar detección
- Respeta los términos de uso de cada sitio

### Limitaciones

- Los sitios pueden cambiar su estructura HTML
- Algunos datos pueden no estar disponibles públicamente
- La extracción depende de la conectividad a internet

### Actualización Manual

Si la extracción automática falla, puedes:

1. Visitar manualmente cada directorio
2. Copiar los datos relevantes
3. Agregarlos al archivo `database.js` en el formato correcto

## 🔄 Actualización de la Base de Datos

Para actualizar la base de datos principal:

1. Ejecutar la extracción
2. Revisar los datos procesados
3. Copiar los datos relevantes a `src/data/database.js`
4. Verificar que no haya duplicados

## 📞 Soporte

Si encuentras problemas con la extracción:

1. Verificar que los sitios web estén accesibles
2. Revisar si cambiaron los selectores CSS
3. Ajustar los timeouts si es necesario
4. Verificar la conectividad a internet

## 📝 Notas Legales

- Este script es para uso educativo y de desarrollo
- Respeta los derechos de autor y términos de uso
- Los datos extraídos deben usarse de manera responsable
- Considera contactar a las asociaciones para obtener datos oficiales 