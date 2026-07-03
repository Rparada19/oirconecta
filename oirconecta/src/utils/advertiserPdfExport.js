/**
 * D6 — PDF consolidado por anunciante (v2 · diseño rico + narrativa).
 *
 * Contenido:
 *   Portada — logo, nombre, marca, KPIs top, score semáforo
 *   Resumen narrativo — 1 párrafo con lectura del periodo
 *   Vista consolidada — 12 KPIs + benchmarks industria + tabla campañas
 *   Una sección por campaña — KPIs + ciudad + device + fuentes
 *   Cierre — Insights + Recomendaciones + Próximos pasos concretos
 *
 * window.print() nativo → el usuario elige "Guardar como PDF" en el diálogo.
 */

const stamp = () => new Date().toISOString().slice(0, 10);
const fmtNum = (n) => n == null ? '—' : Number(n).toLocaleString('es-CO');
const fmtCOP = (n) => n == null ? '—' : `$ ${Number(n).toLocaleString('es-CO')}`;
const fmtPct = (n) => n == null ? '—' : `${Number(n).toFixed(2)}%`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateLong = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

// Benchmarks referenciales industria display Colombia 2025-2026
const BENCH = {
  ctr: { excellent: 3, good: 1.5, floor: 0.5, industry: 1.5 },
  cpm: { good: 12000, industry: 15000, high: 30000 },
  frequency: { low: 1.5, healthy: 3, fatigue: 5 },
};

function scoreCampaign(resumen) {
  // Score simple 0-100 combinando CTR, frecuencia y volumen mínimo
  if (!resumen || resumen.impressions === 0) return { score: null, label: 'Sin datos', color: '#94a3b8' };
  if (resumen.impressions < 50) return { score: null, label: 'Volumen insuficiente', color: '#94a3b8' };
  let s = 0;
  // CTR (60% peso)
  if (resumen.ctr >= BENCH.ctr.excellent) s += 60;
  else if (resumen.ctr >= BENCH.ctr.good) s += 40;
  else if (resumen.ctr >= BENCH.ctr.floor) s += 20;
  // Frecuencia saludable (20%)
  if (resumen.frequency >= BENCH.frequency.low && resumen.frequency <= BENCH.frequency.fatigue) s += 20;
  else if (resumen.frequency > 0) s += 10;
  // Volumen respetable (20%)
  if (resumen.impressions >= 1000) s += 20;
  else if (resumen.impressions >= 200) s += 10;

  let label = 'Bajo', color = '#dc2626';
  if (s >= 80) { label = 'Excelente'; color = '#15803d'; }
  else if (s >= 60) { label = 'Bueno';     color = '#0369a1'; }
  else if (s >= 40) { label = 'Mejorable'; color = '#f59e0b'; }
  return { score: s, label, color };
}

function overallScore(resumenGlobal) {
  if (!resumenGlobal || resumenGlobal.totalImpresiones < 100) {
    return { label: 'Datos preliminares', color: '#94a3b8', description: 'Aún no hay volumen suficiente para una lectura confiable. Recomendamos esperar al menos 500 impresiones antes de tomar decisiones fuertes.' };
  }
  const ctr = resumenGlobal.globalCTR || 0;
  if (ctr >= 3) return { label: 'Excelente', color: '#15803d', description: 'La estrategia publicitaria está funcionando muy por encima del promedio de la industria. Se recomienda mantener el ritmo y considerar ampliar la inversión para escalar los buenos resultados.' };
  if (ctr >= 1.5) return { label: 'Bueno', color: '#0369a1', description: 'El desempeño está en el rango esperado de la industria en Colombia. Existen oportunidades específicas para elevarlo mediante iteración de creatividades y segmentación más fina.' };
  if (ctr >= 0.5) return { label: 'Mejorable', color: '#f59e0b', description: 'El rendimiento está por debajo del promedio de la industria. Recomendamos revisar los mensajes, las creatividades y los tipos de acción para identificar el cuello de botella.' };
  return { label: 'Requiere atención', color: '#dc2626', description: 'El CTR es notoriamente bajo. Sugerimos pausar las creatividades con menor rendimiento y trabajar en una nueva propuesta antes de continuar con la inversión.' };
}

