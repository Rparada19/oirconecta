/**
 * Seed de blogs — crea posts PUBLICADOS para el sitio público.
 * Idempotente: usa upsert por slug. Correr con: node prisma/seed-blogs.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const POSTS = [
  {
    slug: 'guia-elegir-primer-audifono',
    titulo: 'Guía para elegir tu primer audífono',
    resumen: 'Conoce los factores clave para seleccionar el dispositivo que mejor se adapta a tu tipo de pérdida auditiva y estilo de vida.',
    categoria: 'guias',
    tags: ['audífonos', 'guía'],
    destacado: true,
    contenido: `Elegir un audífono es una decisión importante que impacta directamente tu calidad de vida. Aquí te explicamos los aspectos esenciales que debes considerar antes de tomar una decisión.\n\n## Tipo de pérdida auditiva\n\nEl primer paso es realizarte una audiometría con un audiólogo certificado. El resultado determina el grado y tipo de pérdida auditiva, lo que guía la selección del dispositivo adecuado.\n\n## Estilo de vida\n\nTus actividades diarias influyen en qué tipo de audífono te conviene. Si practicas deportes, necesitas un modelo resistente al sudor. Si trabajas en ambientes ruidosos, prioriza audífonos con cancelación de ruido avanzada.\n\n## Tecnología y conectividad\n\nLos audífonos modernos se conectan al teléfono vía Bluetooth, permiten streaming de audio y se controlan desde una app. Considera si estas características son importantes para ti.\n\n## Presupuesto\n\nLos precios varían ampliamente según marca y tecnología. OírConecta te ofrece información de referencia de precios para que compares con transparencia antes de visitar a un especialista.`,
  },
  {
    slug: 'que-es-la-audiometria',
    titulo: '¿Qué es la audiometría y cuándo hacerla?',
    resumen: 'La audiometría es la prueba de referencia para evaluar tu audición. Te explicamos en qué consiste y cada cuánto debes realizarla.',
    categoria: 'glosario',
    tags: ['audiometría', 'diagnóstico'],
    contenido: `La audiometría es la prueba estándar para medir la capacidad auditiva. Consiste en escuchar sonidos a distintas frecuencias e intensidades en una cabina insonorizada, y señalar cuándo los percibes.\n\n## ¿Qué mide?\n\nMide el umbral auditivo: el tono más suave que puedes escuchar en cada frecuencia. El resultado se plasma en un audiograma, que muestra visualmente el perfil de tu audición.\n\n## ¿Cuándo hacerla?\n\n- **Niños**: al nacer (tamizaje neonatal) y periódicamente durante el desarrollo.\n- **Adultos**: cada 2-3 años a partir de los 50 años, o antes si notas dificultad para escuchar conversaciones.\n- **Con exposición a ruido**: anualmente si trabajas en ambientes ruidosos.\n- **Ante síntomas**: zumbidos, sensación de oído tapado o dificultad repentina para escuchar.\n\n## ¿Duele?\n\nNo, es completamente indolora y dura entre 20 y 40 minutos. El resultado lo interpreta un audiólogo o médico ORL.`,
  },
  {
    slug: 'vida-con-hipoacusia-consejos',
    titulo: 'Vida con hipoacusia: consejos prácticos',
    resumen: 'Pequeños ajustes en el hogar, el trabajo y el entorno social que hacen una gran diferencia para quienes conviven con pérdida auditiva.',
    categoria: 'cuidados',
    tags: ['hipoacusia', 'bienestar'],
    contenido: `Vivir con pérdida auditiva no significa renunciar a una vida plena. Con algunos ajustes en el entorno y los hábitos cotidianos, la comunicación mejora significativamente.\n\n## En el hogar\n\n- Usa alertas visuales para el timbre y el detector de humo.\n- Subtitula el televisor y aumenta el contraste visual en subtítulos.\n- Reduce el ruido de fondo al hablar: apaga el televisor o la radio.\n\n## En el trabajo\n\n- Infórmale a tu equipo sobre tu condición — la mayoría adapta su comunicación con gusto.\n- Pide que te hablen de frente para aprovechar la lectura labial.\n- Usa auriculares con cancelación de ruido en espacios abiertos.\n\n## En entornos sociales\n\n- Elige mesas en rincones tranquilos en restaurantes.\n- No finjas entender — pide que repitan sin pena.\n- Infórmate sobre grupos de apoyo para personas con hipoacusia en tu ciudad.\n\n## Con tu audífono\n\nSi ya usas audífono, llévalo siempre cargado y no lo guardes. El cerebro necesita estimulación constante para mantener la comprensión del habla.`,
  },
  {
    slug: 'audifonos-recargables-vs-pilas',
    titulo: 'Audífonos recargables vs. de pilas: ¿cuál elegir?',
    resumen: 'Comparamos autonomía, costo a largo plazo y comodidad para ayudarte a decidir entre un audífono recargable y uno de pilas.',
    categoria: 'comparativas',
    tags: ['audífonos', 'comparativa'],
    contenido: `Una de las primeras decisiones al comprar un audífono es el tipo de alimentación. Ambas opciones tienen ventajas según tu rutina.\n\n## Audífonos recargables\n\nSe cargan en una base durante la noche y ofrecen un día completo de uso. Son más cómodos para personas con problemas de destreza manual y eliminan el gasto continuo en pilas.\n\n## Audífonos de pilas\n\nUsan pilas desechables que se reemplazan cada 3 a 10 días. Su ventaja es que puedes llevar repuestos a cualquier parte sin depender de un cargador.\n\n## ¿Cuál conviene?\n\n- Si viajas mucho a lugares sin electricidad confiable, las pilas dan tranquilidad.\n- Si valoras la comodidad y el ahorro a largo plazo, lo recargable es ideal.\n\nConsulta con tu audiólogo qué modelos están disponibles para tu tipo de pérdida auditiva.`,
  },
  {
    slug: 'proteger-tu-audicion-ruido',
    titulo: 'Cómo proteger tu audición del ruido',
    resumen: 'La exposición prolongada al ruido es una causa evitable de pérdida auditiva. Te damos pautas para cuidar tus oídos en el día a día.',
    categoria: 'guias',
    tags: ['prevención', 'ruido'],
    contenido: `La pérdida auditiva inducida por ruido es permanente, pero totalmente prevenible. Cuidar tus oídos hoy protege tu audición para el futuro.\n\n## La regla del 60/60\n\nAl usar audífonos o auriculares, no superes el 60 % del volumen máximo durante más de 60 minutos seguidos.\n\n## En ambientes ruidosos\n\n- Usa protección auditiva (tapones o orejeras) en conciertos, obras o talleres.\n- Aléjate de las fuentes de ruido cuando sea posible.\n- Da descansos a tus oídos en zonas silenciosas.\n\n## Señales de alerta\n\nSi escuchas zumbidos (tinnitus) después de exponerte a ruido fuerte, es una advertencia. Si persiste, consulta a un especialista.`,
  },
  {
    slug: 'comunicacion-familiar-perdida-auditiva',
    titulo: 'Comunicación en familia cuando hay pérdida auditiva',
    resumen: 'Estrategias sencillas para que toda la familia se comunique mejor cuando uno de sus miembros tiene pérdida auditiva.',
    categoria: 'cuidados',
    tags: ['familia', 'comunicación'],
    contenido: `Cuando un familiar tiene pérdida auditiva, la comunicación es un esfuerzo compartido. Pequeños cambios de hábito mejoran la convivencia de todos.\n\n## Antes de hablar\n\n- Asegúrate de tener su atención y habla de frente.\n- Reduce el ruido de fondo: baja el televisor o la música.\n\n## Al conversar\n\n- Habla claro y a ritmo natural, sin gritar ni exagerar.\n- Reformula la frase si no te entienden, en vez de repetir igual.\n- Mantén buena iluminación en tu rostro para facilitar la lectura labial.\n\n## Con paciencia\n\nEvita frases como "déjalo, no importa". Hacer sentir incluida a la persona fortalece los vínculos y su bienestar emocional.`,
  },
];

async function main() {
  console.log('🌱 Sembrando blogs publicados...\n');
  let count = 0;
  for (const p of POSTS) {
    await prisma.blogPost.upsert({
      where: { slug: p.slug },
      update: { ...p, estado: 'PUBLICADO', publishedAt: new Date(), autorNombre: 'OírConecta' },
      create: { ...p, estado: 'PUBLICADO', publishedAt: new Date(), autorNombre: 'OírConecta' },
    });
    count++;
    console.log(`  ✓ ${p.titulo}`);
  }
  console.log(`\n✅ ${count} blogs publicados.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
