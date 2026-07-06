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

/**
 * Resuelve permisos efectivos: si el usuario tiene cualquier accion CRUD
 * en un modulo, se agrega automaticamente el permiso 'ver' de ese modulo.
 */
export function resolveEffectivePermissions(permisos: string[]): string[] {
  const modules = new Set(permisos.map(p => p.split('.')[0]));
  const resolved = new Set(permisos);
  for (const mod of modules) {
    if (permisos.some(p => p.startsWith(`${mod}.`) && p !== `${mod}.ver`)) {
      resolved.add(`${mod}.ver`);
    }
  }
  return [...resolved];
}

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
  if (user.rol === "admin") return true;
  const effective = resolveEffectivePermissions(user.permisos || []);
  return effective.includes(permissionCode);
}

/**
 * Hook para verificar si el usuario tiene AL MENOS UNO de los permisos
 */
export function useHasAnyPermission(...permissionCodes: string[]) {
  const user = useAuth();
  if (user.rol === "admin") return true;
  const effective = resolveEffectivePermissions(user.permisos || []);
  return effective.some(p => permissionCodes.includes(p));
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
  const effective = resolveEffectivePermissions(user.permisos || []);
  return effective.includes(permissionCode);
}

/**
 * Helper para verificar si el usuario tiene al menos uno de los permisos
 */
export function hasAnyPermission(user: { rol: string; permisos?: string[] }, ...permissionCodes: string[]): boolean {
  if (user.rol === "admin") return true;
  const effective = resolveEffectivePermissions(user.permisos || []);
  return effective.some(p => permissionCodes.includes(p));
}
