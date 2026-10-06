/**
 * El bot aprende cada día.
 *
 * Cada noche se leen los chats del día anterior y se miran dos cosas que el
 * bot no puede ver por sí mismo, porque cada conversación la contesta desde
 * cero y nunca se entera de cómo terminó la anterior:
 *
 *   1. Dónde se fue la gente: el último mensaje del bot antes de que el
 *      paciente dejara de contestar. Si después de la misma respuesta se van
 *      siempre, el problema es la respuesta.
 *   2. Qué contestó el equipo cuando el bot no supo. Eso es una FAQ que ya
 *      existe, solo que nadie la ha escrito.
 *
 * De ahí salen propuestas (FAQ, LECCION, ERROR). Todo esperaba una aprobación
 * en la bandeja y esa aprobación no llegaba: el 4 de octubre había 54
 * propuestas pendientes y la última aprobada era del 22 de septiembre. El bot
 * llevaba doce días sin aprender nada.
 *
 * Ahora (decisión del dueño, 4-oct-2026: todo automático):
 *   · Una LECCION que solo habla de cómo conversar entra sola al prompt.
 *   · Una FAQ (lo que contestó el equipo) entra sola al cerebro, salvo que
 *     traiga horas de cita de ejemplo.
 *   · Lo que no pasa el filtro queda en la bandeja; los ERROR son tareas de
 *     código. Todo lo que entró solo se retira desde la bandeja con un clic.
 *   · Cada mañana sale un reporte al celular con las cifras de ayer, lo que el
 *     bot aprendió y lo que espera una decisión.
 */

const { PrismaClient } = require('@prisma/client');
const Anthropic = require('@anthropic-ai/sdk');

const prisma = new PrismaClient();

// Corre una vez por noche sobre pocas decenas de chats: aquí sí vale el modelo
// que mejor lee entre líneas. Los chats en vivo siguen con el rápido.
const MODELO = 'claude-opus-5';
const TZ = 'America/Bogota';
const HORAS_PARA_DARLO_POR_IDO = 6;

// Lo que el revisor propone entra al bot sin pasar por la bandeja (decisión del
// dueño, 4-oct-2026). Se apaga con APRENDIZAJE_AUTO=false en Render.
const auto = () => process.env.APRENDIZAJE_AUTO !== 'false';

// Una lección entra sola únicamente si habla de CÓMO conversar. Si afirma un
// hecho (plata, horas, convenios, salud, enlaces), cambia quién es el bot o
// toca cuándo se pasa el caso a una persona, la aprueba alguien del equipo.
const NO_ENTRA_SOLA = /\$|\d{3}|\d{1,2}:\d{2}|\d\s?[ap]\.?\s?m\b|https?:|www\.|\.com\b|\beps\b|prepagad|convenio|asegurador|p[óo]liza|gratis|gratuit|descuento|promoci[óo]n|2x1|garant[íi]a|financia|cuotas|domicilio|diagn[óo]stic|medicament|\bmarcas?\b|inteligencia artificial|asistente virtual|robot|persona real|escal|urgenc/i;
const LARGO_MAXIMO_DE_LECCION = 400;

function entraSola(p) {
  const regla = String(p.respuesta || '');
  // Una respuesta que dio el equipo entra tal cual, salvo que traiga horas de
  // ejemplo: el bot las copiaría como si fueran de la agenda.
  if (p.tipo === 'FAQ') return !/\d{1,2}:\d{2}|\d\s?[ap]\.\s?m\b/i.test(regla);
  return p.tipo === 'LECCION'
    && (p.casos || 0) >= 2
    && regla.length <= LARGO_MAXIMO_DE_LECCION
    && !NO_ENTRA_SOLA.test(regla);
}

const hoyBogota = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);

function ayerBogota() {
  const d = new Date(`${hoyBogota()}T12:00:00-05:00`);
  d.setUTCDate(d.getUTCDate() - 1);
  return hoyBogota(d);
}

