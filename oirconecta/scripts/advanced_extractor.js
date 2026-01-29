// Script avanzado para extraer datos de ACON y ACORL
// Estrategias múltiples para obtener los datos más valiosos

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class AdvancedExtractor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.data = {
      otorrinolaringologos: [],
      otologos: []
    };
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: false, // Cambiar a false para debugging
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });
    this.page = await this.browser.newPage();
    
    // Configurar user agent más realista
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Configurar timeouts más largos
    this.page.setDefaultTimeout(120000);
    this.page.setDefaultNavigationTimeout(120000);
    
    // Interceptar requests para evitar bloqueos
    await this.page.setRequestInterception(true);
    this.page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });
  }

  async extractACORLAdvanced() {
    console.log('🔍 Extrayendo datos de ACORL con estrategia avanzada...');
    
    try {
      console.log('  📡 Navegando a ACORL...');
      await this.page.goto('https://acorl.org.co/directorio-otorrino', {
        waitUntil: 'networkidle2',
        timeout: 120000
      });

      console.log('  ⏳ Esperando carga completa...');
      await this.page.waitForTimeout(8000);

      // Estrategia 1: Buscar en el contenido principal
      console.log('  🔍 Estrategia 1: Buscando en contenido principal...');
      let otorrinolaringologos = await this.page.evaluate(() => {
        const professionals = [];
        
        // Buscar todos los elementos que podrían contener información de profesionales
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach((element, index) => {
          const text = element.textContent?.trim();
          if (text && text.length > 50 && text.length < 1000) {
            // Buscar patrones de nombres de médicos
            const doctorPatterns = [
              /Dr\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/g,
              /Dra\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/g,
              /Doctor\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/g,
              /Doctora\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/g
            ];
            
            let foundDoctor = false;
            doctorPatterns.forEach(pattern => {
              const matches = text.match(pattern);
              if (matches && matches[1]) {
                const nombre = matches[1].trim();
                if (nombre.length > 5 && nombre.length < 100) {
                  // Buscar información de contacto en el mismo elemento
                  const telefono = text.match(/(\d{3}[\s-]?\d{3}[\s-]?\d{4})/)?.[1];
                  const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
                  
                  if (!foundDoctor) {
                    professionals.push({
                      nombre: nombre,
                      telefono: telefono || 'No especificado',
                      email: email || 'No especificado',
                      datos_completos: text,
                      elemento: element.tagName + (element.className ? '.' + element.className : ''),
                      fuente: 'ACORL'
                    });
                    foundDoctor = true;
                  }
                }
              }
            });
          }
        });
        
        return professionals;
      });

      console.log(`  📊 Estrategia 1: Encontrados ${otorrinolaringologos.length} profesionales`);

      // Estrategia 2: Buscar en elementos específicos
      console.log('  🔍 Estrategia 2: Buscando en elementos específicos...');
      const strategy2Results = await this.page.evaluate(() => {
        const professionals = [];
        
        // Buscar en elementos con clases específicas
        const selectors = [
          '.member',
          '.professional',
          '.doctor',
          '.specialist',
          '.card',
          '.item',
          '.listing',
          '.directory-item',
          '[class*="member"]',
          '[class*="professional"]',
          '[class*="doctor"]',
          '[class*="card"]',
          '[class*="item"]'
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            const text = element.textContent?.trim();
            if (text && text.length > 20) {
              const nombre = text.match(/Dr\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/)?.[1]?.trim();
              if (nombre) {
                professionals.push({
                  nombre: nombre,
                  datos_completos: text,
                  selector: selector,
                  fuente: 'ACORL'
                });
              }
            }
          });
        });
        
        return professionals;
      });

      console.log(`  📊 Estrategia 2: Encontrados ${strategy2Results.length} profesionales`);

      // Estrategia 3: Buscar en listas y tablas
      console.log('  🔍 Estrategia 3: Buscando en listas y tablas...');
      const strategy3Results = await this.page.evaluate(() => {
        const professionals = [];
        
        // Buscar en listas
        const lists = document.querySelectorAll('ul, ol');
        lists.forEach(list => {
          const items = list.querySelectorAll('li');
          items.forEach(item => {
            const text = item.textContent?.trim();
            if (text && text.length > 20) {
              const nombre = text.match(/Dr\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/)?.[1]?.trim();
              if (nombre) {
                professionals.push({
                  nombre: nombre,
                  datos_completos: text,
                  tipo: 'lista',
                  fuente: 'ACORL'
                });
              }
            }
          });
        });
        
        // Buscar en tablas
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
          const rows = table.querySelectorAll('tr');
          rows.forEach(row => {
            const cells = row.querySelectorAll('td, th');
            cells.forEach(cell => {
              const text = cell.textContent?.trim();
              if (text && text.length > 20) {
                const nombre = text.match(/Dr\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/)?.[1]?.trim();
                if (nombre) {
                  professionals.push({
                    nombre: nombre,
                    datos_completos: text,
                    tipo: 'tabla',
                    fuente: 'ACORL'
                  });
                }
              }
            });
          });
        });
        
        return professionals;
      });

      console.log(`  📊 Estrategia 3: Encontrados ${strategy3Results.length} profesionales`);

      // Combinar resultados y eliminar duplicados
      const allResults = [...otorrinolaringologos, ...strategy2Results, ...strategy3Results];
      const uniqueResults = this.removeDuplicates(allResults, 'nombre');
      
      this.data.otorrinolaringologos = uniqueResults;
      console.log(`✅ Extraídos ${uniqueResults.length} otorrinolaringólogos únicos de ACORL`);
      
      return uniqueResults;
      
    } catch (error) {
      console.error('❌ Error extrayendo ACORL:', error.message);
      return [];
    }
  }

  async extractACONAdvanced() {
    console.log('🔍 Extrayendo datos de ACON con estrategia avanzada...');
    
    try {
      console.log('  📡 Navegando a ACON...');
      await this.page.goto('https://www.acon.com.co/directorio-de-especialistas/', {
        waitUntil: 'networkidle2',
        timeout: 120000
      });

      console.log('  ⏳ Esperando carga completa...');
      await this.page.waitForTimeout(8000);

      // Estrategia 1: Buscar en elementos específicos de ACON
      console.log('  🔍 Estrategia 1: Buscando en elementos específicos...');
      let otologos = await this.page.evaluate(() => {
        const professionals = [];
        
        // Buscar en elementos con clases específicas de ACON
        const selectors = [
          '.jet-listing-grid__item',
          '.elementor-widget-container',
          '.elementor-widget-text-editor',
          '.elementor-widget',
          '[class*="listing"]',
          '[class*="grid"]',
          '[class*="item"]',
          '[class*="card"]'
        ];
        
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            const text = element.textContent?.trim();
            if (text && text.length > 20) {
              // Buscar patrones de nombres de médicos
              const doctorPatterns = [
                /Dr\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/g,
                /Dra\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/g,
                /Doctor\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/g,
                /Doctora\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/g
              ];
              
              doctorPatterns.forEach(pattern => {
                const matches = text.match(pattern);
                if (matches && matches[1]) {
                  const nombre = matches[1].trim();
                  if (nombre.length > 5 && nombre.length < 100) {
                    // Buscar información de contacto
                    const telefono = text.match(/(\d{3}[\s-]?\d{3}[\s-]?\d{4})/)?.[1];
                    const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
                    const direccion = text.match(/(?:Dirección|Dir\.|Direccion)[:\s]*([^.\n]+)/i)?.[1]?.trim();
                    
                    professionals.push({
                      nombre: nombre,
                      telefono: telefono || 'No especificado',
                      email: email || 'No especificado',
                      direccion: direccion || 'No especificada',
                      datos_completos: text,
                      selector: selector,
                      fuente: 'ACON'
                    });
                  }
                }
              });
            }
          });
        });
        
        return professionals;
      });

      console.log(`  📊 Estrategia 1: Encontrados ${otologos.length} profesionales`);

      // Estrategia 2: Buscar en todo el contenido de la página
      console.log('  🔍 Estrategia 2: Buscando en todo el contenido...');
      const strategy2Results = await this.page.evaluate(() => {
        const professionals = [];
        
        // Buscar en todo el body
        const bodyText = document.body.textContent;
        const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 20);
        
        lines.forEach(line => {
          const doctorPatterns = [
            /Dr\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/g,
            /Dra\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/g
          ];
          
          doctorPatterns.forEach(pattern => {
            const matches = line.match(pattern);
            if (matches && matches[1]) {
              const nombre = matches[1].trim();
              if (nombre.length > 5 && nombre.length < 100) {
                const telefono = line.match(/(\d{3}[\s-]?\d{3}[\s-]?\d{4})/)?.[1];
                const email = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
                
                professionals.push({
                  nombre: nombre,
                  telefono: telefono || 'No especificado',
                  email: email || 'No especificado',
                  datos_completos: line,
                  fuente: 'ACON'
                });
              }
            }
          });
        });
        
        return professionals;
      });

      console.log(`  📊 Estrategia 2: Encontrados ${strategy2Results.length} profesionales`);

      // Combinar resultados y eliminar duplicados
      const allResults = [...otologos, ...strategy2Results];
      const uniqueResults = this.removeDuplicates(allResults, 'nombre');
      
      this.data.otologos = uniqueResults;
      console.log(`✅ Extraídos ${uniqueResults.length} otólogos únicos de ACON`);
      
      return uniqueResults;
      
    } catch (error) {
      console.error('❌ Error extrayendo ACON:', error.message);
      return [];
    }
  }

  removeDuplicates(array, key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  async saveData() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(__dirname, `advanced_extraction_${timestamp}.json`);
    
    try {
      fs.writeFileSync(outputPath, JSON.stringify(this.data, null, 2), 'utf8');
      console.log(`💾 Datos guardados en: ${outputPath}`);
      
      // También guardar en formato JavaScript
      const jsOutputPath = path.join(__dirname, `advanced_extraction_${timestamp}.js`);
      const jsContent = `// Datos extraídos con estrategia avanzada\n// Generado automáticamente el ${new Date().toLocaleString()}\n\nconst advancedData = ${JSON.stringify(this.data, null, 2)};\n\nmodule.exports = advancedData;`;
      fs.writeFileSync(jsOutputPath, jsContent, 'utf8');
      console.log(`💾 Datos JS guardados en: ${jsOutputPath}`);
      
    } catch (error) {
      console.error('❌ Error guardando datos:', error.message);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async extractAll() {
    console.log('🚀 Iniciando extracción avanzada de ACON y ACORL...\n');
    
    try {
      await this.init();
      console.log('✅ Navegador inicializado correctamente\n');
      
      const acorlResults = await this.extractACORLAdvanced();
      const aconResults = await this.extractACONAdvanced();
      
      await this.saveData();
      await this.close();
      
      console.log('\n📊 Resumen de extracción avanzada:');
      console.log(`- Otorrinolaringólogos (ACORL): ${acorlResults.length}`);
      console.log(`- Otólogos (ACON): ${aconResults.length}`);
      console.log(`- Total: ${acorlResults.length + aconResults.length} profesionales`);
      
      return this.data;
    } catch (error) {
      console.error('❌ Error durante la extracción:', error.message);
      await this.close();
      throw error;
    }
  }
}

// Ejecutar extracción
if (require.main === module) {
  const extractor = new AdvancedExtractor();
  extractor.extractAll().catch(console.error);
}

module.exports = AdvancedExtractor; 