/**
 * Cara interna de los aliados — /api/aliados-admin/*
 *
 * Esto SÍ es del CRM: auth de `User`, solo ADMIN. Es donde el equipo revisa el
 * corte del mes y marca las comisiones como liquidadas o pagadas. El portal del
 * aliado (/api/aliado/*) solo lee; mover plata se hace desde acá.
 */

const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth');
const comisiones = require('../services/partnerCommissions.service');
const portal = require('../services/partnerPortal.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

/** Código para el QR de las tarjetas: corto y legible, va impreso. */
function codigoDesdeNombre(nombre) {
  const base = String(nombre).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base.slice(0, 20) || `ALIADO-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

/** Código de invitación: secreto, no se imprime. */
function nuevoCodigoRegistro(code) {
  return `${code.replace(/[^A-Z0-9]/gi, '').toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

const WA_NUMBER = (process.env.CENTRO_WHATSAPP || '573171503944').replace(/\D/g, '');

/** Campos de la ficha que el CRM puede editar libremente. */
const CAMPOS_FICHA = [
  'nombre', 'tipo', 'nit', 'direccion', 'ciudad', 'sitioWeb',
  'instagram', 'facebook', 'linkedin', 'tiktok',
  'contactoNombre', 'contactoCargo', 'contactoEmail', 'contactoTelefono',
  'convenioDesde', 'convenioHasta', 'notas',
];

/**
 * Mantiene al contacto del aliado dentro del newsletter, como suscriptor de
 * tipo ALIADO. Reusa toda la máquina de campañas en vez de armar un mailer
 * aparte: segmentos, aperturas, clics y enlace de baja ya existen.
 *
 * Quitar el opt-in lo da de baja, no lo borra: así no se pierde el historial
 * de envíos ni se le vuelve a escribir por error.
 */
async function sincronizarNewsletter(aliado) {
  const email = (aliado.contactoEmail || '').trim().toLowerCase();
  if (!email) return;

  const existente = await prisma.newsletterSubscriber.findUnique({ where: { email } });

  if (!aliado.newsletterOptIn) {
    if (existente && existente.status === 'ACTIVE' && existente.tipo === 'ALIADO') {
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
      });
    }
    return;
  }

  const datos = {
    nombre: aliado.contactoNombre || aliado.nombre,
    telefono: aliado.contactoTelefono || null,
    ciudad: aliado.ciudad || null,
    tipo: 'ALIADO',
    status: 'ACTIVE',
    unsubscribedAt: null,
  };

  if (existente) {
    // Si se dio de baja por su cuenta, no lo resucitamos a la fuerza.
    if (existente.status === 'UNSUBSCRIBED' && existente.tipo === 'ALIADO' && existente.unsubFromCampaignId) return;
    await prisma.newsletterSubscriber.update({ where: { email }, data: datos });
  } else {
    await prisma.newsletterSubscriber.create({
      data: { email, ...datos, source: 'aliado-crm' },
    });
  }
}

/** El enlace exacto que debe llevar el QR de las tarjetas del aliado. */
function enlaceQr(nombre) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Vengo de ${nombre}`)}`;
}

