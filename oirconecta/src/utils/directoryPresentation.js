/**
 * Presentación del directorio público (textos y extracción de datos de fichas API).
 */

import { normalizeForSearch } from './textUtils';
import { PROFESIONES_CATALOGO, PROFESION_LABEL_TODAS, recordMatchesProfesion } from './profesionFilter';
import { POLIZA_LABEL_TODAS } from '../config/polizasColombia';
import { getDirectoryDemoProfiles, shouldMergeDirectoryDemo } from '../data/directoryDemoData';
import { DIRECTORY_DIAS_AGENDA, DIRECTORY_DIAS_LABEL } from './directoryAgendaDefaults';

/** Subtítulo por especialidad (tono institucional, lectura en escritorio). */
export const DIRECTORY_PROFESSION_SUBTITLES = {
  Fonoaudiología:
    'Intervención en trastornos de la comunicación humana, el lenguaje, la voz y la audición, con criterios basados en evidencia.',
  Audiología:
    'Valoración audiológica, rehabilitación y seguimiento del desempeño auditivo en entornos clínicos y educativos.',
  Otorrinolaringología:
    'Diagnóstico y tratamiento médico–quirúrgico de patologías de oído, vías aéreas superiores y cavidad oral.',
  Otología:
    'Atención especializada del oído y del equilibrio, incluida la indicación de procedimientos cuando corresponde.',
};

export function directoryProfessionSubtitle(profesion) {
  return DIRECTORY_PROFESSION_SUBTITLES[profesion] || 'Profesional en la red OírConecta.';
}

/**
 * Título y subtítulo para la bandeja de resultados del directorio (URL / filtros).
 * @param {{ q?: string; profesion?: string; poliza?: string; ciudad?: string }} f
 * @param {{ profesionTodas: string; polizaTodas: string }} labels
 */
export function buildDirectoryResultsHeadline(f, { profesionTodas, polizaTodas }) {
  const q = (f.q || '').trim();
  const prof = f.profesion && f.profesion !== profesionTodas ? f.profesion : null;
  const ciudad = f.ciudad && f.ciudad !== '' && f.ciudad !== 'Todas las ciudades' ? f.ciudad : null;
  const poliza = f.poliza && f.poliza !== polizaTodas ? f.poliza : null;

  let title = 'Resultados del directorio';
  if (prof && ciudad && poliza) title = `${prof} en ${ciudad} · ${poliza}`;
  else if (prof && ciudad) title = `${prof} en ${ciudad}`;
  else if (prof && poliza) title = `${prof} · ${poliza}`;
  else if (prof && q) title = `${prof} · “${q.length > 28 ? `${q.slice(0, 26)}…` : q}”`;
  else if (prof) title = prof;
  else if (ciudad && poliza) title = `Profesionales en ${ciudad} · ${poliza}`;
  else if (ciudad) title = `Directorio en ${ciudad}`;
  else if (poliza) title = `Profesionales con ${poliza}`;
  else if (q) title = `Búsqueda: “${q.length > 48 ? `${q.slice(0, 46)}…` : q}”`;

  const hints = [];
  if (prof) hints.push('Especialidad');
  if (ciudad) hints.push('Ciudad');
  if (poliza) hints.push('Póliza');
  if (q) hints.push('Texto libre');
  const subtitle =
    hints.length > 0
      ? `Criterios activos: ${hints.join(', ')}. Puede afinar en el buscador superior o abrir la ficha completa de cada profesional.`
      : 'Profesionales verificados en la red Oír Conecta.';

  return { title, subtitle };
}

/**
 * Serializa filtros del directorio a query string (omitir vacíos / “todas”).
 */
