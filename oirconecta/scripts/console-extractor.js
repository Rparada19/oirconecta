// Script de consola para extraer datos de portales web
// Copia y pega este código en la consola del navegador en cada portal

console.log('🔍 OírConecta Console Extractor cargado');

// Función para extraer datos de ASOAUDIO
function extractASOAUDIO() {
    console.log('Extrayendo datos de ASOAUDIO...');
    
    const data = [];
    const containers = document.querySelectorAll('.member, .professional, .directorio-item, [class*="member"], [class*="professional"]');
    
    console.log(`Encontrados ${containers.length} elementos`);
    
    containers.forEach((container, index) => {
        try {
            const extracted = {
                id: `aud_${index + 1}`,
                nombre: extractText(container, '.name, .nombre, h3, h4, .title'),
                especialidad: 'Audiólogo',
                titulo: extractText(container, '.credentials, .titulo, .title'),
                ciudad: extractText(container, '.city, .ciudad, .location'),
                telefono: extractText(container, '.phone, .telefono, .contact'),
                email: extractText(container, '.email, .mail'),
                direccion: extractText(container, '.address, .direccion'),
                sitioWeb: extractHref(container, 'a[href*="http"]'),
                fuente: 'ASOAUDIO',
                fechaActualizacion: new Date().toISOString()
            };
            
            if (extracted.nombre) {
                data.push(extracted);
                console.log(`✅ Extraído: ${extracted.nombre}`);
            }
        } catch (error) {
            console.error(`Error en elemento ${index}:`, error);
        }
    });
    
    console.log(`Extracción completada: ${data.length} registros`);
    return data;
}

// Función para extraer datos de ACORL
function extractACORL() {
    console.log('Extrayendo datos de ACORL...');
    
    const data = [];
    const containers = document.querySelectorAll('.member, .professional, .directorio-item, [class*="member"], [class*="professional"]');
    
    console.log(`Encontrados ${containers.length} elementos`);
    
    containers.forEach((container, index) => {
        try {
            const extracted = {
                id: `oto_${index + 1}`,
                nombre: extractText(container, '.name, .nombre, h3, h4, .title'),
                especialidad: 'Otorrinolaringólogo',
                titulo: extractText(container, '.credentials, .titulo, .title'),
                ciudad: extractText(container, '.city, .ciudad, .location'),
                telefono: extractText(container, '.phone, .telefono, .contact'),
                email: extractText(container, '.email, .mail'),
                direccion: extractText(container, '.address, .direccion'),
                sitioWeb: extractHref(container, 'a[href*="http"]'),
                fuente: 'ACORL',
                fechaActualizacion: new Date().toISOString()
            };
            
            if (extracted.nombre) {
                data.push(extracted);
                console.log(`✅ Extraído: ${extracted.nombre}`);
            }
        } catch (error) {
            console.error(`Error en elemento ${index}:`, error);
        }
    });
    
    console.log(`Extracción completada: ${data.length} registros`);
    return data;
}

// Función para extraer datos de ACON
function extractACON() {
    console.log('Extrayendo datos de ACON...');
    
    const data = [];
    const containers = document.querySelectorAll('.member, .professional, .directorio-item, [class*="member"], [class*="professional"]');
    
    console.log(`Encontrados ${containers.length} elementos`);
    
    containers.forEach((container, index) => {
        try {
            const extracted = {
                id: `eto_${index + 1}`,
                nombre: extractText(container, '.name, .nombre, h3, h4, .title'),
                especialidad: 'Otólogo',
                titulo: extractText(container, '.credentials, .titulo, .title'),
                ciudad: extractText(container, '.city, .ciudad, .location'),
                telefono: extractText(container, '.phone, .telefono, .contact'),
                email: extractText(container, '.email, .mail'),
                direccion: extractText(container, '.address, .direccion'),
                sitioWeb: extractHref(container, 'a[href*="http"]'),
                fuente: 'ACON',
                fechaActualizacion: new Date().toISOString()
            };
            
            if (extracted.nombre) {
                data.push(extracted);
                console.log(`✅ Extraído: ${extracted.nombre}`);
            }
        } catch (error) {
            console.error(`Error en elemento ${index}:`, error);
        }
    });
    
    console.log(`Extracción completada: ${data.length} registros`);
    return data;
}

