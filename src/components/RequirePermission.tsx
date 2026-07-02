import React from 'react';
import { useHasPermission, useHasAnyPermission } from '../lib/auth-context';

interface RequirePermissionProps {
  permission?: string;
  anyPermission?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente que renderiza hijos solo si el usuario tiene el permiso requerido
 * 
 * Uso:
 * <RequirePermission permission="programacion.editar">
 *   <BotonEditar />
 * </RequirePermission>
 * 
 * <RequirePermission anyPermission={['inventario.crear', 'inventario.editar']}>
 *   <BotonGuardar />
 * </RequirePermission>
 */
export function RequirePermission({ 
  permission, 
  anyPermission, 
  children, 
  fallback = null 
}: RequirePermissionProps) {
  // Hook unconditionally - always called
  const hasSinglePermission = useHasPermission(permission || '');
  const hasAnyPerm = useHasAnyPermission(...(anyPermission || []));
  
  // Determinar si tiene permiso
  let hasAccess = false;
  if (permission) {
    hasAccess = hasSinglePermission;
  } else if (anyPermission && anyPermission.length > 0) {
    hasAccess = hasAnyPerm;
  } else {
    // Si no se especifica permiso, siempre mostrar
    hasAccess = true;
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * Componente que oculta elementos si el usuario no tiene permiso de edición
 * Útil para proteger formularios y botones de acción
 */
export function EditGuard({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  // Obtener permisos del usuario
  const { rol, permisos } = useAuthForGuard();
  
  // Admin siempre puede editar
  if (rol === 'admin') return <>{children}</>;
  
  // Verificar si tiene algún permiso de edición
  const canEdit = permisos?.some(p => p.includes('.editar') || p.includes('.crear')) ?? false;
  
  return canEdit ? <>{children}</> : <>{fallback}</>;
}

// Helper hook para el guard (evita usar useAuth directamente)
function useAuthForGuard() {
  const { useAuth } = require('../lib/auth-context');
  return useAuth();
}

export default RequirePermission;
