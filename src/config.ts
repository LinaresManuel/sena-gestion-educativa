import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnv() {
  const candidates = ['.env.local', '.env'];
  for (const file of candidates) {
    const fullPath = resolve(process.cwd(), file);
    if (!existsSync(fullPath)) continue;
    const content = readFileSync(fullPath, 'utf-8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

loadDotEnv();

const NODE_ENV = (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test';
const PORT = Number(process.env.PORT ?? 3000);
const DATABASE_URL = process.env.DATABASE_URL ?? 'data.db';
const APP_URL = process.env.APP_URL ?? `http://localhost:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET ?? (NODE_ENV === 'production' ? '' : 'dev-only-secret-please-change-in-production-min-32-chars');
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? APP_URL;
const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS ?? 12);
const COOKIE_SECURE = (process.env.COOKIE_SECURE ?? 'false') === 'true';

const errors: string[] = [];

if (NODE_ENV === 'production' && JWT_SECRET.includes('dev-only-secret')) {
  errors.push('JWT_SECRET debe estar definido en producción con una cadena aleatoria de al menos 32 caracteres');
}

if (Number.isNaN(PORT) || PORT <= 0 || PORT > 65535) {
  errors.push(`PORT inválido: ${process.env.PORT}`);
}

if (Number.isNaN(SESSION_TTL_HOURS) || SESSION_TTL_HOURS <= 0) {
  errors.push(`SESSION_TTL_HOURS inválido: ${process.env.SESSION_TTL_HOURS}`);
}

if (errors.length > 0) {
  console.error('Errores de configuración:');
  for (const err of errors) console.error(`  - ${err}`);
  process.exit(1);
}

export const config = {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  APP_URL,
  JWT_SECRET,
  CORS_ORIGIN,
  SESSION_TTL_HOURS,
  COOKIE_SECURE,
} as const;
