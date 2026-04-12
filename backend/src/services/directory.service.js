/**
 * Directorio público: cuentas y fichas separadas del CRM (`DirectoryAccount` / `DirectoryProfile`).
 */

const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { generateDirectoryToken } = require('../utils/jwt');
const { POLIZAS_COLOMBIA, PROFESIONES_DIRECTORIO } = require('../config/polizasColombia');
const leadsService = require('./leads.service');

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

  const account = await prisma.$transaction(async (tx) => {
    const acc = await tx.directoryAccount.create({
      data: {
        email: em,
        password: hashedPassword,
        nombre: nombre.trim(),
        activo: true,
      },
    });
    await tx.directoryProfile.create({
      data: {
        accountId: acc.id,
        status: 'PENDING',
        personaTipo: tipo,
        documentoIdentidad: doc,
        nombreConsultorio: nc,
      },
    });
    return acc;
  });

  const token = generateDirectoryToken(account);

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
    account: { id: account.id, email: account.email, nombre: account.nombre },
  };
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
  if (body.profesion !== undefined) {
    if (body.profesion == null || body.profesion === '') {
      patch.profesion = null;
    } else if (!PROFESIONES_DIRECTORIO.includes(body.profesion)) {
      const err = new Error(`Profesión no válida. Use: ${PROFESIONES_DIRECTORIO.join(', ')}`);
      err.statusCode = 400;
      throw err;
    } else {
      patch.profesion = body.profesion;
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
  if (existing.status === 'APPROVED') {
    data.status = 'PENDING';
  } else if (existing.status === 'REJECTED' || existing.status === 'DRAFT') {
    data.status = 'PENDING';
  }

  return prisma.$transaction(async (tx) => {
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
    const updated = await tx.directoryProfile.findUnique({
      where: { accountId },
      include: includeMeProfile,
    });
    return wrapMeProfile(tx, updated);
  });
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

async function setStatusByAdmin(accountId, { status, rejectionReason }, adminUserId) {
  const profile = await prisma.directoryProfile.findUnique({ where: { accountId } });
  if (!profile) {
    const err = new Error('Perfil no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const allowed = ['APPROVED', 'REJECTED', 'PENDING', 'DRAFT'];
  if (!allowed.includes(status)) {
    const err = new Error('Estado no válido');
    err.statusCode = 400;
    throw err;
  }

  return prisma.directoryProfile.update({
    where: { accountId },
    data: {
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason || null : null,
      reviewedAt: new Date(),
      reviewedByCrmUserId: adminUserId || null,
    },
    include: {
      account: { select: { id: true, email: true, nombre: true } },
      workplaces: { orderBy: [{ esPrincipal: 'desc' }, { orden: 'asc' }] },
    },
  });
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
  return { ok: true };
}

module.exports = {
  registerProfessional,
  loginDirectoryAccount,
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
