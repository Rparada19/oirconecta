/** Días de la semana (misma convención que Configuración CRM: `miercoles` sin tilde). */
export const DIRECTORY_DIAS_AGENDA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

export const DIRECTORY_DIAS_LABEL = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

export function defaultDirectoryAvailability() {
  return {
    version: 1,
    duracionCitaMinutos: 30,
    horarioPorDia: DIRECTORY_DIAS_AGENDA.reduce((acc, dia) => {
      acc[dia] = {
        enabled: dia !== 'sabado' && dia !== 'domingo',
        inicio: '08:00',
        fin: '17:00',
        almuerzoInicio: '12:00',
        almuerzoFin: '13:00',
      };
      return acc;
    }, {}),
  };
}

/** Normaliza JSON guardado o API a la forma del editor. */
export function parseDirectoryAvailability(raw) {
  if (!raw || typeof raw !== 'object') return defaultDirectoryAvailability();
  const base = defaultDirectoryAvailability();
  const dur = Number(raw.duracionCitaMinutos);
  if (Number.isFinite(dur) && dur >= 10 && dur <= 180) base.duracionCitaMinutos = dur;
  const h = raw.horarioPorDia;
  if (h && typeof h === 'object') {
    for (const dia of DIRECTORY_DIAS_AGENDA) {
      const d = h[dia];
      if (d && typeof d === 'object') {
        base.horarioPorDia[dia] = {
          enabled: Boolean(d.enabled),
          inicio: typeof d.inicio === 'string' && d.inicio ? d.inicio : base.horarioPorDia[dia].inicio,
          fin: typeof d.fin === 'string' && d.fin ? d.fin : base.horarioPorDia[dia].fin,
          almuerzoInicio:
            typeof d.almuerzoInicio === 'string' && d.almuerzoInicio
              ? d.almuerzoInicio
              : base.horarioPorDia[dia].almuerzoInicio,
          almuerzoFin:
            typeof d.almuerzoFin === 'string' && d.almuerzoFin ? d.almuerzoFin : base.horarioPorDia[dia].almuerzoFin,
        };
      }
    }
  }
  return base;
}