function kpiCard(label, value, color, hint) {
  return `
    <td style="border:1px solid #e5e7eb;border-radius:8px;padding:14px;width:25%;vertical-align:top">
      <div style="font-size:9px;letter-spacing:0.12em;color:#64748b;text-transform:uppercase;font-weight:700">${label}</div>
      <div style="font-size:22px;font-weight:900;color:${color};margin-top:4px;line-height:1.1">${value}</div>
      ${hint ? `<div style="font-size:9px;color:#94a3b8;margin-top:4px">${hint}</div>` : ''}
    </td>`;
}

function benchmarkRow(label, value, benchmarkText, verdict) {
  const colors = { good: '#15803d', neutral: '#0369a1', bad: '#f59e0b' };
  return `
    <tr>
      <td style="padding:8px 10px;font-size:11px;color:#0F2A4A;font-weight:600">${label}</td>
      <td style="padding:8px 10px;font-size:14px;font-weight:800;color:${colors[verdict] || '#0F2A4A'}">${value}</td>
      <td style="padding:8px 10px;font-size:10px;color:#64748b">${benchmarkText}</td>
    </tr>`;
}

function breakdownRows(rows, keyCol, color) {
  if (!rows || rows.length === 0) return `<tr><td colspan="5" style="padding:12px;text-align:center;color:#94a3b8;font-size:10px;font-style:italic">Sin datos</td></tr>`;
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
  const score = scoreCampaign(resumen);
  const badge = score.score != null
    ? `<span style="background:${score.color}15;color:${score.color};padding:4px 12px;border-radius:20px;font-size:11px;font-weight:800">${score.label} · ${score.score}/100</span>`
    : `<span style="background:#f1f5f9;color:#64748b;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700">${score.label}</span>`;

  return `
<div style="page-break-after:always;padding:40px">
  <div style="border-bottom:3px solid #15803d;padding-bottom:14px;margin-bottom:20px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px">
      <div style="flex:1">
        <div style="font-size:10px;letter-spacing:0.3em;color:#15803d;font-weight:700">CAMPAÑA ${idx + 1}</div>
        <div style="font-size:26px;font-weight:900;letter-spacing:-0.02em;margin-top:4px">${campaign.nombre}</div>
        <div style="font-size:11px;color:#64748b;margin-top:6px">${campaign.actionType || ''} · ${period} · ${fmtCOP(campaign.priceCOP)} · ${campaign.isActive ? 'Activa' : 'Pausada'}</div>
      </div>
      ${badge}
    </div>
  </div>

  <table style="width:100%;border-collapse:separate;border-spacing:6px;margin:0 -6px 14px -6px">
    <tr>
      ${kpiCard('Impresiones', fmtNum(resumen.impressions), '#0369a1')}
      ${kpiCard('Clics', fmtNum(resumen.clicks), '#6d28d9')}
      ${kpiCard('CTR', fmtPct(resumen.ctr), resumen.ctr >= BENCH.ctr.good ? '#15803d' : '#f59e0b')}
      ${kpiCard('Alcance único', fmtNum(resumen.reach), '#0369a1')}
    </tr>
    <tr>
      ${kpiCard('Frecuencia', resumen.frequency ? resumen.frequency.toFixed(2) : '—', resumen.frequency >= BENCH.frequency.fatigue ? '#dc2626' : '#64748b', resumen.frequency >= BENCH.frequency.fatigue ? 'riesgo fatiga' : 'imp/usuario')}
      ${kpiCard('CPM', resumen.cpm ? fmtCOP(resumen.cpm) : '—', '#f59e0b')}
      ${kpiCard('CPC', resumen.cpc ? fmtCOP(resumen.cpc) : '—', '#f59e0b')}
      ${kpiCard('Leads', fmtNum(resumen.leads), '#15803d')}
    </tr>
  </table>

  <table style="width:100%;border-collapse:separate;border-spacing:0 8px">
    <tr>
      <td style="width:50%;vertical-align:top;padding-right:8px">
        <div style="font-size:11px;font-weight:800;color:#0F2A4A;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">Ciudades</div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f8fafc"><th style="padding:4px 8px;font-size:8px;text-align:left;color:#475569">CIUDAD</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">IMP.</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">CLICS</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">CTR</th><th style="padding:4px 8px;font-size:8px;text-align:left;color:#475569"></th></tr></thead>
          <tbody>${breakdownRows(byCity, 'city', '#0369a1')}</tbody>
        </table>
      </td>
      <td style="width:50%;vertical-align:top;padding-left:8px">
        <div style="font-size:11px;font-weight:800;color:#0F2A4A;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.05em">Dispositivos</div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f8fafc"><th style="padding:4px 8px;font-size:8px;text-align:left;color:#475569">DEVICE</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">IMP.</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">CLICS</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">CTR</th><th style="padding:4px 8px;font-size:8px;text-align:left;color:#475569"></th></tr></thead>
          <tbody>${breakdownRows(byDevice, 'device', '#6d28d9')}</tbody>
        </table>
      </td>
    </tr>
  </table>

  <div style="font-size:11px;font-weight:800;color:#0F2A4A;margin:14px 0 6px;text-transform:uppercase;letter-spacing:0.05em">Fuentes de tráfico</div>
  <table style="width:100%;border-collapse:collapse">
    <thead><tr style="background:#f8fafc"><th style="padding:4px 8px;font-size:8px;text-align:left;color:#475569">FUENTE</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">IMP.</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">CLICS</th><th style="padding:4px 8px;font-size:8px;text-align:right;color:#475569">CTR</th><th style="padding:4px 8px;font-size:8px;text-align:left;color:#475569"></th></tr></thead>
    <tbody>${breakdownRows(bySource, 'source', '#f59e0b')}</tbody>
  </table>
</div>`;
}

