/**
 * Servicio de autenticación
 */

const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { generateToken } = require('../utils/jwt');

const prisma = new PrismaClient();

/**
 * Iniciar sesión
 */
const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  if (!user.activo) {
    const error = new Error('Usuario desactivado');
    error.statusCode = 401;
    throw error;
  }

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    const error = new Error('Credenciales inválidas');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
      professionalConfigId: user.professionalConfigId || undefined,
    },
  };
};

/**
 * Registrar nuevo usuario
 */
const register = async (data) => {
  const { email, password, nombre, role = 'RECEPCION', registroProfesional, especialidad } = data;

  // Validar fortaleza de contraseña
  const passwordValidation = validatePasswordStrength(password);
  if (!passwordValidation.valid) {
    const error = new Error(passwordValidation.errors.join('. '));
    error.statusCode = 400;
    throw error;
  }

  // Verificar si el email ya existe
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    const error = new Error('El email ya está registrado');
    error.statusCode = 400;
    throw error;
  }

  // Hashear contraseña
  const hashedPassword = await hashPassword(password);

  // Crear usuario
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      nombre,
      role,
      registroProfesional: registroProfesional?.trim() || null,
      especialidad: especialidad?.trim() || null,
    },
    select: {
      id: true,
      email: true,
      nombre: true,
      role: true,
      registroProfesional: true,
      especialidad: true,
      createdAt: true,
    },
  });

  return { user };
};

/**
 * Cambiar contraseña
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }

  // Verificar contraseña actual
  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    const error = new Error('Contraseña actual incorrecta');
    error.statusCode = 400;
    throw error;
  }

  // Validar fortaleza de nueva contraseña
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    const error = new Error(passwordValidation.errors.join('. '));
    error.statusCode = 400;
    throw error;
  }

  // Hashear y guardar nueva contraseña
  const hashedPassword = await hashPassword(newPassword);
  
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return true;
};

/**
 * Listar usuarios del centro (para asignar responsables en CRM / acciones del día)
 */
const CRM_ROLES = ['ADMIN', 'VENDEDOR', 'AUDIOLOGA', 'RECEPCION', 'SOLO_LECTURA', 'PROFESIONAL_WEB'];

const listUsers = async () => {
  const users = await prisma.user.findMany({
    select: { id: true, nombre: true, email: true, role: true, professionalConfigId: true, registroProfesional: true, especialidad: true, activo: true, createdAt: true },
    orderBy: { nombre: 'asc' },
  });
  return users;
};

/**
 * Actualizar usuario (solo ADMIN). Rol, activo, professionalConfigId.
 */
const updateUser = async (userId, data) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const patch = {};
  if ('professionalConfigId' in data) {
    patch.professionalConfigId = data.professionalConfigId ?? null;
  }
  if ('registroProfesional' in data) {
    patch.registroProfesional = data.registroProfesional?.trim() || null;
  }
  if ('especialidad' in data) {
    patch.especialidad = data.especialidad?.trim() || null;
  }
  if (data.role !== undefined && data.role !== null && data.role !== '') {
    if (!CRM_ROLES.includes(data.role)) {
      const err = new Error('Rol inválido');
      err.statusCode = 400;
      throw err;
    }
    patch.role = data.role;
  }
  if (data.activo !== undefined) {
    patch.activo = Boolean(data.activo);
  }

  if (Object.keys(patch).length === 0) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nombre: true, role: true, professionalConfigId: true, registroProfesional: true, especialidad: true, activo: true },
    });
  }

  if (user.role === 'ADMIN' && user.activo) {
    const otherActiveAdmins = await prisma.user.count({
      where: { role: 'ADMIN', activo: true, id: { not: userId } },
    });
    const becomesNonAdmin = patch.role !== undefined && patch.role !== 'ADMIN';
    const becomesInactive = patch.activo === false;
    if ((becomesNonAdmin || becomesInactive) && otherActiveAdmins < 1) {
      const err = new Error('Debe existir al menos otro administrador activo antes de cambiar este usuario');
      err.statusCode = 400;
      throw err;
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: patch,
    select: { id: true, email: true, nombre: true, role: true, professionalConfigId: true, activo: true },
  });
};

module.exports = {
  login,
  register,
  changePassword,
  listUsers,
  updateUser,
};
