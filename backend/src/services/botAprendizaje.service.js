/**
 * El bot aprende — pero con alguien que apruebe.
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
 * De ahí salen propuestas (FAQ, LECCION, ERROR). Ninguna toca a un paciente
 * hasta que alguien la aprueba en la bandeja: una FAQ aprobada entra al
 * cerebro, una lección aprobada entra al prompt del bot.
 */

const { PrismaClient } = require('@prisma/client');
const Anthropic = require('@anthropic-ai/sdk');

const prisma = new PrismaClient();

// Corre una vez por noche sobre pocas decenas de chats: aquí sí vale el modelo
// que mejor lee entre líneas. Los chats en vivo siguen con el rápido.
const MODELO = 'claude-opus-5';
const TZ = 'America/Bogota';
const HORAS_PARA_DARLO_POR_IDO = 6;

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
  const lineas = chat.mensajes.slice(-40).map((m) => {
    const hora = m.createdAt.toLocaleTimeString('es-CO', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
    return `[${hora}] ${quien(m)}: ${recorte(m.body, 600).replace(/\n+/g, ' ⏎ ')}`;
  });
  return `### ${etiqueta} — desenlace: ${chat.final}\n${lineas.join('\n')}`;
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

const INSTRUCCIONES = `Revisas las conversaciones de WhatsApp de OírConecta, un centro auditivo en Bogotá (Cr 10 #96-25, consultorio 320). Un bot atiende a los pacientes y agenda valoraciones auditivas. El bot NO ve cómo terminaron sus conversaciones anteriores: tú sí. Tu trabajo es encontrar qué debería cambiar para que más gente llegue a la cita, y proponerlo. Una persona del equipo aprueba o descarta cada propuesta; nada llega a un paciente sin eso.

Hay tres tipos de propuesta:

FAQ — un dato que el bot no supo o inventó, y que alguien del EQUIPO sí contestó en el chat. La respuesta sale de lo que dijo el equipo, no de tu cabeza. "pregunta" es cómo lo preguntan los pacientes (máx 200 caracteres); "respuesta" es lo que el bot debe contestar, en tuteo bogotano (máx 1000). Si el equipo no lo contestó, no es FAQ: no inventes precios, horarios, convenios ni servicios.

LECCION — una forma de responder que hace que la gente se vaya, y cómo hacerlo distinto. Se saca comparando: después de qué respuestas del bot el paciente dejó de escribir, y qué pasó en los chats que sí terminaron en cita. "respuesta" es la regla para el bot, escrita como instrucción corta y concreta ("Cuando pregunten X, haz Y en vez de Z"). Nada de reglas genéricas tipo "sé más empático": si no puedes decir exactamente qué cambia en el mensaje, no la propongas.

ERROR — algo que el bot hizo mal y que no se arregla con una regla de conversación: prometió algo que no podía hacer, dio una fecha o un dato equivocado, se le escapó texto interno, respondió dos veces, falló una herramienta. "respuesta" dice qué corregir.

Reglas:
- "casos" es cuántas conversaciones distintas respaldan la propuesta. Cuenta de verdad, usando también la lista de la semana. Con un solo caso solo propón ERROR o FAQ; una LECCION necesita al menos 2 casos.
- "chats" son las etiquetas (C1, C2…) de las conversaciones de hoy que la respaldan.
- "evidencia" dice lo que viste, con cifras y citando frases cortas reales: "En 4 de 6 chats que preguntaron el precio, el bot contestó con la explicación de las tres razones y el paciente no volvió a escribir".
- No repitas lo que ya está en las FAQs, en las lecciones aprobadas ni en las propuestas pendientes. Si un patrón ya propuesto volvió a pasar, no lo propongas otra vez.
- Menos es más: 0 a 5 propuestas. Un día sin nada que proponer es una respuesta válida.
- "resumen": dos o tres frases sobre cómo fue el día, para el dueño del centro. Sin tecnicismos.
- Escribe en español de Colombia.`;

async function contexto() {
  const retailId = await require('./retail.service').getRetailProfileId();
  const [faqs, lecciones, pendientes] = await Promise.all([
    retailId ? require('./iaAgentConfig.service').listFaqs(retailId).catch(() => []) : [],
    prisma.botAprendizaje.findMany({ where: { estado: 'APROBADA', tipo: 'LECCION' }, select: { respuesta: true } }),
    prisma.botAprendizaje.findMany({ where: { estado: 'PENDIENTE' }, select: { tipo: true, titulo: true } }),
  ]);
  return {
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

FAQs que el bot ya tiene:
${ctx.faqs}

Lecciones ya aprobadas:
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
        creadas.push(await prisma.botAprendizaje.create({
          data: {
            tipo: p.tipo,
            titulo: recorte(p.titulo, 180),
            pregunta: p.tipo === 'FAQ' ? recorte(p.pregunta, 200) : null,
            respuesta: p.tipo === 'FAQ' ? recorte(p.respuesta, 1000) : p.respuesta,
            evidencia: p.evidencia,
            casos: Math.max(1, p.casos || 1),
            conversationIds: p.conversationIds,
          },
        }));
      }
    }

    await prisma.botRevision.update({
      where: { dia },
      data: { metricas: { ...datos.metricas, resumen }, propuestas: creadas.length },
    });

    if (creadas.length > 0) {
      require('./alertaEquipo.service').avisar({
        titulo: `El bot tiene ${creadas.length} ${creadas.length === 1 ? 'propuesta' : 'propuestas'} para aprender`,
        quien: 'Revisión nocturna',
        texto: `${resumen}\n\nRevísalas en la bandeja de WhatsApp → 🧠 Aprendizaje.`,
      }).catch(() => {});
    }
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

/**
 * Para el cron: de madrugada, una vez, sobre el día de ayer. No se espera:
 * la revisión tarda un minuto y el tick del cron no puede quedarse parado
 * (detrás vienen los recordatorios de cita).
 */
let enCurso = false;
function revisionNocturna() {
  const hora = Number(new Date().toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }));
  if (hora < 3 || hora > 6 || enCurso) return { skipped: 'fuera-de-hora-o-en-curso' };
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
Estas reglas salieron de ver cómo terminaron chats anteriores y las aprobó el equipo. Mandan sobre los ejemplos de arriba.
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
};
