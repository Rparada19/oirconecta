/**
 * Directorio público: cuentas y fichas separadas del CRM (`DirectoryAccount` / `DirectoryProfile`).
 */

const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { generateDirectoryToken } = require('../utils/jwt');
const { POLIZAS_COLOMBIA, PROFESIONES_DIRECTORIO } = require('../config/polizasColombia');
const leadsService = require('./leads.service');
const emailService = require('./email.service');
const { normalizeProfesion } = require('../utils/normalizeProfesion');
const { recalcRankingForProfile } = require('./ranking.service');

const prisma = new PrismaClient();

/** Galería perfil: máximo 3 ítems entre fotos y videos (ej. 2 + 1). El banner es campo aparte. */
const MAX_VIDEOS = 1;
const MAX_PHOTOS = 2;
const MAX_WORKPLACES = 25;

/** Include mínimo para ficha pública aprobada (incluye centro vinculado si aplica). */
const includePublicDirectoryProfile = {
  account: { select: { id: true, nombre: true, email: true } },
  workplaces: { orderBy: [{ esPrincipal: 'desc' }, { orden: 'asc' }] },
  parentProfile: {
    include: {
      account: { select: { id: true, nombre: true } },
    },
  },
};

/** Include del panel `/me` (sin `profesionalesCentro`: se adjunta aparte para evitar fallos con cliente Prisma desactualizado). */
const includeMeProfile = {
  account: { select: { id: true, email: true, nombre: true } },
  workplaces: { orderBy: [{ esPrincipal: 'desc' }, { orden: 'asc' }] },
  parentProfile: {
    include: {
      account: { select: { id: true, nombre: true } },
    },
  },
};

