const directoryService = require('../services/directory.service');

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
  directoryLogin,
  getMe,
  patchMe,
  listMyInquiries,
  patchMyInquiry,
  adminList,
  adminSetStatus,
  publicSearch,
  publicProfileById,
  recordPublicWhatsappClick,
  submitProfileInquiry,
};
