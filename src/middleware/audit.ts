import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.ts';

const AUDITED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const REDACT_KEYS = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'passwordHash',
  'token',
  'authorization',
]);

function redact(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = REDACT_KEYS.has(k) ? '***' : redact(v);
    }
    return out;
  }
  return value;
}

export function auditLogger(req: Request, res: Response, next: NextFunction) {
  if (!AUDITED_METHODS.has(req.method)) return next();

  const start = Date.now();
  const user = (req as unknown as { user?: { id: number; username: string; rol: string } }).user;
  const body = req.body && Object.keys(req.body).length > 0 ? redact(req.body) : undefined;

  res.on('finish', () => {
    if (res.statusCode >= 400) return;
    const durationMs = Date.now() - start;
    logger.info({
      event: 'audit',
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
      userId: user?.id,
      username: user?.username,
      rol: user?.rol,
      body,
    }, 'mutation_audit');
  });

  next();
}
