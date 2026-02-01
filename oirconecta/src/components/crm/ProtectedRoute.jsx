import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Protege rutas del CRM: redirige a /login-crm si no hay sesión.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login-crm" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
