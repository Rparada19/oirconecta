/**
 * Embudo de los leads que llegan por campañas y por qué no agendan.
 *
 * Un lead de campaña es una conversación de WhatsApp que entró por un anuncio
 * click-to-WhatsApp (Meta manda el objeto `referral` y lo guardamos en
 * adSourceId / adClicks). Además se cuentan los Lead del CRM cuya procedencia
 * es marketing, que entran por formularios y no por WhatsApp.
 *
 * Para cada conversación de anuncio dice en qué punto se quedó:
 *   - agendó
 *   - solo mandó el mensaje del anuncio y no volvió a escribir
 *   - conversó pero el bot nunca le mandó el link de agendar
 *   - recibió el link y no agendó
 * y clasifica lo que escribió la gente que no agendó (precio, EPS, ciudad…).
 *
 * No imprime teléfonos completos ni nombres: la salida se puede compartir.
 *
 * Requiere DATABASE_URL (en Render, la shell del servicio ya la trae).
 *
 * Uso:
 *   node scripts/analisis_leads_campanas.js
 *   node scripts/analisis_leads_campanas.js --desde 2026-08-01
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BOGOTA = 'America/Bogota';
const MUESTRAS = 40;

/** Temas que la gente menciona. Una conversación puede caer en varios. */
const TEMAS = [
  ['precio / costo', /precio|cu[aá]nto (vale|cuesta|es|sale|cobran)|costo|valor|tarifa|caro|econ[oó]mic|descuento|promo|gratis|cuota|financ/i],
  ['EPS / prepagada / seguro', /\beps\b|prepagad|seguro|sanitas|sura|compensar|nueva eps|famisanar|colsanitas|medisanitas|colm[eé]dica|salud total|convenio|orden m[eé]dica|autorizaci/i],
  ['ubicación / fuera de Bogotá', /d[oó]nde (quedan|est[aá]n|es)|direcci[oó]n|ubicaci|sede|queda lejos|lejos|otra ciudad|medell[ií]n|cali|barranquilla|bucaramanga|cartagena|pereira|manizales|ibagu[eé]|villavicencio|tunja|c[uú]cuta|soacha|ch[ií]a|zipaquir|fusagasug|no soy de bogot|no vivo en bogot/i],
  ['horario / disponibilidad', /horario|s[aá]bado|domingo|fin de semana|m[aá]s tarde|en la tarde|en la ma[nñ]ana|no puedo (ese|esa|a esa)|otro d[ií]a|otra hora|hoy mismo|disponib/i],
  ['audífonos (compra/precio)', /aud[ií]fono|aparato|amplificador|recargable|invisible|phonak|widex|oticon|signia|resound|starkey/i],
  ['examen / audiometría', /audiometr|examen|prueba|valoraci|diagn[oó]stic|tamiz/i],
  ['para otra persona (familiar)', /mi (mam[aá]|pap[aá]|madre|padre|abuel|esposo|esposa|hij|t[ií]o|t[ií]a|herman)|para (mi|una) (mam[aá]|pap[aá]|abuel)|es para/i],
  ['lo va a pensar / después', /lo pienso|voy a pensar|despu[eé]s|luego (le|te) (escribo|aviso)|m[aá]s adelante|te confirmo|le confirmo|ahorita no|por ahora no|no por ahora/i],
  ['no le interesa / error', /no me interesa|no gracias|equivoc|no fui yo|no ped[ií]|por error|no estoy interesad/i],
  ['quiere hablar con una persona', /asesor|persona|humano|llamar|ll[aá]menme|me llaman|n[uú]mero de tel|hablar con alguien/i],
];

function argDesde() {
  const i = process.argv.indexOf('--desde');
  if (i === -1) return null;
  const d = new Date(`${process.argv[i + 1]}T00:00:00-05:00`);
  if (Number.isNaN(d.getTime())) {
    console.error('Fecha inválida. Usa --desde AAAA-MM-DD');
    process.exit(1);
  }
  return d;
}