async function attachProfesionalesCentro(db, profile) {
  if (!profile) return null;
  const profesionalesCentro = await db.directoryProfile.findMany({
    where: { parentProfileId: profile.id },
    include: { account: { select: { id: true, email: true, nombre: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  return { ...profile, profesionalesCentro };
}

/** Métricas automáticas para el panel `/me` (no se exponen en la ficha pública). */
async function attachDirectoryStats(db, profile) {
  if (!profile || !profile.id) return profile;
  const profileId = profile.id;
  const [mensajes, citas, row] = await Promise.all([
    db.directoryInquiry.count({ where: { profileId } }),
    db.appointment.count({
      where: {
        directoryProfileId: profileId,
        estado: { notIn: ['CANCELLED'] },
      },
    }),
    db.directoryProfile.findUnique({
      where: { id: profileId },
      select: { whatsappClickCount: true },
    }),
  ]);
  return {
    ...profile,
    directoryStats: {
      mensajesRecibidos: mensajes,
      whatsappClicks: row?.whatsappClickCount ?? 0,
      citasAgendadas: citas,
    },
  };
}

async function wrapMeProfile(db, profile) {
  const withProf = await attachProfesionalesCentro(db, profile);
  return attachDirectoryStats(db, withProf);
}

function clampMedia(urls, max) {
  if (!Array.isArray(urls)) return [];
  return urls.filter((u) => typeof u === 'string' && u.trim()).slice(0, max);
}

function normalizeWorkplacesInput(raw) {
  if (!Array.isArray(raw)) return null;
  const list = raw
    .filter((w) => w && typeof w.nombreCentro === 'string' && w.nombreCentro.trim())
    .slice(0, MAX_WORKPLACES)
    .map((w, i) => ({
      nombreCentro: w.nombreCentro.trim(),
      direccion: typeof w.direccion === 'string' ? w.direccion.trim() || null : null,
      ciudad: typeof w.ciudad === 'string' ? w.ciudad.trim() || null : null,
      telefono: typeof w.telefono === 'string' ? w.telefono.trim() || null : null,
      esPrincipal: Boolean(w.esPrincipal),
      orden: Number.isFinite(w.orden) ? w.orden : i,
    }));
  return list;
}

async function registerProfessional({ email, password, nombre, personaTipo, documentoIdentidad, nombreConsultorio }) {
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    const err = new Error(passwordValidation.errors.join('. '));
    err.statusCode = 400;
    throw err;
  }

  const em = (email || '').trim().toLowerCase();
  const existing = await prisma.directoryAccount.findUnique({ where: { email: em } });
  if (existing) {
    const err = new Error('El email ya está registrado en el directorio');
    err.statusCode = 400;
    throw err;
  }

  const tipo = personaTipo === 'JURIDICA' ? 'JURIDICA' : 'NATURAL';
  const doc = documentoIdentidad != null && String(documentoIdentidad).trim() ? String(documentoIdentidad).trim().slice(0, 32) : null;
  const nc =
    nombreConsultorio != null && String(nombreConsultorio).trim()
      ? String(nombreConsultorio).trim().slice(0, 200)
      : null;

  const hashedPassword = await hashPassword(password);

  const { account, profileId } = await prisma.$transaction(async (tx) => {
    const acc = await tx.directoryAccount.create({
      data: {
        email: em,
        password: hashedPassword,
        nombre: nombre.trim(),
        activo: true,
      },
    });
    const prof = await tx.directoryProfile.create({
      data: {
        accountId: acc.id,
        status: 'PENDING',
        personaTipo: tipo,
        documentoIdentidad: doc,
        nombreConsultorio: nc,
      },
    });
    return { account: acc, profileId: prof.id };
  });

  // Asignar trial 45 días (no bloquea la respuesta)
  try {
    const subService = require('./subscription.service');
    await subService.createTrialForProfile(profileId);
  } catch (e) {
    console.error('[trial] no se pudo crear suscripción de prueba:', e?.message);
  }

  const token = generateDirectoryToken(account);

  // Correo de bienvenida (no bloquea la respuesta)
  emailService.sendProfessionalWelcome({
    email: account.email,
    nombre: account.nombre,
    nombreConsultorio: nc,
  }).catch((e) => console.error('[email] bienvenida profesional:', e?.message));

  return {
    token,
    account: {
      id: account.id,
      email: account.email,
      nombre: account.nombre,
    },
    message:
      'Registro recibido. Un administrador revisará tu perfil antes de publicarlo. Ya puedes completar datos en tu cuenta del directorio.',
  };
}

async function loginDirectoryAccount(email, password) {
  const em = (email || '').trim().toLowerCase();
  const account = await prisma.directoryAccount.findUnique({ where: { email: em } });
  if (!account || !account.activo) {
    const err = new Error('Credenciales inválidas');
    err.statusCode = 401;
    throw err;
  }
  const valid = await comparePassword(password, account.password);
  if (!valid) {
    const err = new Error('Credenciales inválidas');
    err.statusCode = 401;
    throw err;
  }
  return {
    token: generateDirectoryToken(account),
    account: {
      id: account.id, email: account.email, nombre: account.nombre,
      mustChangePassword: !!account.mustChangePassword,
    },
  };
}

/**
 * Cambio de clave del titular. Verifica la actual y deja la nueva.
 * Limpia mustChangePassword para que deje de pedirla.
 */
async function changeMyPassword(accountId, { currentPassword, newPassword }) {
  if (!newPassword || String(newPassword).length < 8) {
    const e = new Error('La nueva clave debe tener mínimo 8 caracteres');
    e.statusCode = 400; throw e;
  }
  const account = await prisma.directoryAccount.findUnique({ where: { id: accountId } });
  if (!account) {
    const e = new Error('Cuenta no existe');
    e.statusCode = 404; throw e;
  }
  const valid = await comparePassword(currentPassword || '', account.password);
  if (!valid) {
    const e = new Error('La clave actual no es correcta');
    e.statusCode = 401; throw e;
  }
  const hash = await hashPassword(newPassword);
  await prisma.directoryAccount.update({
    where: { id: accountId },
    data: { password: hash, mustChangePassword: false },
  });
  return { success: true };
}

/**
 * Perfil del titular para el panel `/me`.
 * Si la cuenta existe pero se perdió la fila de perfil (migración, borrado manual, etc.), crea una ficha vacía en PENDING.
 */
async function getMyDirectoryProfile(accountId) {
  const found = await prisma.directoryProfile.findUnique({
    where: { accountId },
    include: includeMeProfile,
  });
  if (found) return wrapMeProfile(prisma, found);

  const acc = await prisma.directoryAccount.findUnique({ where: { id: accountId } });
  if (!acc) return null;

  try {
    const created = await prisma.directoryProfile.create({
      data: {
        accountId,
        status: 'PENDING',
        personaTipo: 'NATURAL',
      },
      include: includeMeProfile,
    });
    return wrapMeProfile(prisma, created);
  } catch (e) {
    if (e && e.code === 'P2002') {
      const again = await prisma.directoryProfile.findUnique({
        where: { accountId },
        include: includeMeProfile,
      });
      return wrapMeProfile(prisma, again);
    }
    throw e;
  }
}

/**
 * Quita datos sensibles y referencias internas para listados / ficha pública.
 * No incluye `documentoIdentidad` ni `personaTipo` (la tarjeta no distingue con X).
 */
function toPublicDirectoryProfile(profile) {
  if (!profile) return null;
  const esCentro = profile.personaTipo === 'JURIDICA';
  const {
    documentoIdentidad: _doc,
    personaTipo: _tipo,
    parentProfileId: _pp,
    estadisticasCitas: _statsInternal,
    whatsappClickCount: _waClicks,
    ...rest
  } = profile;
  const out = { ...rest, esCentro };
  if (out.parentProfile) {
    out.parentProfile = {
      id: out.parentProfile.id,
      nombreConsultorio: out.parentProfile.nombreConsultorio,
      account: out.parentProfile.account ? { nombre: out.parentProfile.account.nombre } : undefined,
    };
  }
  if (out.esCentro && out.generoFicha != null) {
    delete out.generoFicha;
  }
  delete out.profesionalesCentro;
  return out;
}

/** Perfil aprobado sin incrementar visitas (p. ej. envío de formulario desde la ficha). */
async function findApprovedPublicProfileByIdNoVisitBump(profileId) {
  const profile = await prisma.directoryProfile.findFirst({
    where: { id: profileId, status: 'APPROVED' },
    include: includePublicDirectoryProfile,
  });
  if (!profile) {
    const err = new Error('Perfil no encontrado');
    err.statusCode = 404;
    throw err;
  }
  return toPublicDirectoryProfile(profile);
}

async function getApprovedPublicProfileById(profileId) {
  const row = await prisma.$transaction(async (tx) => {
    const profile = await tx.directoryProfile.findFirst({
      where: { id: profileId, status: 'APPROVED' },
      include: includePublicDirectoryProfile,
    });
    if (!profile) {
      const err = new Error('Perfil no encontrado');
      err.statusCode = 404;
      throw err;
    }
    await tx.directoryProfile.update({
      where: { id: profileId },
      data: { perfilVisitas: { increment: 1 } },
    });
    await tx.profileView.create({ data: { profileId, source: 'direct' } });
    return tx.directoryProfile.findFirst({
      where: { id: profileId, status: 'APPROVED' },
      include: includePublicDirectoryProfile,
    });
  });
  return toPublicDirectoryProfile(row);
}

async function searchPublicDirectory({ q, profesion, poliza, ciudad, limit = 40, offset = 0 } = {}) {
  const take = Math.min(Math.max(parseInt(String(limit), 10) || 40, 1), 100);
  const skip = Math.max(parseInt(String(offset), 10) || 0, 0);

  const parts = [];

  if (q && String(q).trim()) {
    const term = String(q).trim();
    parts.push({
      OR: [
        { account: { nombre: { contains: term, mode: 'insensitive' } } },
        { nombreConsultorio: { contains: term, mode: 'insensitive' } },
        { workplaces: { some: { nombreCentro: { contains: term, mode: 'insensitive' } } } },
        { workplaces: { some: { ciudad: { contains: term, mode: 'insensitive' } } } },
      ],
    });
  }

  if (profesion && PROFESIONES_DIRECTORIO.includes(profesion)) {
    parts.push({ profesion });
  }

  if (poliza && poliza !== 'Todas las pólizas' && POLIZAS_COLOMBIA.includes(poliza)) {
    parts.push({ polizasAceptadas: { has: poliza } });
  }

  if (ciudad && ciudad !== 'Todas las ciudades') {
    parts.push({
      workplaces: {
        some: { ciudad: { contains: ciudad, mode: 'insensitive' } },
      },
    });
  }

  const where = {
    status: 'APPROVED',
    ...(parts.length ? { AND: parts } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.directoryProfile.findMany({
      where,
      include: {
        account: { select: { id: true, nombre: true, email: true } },
        workplaces: { orderBy: [{ esPrincipal: 'desc' }, { orden: 'asc' }] },
      },
      take,
      skip,
      orderBy: [{ updatedAt: 'desc' }],
    }),
    prisma.directoryProfile.count({ where }),
  ]);

  return { items: items.map((p) => toPublicDirectoryProfile(p)), total, take, skip };
}

async function updateMyDirectoryProfile(accountId, body) {
  const existing = await prisma.directoryProfile.findUnique({ where: { accountId } });
  if (!existing) {
    const err = new Error('Perfil de directorio no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const patch = {};
  if (body.allies !== undefined) patch.allies = body.allies;
  if (body.studies !== undefined) patch.studies = body.studies;
  if (body.availability !== undefined) patch.availability = body.availability;
  if (body.consultation !== undefined) patch.consultation = body.consultation;
  if (body.videoUrls !== undefined) patch.videoUrls = clampMedia(body.videoUrls, MAX_VIDEOS);
  if (body.photoUrls !== undefined) patch.photoUrls = clampMedia(body.photoUrls, MAX_PHOTOS);

  // Nuevos campos de perfil enriquecido
  if (body.redesSociales !== undefined) patch.redesSociales = body.redesSociales;
  if (body.servicios !== undefined) patch.servicios = body.servicios;
  if (body.whatsappPublico !== undefined) patch.whatsappPublico = body.whatsappPublico == null || body.whatsappPublico === '' ? null : String(body.whatsappPublico).trim().slice(0, 20);
  if (body.registroProfesional !== undefined) patch.registroProfesional = body.registroProfesional == null || body.registroProfesional === '' ? null : String(body.registroProfesional).trim().slice(0, 50);
  if (body.idiomas !== undefined) patch.idiomas = Array.isArray(body.idiomas) ? body.idiomas.map(String) : [];
  if (body.modalidadAtencion !== undefined) patch.modalidadAtencion = Array.isArray(body.modalidadAtencion) ? body.modalidadAtencion.map(String) : [];
  if (body.anosExperiencia !== undefined) patch.anosExperiencia = body.anosExperiencia == null ? null : Math.max(0, parseInt(body.anosExperiencia) || 0);
  if (body.poblacionAtiende !== undefined) patch.poblacionAtiende = Array.isArray(body.poblacionAtiende) ? body.poblacionAtiende.map(String) : [];
  if (body.metodoPago !== undefined) patch.metodoPago = Array.isArray(body.metodoPago) ? body.metodoPago.map(String) : [];
  if (body.qaList !== undefined) patch.qaList = body.qaList;
  if (body.descripcion !== undefined) {
    const d = body.descripcion;
    patch.descripcion = d == null || d === '' ? null : String(d).trim().slice(0, 5000);
  }

  if (body.personaTipo !== undefined) {
    patch.personaTipo = body.personaTipo === 'JURIDICA' ? 'JURIDICA' : 'NATURAL';
    if (patch.personaTipo === 'JURIDICA') {
      patch.parentProfileId = null;
      patch.generoFicha = null;
    }
  }
  if (body.documentoIdentidad !== undefined) {
    const d = body.documentoIdentidad;
    patch.documentoIdentidad =
      d == null || d === '' ? null : String(d).trim().replace(/\s+/g, '').slice(0, 32);
  }
  if (body.direccionPublica !== undefined) {
    const d = body.direccionPublica;
    patch.direccionPublica = d == null || d === '' ? null : String(d).trim().slice(0, 500);
  }
  if (body.telefonoPublico !== undefined) {
    const t = body.telefonoPublico;
    patch.telefonoPublico = t == null || t === '' ? null : String(t).trim().slice(0, 40);
  }
  if (body.emailPublico !== undefined) {
    const e = body.emailPublico;
    patch.emailPublico = e == null || e === '' ? null : String(e).trim().toLowerCase().slice(0, 120);
  }
  if (body.bannerUrl !== undefined) {
    const b = body.bannerUrl;
    patch.bannerUrl = b == null || b === '' ? null : String(b).trim().slice(0, 2000);
  }
  if (body.fotoPerfilUrl !== undefined) {
    const f = body.fotoPerfilUrl;
    patch.fotoPerfilUrl = f == null || f === '' ? null : String(f).trim().slice(0, 2000);
  }
  if (body.googleMapsEmbedUrl !== undefined) {
    const g = body.googleMapsEmbedUrl;
    patch.googleMapsEmbedUrl = g == null || g === '' ? null : String(g).trim().slice(0, 12000);
  }
  if (body.googleMapsLugarUrl !== undefined) {
    const g = body.googleMapsLugarUrl;
    patch.googleMapsLugarUrl = g == null || g === '' ? null : String(g).trim().slice(0, 2000);
  }
  if (body.blogMarkdown !== undefined) {
    patch.blogMarkdown = body.blogMarkdown == null ? null : String(body.blogMarkdown).slice(0, 120000);
  }
  if (body.liveChatUrl !== undefined) {
    const u = body.liveChatUrl;
    patch.liveChatUrl = u == null || u === '' ? null : String(u).trim().slice(0, 2000);
  }
  if (body.titulosSecciones !== undefined) {
    patch.titulosSecciones = body.titulosSecciones == null ? null : body.titulosSecciones;
  }
  if (body.estadisticasCitas !== undefined) {
    patch.estadisticasCitas = body.estadisticasCitas == null ? null : body.estadisticasCitas;
  }
  if (body.generoFicha !== undefined) {
    const g = body.generoFicha;
    if (g == null || g === '') {
      patch.generoFicha = null;
    } else if (g === 'MASCULINO' || g === 'FEMENINO') {
      patch.generoFicha = g;
    } else {
      const err = new Error('generoFicha debe ser MASCULINO, FEMENINO o vacío');
      err.statusCode = 400;
      throw err;
    }
  }
  if (body.parentProfileId !== undefined) {
    const pid = body.parentProfileId;
    if (pid == null || pid === '') {
      patch.parentProfileId = null;
    } else if (String(pid) === String(existing.id)) {
      const err = new Error('No puedes vincular el perfil a sí mismo');
      err.statusCode = 400;
      throw err;
    } else {
      const parent = await prisma.directoryProfile.findFirst({
        where: { id: String(pid), personaTipo: 'JURIDICA', status: 'APPROVED' },
      });
      if (!parent) {
        const err = new Error('Centro jurídico no encontrado o aún no aprobado');
        err.statusCode = 400;
        throw err;
      }
      patch.parentProfileId = String(pid);
      patch.personaTipo = 'NATURAL';
    }
  }

  if (body.nombreConsultorio !== undefined) {
    patch.nombreConsultorio =
      body.nombreConsultorio == null || body.nombreConsultorio === ''
        ? null
        : String(body.nombreConsultorio).trim().slice(0, 200);
  }
  // Mapeo slug → nombre de disciplina (texto canónico que se persiste).
  const SLUG_TO_DISCIPLINA = {
    audiologo: 'Audiología',
    fonoaudiologo: 'Fonoaudiología',
    otologo: 'Otología',
    otorrinolaringologo: 'Otorrinolaringología',
  };

  // Profesiones adicionales (solo aplica a centros/empresas; en personas naturales
  // se ignora y se fuerza a []).
  if (body.profesionesAdicionales !== undefined) {
    const tipo = patch.personaTipo || existing.personaTipo;
    if (tipo !== 'JURIDICA') {
      patch.profesionesAdicionales = [];
    } else if (!Array.isArray(body.profesionesAdicionales)) {
      patch.profesionesAdicionales = [];
    } else {
      const seen = new Set();
      const result = [];
      for (const raw of body.profesionesAdicionales) {
        const canonical = await normalizeProfesion(String(raw || ''), prisma);
        if (canonical && !seen.has(canonical.id)) {
          seen.add(canonical.id);
          result.push(SLUG_TO_DISCIPLINA[canonical.slug] || canonical.nombre);
        }
      }
      patch.profesionesAdicionales = result;
    }
  }

  if (body.profesion !== undefined) {
    if (body.profesion == null || body.profesion === '') {
      patch.profesion = null;
      patch.professionId = null;
    } else {
      // Acepta tanto la disciplina ("Audiología") como el nombre del rol
      // ("Audiólogo/a"). normalizeProfesion mapea ambos a la fila canónica.
      const canonical = await normalizeProfesion(body.profesion, prisma);
      if (!canonical) {
        const err = new Error(`Profesión no válida. Use: ${PROFESIONES_DIRECTORIO.join(', ')}`);
        err.statusCode = 400;
        throw err;
      }
      // Guarda el nombre de la disciplina (texto legacy) consistente.
      patch.profesion = SLUG_TO_DISCIPLINA[canonical.slug] || canonical.nombre || body.profesion;
      patch.professionId = canonical.id;
    }
  }
  if (body.polizasAceptadas !== undefined) {
    if (!Array.isArray(body.polizasAceptadas)) {
      const err = new Error('polizasAceptadas debe ser un arreglo de strings');
      err.statusCode = 400;
      throw err;
    }
    const cleaned = [...new Set(body.polizasAceptadas.map((p) => String(p).trim()).filter(Boolean))].filter((p) =>
      POLIZAS_COLOMBIA.includes(p)
    );
    patch.polizasAceptadas = cleaned;
  }

  const workplaces = body.workplaces !== undefined ? normalizeWorkplacesInput(body.workplaces) : null;

  if (Object.keys(patch).length === 0 && workplaces === null) {
    const unchanged = await prisma.directoryProfile.findUnique({
      where: { accountId },
      include: includeMeProfile,
    });
    return wrapMeProfile(prisma, unchanged);
  }

  const effectiveTipo =
    patch.personaTipo !== undefined ? patch.personaTipo : existing.personaTipo;
  if (effectiveTipo === 'JURIDICA' && patch.generoFicha !== undefined) {
    delete patch.generoFicha;
  }

  const data = { ...patch };
  // No demotivamos el perfil aprobado por cada edición — sería frustrante
  // que cada cambio menor le quite la visibilidad en el directorio. El admin
  // puede mover manualmente a PENDING si detecta algo en la revisión rutinaria.
  // Sí re-encolamos los REJECTED/DRAFT a PENDING para que vuelvan a moderación.
  if (existing.status === 'REJECTED' || existing.status === 'DRAFT') {
    data.status = 'PENDING';
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.directoryProfile.update({
      where: { accountId },
      data,
    });
    if (workplaces !== null) {
      await tx.directoryWorkplace.deleteMany({ where: { profileId: existing.id } });
      if (workplaces.length) {
        await tx.directoryWorkplace.createMany({
          data: workplaces.map((w) => ({
            profileId: existing.id,
            nombreCentro: w.nombreCentro,
            direccion: w.direccion,
            ciudad: w.ciudad,
            telefono: w.telefono,
            esPrincipal: w.esPrincipal,
            orden: w.orden,
          })),
        });
      }
    }
    // Si el workplace principal trae una ciudad y el perfil no tiene `cityId`,
    // hacemos un seed best-effort contra la tabla `cities`.
    if (workplaces !== null && workplaces.length) {
      const main = workplaces.find((w) => w.esPrincipal) || workplaces[0];
      if (main && main.ciudad) {
        const cityRow = await tx.city.findFirst({
          where: { nombre: { equals: main.ciudad, mode: 'insensitive' } },
        });
        if (cityRow) {
          await tx.directoryProfile.update({
            where: { accountId },
            data: { cityId: cityRow.id },
          });
        }
      }
    }
    return tx.directoryProfile.findUnique({
      where: { accountId },
      include: includeMeProfile,
    });
  });

  // Recalcular ranking fuera de la transacción (lectura amplia + escritura pequeña).
  // Si falla el recalc no tumba el update: el cron/job de mantenimiento corregirá.
  try {
    await recalcRankingForProfile(prisma, existing.id);
  } catch (e) {
    console.warn('[directory] recalcRanking failed:', e.message);
  }

  return wrapMeProfile(prisma, result);
}

async function listForAdmin({ status } = {}) {
  const where = status ? { status } : {};
  return prisma.directoryProfile.findMany({
    where,
    include: {
      account: { select: { id: true, email: true, nombre: true, createdAt: true } },
      workplaces: { orderBy: [{ esPrincipal: 'desc' }, { orden: 'asc' }] },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

async function setStatusByAdmin(accountId, { status, rejectionReason, needsChangesNote }, adminUserId) {
  const profile = await prisma.directoryProfile.findUnique({ where: { accountId } });
  if (!profile) {
    const err = new Error('Perfil no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const allowed = ['APPROVED', 'REJECTED', 'PENDING', 'DRAFT', 'NEEDS_CHANGES'];
  if (!allowed.includes(status)) {
    const err = new Error('Estado no válido');
    err.statusCode = 400;
    throw err;
  }

  if (status === 'NEEDS_CHANGES' && !needsChangesNote) {
    const err = new Error('Debes indicar qué cambios solicitas');
    err.statusCode = 400;
    throw err;
  }

  const updated = await prisma.directoryProfile.update({
    where: { accountId },
    data: {
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason || null : null,
      needsChangesNote: status === 'NEEDS_CHANGES' ? needsChangesNote : null,
      reviewedAt: new Date(),
      reviewedByCrmUserId: adminUserId || null,
    },
    include: {
      account: { select: { id: true, email: true, nombre: true } },
      workplaces: { orderBy: [{ esPrincipal: 'desc' }, { orden: 'asc' }] },
    },
  });

  // Notificar al profesional según el nuevo estado
  const acc = updated.account;
  if (acc?.email) {
    if (status === 'APPROVED') {
      emailService.sendProfessionalApproved({
        email: acc.email,
        nombre: acc.nombre,
        profileId: updated.id,
      }).catch((e) => console.error('[email] aprobación profesional:', e?.message));
    } else if (status === 'REJECTED' || status === 'NEEDS_CHANGES') {
      emailService.sendProfessionalRejected({
        email: acc.email,
        nombre: acc.nombre,
        rejectionReason: rejectionReason || needsChangesNote || null,
      }).catch((e) => console.error('[email] rechazo profesional:', e?.message));
    }
  }

  // Hook PageRegistry: registra/desactiva la ficha pública
  try {
    const pageReg = require('./pageRegistry.service');
    const nombreLegible = updated.nombreConsultorio || acc?.nombre || updated.id.slice(0, 8);
    if (status === 'APPROVED') {
      pageReg.upsert({
        type: 'perfil_profesional',
        name: `Profesional: ${nombreLegible}`,
        path: `/profesional/${updated.id}`,
        entityId: updated.id, entityType: 'DirectoryProfile',
      }).catch((e) => console.error('[pageReg] perfil:', e?.message));
    } else if (status === 'REJECTED' || status === 'NEEDS_CHANGES') {
      pageReg.deactivateByEntity('DirectoryProfile', updated.id)
        .catch((e) => console.error('[pageReg] deactivate perfil:', e?.message));
    }
  } catch (e) { /* opcional */ }

  return updated;
}

/**
 * Lead desde ficha pública del directorio (sin usuario CRM).
 * @param {string} profileId
 * @param {{ nombre: string; email: string; telefono: string; mensaje?: string }} payload
 */
async function submitInquiryFromPublic(profileId, payload) {
  const profile = await findApprovedPublicProfileByIdNoVisitBump(profileId);
  const profName = (profile.account && profile.account.nombre) || 'Profesional';
  const msg = payload.mensaje && String(payload.mensaje).trim();
  const nombre = String(payload.nombre).trim().slice(0, 200);
  const email = String(payload.email).trim().toLowerCase().slice(0, 200);
  const telefono = String(payload.telefono).trim().slice(0, 40);

  const inquiry = await prisma.directoryInquiry.create({
    data: {
      profileId,
      nombre,
      email,
      telefono,
      mensaje: msg ? msg.slice(0, 2000) : null,
    },
  });

  const notas = [
    'Origen: ficha pública del directorio OírConecta.',
    `ID perfil: ${profileId}`,
    `ID mensaje buzón: ${inquiry.id}`,
    `Profesional: ${profName}`,
    msg ? `Mensaje del visitante:\n${msg}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await leadsService.create(
      {
        nombre,
        email,
        telefono,
        procedencia: 'directorio-profesional',
        interes: `Directorio — ${profName}`,
        notas,
        estado: 'NUEVO',
      },
      null
    );
  } catch (e) {
    console.error('Lead CRM desde directorio no creado:', e?.message || e);
  }

  // Notificaciones por correo (no bloquean la respuesta)
  const profEmail = profile.account?.email;
  if (profEmail) {
    emailService.sendNewInquiry({
      professionalEmail: profEmail,
      professionalName: profName,
      inquiry: { nombre, email, telefono, mensaje: msg, tipoConsulta: payload.tipoConsulta },
    }).catch((e) => console.error('[email] nueva consulta al profesional:', e?.message));
  }
  if (email) {
    emailService.sendInquiryConfirmation({
      visitorEmail: email,
      visitorName: nombre,
      professionalName: profName,
    }).catch((e) => console.error('[email] confirmación al visitante:', e?.message));
  }

  return inquiry;
}

async function listMyDirectoryInquiries(accountId, { status, limit = 40, offset = 0 } = {}) {
  const profile = await prisma.directoryProfile.findUnique({ where: { accountId }, select: { id: true } });
  if (!profile) {
    const err = new Error('Perfil de directorio no encontrado');
    err.statusCode = 404;
    throw err;
  }
  const take = Math.min(Math.max(parseInt(String(limit), 10) || 40, 1), 100);
  const skip = Math.max(parseInt(String(offset), 10) || 0, 0);
  const where = {
    profileId: profile.id,
    ...(status && ['NEW', 'READ', 'ARCHIVED'].includes(status) ? { status } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.directoryInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      select: {
        id: true,
        nombre: true,
        email: true,
        telefono: true,
        mensaje: true,
        status: true,
        readAt: true,
        respondedAt: true,
        ownerNote: true,
        createdAt: true,
      },
    }),
    prisma.directoryInquiry.count({ where }),
  ]);
  return { items, total, take, skip };
}

async function patchMyDirectoryInquiry(accountId, inquiryId, body) {
  const profile = await prisma.directoryProfile.findUnique({ where: { accountId }, select: { id: true } });
  if (!profile) {
    const err = new Error('Perfil de directorio no encontrado');
    err.statusCode = 404;
    throw err;
  }
  const row = await prisma.directoryInquiry.findFirst({
    where: { id: inquiryId, profileId: profile.id },
  });
  if (!row) {
    const err = new Error('Mensaje no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const data = {};
  if (body.ownerNote !== undefined) {
    data.ownerNote = body.ownerNote == null || body.ownerNote === '' ? null : String(body.ownerNote).slice(0, 4000);
  }
  if (body.markRead === true) {
    data.status = 'READ';
    data.readAt = new Date();
  }
  if (body.markResponded === true) {
    data.respondedAt = new Date();
    if (!data.readAt) data.readAt = row.readAt || new Date();
    if (data.status === undefined) data.status = 'READ';
  }
  if (body.status !== undefined) {
    const s = String(body.status).toUpperCase();
    if (!['NEW', 'READ', 'ARCHIVED'].includes(s)) {
      const err = new Error('Estado no válido');
      err.statusCode = 400;
      throw err;
    }
    data.status = s;
    if (s === 'READ' && !row.readAt && !data.readAt) {
      data.readAt = new Date();
    }
  }

  if (Object.keys(data).length === 0) {
    const err = new Error('Nada que actualizar');
    err.statusCode = 400;
    throw err;
  }

  return prisma.directoryInquiry.update({
    where: { id: inquiryId },
    data,
    select: {
      id: true,
      status: true,
      readAt: true,
      respondedAt: true,
      ownerNote: true,
      updatedAt: true,
    },
  });
}

/** Incrementa contador de clics en WhatsApp desde la ficha pública (solo perfiles aprobados). */
async function recordPublicWhatsappClick(profileId) {
  const ok = await prisma.directoryProfile.findFirst({
    where: { id: profileId, status: 'APPROVED' },
    select: { id: true },
  });
  if (!ok) {
    const err = new Error('Perfil no encontrado');
    err.statusCode = 404;
    throw err;
  }
  await prisma.directoryProfile.update({
    where: { id: profileId },
    data: { whatsappClickCount: { increment: 1 } },
  });
  await prisma.directoryEvent.create({ data: { profileId, type: 'WHATSAPP' } });
  return { ok: true };
}

/** Registra un click en el teléfono (llamada directa) desde la ficha pública. */
async function recordPublicCallClick(profileId) {
  const ok = await prisma.directoryProfile.findFirst({
    where: { id: profileId, status: 'APPROVED' },
    select: { id: true },
  });
  if (!ok) {
    const err = new Error('Perfil no encontrado');
    err.statusCode = 404;
    throw err;
  }
  await prisma.directoryProfile.update({
    where: { id: profileId },
    data: { callClickCount: { increment: 1 } },
  });
  await prisma.directoryEvent.create({ data: { profileId, type: 'CALL' } });
  return { ok: true };
}

/**
 * Registra un click genérico (EMAIL, AGENDAR, etc.) sin contadores
 * dedicados — solo va a la tabla directory_events. Útil para canales
 * cuyo conteo no requiere columna persistente en DirectoryProfile.
 */
async function recordPublicEventClick(profileId, type) {
  const ok = await prisma.directoryProfile.findFirst({
    where: { id: profileId, status: 'APPROVED' },
    select: { id: true },
  });
  if (!ok) {
    const err = new Error('Perfil no encontrado');
    err.statusCode = 404;
    throw err;
  }
  await prisma.directoryEvent.create({ data: { profileId, type } });
  return { ok: true };
}

/** Inicio del mes actual (para métricas "este mes"). */
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Métricas del profesional dueño de la cuenta. */
async function getStatsForAccount(accountId) {
  const profile = await prisma.directoryProfile.findUnique({
    where: { accountId },
    select: { id: true, perfilVisitas: true, whatsappClickCount: true, callClickCount: true },
  });
  if (!profile) {
    const err = new Error('Perfil no encontrado');
    err.statusCode = 404;
    throw err;
  }
  const since = startOfMonth();
  const pid = profile.id;
  const [
    viewsMonth, inquiriesTotal, inquiriesMonth, waMonth, callMonth,
    emailMonth, emailTotal, agendarMonth, agendarTotal,
    appointmentsMonth, appointmentsTotal, appointmentsUpcoming,
  ] = await Promise.all([
    prisma.profileView.count({ where: { profileId: pid, viewedAt: { gte: since } } }),
    prisma.directoryInquiry.count({ where: { profileId: pid } }),
    prisma.directoryInquiry.count({ where: { profileId: pid, createdAt: { gte: since } } }),
    prisma.directoryEvent.count({ where: { profileId: pid, type: 'WHATSAPP', createdAt: { gte: since } } }),
    prisma.directoryEvent.count({ where: { profileId: pid, type: 'CALL',     createdAt: { gte: since } } }),
    prisma.directoryEvent.count({ where: { profileId: pid, type: 'EMAIL',    createdAt: { gte: since } } }),
    prisma.directoryEvent.count({ where: { profileId: pid, type: 'EMAIL' } }),
    prisma.directoryEvent.count({ where: { profileId: pid, type: 'AGENDAR',  createdAt: { gte: since } } }),
    prisma.directoryEvent.count({ where: { profileId: pid, type: 'AGENDAR' } }),
    // Citas reales (F2): reservadas vía /api/booking/public/:profileId/appointments
    prisma.appointment.count({
      where: { directoryProfileId: pid, createdAt: { gte: since }, estado: { notIn: ['CANCELLED'] } },
    }),
    prisma.appointment.count({
      where: { directoryProfileId: pid, estado: { notIn: ['CANCELLED'] } },
    }),
    prisma.appointment.count({
      where: { directoryProfileId: pid, estado: 'CONFIRMED', fecha: { gte: new Date(new Date().setHours(0,0,0,0)) } },
    }),
  ]);
  return {
    visitas:      { mes: viewsMonth,         total: profile.perfilVisitas },
    consultas:    { mes: inquiriesMonth,     total: inquiriesTotal },
    whatsapp:     { mes: waMonth,            total: profile.whatsappClickCount },
    llamadas:     { mes: callMonth,          total: profile.callClickCount },
    email:        { mes: emailMonth,         total: emailTotal },
    agendar:      { mes: agendarMonth,       total: agendarTotal },
    citas:        { mes: appointmentsMonth,  total: appointmentsTotal, proximas: appointmentsUpcoming },
  };
}

/** Métricas agregadas del directorio completo (panel admin). */
async function getAdminDirectoryStats() {
  const since = startOfMonth();
  const [
    profilesAgg, approvedCount, pendingCount, rejectedCount,
    viewsMonth, inquiriesMonth, inquiriesTotal, waMonth, callMonth, newProfilesMonth, topProfilesRaw,
  ] = await Promise.all([
    prisma.directoryProfile.aggregate({ _sum: { perfilVisitas: true, whatsappClickCount: true, callClickCount: true } }),
    prisma.directoryProfile.count({ where: { status: 'APPROVED' } }),
    prisma.directoryProfile.count({ where: { status: 'PENDING' } }),
    prisma.directoryProfile.count({ where: { status: 'REJECTED' } }),
    prisma.profileView.count({ where: { viewedAt: { gte: since } } }),
    prisma.directoryInquiry.count({ where: { createdAt: { gte: since } } }),
    prisma.directoryInquiry.count(),
    prisma.directoryEvent.count({ where: { type: 'WHATSAPP', createdAt: { gte: since } } }),
    prisma.directoryEvent.count({ where: { type: 'CALL', createdAt: { gte: since } } }),
    prisma.directoryProfile.count({ where: { createdAt: { gte: since } } }),
    prisma.directoryProfile.findMany({
      where: { status: 'APPROVED' },
      orderBy: { perfilVisitas: 'desc' },
      take: 5,
      select: {
        id: true, nombreConsultorio: true, perfilVisitas: true, whatsappClickCount: true, callClickCount: true,
        account: { select: { nombre: true } },
        workplaces: { take: 1, orderBy: [{ esPrincipal: 'desc' }, { orden: 'asc' }], select: { ciudad: true } },
      },
    }),
  ]);

  const totalContactosMes = inquiriesMonth + waMonth + callMonth;
  const conversionMes = viewsMonth > 0 ? Math.round((totalContactosMes / viewsMonth) * 1000) / 10 : 0;
  const topProfiles = topProfilesRaw.map((p) => ({
    id: p.id,
    nombre: p.nombreConsultorio || p.account?.nombre || 'Sin nombre',
    ciudad: p.workplaces?.[0]?.ciudad || null,
    visitas: p.perfilVisitas,
    contactos: p.whatsappClickCount + p.callClickCount,
  }));

  return {
    visitas: { mes: viewsMonth, total: profilesAgg._sum.perfilVisitas || 0 },
    consultas: { mes: inquiriesMonth, total: inquiriesTotal },
    whatsapp: { mes: waMonth, total: profilesAgg._sum.whatsappClickCount || 0 },
    llamadas: { mes: callMonth, total: profilesAgg._sum.callClickCount || 0 },
    perfiles: { aprobados: approvedCount, pendientes: pendingCount, rechazados: rejectedCount, nuevosMes: newProfilesMonth },
    conversionMes,
    topProfiles,
  };
}

module.exports = {
  registerProfessional,
  loginDirectoryAccount,
  changeMyPassword,
  recordPublicCallClick,
  recordPublicEventClick,
  getStatsForAccount,
  getAdminDirectoryStats,
  getApprovedPublicProfileById,
  getMyDirectoryProfile,
  updateMyDirectoryProfile,
  listForAdmin,
  setStatusByAdmin,
  searchPublicDirectory,
  submitInquiryFromPublic,
  listMyDirectoryInquiries,
  patchMyDirectoryInquiry,
  recordPublicWhatsappClick,
  MAX_VIDEOS,
  MAX_PHOTOS,
  MAX_WORKPLACES,
};
