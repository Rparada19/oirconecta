/**
 * D6 — PDF consolidado por anunciante.
 *
 * Un solo documento con:
 *   Portada — nombre anunciante + periodo + resumen
 *   Sección 1 · Vista consolidada — KPIs agregados de todas sus campañas
 *   Sección 2..N · Una sección por campaña (KPIs + tendencia + ciudades + devices + fuentes)
 *   Sección final · Insights y recomendaciones globales
 *
 * Enfoque window.print() nativo (mismo que campaña y sitio).
 */

const stamp = () => new Date().toISOString().slice(0, 10);
const fmtNum = (n) => n == null ? '—' : Number(n).toLocaleString('es-CO');
const fmtCOP = (n) => n == null ? '—' : `$ ${Number(n).toLocaleString('es-CO')}`;
const fmtPct = (n) => n == null ? '—' : `${Number(n).toFixed(2)}%`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function kpiCard(label, value, color, hint) {
  return `
    <td style="border:1px solid #e5e7eb;border-radius:8px;padding:14px;width:25%;vertical-align:top">
      <div style="font-size:9px;letter-spacing:0.12em;color:#64748b;text-transform:uppercase;font-weight:700">${label}</div>
      <div style="font-size:22px;font-weight:900;color:${color};margin-top:4px;line-height:1.1">${value}</div>
      ${hint ? `<div style="font-size:9px;color:#94a3b8;margin-top:3px">${hint}</div>` : ''}
    </td>`;
}

