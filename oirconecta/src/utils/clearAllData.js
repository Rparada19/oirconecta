/**
 * Utilidad para limpiar todos los datos de OirConecta
 * Se puede ejecutar desde la consola del navegador:
 * 
 * import { clearAllData } from './utils/clearAllData';
 * clearAllData();
 * 
 * O directamente en la consola:
 * localStorage.removeItem('oirconecta_appointments');
 * localStorage.removeItem('oirconecta_leads');
 * localStorage.removeItem('oirconecta_patient_records');
 * localStorage.removeItem('oirconecta_blocked_slots');
 * location.reload();
 */

export const clearAllData = () => {
  const keysToRemove = [
    'oirconecta_appointments',
    'oirconecta_leads',
    'oirconecta_patient_records',
    'oirconecta_blocked_slots'
  ];

  let cleared = 0;
  keysToRemove.forEach(key => {
    try {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        cleared++;
        console.log(`✅ Eliminado: ${key}`);
      }
    } catch (e) {
      console.error(`❌ Error al eliminar ${key}:`, e);
    }
  });

  console.log(`\n✅ Total de claves eliminadas: ${cleared} de ${keysToRemove.length}`);
  console.log('🔄 Recargando página...');
  
  // Recargar la página después de limpiar
  setTimeout(() => {
    window.location.reload();
  }, 500);

  return {
    success: true,
    cleared,
    total: keysToRemove.length
  };
};

// También exponer como función global para uso desde la consola
if (typeof window !== 'undefined') {
  window.clearAllOirConectaData = clearAllData;
  console.log('💡 Función disponible: clearAllOirConectaData()');
}
