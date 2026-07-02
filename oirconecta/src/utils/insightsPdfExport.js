/**
 * D4 — Exportación PDF del informe Insights del sitio.
 *
 * Renderiza un layout branded portrait A4 con:
 *   - Portada (logo, título, rango, generado por)
 *   - Resumen ejecutivo (KPIs)
 *   - Tendencia diaria (tabla + mini barras)
 *   - Top ciudades
 *   - Dispositivos + OS + Browser
 *   - Fuentes de tráfico
 *   - Páginas más visitadas
 *   - Embudo del sitio
 *   - Insights automáticos + recomendaciones
 *
 * Consume los mismos endpoints que la página en pantalla.
 */

// Ya no usamos html2pdf.js — el enfoque de captura con html2canvas produce
// PDFs vacíos en Safari + iOS. Ahora abrimos ventana con print CSS y el
// usuario elige "Guardar como PDF" desde el diálogo nativo (macOS/Win/Linux).

const stamp = () => new Date().toISOString().slice(0, 10);

// ─────────── Format helpers ───────────
const fmtNum = (n) => n == null ? '—' : Number(n).toLocaleString('es-CO');
const fmtPct = (n) => n == null ? '—' : `${Number(n).toFixed(2)}%`;
const fmtSec = (s) => {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
};
const fmtDateShort = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─────────── Insights automáticos ───────────
function buildInsights({ overview, byCity, byDevice, sources, funnel }) {
  const insights = [];

  // 1. Ciudad top y % de participación
  if (byCity?.length > 0) {
    const totalSessions = byCity.reduce((a, c) => a + c.sessions, 0);
    const top = byCity[0];
    const pct = totalSessions > 0 ? Math.round((top.sessions / totalSessions) * 100) : 0;
    insights.push(
      `<strong>${top.city}</strong> concentra el <strong>${pct}%</strong> del tráfico ` +
      `(${fmtNum(top.sessions)} sesiones). Si tu público objetivo está en otra ciudad, ` +
      `considera segmentar campañas geográficamente.`
    );
  }

  // 2. Device dominante
  const dev = byDevice?.byDevice || [];
  if (dev.length > 0) {
    const totalDev = dev.reduce((a, d) => a + d.sessions, 0);
    const top = [...dev].sort((a, b) => b.sessions - a.sessions)[0];
    const pct = totalDev > 0 ? Math.round((top.sessions / totalDev) * 100) : 0;
    if (top.device === 'mobile' && pct >= 60) {
      insights.push(
        `El <strong>${pct}%</strong> del tráfico viene desde <strong>móvil</strong>. ` +
        `Asegúrate que las creatividades de campaña, formularios y wizard de reserva ` +
        `funcionen impecablemente en pantallas pequeñas.`
      );
    } else if (top.device === 'desktop' && pct >= 60) {
      insights.push(
        `El <strong>${pct}%</strong> del tráfico viene desde <strong>desktop</strong>. ` +
        `Público probablemente maduro o profesional. Considera creatividades más ` +
        `detalladas y formularios largos.`
      );
    } else {
      insights.push(
        `Tráfico repartido: <strong>${pct}% ${top.device}</strong>. ` +
        `Diseña experiencias que funcionen igual de bien en ambos.`
      );
    }
  }

  // 3. Fuente con mejor conversión
  if (sources?.length > 0) {
    const withData = sources.filter((s) => s.sessions >= 5 && s.bookings + s.leads > 0);
    if (withData.length > 0) {
      const best = withData
        .map((s) => ({ ...s, convRate: (s.bookings + s.leads) / s.sessions }))
        .sort((a, b) => b.convRate - a.convRate)[0];
      insights.push(
        `La fuente <strong>${best.source}</strong> convierte mejor ` +
        `(${Math.round(best.convRate * 100)}% de sus sesiones generan lead o cita). ` +
        `Considera aumentar la inversión en ese canal.`
      );
    } else {
      insights.push(
        `Aún no hay suficientes conversiones para comparar fuentes. ` +
        `Recolecta al menos 5 sesiones por fuente antes de tomar decisiones.`
      );
    }
  }

  // 4. Embudo — cuello de botella
  const steps = funnel?.steps || [];
  if (steps.length >= 3) {
    let worst = { drop: 0, from: null, to: null };
    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1].count;
      const now = steps[i].count;
      if (prev > 0) {
        const drop = ((prev - now) / prev) * 100;
        if (drop > worst.drop && drop < 100) {
          worst = { drop, from: steps[i - 1].label, to: steps[i].label };
        }
      }
    }
    if (worst.from) {
      insights.push(
        `Mayor caída del embudo: entre <strong>"${worst.from}"</strong> y ` +
        `<strong>"${worst.to}"</strong> se pierde el <strong>${Math.round(worst.drop)}%</strong> ` +
        `del tráfico. Revisa fricción en ese paso.`
      );
    }
  }

  // 5. Bounce alto
  if (overview?.bounceRate > 60) {
    insights.push(
      `El bounce rate del <strong>${fmtPct(overview.bounceRate)}</strong> es alto. ` +
      `Muchas visitas se van sin ver más de una página. Considera mejorar la primera ` +
      `impresión: velocidad, claridad del mensaje, CTA visible.`
    );
  } else if (overview?.bounceRate > 0 && overview.bounceRate < 40) {
    insights.push(
      `Excelente: el bounce del <strong>${fmtPct(overview.bounceRate)}</strong> ` +
      `indica que los visitantes exploran el sitio. Buen engagement.`
    );
  }

  return insights;
}

