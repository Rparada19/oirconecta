// Exportación de tablas admin a Excel (.xlsx) y PDF.
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

const stamp = () => new Date().toISOString().slice(0, 10);

/** rows: array de objetos planos (clave = encabezado de columna). */
export function exportRowsToExcel(rows, filename, sheetName = 'Datos') {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ '': '' }]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const name = filename.endsWith('.xlsx') ? filename : `${filename}_${stamp()}.xlsx`;
  XLSX.writeFile(wb, name);
}

export function exportRowsToPdf(rows, filename, title) {
  const cols = rows.length ? Object.keys(rows[0]) : [];
  const el = document.createElement('div');
  el.style.cssText = 'padding:16px;font-family:Arial,Helvetica,sans-serif;color:#1f2937';
  el.innerHTML = `
    <h2 style="color:#085946;margin:0 0 4px">${title || ''}</h2>
    <p style="color:#6b7280;font-size:12px;margin:0 0 12px">Generado ${new Date().toLocaleString('es-CO')} · ${rows.length} registros</p>
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <thead><tr>${cols.map((c) => `<th style="text-align:left;border-bottom:2px solid #085946;padding:6px">${c}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td style="border-bottom:1px solid #eee;padding:6px">${r[c] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
  const name = filename.endsWith('.pdf') ? filename : `${filename}_${stamp()}.pdf`;
  html2pdf().set({
    margin: 10,
    filename: name,
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
  }).from(el).save();
}
