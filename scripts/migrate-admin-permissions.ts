/**
 * Script de migración para permisos del módulo admin
 * Ejecutar con: npx tsx scripts/migrate-admin-permissions.ts
 */

import { db } from '../src/db';
import { permisos, rolesPermisos } from '../src/db/schema';
import { ADMIN_PERMISSIONS } from '../src/modules/admin/permissions';
import { eq } from 'drizzle-orm';

const ROLE_ADMIN_PERMISSIONS: Record<string, string[]> = {
  admin: ['admin.ver', 'admin.crear', 'admin.editar', 'admin.eliminar', 'admin.roles'],
  editor: ['admin.ver', 'admin.crear', 'admin.editar'],
  instructor: ['admin.ver'],
  lector: ['admin.ver'],
};

async function migrate() {
  console.log('🔄 Migrando permisos del módulo admin...\n');

  // Paso 1: Insertar permisos admin
  console.log('📋 Paso 1: Insertando permisos admin...');
  for (const permiso of ADMIN_PERMISSIONS) {
    try {
      await db.insert(permisos).values({
        codigo: permiso.codigo,
        nombre: permiso.nombre,
        modulo: permiso.modulo,
        accion: permiso.accion,
        descripcion: permiso.descripcion,
      }).onConflictDoNothing();
      console.log(`  ✓ ${permiso.codigo}`);
    } catch (error) {
      console.log(`  ⚠ ${permiso.codigo} (ya existe)`);
    }
  }

  // Paso 2: Asignar permisos a roles
  console.log('\n👥 Paso 2: Asignando permisos a roles...');
  for (const [rol, permisosRol] of Object.entries(ROLE_ADMIN_PERMISSIONS)) {
    console.log(`  Rol: ${rol}`);
    for (const codigo of permisosRol) {
      const [permiso] = await db.select().from(permisos).where(eq(permisos.codigo, codigo));
      if (permiso) {
        try {
          await db.insert(rolesPermisos).values({
            rol,
            permisoId: permiso.id,
          }).onConflictDoNothing();
          console.log(`    ✓ ${codigo}`);
        } catch (error) {
          console.log(`    ⚠ ${codigo} (ya existe)`);
        }
      }
    }
  }

  console.log('\n✅ Migración de permisos admin completada');
}

migrate().catch(console.error);
