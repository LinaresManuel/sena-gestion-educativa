import { createContext, useContext } from "react";

interface AuthUser {
  id: number;
  username: string;
  nombre: string;
  rol: string;
  permisos?: string[];
  debeCambiarPassword: boolean;
}

export const AuthContext = createContext<AuthUser | null>(null);

export function useAuth() {
  const user = useContext(AuthContext);
  if (!user) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return user;
}

/**
 * Hook para verificar si el usuario puede editar (compatibilidad con código existente)
 */
export function useCanEdit() {
  const user = useAuth();
  // Admin siempre puede editar
  if (user.rol === "admin") return true;
  // Verificar permisos de edición en cualquier módulo
  return user.permisos?.some(p => p.includes('.editar') || p.includes('.crear')) ?? false;
}

/**
 * Hook para verificar si el usuario tiene un permiso específico
 */
export function useHasPermission(permissionCode: string) {
  const user = useAuth();
  // Admin tiene todos los permisos
  if (user.rol === "admin") return true;
  return user.permisos?.includes(permissionCode) ?? false;
}

/**
 * Hook para verificar si el usuario tiene AL MENOS UNO de los permisos
 */
export function useHasAnyPermission(...permissionCodes: string[]) {
  const user = useAuth();
  if (user.rol === "admin") return true;
  return user.permisos?.some(p => permissionCodes.includes(p)) ?? false;
}

/**
 * Hook para obtener todos los permisos del usuario
 */
export function usePermissions() {
  const user = useAuth();
  return user.permisos || [];
}

/**
 * Hook para obtener el rol del usuario
 */
export function useUserRole() {
  const user = useAuth();
  return user.rol;
}

/**
 * Hook para verificar si el usuario es admin
 */
export function useIsAdmin() {
  const user = useAuth();
  return user.rol === "admin";
}

/**
 * Helper para verificar permisos sin hook (para uso en lógica de negocio)
 */
export function hasPermission(user: { rol: string; permisos?: string[] }, permissionCode: string): boolean {
  if (user.rol === "admin") return true;
  return user.permisos?.includes(permissionCode) ?? false;
}

/**
 * Helper para verificar si el usuario tiene al menos uno de los permisos
 */
export function hasAnyPermission(user: { rol: string; permisos?: string[] }, ...permissionCodes: string[]): boolean {
  if (user.rol === "admin") return true;
  return user.permisos?.some(p => permissionCodes.includes(p)) ?? false;
}
