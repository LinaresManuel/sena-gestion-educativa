import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.ts';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const { method, originalUrl, ip } = req;
  const userAgent = req.headers['user-agent'];

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const userId = (req as unknown as { user?: { id: number; username: string } }).user;
    logger.info({
      method,
      url: originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip,
      userAgent,
      userId: userId?.id,
      username: userId?.username,
    }, 'http_request');
  });

  next();
}