function buildNarrative(data) {
  const { advertiser, resumenGlobal, campaigns } = data;
  const g = resumenGlobal;
  const nombre = advertiser.nombre;
  const nCamp = campaigns.length;
  const activas = g.activas || 0;

  if (nCamp === 0) return `<strong>${nombre}</strong> aún no tiene campañas registradas en el sistema. Este informe se activará automáticamente cuando la primera campaña esté activa y comience a acumular impresiones.`;

  const partes = [];
  partes.push(`En el periodo cubierto por este informe, <strong>${nombre}</strong> ha ejecutado <strong>${nCamp} campaña${nCamp > 1 ? 's' : ''}</strong> ${activas > 0 ? `(${activas} activa${activas > 1 ? 's' : ''})` : ''} en el ecosistema OírConecta.`);
  if (g.totalImpresiones > 0) {
    partes.push(`Las creatividades generaron <strong>${fmtNum(g.totalImpresiones)} impresiones</strong> con un <strong>alcance total agregado de ${fmtNum(g.totalAlcance)} usuarios distintos</strong>.`);
  }
  if (g.totalClicks > 0) {
    partes.push(`Se registraron <strong>${fmtNum(g.totalClicks)} interacciones</strong>, produciendo un CTR global de <strong>${fmtPct(g.globalCTR)}</strong>${g.globalCTR >= BENCH.ctr.industry ? ` — por encima del promedio referencial de la industria display en Colombia (~${BENCH.ctr.industry}%)` : ` — por debajo del promedio referencial de la industria display en Colombia (~${BENCH.ctr.industry}%)`}.`);
  }
  if (g.totalLeads > 0) {
    partes.push(`Adicionalmente, la actividad convirtió <strong>${g.totalLeads} lead${g.totalLeads > 1 ? 's' : ''}</strong> con un costo promedio de <strong>${fmtCOP(g.globalCPL)} por lead</strong>.`);
  }
  if (g.inversionTotalCOP > 0) {
    partes.push(`La inversión total del portafolio en este periodo fue de <strong>${fmtCOP(g.inversionTotalCOP)}</strong>.`);
  }
  return partes.join(' ');
}