function rangoDelDia(dia) {
  const desde = new Date(`${dia}T00:00:00-05:00`);
  return { desde, hasta: new Date(desde.getTime() + 24 * 3600 * 1000) };
}

const last10 = (tel) => String(tel || '').replace(/\D/g, '').slice(-10);

function quien(m) {
  if (m.direction === 'INBOUND') return 'PACIENTE';
  if (m.sentByBot) return 'BOT';
  return m.type === 'template' ? 'PLANTILLA' : 'EQUIPO';
}

/** Cómo terminó una conversación, visto desde hoy. */
async function desenlace(conv, mensajes) {
  const ultimo = mensajes[mensajes.length - 1];
  const tel = last10(conv.phone);
  const cita = tel ? await prisma.appointment.findFirst({
    where: {
      OR: [{ patientPhone: { contains: tel } }, { patient: { is: { telefono: { contains: tel } } } }],
      createdAt: { gte: mensajes[0].createdAt },
      estado: { not: 'CANCELLED' },
    },
    select: { id: true },
  }) : null;
  if (cita || conv.agendarBookedAt) return 'CITA';
  if (ultimo.direction === 'INBOUND') return 'ESPERANDO';
  // Se mide desde lo último que escribió ÉL: los recordatorios automáticos
  // del bot no cuentan como que la conversación siga viva.
  const suyo = [...mensajes].reverse().find((m) => m.direction === 'INBOUND');
  const horas = (Date.now() - new Date((suyo || ultimo).createdAt).getTime()) / 3600000;
  return horas >= HORAS_PARA_DARLO_POR_IDO ? 'SE_FUE' : 'EN_CURSO';
}

/** El último mensaje del bot que el paciente dejó sin contestar. */
function dondeSeFue(mensajes) {
  const ultimoPaciente = [...mensajes].reverse().findIndex((m) => m.direction === 'INBOUND');
  if (ultimoPaciente < 0) return null;
  const i = mensajes.length - 1 - ultimoPaciente;
  const botDespues = mensajes.slice(i + 1).find((m) => m.direction === 'OUTBOUND' && m.sentByBot);
  if (!botDespues) return null;
  return { paciente: String(mensajes[i].body || ''), bot: String(botDespues.body || '') };
}

/** Pregunta del paciente → lo que contestó una persona del equipo. */
function respuestasDelEquipo(mensajes) {
  const pares = [];
  mensajes.forEach((m, i) => {
    if (quien(m) !== 'EQUIPO' || !m.body) return;
    const pregunta = [...mensajes.slice(0, i)].reverse().find((x) => x.direction === 'INBOUND' && x.body);
    if (pregunta) pares.push({ paciente: pregunta.body, equipo: m.body });
  });
  return pares;
}

/**
 * Todo lo que la revisión necesita de un día: los chats con su desenlace, las
 * cifras y, de los últimos siete días, dónde se fue cada quien (un patrón se ve
 * en la semana, no en un día con tres chats).
 */