export function directoryFiltersToSearchParams(f, { profesionTodas, polizaTodas }) {
  const p = new URLSearchParams();
  if (f.q && String(f.q).trim()) p.set('q', String(f.q).trim());
  if (f.profesion && f.profesion !== profesionTodas) p.set('profesion', f.profesion);
  if (f.ciudad && f.ciudad !== '' && f.ciudad !== 'Todas las ciudades') p.set('ciudad', f.ciudad);
  if (f.poliza && f.poliza !== polizaTodas) p.set('poliza', f.poliza);
  return p;
}

const SLUG_ALIASES = {
  orl: 'Otorrinolaringología',
  otorrino: 'Otorrinolaringología',
  otorrinolaringologia: 'Otorrinolaringología',
  fonoaudiologia: 'Fonoaudiología',
  audiologia: 'Audiología',
  otologia: 'Otología',
};

/**
 * Resuelve slug de URL (ej. `audiologia`, `otorrinolaringologia`) a etiqueta de catálogo.
 * @param {string} slug
 * @returns {string|null}
 */
export function directoryProfesionFromSlug(slug) {
  if (!slug || typeof slug !== 'string') return null;
  const raw = slug.trim().toLowerCase().replace(/-/g, '');
  if (SLUG_ALIASES[raw]) return SLUG_ALIASES[raw];
  const compact = normalizeForSearch(raw.replace(/\s+/g, ''));
  for (const p of PROFESIONES_CATALOGO) {
    const key = normalizeForSearch(p.replace(/\s+/g, ''));
    if (key === compact) return p;
  }
  return null;
}

/** Slug estable para URL `/directorio/profesion/:slug`. */
export function directoryProfesionToSlug(profesion) {
  if (!profesion || typeof profesion !== 'string') return '';
  return normalizeForSearch(profesion).replace(/\s+/g, '');
}

/** True si la URL del directorio tiene al menos un criterio de búsqueda activo. */
export function hasActiveDirectoryFilters(f) {
  return !!(
    (f.q && f.q.trim()) ||
    (f.profesion && f.profesion !== PROFESION_LABEL_TODAS) ||
    (f.poliza && f.poliza !== POLIZA_LABEL_TODAS) ||
    (f.ciudad && f.ciudad !== '' && f.ciudad !== 'Todas las ciudades')
  );
}

/**
 * Filtra perfiles demo como el API (profesión exacta, ciudad en sedes, póliza en array, q en nombre/consultorio/centro).
 * @param {object} filters — { q, profesion, ciudad, poliza } con mismas convenciones que la URL
 * @param {object[]} demos
 * @param {{ profesionTodas: string; polizaTodas: string }} labels
 */
export function filterDirectoryDemoProfiles(filters, demos, labels) {
  if (!Array.isArray(demos)) return [];
  const q = (filters.q || '').trim().toLowerCase();
  const profOk =
    !filters.profesion ||
    filters.profesion === labels.profesionTodas ||
    !String(filters.profesion).trim();
  const polOk =
    !filters.poliza || filters.poliza === labels.polizaTodas || !String(filters.poliza).trim();
  const ciudadF = filters.ciudad && filters.ciudad !== '' && filters.ciudad !== 'Todas las ciudades' ? filters.ciudad : null;

  return demos.filter((p) => {
    if (!profOk) {
      const c = canonicalDirectoryProfession(p);
      if (c !== filters.profesion) return false;
    }
    if (ciudadF) {
      const cities = (p.workplaces || []).map((w) => (w.ciudad || '').toString()).join(' ');
      if (!normalizeForSearch(cities).includes(normalizeForSearch(ciudadF))) return false;
    }
    if (!polOk) {
      const pol = Array.isArray(p.polizasAceptadas) ? p.polizasAceptadas : [];
      if (!pol.includes(filters.poliza)) return false;
    }
    if (q) {
      const blob = [
        p.account?.nombre,
        p.nombreConsultorio,
        ...(p.workplaces || []).map((w) => [w.nombreCentro, w.ciudad].filter(Boolean).join(' ')),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!blob.includes(q) && !normalizeForSearch(blob).includes(normalizeForSearch(q))) return false;
    }
    return true;
  });
}

