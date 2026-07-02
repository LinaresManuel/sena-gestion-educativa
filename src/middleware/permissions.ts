import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth.ts';

/**
 * Middleware que verifica si el usuario tiene un permiso específico
 * @param permissionCode - Código del permiso (ej: 'programacion.editar')
 */
export function requirePermission(permissionCode: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Los admins tienen todos los permisos
    if (req.user.rol === 'admin') {
      return next();
    }

    // Verificar si el permiso está en la lista del JWT
    if (!req.user.permisos || !req.user.permisos.includes(permissionCode)) {
      return res.status(403).json({ 
        error: 'Permisos insuficientes',
        required: permissionCode 
      });
    }

    next();
  };
}

/**
 * Middleware que verifica si el usuario tiene AL MENOS UNO de los permisos especificados
 * @param permissionCodes - Array de códigos de permisos
 */
export function requireAnyPermission(...permissionCodes: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Los admins tienen todos los permisos
    if (req.user.rol === 'admin') {
      return next();
    }

    // Verificar si tiene al menos uno de los permisos
    if (!req.user.permisos || !req.user.permisos.some(p => permissionCodes.includes(p))) {
      return res.status(403).json({ 
        error: 'Permisos insuficientes',
        required: permissionCodes 
      });
    }

    next();
  };
}

/**
 * Middleware que verifica si el usuario tiene TODOS los permisos especificados
 * @param permissionCodes - Array de códigos de permisos
 */
export function requireAllPermissions(...permissionCodes: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Los admins tienen todos los permisos
    if (req.user.rol === 'admin') {
      return next();
    }

    // Verificar si tiene todos los permisos
    if (!req.user.permisos || !permissionCodes.every(p => req.user.permisos.includes(p))) {
      return res.status(403).json({ 
        error: 'Permisos insuficientes',
        required: permissionCodes 
      });
    }

    next();
  };
}

/**
 * Helper para verificar permisos sin middleware (para uso en lógica de negocio)
 */
export function hasPermission(user: { rol: string; permisos?: string[] }, permissionCode: string): boolean {
  if (user.rol === 'admin') return true;
  return user.permisos?.includes(permissionCode) ?? false;
}

/**
 * Helper para verificar si el usuario tiene al menos uno de los permisos
 */
export function hasAnyPermission(user: { rol: string; permisos?: string[] }, ...permissionCodes: string[]): boolean {
  if (user.rol === 'admin') return true;
  return user.permisos?.some(p => permissionCodes.includes(p)) ?? false;
}
