// Script para VERIFICAR y LIMPIAR todos los datos de OirConecta
// Ejecuta este código en la consola del navegador (F12)

console.log('🔍 ========================================');
console.log('🔍 VERIFICACIÓN Y LIMPIEZA DE DATOS');
console.log('🔍 ========================================\n');

const keysToCheck = [
  'oirconecta_appointments',
  'oirconecta_leads',
  'oirconecta_patient_records',
  'oirconecta_blocked_slots'
];

// PASO 1: Verificar qué hay actualmente
console.log('📋 PASO 1: Verificando datos existentes...\n');

keysToCheck.forEach(key => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
      console.log(`📦 ${key}: ${count} registro(s) encontrado(s)`);
      
      // Mostrar detalles si hay citas
      if (key === 'oirconecta_appointments' && Array.isArray(parsed)) {
        parsed.forEach((apt, index) => {
          console.log(`   ${index + 1}. ${apt.patientName} - ${apt.date} ${apt.time} - Estado: ${apt.status}`);
        });
      }
      
      // Mostrar detalles si hay leads
      if (key === 'oirconecta_leads' && Array.isArray(parsed)) {
        parsed.forEach((lead, index) => {
          console.log(`   ${index + 1}. ${lead.nombre} - Estado: ${lead.estado}`);
        });
      }
    } catch (e) {
      console.error(`❌ Error al leer ${key}:`, e);
    }
  } else {
    console.log(`✅ ${key}: Vacío`);
  }
});

// PASO 2: Limpiar todos los datos
console.log('\n🗑️  PASO 2: Eliminando todos los datos...\n');

let totalEliminados = 0;
keysToCheck.forEach(key => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
      
      // Eliminar
      localStorage.removeItem(key);
      
      // Verificar que se eliminó
      const verificacion = localStorage.getItem(key);
      if (verificacion === null) {
        console.log(`✅ ${key}: ${count} registro(s) eliminado(s)`);
        totalEliminados += count;
      } else {
        console.error(`❌ ${key}: ERROR - No se pudo eliminar`);
      }
    }
  } catch (e) {
    console.error(`❌ Error al eliminar ${key}:`, e);
  }
});

// PASO 3: Verificación final
console.log('\n🔍 PASO 3: Verificación final...\n');

let quedanDatos = false;
keysToCheck.forEach(key => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
      if (count > 0) {
        console.error(`⚠️  ${key}: AÚN CONTIENE ${count} registro(s)!`);
        quedanDatos = true;
      }
    } catch (e) {
      console.error(`⚠️  ${key}: Error al verificar`);
      quedanDatos = true;
    }
  } else {
    console.log(`✅ ${key}: Confirmado vacío`);
  }
});

// Resumen
console.log('\n📊 ========================================');
console.log('📊 RESUMEN');
console.log('📊 ========================================');
console.log(`Total de registros eliminados: ${totalEliminados}`);

if (!quedanDatos) {
  console.log('✅ ¡Todos los datos han sido eliminados correctamente!');
  console.log('\n🔄 Recargando página sin caché en 2 segundos...\n');
  setTimeout(() => {
    window.location.href = window.location.href.split('?')[0].split('#')[0] + '?nocache=' + Date.now();
  }, 2000);
} else {
  console.log('⚠️  Algunos datos aún persisten. Ejecuta este script nuevamente.');
}
