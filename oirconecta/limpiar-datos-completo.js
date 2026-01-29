// Script COMPLETO para eliminar TODOS los datos de OirConecta
// Ejecuta este código en la consola del navegador (F12) mientras estás en la aplicación

console.log('🗑️ ========================================');
console.log('🗑️ LIMPIEZA COMPLETA DE DATOS OIRCONECTA');
console.log('🗑️ ========================================');

const keysToRemove = [
  'oirconecta_appointments',
  'oirconecta_leads',
  'oirconecta_patient_records',
  'oirconecta_blocked_slots'
];

// Función para limpiar una clave específica
function limpiarClave(key) {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
      localStorage.removeItem(key);
      
      // Verificar que se eliminó
      const verificacion = localStorage.getItem(key);
      if (verificacion === null) {
        console.log(`✅ ${key}: ${count} registro(s) eliminado(s) correctamente`);
        return { success: true, count };
      } else {
        console.error(`❌ ${key}: No se pudo eliminar completamente`);
        return { success: false, count };
      }
    } else {
      console.log(`ℹ️  ${key}: Ya estaba vacío`);
      return { success: true, count: 0 };
    }
  } catch (e) {
    console.error(`❌ Error al eliminar ${key}:`, e);
    return { success: false, count: 0 };
  }
}

// Limpiar todas las claves
let totalEliminados = 0;
let clavesEliminadas = 0;

console.log('\n📋 Iniciando limpieza...\n');

keysToRemove.forEach(key => {
  const resultado = limpiarClave(key);
  if (resultado.success) {
    clavesEliminadas++;
    totalEliminados += resultado.count;
  }
});

// Verificación final
console.log('\n🔍 Verificación final:');
let hayDatos = false;
keysToRemove.forEach(key => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
      if (count > 0) {
        console.error(`⚠️  ${key}: AÚN CONTIENE ${count} registro(s)!`);
        hayDatos = true;
      }
    } catch (e) {
      console.error(`⚠️  ${key}: Error al verificar`);
      hayDatos = true;
    }
  }
});

console.log('\n📊 Resumen:');
console.log(`   ✅ ${clavesEliminadas} de ${keysToRemove.length} claves limpiadas`);
console.log(`   ✅ ${totalEliminados} registros eliminados en total`);

if (!hayDatos) {
  console.log('\n✅ ¡Limpieza completada exitosamente!');
  console.log('🔄 Recargando página en 2 segundos...\n');
  setTimeout(() => {
    // Forzar recarga completa sin cache
    window.location.href = window.location.href.split('?')[0] + '?nocache=' + Date.now();
  }, 2000);
} else {
  console.log('\n⚠️  Algunos datos aún persisten. Intenta ejecutar el script nuevamente.');
}