async function datosDelDia(dia) {
  const { desde, hasta } = rangoDelDia(dia);
  const convs = await prisma.whatsAppConversation.findMany({
    where: {
      businessLine: 'CRM',
      messages: { some: { createdAt: { gte: desde, lt: hasta } } },
    },
    select: { id: true, phone: true, contactName: true, contactType: true, agendarBookedAt: true },
  });

  const chats = [];
  for (const conv of convs) {
    const mensajes = await prisma.whatsAppMessage.findMany({
      where: { conversationId: conv.id, type: { in: ['text', 'interactive', 'audio', 'template'] } },
      orderBy: { createdAt: 'asc' },
      select: { direction: true, sentByBot: true, type: true, body: true, createdAt: true },
    });
    if (mensajes.length === 0) continue;
    chats.push({
      id: conv.id,
      conv,
      desde,
      hasta,
      mensajes,
      final: await desenlace(conv, mensajes),
      seFueTras: dondeSeFue(mensajes),
      equipo: respuestasDelEquipo(mensajes.filter((m) => m.createdAt >= desde && m.createdAt < hasta)),
      mensajesDelPaciente: mensajes.filter((m) => m.direction === 'INBOUND').length,
    });
  }

  const metricas = {
    chats: chats.length,
    citas: chats.filter((c) => c.final === 'CITA').length,
    seFueron: chats.filter((c) => c.final === 'SE_FUE').length,
    seFueronAlPrimerMensaje: chats.filter((c) => c.final === 'SE_FUE' && c.mensajesDelPaciente <= 1).length,
    esperandoRespuesta: chats.filter((c) => c.final === 'ESPERANDO').length,
    respuestasDelEquipo: chats.reduce((n, c) => n + c.equipo.length, 0),
  };

  // La semana: solo el par "lo último que dijo él / lo que le contestó el bot".
  const semanaDesde = new Date(desde.getTime() - 6 * 24 * 3600 * 1000);
  const convsSemana = await prisma.whatsAppConversation.findMany({
    where: { businessLine: 'CRM', lastMessageAt: { gte: semanaDesde, lt: hasta } },
    select: { id: true, phone: true, agendarBookedAt: true },
  });
  const semana = [];
  for (const conv of convsSemana) {
    const mensajes = await prisma.whatsAppMessage.findMany({
      where: { conversationId: conv.id, type: { in: ['text', 'interactive', 'audio'] } },
      orderBy: { createdAt: 'asc' },
      select: { direction: true, sentByBot: true, type: true, body: true, createdAt: true },
    });
    if (mensajes.length === 0) continue;
    const final = await desenlace(conv, mensajes);
    const tras = dondeSeFue(mensajes);
    if (final === 'SE_FUE' && tras) semana.push(tras);
  }

  return { dia, chats, metricas, semana };
}

const recorte = (t, n) => (String(t || '').length > n ? `${String(t).slice(0, n)}…` : String(t || ''));

