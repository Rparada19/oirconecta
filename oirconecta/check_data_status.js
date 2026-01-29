// Script para verificar el estado de los datos de audiólogas
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando estado de datos de audiólogas...\n');

// Verificar archivo JSON
const jsonPath = path.join(__dirname, 'src/data/bdatos_audiologas.json');
if (fs.existsSync(jsonPath)) {
  const jsonContent = fs.readFileSync(jsonPath, 'utf8');
  const jsonData = JSON.parse(jsonContent);
  console.log(`📁 Archivo JSON: ${jsonData.length} audiólogas`);
} else {
  console.log('❌ Archivo JSON no encontrado');
}

// Verificar si hay archivos Excel
const excelFiles = [];
const searchExcelFiles = (dir) => {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      searchExcelFiles(fullPath);
    } else if (item.endsWith('.xlsx') || item.endsWith('.xls')) {
      excelFiles.push(fullPath);
    }
  });
};

searchExcelFiles(__dirname);
console.log(`📊 Archivos Excel encontrados: ${excelFiles.length}`);
excelFiles.forEach(file => {
  console.log(`   - ${path.relative(__dirname, file)}`);
});

// Verificar componentes relacionados
const audiologasPagePath = path.join(__dirname, 'src/pages/AudiologasPage.jsx');
if (fs.existsSync(audiologasPagePath)) {
  const content = fs.readFileSync(audiologasPagePath, 'utf8');
  const hasDataRecovery = content.includes('DataRecovery');
  const hasDataStatus = content.includes('DataStatus');
  console.log(`\n📱 Componentes en AudiologasPage:`);
  console.log(`   - DataRecovery: ${hasDataRecovery ? '✅' : '❌'}`);
  console.log(`   - DataStatus: ${hasDataStatus ? '✅' : '❌'}`);
}

console.log('\n🎯 Para verificar los datos en el navegador:');
console.log('1. Abre http://localhost:5174/profesionales/audiologos');
console.log('2. Revisa el componente DataRecovery en la parte superior');
console.log('3. Verifica el estado en el componente DataStatus');
console.log('4. Comprueba si aparecen las audiólogas en la lista'); 