/** Iniciales para avatar sin foto. */
export function directoryInitials(nombre) {
  if (!nombre || typeof nombre !== 'string') return '—';
  const words = nombre.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '—';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** URL de foto de perfil (campo dedicado o primera imagen de galería). */
export function directoryProfilePhoto(profile) {
  const fp = profile?.fotoPerfilUrl && String(profile.fotoPerfilUrl).trim();
  if (fp) return fp;
  const p0 = profile?.photoUrls?.[0] && String(profile.photoUrls[0]).trim();
  return p0 || null;
}

/**
 * Texto breve de disponibilidad para la ficha pública (desde `availability.horarioPorDia`).
 */
export function directoryAvailabilitySummary(profile) {
  const a = profile?.availability;
  if (!a || typeof a !== 'object') return '';
  const h = a.horarioPorDia;
  if (!h || typeof h !== 'object') return '';
  const partes = [];
  for (const dia of DIRECTORY_DIAS_AGENDA) {
    const d = h[dia];
    if (!d || !d.enabled) continue;
    const lab = DIRECTORY_DIAS_LABEL[dia] || dia;
    const ini = typeof d.inicio === 'string' ? d.inicio : '';
    const fin = typeof d.fin === 'string' ? d.fin : '';
    if (ini && fin) partes.push(`${lab}: ${ini}–${fin}`);
    else partes.push(lab);
  }
  if (!partes.length) return '';
  const dur = Number(a.duracionCitaMinutos);
  const durTxt = Number.isFinite(dur) && dur > 0 ? ` · Citas orientativas de ~${dur} min` : '';
  return `${partes.join(' · ')}${durTxt}`;
}

/** Ciudad principal (sede marcada o primera con ciudad). */
export function directoryPrimaryCity(workplaces) {
  if (!Array.isArray(workplaces) || workplaces.length === 0) return null;
  const sorted = [...workplaces].sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal));
  const w = sorted.find((x) => x.ciudad && String(x.ciudad).trim()) || sorted[0];
  return w?.ciudad ? String(w.ciudad).trim() : null;
}

/** Teléfono principal para WhatsApp (primer número con dígitos suficientes). */
export function directoryPrimaryPhone(workplaces) {
  if (!Array.isArray(workplaces)) return null;
  const sorted = [...workplaces].sort((a, b) => Number(b.esPrincipal) - Number(a.esPrincipal));
  for (const w of sorted) {
    const t = w?.telefono && String(w.telefono).trim();
    if (t && t.replace(/\D/g, '').length >= 8) return t;
  }
  return null;
}

/** Nombre en tarjeta pública: centro (jurídica) vs titular (natural). Usa `esCentro` de la API pública. */
export function directoryPublicDisplayName(profile) {
  if (!profile) return '';
  if (profile.esCentro || profile.personaTipo === 'JURIDICA') {
    const c = profile.nombreConsultorio && String(profile.nombreConsultorio).trim();
    return c || profile.account?.nombre || 'Centro';
  }
  return profile.account?.nombre || 'Profesional';
}

/** Teléfono público del perfil o, si no hay, el de sedes. */
export function directoryPrimaryPhonePublic(profile) {
  const t = profile?.telefonoPublico && String(profile.telefonoPublico).trim();
  if (t && t.replace(/\D/g, '').length >= 8) return t;
  return directoryPrimaryPhone(profile?.workplaces);
}

/** Correo preferido para mostrar (campo público o cuenta). */
export function directoryPublicEmail(profile) {
  const e = profile?.emailPublico && String(profile.emailPublico).trim();
  if (e) return e;
  return profile?.account?.email || null;
}

export function waMeHrefFromPhone(telefono) {
  if (!telefono) return null;
  let d = String(telefono).replace(/\D/g, '');
  if (d.length < 8) return null;
  if (!d.startsWith('57') && d.length === 10) d = `57${d}`;
  return `https://wa.me/${d}`;
}