// ─────────── Recomendaciones ───────────
function buildRecommendations({ overview, byCity, sources, funnel }) {
  const recs = [];
  if ((overview?.sessions || 0) < 50) {
    recs.push('Aumenta la inversión en campañas pagas o SEO para acumular volumen mínimo de tráfico y sacar conclusiones confiables.');
  }
  if (byCity?.length > 0) {
    const unknownRow = byCity.find((c) => c.city === '(Desconocida)');
    const totalSessions = byCity.reduce((a, c) => a + c.sessions, 0);
    if (unknownRow && totalSessions > 0 && unknownRow.sessions / totalSessions > 0.3) {
      recs.push('Más del 30% de las sesiones no tienen geolocalización. Considera activar Cloudflare o un servicio de geo-IP dedicado para mejorar el dato.');
    }
  }
  const directo = sources?.find((s) => s.source === 'Directo');
  const orgGoogle = sources?.find((s) => s.source === 'Orgánico Google');
  if (directo && orgGoogle && directo.sessions > orgGoogle.sessions * 3) {
    recs.push('Tráfico "Directo" muy dominante — refleja marca fuerte pero baja captación nueva. Invierte en SEO y contenido para crecer con orgánico.');
  }
  const bookingStep = funnel?.steps?.find((s) => s.key === 'booking');
  const wizardStep = funnel?.steps?.find((s) => s.key === 'wizard');
  if (wizardStep && bookingStep && wizardStep.count > 5) {
    const rate = (bookingStep.count / wizardStep.count) * 100;
    if (rate < 30) {
      recs.push(`Solo el ${Math.round(rate)}% de los que abren el wizard de reserva la completan. Simplifica el flujo, reduce campos requeridos o añade botón "reservar con un click" si aplica.`);
    }
  }
  if (recs.length === 0) {
    recs.push('El sitio muestra métricas saludables. Continúa recolectando datos y compara mes a mes para detectar tendencias.');
  }
  return recs;
}

