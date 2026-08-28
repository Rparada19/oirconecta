/**
 * Planes de audición 2026 — tal como están en las fichas comerciales.
 *
 * Los cupos de servicio (controles, audiometrías, mantenimientos) son los que
 * gobiernan el seguimiento post-adaptación: no se derivan de la garantía. Dos
 * planes con la misma garantía de 2 años pueden traer 4 controles o 2.
 *
 * La ficha lo dice en la letra pequeña y es lo que le da fuerza a los
 * recordatorios: los controles y la audiometría anual son OBLIGATORIOS para
 * mantener la cobertura. El paciente que no viene pierde el seguro.
 */

const PLANES = [
  // ── Línea Premium ──
  {
    code: 'preludio', nombre: 'Preludio', linea: 'PREMIUM', orden: 1,
    nivelTecnologia: 440, plataforma: 'Allure', formatos: 'Todos',
    audifonosIncluidos: 2, anosGarantia: 5, recargable: true,
    controlesMeses: [0.25, 1, 3, 6, 12, 18, 24, 30, 36], controlesAdaptacion: 9,
    // La 4ª audiometría cae en el mes 48, un año después del último control de
    // garantía y única visita de ese año. NO es un error de cálculo: es el
    // punto de contacto para empezar a hablar de renovación y tecnología nueva.
    audiometrias: 4, mantenimientos: 10, terapias: 6,
    seguroPerdidaMeses: 24, seguroRoturaMeses: 24,
    filtrosAnticerumen: 'Ilimitados 2 años', bateriasIncluidas: null,
    cargadorReposicion: '2 en 2 años', cambioReceptores: '1 al año por 3 años',
    satisfaccionDias: 60, audifonoRestitucion: true,
    dctoReparaciones: 30, dctoAccesorios: 25, dctoSiguientePlan: 20,
    lineaExclusiva: true, videoconsulta: true,
    precioCOP: 27500000,
  },
  {
    code: 'sonata', nombre: 'Sonata', linea: 'PREMIUM', orden: 2,
    nivelTecnologia: 220, plataforma: 'Smart RIC', formatos: 'RIC',
    audifonosIncluidos: 2, anosGarantia: 2, recargable: true,
    controlesMeses: [0.25, 1, 6, 12, 18, 24], controlesAdaptacion: 6,
    audiometrias: 2, mantenimientos: 4, terapias: 2,
    seguroPerdidaMeses: 24, seguroRoturaMeses: 24,
    filtrosAnticerumen: 'Ilimitados 1 año', bateriasIncluidas: null,
    cargadorReposicion: '2 en 2 años', cambioReceptores: '1 al año por 2 años',
    satisfaccionDias: 60, audifonoRestitucion: true,
    dctoReparaciones: 30, dctoAccesorios: 25, dctoSiguientePlan: 20,
    lineaExclusiva: true, videoconsulta: true,
    precioCOP: 12700000,
  },
  {
    code: 'sinfonia', nombre: 'Sinfonía', linea: 'PREMIUM', orden: 3,
    nivelTecnologia: 110, plataforma: 'Moment', formatos: 'Todos',
    audifonosIncluidos: 2, anosGarantia: 2, recargable: true,
    controlesMeses: [0.25, 1, 6, 12, 18, 24], controlesAdaptacion: 6,
    audiometrias: 2, mantenimientos: 4, terapias: 2,
    seguroPerdidaMeses: 24, seguroRoturaMeses: 24,
    filtrosAnticerumen: 'Ilimitados 1 año', bateriasIncluidas: null,
    cargadorReposicion: '2 en 2 años', cambioReceptores: '1 al año por 2 años',
    satisfaccionDias: 30, audifonoRestitucion: true,
    dctoReparaciones: 15, dctoAccesorios: 15, dctoSiguientePlan: 15,
    lineaExclusiva: true, videoconsulta: false,
    precioCOP: 11100000,
  },
  // ── Línea Acceso ──
  {
    code: 'distinguido', nombre: 'Distinguido', linea: 'ACCESO', orden: 4,
    nivelTecnologia: 110, plataforma: 'Magnify', formatos: 'BTE',
    audifonosIncluidos: 2, anosGarantia: 2, recargable: true,
    controlesMeses: [1, 6, 12, 18], controlesAdaptacion: 4, audiometrias: 1,
    mantenimientos: 4, terapias: 0,
    seguroPerdidaMeses: null, seguroRoturaMeses: null,
    filtrosAnticerumen: null, bateriasIncluidas: null,
    cargadorReposicion: '1 en 2 años', cambioReceptores: null,
    satisfaccionDias: 30, audifonoRestitucion: false,
    dctoReparaciones: 15, dctoAccesorios: 15, dctoSiguientePlan: 15,
    lineaExclusiva: true, videoconsulta: false,
    precioCOP: 10000000,
  },
  {
    code: 'insignia', nombre: 'Insignia', linea: 'ACCESO', orden: 5,
    nivelTecnologia: 100, plataforma: 'Magnify', formatos: 'BTE',
    audifonosIncluidos: 2, anosGarantia: 2, recargable: false,
    controlesMeses: [1, 6, 12, 18], controlesAdaptacion: 4, audiometrias: 0,
    mantenimientos: 4, terapias: 0,
    seguroPerdidaMeses: null, seguroRoturaMeses: null,
    filtrosAnticerumen: null, bateriasIncluidas: '6 blísteres',
    cargadorReposicion: null, cambioReceptores: null,
    satisfaccionDias: 30, audifonoRestitucion: false,
    dctoReparaciones: 15, dctoAccesorios: 15, dctoSiguientePlan: 15,
    lineaExclusiva: false, videoconsulta: false,
    precioCOP: 7000000,
  },
  {
    code: 'esencial', nombre: 'Esencial', linea: 'ACCESO', orden: 6,
    nivelTecnologia: 50, plataforma: 'Magnify', formatos: 'BTE',
    audifonosIncluidos: 2, anosGarantia: 2, recargable: false,
    controlesMeses: [1, 6, 12, 18], controlesAdaptacion: 4, audiometrias: 0,
    // Solo 2 mantenimientos en 2 años: la garantía va anual, no semestral.
    mantenimientos: 2, terapias: 0,
    seguroPerdidaMeses: null, seguroRoturaMeses: null,
    filtrosAnticerumen: null, bateriasIncluidas: '3 blísteres',
    cargadorReposicion: null, cambioReceptores: null,
    satisfaccionDias: 30, audifonoRestitucion: false,
    dctoReparaciones: 15, dctoAccesorios: 15, dctoSiguientePlan: 15,
    lineaExclusiva: false, videoconsulta: false,
    precioCOP: 5000000,
  },
];

/** Upsert idempotente por `code`. No pisa `activo` ni `precioCOP` si ya existe:
 *  los precios los ajusta el negocio desde el admin, no un deploy. */
async function seedHearingPlans(prisma) {
  for (const p of PLANES) {
    const { code, precioCOP, ...resto } = p;
    await prisma.hearingPlan.upsert({
      where: { code },
      update: resto,
      create: { code, precioCOP, ...resto },
    });
  }
  return PLANES.length;
}

module.exports = { PLANES, seedHearingPlans };