/** Nombres de marcas aliadas (máx. n), todas las categorías. */
export function directoryAllyBrandNames(allies, max = 4) {
  if (!allies || typeof allies !== 'object') return [];
  const out = [];
  for (const key of ['audifonos', 'implantesCocleares', 'implantes', 'accesorios', 'farmacia', 'medicamentos']) {
    const arr = allies[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      const name = item && typeof item === 'object' && item.name ? String(item.name).trim() : null;
      if (name && !out.includes(name)) {
        out.push(name);
        if (out.length >= max) return out;
      }
    }
  }
  return out;
}

/**
 * Bloques { label, names } para mostrar marcas por categoría en la ficha pública.
 */
export function directoryAlliesGrouped(allies) {
  if (!allies || typeof allies !== 'object') return [];
  const collect = (keys) => {
    const names = [];
    for (const key of keys) {
      const arr = allies[key];
      if (!Array.isArray(arr)) continue;
      for (const item of arr) {
        const name = item && typeof item === 'object' && item.name ? String(item.name).trim() : null;
        if (name && !names.includes(name)) names.push(name);
      }
    }
    return names;
  };
  const blocks = [
    { label: 'Audífonos', names: collect(['audifonos']) },
    { label: 'Implantes cocleares', names: collect(['implantesCocleares', 'implantes']) },
    { label: 'Accesorios', names: collect(['accesorios']) },
    { label: 'Farmacia', names: collect(['farmacia', 'medicamentos']) },
  ];
  return blocks.filter((b) => b.names.length > 0);
}

/** Chips de servicios / cobertura (máx. 3): mezcla pólizas y aliados. */
export function directoryServiceChips(profile, max = 3) {
  if (Array.isArray(profile?._demo?.services) && profile._demo.services.length) {
    return profile._demo.services.map((s) => String(s)).filter(Boolean).slice(0, max);
  }
  const chips = [];
  const pol = Array.isArray(profile.polizasAceptadas) ? profile.polizasAceptadas : [];
  for (const p of pol) {
    if (chips.length >= max) break;
    if (p) chips.push(String(p));
  }
  const allies = directoryAllyBrandNames(profile.allies, max);
  for (const a of allies) {
    if (chips.length >= max) break;
    if (!chips.includes(a)) chips.push(a);
  }
  return chips.slice(0, max);
}

/** Une API + perfiles demo (sin duplicar ids). */
export function mergeDirectoryPools(apiItems) {
  const api = Array.isArray(apiItems) ? apiItems : [];
  if (!shouldMergeDirectoryDemo(api.length)) return api;
  const demos = getDirectoryDemoProfiles();
  const ids = new Set(api.map((p) => p.id));
  return [...api, ...demos.filter((d) => !ids.has(d.id))];
}

/** Una o dos líneas humanas (sin tecnicismos). */
export function directoryShortTagline(profile) {
  if (profile?._demo?.tagline) return profile._demo.tagline;
  const name = profile?.account?.nombre || 'Este profesional';
  const consultorio = profile?.nombreConsultorio && String(profile.nombreConsultorio).trim();
  const city = directoryPrimaryCity(profile.workplaces);
  if (consultorio && city) return `${name} atiende en ${consultorio}, con presencia en ${city}.`;
  if (consultorio) return `${name} — ${consultorio}.`;
  if (city) return `Atención en ${city}. Acompañamiento claro para decidir con calma.`;
  return 'Parte de la red OírConecta: perfiles revisados para que compares con tranquilidad.';
}

/**
 * Texto largo para ficha pública (demo tagline, consultation JSON o tagline generado).
 * @param {object} profile
 */
