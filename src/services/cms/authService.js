class CMSAuthService {
  constructor() {
    this.userKey = 'cms_user';
    this.tokenKey = 'cms_token';
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    const user = this.getCurrentUser();
    const token = this.getToken();
    return !!(user && token);
  }

  // Obtener usuario actual
  getCurrentUser() {
    try {
      const userData = localStorage.getItem(this.userKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Obtener token
  getToken() {
    try {
      const user = this.getCurrentUser();
      return user ? user.token : null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Login del usuario
  async login(email, password) {
    try {
      // Simular validación de credenciales
      if (email === 'admin@oirconecta.com' && password === 'admin123') {
        const userData = {
          email: email,
          role: 'admin',
          name: 'Administrador CMS',
          token: 'cms_token_' + Date.now(),
          lastLogin: new Date().toISOString()
        };

        localStorage.setItem(this.userKey, JSON.stringify(userData));
        return { success: true, user: userData };
      } else {
        return { success: false, error: 'Credenciales incorrectas' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Error en el servidor' };
    }
  }

  // Logout del usuario
  logout() {
    try {
      localStorage.removeItem(this.userKey);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Error al cerrar sesión' };
    }
  }

  // Verificar permisos del usuario
  hasPermission(permission) {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Por ahora, el admin tiene todos los permisos
    if (user.role === 'admin') return true;

    // Aquí puedes agregar lógica de permisos más específica
    return false;
  }

  // Actualizar datos del usuario
  updateUserData(newData) {
    try {
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...newData };
        localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }
      return { success: false, error: 'Usuario no encontrado' };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, error: 'Error al actualizar usuario' };
    }
  }

  // Verificar si el token ha expirado
  isTokenExpired() {
    const user = this.getCurrentUser();
    if (!user || !user.lastLogin) return true;

    const lastLogin = new Date(user.lastLogin);
    const now = new Date();
    const hoursDiff = (now - lastLogin) / (1000 * 60 * 60);

    // Token expira después de 24 horas
    return hoursDiff > 24;
  }

  // Renovar token
  renewToken() {
    try {
      const user = this.getCurrentUser();
      if (user) {
        const updatedUser = {
          ...user,
          token: 'cms_token_' + Date.now(),
          lastLogin: new Date().toISOString()
        };
        localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
        return { success: true, user: updatedUser };
      }
      return { success: false, error: 'Usuario no encontrado' };
    } catch (error) {
      console.error('Renew token error:', error);
      return { success: false, error: 'Error al renovar token' };
    }
  }
}

export default new CMSAuthService(); 