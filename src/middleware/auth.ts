import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.ts';

export type UserRole = 'admin' | 'editor' | 'lector' | 'instructor' | 'aprendiz';

export interface AuthUser {
  id: number;
  username: string;
  rol: UserRole;
  permisos?: string[]; // Códigos de permisos del nuevo sistema granular
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

interface JwtPayload {
  sub: number;
  username: string;
  rol: UserRole;
  permisos?: string[];
}

export function signToken(user: AuthUser): string {
  if (!config.JWT_SECRET) {
    throw new Error('JWT_SECRET no configurado');
  }
  return jwt.sign(
    { sub: user.id, username: user.username, rol: user.rol, permisos: user.permisos } satisfies JwtPayload,
    config.JWT_SECRET,
    { expiresIn: `${config.SESSION_TTL_HOURS}h`, algorithm: 'HS256' },
  );
}

export function verifyToken(token: string): AuthUser | null {
  if (!config.JWT_SECRET) return null;
  try {
    const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] }) as unknown as JwtPayload;
    return { id: payload.sub, username: payload.username, rol: payload.rol, permisos: payload.permisos };
  } catch {
    return null;
  }
}

export const COOKIE_NAME = 'sena_session';

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.COOKIE_SECURE,
    maxAge: config.SESSION_TTL_HOURS * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = (req.cookies?.[COOKIE_NAME] as string | undefined) ?? extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
  req.user = user;
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }
    next();
  };
}

function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return undefined;
}
