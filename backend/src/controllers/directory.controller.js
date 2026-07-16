const directoryService = require('../services/directory.service');
const metaCapi = require('../services/metaCapi.service');

const register = async (req, res, next) => {
  try {
    const result = await directoryService.registerProfessional(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

const directoryLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await directoryService.loginDirectoryAccount(email, password);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};
const getMe = async (req, res, next) => {
  try {
    const profile = await directoryService.getMyDirectoryProfile(req.directoryAccount.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Sin perfil de directorio' });
    }
    res.json({ success: true, data: profile });
  } catch (e) {
    next(e);
  }
};

const changeMyPassword = async (req, res, next) => {
  try {
    const out = await directoryService.changeMyPassword(req.directoryAccount.id, req.body || {});
    res.json({ success: true, data: out });
  } catch (e) { next(e); }
};

const patchMe = async (req, res, next) => {
  try {
    const updated = await directoryService.updateMyDirectoryProfile(req.directoryAccount.id, req.body);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
};

const adminList = async (req, res, next) => {
  try {
    const { status } = req.query;
    const list = await directoryService.listForAdmin({ status: status || undefined });
    res.json({ success: true, data: list });
  } catch (e) {
    next(e);
  }
};

const adminSetStatus = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const updated = await directoryService.setStatusByAdmin(accountId, req.body, req.user.id);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
};

const adminDeleteProfile = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    // Borrar la DirectoryAccount cascadea a DirectoryProfile y todas sus tablas hijas
    // (workplaces, reviews, subscriptions, availability, appointments del directorio, etc.)
    const acc = await prisma.directoryAccount.findUnique({ where: { id: accountId }, select: { id: true, email: true } });
    if (!acc) return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    await prisma.directoryAccount.delete({ where: { id: accountId } });
    res.json({ success: true, data: { deleted: true, email: acc.email } });
  } catch (e) { next(e); }
};

const adminToggleFeatured = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const { isFeatured } = req.body || {};
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const account = await prisma.directoryAccount.findUnique({
      where: { id: accountId },
      select: { profile: { select: { id: true } } },
    });
    if (!account?.profile) return res.status(404).json({ success: false, error: 'Perfil no encontrado' });
    const updated = await prisma.directoryProfile.update({
      where: { id: account.profile.id },
      data: { isFeatured: !!isFeatured },
      select: { id: true, isFeatured: true },
    });
    res.json({ success: true, data: updated });
  } catch (e) { next(e); }
};

const publicSearch = async (req, res, next) => {
  try {
    const { q, profesion, poliza, ciudad, limit, offset } = req.query;
    const result = await directoryService.searchPublicDirectory({
      q,
      profesion,
      poliza,
      ciudad,
      limit,
      offset,
    });
    res.json({ success: true, data: result });
  } catch (e) {
    next(e);
  }
};

const publicProfileById = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const profile = await directoryService.getApprovedPublicProfileById(profileId);
    res.json({ success: true, data: profile });
  } catch (e) {
    next(e);
  }
};

const recordPublicWhatsappClick = async (req, res, next) => {
  try {
    await directoryService.recordPublicWhatsappClick(req.params.profileId);
    return res.status(204).send();
  } catch (e) {
    if (e.statusCode === 404) return res.status(204).send();
    next(e);
  }
};

const recordPublicCallClick = async (req, res, next) => {
  try {
    await directoryService.recordPublicCallClick(req.params.profileId);
    return res.status(204).send();
  } catch (e) {
    if (e.statusCode === 404) return res.status(204).send();
    next(e);
  }
};

const recordPublicEmailClick = async (req, res, next) => {
  try {
    await directoryService.recordPublicEventClick(req.params.profileId, 'EMAIL');
    return res.status(204).send();
  } catch (e) {
    if (e.statusCode === 404) return res.status(204).send();
    next(e);
  }
};

const recordPublicAgendarClick = async (req, res, next) => {
  try {
    await directoryService.recordPublicEventClick(req.params.profileId, 'AGENDAR');
    return res.status(204).send();
  } catch (e) {
    if (e.statusCode === 404) return res.status(204).send();
    next(e);
  }
};

const ALLOWED_PUBLIC_EVENT_TYPES = new Set(['SHARE', 'FAVORITE', 'MAP', 'SEGUNDA_OPINION']);

const recordPublicGenericEvent = async (req, res, next) => {
  try {
    const type = String(req.body?.type || '').toUpperCase();
    if (!ALLOWED_PUBLIC_EVENT_TYPES.has(type)) {
      return res.status(400).json({ success: false, error: 'Tipo no permitido' });
    }
    await directoryService.recordPublicEventClick(req.params.profileId, type);
    return res.status(204).send();
  } catch (e) {
    if (e.statusCode === 404) return res.status(204).send();
    next(e);
  }
};

const getMyStats = async (req, res, next) => {
  try {
    const stats = await directoryService.getStatsForAccount(req.directoryAccount.id);
    res.json({ success: true, data: stats });
  } catch (e) {
    next(e);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    const stats = await directoryService.getAdminDirectoryStats();
    res.json({ success: true, data: stats });
  } catch (e) {
    next(e);
  }
};

const submitProfileInquiry = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const { nombre, email, telefono, mensaje } = req.body;
    const inquiry = await directoryService.submitInquiryFromPublic(profileId, {
      nombre,
      email,
      telefono,
      mensaje,
    });
    metaCapi.sendEvent('Lead', {
      user: {
        email,
        phone: telefono,
        firstName: (nombre || '').split(' ')[0],
        ip: req.ip,
        userAgent: req.get('user-agent') || undefined,
      },
      customData: { content_name: 'contacto_profesional', profile_id: profileId },
      eventSourceUrl: req.get('referer') || undefined,
      eventId: `lead_${inquiry.id}`,
    }).catch(() => {});
    res.status(201).json({
      success: true,
      data: { id: inquiry.id, message: 'Gracias. Hemos recibido tu mensaje y te contactaremos pronto.' },
    });
  } catch (e) {
    next(e);
  }
};

const listMyInquiries = async (req, res, next) => {
  try {
    const { status, limit, offset } = req.query;
    const data = await directoryService.listMyDirectoryInquiries(req.directoryAccount.id, {
      status: status || undefined,
      limit,
      offset,
    });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

const patchMyInquiry = async (req, res, next) => {
  try {
    const { inquiryId } = req.params;
    const { status, ownerNote, markRead, markResponded } = req.body;
    if (
      status === undefined &&
      ownerNote === undefined &&
      markRead !== true &&
      markResponded !== true
    ) {
      return res.status(400).json({
        success: false,
        error: 'Indica qué actualizar: status, ownerNote, markRead o markResponded.',
      });
    }
    const updated = await directoryService.patchMyDirectoryInquiry(req.directoryAccount.id, inquiryId, req.body);
    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  register,
  changeMyPassword,
  directoryLogin,
  getMe,
  patchMe,
  listMyInquiries,
  patchMyInquiry,
  adminList,
  adminSetStatus,
  adminToggleFeatured,
  adminDeleteProfile,
  publicSearch,
  publicProfileById,
  recordPublicWhatsappClick,
  recordPublicCallClick,
  recordPublicEmailClick,
  recordPublicAgendarClick,
  recordPublicGenericEvent,
  getMyStats,
  getAdminStats,
  submitProfileInquiry,
};
