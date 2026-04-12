/**
 * Servicio de configuración del CRM.
 * Persiste en localStorage.
 *
 * Estructura:
 * - Sedes: cada sede tiene consultorios y profesionales habilitados
 * - Profesionales: atados a consultorio(s), con horarios por sede/consultorio, CV, servicios/productos
 */

const CONFIG_KEY = 'oirconecta_config';

const DEFAULT_APPOINTMENT_REASONS = [
  { value: 'primera-vez', label: 'Cita primera vez', duration: 60, editable: false },
  { value: 'adaptacion', label: 'Cita de adaptación', duration: 60, editable: false },
  { value: 'prueba-audifonos', label: 'Prueba de audífonos', duration: 30, editable: false },
  { value: 'entrega-mantenimiento', label: 'Entrega de mantenimiento', duration: 20, editable: false },
  { value: 'revision', label: 'Revisión de audífonos', duration: 20, editable: false },
  { value: 'examenes', label: 'Cita de exámenes', duration: 60, editable: false },
  { value: 'control', label: 'Cita control', duration: 30, editable: false },
];

const DEFAULT_SCHEDULE_BY_DAY = {
  lunes: { enabled: true, inicio: '07:00', fin: '18:00', almuerzoInicio: '12:00', almuerzoFin: '13:00' },
  martes: { enabled: true, inicio: '07:00', fin: '18:00', almuerzoInicio: '12:00', almuerzoFin: '13:00' },
  miercoles: { enabled: true, inicio: '07:00', fin: '18:00', almuerzoInicio: '12:00', almuerzoFin: '13:00' },
  jueves: { enabled: true, inicio: '07:00', fin: '18:00', almuerzoInicio: '12:00', almuerzoFin: '13:00' },
  viernes: { enabled: true, inicio: '07:00', fin: '15:00', almuerzoInicio: '12:00', almuerzoFin: '13:00' },
  sabado: { enabled: false, inicio: '08:00', fin: '12:00', almuerzoInicio: '', almuerzoFin: '' },
  domingo: { enabled: false, inicio: '08:00', fin: '12:00', almuerzoInicio: '', almuerzoFin: '' },
};

const DEFAULT_CONFIG = {
  horarios: {
    horarioInicio: '07:00',
    horarioFin: '18:00',
    horarioFinViernes: '15:00',
    horaAlmuerzoInicio: '12:00',
    horaAlmuerzoFin: '13:00',
    horarioPorDia: DEFAULT_SCHEDULE_BY_DAY,
  },
  citas: {
    duracionCita: 50,
    descansoEntreCitas: 10,
    motivosCita: DEFAULT_APPOINTMENT_REASONS,
  },
  notificaciones: {
    notificacionesEmail: true,
    notificacionesSMS: false,
    recordatorioCita: true,
    confirmacionAutomatica: false,
  },
  empresa: {
    nombre: 'OírConecta',
    email: '',
    telefono: '',
    direccion: '',
    representanteLegal: '',
    logo: null,
  },
  // Sedes: cada sede tiene consultorios y profesionales habilitados
  sedes: [
    {
      id: '1',
      nombre: 'Sede Principal',
      direccion: '',
      telefono: '',
      activo: true,
      consultorios: [
        { id: 'c1', nombre: 'Consultorio 1', activo: true },
        { id: 'c2', nombre: 'Consultorio 2', activo: false },
      ],
      profesionalesHabilitados: [],
    },
  ],
  // Plantillas PDF de consentimientos informados (por tipo). Cada clave es el nombre del tipo, valor: dataUrl base64 del PDF o null
  consentimientosPlantillas: {},
  // Profesionales: atados a consultorio(s), con horarios, CV, servicios/productos
  profesionales: [
    {
      id: 'prof_1',
      nombre: '',
      especialidad: 'Audiólogo/a',
      activo: true,
      cvUrl: null,
      servicioIds: [],
      productoIds: [],
      asignaciones: [
        {
          id: 'asig_1',
          sedeId: '1',
          consultorioId: 'c1',
          horarioPorDia: { ...DEFAULT_SCHEDULE_BY_DAY },
          activo: true,
        },
      ],
    },
  ],
  servicios: [
    { id: 's1', nombre: 'Consulta audiológica', duracion: 60, activo: true },
    { id: 's2', nombre: 'Audiometría', duracion: 30, activo: true },
  ],
  marketplace: {
    productos: [],
    serviciosFacturables: [],
  },
};

