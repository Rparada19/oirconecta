const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://acorl.org.co/directorio-otorrino', { waitUntil: 'networkidle2', timeout: 60000 });

  // Scroll automático para cargar todos los especialistas
  let previousHeight;
  for (let i = 0; i < 20; i++) { // hasta 20 scrolls
    previousHeight = await page.evaluate('document.body.scrollHeight');
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await page.waitForTimeout(1500);
    const newHeight = await page.evaluate('document.body.scrollHeight');
    if (newHeight === previousHeight) break;
  }

  // Espera a que cargue al menos un nombre de especialista
  await page.waitForSelector('.v-list-item__title, .v-list-item-title, .v-list-item h3, .v-list-item h4', { timeout: 30000 });

  // Extrae los datos de los especialistas
  const data = await page.evaluate(() => {
    const results = [];
    const items = document.querySelectorAll('.v-list-item, .v-list-item--link');
    items.forEach(item => {
      let nombre = 'NR';
      let profesion = 'Otorrinolaringólogo';
      let ciudad = 'NR';
      let direccion = 'NR';
      let telefonos = 'NR';

      const nombreEl = item.querySelector('.v-list-item__title, .v-list-item-title, h3, h4');
      if (nombreEl && nombreEl.textContent.trim().length > 0) {
        nombre = nombreEl.textContent.trim();
      }

      const ciudadEl = Array.from(item.querySelectorAll('span, div')).find(el => /map-marker|ciudad|ubicaci[oó]n/i.test(el.innerHTML) || /\b(bogot[áa]|cali|medell[ií]n|barranquilla|cartagena|manizales|pereira|bucaramanga|villavicencio|monter[ií]a|popay[aá]n|sincelejo|neiva|ibagu[eé]|c[úu]cuta|armenia|pasto|santa marta|valledupar|quibd[oó]|riohacha|tunja|yopal|leticia|mit[uú]|florencia|mocoa|san andr[eé]s|inírida|puerto carreño)\b/i.test(el.textContent));
      if (ciudadEl && ciudadEl.textContent.trim().length > 0) {
        ciudad = ciudadEl.textContent.trim();
      }

      const direccionEl = Array.from(item.querySelectorAll('span, div')).find(el => /direcci[oó]n|address/i.test(el.textContent));
      if (direccionEl && direccionEl.textContent.trim().length > 0) {
        direccion = direccionEl.textContent.trim();
      }

      const telEl = Array.from(item.querySelectorAll('span, div, a')).find(el => /phone|tel[eé]fono|celular|\d{7,}/i.test(el.textContent));
      if (telEl && telEl.textContent.trim().length > 0) {
        telefonos = telEl.textContent.trim();
      }

      results.push({ nombre, profesion, ciudad, direccion, telefonos });
    });
    return results.filter(e => e.nombre !== 'NR');
  });

  // Guarda el resultado en src/data/bdatos_otorrinos_acorl.json
  const outputPath = __dirname + '/../src/data/bdatos_otorrinos_acorl.json';
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Extracción completada. Se guardaron ${data.length} registros en ${outputPath}`);

  await browser.close();
})(); 