export function directoryProfileBio(profile) {
  if (!profile) return '';
  if (profile._demo?.tagline) return String(profile._demo.tagline).trim();
  const c = profile.consultation;
  if (c && typeof c === 'object') {
    const parts = ['preparacion', 'contactoCentro', 'costos']
      .map((k) => (typeof c[k] === 'string' ? c[k].trim() : ''))
      .filter(Boolean);
    if (parts.length) return parts.join(' ');
  }
  return directoryShortTagline(profile);
}

/**
 * Profesión canónica para agrupar filas del directorio (una sola fila por perfil).
 * - Con `profesion` guardada: coincide con el catálogo ignorando mayúsculas / acentos.
 * - Sin `profesion`: infiere con prioridad Otología → ORL → Fonoaudiología → Audiología
 *   (evita que “fonoaudiología” caiga solo en Audiología por substring).
 */
export function canonicalDirectoryProfession(profile) {
  if (!profile) return null;
  const raw = profile.profesion != null ? String(profile.profesion).trim() : '';
  if (raw) {
    const n = normalizeForSearch(raw);
    for (const cat of PROFESIONES_CATALOGO) {
      if (n === normalizeForSearch(cat)) return cat;
    }
    return null;
  }
  if (recordMatchesProfesion(profile, 'Otología')) return 'Otología';
  if (recordMatchesProfesion(profile, 'Otorrinolaringología')) return 'Otorrinolaringología';
  if (recordMatchesProfesion(profile, 'Fonoaudiología')) return 'Fonoaudiología';
  if (recordMatchesProfesion(profile, 'Audiología')) return 'Audiología';
  return null;
}

export function profilesByProfession(items, profesion) {
  if (!Array.isArray(items)) return [];
  return items.filter((p) => canonicalDirectoryProfession(p) === profesion).slice(0, 16);
}

export function directorySpotlightScore(p) {
  return (p.photoUrls?.length || 0) * 2 + (p.nombreConsultorio ? 1 : 0) + (p.workplaces?.length || 0) * 0.25;
}

/**
 * Dentro de una misma especialidad: candidatos a “destacado” (perfiles completos y con imagen priorizados).
 * @param {object[]} profiles — ya filtrados por profesión
 * @param {number} [max=2]
 */
export function pickFeaturedFromProfessionList(profiles, max = 2) {
  if (!Array.isArray(profiles) || profiles.length === 0 || max < 1) return [];
  const k = Math.min(max, profiles.length);
  return [...profiles].sort((a, b) => directorySpotlightScore(b) - directorySpotlightScore(a)).slice(0, k);
}

/**
 * Filtros locales para la rejilla (sin URL).
 * @param {object} f - { profession: string; city: string; minRating: number; serviceText: string }
 */
export function applyDirectoryLocalFilters(items, f) {
  if (!Array.isArray(items)) return [];
  let out = items;
  if (f.profession && f.profession !== 'Todas') {
    out = out.filter((p) => p.profesion === f.profession);
  }
  if (f.city && f.city !== 'Todas') {
    out = out.filter((p) => {
      const c = directoryPrimaryCity(p.workplaces);
      return c && c.toLowerCase() === f.city.toLowerCase();
    });
  }
  if (f.minRating && f.minRating > 0) {
    out = out.filter((p) => (p._demo?.rating ?? 0) >= f.minRating);
  }
  if (f.serviceText && f.serviceText.trim()) {
    const t = f.serviceText.trim().toLowerCase();
    out = out.filter((p) => {
      const chips = directoryServiceChips(p, 8).join(' ').toLowerCase();
      const tag = (directoryShortTagline(p) || '').toLowerCase();
      return chips.includes(t) || tag.includes(t) || (p.nombreConsultorio || '').toLowerCase().includes(t);
    });
  }
  return out;
}

export function uniqueCitiesFromProfiles(items) {
  const s = new Set();
  (items || []).forEach((p) => {
    const c = directoryPrimaryCity(p.workplaces);
    if (c) s.add(c);
  });
  return [...s].sort((a, b) => a.localeCompare(b, 'es'));
}

export { PROFESIONES_CATALOGO };
