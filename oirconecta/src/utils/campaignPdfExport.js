/**
 * D5 — PDF ejecutivo por campaña individual (informe para el anunciante).
 *
 * Recibe el objeto que devuelve /api/marketing/admin/campaigns/:id/full-metrics
 * y genera un PDF A4 portrait con:
 *   Portada — logo/nombre campaña/anunciante/periodo
 *   1. Resumen ejecutivo (KPIs: impresiones, clicks, CTR, alcance, frecuencia,
 *      CPM, CPC, CPL, leads, inversión, ritmo, proyección)
 *   2. Tendencia diaria
 *   3. Ciudades donde se sirvió
 *   4. Dispositivos
 *   5. Fuentes que la vieron
 *   6. Insights automáticos + recomendaciones
 */

import html2pdf from 'html2pdf.js';

const stamp = () => new Date().toISOString().slice(0, 10);
const fmtNum = (n) => n == null ? '—' : Number(n).toLocaleString('es-CO');
const fmtCOP = (n) => n == null ? '—' : `$ ${Number(n).toLocaleString('es-CO')}`;
const fmtPct = (n) => n == null ? '—' : `${Number(n).toFixed(2)}%`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function kpiCard(label, value, color, hint) {
  return `
    <td style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;width:25%;vertical-align:top">
      <div style="font-size:9px;letter-spacing:0.12em;color:#64748b;text-transform:uppercase;font-weight:700">${label}</div>
      <div style="font-size:20px;font-weight:900;color:${color};margin-top:4px;line-height:1.1">${value}</div>
      ${hint ? `<div style="font-size:9px;color:#94a3b8;margin-top:3px">${hint}</div>` : ''}
    </td>`;
}
function kpiRow(cards) {
  return `<tr>${cards}</tr>`;
}

function buildInsights(d) {
  const insights = [];
  const { resumen, tiempo, byCity, byDevice, bySource, campaign } = d;

  // Ciudad top
  if (byCity?.length > 0) {
    const totalImp = byCity.reduce((a, c) => a + c.impressions, 0);
    const top = byCity[0];
    if (totalImp > 0 && top.impressions > 0) {
      const pct = Math.round((top.impressions / totalImp) * 100);
      insights.push(`El <strong>${pct}%</strong> de las impresiones se sirvió en <strong>${top.city}</strong> (${fmtNum(top.impressions)} de ${fmtNum(totalImp)}). Si esta ciudad no es prioridad, evalúa segmentar geográficamente para mejor eficiencia.`);
    }
  }
  // Device top con CTR
  if (byDevice?.length > 0) {
    const totalImp = byDevice.reduce((a, d) => a + d.impressions, 0);
    if (totalImp > 0) {
      const top = [...byDevice].sort((a, b) => b.impressions - a.impressions)[0];
      const pct = Math.round((top.impressions / totalImp) * 100);
      const ctr = top.impressions > 0 ? (top.clicks / top.impressions) * 100 : 0;
      insights.push(`El <strong>${pct}%</strong> de las impresiones son en <strong>${top.device}</strong> con CTR de <strong>${ctr.toFixed(2)}%</strong>. Asegura que la creatividad esté optimizada para ese tipo de pantalla.`);
    }
  }
  // CTR bueno/malo
  if (resumen.impressions >= 100) {
    if (resumen.ctr >= 3) {
      insights.push(`El CTR de <strong>${fmtPct(resumen.ctr)}</strong> está por encima del promedio de la industria (~1-2%). La creatividad y ubicación están funcionando bien.`);
    } else if (resumen.ctr < 0.5) {
      insights.push(`El CTR de <strong>${fmtPct(resumen.ctr)}</strong> está por debajo del promedio (~1-2%). Considera revisar el mensaje, imagen o llamado a la acción.`);
    }
  }
  // Frecuencia
  if (resumen.frequency >= 5) {
    insights.push(`Frecuencia media de <strong>${resumen.frequency}</strong> impresiones por usuario — hay riesgo de fatiga publicitaria. Considera rotar creatividades o limitar frecuencia.`);
  } else if (resumen.frequency > 0 && resumen.frequency < 1.5) {
    insights.push(`Frecuencia baja (<strong>${resumen.frequency}</strong> imp/usuario) — la audiencia es amplia pero puede necesitar más exposición para recordar el mensaje.`);
  }
  // Ritmo vs objetivo
  if (tiempo.projectedImpressions > 0 && !tiempo.finished) {
    const ratio = (tiempo.projectedImpressions / resumen.impressions) * (tiempo.daysElapsed / tiempo.daysTotal);
    // no muy útil sin objetivo pactado, solo si podemos afirmar algo
    insights.push(`Al ritmo actual (<strong>${fmtNum(tiempo.dailyPace)} impresiones/día</strong>), la campaña cerrará con aproximadamente <strong>${fmtNum(tiempo.projectedImpressions)} impresiones totales</strong>.`);
  }
  return insights;
}

