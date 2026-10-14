import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getValidDirectoryToken } from '../../services/directoryAccountApi';

/**
 * Rutas solo para cuentas del directorio (JWT en `directoryAccountApi`, no CRM).
 */
export default function ProtectedDirectoryRoute({ children }) {
  const location = useLocation();
  const token = getValidDirectoryToken();

  if (!token) {
    return <Navigate to="/login-directorio" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
