# 🗑️ Limpiar Todos los Datos de OirConecta

Hay **4 formas** de eliminar todos los datos ficticios:

## Opción 1: Script Automático (Más Rápido y Fácil)

1. Abre la aplicación en tu navegador
2. Presiona `F12` (o `Cmd+Option+I` en Mac) para abrir la consola
3. Copia y pega TODO el contenido del archivo `limpiar-todos-datos.js`
4. Presiona Enter
5. La página se recargará automáticamente con todos los datos eliminados

## Opción 2: Desde la Consola del Navegador (Manual)

1. Abre la aplicación en tu navegador
2. Presiona `F12` (o `Cmd+Option+I` en Mac) para abrir la consola
3. Copia y pega este código:

```javascript
// Limpiar todos los datos
localStorage.removeItem('oirconecta_appointments');
localStorage.removeItem('oirconecta_leads');
localStorage.removeItem('oirconecta_patient_records');
localStorage.removeItem('oirconecta_blocked_slots');
console.log('✅ Todos los datos han sido eliminados');
location.reload();
```

4. Presiona Enter
5. La página se recargará automáticamente con todos los datos limpios

## Opción 3: Usando la Función Global

1. Abre la aplicación en tu navegador
2. Presiona `F12` para abrir la consola
3. Escribe:

```javascript
clearAllOirConectaData()
```

4. Presiona Enter
5. La página se recargará automáticamente

## Opción 4: Usando el Archivo HTML

1. Abre el archivo `clear-all-data.html` en tu navegador
2. Verás un botón rojo "ELIMINAR TODOS LOS DATOS"
3. Haz clic en el botón
4. Confirma la acción
5. Los datos serán eliminados

---

**⚠️ Advertencia:** Esta acción elimina TODOS los datos y NO se puede deshacer.

**Datos que se eliminan:**
- ✅ Citas agendadas
- ✅ Leads registrados
- ✅ Registros de pacientes
- ✅ Horarios bloqueados
