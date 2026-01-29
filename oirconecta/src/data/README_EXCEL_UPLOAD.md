# 📊 GUÍA DE SUBIDA DE EXCEL - AUDIÓLOGAS

## 🎯 **DESCRIPCIÓN**
Esta funcionalidad permite cargar archivos Excel (.xlsx o .xls) con información de audiólogas para actualizar la base de datos de la plataforma OirConecta.

## 📍 **UBICACIÓN**
- **URL**: `http://localhost:5173/profesionales/audiologos`
- **Sección**: Entre el buscador y la lista de profesionales
- **Componente**: Excel Uploader Section

## 📋 **FORMATO REQUERIDO DEL EXCEL**

### **Estructura de Columnas**
| Columna | Nombre | Descripción | Obligatorio |
|---------|---------|-------------|-------------|
| A | Nombre | Nombre completo de la audióloga | ✅ **SÍ** |
| B | Profesión | Debe ser "Audióloga" | ✅ **SÍ** |
| C | Ciudad | Ciudad donde ejerce | ✅ **SÍ** |
| D | Teléfono | Número de contacto | ✅ **SÍ** |
| E | Email | Correo electrónico | ❌ No |
| F | Dirección | Dirección del consultorio | ❌ No |

### **Ejemplo de Datos**
```
Nombre,Profesión,Ciudad,Teléfono,Email,Dirección
María González,Audiológa,Bogotá,3001234567,maria@ejemplo.com,Calle 123 #45-67
Ana Rodríguez,Audiológa,Medellín,3002345678,ana@ejemplo.com,Carrera 78 #90-12
```

## 🚀 **CÓMO USAR**

### **1. Acceder a la Página**
- Navegar a: `http://localhost:5173/profesionales/audiologos`
- Desplazarse hacia abajo hasta ver la sección "Cargar Base de Datos de Audiólogas"

### **2. Preparar el Archivo Excel**
- **Formato**: .xlsx o .xls
- **Encabezados**: Primera fila debe contener los nombres de las columnas
- **Datos**: A partir de la segunda fila
- **Validaciones**: 
  - Mínimo 1 fila de datos
  - Columnas obligatorias deben tener contenido
  - Formato de teléfono: números y guiones permitidos

### **3. Subir el Archivo**
- Hacer clic en "Seleccionar Archivo Excel"
- Buscar y seleccionar el archivo .xlsx o .xls
- El archivo se procesará automáticamente
- Ver el estado del procesamiento en tiempo real

### **4. Verificar la Carga**
- Mensaje de confirmación: "✅ Archivo procesado exitosamente. X audiólogas cargadas."
- Los datos aparecerán en la lista de profesionales
- Se pueden filtrar y buscar normalmente

## 🛠️ **FUNCIONALIDADES DISPONIBLES**

### **📥 Subir Archivo Excel**
- **Botón**: "Seleccionar Archivo Excel"
- **Formatos aceptados**: .xlsx, .xls
- **Procesamiento automático**: Al seleccionar el archivo
- **Validación de datos**: Verificación de formato y contenido

### **📥 Descargar Plantilla**
- **Botón**: "Descargar Plantilla"
- **Archivo**: `plantilla_audiologas.xlsx`
- **Contenido**: Ejemplo de estructura y datos de muestra
- **Uso**: Como referencia para crear archivos propios

### **🗑️ Limpiar Base de Datos**
- **Botón**: "Limpiar Base de Datos"
- **Acción**: Elimina todas las audiólogas cargadas
- **Confirmación**: Diálogo de confirmación antes de ejecutar
- **Resultado**: Base de datos vacía, estado reset

## ⚠️ **VALIDACIONES Y ERRORES**

### **Errores Comunes**
1. **"El archivo Excel debe tener al menos una fila de encabezados y una fila de datos"**
   - Solución: Asegurar que el archivo tenga encabezados y al menos una fila de datos

2. **"El archivo debe contener columnas: Nombre, Profesión, Ciudad y Teléfono"**
   - Solución: Verificar que las columnas obligatorias estén presentes

3. **"No se encontraron datos válidos en el archivo"**
   - Solución: Revisar que las filas de datos no estén vacías

### **Validaciones Automáticas**
- ✅ Formato de archivo (.xlsx, .xls)
- ✅ Presencia de encabezados
- ✅ Columnas obligatorias
- ✅ Datos en filas
- ✅ Formato de datos

## 📊 **ESTADO Y MONITOREO**

### **Indicadores Visuales**
- **🔄 Procesando**: Archivo en proceso
- **✅ Exitoso**: Carga completada
- **⚠️ Advertencia**: Datos incompletos
- **❌ Error**: Problema en el procesamiento

### **Información de Estado**
- **Estado actual**: Mensaje descriptivo del estado
- **Última actualización**: Fecha y hora de la última modificación
- **Contador de profesionales**: Número de audiólogas cargadas

## 🔄 **FLUJO DE DATOS**

```
Archivo Excel → Procesamiento → Validación → Base de Datos → Interfaz
     ↓              ↓            ↓           ↓           ↓
  Selección    Lectura XLSX   Verificación  Estado    Lista de
  del archivo   Conversión    de formato    Local     Profesionales
```

## 🎨 **CARACTERÍSTICAS DE LA INTERFAZ**

### **Diseño Responsivo**
- **Desktop**: Layout completo con todos los elementos
- **Tablet**: Adaptación de espaciado y tamaños
- **Mobile**: Stack vertical de elementos

### **Estilos Visuales**
- **Colores**: Paleta verde de OirConecta (#085946)
- **Iconos**: FontAwesome para mejor UX
- **Animaciones**: Hover effects y transiciones suaves
- **Estados**: Indicadores visuales claros

## 🚨 **LIMITACIONES Y CONSIDERACIONES**

### **Técnicas**
- **Tamaño de archivo**: Limitado por memoria del navegador
- **Formato**: Solo Excel (.xlsx, .xls)
- **Columnas**: Máximo 6 columnas (A-F)
- **Datos**: Texto y números (no imágenes o fórmulas)

### **Funcionales**
- **Persistencia**: Los datos se guardan en localStorage
- **Sesión**: Los datos persisten entre recargas de página
- **Colaboración**: No hay sincronización en tiempo real
- **Backup**: No hay respaldo automático de datos cargados

## 🔮 **MEJORAS FUTURAS**

### **Funcionalidades Planificadas**
- [ ] Exportar datos a Excel
- [ ] Validación en tiempo real
- [ ] Historial de cargas
- [ ] Backup automático
- [ ] Sincronización con servidor
- [ ] Plantillas personalizables

### **Integraciones**
- [ ] API de Google Sheets
- [ ] Conexión con bases de datos externas
- [ ] Sistema de autenticación
- [ ] Roles y permisos

---

**Fecha de creación**: $(date)
**Versión**: 1.0.0
**Estado**: ✅ **FUNCIONAL**
**Responsable**: Sistema de desarrollo OirConecta 