function transcripcion(chat, etiqueta) {
  const linea = (m) => {
    const hora = m.createdAt.toLocaleTimeString('es-CO', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
    return `[${hora}] ${quien(m)}: ${recorte(m.body, 600).replace(/\n+/g, ' ⏎ ')}`;
  };
  // Solo los mensajes del día revisado. Antes iba la conversación entera y el
  // revisor seguía reportando, día tras día, lo que el bot dijo la semana
  // pasada ("cupos de la semana") como si fuera de hoy.
  const delDia = chat.mensajes.filter((m) => m.createdAt >= chat.desde && m.createdAt < chat.hasta).slice(-40);
  const antes = chat.mensajes.filter((m) => m.createdAt < chat.desde).slice(-3);
  const contexto = antes.length
    ? `(días anteriores, solo contexto: NO los juzgues ni los cites)\n${antes.map(linea).join('\n')}\n(día revisado)\n`
    : '';
  return `### ${etiqueta} — desenlace: ${chat.final}\n${contexto}${delDia.map(linea).join('\n')}`;
}

const ESQUEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['resumen', 'propuestas'],
  properties: {
    resumen: { type: 'string' },
    propuestas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['tipo', 'titulo', 'pregunta', 'respuesta', 'evidencia', 'casos', 'chats'],
        properties: {
          tipo: { type: 'string', enum: ['FAQ', 'LECCION', 'ERROR'] },
          titulo: { type: 'string' },
          pregunta: { type: 'string' },
          respuesta: { type: 'string' },
          evidencia: { type: 'string' },
          casos: { type: 'integer' },
          chats: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

const INSTRUCCIONES = `Revisas las conversaciones de WhatsApp de OírConecta, un centro auditivo en Bogotá (Cra. 10 #96-25, consultorio 320). Las atiende Aura, un bot con un solo objetivo: que cada persona de Bogotá o la Sabana termine la conversación con su valoración auditiva agendada, diciendo la verdad y sin presionar. Aura NO ve cómo terminaron sus conversaciones anteriores: tú sí. Tu trabajo es que mañana agende más que hoy: encontrar después de qué respuestas se fue la gente, qué tuvieron en común los chats que sí terminaron en cita, y convertirlo en reglas.

Lo que hoy es cierto. No lo contradigas ni lo propongas como novedad:
- La valoración auditiva no tiene costo. Solo se pagan $150.000 si el paciente quiere llevarse los exámenes impresos.
- No existen "cupos de la semana" ni condiciones de "agendar hoy".
- Las horas que Aura ofrece salen de la agenda. Los seguimientos automáticos solo salen entre las 8 a.m. y las 8 p.m.
- Más abajo van las INSTRUCCIONES VIGENTES de Aura. Si lo que viste ya está escrito ahí y Aura no lo cumplió, es un ERROR ("no está cumpliendo la regla X"), no una lección nueva.

Hay tres tipos de propuesta:

FAQ — un dato que Aura no supo o inventó, y que alguien del EQUIPO sí contestó en el chat. La respuesta sale de lo que dijo el equipo, no de tu cabeza. "pregunta" es cómo lo preguntan los pacientes (máx 200 caracteres); "respuesta" es lo que Aura debe contestar, en tuteo (máx 1000). Si el equipo no lo contestó, no es FAQ: no inventes precios, horarios, convenios ni servicios. La respuesta no lleva horas de cita de ejemplo ("1️⃣ 8:00 a.m."): las horas las pone la agenda. Una FAQ sin horas entra al bot al día siguiente sin que nadie la revise.

LECCION — una forma de responder que hace que la gente se vaya, y cómo hacerlo distinto. Se saca comparando: después de qué respuestas el paciente dejó de escribir, y qué pasó en los chats que sí terminaron en cita. "respuesta" es la regla para Aura: una instrucción corta y concreta, de máximo 300 caracteres ("Cuando pregunten X, haz Y en vez de Z"). Una lección habla solo de CÓMO conversar: qué va primero, qué no preguntar, cuándo ofrecer horarios, cómo contestar una objeción. NO lleva cifras, precios, horas de ejemplo, fechas, enlaces, nombres de EPS ni promesas de servicio: eso es un dato y va como FAQ. Las lecciones que cumplen esto pueden entrar al bot al día siguiente sin que nadie las revise, así que escribe solo las que firmarías. Nada de reglas genéricas tipo "sé más empático": si no puedes decir exactamente qué cambia en el mensaje, no la propongas.

ERROR — algo que Aura hizo mal y que no se arregla con una regla de conversación: prometió algo que no podía hacer, dio una fecha o un dato equivocado, se le escapó texto interno, respondió dos veces, falló una herramienta, o no cumplió una instrucción que ya tiene. "respuesta" dice qué corregir. Los errores los arregla un programador.

Reglas:
- "casos" es cuántas conversaciones distintas respaldan la propuesta. Cuenta de verdad, usando también la lista de la semana. Con un solo caso solo propón ERROR o FAQ; una LECCION necesita al menos 2 casos.
- "chats" son las etiquetas (C1, C2…) de las conversaciones de hoy que la respaldan.
- "evidencia" dice lo que viste, con cifras y citando frases cortas reales: "En 4 de 6 chats que preguntaron el precio, Aura contestó con la explicación larga y el paciente no volvió a escribir".
- No repitas lo que ya está en las instrucciones vigentes, en las FAQs, en las lecciones activas ni en las propuestas pendientes. Si un patrón ya propuesto volvió a pasar, no lo propongas otra vez.
- Juzga solo los mensajes del día revisado. Lo que aparezca como "días anteriores" es contexto: puede ser de una versión vieja de Aura y no cuenta.
- Menos es más: 0 a 5 propuestas. Un día sin nada que proponer es una respuesta válida.
- "resumen": tres frases para el dueño del centro, sin tecnicismos: cómo fue el día, la razón principal por la que se fue la gente y qué hicieron distinto los chats que sí agendaron. Si una lección activa no se está cumpliendo, o está espantando gente, dilo aquí citándola.
- Escribe en español de Colombia.`;

async function contexto() {
  const retailId = await require('./retail.service').getRetailProfileId();
  const [faqs, lecciones, pendientes] = await Promise.all([
    retailId ? require('./iaAgentConfig.service').listFaqs(retailId).catch(() => []) : [],
    prisma.botAprendizaje.findMany({ where: { estado: 'APROBADA', tipo: 'LECCION' }, select: { respuesta: true } }),
    prisma.botAprendizaje.findMany({ where: { estado: 'PENDIENTE' }, select: { tipo: true, titulo: true } }),
  ]);
  return {
    instrucciones: require('./waCorporateBot.service').instruccionesVigentes(),
    faqs: (faqs || []).filter((f) => f.isActive !== false).map((f) => `- ${f.question}`).join('\n') || '(ninguna)',
    lecciones: lecciones.map((l) => `- ${l.respuesta}`).join('\n') || '(ninguna)',
    pendientes: pendientes.map((p) => `- [${p.tipo}] ${p.titulo}`).join('\n') || '(ninguna)',
  };
}

async function pedirPropuestas(datos) {
  const etiquetas = new Map();
  const bloques = datos.chats.map((c, i) => {
    etiquetas.set(`C${i + 1}`, c.id);
    return transcripcion(c, `C${i + 1}`);
  });
  const ctx = await contexto();
  const semana = datos.semana
    .map((s, i) => `${i + 1}. Paciente: "${recorte(s.paciente, 200)}" → Bot (sin respuesta): "${recorte(s.bot, 300)}"`)
    .join('\n');

  const contenido = `Día revisado: ${datos.dia}
Cifras del día: ${JSON.stringify(datos.metricas)}

INSTRUCCIONES VIGENTES DE AURA:
"""
${ctx.instrucciones}
"""

FAQs que Aura ya tiene:
${ctx.faqs}

Lecciones activas (Aura las lee en cada conversación):
${ctx.lecciones}

Propuestas pendientes de revisar (no repetir):
${ctx.pendientes}

DÓNDE SE FUE LA GENTE EN LOS ÚLTIMOS 7 DÍAS (último mensaje del paciente → respuesta del bot que quedó sin contestar):
${semana || '(nadie)'}

CONVERSACIONES DEL DÍA:
${bloques.join('\n\n')}`;

  const client = new Anthropic();
  const resp = await client.messages.create({
    model: MODELO,
    max_tokens: 16000,
    system: INSTRUCCIONES,
    output_config: { format: { type: 'json_schema', schema: ESQUEMA } },
    messages: [{ role: 'user', content: contenido }],
  });
  if (resp.stop_reason === 'refusal') throw new Error('La revisión fue rechazada por el modelo.');
  const texto = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const out = JSON.parse(texto);
  return {
    resumen: out.resumen,
    propuestas: out.propuestas.map((p) => ({
      ...p,
      conversationIds: p.chats.map((e) => etiquetas.get(e)).filter(Boolean),
    })),
  };
}

/**
 * Revisa un día. Por defecto, ayer. Deja las cifras en BotRevision y las
 * propuestas en BotAprendizaje. Si el día ya se revisó, no hace nada salvo que
 * se pida `forzar`.
 */
async function revisarDia({ dia = ayerBogota(), forzar = false } = {}) {
  if (!process.env.ANTHROPIC_API_KEY) return { skipped: 'no-anthropic-key' };

  const existente = await prisma.botRevision.findUnique({ where: { dia } });
  if (existente && !forzar) return { skipped: 'ya-revisado', dia };
  // Se reclama el día antes de gastar en el modelo: dos ticks del cron no
  // pueden revisar la misma noche dos veces.
  if (!existente) {
    try {
      await prisma.botRevision.create({ data: { dia, metricas: {} } });
    } catch {
      return { skipped: 'en-curso', dia };
    }
  }

  try {
    const datos = await datosDelDia(dia);
    let resumen = 'No hubo conversaciones ese día.';
    let creadas = [];
    if (datos.chats.length > 0) {
      const out = await pedirPropuestas(datos);
      resumen = out.resumen;
      for (const p of out.propuestas) {
        const sola = auto() && entraSola(p);
        const creada = await prisma.botAprendizaje.create({
          data: {
            tipo: p.tipo,
            titulo: recorte(p.titulo, 180),
            pregunta: p.tipo === 'FAQ' ? recorte(p.pregunta, 200) : null,
            respuesta: p.tipo === 'FAQ' ? recorte(p.respuesta, 1000) : p.respuesta,
            evidencia: p.evidencia,
            casos: Math.max(1, p.casos || 1),
            conversationIds: p.conversationIds,
            ...(sola && p.tipo === 'LECCION' ? { estado: 'APROBADA', revisadoAt: new Date(), revisadoPor: 'AUTO' } : {}),
          },
        });
        // La FAQ además se escribe en el cerebro, igual que al aprobarla a mano.
        creadas.push(sola && p.tipo === 'FAQ' ? await aprobar(creada.id, {}, 'AUTO').catch(() => creada) : creada);
      }
    }

    await prisma.botRevision.update({
      where: { dia },
      data: { metricas: { ...datos.metricas, resumen }, propuestas: creadas.length },
    });

    // El reporte sale todos los días, haya o no propuestas: es la forma de ver
    // cada mañana si el bot está agendando más o menos que la semana pasada.
    require('./alertaEquipo.service').avisar({
      titulo: `Aura, ${diaLegible(dia)}: ${datos.metricas.chats} ${datos.metricas.chats === 1 ? 'chat' : 'chats'}, ${datos.metricas.citas} ${datos.metricas.citas === 1 ? 'cita' : 'citas'}`,
      quien: 'Revisión de cada mañana',
      texto: await reporte(resumen, creadas).catch(() => resumen),
      largo: true,
    }).catch(() => {});
    return { dia, metricas: datos.metricas, resumen, propuestas: creadas.length };
  } catch (e) {
    // El día queda marcado con el error y NO se reintenta solo: el cron pasa
    // cada minuto, y un fallo que se repite gastaría en el modelo toda la
    // madrugada. Se reintenta a mano con "Revisar ahora".
    await prisma.botRevision.update({
      where: { dia }, data: { metricas: { error: e.message } },
    }).catch(() => {});
    throw e;
  }
}

const diaLegible = (dia) => new Date(`${dia}T12:00:00-05:00`)
  .toLocaleDateString('es-CO', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });

/** Citas por cada 100 chats en una tanda de noches revisadas. */
function tasa(revisiones) {
  const chats = revisiones.reduce((n, r) => n + (r.metricas?.chats || 0), 0);
  const citas = revisiones.reduce((n, r) => n + (r.metricas?.citas || 0), 0);
  return chats ? { chats, citas, porCien: Math.round((citas / chats) * 100) } : null;
}

/** Lo que el dueño lee cada mañana: cómo fue ayer, qué aprendió y qué lo espera. */
async function reporte(resumen, creadas) {
  const [revisiones, pendientes] = await Promise.all([
    prisma.botRevision.findMany({ orderBy: { dia: 'desc' }, take: 14 }),
    prisma.botAprendizaje.groupBy({ by: ['tipo'], where: { estado: 'PENDIENTE' }, _count: { _all: true } }),
  ]);
  const semana = tasa(revisiones.slice(0, 7));
  const anterior = tasa(revisiones.slice(7, 14));
  const lineas = [resumen];

  if (semana) {
    lineas.push(`Últimos 7 días: ${semana.citas} citas en ${semana.chats} chats (${semana.porCien} de cada 100)`
      + (anterior ? `. Los 7 anteriores: ${anterior.porCien} de cada 100.` : '.'));
  }

  const solas = creadas.filter((c) => c.revisadoPor === 'AUTO');
  if (solas.length) lineas.push(`Aprendió hoy:\n${solas.map((c) => `• ${c.titulo}`).join('\n')}`);

  const cuantas = (tipo) => pendientes.find((p) => p.tipo === tipo)?._count?._all || 0;
  const espera = [
    cuantas('FAQ') && `${cuantas('FAQ')} respuestas por aprobar`,
    cuantas('LECCION') && `${cuantas('LECCION')} lecciones por aprobar`,
    cuantas('ERROR') && `${cuantas('ERROR')} errores por corregir`,
  ].filter(Boolean);
  if (espera.length) lineas.push(`Te esperan en WhatsApp → 🧠 Aprendizaje: ${espera.join(', ')}.`);

  return lineas.join('\n\n');
}

/**
 * Para el cron: de madrugada, una vez, sobre el día de ayer. No se espera:
 * la revisión tarda un minuto y el tick del cron no puede quedarse parado
 * (detrás vienen los recordatorios de cita).
 */
let enCurso = false;
function revisionNocturna() {
  const hora = Number(new Date().toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }));
  // De 6 a 9: el reporte le llega al dueño al empezar el día, no a las 3 a.m.
  if (hora < 6 || hora > 9 || enCurso) return { skipped: 'fuera-de-hora-o-en-curso' };
  enCurso = true;
  revisarDia()
    .then((r) => { if (!r?.skipped) console.log('[aprendizaje] revisión', r.dia, '·', r.propuestas, 'propuestas'); })
    .catch((e) => console.error('[aprendizaje] revisión falló:', e.message))
    .finally(() => { enCurso = false; });
  return { started: true };
}

