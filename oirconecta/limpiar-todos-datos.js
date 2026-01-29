// Script para eliminar TODOS los datos de demostración de OirConecta
// Ejecuta este código en la consola del navegador (F12)

console.log('🗑️ Iniciando limpieza de todos los datos...');

const keysToRemove = [
  'oirconecta_appointments',
  'oirconecta_leads',
  'oirconecta_patient_records',
  'oirconecta_blocked_slots'
];

let cleared = 0;
let totalItems = 0;

keysToRemove.forEach(key => {
  try {
    const data = localStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
      totalItems += count;
      
      localStorage.removeItem(key);
      cleared++;
      console.log(`✅ Eliminado: ${key} (${count} registro(s))`);
    } else {
      console.log(`ℹ️  ${key}: Ya estaba vacío`);
    }
  } catch (e) {
    console.error(`❌ Error al eliminar ${key}:`, e);
  }
});

console.log(`\n✅ Limpieza completada:`);
console.log(`   - ${cleared} de ${keysToRemove.length} claves eliminadas`);
console.log(`   - ${totalItems} registros eliminados en total`);
console.log('🔄 Recargando página en 1 segundo...');

setTimeout(() => {
  window.location.reload();
}, 1000);
