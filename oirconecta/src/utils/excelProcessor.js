// Utilitario para procesar archivos Excel
import * as XLSX from 'xlsx';

export const processExcelData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        console.log('=== PROCESANDO EXCEL ===');
        console.log('Archivo:', file.name);
        console.log('Hojas:', workbook.SheetNames);
        
        // Detectar si es audiólogas basado en el nombre del archivo
        const fileName = file.name.toLowerCase();
        const isAudiologas = fileName.includes('audiolog') || 
                            fileName.includes('audiologia') ||
                            fileName.includes('bd_audiologia') ||
                            fileName.includes('audiologas') ||
                            (fileName.includes('bd_') && !fileName.includes('orl') && !fileName.includes('otorrinolaringologo'));
        
        console.log('=== DETECCIÓN DE TIPO DE ARCHIVO ===');
        console.log('Nombre del archivo:', file.name);
        console.log('Nombre en minúsculas:', fileName);
        console.log('¿Es archivo de audiólogas?', isAudiologas);
        console.log('Contiene "audiolog":', fileName.includes('audiolog'));
        console.log('Contiene "audiologia":', fileName.includes('audiologia'));
        console.log('Contiene "bd_audiologia":', fileName.includes('bd_audiologia'));
        console.log('Contiene "bd_":', fileName.includes('bd_'));
        console.log('Contiene "orl":', fileName.includes('orl'));
        console.log('Contiene "otorrinolaringologo":', fileName.includes('otorrinolaringologo'));
        
        const allData = [];
        const sheetStats = [];
        
        // Procesar cada hoja
        workbook.SheetNames.forEach((sheetName, index) => {
          console.log(`\n--- HOJA ${index + 1}: ${sheetName} ---`);
          
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          console.log(`Filas encontradas: ${jsonData.length}`);
          
          if (jsonData.length > 1) {
            const headers = jsonData[0];
            const rows = jsonData.slice(1);
            
            console.log(`Headers: ${headers.join(' | ')}`);
            console.log(`Datos a procesar: ${rows.length} filas`);
            
            // Procesar cada fila
            const processedRows = [];
            rows.forEach((row, rowIndex) => {
              const professional = {
                id: `profesional_${sheetName}_${rowIndex + 1}`,
                nombre: '',
                especialidad: isAudiologas ? 'Audióloga' : 'Otorrinolaringólogo',
                titulo: isAudiologas ? 'Audióloga' : 'Médico Otorrinolaringólogo',
                ciudad: sheetName,
                departamento: getDepartamento(sheetName),
                telefono: '',
                celular: '',
                email: '',
                direccion: '',
                sitioWeb: '',
                horarios: 'Lunes a Viernes 8:00 AM - 6:00 PM',
                subespecialidades: isAudiologas ? [
                  'Evaluación Auditiva',
                  'Adaptación de Audífonos',
                  'Audiología Pediátrica',
                  'Audiología Ocupacional',
                  'Implantes Cocleares'
                ] : [
                  'Otorrinolaringología General',
                  'Cirugía Endoscópica Nasal',
                  'Otología y Neurotología',
                  'Laringología',
                  'Rinología'
                ],
                servicios: isAudiologas ? [
                  'Evaluación auditiva completa',
                  'Adaptación de audífonos',
                  'Pruebas de audición',
                  'Audiometría tonal y vocal',
                  'Evaluación vestibular',
                  'Screening auditivo neonatal',
                  'Rehabilitación auditiva'
                ] : [
                  'Diagnóstico y tratamiento de enfermedades del oído',
                  'Cirugía endoscópica nasal',
                  'Tratamiento de sinusitis',
                  'Cirugía de amígdalas y adenoides',
                  'Tratamiento de vértigo y mareos',
                  'Cirugía de oído medio',
                  'Tratamiento de ronquidos y apnea del sueño'
                ],
                hospitales: ['Centro Audiológico Especializado'],
                certificaciones: isAudiologas ? ['Miembro ASOAUDIO'] : ['Miembro ASOAUDIO'],
                experiencia: isAudiologas ? 'Especialista en audiología y evaluación auditiva.' : 'Especialista en otorrinolaringología y cirugía de cabeza y cuello.',
                idiomas: ['Español'],
                resena: isAudiologas ? 'Audióloga especializada en evaluación auditiva y adaptación de audífonos.' : 'Médico otorrinolaringólogo especializado en diagnóstico y tratamiento de enfermedades del oído, nariz y garganta.',
                calificacion: (Math.random() * 1 + 4).toFixed(1),
                pacientes: Math.floor(Math.random() * 500) + 100,
                foto: getDefaultPhoto(isAudiologas ? 'Audióloga' : 'Otorrinolaringólogo'),
                agenda: generateAgenda(),
                disponible: Math.random() > 0.2,
                destacado: Math.random() > 0.7,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              // Mapear datos de Excel
              headers.forEach((header, headerIndex) => {
                const value = row[headerIndex] || '';
                const headerLower = header ? header.toString().toLowerCase() : '';
                
                if (headerLower.includes('nombre') || headerLower.includes('name')) {
                  professional.nombre = value.toString().trim();
                } else if (headerLower.includes('telefono') || headerLower.includes('phone') || headerLower.includes('tel')) {
                  professional.telefono = value.toString().trim();
                } else if (headerLower.includes('celular') || headerLower.includes('mobile') || headerLower.includes('cell')) {
                  professional.celular = value.toString().trim();
                } else if (headerLower.includes('email') || headerLower.includes('correo') || headerLower.includes('mail')) {
                  professional.email = value.toString().trim();
                } else if (headerLower.includes('direccion') || headerLower.includes('address') || headerLower.includes('dir')) {
                  professional.direccion = value.toString().trim();
                } else if (headerLower.includes('ciudad') || headerLower.includes('city')) {
                  professional.ciudad = value.toString().trim();
                }
              });

              // Solo agregar si tiene nombre
              if (professional.nombre.trim() !== '') {
                processedRows.push(professional);
              }
            });
            
            allData.push(...processedRows);
            
            sheetStats.push({
              sheetName: sheetName,
              totalRows: rows.length,
              processedRows: processedRows.length,
              status: 'procesada'
            });
            
            console.log(`✅ Procesados: ${processedRows.length} registros`);
          } else {
            console.log(`❌ Sin datos válidos`);
            sheetStats.push({
              sheetName: sheetName,
              totalRows: 0,
              processedRows: 0,
              status: 'sin datos'
            });
          }
        });
        
        console.log(`\n=== TOTAL: ${allData.length} registros ===`);
        
        // Guardar en localStorage según el tipo
        const storageKey = isAudiologas ? 'audiologas_data' : 'otorrinolaringologos_data';
        const dataType = isAudiologas ? 'AUDIOLOGAS' : 'ORL';
        console.log(`💾 Guardando ${allData.length} registros en localStorage con clave: ${storageKey}`);
        console.log(`📊 Tipo de datos: ${dataType}`);
        
        localStorage.setItem(storageKey, JSON.stringify(allData));
        
        // Verificar que se guardó correctamente
        const savedData = localStorage.getItem(storageKey);
        console.log(`✅ Verificación: ${savedData ? 'Datos guardados correctamente' : 'ERROR: No se guardaron los datos'}`);
        console.log(`📊 Tamaño de datos guardados: ${savedData ? savedData.length : 0} caracteres`);
        console.log(`🔍 Primeros 200 caracteres: ${savedData ? savedData.substring(0, 200) : 'null'}`);
        
        // Verificar todas las claves en localStorage después de guardar
        const allKeys = Object.keys(localStorage);
        console.log(`📋 Todas las claves en localStorage después de guardar: ${allKeys.join(', ')}`);
        
        resolve({
          data: allData,
          type: dataType,
          count: allData.length,
          storageKey: storageKey,
          sheets: workbook.SheetNames,
          sheetStats: sheetStats
        });
      } catch (error) {
        console.error('Error:', error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

const getDepartamento = (ciudad) => {
  const departamentos = {
    'Bogotá': 'Cundinamarca',
    'Medellín': 'Antioquia',
    'Cali': 'Valle del Cauca',
    'Barranquilla': 'Atlántico',
    'Cartagena': 'Bolívar',
    'Bucaramanga': 'Santander',
    'Pereira': 'Risaralda',
    'Manizales': 'Caldas',
    'Ibagué': 'Tolima',
    'Villavicencio': 'Meta',
    'Pasto': 'Nariño',
    'Neiva': 'Huila',
    'Montería': 'Córdoba',
    'Valledupar': 'Cesar',
    'Popayán': 'Cauca',
    'Tunja': 'Boyacá',
    'Florencia': 'Caquetá',
    'Armenia': 'Quindío',
    'Sincelejo': 'Sucre',
    'Riohacha': 'La Guajira',
    'Quibdó': 'Chocó',
    'Mocoa': 'Putumayo',
    'Cúcuta': 'Norte de Santander'
  };
  
  return departamentos[ciudad] || 'No especificado';
};

const getDefaultPhoto = (especialidad) => {
  const fotos = {
    'Audióloga': '/img/audiologa-profesional-colombia.jpg',
    'Otorrinolaringólogo': '/img/otorrinolaringologo-profesional.jpg',
    'Otólogo': '/img/profesional-otologia.jpg'
  };
  
  return fotos[especialidad] || fotos['Audióloga'];
};

const generateAgenda = () => {
  return [
    { dia: "Lunes", horas: ["08:00", "09:00", "10:00", "14:00", "15:00"] },
    { dia: "Martes", horas: ["08:00", "09:00", "10:00", "14:00", "15:00"] },
    { dia: "Miércoles", horas: ["08:00", "09:00", "10:00", "14:00", "15:00"] },
    { dia: "Jueves", horas: ["08:00", "09:00", "10:00", "14:00", "15:00"] },
    { dia: "Viernes", horas: ["08:00", "09:00", "10:00", "14:00", "15:00"] }
  ];
}; 