async function listar() {
  const [pendientes, aprobadas, revisiones] = await Promise.all([
    prisma.botAprendizaje.findMany({ where: { estado: 'PENDIENTE' }, orderBy: [{ casos: 'desc' }, { createdAt: 'desc' }] }),
    prisma.botAprendizaje.findMany({ where: { estado: 'APROBADA' }, orderBy: { revisadoAt: 'desc' }, take: 50 }),
    prisma.botRevision.findMany({ orderBy: { dia: 'desc' }, take: 14 }),
  ]);
  return { pendientes, aprobadas, revisiones };
}

async function aprobar(id, cambios = {}, userId = null) {
  const p = await prisma.botAprendizaje.findUnique({ where: { id } });
  if (!p) throw Object.assign(new Error('Propuesta no encontrada'), { statusCode: 404 });
  const data = {
    titulo: cambios.titulo ?? p.titulo,
    pregunta: cambios.pregunta ?? p.pregunta,
    respuesta: cambios.respuesta ?? p.respuesta,
  };

  let faqId = p.faqId;
  if (p.tipo === 'FAQ' && !faqId) {
    const retailId = await require('./retail.service').getRetailProfileId();
    const faq = await require('./iaAgentConfig.service').createFaq(retailId, {
      question: data.pregunta, answer: data.respuesta,
    });
    faqId = faq.id;
  }

  return prisma.botAprendizaje.update({
    where: { id },
    data: { ...data, faqId, estado: 'APROBADA', revisadoAt: new Date(), revisadoPor: userId },
  });
}

