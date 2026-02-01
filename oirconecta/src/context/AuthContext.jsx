import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, getToken, setToken, clearToken } from '../services/apiClient';

const USER_KEY = 'oirconecta_crm_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(USER_KEY) : null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setTokenState] = useState(() => getToken());

  const setUser = useCallback((u) => {
    setUserState(u);
    try {
      if (typeof window !== 'undefined') {
        if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
        else localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.error('Error al guardar usuario:', e);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await api.post('/api/auth/login', { email, password }, { skipAuth: true });
    if (error) return { success: false, error };
    if (!data?.data?.token || !data?.data?.user) return { success: false, error: 'Respuesta inválida del servidor' };
    const { token: t, user: u } = data.data;
    setToken(t);
    setTokenState(t);
    setUser(u);
    return { success: true, error: null };
  }, [setUser]);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, [setUser]);

  useEffect(() => {
    const t = getToken();
    if (!t && user) {
      setUserState(null);
      try { localStorage.removeItem(USER_KEY); } catch {}
    }
  }, [token, user]);

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
