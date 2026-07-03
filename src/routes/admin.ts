import { Router } from 'express';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.ts';
import { usuarios, usuariosRoles, rolesPermisos, permisos } from '../db/schema.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import { requirePermission } from '../middleware/permissions.ts';
import { ALL_MODULE_PERMISSIONS } from '../modules/index.ts';

const router = Router();

function generateRandomPassword(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}

// ==========================================
// ENDPOINTS DE ADMINISTRACIÓN DE PERMISOS
// ==========================================

// GET /api/admin/permisos - Listar todos los permisos disponibles
router.get('/permisos', requireAuth, requirePermission('admin.ver'), async (req, res) => {
  try {
    const allPermisos = await db.select().from(permisos);
    res.json(allPermisos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/permisos/modulo/:modulo - Obtener permisos de un módulo
router.get('/permisos/modulo/:modulo', requireAuth, requirePermission('admin.ver'), async (req, res) => {
  try {
    const { modulo } = req.params;
    const permisosModulo = ALL_MODULE_PERMISSIONS.filter(p => p.modulo === modulo);
    res.json(permisosModulo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINTS DE ADMINISTRACIÓN DE ROLES
// ==========================================

// GET /api/admin/roles - Listar roles con sus permisos
router.get('/roles', requireAuth, requirePermission('admin.ver'), async (req, res) => {
  try {
    // Obtener roles únicos de roles_permisos (incluye roles personalizados sin usuarios asignados)
    const uniqueRoles = await db.selectDistinct({ rol: rolesPermisos.rol }).from(rolesPermisos);
    
    // Obtener permisos para cada rol
    const rolesWithPermisos = await Promise.all(
      uniqueRoles.map(async ({ rol }) => {
        const rolPermisos = await db.select({ 
          codigo: permisos.codigo,
          nombre: permisos.nombre 
        })
        .from(rolesPermisos)
        .innerJoin(permisos, eq(rolesPermisos.permisoId, permisos.id))
        .where(eq(rolesPermisos.rol, rol));
        
        return {
          rol,
          permisos: rolPermisos,
          totalPermisos: rolPermisos.length,
        };
      })
    );
    
    res.json(rolesWithPermisos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/roles/:rol - Obtener permisos de un rol específico
router.get('/roles/:rol', requireAuth, requirePermission('admin.ver'), async (req, res) => {
  try {
    const { rol } = req.params;
    const rolPermisos = await db.select({ 
      codigo: permisos.codigo,
      nombre: permisos.nombre,
      modulo: permisos.modulo,
      accion: permisos.accion
    })
    .from(rolesPermisos)
    .innerJoin(permisos, eq(rolesPermisos.permisoId, permisos.id))
    .where(eq(rolesPermisos.rol, rol));
    
    res.json({ rol, permisos: rolPermisos });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/roles/:rol/permisos - Asignar permisos a un rol
// POST /api/admin/roles - Crear nuevo rol
router.post('/roles', requireAuth, requirePermission('admin.roles'), async (req, res) => {
  try {
    const { nombre, permisos: permisosCodigos } = req.body;

    if (typeof nombre !== 'string' || !nombre.trim()) {
      return res.status(400).json({ error: 'Nombre del rol es obligatorio' });
    }

    const existing = await db.selectDistinct({ rol: rolesPermisos.rol })
      .from(rolesPermisos)
      .where(eq(rolesPermisos.rol, nombre.trim()));

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe un rol con ese nombre' });
    }

    if (!Array.isArray(permisosCodigos)) {
      return res.status(400).json({ error: 'permisos debe ser un array de códigos' });
    }

    let asignacionesCreadas = 0;
    try {
      for (const codigo of permisosCodigos) {
        const [permiso] = await db.select().from(permisos).where(eq(permisos.codigo, codigo));
        if (permiso) {
          await db.insert(rolesPermisos).values({
            rol: nombre.trim(),
            permisoId: permiso.id,
          });
          asignacionesCreadas++;
        }
      }
    } catch (insertErr: any) {
      if (insertErr.message?.includes('UNIQUE constraint failed')) {
        return res.status(409).json({ error: 'Ya existe un permiso asignado a este rol' });
      }
      throw insertErr;
    }

    res.json({ ok: true, rol: nombre.trim(), totalPermisos: asignacionesCreadas });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/roles/:rol/permisos - Actualizar permisos de un rol
router.post('/roles/:rol/permisos', requireAuth, requirePermission('admin.roles'), async (req, res) => {
  try {
    const { rol } = req.params;
    const { permisos: permisosCodigos } = req.body;

    if (!Array.isArray(permisosCodigos)) {
      return res.status(400).json({ error: 'permisos debe ser un array de códigos' });
    }

    await db.delete(rolesPermisos).where(eq(rolesPermisos.rol, rol));

    let asignacionesCreadas = 0;
    for (const codigo of permisosCodigos) {
      const [permiso] = await db.select().from(permisos).where(eq(permisos.codigo, codigo));
      if (permiso) {
        await db.insert(rolesPermisos).values({
          rol,
          permisoId: permiso.id,
        });
        asignacionesCreadas++;
      }
    }

    res.json({
      ok: true,
      message: `Permisos actualizados para el rol ${rol}`,
      total: asignacionesCreadas
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/roles/:rol - Eliminar un rol
router.delete('/roles/:rol', requireAuth, requirePermission('admin.roles'), async (req, res) => {
  try {
    const { rol } = req.params;

    const rolesSistema = ['admin', 'editor', 'instructor', 'lector', 'aprendiz'];
    if (rolesSistema.includes(rol)) {
      return res.status(400).json({ error: 'No se pueden eliminar roles del sistema' });
    }

    const usuariosConRol = await db.select()
      .from(usuariosRoles)
      .where(eq(usuariosRoles.rol, rol))
      .limit(1);

    if (usuariosConRol.length > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un rol que tiene usuarios asignados' });
    }

    await db.delete(rolesPermisos).where(eq(rolesPermisos.rol, rol));
    await db.delete(usuariosRoles).where(eq(usuariosRoles.rol, rol));

    res.json({ ok: true, message: `Rol ${rol} eliminado` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINTS DE ASIGNACIÓN DE ROLES A USUARIOS
// ==========================================

// GET /api/admin/usuarios/:id/roles - Obtener roles de un usuario
router.get('/usuarios/:id/roles', requireAuth, requirePermission('admin.ver'), async (req, res) => {
  try {
    const usuarioId = Number(req.params.id);
    const userRoles = await db.select().from(usuariosRoles).where(eq(usuariosRoles.usuarioId, usuarioId));
    res.json(userRoles.map(r => r.rol));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/usuarios/:id/roles - Asignar roles a un usuario
router.post('/usuarios/:id/roles', requireAuth, requirePermission('admin.editar'), async (req, res) => {
  try {
    const usuarioId = Number(req.params.id);
    const { roles } = req.body;
    
    if (!Array.isArray(roles)) {
      return res.status(400).json({ error: 'roles debe ser un array' });
    }
    
    // Eliminar roles existentes
    await db.delete(usuariosRoles).where(eq(usuariosRoles.usuarioId, usuarioId));
    
    // Asignar nuevos roles
    let rolesAsignados = 0;
    for (const rol of roles) {
      await db.insert(usuariosRoles).values({
        usuarioId,
        rol,
      });
      rolesAsignados++;
    }
    
    res.json({ 
      ok: true, 
      message: 'Roles actualizados',
      total: rolesAsignados 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/usuarios/:id/roles/:rol - Eliminar un rol de un usuario
router.delete('/usuarios/:id/roles/:rol', requireAuth, requirePermission('admin.editar'), async (req, res) => {
  try {
    const usuarioId = Number(req.params.id);
    const { rol } = req.params;
    
    await db.delete(usuariosRoles)
      .where(eq(usuariosRoles.usuarioId, usuarioId) && eq(usuariosRoles.rol, rol));
    
    res.json({ ok: true, message: `Rol ${rol} eliminado del usuario` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// ENDPOINTS DE USUARIOS (para gestión admin)
// ==========================================

// POST /api/admin/usuarios - Crear usuario (contraseña auto-generada)
router.post('/usuarios', requireAuth, requirePermission('admin.crear'), async (req, res) => {
  try {
    const { username, nombre, roles } = req.body;

    if (typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ error: 'Username es obligatorio' });
    }
    if (typeof nombre !== 'string' || !nombre.trim()) {
      return res.status(400).json({ error: 'Nombre es obligatorio' });
    }
    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ error: 'Debe asignar al menos un rol' });
    }

    const temporaryPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const [newUser] = await db.insert(usuarios).values({
      username: username.trim(),
      passwordHash,
      nombre: nombre.trim(),
      rol: roles[0],
      debeCambiarPassword: true,
      activo: true,
    }).returning();

    for (const rol of roles) {
      await db.insert(usuariosRoles).values({ usuarioId: newUser.id, rol });
    }

    res.json({ ...newUser, passwordHash: undefined, roles, temporaryPassword });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'El username ya existe' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/usuarios/:id - Eliminar usuario
router.delete('/usuarios/:id', requireAuth, requirePermission('admin.eliminar'), async (req, res) => {
  try {
    const usuarioId = Number(req.params.id);

    if (req.user?.id === usuarioId) {
      return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    }

    const [user] = await db.select().from(usuarios).where(eq(usuarios.id, usuarioId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await db.delete(usuariosRoles).where(eq(usuariosRoles.usuarioId, usuarioId));
    await db.delete(usuarios).where(eq(usuarios.id, usuarioId));

    res.json({ ok: true, message: `Usuario ${user.username} eliminado` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/usuarios/:id/reset-password - Resetear contraseña
router.post('/usuarios/:id/reset-password', requireAuth, requirePermission('admin.editar'), async (req, res) => {
  try {
    const usuarioId = Number(req.params.id);

    const [user] = await db.select().from(usuarios).where(eq(usuarios.id, usuarioId)).limit(1);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const temporaryPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await db.update(usuarios)
      .set({ passwordHash, debeCambiarPassword: true })
      .where(eq(usuarios.id, usuarioId));

    res.json({ ok: true, temporaryPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/usuarios - Listar todos los usuarios
router.get('/usuarios', requireAuth, requirePermission('admin.ver'), async (req, res) => {
  try {
    const allUsers = await db.select().from(usuarios);
    
    // Obtener roles de cada usuario
    const usersWithRoles = await Promise.all(
      allUsers.map(async (user) => {
        const userRoles = await db.select().from(usuariosRoles).where(eq(usuariosRoles.usuarioId, user.id));
        return {
          ...user,
          roles: userRoles.map(r => r.rol),
          passwordHash: undefined, // No enviar hash
        };
      })
    );
    
    res.json(usersWithRoles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/usuarios/:id - Actualizar usuario
router.put('/usuarios/:id', requireAuth, requirePermission('admin.editar'), async (req, res) => {
  try {
    const usuarioId = Number(req.params.id);
    const { nombre, activo, debeCambiarPassword, roles } = req.body;

    const updates: any = {};
    if (nombre !== undefined) updates.nombre = nombre;
    if (activo !== undefined) updates.activo = activo;
    if (debeCambiarPassword !== undefined) updates.debeCambiarPassword = debeCambiarPassword;
    if (Array.isArray(roles) && roles.length > 0) updates.rol = roles[0];

    if (Object.keys(updates).length === 0 && !Array.isArray(roles)) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    const [existing] = await db.select().from(usuarios).where(eq(usuarios.id, usuarioId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (Object.keys(updates).length > 0) {
      await db.update(usuarios).set(updates).where(eq(usuarios.id, usuarioId));
    }

    if (Array.isArray(roles)) {
      await db.delete(usuariosRoles).where(eq(usuariosRoles.usuarioId, usuarioId));
      for (const rol of roles) {
        await db.insert(usuariosRoles).values({ usuarioId, rol });
      }
    }

    const [updated] = await db.select().from(usuarios).where(eq(usuarios.id, usuarioId)).limit(1);
    res.json({ ...updated, passwordHash: undefined });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/stats - Estadísticas del sistema
router.get('/stats', requireAuth, requirePermission('admin.ver'), async (req, res) => {
  try {
    const totalUsuarios = await db.select().from(usuarios);
    const totalRoles = await db.selectDistinct({ rol: usuariosRoles.rol }).from(usuariosRoles);
    const totalPermisos = await db.select().from(permisos);
    
    res.json({
      totalUsuarios: totalUsuarios.length,
      totalRoles: totalRoles.length,
      totalPermisos: totalPermisos.length,
      usuariosActivos: totalUsuarios.filter(u => u.activo).length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
