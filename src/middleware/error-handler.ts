import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.ts';

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'Recurso no encontrado' });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const e = err as { name?: string; message?: string; status?: number; code?: string };
  const status = e.status ?? (e.name === 'HttpError' ? 500 : 500);

  if (e.name === 'HttpError') {
    return res.status((err as HttpError).status).json({
      error: (err as HttpError).message,
      ...((err as HttpError).details ? { details: (err as HttpError).details } : {}),
    });
  }

  logger.error({
    err: { name: e.name, message: e.message, code: e.code, stack: (err as Error)?.stack },
    method: req.method,
    url: req.originalUrl,
  }, 'unhandled_error');

  res.status(status).json({ error: 'Error interno del servidor' });
}
