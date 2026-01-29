// Script robusto para extraer datos de ACON y ACORL
// Con manejo de errores y reintentos automáticos

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class RobustExtractor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.data = {
      otorrinolaringologos: [],
      otologos: []
    };
    this.maxRetries = 3;
  }

  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: true, // Cambiar a true para evitar problemas de GUI
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
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });
      
      this.page = await this.browser.newPage();
      
      // Configurar user agent más realista
      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Configurar timeouts más largos
      this.page.setDefaultTimeout(90000);
      this.page.setDefaultNavigationTimeout(90000);
      
      // Interceptar requests para mejorar rendimiento
      await this.page.setRequestInterception(true);
      this.page.on('request', (req) => {
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });
      
      console.log('✅ Navegador inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando navegador:', error.message);
      return false;
    }
  }

  async retryOperation(operation, operationName, maxRetries = this.maxRetries) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`  🔄 Intento ${attempt}/${maxRetries} para ${operationName}...`);
        return await operation();
      } catch (error) {
        console.log(`  ⚠️ Error en intento ${attempt}: ${error.message}`);
        if (attempt === maxRetries) {
          throw error;
        }
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  async extractACORLRobust() {
    console.log('🔍 Extrayendo datos de ACORL con estrategia robusta...');
    
    try {
      const results = await this.retryOperation(async () => {
        console.log('  📡 Navegando a ACORL...');
        await this.page.goto('https://acorl.org.co/directorio-otorrino', {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });

        console.log('  ⏳ Esperando carga de contenido...');
        await this.page.waitForTimeout(5000);

        // Estrategia múltiple para ACORL
        const otorrinolaringologos = await this.page.evaluate(() => {
          const professionals = [];
          
          // Estrategia 1: Buscar en todo el contenido
          const bodyText = document.body.textContent;
          const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 20);
          
          lines.forEach(line => {
            // Buscar patrones de nombres de médicos
            const doctorPatterns = [
              /Dr\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/g,
              /Dra\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/g,
              /Doctor\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/g,
              /Doctora\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/g
            ];
            
            doctorPatterns.forEach(pattern => {
              const matches = line.match(pattern);
              if (matches && matches[1]) {
                const nombre = matches[1].trim();
                if (nombre.length > 5 && nombre.length < 100) {
                  // Buscar información de contacto
                  const telefono = line.match(/(\d{3}[\s-]?\d{3}[\s-]?\d{4})/)?.[1];
                  const email = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
                  const direccion = line.match(/(?:Dirección|Dir\.|Direccion)[:\s]*([^.\n]+)/i)?.[1]?.trim();
                  
                  professionals.push({
                    nombre: nombre,
                    telefono: telefono || 'No especificado',
                    email: email || 'No especificado',
                    direccion: direccion || 'No especificada',
                    datos_completos: line,
                    fuente: 'ACORL'
                  });
                }
              }
            });
          });
          
          // Estrategia 2: Buscar en elementos específicos
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
            '[class*="item"]',
            'div',
            'p',
            'span'
          ];
          
          selectors.forEach(selector => {
            try {
              const elements = document.querySelectorAll(selector);
              elements.forEach(element => {
                const text = element.textContent?.trim();
                if (text && text.length > 20 && text.length < 1000) {
                  const nombre = text.match(/Dr\.?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/)?.[1]?.trim();
                  if (nombre && nombre.length > 5) {
                    const telefono = text.match(/(\d{3}[\s-]?\d{3}[\s-]?\d{4})/)?.[1];
                    const email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
                    
                    professionals.push({
                      nombre: nombre,
                      telefono: telefono || 'No especificado',
                      email: email || 'No especificado',
                      datos_completos: text,
                      selector: selector,
                      fuente: 'ACORL'
                    });
                  }
                }
              });
            } catch (e) {
              // Ignorar errores de selectores
            }
          });
          
          return professionals;
        });

        return otorrinolaringologos;
      }, 'extracción ACORL');

      // Eliminar duplicados
      const uniqueResults = this.removeDuplicates(results, 'nombre');
      this.data.otorrinolaringologos = uniqueResults;
      console.log(`✅ Extraídos ${uniqueResults.length} otorrinolaringólogos únicos de ACORL`);
      
      return uniqueResults;
      
    } catch (error) {
      console.error('❌ Error extrayendo ACORL:', error.message);
      return [];
    }
  }

  async extractACONRobust() {
    console.log('🔍 Extrayendo datos de ACON con estrategia robusta...');
    
    try {
      const results = await this.retryOperation(async () => {
        console.log('  📡 Navegando a ACON...');
        await this.page.goto('https://www.acon.com.co/directorio-de-especialistas/', {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });

        console.log('  ⏳ Esperando carga de contenido...');
        await this.page.waitForTimeout(5000);

        // Estrategia múltiple para ACON
        const otologos = await this.page.evaluate(() => {
          const professionals = [];
          
          // Estrategia 1: Buscar en elementos específicos de ACON
          const selectors = [
            '.jet-listing-grid__item',
            '.elementor-widget-container',
            '.elementor-widget-text-editor',
            '.elementor-widget',
            '[class*="listing"]',
            '[class*="grid"]',
            '[class*="item"]',
            '[class*="card"]',
            'div',
            'p',
            'span'
          ];
          
          selectors.forEach(selector => {
            try {
              const elements = document.querySelectorAll(selector);
              elements.forEach(element => {
                const text = element.textContent?.trim();
                if (text && text.length > 20 && text.length < 1000) {
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
            } catch (e) {
              // Ignorar errores de selectores
            }
          });
          
          // Estrategia 2: Buscar en todo el contenido
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

        return otologos;
      }, 'extracción ACON');

      // Eliminar duplicados
      const uniqueResults = this.removeDuplicates(results, 'nombre');
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
    const outputPath = path.join(__dirname, `robust_extraction_${timestamp}.json`);
    
    try {
      fs.writeFileSync(outputPath, JSON.stringify(this.data, null, 2), 'utf8');
      console.log(`💾 Datos guardados en: ${outputPath}`);
      
      // También guardar en formato JavaScript
      const jsOutputPath = path.join(__dirname, `robust_extraction_${timestamp}.js`);
      const jsContent = `// Datos extraídos con estrategia robusta\n// Generado automáticamente el ${new Date().toLocaleString()}\n\nconst robustData = ${JSON.stringify(this.data, null, 2)};\n\nmodule.exports = robustData;`;
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
    console.log('🚀 Iniciando extracción robusta de ACON y ACORL...\n');
    
    try {
      const initSuccess = await this.init();
      if (!initSuccess) {
        throw new Error('No se pudo inicializar el navegador');
      }
      
      const acorlResults = await this.extractACORLRobust();
      const aconResults = await this.extractACONRobust();
      
      await this.saveData();
      await this.close();
      
      console.log('\n📊 Resumen de extracción robusta:');
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
  const extractor = new RobustExtractor();
  extractor.extractAll().catch(console.error);
}

module.exports = RobustExtractor; 