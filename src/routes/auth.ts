import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { usuarios } from '../db/schema.ts';
import {
  signToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
  type AuthRequest,
} from '../middleware/auth.ts';
import { config } from '../config.ts';

const router = Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
  }

  const found = await db.select().from(usuarios).where(eq(usuarios.username, username)).limit(1);
  if (found.length === 0) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const user = found[0];
  if (!user.activo) {
    return res.status(403).json({ error: 'Usuario deshabilitado' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const now = new Date().toISOString();
  await db.update(usuarios).set({ ultimoLoginAt: now }).where(eq(usuarios.id, user.id));

  const token = signToken({ id: user.id, username: user.username, rol: user.rol as 'admin' | 'editor' | 'lector' });
  setAuthCookie(res, token);

  res.json({
    user: {
      id: user.id,
      username: user.username,
      nombre: user.nombre,
      rol: user.rol,
      debeCambiarPassword: user.debeCambiarPassword,
    },
  });
});

router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const found = await db.select().from(usuarios).where(eq(usuarios.id, req.user.id)).limit(1);
  if (found.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  const u = found[0];
  res.json({
    id: u.id,
    username: u.username,
    nombre: u.nombre,
    rol: u.rol,
    debeCambiarPassword: u.debeCambiarPassword,
    ultimoLoginAt: u.ultimoLoginAt,
  });
});

router.post('/change-password', requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const { currentPassword, newPassword } = req.body ?? {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'Datos inválidos' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
  }

  const found = await db.select().from(usuarios).where(eq(usuarios.id, req.user.id)).limit(1);
  if (found.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  const u = found[0];

  const ok = await bcrypt.compare(currentPassword, u.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.update(usuarios)
    .set({ passwordHash: newHash, debeCambiarPassword: false })
    .where(eq(usuarios.id, u.id));

  res.json({ ok: true });
});

export default router;

export async function seedAdminIfMissing() {
  const existing = await db.select().from(usuarios).limit(1);
  if (existing.length > 0) return;

  const defaultUsername = 'admin';
  const defaultPassword = config.JWT_SECRET ? 'Admin123!' : 'Admin123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  await db.insert(usuarios).values({
    username: defaultUsername,
    passwordHash,
    nombre: 'Administrador',
    rol: 'admin',
    debeCambiarPassword: true,
    activo: true,
  });

  console.log('');
  console.log('================================================================');
  console.log('  USUARIO ADMIN CREADO');
  console.log(`  Usuario:     ${defaultUsername}`);
  console.log(`  Contraseña:  ${defaultPassword}`);
  console.log('  (cámbiala en el primer inicio de sesión)');
  console.log('================================================================');
  console.log('');
}