function breakdownRows(rows, keyCol, color) {
  if (!rows || rows.length === 0) {
    return `<tr><td colspan="5" style="padding:12px;text-align:center;color:#94a3b8;font-size:10px;font-style:italic">Sin datos</td></tr>`;
  }
  const maxV = Math.max(1, ...rows.map((r) => r.impressions));
  return rows.slice(0, 8).map((r) => {
    const ctr = r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0;
    return `
    <tr>
      <td style="padding:5px 8px;font-size:10px;font-weight:600${keyCol === 'device' ? ';text-transform:capitalize' : ''}">${r[keyCol]}</td>
      <td style="padding:5px 8px;font-size:10px;text-align:right;font-weight:700">${fmtNum(r.impressions)}</td>
      <td style="padding:5px 8px;font-size:10px;text-align:right">${fmtNum(r.clicks)}</td>
      <td style="padding:5px 8px;font-size:10px;text-align:right;color:${ctr >= 2 ? '#15803d' : '#64748b'};font-weight:700">${ctr.toFixed(2)}%</td>
      <td style="padding:5px 8px;width:25%">
        <div style="background:#e5e7eb;height:5px;border-radius:3px;overflow:hidden">
          <div style="width:${(r.impressions / maxV) * 100}%;height:100%;background:${color}"></div>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function campaignSection(fm, idx) {
  const { campaign, resumen, tiempo, byCity, byDevice, bySource } = fm;
  const period = `${fmtDate(campaign.startDate)} — ${fmtDate(campaign.endDate)}`;
  return `
<div style="page-break-after:always;padding:40px">
  <div style="border-bottom:3px solid #15803d;padding-bottom:12px;margin-bottom:18px">
    <div style="font-size:10px;letter-spacing:0.3em;color:#15803d;font-weight:700">CAMPAÑA ${idx + 1}</div>
    <div style="font-size:26px;font-weight:900;letter-spacing:-0.02em">${campaign.nombre}</div>
    <div style="font-size:11px;color:#64748b;margin-top:4px">${campaign.actionType || ''} · ${period} · ${fmtCOP(campaign.priceCOP)} · ${campaign.isActive ? 'Activa' : 'Pausada'}</div>
  </div>

  <table style="width:100%;border-collapse:separate;border-spacing:6px;margin:0 -6px 14px -6px">
    <tr>
      ${kpiCard('Impresiones', fmtNum(resumen.impressions), '#0369a1')}
      ${kpiCard('Clics', fmtNum(resumen.clicks), '#6d28d9')}
      ${kpiCard('CTR', fmtPct(resumen.ctr), resumen.ctr >= 2 ? '#15803d' : '#f59e0b')}
      ${kpiCard('Alcance', fmtNum(resumen.reach), '#0369a1')}
    </tr>
    <tr>
      ${kpiCard('Frecuencia', resumen.frequency ? resumen.frequency.toFixed(2) : '—', '#64748b')}
      ${kpiCard('CPM', resumen.cpm ? fmtCOP(resumen.cpm) : '—', '#f59e0b')}
      ${kpiCard('CPC', resumen.cpc ? fmtCOP(resumen.cpc) : '—', '#f59e0b')}
      ${kpiCard('Leads', fmtNum(resumen.leads), '#15803d')}
    </tr>
  </table>

  <div style="display:table;width:100%;table-layout:fixed;margin-top:10px">
    <div style="display:table-row">
      <div style="display:table-cell;width:50%;padding-right:8px;vertical-align:top">
        <div style="font-size:11px;font-weight:800;color:#0F2A4A;margin-bottom:6px">Ciudades</div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f8fafc"><th style="padding:4px 8px;font-size:8px;text-align:left;color:#475569">CIUDAD</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">IMP.</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">CLICS</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">CTR</th><th style="padding:4px 8px;font-size:8px;text-align:left;color:#475569"></th></tr></thead>
          <tbody>${breakdownRows(byCity, 'city', '#0369a1')}</tbody>
        </table>
      </div>
      <div style="display:table-cell;width:50%;padding-left:8px;vertical-align:top">
        <div style="font-size:11px;font-weight:800;color:#0F2A4A;margin-bottom:6px">Dispositivos</div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f8fafc"><th style="padding:4px 8px;font-size:8px;text-align:left;color:#475569">DEVICE</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">IMP.</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">CLICS</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">CTR</th><th style="padding:4px 8px;font-size:8px;text-align:left;color:#475569"></th></tr></thead>
          <tbody>${breakdownRows(byDevice, 'device', '#6d28d9')}</tbody>
        </table>
      </div>
    </div>
  </div>

  <div style="font-size:11px;font-weight:800;color:#0F2A4A;margin:14px 0 6px">Fuentes de tráfico</div>
  <table style="width:100%;border-collapse:collapse">
    <thead><tr style="background:#f8fafc"><th style="padding:4px 8px;font-size:8px;text-align:left;color:#475569">FUENTE</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">IMP.</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">CLICS</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">CTR</th><th style="padding:4px 8px;font-size:8px;text-align:left;color:#475569"></th></tr></thead>
    <tbody>${breakdownRows(bySource, 'source', '#f59e0b')}</tbody>
  </table>
</div>`;
}

function buildInsights(data) {
  const insights = [];
  const g = data.resumenGlobal;
  if (g.totalImpresiones > 0) {
    if (g.globalCTR >= 3) insights.push(`CTR global excelente (<strong>${fmtPct(g.globalCTR)}</strong>) — la propuesta creativa está funcionando en el conjunto del portafolio.`);
    else if (g.globalCTR < 0.5 && g.totalImpresiones >= 500) insights.push(`CTR global bajo (<strong>${fmtPct(g.globalCTR)}</strong>) — considera renovar creatividades y probar variantes.`);
  }
  if (g.totalLeads > 0 && g.globalCPL) insights.push(`Costo por lead promedio: <strong>${fmtCOP(g.globalCPL)}</strong>. Compara con el LTV típico del anunciante para ver la eficiencia real.`);
  if (data.campaigns.length > 1) {
    const best = [...data.campaigns].filter((c) => c.resumen.impressions >= 50).sort((a, b) => b.resumen.ctr - a.resumen.ctr)[0];
    if (best) insights.push(`Campaña con mejor CTR: <strong>${best.campaign.nombre}</strong> (${fmtPct(best.resumen.ctr)}). Replicar su formato en las demás.`);
  }
  if (g.totalCampanas === 0) insights.push('El anunciante aún no tiene campañas registradas.');
  if (insights.length === 0) insights.push('Datos preliminares — se recomienda acumular más volumen antes de sacar conclusiones fuertes.');
  return insights;
}

function buildRecs(data) {
  const recs = [];
  const g = data.resumenGlobal;
  if (g.totalImpresiones < 500 && g.totalCampanas > 0) recs.push('Aumenta la exposición: menos de 500 impresiones totales impide sacar conclusiones estadísticamente significativas.');
  if (g.totalClicks > 20 && g.totalLeads === 0) recs.push('Hay clicks pero ningún lead — revisa la calidad de la landing page o el formulario de destino.');
  if (data.campaigns.length >= 2) recs.push('Consolida presupuesto en las campañas con mejor CTR y pausa las que llevan tiempo sin generar interacción.');
  if (recs.length === 0) recs.push('Continúa monitoreando y comparando periodo a periodo. Con 3 meses de datos consecutivos podrás detectar patrones estacionales.');
  return recs;
}

function buildHtml(data) {
  const { advertiser, resumenGlobal, campaigns } = data;
  const rangeMin = campaigns.reduce((m, c) => c.campaign.startDate && (!m || c.campaign.startDate < m) ? c.campaign.startDate : m, null);
  const rangeMax = campaigns.reduce((m, c) => c.campaign.endDate && (!m || c.campaign.endDate > m) ? c.campaign.endDate : m, null);
  const rangeLabel = rangeMin && rangeMax ? `${fmtDate(rangeMin)} — ${fmtDate(rangeMax)}` : 'Todas las campañas';
  const generado = new Date().toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const insights = buildInsights(data);
  const recs = buildRecs(data);

  return `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#0F2A4A">
  <!-- PORTADA -->
  <div style="page-break-after:always;padding:60px 40px;background:linear-gradient(135deg,#15803d,#065f46);color:#fff;min-height:920px;position:relative">
    <div style="font-size:14px;letter-spacing:0.3em;opacity:0.8">OÍRCONECTA</div>
    <div style="font-size:12px;letter-spacing:0.1em;opacity:0.6;margin-top:4px">INFORME CONSOLIDADO · CONFIDENCIAL</div>
    <div style="height:2px;background:rgba(255,255,255,0.3);width:60px;margin:32px 0"></div>
    <div style="font-size:12px;letter-spacing:0.15em;opacity:0.8;text-transform:uppercase;margin-bottom:12px">Anunciante</div>
    <div style="font-size:44px;font-weight:900;line-height:1.05;letter-spacing:-0.02em;margin:12px 0 12px">${advertiser.nombre}</div>
    ${advertiser.marcaPrincipal ? `<div style="font-size:16px;opacity:0.9;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:32px">Marca: ${advertiser.marcaPrincipal}</div>` : ''}

    <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:24px;max-width:460px;margin-top:60px">
      <div style="font-size:11px;letter-spacing:0.15em;opacity:0.7;text-transform:uppercase;margin-bottom:8px">Periodo cubierto</div>
      <div style="font-size:20px;font-weight:800;margin-bottom:20px">${rangeLabel}</div>
      <table style="width:100%;color:#fff">
        <tr>
          <td><div style="font-size:10px;opacity:0.7;letter-spacing:0.1em">CAMPAÑAS</div><div style="font-size:24px;font-weight:800">${resumenGlobal.totalCampanas}</div></td>
          <td><div style="font-size:10px;opacity:0.7;letter-spacing:0.1em">ACTIVAS</div><div style="font-size:24px;font-weight:800">${resumenGlobal.activas}</div></td>
          <td><div style="font-size:10px;opacity:0.7;letter-spacing:0.1em">INVERSIÓN</div><div style="font-size:20px;font-weight:800">${fmtCOP(resumenGlobal.inversionTotalCOP)}</div></td>
        </tr>
      </table>
      <div style="font-size:11px;opacity:0.7;margin-top:20px">Generado ${generado}</div>
    </div>

    <div style="position:absolute;bottom:40px;left:40px;right:40px;display:flex;justify-content:space-between;font-size:9px;opacity:0.6;text-transform:uppercase;letter-spacing:0.1em">
      <span>Preparado para el equipo comercial · Compartir con el anunciante</span>
      <span>oirconecta.com</span>
    </div>
  </div>

  <!-- SECCIÓN 1 · CONSOLIDADO -->
  <div style="page-break-after:always;padding:40px">
    <div style="border-bottom:3px solid #15803d;padding-bottom:12px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#15803d;font-weight:700">VISTA CONSOLIDADA</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Resumen del portafolio</div>
    </div>

    <table style="width:100%;border-collapse:separate;border-spacing:8px;margin:0 -8px 20px -8px">
      <tr>
        ${kpiCard('Total impresiones', fmtNum(resumenGlobal.totalImpresiones), '#0369a1')}
        ${kpiCard('Total clicks', fmtNum(resumenGlobal.totalClicks), '#6d28d9')}
        ${kpiCard('CTR global', fmtPct(resumenGlobal.globalCTR), resumenGlobal.globalCTR >= 2 ? '#15803d' : '#f59e0b')}
        ${kpiCard('Leads', fmtNum(resumenGlobal.totalLeads), '#15803d')}
      </tr>
      <tr>
        ${kpiCard('Alcance total', fmtNum(resumenGlobal.totalAlcance), '#0369a1', 'suma alcance por campaña')}
        ${kpiCard('CPM global', resumenGlobal.globalCPM ? fmtCOP(resumenGlobal.globalCPM) : '—', '#f59e0b')}
        ${kpiCard('CPC global', resumenGlobal.globalCPC ? fmtCOP(resumenGlobal.globalCPC) : '—', '#f59e0b')}
        ${kpiCard('CPL global', resumenGlobal.globalCPL ? fmtCOP(resumenGlobal.globalCPL) : '—', '#f59e0b')}
      </tr>
      <tr>
        ${kpiCard('Total campañas', String(resumenGlobal.totalCampanas), '#0F2A4A')}
        ${kpiCard('Activas', String(resumenGlobal.activas), '#15803d')}
        ${kpiCard('Finalizadas', String(resumenGlobal.finalizadas), '#64748b')}
        ${kpiCard('Inversión total', fmtCOP(resumenGlobal.inversionTotalCOP), '#0F2A4A')}
      </tr>
    </table>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin:24px 0 12px">Detalle por campaña</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px;font-size:9px;text-align:left;color:#475569;text-transform:uppercase">Campaña</th>
          <th style="padding:8px;font-size:9px;text-align:left;color:#475569;text-transform:uppercase">Tipo</th>
          <th style="padding:8px;font-size:9px;text-align:right;color:#475569;text-transform:uppercase">Imp.</th>
          <th style="padding:8px;font-size:9px;text-align:right;color:#475569;text-transform:uppercase">Clicks</th>
          <th style="padding:8px;font-size:9px;text-align:right;color:#475569;text-transform:uppercase">CTR</th>
          <th style="padding:8px;font-size:9px;text-align:right;color:#475569;text-transform:uppercase">Inversión</th>
          <th style="padding:8px;font-size:9px;text-align:left;color:#475569;text-transform:uppercase">Estado</th>
        </tr>
      </thead>
      <tbody>
        ${campaigns.map((c) => `
          <tr>
            <td style="padding:6px 8px;font-size:10px;font-weight:700">${c.campaign.nombre}</td>
            <td style="padding:6px 8px;font-size:10px;color:#64748b">${c.campaign.actionType || '—'}</td>
            <td style="padding:6px 8px;font-size:10px;text-align:right">${fmtNum(c.resumen.impressions)}</td>
            <td style="padding:6px 8px;font-size:10px;text-align:right">${fmtNum(c.resumen.clicks)}</td>
            <td style="padding:6px 8px;font-size:10px;text-align:right;color:${c.resumen.ctr >= 2 ? '#15803d' : '#64748b'};font-weight:700">${fmtPct(c.resumen.ctr)}</td>
            <td style="padding:6px 8px;font-size:10px;text-align:right;font-weight:700">${fmtCOP(c.resumen.inversionTotalCOP)}</td>
            <td style="padding:6px 8px;font-size:10px;color:${c.campaign.isActive ? '#15803d' : '#64748b'}">${c.campaign.isActive ? 'Activa' : 'Pausada'}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <!-- Una sección por campaña -->
  ${campaigns.map((fm, i) => campaignSection(fm, i)).join('')}

  <!-- INSIGHTS + RECS -->
  <div style="padding:40px">
    <div style="border-bottom:3px solid #0F2A4A;padding-bottom:12px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#0F2A4A;font-weight:700">CIERRE</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Insights globales y recomendaciones</div>
    </div>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin-bottom:12px">Hallazgos del portafolio</div>
    <ul style="padding-left:20px;margin-bottom:32px">
      ${insights.map((i) => `<li style="margin-bottom:8px;font-size:11px;line-height:1.5">${i}</li>`).join('')}
    </ul>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin-bottom:12px">Recomendaciones</div>
    ${recs.map((r, i) => `
      <div style="background:#f0fdf4;border-left:3px solid #15803d;padding:10px 14px;margin-bottom:6px;font-size:11px;line-height:1.5">
        <strong style="color:#15803d">${i + 1}.</strong> ${r}
      </div>`).join('')}

    <div style="margin-top:60px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:9px;color:#94a3b8;text-align:center">
      Informe generado automáticamente por OírConecta · Datos first-party bajo Ley 1581 (habeas data).<br/>
      Documento confidencial preparado por el equipo comercial para compartir con el responsable de marketing del anunciante.
    </div>
  </div>
</div>`;
}

export async function downloadAdvertiserPdf(data) {
  const html = buildHtml(data);
  const slug = (data.advertiser.nombre || 'anunciante').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  const filename = `informe-consolidado_${slug}_${stamp()}`;

  const printHtml = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>${filename}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: #fff; font-family: 'Helvetica Neue', Arial, sans-serif; color: #0F2A4A; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } }
  .no-print {
    position: fixed; top: 12px; right: 12px; z-index: 9999;
    background: #15803d; color: #fff; padding: 10px 18px;
    border-radius: 8px; font-weight: 700; border: none; cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-size: 14px;
  }
</style></head><body>
<button class="no-print" onclick="window.print()">🖨 Imprimir / Guardar como PDF</button>
${html}
<script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 400); });</script>
</body></html>`;

  const win = window.open('', '_blank', 'width=1000,height=800');
  if (!win) {
    const blob = new Blob([printHtml], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    alert('Se descargó el informe como HTML — ábrelo y usa "Imprimir → Guardar como PDF".');
    return;
  }
  win.document.write(printHtml);
  win.document.close();
}