function buildRecommendations(d) {
  const recs = [];
  const { resumen, byCity, byDevice, tiempo } = d;

  if (resumen.impressions < 50) {
    recs.push('Aún es temprano para conclusiones fuertes: espera al menos 500 impresiones antes de tomar decisiones importantes.');
  }
  if (byCity?.length > 3) {
    const totalImp = byCity.reduce((a, c) => a + c.impressions, 0);
    const desconocida = byCity.find((c) => c.city === '(Desconocida)');
    if (desconocida && totalImp > 0 && desconocida.impressions / totalImp > 0.4) {
      recs.push('Más del 40% de las impresiones no tienen ciudad detectada. Considera usar Cloudflare o un proveedor de geo-IP dedicado para mejorar el dato.');
    }
  }
  if (resumen.ctr > 0 && resumen.ctr < 1 && resumen.impressions > 200) {
    recs.push('CTR bajo: prueba variantes de imagen y titular. Un A/B test con 2-3 variantes por 3 días típicamente identifica el ganador.');
  }
  if (resumen.leads === 0 && resumen.clicks > 20) {
    recs.push('Recibes clicks pero no leads: revisa la landing page — puede ser lenta, poco clara o el formulario muy largo. Prioriza mejorar la conversión post-click.');
  }
  if (!tiempo.finished && tiempo.daysRemaining > 0 && tiempo.dailyPace > 0) {
    const projectedFinal = tiempo.dailyPace * tiempo.daysTotal;
    if (projectedFinal < resumen.impressions * 1.5) {
      // Nada realmente accionable, saltar
    }
  }
  if (recs.length === 0) {
    recs.push('La campaña muestra métricas saludables. Continúa monitoreando y compara con el próximo periodo para detectar tendencias.');
  }
  return recs;
}

