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
    },
  };
};

/**
 * Registrar nuevo usuario
 */
const register = async (data) => {
  const { email, password, nombre, role = 'ADMIN' } = data;

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
    },
    select: {
      id: true,
      email: true,
      nombre: true,
      role: true,
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

module.exports = {
  login,
  register,
  changePassword,
};
