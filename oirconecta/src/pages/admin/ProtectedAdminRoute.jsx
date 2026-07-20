import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getAdminToken, getAdminUser } from './adminAuth';
import { canAccessAllAdminPages, canUseSalesCrm } from '../../utils/rolePermissions';

/**
 * Gate del portal-admin: exige token y, opcionalmente, rol suficiente.
 *
 *   requireFullAdmin=true → solo roles que ven todo (ADMIN).
 *   requireSales=true     → roles con acceso a Sales (ADMIN, EJECUTIVO_COMERCIAL).
 *   sin flags             → solo requiere token válido.
 *
 * Sin permiso: redirige a /portal-admin (index), donde AdminLayout decide qué mostrar.
 * Sin token:   redirige a /admin-login.
 */
export default function ProtectedAdminRoute({ children, requireFullAdmin = false, requireSales = false }) {
  const location = useLocation();
  if (!getAdminToken()) {
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }
  const user = getAdminUser();
  const role = user?.role;
  if (requireFullAdmin && !canAccessAllAdminPages(role)) {
    return <Navigate to="/portal-admin/sales" replace />;
  }
  if (requireSales && !canUseSalesCrm(role)) {
    return <Navigate to="/portal-admin" replace />;
  }
  return <>{children}</>;
}
