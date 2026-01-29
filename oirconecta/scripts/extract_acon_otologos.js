const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.acon.com.co/directorio-de-especialistas/', { waitUntil: 'networkidle2', timeout: 60000 });

  // Espera a que cargue el contenido principal
  await page.waitForTimeout(4000);

  // Extrae los datos de los especialistas
  const data = await page.evaluate(() => {
    // Busca todos los bloques de especialistas (ajustar selector si cambia la web)
    const text = document.body.innerText;
    // Expresión regular para extraer bloques tipo:
    // Dr(a). NOMBRE APELLIDO\nOtólogo\nCIUDAD\nNUMERO(S)
    const regex = /Dr\(a\)\. ([A-ZÁÉÍÓÚÑ ]+)\nOtólogo\n([A-ZÁÉÍÓÚÑ ]+)\n([\d /()+-]+)/g;
    let match;
    const results = [];
    while ((match = regex.exec(text)) !== null) {
      const nombre = match[1].trim();
      const profesion = 'Otólogo';
      const ciudad = match[2].trim();
      const telefono = match[3].replace(/\s+/g, ' ').trim();
      results.push({ nombre, profesion, ciudad, telefono });
    }
    return results;
  });

  // Guarda el resultado en src/data/bdatos_otologos.json
  const outputPath = __dirname + '/../src/data/bdatos_otologos.json';
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Extracción completada. Se guardaron ${data.length} registros en ${outputPath}`);

  await browser.close();
})(); 