/** Los teléfonos entran de mil formas (+57, espacios, guiones). Comparamos los últimos 10. */
function ultimos10(valor) {
  return String(valor || '').replace(/\D/g, '').slice(-10);
}

function enmascarar(phone) {
  const d = ultimos10(phone);
  return d ? `***${d.slice(-4)}` : '—';
}

function pct(n, total) {
  return total ? `${((n / total) * 100).toFixed(1)}%` : '—';
}

function horaBogota(fecha) {
  return Number(new Intl.DateTimeFormat('es-CO', { timeZone: BOGOTA, hour: 'numeric', hourCycle: 'h23' }).format(fecha));
}

function diaSemanaBogota(fecha) {
  return new Intl.DateTimeFormat('es-CO', { timeZone: BOGOTA, weekday: 'short' }).format(fecha);
}

/** Texto legible de un mensaje; los interactivos vienen como JSON. */
function textoDe(m) {
  if (!m.body) return '';
  if (m.type === 'text') return m.body;
  try {
    const j = JSON.parse(m.body);
    return j?.button_reply?.title || j?.list_reply?.title || j?.text || j?.body || '';
  } catch {
    return m.body;
  }
}

function minutos(ms) {
  if (ms == null) return '—';
  const min = ms / 60000;
  if (min < 60) return `${Math.round(min)} min`;
  return `${(min / 60).toFixed(1)} h`;
}

