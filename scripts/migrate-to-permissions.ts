/**
 * Script de migración al sistema de permisos granulares
 * Ejecutar con: npx tsx scripts/migrate-to-permissions.ts
 * 
 * Este script:
 * 1. Crea permisos en la tabla permisos desde los módulos
 * 2. Crea roles por defecto y asigna permisos
 * 3. Migra usuarios existentes de usuarios.rol a usuarios_roles
 */

import { db } from '../src/db';
import { permisos, rolesPermisos, usuariosRoles, usuarios } from '../src/db/schema';
import { ALL_MODULE_PERMISSIONS } from '../src/modules';
import { eq } from 'drizzle-orm';

// Permisos por rol (alineados con los 10 módulos del sidebar)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ALL_MODULE_PERMISSIONS.map(p => p.codigo), // Admin tiene todo
  editor: [
    'inicio.ver',
    'regionales.ver', 'regionales.crear', 'regionales.editar',
    'centros.ver', 'centros.crear', 'centros.editar',
    'ambientes.ver', 'ambientes.crear', 'ambientes.editar',
    'tipos_ambiente.ver', 'tipos_ambiente.crear', 'tipos_ambiente.editar',
    'programas.ver', 'programas.crear', 'programas.editar',
    'instructores.ver', 'instructores.crear', 'instructores.editar',
    'fichas.ver', 'fichas.crear', 'fichas.editar',
    'programacion.ver', 'programacion.crear', 'programacion.editar',
  ],
  instructor: [
    'inicio.ver',
    'regionales.ver',
    'centros.ver',
    'ambientes.ver',
    'tipos_ambiente.ver',
    'programas.ver',
    'instructores.ver',
    'fichas.ver',
    'programacion.ver',
  ],
  lector: [
    'inicio.ver',
    'regionales.ver',
    'centros.ver',
    'ambientes.ver',
    'tipos_ambiente.ver',
    'programas.ver',
    'instructores.ver',
    'fichas.ver',
    'programacion.ver',
  ],
  aprendiz: [
    'inicio.ver',
    'programas.ver',
    'fichas.ver',
  ],
};

async function migrate() {
  console.log('🔄 Iniciando migración al sistema de permisos granulares...\n');

  // Paso 1: Insertar permisos
  console.log('📋 Paso 1: Insertando permisos...');
  let permisosCreados = 0;
  
  for (const permiso of ALL_MODULE_PERMISSIONS) {
    try {
      await db.insert(permisos).values({
        codigo: permiso.codigo,
        nombre: permiso.nombre,
        modulo: permiso.modulo,
        accion: permiso.accion,
        descripcion: permiso.descripcion,
      }).onConflictDoNothing();
      permisosCreados++;
      console.log(`  ✓ ${permiso.codigo}`);
    } catch (error) {
      console.log(`  ⚠ ${permiso.codigo} (ya existe)`);
    }
  }
  console.log(`  Total: ${permisosCreados} permisos procesados\n`);

  // Paso 2: Asignar permisos a roles
  console.log('👥 Paso 2: Asignando permisos a roles...');
  let asignacionesCreadas = 0;
  
  for (const [rol, permisosRol] of Object.entries(ROLE_PERMISSIONS)) {
    console.log(`  Rol: ${rol}`);
    
    for (const codigoPermiso of permisosRol) {
      // Buscar el ID del permiso
      const [permiso] = await db.select().from(permisos).where(eq(permisos.codigo, codigoPermiso));
      
      if (permiso) {
        try {
          await db.insert(rolesPermisos).values({
            rol,
            permisoId: permiso.id,
          }).onConflictDoNothing();
          asignacionesCreadas++;
          console.log(`    ✓ ${codigoPermiso}`);
        } catch (error) {
          console.log(`    ⚠ ${codigoPermiso} (ya existe)`);
        }
      }
    }
  }
  console.log(`  Total: ${asignacionesCreadas} asignaciones creadas\n`);

  // Paso 3: Migrar usuarios existentes
  console.log('🧑‍💼 Paso 3: Migrando usuarios existentes...');
  const usuariosExistentes = await db.select().from(usuarios);
  let usuariosMigrados = 0;
  
  for (const usuario of usuariosExistentes) {
    const rolActual = usuario.rol || 'lector';
    
    try {
      await db.insert(usuariosRoles).values({
        usuarioId: usuario.id,
        rol: rolActual,
      }).onConflictDoNothing();
      usuariosMigrados++;
      console.log(`  ✓ ${usuario.username} → ${rolActual}`);
    } catch (error) {
      console.log(`  ⚠ ${usuario.username} (ya tiene rol asignado)`);
    }
  }
  console.log(`  Total: ${usuariosMigrados} usuarios migrados\n`);

  console.log('✅ Migración completada exitosamente!');
  console.log('\nPróximos pasos:');
  console.log('1. Verificar que los permisos se crearon correctamente');
  console.log('2. Probar el login y verificar que el JWT incluye permisos');
  console.log('3. Los usuarios existentes ahora tienen roles asignados en usuarios_roles');
}

migrate().catch(console.error);