// ─────────── HTML del reporte ───────────
function buildReportHtml({ range, overview, series, byCity, byDevice, sources, topPages, funnel, insights, recs }) {
  const rangeLabel = `${fmtDateShort(range.from)} — ${fmtDateShort(range.to)}`;
  const generado = new Date().toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Mini timeseries en tabla + barras
  const maxSessions = Math.max(1, ...(series || []).map((d) => d.sessions || 0));
  const seriesRows = (series || []).slice(-14).map((d) => `
    <tr>
      <td style="padding:4px 8px;font-size:10px">${d.day.slice(5)}</td>
      <td style="padding:4px 8px;font-size:10px;text-align:right">${fmtNum(d.sessions)}</td>
      <td style="padding:4px 8px;font-size:10px;text-align:right">${fmtNum(d.pageViews)}</td>
      <td style="padding:4px 8px;font-size:10px;text-align:right">${fmtNum(d.bookings)}</td>
      <td style="padding:4px 8px;width:40%">
        <div style="background:#e5e7eb;height:6px;border-radius:3px;overflow:hidden">
          <div style="width:${(d.sessions / maxSessions) * 100}%;height:100%;background:#15803d"></div>
        </div>
      </td>
    </tr>`).join('');

  // Ciudades top 10
  const cityMax = Math.max(1, ...(byCity || []).map((c) => c.sessions));
  const cityRows = (byCity || []).slice(0, 10).map((c) => `
    <tr>
      <td style="padding:6px 8px;font-size:10px;font-weight:600">${c.city}</td>
      <td style="padding:6px 8px;font-size:10px;text-align:right">${fmtNum(c.sessions)}</td>
      <td style="padding:6px 8px;font-size:10px;text-align:right">${fmtNum(c.visitors)}</td>
      <td style="padding:6px 8px;font-size:10px;text-align:right">${fmtNum(c.pageViews)}</td>
      <td style="padding:6px 8px;font-size:10px;text-align:right;color:${c.bookings > 0 ? '#15803d' : '#94a3b8'};font-weight:${c.bookings > 0 ? 700 : 400}">${fmtNum(c.bookings)}</td>
      <td style="padding:6px 8px;font-size:10px;text-align:right">${fmtNum(c.leads)}</td>
      <td style="padding:6px 8px;width:20%">
        <div style="background:#e5e7eb;height:6px;border-radius:3px;overflow:hidden">
          <div style="width:${(c.sessions / cityMax) * 100}%;height:100%;background:#0369a1"></div>
        </div>
      </td>
    </tr>`).join('');

  // Devices
  const devTotal = (byDevice?.byDevice || []).reduce((a, b) => a + b.sessions, 0) || 1;
  const devRows = (byDevice?.byDevice || []).map((d) => `
    <tr>
      <td style="padding:6px 8px;font-size:11px;font-weight:600;text-transform:capitalize">${d.device}</td>
      <td style="padding:6px 8px;font-size:11px;text-align:right">${fmtNum(d.sessions)}</td>
      <td style="padding:6px 8px;font-size:11px;text-align:right">${Math.round((d.sessions / devTotal) * 100)}%</td>
      <td style="padding:6px 8px;font-size:11px;text-align:right;color:${d.bookings > 0 ? '#15803d' : '#94a3b8'};font-weight:${d.bookings > 0 ? 700 : 400}">${fmtNum(d.bookings)}</td>
    </tr>`).join('');

  const osRows = (byDevice?.byOs || []).slice(0, 5).map((o) => `
    <tr><td style="padding:4px 8px;font-size:10px">${o.os}</td><td style="padding:4px 8px;font-size:10px;text-align:right">${fmtNum(o.sessions)}</td></tr>`).join('');

  const browserRows = (byDevice?.byBrowser || []).slice(0, 5).map((b) => `
    <tr><td style="padding:4px 8px;font-size:10px">${b.browser}</td><td style="padding:4px 8px;font-size:10px;text-align:right">${fmtNum(b.sessions)}</td></tr>`).join('');

  // Fuentes
  const sourceMax = Math.max(1, ...(sources || []).map((s) => s.sessions));
  const sourceRows = (sources || []).slice(0, 10).map((s) => `
    <tr>
      <td style="padding:6px 8px;font-size:10px;font-weight:600">${s.source}</td>
      <td style="padding:6px 8px;font-size:10px;text-align:right">${fmtNum(s.sessions)}</td>
      <td style="padding:6px 8px;font-size:10px;text-align:right">${fmtNum(s.visitors)}</td>
      <td style="padding:6px 8px;font-size:10px;text-align:right;color:${s.bookings > 0 ? '#15803d' : '#94a3b8'};font-weight:${s.bookings > 0 ? 700 : 400}">${fmtNum(s.bookings)}</td>
      <td style="padding:6px 8px;font-size:10px;text-align:right">${fmtNum(s.leads)}</td>
      <td style="padding:6px 8px;width:20%">
        <div style="background:#e5e7eb;height:6px;border-radius:3px;overflow:hidden">
          <div style="width:${(s.sessions / sourceMax) * 100}%;height:100%;background:#6d28d9"></div>
        </div>
      </td>
    </tr>`).join('');

  // Top pages
  const pageMax = Math.max(1, ...(topPages || []).map((p) => p.views));
  const pageRows = (topPages || []).slice(0, 10).map((p) => `
    <tr>
      <td style="padding:6px 8px;font-size:10px"><code style="font-family:monospace;font-size:9px">${p.path}</code></td>
      <td style="padding:6px 8px;font-size:10px;color:#64748b">${p.pageType}</td>
      <td style="padding:6px 8px;font-size:10px;text-align:right;font-weight:600">${fmtNum(p.views)}</td>
      <td style="padding:6px 8px;font-size:10px;text-align:right">${fmtNum(p.sessions)}</td>
      <td style="padding:6px 8px;width:20%">
        <div style="background:#e5e7eb;height:6px;border-radius:3px;overflow:hidden">
          <div style="width:${(p.views / pageMax) * 100}%;height:100%;background:#15803d"></div>
        </div>
      </td>
    </tr>`).join('');

  // Embudo
  const funnelMax = Math.max(1, ...(funnel?.steps || []).map((s) => s.count));
  const first = funnel?.steps?.[0]?.count || 0;
  const funnelRows = (funnel?.steps || []).map((s, i) => {
    const pctOfFirst = first > 0 ? Math.round((s.count / first) * 1000) / 10 : 0;
    return `
    <tr>
      <td style="padding:8px 12px;font-size:11px;font-weight:600;color:#0F2A4A">${i + 1}. ${s.label}</td>
      <td style="padding:8px 12px;font-size:14px;text-align:right;font-weight:800;color:#0F2A4A">${fmtNum(s.count)}</td>
      <td style="padding:8px 12px;font-size:10px;text-align:right;color:#64748b">${i === 0 ? '—' : `${pctOfFirst}%`}</td>
      <td style="padding:8px 12px;width:40%">
        <div style="background:#e5e7eb;height:10px;border-radius:5px;overflow:hidden">
          <div style="width:${(s.count / funnelMax) * 100}%;height:100%;background:linear-gradient(90deg,#15803d,#86efac)"></div>
        </div>
      </td>
    </tr>`;
  }).join('');

  const insightsHtml = insights.length > 0
    ? insights.map((i, idx) => `<li style="margin-bottom:8px;font-size:11px;line-height:1.5">${i}</li>`).join('')
    : '<li style="font-size:11px;color:#64748b">Aún no hay suficientes datos para insights automáticos. Recolecta al menos 100 sesiones.</li>';

  const recsHtml = recs.map((r, i) => `
    <div style="background:#f0fdf4;border-left:3px solid #15803d;padding:10px 14px;margin-bottom:6px;font-size:11px;line-height:1.5">
      <strong style="color:#15803d">${i + 1}.</strong> ${r}
    </div>`).join('');

  return `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#0F2A4A;padding:0">
  <!-- ═══════════════ PORTADA ═══════════════ -->
  <div style="page-break-after:always;padding:60px 40px;background:linear-gradient(135deg,#15803d,#065f46);color:#fff;min-height:920px;position:relative">
    <div style="font-size:14px;letter-spacing:0.3em;opacity:0.8">OÍRCONECTA</div>
    <div style="font-size:12px;letter-spacing:0.1em;opacity:0.6;margin-top:4px">RED DE ESPECIALISTAS EN SALUD AUDITIVA · COLOMBIA</div>
    <div style="height:2px;background:rgba(255,255,255,0.3);width:60px;margin:32px 0"></div>
    <div style="font-size:44px;font-weight:900;line-height:1.05;letter-spacing:-0.02em;margin:24px 0 12px">Informe de tráfico<br/>del sitio</div>
    <div style="font-size:16px;opacity:0.9;margin-bottom:60px">Analytics first-party · Segmentación por ciudad y dispositivo</div>

    <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:24px;max-width:400px;margin-top:80px">
      <div style="font-size:11px;letter-spacing:0.15em;opacity:0.7;text-transform:uppercase;margin-bottom:8px">Periodo analizado</div>
      <div style="font-size:22px;font-weight:800;margin-bottom:16px">${rangeLabel}</div>
      <div style="font-size:11px;opacity:0.7">Generado el ${generado}</div>
    </div>

    <div style="position:absolute;bottom:40px;left:40px;right:40px;display:flex;justify-content:space-between;font-size:9px;opacity:0.6;text-transform:uppercase;letter-spacing:0.1em">
      <span>Confidencial · Uso interno</span>
      <span>oirconecta.com</span>
    </div>
  </div>

  <!-- ═══════════════ RESUMEN EJECUTIVO ═══════════════ -->
  <div style="page-break-after:always;padding:40px">
    <div style="border-bottom:3px solid #15803d;padding-bottom:12px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#15803d;font-weight:700">SECCIÓN 1</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Resumen ejecutivo</div>
    </div>

    <table style="width:100%;border-collapse:separate;border-spacing:10px;margin:0 -10px 24px -10px">
      <tr>
        ${kpiCard('Visitantes únicos', fmtNum(overview?.uniqueVisitors), '#0369a1')}
        ${kpiCard('Sesiones', fmtNum(overview?.sessions), '#6d28d9')}
        ${kpiCard('Pageviews', fmtNum(overview?.pageViews), '#15803d')}
        ${kpiCard('Duración media', fmtSec(overview?.avgSessionDurationSec), '#f59e0b')}
      </tr>
      <tr>
        ${kpiCard('Pág. por sesión', (overview?.avgPagesPerSession ?? 0).toFixed(2), '#0369a1')}
        ${kpiCard('Bounce rate', fmtPct(overview?.bounceRate), '#dc2626')}
        ${kpiCard('Sesiones que convirtieron', fmtNum(overview?.convertedSessions), '#15803d')}
        ${kpiCard('Tasa conversión', fmtPct(overview?.conversionRate), '#15803d')}
      </tr>
    </table>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin:24px 0 12px">Tendencia últimos días</div>
    <table style="width:100%;border-collapse:collapse;font-family:Arial">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Día</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Sesiones</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Pageviews</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Citas</th>
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Volumen</th>
        </tr>
      </thead>
      <tbody>${seriesRows || `<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8;font-size:11px;font-style:italic">Sin datos en el rango</td></tr>`}</tbody>
    </table>
  </div>

  <!-- ═══════════════ CIUDADES ═══════════════ -->
  <div style="page-break-after:always;padding:40px">
    <div style="border-bottom:3px solid #0369a1;padding-bottom:12px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#0369a1;font-weight:700">SECCIÓN 2</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Distribución geográfica</div>
    </div>
    <div style="font-size:11px;color:#64748b;margin-bottom:16px">Top 10 ciudades por sesiones. Los visitantes sin geolocalización aparecen como "(Desconocida)".</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Ciudad</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Sesiones</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Únicos</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Pageviews</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Citas</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Leads</th>
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Volumen</th>
        </tr>
      </thead>
      <tbody>${cityRows || `<tr><td colspan="7" style="padding:16px;text-align:center;color:#94a3b8;font-size:11px;font-style:italic">Sin datos en el rango</td></tr>`}</tbody>
    </table>
  </div>

  <!-- ═══════════════ DISPOSITIVOS ═══════════════ -->
  <div style="page-break-after:always;padding:40px">
    <div style="border-bottom:3px solid #6d28d9;padding-bottom:12px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#6d28d9;font-weight:700">SECCIÓN 3</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Dispositivos y navegadores</div>
    </div>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin-bottom:12px">Distribución por dispositivo</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Device</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Sesiones</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">%</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Citas</th>
        </tr>
      </thead>
      <tbody>${devRows || `<tr><td colspan="4" style="padding:16px;text-align:center;color:#94a3b8;font-size:11px">Sin datos</td></tr>`}</tbody>
    </table>

    <table style="width:100%;border-collapse:separate;border-spacing:24px 0"><tr>
      <td style="width:50%;vertical-align:top">
        <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin-bottom:12px">Top sistema operativo</div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f8fafc"><th style="padding:6px;font-size:9px;text-align:left;color:#475569">OS</th><th style="padding:6px;font-size:9px;text-align:right;color:#475569">Sesiones</th></tr></thead>
          <tbody>${osRows || `<tr><td colspan="2" style="padding:12px;text-align:center;color:#94a3b8;font-size:10px">Sin datos</td></tr>`}</tbody>
        </table>
      </td>
      <td style="width:50%;vertical-align:top">
        <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin-bottom:12px">Top navegador</div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f8fafc"><th style="padding:6px;font-size:9px;text-align:left;color:#475569">Browser</th><th style="padding:6px;font-size:9px;text-align:right;color:#475569">Sesiones</th></tr></thead>
          <tbody>${browserRows || `<tr><td colspan="2" style="padding:12px;text-align:center;color:#94a3b8;font-size:10px">Sin datos</td></tr>`}</tbody>
        </table>
      </td>
    </tr></table>
  </div>

  <!-- ═══════════════ FUENTES ═══════════════ -->
  <div style="page-break-after:always;padding:40px">
    <div style="border-bottom:3px solid #f59e0b;padding-bottom:12px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#f59e0b;font-weight:700">SECCIÓN 4</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Fuentes de tráfico</div>
    </div>
    <div style="font-size:11px;color:#64748b;margin-bottom:16px">Clasificación según UTM Source y referrer HTTP. Directo = usuarios que llegan sin origen conocido.</div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Fuente</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Sesiones</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Únicos</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Citas</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Leads</th>
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Volumen</th>
        </tr>
      </thead>
      <tbody>${sourceRows || `<tr><td colspan="6" style="padding:16px;text-align:center;color:#94a3b8;font-size:11px">Sin datos</td></tr>`}</tbody>
    </table>
  </div>

  <!-- ═══════════════ PÁGINAS ═══════════════ -->
  <div style="page-break-after:always;padding:40px">
    <div style="border-bottom:3px solid #15803d;padding-bottom:12px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#15803d;font-weight:700">SECCIÓN 5</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Páginas más visitadas</div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Ruta</th>
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Tipo</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Pageviews</th>
          <th style="padding:8px;font-size:10px;text-align:right;color:#475569;text-transform:uppercase">Sesiones</th>
          <th style="padding:8px;font-size:10px;text-align:left;color:#475569;text-transform:uppercase">Volumen</th>
        </tr>
      </thead>
      <tbody>${pageRows || `<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8;font-size:11px">Sin datos</td></tr>`}</tbody>
    </table>
  </div>

  <!-- ═══════════════ EMBUDO ═══════════════ -->
  <div style="page-break-after:always;padding:40px">
    <div style="border-bottom:3px solid #dc2626;padding-bottom:12px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#dc2626;font-weight:700">SECCIÓN 6</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Embudo del sitio</div>
    </div>
    <div style="font-size:11px;color:#64748b;margin-bottom:20px">Cada etapa es un evento capturado en el rango. El porcentaje muestra cuánto queda del total inicial de sesiones.</div>
    <table style="width:100%;border-collapse:collapse">
      <tbody>${funnelRows || `<tr><td style="padding:16px;text-align:center;color:#94a3b8;font-size:11px">Sin datos</td></tr>`}</tbody>
    </table>
  </div>

  <!-- ═══════════════ INSIGHTS + RECOMENDACIONES ═══════════════ -->
  <div style="padding:40px">
    <div style="border-bottom:3px solid #0F2A4A;padding-bottom:12px;margin-bottom:24px">
      <div style="font-size:10px;letter-spacing:0.3em;color:#0F2A4A;font-weight:700">SECCIÓN 7</div>
      <div style="font-size:28px;font-weight:900;letter-spacing:-0.02em">Insights y recomendaciones</div>
    </div>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin-bottom:12px">Insights automáticos</div>
    <ul style="padding-left:20px;margin-bottom:32px">${insightsHtml}</ul>

    <div style="font-size:14px;font-weight:800;color:#0F2A4A;margin-bottom:12px">Recomendaciones sugeridas</div>
    ${recsHtml}

    <div style="margin-top:60px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:9px;color:#94a3b8;text-align:center">
      Este informe fue generado automáticamente por el sistema de analytics de OírConecta.<br/>
      Los datos son first-party y cumplen la Ley 1581 de habeas data. IP nunca se almacena completa.
    </div>
  </div>
</div>`;
}

function kpiCard(label, value, color) {
  return `
    <td style="border:1px solid #e5e7eb;border-radius:8px;padding:14px;width:25%;vertical-align:top">
      <div style="font-size:9px;letter-spacing:0.15em;color:#64748b;text-transform:uppercase;font-weight:700">${label}</div>
      <div style="font-size:22px;font-weight:900;color:${color};margin-top:6px">${value}</div>
    </td>`;
}

/**
 * @param {object} data — objeto con { range, overview, series, byCity, byDevice, sources, topPages, funnel }
 */
export async function downloadInsightsPdf(data) {
  const insights = buildInsights(data);
  const recs = buildRecommendations(data);
  const html = buildReportHtml({ ...data, insights, recs });

  // Abrimos ventana con print CSS optimizado y auto-print.
  // El usuario elige "Guardar como PDF" desde el diálogo nativo (macOS/Win/Linux).
  const filename = `informe-sitio-oirconecta_${stamp()}`;
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
    alert('El navegador bloqueó la ventana emergente. Se descargó el informe como HTML — ábrelo y usa "Imprimir → Guardar como PDF".');
    return;
  }
  win.document.write(printHtml);
  win.document.close();
}
