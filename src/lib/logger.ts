import pino from 'pino';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { config } from '../config.ts';

const logsDir = path.resolve(process.cwd(), '..', 'sena-data', 'logs');
if (!existsSync(logsDir)) {
  try { mkdirSync(logsDir, { recursive: true }); } catch { /* ignore */ }
}

const isDev = config.NODE_ENV === 'development';

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  base: { service: 'sena-gestion-educativa' },
  timestamp: pino.stdTimeFunctions.isoTime,
}, isDev ? pino.transport({
  target: 'pino-pretty',
  options: { colorize: true, translateTime: 'HH:MM:ss.l' },
}) : pino.destination({
  dest: path.join(logsDir, 'app.log'),
  sync: false,
  mkdir: true,
}));

export function childLogger(component: string) {
  return logger.child({ component });
}
