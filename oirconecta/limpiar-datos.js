// Script para limpiar todos los datos de OirConecta
// Ejecuta este código en la consola del navegador (F12)

const keysToRemove = [
  'oirconecta_appointments',
  'oirconecta_leads',
  'oirconecta_patient_records',
  'oirconecta_blocked_slots'
];

let cleared = 0;
keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    cleared++;
    console.log(`✅ Eliminado: ${key}`);
  }
});

console.log(`\n✅ Total eliminado: ${cleared} de ${keysToRemove.length} claves`);
console.log('🔄 Recargando página...');
setTimeout(() => location.reload(), 500);
