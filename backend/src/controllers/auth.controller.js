/**
 * Controlador de autenticación
 */

const authService = require('../services/auth.service');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    // Solo ADMIN puede crear usuarios
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Solo administradores pueden crear usuarios',
      });
    }

    const result = await authService.register(req.body);
    
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  me,
  changePassword,
};