/** Descarta una pendiente, o retira una lección que ya estaba aprobada. */
async function descartar(id, userId = null) {
  return prisma.botAprendizaje.update({
    where: { id },
    data: { estado: 'DESCARTADA', revisadoAt: new Date(), revisadoPor: userId },
  });
}

/** Las lecciones aprobadas, tal como las lee el bot en cada conversación. */
async function leccionesParaElPrompt() {
  const lecciones = await prisma.botAprendizaje.findMany({
    where: { estado: 'APROBADA', tipo: 'LECCION' },
    orderBy: { revisadoAt: 'desc' },
    take: 20,
    select: { respuesta: true },
  }).catch(() => []);
  if (lecciones.length === 0) return '';
  return `\n\n═══ LO QUE APRENDIMOS DE CONVERSACIONES REALES ═══
Estas reglas salieron de ver cómo terminaron chats anteriores. Son sobre cómo conversar: si alguna contradice un precio, un horario o un dato de arriba, vale el dato de arriba.
${lecciones.map((l) => `· ${l.respuesta}`).join('\n')}
═══════════════════════════════════`;
}

module.exports = {
  revisarDia,
  revisionNocturna,
  datosDelDia,
  listar,
  aprobar,
  descartar,
  leccionesParaElPrompt,
  entraSola,
};