// Función auxiliar para extraer texto
function extractText(element, selectors) {
    const selectorList = selectors.split(', ');
    
    for (const selector of selectorList) {
        const found = element.querySelector(selector);
        if (found && found.textContent.trim()) {
            return found.textContent.trim();
        }
    }
    
    return '';
}

// Función auxiliar para extraer enlaces
function extractHref(element, selector) {
    const link = element.querySelector(selector);
    return link ? link.href : '';
}

// Función para guardar datos en localStorage
function saveData(key, data) {
    localStorage.setItem(`oirconecta_${key}`, JSON.stringify(data));
    console.log(`💾 Datos guardados en localStorage como 'oirconecta_${key}'`);
}

// Función para descargar datos como JSON
function downloadData(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log(`📥 Datos descargados como '${filename}'`);
}

// Función para analizar la estructura de la página
function analyzePage() {
    console.log('🔍 Analizando estructura de la página...');
    
    // Buscar contenedores comunes
    const commonSelectors = [
        '.member', '.professional', '.doctor', '.specialist',
        '.directorio-item', '.member-item', '.professional-item',
        '[class*="member"]', '[class*="professional"]', '[class*="doctor"]'
    ];
    
    commonSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            console.log(`✅ Selector "${selector}": ${elements.length} elementos encontrados`);
            
            // Mostrar estructura del primer elemento
            if (elements[0]) {
                console.log('📋 Estructura del primer elemento:');
                console.log(elements[0].innerHTML.substring(0, 500) + '...');
            }
        }
    });
    
    // Buscar elementos con texto que parezcan nombres
    const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .name, .nombre, .title');
    console.log(`📝 Elementos de texto encontrados: ${textElements.length}`);
    
    textElements.forEach((el, index) => {
        if (index < 5) { // Solo mostrar los primeros 5
            console.log(`  ${index + 1}. "${el.textContent.trim()}" (${el.tagName}${el.className ? '.' + el.className : ''})`);
        }
    });
}

// Función para extraer datos con selector personalizado
function extractWithCustomSelector(selector, portalKey) {
    console.log(`Extrayendo con selector personalizado: "${selector}"`);
    
    const data = [];
    const containers = document.querySelectorAll(selector);
    
    console.log(`Encontrados ${containers.length} elementos`);
    
    containers.forEach((container, index) => {
        try {
            const extracted = {
                id: `${portalKey}_${index + 1}`,
                nombre: extractText(container, '.name, .nombre, h3, h4, .title'),
                especialidad: getEspecialidad(portalKey),
                titulo: extractText(container, '.credentials, .titulo, .title'),
                ciudad: extractText(container, '.city, .ciudad, .location'),
                telefono: extractText(container, '.phone, .telefono, .contact'),
                email: extractText(container, '.email, .mail'),
                direccion: extractText(container, '.address, .direccion'),
                sitioWeb: extractHref(container, 'a[href*="http"]'),
                fuente: portalKey.toUpperCase(),
                fechaActualizacion: new Date().toISOString()
            };
            
            if (extracted.nombre) {
                data.push(extracted);
                console.log(`✅ Extraído: ${extracted.nombre}`);
            }
        } catch (error) {
            console.error(`Error en elemento ${index}:`, error);
        }
    });
    
    return data;
}

// Función para obtener especialidad
function getEspecialidad(portalKey) {
    const especialidades = {
        'aud': 'Audiólogo',
        'oto': 'Otorrinolaringólogo',
        'eto': 'Otólogo'
    };
    return especialidades[portalKey] || 'Especialista';
}

// Exportar funciones al objeto global
window.OirConectaExtractor = {
    extractASOAUDIO,
    extractACORL,
    extractACON,
    saveData,
    downloadData,
    analyzePage,
    extractWithCustomSelector
};

console.log('📋 Funciones disponibles:');
console.log('- OirConectaExtractor.extractASOAUDIO()');
console.log('- OirConectaExtractor.extractACORL()');
console.log('- OirConectaExtractor.extractACON()');
console.log('- OirConectaExtractor.analyzePage()');
console.log('- OirConectaExtractor.saveData(key, data)');
console.log('- OirConectaExtractor.downloadData(data, filename)');
console.log('- OirConectaExtractor.extractWithCustomSelector(selector, portalKey)');

console.log('🚀 Ejecuta analyzePage() para analizar la estructura de la página actual'); 