function mediana(valores) {
  if (!valores.length) return null;
  const s = [...valores].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function tabla(filas) {
  for (const [etiqueta, n, total] of filas) {
    console.log(`  ${etiqueta.padEnd(52)} ${String(n).padStart(5)}  ${pct(n, total).padStart(6)}`);
  }
}

async function main() {
  const desde = argDesde();
  const filtroFecha = desde ? { createdAt: { gte: desde } } : {};

  const convs = await prisma.whatsAppConversation.findMany({
    where: {
      ...filtroFecha,
      OR: [{ adSourceId: { not: null } }, { adClicks: { gt: 0 } }],
    },
    include: {
      messages: {
        orderBy: { timestamp: 'asc' },
        select: { direction: true, type: true, body: true, sentByBot: true, sentByUserId: true, timestamp: true },
      },
    },
  });

  // Citas por teléfono, para saber quién agendó aunque el bot no lo haya marcado
  // (agendó llamando, por la web o se la creó recepción a mano).
  const citas = await prisma.appointment.findMany({
    where: { patientPhone: { not: null }, ...(desde ? { createdAt: { gte: desde } } : {}) },
    select: { patientPhone: true, createdAt: true, estado: true, canalRegistro: true },
  });
  const citasPorTel = new Map();
  for (const c of citas) {
    const k = ultimos10(c.patientPhone);
    if (!k) continue;
    if (!citasPorTel.has(k)) citasPorTel.set(k, []);
    citasPorTel.get(k).push(c);
  }

  console.log('\n=== LEADS DE CAMPAÑA POR WHATSAPP (anuncios click-to-WhatsApp) ===');
  console.log(desde ? `Desde ${desde.toISOString().slice(0, 10)}` : 'Todo el historial');
  console.log(`Conversaciones que entraron por anuncio: ${convs.length}`);
  if (!convs.length) {
    console.log('No hay conversaciones con datos de anuncio. Revisa que el webhook guarde el `referral` de Meta.');
  }

  const etapas = {
    agendo: [], soloClic: [], sinLink: [], linkSinCita: [],
  };
  const porAnuncio = new Map();
  const temasNoAgendo = new Map(TEMAS.map(([t]) => [t, 0]));
  let sinTema = 0;
  const primeraRespuesta = [];
  const primeraRespuestaNoAgendo = [];
  let ultimoEsDelCliente = 0;
  let escalados = 0;
  let escaladosSinRespuestaHumana = 0;
  const entradaFueraHorario = { agendo: 0, noAgendo: 0 };
  const muestras = [];

  for (const c of convs) {
    const inbound = c.messages.filter((m) => m.direction === 'INBOUND');
    const outbound = c.messages.filter((m) => m.direction === 'OUTBOUND');
    const citasTel = citasPorTel.get(ultimos10(c.phone)) || [];
    const citaDespues = citasTel.some((a) => a.createdAt >= c.createdAt);
    const agendo = Boolean(c.agendarBookedAt) || citaDespues;

    let etapa;
    if (agendo) etapa = 'agendo';
    else if (inbound.length <= 1) etapa = 'soloClic';
    else if (!c.agendarLinkSentAt) etapa = 'sinLink';
    else etapa = 'linkSinCita';
    etapas[etapa].push(c);

    const anuncio = c.adHeadline || c.adSourceId || '(sin título)';
    if (!porAnuncio.has(anuncio)) porAnuncio.set(anuncio, { total: 0, agendo: 0 });
    const pa = porAnuncio.get(anuncio);
    pa.total += 1;
    if (agendo) pa.agendo += 1;

    // Tiempo hasta la primera respuesta nuestra (bot o humano).
    const primerIn = inbound[0];
    const primerOut = primerIn && outbound.find((m) => m.timestamp >= primerIn.timestamp);
    if (primerIn && primerOut) {
      const ms = primerOut.timestamp - primerIn.timestamp;
      primeraRespuesta.push(ms);
      if (!agendo) primeraRespuestaNoAgendo.push(ms);
    }

    if (primerIn) {
      const h = horaBogota(primerIn.timestamp);
      const dia = diaSemanaBogota(primerIn.timestamp);
      const fuera = h < 7 || h >= 19 || /dom/i.test(dia);
      if (fuera) entradaFueraHorario[agendo ? 'agendo' : 'noAgendo'] += 1;
    }

    if (c.status === 'ESCALATED' || c.agendarEscalatedAt) {
      escalados += 1;
      const trasEscalar = c.agendarEscalatedAt || c.updatedAt;
      const humano = outbound.some((m) => !m.sentByBot && m.timestamp >= trasEscalar);
      if (!humano) escaladosSinRespuestaHumana += 1;
    }

    if (agendo) continue;

    const ultimo = c.messages[c.messages.length - 1];
    if (ultimo && ultimo.direction === 'INBOUND') ultimoEsDelCliente += 1;

    // El primer inbound suele ser el texto prellenado del anuncio: no dice nada
    // de la persona, así que se clasifica lo que escribió después.
    const escrito = inbound.slice(1).map(textoDe).join(' \n ');
    let alguno = false;
    for (const [tema, re] of TEMAS) {
      if (re.test(escrito)) {
        temasNoAgendo.set(tema, temasNoAgendo.get(tema) + 1);
        alguno = true;
      }
    }
    if (!alguno && inbound.length > 1) sinTema += 1;

    if (etapa !== 'soloClic' && muestras.length < MUESTRAS) {
      const ultimosIn = inbound.slice(-3).map(textoDe).filter(Boolean)
        .map((t) => t.replace(/\s+/g, ' ').slice(0, 160));
      const ultimoOut = outbound.length ? textoDe(outbound[outbound.length - 1]).replace(/\s+/g, ' ').slice(0, 160) : '';
      muestras.push({ tel: enmascarar(c.phone), etapa, anuncio, ultimosIn, ultimoOut, habloUltimo: ultimo?.direction });
    }
  }

  const total = convs.length;
  const noAgendo = total - etapas.agendo.length;

  console.log('\n-- Embudo --');
  tabla([
    ['Agendaron', etapas.agendo.length, total],
    ['Solo mandaron el mensaje del anuncio y no volvieron', etapas.soloClic.length, total],
    ['Conversaron pero el bot nunca les mandó el link', etapas.sinLink.length, total],
    ['Recibieron el link de agendar y no agendaron', etapas.linkSinCita.length, total],
  ]);

  const sinRespuestaTrasSilencio = convs.filter((c) => c.silencio1At || c.silencio2At).length;
  console.log('\n-- Seguimiento del bot --');
  tabla([
    ['Recibieron recordatorio por silencio', sinRespuestaTrasSilencio, total],
    ['Recibieron nudge tras el link (25-40 min)', convs.filter((c) => c.agendarNudgeSentAt).length, total],
    ['Recibieron mensaje de recuperación con oferta', convs.filter((c) => c.recuperadoAt).length, total],
    ['Escalados a humano', escalados, total],
    ['  …de esos, sin respuesta humana después de escalar', escaladosSinRespuestaHumana, escalados],
    ['No agendaron y el último mensaje es del cliente (quedó sin respuesta)', ultimoEsDelCliente, noAgendo],
  ]);

  console.log('\n-- Tiempo hasta nuestra primera respuesta --');
  console.log(`  Mediana, todos:        ${minutos(mediana(primeraRespuesta))}`);
  console.log(`  Mediana, no agendaron: ${minutos(mediana(primeraRespuestaNoAgendo))}`);
  console.log(`  Entraron fuera de horario (antes 7am, después 7pm o domingo): agendaron ${entradaFueraHorario.agendo}, no agendaron ${entradaFueraHorario.noAgendo}`);

  console.log('\n-- De qué hablaron los que no agendaron (puede caer en varios) --');
  const conversaron = etapas.sinLink.length + etapas.linkSinCita.length;
  tabla([...temasNoAgendo.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t, n]) => [t, n, conversaron]));
  tabla([['(no mencionaron ninguno de estos temas)', sinTema, conversaron]]);

  console.log('\n-- Por anuncio --');
  const anuncios = [...porAnuncio.entries()].sort((a, b) => b[1].total - a[1].total);
  for (const [nombre, { total: t, agendo: a }] of anuncios) {
    console.log(`  ${String(nombre).slice(0, 50).padEnd(52)} leads ${String(t).padStart(4)}  agendaron ${String(a).padStart(3)}  (${pct(a, t)})`);
  }

  // Leads del CRM que vienen de marketing (formularios, landing, importados).
  const leads = await prisma.lead.findMany({
    where: { ...filtroFecha, archivedAt: null, procedencia: { contains: 'marketing' } },
    select: { procedencia: true, estado: true, appointmentId: true, nurture1SentAt: true, nurture7SentAt: true, redSocial: true },
  });
  console.log('\n=== LEADS DEL CRM CON PROCEDENCIA DE MARKETING ===');
  console.log(`Total: ${leads.length}`);
  const porEstado = new Map();
  for (const l of leads) porEstado.set(l.estado, (porEstado.get(l.estado) || 0) + 1);
  tabla([...porEstado.entries()].sort((a, b) => b[1] - a[1]).map(([e, n]) => [e, n, leads.length]));
  tabla([
    ['Con cita vinculada', leads.filter((l) => l.appointmentId).length, leads.length],
    ['Recibieron el primer email de nurture', leads.filter((l) => l.nurture1SentAt).length, leads.length],
    ['Llegaron al email de 7 días sin agendar', leads.filter((l) => l.nurture7SentAt && !l.appointmentId).length, leads.length],
  ]);

  console.log(`\n=== MUESTRA DE CONVERSACIONES QUE NO AGENDARON (hasta ${MUESTRAS}) ===`);
  for (const m of muestras) {
    console.log(`\n[${m.tel}] etapa=${m.etapa} · anuncio=${String(m.anuncio).slice(0, 40)} · habló último=${m.habloUltimo}`);
    for (const t of m.ultimosIn) console.log(`  cliente: ${t}`);
    if (m.ultimoOut) console.log(`  nosotros: ${m.ultimoOut}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