router.get('/', async (req, res) => {
  try {
    const aliados = await prisma.referralPartner.findMany({
      orderBy: { nombre: 'asc' },
      select: {
        id: true, nombre: true, code: true, comisionPct: true, activo: true,
        // El de invitación se muestra aquí y solo aquí: es lo que el equipo
        // le pasa al aliado para que su gente se cree cuenta.
        registroCode: true, tipo: true, comisionaCategorias: true,
        convenioDesde: true, convenioHasta: true, newsletterOptIn: true,
        nit: true, direccion: true, ciudad: true, sitioWeb: true,
        instagram: true, facebook: true, linkedin: true, tiktok: true,
        contactoNombre: true, contactoCargo: true, contactoEmail: true,
        contactoTelefono: true, notas: true, createdAt: true,
        _count: { select: { patients: true, leads: true, commissions: true, accounts: true } },
      },
    });
    res.json({
      success: true,
      data: aliados.map((a) => ({ ...a, enlaceQr: enlaceQr(a.nombre) })),
    });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/** Alta de un aliado. Los dos códigos se generan solos. */
router.post('/', async (req, res) => {
  try {
    const nombre = String(req.body?.nombre || '').trim();
    if (!nombre) return res.status(400).json({ success: false, error: 'El nombre es obligatorio' });

    const pct = req.body?.comisionPct === undefined ? 10 : Number(req.body.comisionPct);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return res.status(400).json({ success: false, error: 'El porcentaje debe ir entre 0 y 100' });
    }

    const code = String(req.body?.code || '').trim().toUpperCase() || codigoDesdeNombre(nombre);
    const repetido = await prisma.referralPartner.findUnique({ where: { code } });
    if (repetido) {
      return res.status(409).json({ success: false, error: `Ya existe un aliado con el código ${code}` });
    }

    const ficha = {};
    for (const campo of CAMPOS_FICHA) {
      if (campo === 'nombre') continue;
      if (req.body?.[campo] !== undefined) ficha[campo] = req.body[campo] || null;
    }

    const aliado = await prisma.referralPartner.create({
      data: {
        ...ficha,
        nombre,
        code,
        comisionPct: pct,
        registroCode: nuevoCodigoRegistro(code),
        newsletterOptIn: !!req.body?.newsletterOptIn,
        ...(Array.isArray(req.body?.comisionaCategorias) && req.body.comisionaCategorias.length
          ? { comisionaCategorias: req.body.comisionaCategorias }
          : {}),
      },
    });

    await sincronizarNewsletter(aliado).catch((e) =>
      console.error('[aliados-admin] newsletter:', e.message));

    res.status(201).json({ success: true, data: { ...aliado, enlaceQr: enlaceQr(aliado.nombre) } });
  } catch (e) {
    console.error('[aliados-admin] crear falló:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/** Edición: nombre, %, activo. Y rotación del código de invitación. */
router.patch('/:id', async (req, res) => {
  try {
    const data = {};
    for (const campo of CAMPOS_FICHA) {
      if (req.body?.[campo] === undefined) continue;
      data[campo] = campo === 'nombre'
        ? String(req.body.nombre).trim()
        : (req.body[campo] || null);
    }
    if (req.body?.activo !== undefined) data.activo = !!req.body.activo;
    if (req.body?.newsletterOptIn !== undefined) data.newsletterOptIn = !!req.body.newsletterOptIn;
    if (Array.isArray(req.body?.comisionaCategorias)) {
      data.comisionaCategorias = req.body.comisionaCategorias;
    }
    if (req.body?.comisionPct !== undefined) {
      const pct = Number(req.body.comisionPct);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        return res.status(400).json({ success: false, error: 'El porcentaje debe ir entre 0 y 100' });
      }
      // Solo afecta ventas futuras: lo ya causado quedó congelado al causarse.
      data.comisionPct = pct;
    }

    // Rotar el código de invitación deja fuera a quien ya no está en el equipo
    // del aliado. No toca el `code` del QR: ese ya está impreso en tarjetas.
    if (req.body?.rotarCodigoRegistro) {
      const actual = await prisma.referralPartner.findUnique({
        where: { id: req.params.id }, select: { code: true },
      });
      if (!actual) return res.status(404).json({ success: false, error: 'Aliado no encontrado' });
      data.registroCode = nuevoCodigoRegistro(actual.code);
    }

    const aliado = await prisma.referralPartner.update({ where: { id: req.params.id }, data });

    await sincronizarNewsletter(aliado).catch((e) =>
      console.error('[aliados-admin] newsletter:', e.message));

    res.json({ success: true, data: { ...aliado, enlaceQr: enlaceQr(aliado.nombre) } });
  } catch (e) {
    console.error('[aliados-admin] editar falló:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * Los referidos de un aliado, vista interna: con nombre completo, contacto y
 * lo clínico. Es la misma gente que ve el aliado, pero aquí estamos adentro.
 */
router.get('/:id/referidos', async (req, res) => {
  try {
    const data = await portal.listarReferidosParaCrm(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    console.error('[aliados-admin] referidos falló:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/* ─── Cuentas de acceso del aliado ─────────────────────────────────────────
 * El código de invitación sirve para que el equipo del aliado se registre
 * solo, pero para una cuenta de demostración —o para el aliado que no quiere
 * lidiar con códigos— hace falta crearla desde aquí.
 * ------------------------------------------------------------------------ */

router.get('/:id/cuentas', async (req, res) => {
  try {
    const cuentas = await prisma.referralPartnerAccount.findMany({
      where: { partnerId: req.params.id },
      // Nunca el passwordHash: no tiene por qué salir de la base.
      select: { id: true, nombre: true, email: true, activo: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ success: true, data: cuentas });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/:id/cuentas', async (req, res) => {
  try {
    const aliado = await prisma.referralPartner.findUnique({ where: { id: req.params.id } });
    if (!aliado) return res.status(404).json({ success: false, error: 'Aliado no encontrado' });

    const email = String(req.body?.email || '').trim().toLowerCase();
    const nombre = String(req.body?.nombre || '').trim() || null;
    const password = String(req.body?.password || '');

    if (!email) return res.status(400).json({ success: false, error: 'Correo requerido' });
    if (password.length < 10) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 10 caracteres' });
    }

    const repetido = await prisma.referralPartnerAccount.findUnique({ where: { email } });
    if (repetido) {
      return res.status(409).json({ success: false, error: 'Ya existe una cuenta con ese correo' });
    }

    const cuenta = await prisma.referralPartnerAccount.create({
      data: { partnerId: aliado.id, email, nombre, passwordHash: await bcrypt.hash(password, 10) },
      select: { id: true, nombre: true, email: true, activo: true, createdAt: true },
    });

    res.status(201).json({ success: true, data: cuenta });
  } catch (e) {
    console.error('[aliados-admin] crear cuenta falló:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

/** Activar/desactivar una cuenta, o cambiarle la clave. */
router.patch('/cuentas/:cuentaId', async (req, res) => {
  try {
    const data = {};
    if (req.body?.activo !== undefined) data.activo = !!req.body.activo;
    if (req.body?.nombre !== undefined) data.nombre = req.body.nombre || null;
    if (req.body?.password) {
      if (String(req.body.password).length < 10) {
        return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 10 caracteres' });
      }
      data.passwordHash = await bcrypt.hash(String(req.body.password), 10);
      // Una clave nueva invalida cualquier enlace de recuperación pendiente.
      data.resetTokenHash = null;
      data.resetTokenExpiresAt = null;
    }

    const cuenta = await prisma.referralPartnerAccount.update({
      where: { id: req.params.cuentaId },
      data,
      select: { id: true, nombre: true, email: true, activo: true, lastLoginAt: true, createdAt: true },
    });
    res.json({ success: true, data: cuenta });
  } catch (e) {
    console.error('[aliados-admin] editar cuenta falló:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/comisiones', async (req, res) => {
  try {
    const data = await comisiones.listarParaCrm({
      partnerId: req.query.partnerId || undefined,
      periodo: req.query.periodo || undefined,
      estado: req.query.estado || undefined,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.patch('/comisiones/:id', async (req, res) => {
  try {
    const row = await comisiones.marcarEstado(req.params.id, req.body?.estado, req.body?.notas);
    res.json({ success: true, data: row });
  } catch (e) {
    res.status(e.statusCode || 500).json({ success: false, error: e.message });
  }
});

/** Pasa las ventas viejas por el cálculo. Idempotente: se puede correr cuantas
 *  veces haga falta, por ejemplo tras marcar a mano el aliado de un paciente. */
router.post('/comisiones/backfill', async (req, res) => {
  try {
    res.json({ success: true, data: await comisiones.backfill() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