function buildInsights(data) {
  const insights = [];
  const g = data.resumenGlobal;

  if (g.totalImpresiones === 0) {
    insights.push('Aún no hay impresiones registradas en el sistema — la campaña puede estar por iniciar o requerir revisión de configuración de tracking.');
    return insights;
  }

  // CTR vs benchmark industria
  if (g.globalCTR >= BENCH.ctr.excellent) {
    insights.push(`<strong>CTR excepcional (${fmtPct(g.globalCTR)})</strong> — significativamente por encima del promedio de la industria display en Colombia (${BENCH.ctr.industry}%). La combinación de creatividad, ubicación y audiencia está funcionando muy bien.`);
  } else if (g.globalCTR >= BENCH.ctr.good) {
    insights.push(`<strong>CTR saludable (${fmtPct(g.globalCTR)})</strong> — en línea con el rango esperado de la industria (${BENCH.ctr.industry}%). Existe margen para optimizar mediante A/B testing de creatividades.`);
  } else if (g.globalCTR >= BENCH.ctr.floor && g.totalImpresiones >= 500) {
    insights.push(`<strong>CTR por debajo del promedio (${fmtPct(g.globalCTR)} vs ${BENCH.ctr.industry}% industria)</strong> — recomendamos renovar las creatividades, revisar el copy y considerar segmentaciones más específicas.`);
  } else if (g.totalImpresiones >= 500) {
    insights.push(`<strong>CTR bajo (${fmtPct(g.globalCTR)})</strong> — muy por debajo del referente de industria. Sugerimos una revisión integral de la propuesta creativa y de la estrategia de ubicación.`);
  }

  // CPM vs benchmark
  if (g.globalCPM != null) {
    if (g.globalCPM < BENCH.cpm.good) {
      insights.push(`<strong>CPM competitivo (${fmtCOP(g.globalCPM)})</strong> — el costo por mil impresiones está por debajo del promedio del mercado colombiano (~${fmtCOP(BENCH.cpm.industry)}).`);
    } else if (g.globalCPM > BENCH.cpm.high) {
      insights.push(`<strong>CPM elevado (${fmtCOP(g.globalCPM)})</strong> — está por encima del rango normal en Colombia. Con volúmenes bajos el CPM se distorsiona; se estabilizará cuando aumenten las impresiones.`);
    }
  }

  // Frecuencia (fatiga)
  const highFreq = data.campaigns.filter((c) => c.resumen.frequency >= BENCH.frequency.fatigue);
  if (highFreq.length > 0) {
    insights.push(`<strong>Alerta de fatiga publicitaria</strong> en ${highFreq.length} campaña${highFreq.length > 1 ? 's' : ''}: la frecuencia media supera ${BENCH.frequency.fatigue} impresiones por usuario, momento en que los estudios muestran caída del CTR. Considera rotar creatividades o ampliar la audiencia.`);
  }

  // Mejor campaña
  if (data.campaigns.length > 1) {
    const eligibles = data.campaigns.filter((c) => c.resumen.impressions >= 50);
    if (eligibles.length > 0) {
      const best = [...eligibles].sort((a, b) => b.resumen.ctr - a.resumen.ctr)[0];
      insights.push(`La campaña con mejor rendimiento es <strong>${best.campaign.nombre}</strong> con CTR de ${fmtPct(best.resumen.ctr)}. Se recomienda replicar su formato, creatividad y ubicación en las demás.`);
    }
  }

  // Conversión de clicks a leads
  if (g.totalClicks > 20 && g.totalLeads === 0) {
    insights.push(`Los clicks (${fmtNum(g.totalClicks)}) no están convirtiendo en leads. El problema típicamente no está en la campaña sino <strong>post-click</strong>: página de destino lenta, formulario largo o mensaje incongruente.`);
  }

  return insights;
}

