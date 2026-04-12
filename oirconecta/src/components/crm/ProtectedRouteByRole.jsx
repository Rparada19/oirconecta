import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Protege rutas por rol: requiere sesión y uno de los roles permitidos.
 * Si no tiene permiso, redirige al portal principal.
 * @param {string[]} allowedRoles - Roles que pueden acceder (ej. ['ADMIN'], ['ADMIN', 'AUDIOLOGA'])
 */
export default function ProtectedRouteByRole({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login-crm" state={{ from: location }} replace />;
  }

  const role = user?.role;
  if (allowedRoles.length > 0 && role && !allowedRoles.includes(role)) {
    return <Navigate to="/portal-crm" replace />;
  }

  return <>{children}</>;
}
