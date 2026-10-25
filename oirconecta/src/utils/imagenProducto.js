/**
 * Fotos de producto: quita el fondo blanco, recorta y reduce.
 * Devuelve un data URL WEBP listo para mostrar o subir.
 */
export function prepImagen(file) {
  return new Promise((res, rej) => {
    const r = new FileReader(); r.onerror = rej;
    r.onload = () => {
      const im = new Image(); im.onerror = rej;
      im.onload = () => {
        const sc = Math.min(1, 520 / Math.max(im.width, im.height));
        const w = Math.round(im.width * sc); const h = Math.round(im.height * sc);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d'); x.drawImage(im, 0, 0, w, h);
        const id = x.getImageData(0, 0, w, h); const a = id.data;
        let minX = w; let minY = h; let maxX = 0; let maxY = 0;
        for (let i = 0; i < a.length; i += 4) {
          const m = Math.min(a[i], a[i + 1], a[i + 2]);
          a[i + 3] = Math.min(a[i + 3], Math.max(0, Math.min(255, ((255 - m) * 255) / 28)));
          if (a[i + 3] > 10) { const p = i / 4; const px = p % w; const py = (p / w) | 0; minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py); }
        }
        x.putImageData(id, 0, 0);
        if (maxX <= minX || maxY <= minY) return res(c.toDataURL('image/png'));
        const c2 = document.createElement('canvas'); c2.width = maxX - minX + 1; c2.height = maxY - minY + 1;
        c2.getContext('2d').drawImage(c, minX, minY, c2.width, c2.height, 0, 0, c2.width, c2.height);
        res(c2.toDataURL('image/webp', 0.85));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

/** Convierte un data URL en Blob para subirlo. */
export async function dataUrlABlob(url) {
  const r = await fetch(url);
  return r.blob();
}