function buildRecs(data) {
  const recs = [];
  const g = data.resumenGlobal;
  if (g.totalImpresiones < 500 && g.totalCampanas > 0) {
    recs.push('Ampliar la ventana de exposición: menos de 500 impresiones totales no permite conclusiones estadísticamente significativas. Sugerimos mantener las campañas activas durante al menos 30 días o incrementar la inversión.');
  }
  if (g.totalClicks > 20 && g.totalLeads === 0) {
    recs.push('Auditar la landing page o formulario de destino. Con la cantidad de clicks registrados debería haber al menos 1-3 leads. Revisar velocidad, claridad del mensaje y número de campos requeridos.');
  }
  if (data.campaigns.length >= 2) {
    recs.push('Consolidar el presupuesto en las campañas con mejor CTR (score ≥ 60/100). Pausar o rediseñar las que llevan tiempo activas con bajo rendimiento.');
  }
  const highFreq = data.campaigns.filter((c) => c.resumen.frequency >= BENCH.frequency.fatigue);
  if (highFreq.length > 0) {
    recs.push(`Rotar creatividades en ${highFreq.length} campaña${highFreq.length > 1 ? 's' : ''} con frecuencia alta. Preparar 2-3 variantes de imagen/copy y alternarlas cada semana.`);
  }
  if (g.totalImpresiones >= 500 && g.globalCTR < BENCH.ctr.good) {
    recs.push('Ejecutar un A/B test con al menos 2 variantes de creatividad durante 5-7 días. Retirar la variante con menor CTR y escalar la ganadora.');
  }
  if (recs.length === 0) {
    recs.push('Continuar monitoreando el desempeño y comparar periodo a periodo. Con tres meses de datos consecutivos se detectarán patrones estacionales que permiten anticipar la estrategia trimestre a trimestre.');
  }
  return recs;
}

function buildNextSteps(data) {
  const steps = [];
  const g = data.resumenGlobal;

  if (g.totalCampanas === 0) {
    steps.push('Lanzar la primera campaña activa con al menos $500.000 de inversión para acumular volumen suficiente.');
  } else if (g.totalImpresiones < 500) {
    steps.push('Mantener las campañas actuales activas al menos 15 días adicionales para llegar al umbral de 500 impresiones.');
  } else {
    steps.push('Revisar en 15 días la evolución de los KPIs y comparar contra este informe.');
  }

  if (data.campaigns.length >= 1 && g.globalCTR < BENCH.ctr.good && g.totalImpresiones >= 200) {
    steps.push('Preparar 2 variantes nuevas de creatividad para la próxima campaña con mejores promesas visuales y beneficios claros en el copy.');
  }

  if (data.campaigns.some((c) => c.byCity && c.byCity.length > 0 && c.byCity[0].city !== '(Desconocida)')) {
    steps.push('Explorar segmentación geográfica: concentrar más inversión en las ciudades con mayor volumen o mejor CTR.');
  }

  steps.push('Programar sesión de revisión con el equipo comercial de OírConecta para discutir estos hallazgos y ajustar la estrategia del siguiente periodo.');
  return steps;
}