function buildHtml(data) {
  const { campaign, range, resumen, tiempo, dailyTrend, byCity, byDevice, bySource } = data;
  const rangeLabel = `${fmtDate(range.from)} — ${fmtDate(range.to)}`;
  const generado = new Date().toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const insights = buildInsights(data);
  const recs = buildRecommendations(data);

  // Tendencia (últimos 14)
  const trend14 = (dailyTrend || []).slice(-14);
  const maxImp = Math.max(1, ...trend14.map((d) => d.impressions));
  const trendRows = trend14.map((d) => `
    <tr>
      <td style="padding:5px 8px;font-size:10px">${d.date.slice(5)}</td>
      <td style="padding:5px 8px;font-size:10px;text-align:right;font-weight:700">${fmtNum(d.impressions)}</td>
      <td style="padding:5px 8px;font-size:10px;text-align:right">${fmtNum(d.clicks)}</td>
      <td style="padding:5px 8px;font-size:10px;text-align:right">${fmtNum(d.leads)}</td>
      <td style="padding:5px 8px;width:35%">
        <div style="background:#e5e7eb;height:6px;border-radius:3px;overflow:hidden">
          <div style="width:${(d.impressions / maxImp) * 100}%;height:100%;background:#15803d"></div>
        </div>
      </td>
    </tr>`).join('') || `<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8;font-size:11px;font-style:italic">Sin métricas diarias</td></tr>`;

  const breakdownTable = (rows, keyCol, keyLabel, color) => {
    const maxV = Math.max(1, ...rows.map((r) => r.impressions));
    return rows.length === 0
      ? `<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8;font-size:11px;font-style:italic">Sin datos aún</td></tr>`
      : rows.slice(0, 10).map((r) => {
          const ctr = r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0;
          return `
          <tr>
            <td style="padding:6px 8px;font-size:10px;font-weight:600${keyCol === 'device' ? ';text-transform:capitalize' : ''}">${r[keyCol]}</td>
            <td style="padding:6px 8px;font-size:10px;text-align:right;font-weight:700">${fmtNum(r.impressions)}</td>
            <td style="padding:6px 8px;font-size:10px;text-align:right">${fmtNum(r.clicks)}</td>
            <td style="padding:6px 8px;font-size:10px;text-align:right;color:${ctr >= 2 ? '#15803d' : '#64748b'};font-weight:700">${ctr.toFixed(2)}%</td>
            <td style="padding:6px 8px;width:25%">
              <div style="background:#e5e7eb;height:6px;border-radius:3px;overflow:hidden">
                <div style="width:${(r.impressions / maxV) * 100}%;height:100%;background:${color}"></div>
              </div>
            </td>
          </tr>`;
        }).join('');
  };

  const insightsHtml = insights.length > 0
    ? insights.map((i) => `<li style="margin-bottom:8px;font-size:11px;line-height:1.5">${i}</li>`).join('')
    : '<li style="font-size:11px;color:#64748b">Aún no hay suficientes datos para insights automáticos.</li>';

  const recsHtml = recs.map((r, i) => `
    <div style="background:#f0fdf4;border-left:3px solid #15803d;padding:10px 14px;margin-bottom:6px;font-size:11px;line-height:1.5">
      <strong style="color:#15803d">${i + 1}.</strong> ${r}
    </div>`).join('');

  return `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#0F2A4A">
  <!-- PORTADA -->
  <div style="page-break-after:always;padding:60px 40px;background:linear-gradient(135deg,#15803d,#065f46);color:#fff;min-height:920px;position:relative">
    <div style="font-size:14px;letter-spacing:0.3em;opacity:0.8">OÍRCONECTA</div>
    <div style="font-size:12px;letter-spacing:0.1em;opacity:0.6;margin-top:4px">INFORME DE CAMPAÑA · CONFIDENCIAL</div>
    <div style="height:2px;background:rgba(255,255,255,0.3);width:60px;margin:32px 0"></div>
    <div style="font-size:12px;letter-spacing:0.15em;opacity:0.8;text-transform:uppercase;margin-bottom:12px">Anunciante</div>
    <div style="font-size:22px;font-weight:800;margin-bottom:32px">${campaign.advertiser?.nombre || '—'}</div>
    <div style="font-size:44px;font-weight:900;line-height:1.05;letter-spacing:-0.02em;margin:24px 0 12px">${campaign.nombre}</div>
    <div style="font-size:14px;opacity:0.9;margin-bottom:60px;text-transform:uppercase;letter-spacing:0.1em">${campaign.actionType || ''}</div>

    <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:24px;max-width:400px;margin-top:60px">
      <div style="font-size:11px;letter-spacing:0.15em;opacity:0.7;text-transform:uppercase;margin-bottom:8px">Periodo analizado</div>
      <div style="font-size:20px;font-weight:800;margin-bottom:16px">${rangeLabel}</div>
      <div style="display:flex;gap:24px;margin-top:16px">
        <div><div style="font-size:10px;opacity:0.7;letter-spacing:0.1em">DÍAS</div><div style="font-size:24px;font-weight:800">${tiempo.daysElapsed}/${tiempo.daysTotal}</div></div>
        <div><div style="font-size:10px;opacity:0.7;letter-spacing:0.1em">PROGRESO</div><div style="font-size:24px;font-weight:800">${tiempo.progressPct}%</div></div>
        <div><div style="font-size:10px;opacity:0.7;letter-spacing:0.1em">INVERSIÓN</div><div style="font-size:20px;font-weight:800">${fmtCOP(resumen.inversionTotalCOP)}</div></div>
      </div>
      <div style="font-size:11px;opacity:0.7;margin-top:20px">Generado ${generado}</div>
    </div>

    <div style="position:absolute;bottom:40px;left:40px;right:40px;display:flex;justify-content:space-between;font-size:9px;opacity:0.6;text-transform:uppercase;letter-spacing:0.1em">
      <span>Uso interno · Compartir con el anunciante</span>
      <span>oirconecta.com</span>
    </div>
  </div>

  <!-- SECCIÓN 1 · RESUMEN -->
  <div style="page-break-after:always;padding:40px">
    <div style="border-bottom:3px solid #15803d;padding-bottom:12px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#15803d;font-weight:700">SECCIÓN 1</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Resumen ejecutivo</div>
    </div>

    <table style="width:100%;border-collapse:separate;border-spacing:8px;margin-bottom:16px;margin-left:-8px">
      ${kpiRow(kpiCard('Impresiones', fmtNum(resumen.impressions), '#0369a1') +
        kpiCard('Clics', fmtNum(resumen.clicks), '#6d28d9') +
        kpiCard('CTR', fmtPct(resumen.ctr), resumen.ctr >= 2 ? '#15803d' : '#f59e0b') +
        kpiCard('Leads', fmtNum(resumen.leads), '#15803d'))}
      ${kpiRow(kpiCard('Alcance único', fmtNum(resumen.reach), '#0369a1', 'usuarios distintos') +
        kpiCard('Frecuencia', resumen.frequency ? resumen.frequency.toFixed(2) : '—', '#64748b', 'imp/usuario') +
        kpiCard('CPM', resumen.cpm ? fmtCOP(resumen.cpm) : '—', '#f59e0b', 'por 1000 impresiones') +
        kpiCard('CPC', resumen.cpc ? fmtCOP(resumen.cpc) : '—', '#f59e0b', 'por click'))}
      ${kpiRow(kpiCard('CPL', resumen.cpl ? fmtCOP(resumen.cpl) : '—', '#f59e0b', 'por lead') +
        kpiCard('Inversión total', fmtCOP(resumen.inversionTotalCOP), '#0F2A4A') +
        kpiCard('Ritmo diario', fmtNum(tiempo.dailyPace), '#0369a1', 'impresiones/día') +
        kpiCard('Proyección total', fmtNum(tiempo.projectedImpressions), '#6d28d9', 'al final del periodo'))}
    </table>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin:32px 0 12px">Tendencia diaria (últimos 14 días)</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Fecha</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Impresiones</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Clics</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Leads</th>
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Volumen</th>
        </tr>
      </thead>
      <tbody>${trendRows}</tbody>
    </table>
  </div>

  <!-- SECCIÓN 2 · CIUDADES -->
  <div style="page-break-after:always;padding:40px">
    <div style="border-bottom:3px solid #0369a1;padding-bottom:12px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#0369a1;font-weight:700">SECCIÓN 2</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Distribución geográfica</div>
    </div>
    <div style="font-size:11px;color:#64748b;margin-bottom:16px">Ciudades donde se sirvió la creatividad y cómo respondieron. Los sin geo aparecen como "(Desconocida)".</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Ciudad</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Impresiones</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Clics</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">CTR</th>
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Volumen</th>
        </tr>
      </thead>
      <tbody>${breakdownTable(byCity || [], 'city', 'Ciudad', '#0369a1')}</tbody>
    </table>
  </div>

  <!-- SECCIÓN 3 · DISPOSITIVOS -->
  <div style="page-break-after:always;padding:40px">
    <div style="border-bottom:3px solid #6d28d9;padding-bottom:12px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#6d28d9;font-weight:700">SECCIÓN 3</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Dispositivos</div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Dispositivo</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Impresiones</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Clics</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">CTR</th>
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Volumen</th>
        </tr>
      </thead>
      <tbody>${breakdownTable(byDevice || [], 'device', 'Device', '#6d28d9')}</tbody>
    </table>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin:32px 0 12px">Fuentes de tráfico</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Fuente</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Impresiones</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Clics</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">CTR</th>
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Volumen</th>
        </tr>
      </thead>
      <tbody>${breakdownTable(bySource || [], 'source', 'Fuente', '#f59e0b')}</tbody>
    </table>
  </div>

  <!-- SECCIÓN 4 · INSIGHTS -->
  <div style="padding:40px">
    <div style="border-bottom:3px solid #0F2A4A;padding-bottom:12px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#0F2A4A;font-weight:700">SECCIÓN 4</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Análisis y recomendaciones</div>
    </div>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin-bottom:12px">Hallazgos clave</div>
    <ul style="padding-left:20px;margin-bottom:32px">${insightsHtml}</ul>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin-bottom:12px">Recomendaciones</div>
    ${recsHtml}

    <div style="margin-top:60px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:9px;color:#94a3b8;text-align:center">
      Informe generado automáticamente por OírConecta · Datos first-party bajo Ley 1581 (habeas data).<br/>
      Documento confidencial destinado al anunciante y al equipo comercial de OírConecta.
    </div>
  </div>
</div>`;
}

export async function downloadCampaignPdf(data) {
  const html = buildHtml(data);
  const el = document.createElement('div');
  el.innerHTML = html;
  // El contenedor debe estar dentro del viewport para que html2canvas lo
  // renderice correctamente. Lo hacemos invisible con opacity y sin
  // interacciones, y lo empujamos detrás del contenido con z-index negativo.
  el.style.cssText = 'width:210mm;position:fixed;left:0;top:0;opacity:0.001;pointer-events:none;z-index:-9999;background:#fff';
  document.body.appendChild(el);

  const filename = `campania_${(data.campaign.slug || data.campaign.id).slice(0, 40)}_${stamp()}.pdf`;

  try {
    await html2pdf().set({
      margin: 0,
      filename,
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['css', 'legacy'] },
    }).from(el).save();
  } finally {
    document.body.removeChild(el);
  }
}