// Migración: convertir config legacy a nueva estructura
function migrateConfig(parsed) {
  const migrated = JSON.parse(JSON.stringify(parsed));
  if (!migrated.sedes || migrated.sedes.length === 0) {
    migrated.sedes = [{ id: '1', nombre: 'Sede Principal', direccion: '', telefono: '', activo: true, consultorios: [{ id: 'c1', nombre: 'Consultorio 1', activo: true }], profesionalesHabilitados: [] }];
  }
  migrated.sedes = migrated.sedes.map((s) => ({
    ...s,
    consultorios: s.consultorios || [],
    profesionalesHabilitados: s.profesionalesHabilitados || [],
  }));
  if (parsed.consultorios && Array.isArray(parsed.consultorios) && parsed.consultorios.length > 0) {
    parsed.consultorios.forEach((c) => {
      const sede = migrated.sedes.find((s) => s.id === (c.sedeId || '1'));
      if (sede && !sede.consultorios.some((x) => x.id === c.id)) {
        sede.consultorios.push({ id: c.id || `c_${Date.now()}`, nombre: c.nombre || 'Consultorio', activo: c.activo !== false });
      }
    });
  }
  if (parsed.profesionales && Array.isArray(parsed.profesionales)) {
    migrated.profesionales = parsed.profesionales.map((p) => {
      const prof = { ...p };
      if (!prof.asignaciones || prof.asignaciones.length === 0) {
        const sedeIds = p.sedeIds || ['1'];
        const firstSede = migrated.sedes.find((s) => sedeIds.includes(s.id)) || migrated.sedes[0];
        const firstCons = (firstSede?.consultorios?.[0]) || { id: 'c1' };
        prof.asignaciones = [{ id: `asig_${Date.now()}`, sedeId: firstSede?.id || '1', consultorioId: firstCons.id, horarioPorDia: { ...DEFAULT_SCHEDULE_BY_DAY }, activo: true }];
      }
      if (!Array.isArray(prof.servicioIds)) prof.servicioIds = [];
      if (!Array.isArray(prof.productoIds)) prof.productoIds = [];
      return prof;
    });
  }
  return migrated;
}

function getConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const migrated = migrateConfig(parsed);
      return { ...DEFAULT_CONFIG, ...migrated };
    }
  } catch (e) {
    console.error('[configService] Error al leer config:', e);
  }
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function saveConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    return { success: true };
  } catch (e) {
    console.error('[configService] Error al guardar config:', e);
    return { success: false, error: e.message };
  }
}

export function getAppointmentReasons() {
  const cfg = getConfig();
  return cfg.citas?.motivosCita ?? DEFAULT_APPOINTMENT_REASONS;
}

export function addAppointmentReason(reason) {
  const cfg = getConfig();
  if (!cfg.citas) cfg.citas = { ...DEFAULT_CONFIG.citas };
  const id = `custom_${Date.now()}`;
  cfg.citas.motivosCita = [...(cfg.citas.motivosCita || []), { ...reason, value: id, editable: true }];
  return saveConfig(cfg);
}

export function updateAppointmentReason(value, updates) {
  const cfg = getConfig();
  const idx = (cfg.citas?.motivosCita || []).findIndex((m) => m.value === value);
  if (idx === -1) return { success: false };
  cfg.citas.motivosCita[idx] = { ...cfg.citas.motivosCita[idx], ...updates };
  return saveConfig(cfg);
}

export function removeAppointmentReason(value) {
  const cfg = getConfig();
  cfg.citas.motivosCita = (cfg.citas?.motivosCita || []).filter((m) => m.value !== value);
  return saveConfig(cfg);
}

export function getSedes() {
  const cfg = getConfig();
  return cfg.sedes || [];
}

export function getConsultoriosBySede(sedeId) {
  const sedes = getSedes();
  const sede = sedes.find((s) => s.id === sedeId);
  return sede?.consultorios || [];
}

export function getProfesionales() {
  const cfg = getConfig();
  return cfg.profesionales || [];
}

export function getProfesionalesActivos() {
  return getProfesionales().filter((p) => p.activo);
}

export function getConsultoriosFlat() {
  const sedes = getSedes();
  return sedes.flatMap((s) => (s.consultorios || []).map((c) => ({ ...c, sedeId: s.id, sedeNombre: s.nombre })));
}

export { getConfig, saveConfig, DEFAULT_APPOINTMENT_REASONS, DEFAULT_SCHEDULE_BY_DAY };