function buildHtml(data) {
  const { advertiser, resumenGlobal, campaigns } = data;
  const rangeMin = campaigns.reduce((m, c) => c.campaign.startDate && (!m || c.campaign.startDate < m) ? c.campaign.startDate : m, null);
  const rangeMax = campaigns.reduce((m, c) => c.campaign.endDate && (!m || c.campaign.endDate > m) ? c.campaign.endDate : m, null);
  const rangeLabel = rangeMin && rangeMax ? `${fmtDate(rangeMin)} — ${fmtDate(rangeMax)}` : 'Todas las campañas';
  const generado = new Date().toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const overall = overallScore(resumenGlobal);
  const insights = buildInsights(data);
  const recs = buildRecs(data);
  const nextSteps = buildNextSteps(data);
  const narrative = buildNarrative(data);

  const logoBlock = advertiser.logoUrl
    ? `<img src="${advertiser.logoUrl}" style="max-width:180px;max-height:70px;background:#fff;padding:8px;border-radius:8px;margin-bottom:24px" crossorigin="anonymous" />`
    : `<div style="font-size:32px;font-weight:900;letter-spacing:-0.02em;margin-bottom:16px">${advertiser.nombre}</div>`;

  return `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#0F2A4A">
  <!-- ═══════ PORTADA ═══════ -->
  <div style="page-break-after:always;padding:60px 40px;background:linear-gradient(135deg,#15803d,#065f46);color:#fff;min-height:920px;position:relative">
    <div style="font-size:14px;letter-spacing:0.3em;opacity:0.8">OÍRCONECTA</div>
    <div style="font-size:11px;letter-spacing:0.1em;opacity:0.6;margin-top:4px">INFORME CONSOLIDADO DE CAMPAÑAS · CONFIDENCIAL</div>
    <div style="height:2px;background:rgba(255,255,255,0.3);width:60px;margin:32px 0"></div>

    ${logoBlock}
    ${advertiser.logoUrl ? `<div style="font-size:36px;font-weight:900;line-height:1.05;letter-spacing:-0.02em;margin-bottom:8px">${advertiser.nombre}</div>` : ''}
    ${advertiser.marcaPrincipal ? `<div style="font-size:14px;opacity:0.9;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:32px">Marca ${advertiser.marcaPrincipal}</div>` : ''}

    <div style="background:rgba(255,255,255,0.12);border-radius:14px;padding:28px;max-width:470px;margin-top:60px">
      <div style="font-size:11px;letter-spacing:0.15em;opacity:0.7;text-transform:uppercase;margin-bottom:8px">Periodo cubierto</div>
      <div style="font-size:22px;font-weight:800;margin-bottom:24px">${rangeLabel}</div>
      <table style="width:100%;color:#fff">
        <tr>
          <td style="padding-right:12px"><div style="font-size:10px;opacity:0.7;letter-spacing:0.1em">CAMPAÑAS</div><div style="font-size:26px;font-weight:800">${resumenGlobal.totalCampanas}</div></td>
          <td style="padding-right:12px"><div style="font-size:10px;opacity:0.7;letter-spacing:0.1em">IMPRESIONES</div><div style="font-size:26px;font-weight:800">${fmtNum(resumenGlobal.totalImpresiones)}</div></td>
          <td><div style="font-size:10px;opacity:0.7;letter-spacing:0.1em">INVERSIÓN</div><div style="font-size:20px;font-weight:800">${fmtCOP(resumenGlobal.inversionTotalCOP)}</div></td>
        </tr>
      </table>
      <div style="margin-top:20px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.2)">
        <div style="font-size:10px;letter-spacing:0.1em;opacity:0.7;text-transform:uppercase;margin-bottom:4px">Desempeño global</div>
        <div style="font-size:18px;font-weight:800;color:${overall.color === '#94a3b8' ? '#fff' : '#fff'}">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${overall.color};margin-right:8px;vertical-align:middle"></span>${overall.label}
        </div>
      </div>
      <div style="font-size:10px;opacity:0.7;margin-top:16px">Generado ${generado}</div>
    </div>

    <div style="position:absolute;bottom:40px;left:40px;right:40px;display:flex;justify-content:space-between;font-size:9px;opacity:0.6;text-transform:uppercase;letter-spacing:0.1em">
      <span>Preparado por el equipo comercial · Compartir con el responsable de marketing</span>
      <span>oirconecta.com</span>
    </div>
  </div>

  <!-- ═══════ RESUMEN NARRATIVO ═══════ -->
  <div style="page-break-after:always;padding:40px">
    <div style="border-bottom:3px solid #15803d;padding-bottom:12px;margin-bottom:20px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#15803d;font-weight:700">RESUMEN EJECUTIVO</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Panorama del periodo</div>
    </div>

    <div style="background:#f8fafc;border-left:4px solid #15803d;padding:20px 24px;border-radius:0 8px 8px 0;font-size:13px;line-height:1.65;color:#0F2A4A;margin-bottom:24px">
      ${narrative}
    </div>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin:24px 0 12px">Lectura del desempeño</div>
    <div style="background:${overall.color}0d;border:1px solid ${overall.color}44;border-radius:10px;padding:20px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <span style="width:14px;height:14px;border-radius:50%;background:${overall.color};display:inline-block"></span>
        <span style="font-size:20px;font-weight:900;color:${overall.color}">${overall.label}</span>
      </div>
      <div style="font-size:12px;line-height:1.55;color:#0F2A4A">${overall.description}</div>
    </div>
  </div>

  <!-- ═══════ VISTA CONSOLIDADA ═══════ -->
  <div style="page-break-after:always;padding:40px">
    <div style="border-bottom:3px solid #0369a1;padding-bottom:12px;margin-bottom:20px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#0369a1;font-weight:700">VISTA CONSOLIDADA</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">KPIs del portafolio</div>
    </div>

    <table style="width:100%;border-collapse:separate;border-spacing:8px;margin:0 -8px 20px -8px">
      <tr>
        ${kpiCard('Total impresiones', fmtNum(resumenGlobal.totalImpresiones), '#0369a1')}
        ${kpiCard('Total clicks', fmtNum(resumenGlobal.totalClicks), '#6d28d9')}
        ${kpiCard('CTR global', fmtPct(resumenGlobal.globalCTR), resumenGlobal.globalCTR >= BENCH.ctr.good ? '#15803d' : '#f59e0b')}
        ${kpiCard('Leads', fmtNum(resumenGlobal.totalLeads), '#15803d')}
      </tr>
      <tr>
        ${kpiCard('Alcance total', fmtNum(resumenGlobal.totalAlcance), '#0369a1', 'usuarios únicos suma')}
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

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin:24px 0 8px">Comparativa con benchmarks de industria</div>
    <div style="font-size:11px;color:#64748b;margin-bottom:12px">Referencias tomadas del mercado display Colombia 2025-2026 (fuente: promedios publicados por IAB Colombia y estudios locales).</div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:10px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Métrica</th>
          <th style="padding:10px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Este anunciante</th>
          <th style="padding:10px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Referencia industria</th>
        </tr>
      </thead>
      <tbody>
        ${benchmarkRow('CTR promedio', fmtPct(resumenGlobal.globalCTR), `Industria display CO: ~${BENCH.ctr.industry}%. Excelente: >${BENCH.ctr.excellent}%.`,
          resumenGlobal.globalCTR >= BENCH.ctr.good ? 'good' : (resumenGlobal.globalCTR >= BENCH.ctr.floor ? 'neutral' : 'bad'))}
        ${benchmarkRow('CPM', resumenGlobal.globalCPM ? fmtCOP(resumenGlobal.globalCPM) : '—', `Industria: ${fmtCOP(BENCH.cpm.good)} — ${fmtCOP(BENCH.cpm.high)}.`,
          resumenGlobal.globalCPM && resumenGlobal.globalCPM < BENCH.cpm.industry ? 'good' : (resumenGlobal.globalCPM && resumenGlobal.globalCPM > BENCH.cpm.high ? 'bad' : 'neutral'))}
        ${benchmarkRow('Alcance', fmtNum(resumenGlobal.totalAlcance), 'Comparar con audiencia objetivo del anunciante.', 'neutral')}
        ${benchmarkRow('Campañas activas', `${resumenGlobal.activas} de ${resumenGlobal.totalCampanas}`, 'Ideal: rotación de creatividades cada 15-30 días.', 'neutral')}
      </tbody>
    </table>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin:32px 0 12px">Detalle por campaña</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px;font-size:9px;text-align:left;color:#475569;text-transform:uppercase">Campaña</th>
          <th style="padding:8px;font-size:9px;text-align:right;color:#475569;text-transform:uppercase">Imp.</th>
          <th style="padding:8px;font-size:9px;text-align:right;color:#475569;text-transform:uppercase">CTR</th>
          <th style="padding:8px;font-size:9px;text-align:right;color:#475569;text-transform:uppercase">Inversión</th>
          <th style="padding:8px;font-size:9px;text-align:left;color:#475569;text-transform:uppercase">Score</th>
        </tr>
      </thead>
      <tbody>
        ${campaigns.map((c) => {
          const s = scoreCampaign(c.resumen);
          return `<tr>
            <td style="padding:8px;font-size:10px;font-weight:700">${c.campaign.nombre}<div style="font-size:8px;color:#94a3b8;font-weight:400;text-transform:uppercase;letter-spacing:0.05em">${c.campaign.actionType || ''}</div></td>
            <td style="padding:8px;font-size:10px;text-align:right">${fmtNum(c.resumen.impressions)}</td>
            <td style="padding:8px;font-size:10px;text-align:right;color:${c.resumen.ctr >= BENCH.ctr.good ? '#15803d' : '#64748b'};font-weight:700">${fmtPct(c.resumen.ctr)}</td>
            <td style="padding:8px;font-size:10px;text-align:right;font-weight:700">${fmtCOP(c.resumen.inversionTotalCOP)}</td>
            <td style="padding:8px;font-size:10px"><span style="background:${s.color}15;color:${s.color};padding:2px 8px;border-radius:12px;font-weight:700">${s.label}${s.score != null ? ` (${s.score}/100)` : ''}</span></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>

  <!-- ═══════ UNA SECCIÓN POR CAMPAÑA ═══════ -->
  ${campaigns.map((fm, i) => campaignSection(fm, i)).join('')}

  <!-- ═══════ CIERRE ═══════ -->
  <div style="padding:40px">
    <div style="border-bottom:3px solid #0F2A4A;padding-bottom:12px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#0F2A4A;font-weight:700">CIERRE</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Hallazgos, recomendaciones y próximos pasos</div>
    </div>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin-bottom:12px">Hallazgos clave del portafolio</div>
    <ul style="padding-left:20px;margin-bottom:28px">
      ${insights.length > 0 ? insights.map((i) => `<li style="margin-bottom:10px;font-size:11.5px;line-height:1.55">${i}</li>`).join('') : '<li style="font-size:11px;color:#64748b">Aún no hay datos suficientes para hallazgos automáticos.</li>'}
    </ul>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin-bottom:12px">Recomendaciones tácticas</div>
    ${recs.map((r, i) => `
      <div style="background:#f0fdf4;border-left:3px solid #15803d;padding:12px 16px;margin-bottom:6px;font-size:11.5px;line-height:1.55">
        <strong style="color:#15803d">${i + 1}.</strong> ${r}
      </div>`).join('')}

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin:28px 0 12px">Próximos pasos concretos</div>
    <table style="width:100%;border-collapse:collapse">
      ${nextSteps.map((s, i) => `
        <tr>
          <td style="width:32px;padding:8px 0;vertical-align:top">
            <div style="width:24px;height:24px;border-radius:50%;background:#0369a1;color:#fff;font-size:11px;font-weight:800;text-align:center;line-height:24px">${i + 1}</div>
          </td>
          <td style="padding:8px 0 8px 8px;font-size:11.5px;line-height:1.55;vertical-align:top">${s}</td>
        </tr>`).join('')}
    </table>

    <div style="margin-top:60px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:9px;color:#94a3b8;text-align:center;line-height:1.5">
      <strong>Documento confidencial preparado por OírConecta.</strong><br/>
      Datos first-party bajo Ley 1581 (habeas data). Los benchmarks industria son referenciales del mercado colombiano 2025-2026.<br/>
      Este informe se genera automáticamente cada vez que se solicita — para comentarios o ajustes, contactar al equipo comercial.
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
<script>window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 600); });</script>
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
