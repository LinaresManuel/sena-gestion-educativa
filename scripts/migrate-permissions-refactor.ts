/**
 * Migración: refactorizar permisos para alinearlos con los módulos reales del sidebar
 * 
 * 1. Inserta 28 nuevos permisos (regionales, centros, ambientes, tipos_ambiente, programas, instructores, fichas)
 * 2. Asigna nuevos permisos a roles
 * 3. Elimina viejos permisos (comunicacion, notas, asistencia, inventario, cursos, salones, config)
 */

import { db } from '../src/db';
import { permisos, rolesPermisos } from '../src/db/schema';
import { ALL_MODULE_PERMISSIONS } from '../src/modules';
import { eq, inArray } from 'drizzle-orm';

// Definición de nuevos permisos por rol
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ALL_MODULE_PERMISSIONS.map(p => p.codigo),
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

// Módulos viejos a eliminar
const OLD_MODULES = ['comunicacion', 'notas', 'asistencia', 'inventario', 'cursos', 'salones', 'config'];

async function migrate() {
  console.log('=== Migración: Refactorización de permisos ===\n');

  // Paso 1: Insertar nuevos permisos
  console.log('Paso 1: Insertando nuevos permisos...');
  let inserted = 0;
  for (const permiso of ALL_MODULE_PERMISSIONS) {
    try {
      await db.insert(permisos).values({
        codigo: permiso.codigo,
        nombre: permiso.nombre,
        modulo: permiso.modulo,
        accion: permiso.accion,
        descripcion: permiso.descripcion,
      }).onConflictDoNothing();
      inserted++;
    } catch {
      // ya existe
    }
  }
  console.log(`  ${inserted} permisos procesados\n`);

  // Paso 2: Asignar nuevos permisos a roles
  console.log('Paso 2: Asignando permisos a roles...');
  let asignaciones = 0;
  for (const [rol, codigos] of Object.entries(ROLE_PERMISSIONS)) {
    for (const codigo of codigos) {
      const [permiso] = await db.select().from(permisos).where(eq(permisos.codigo, codigo));
      if (permiso) {
        try {
          await db.insert(rolesPermisos).values({ rol, permisoId: permiso.id }).onConflictDoNothing();
          asignaciones++;
        } catch {
          // ya existe
        }
      }
    }
  }
  console.log(`  ${asignaciones} asignaciones creadas\n`);

  // Paso 3: Eliminar asignaciones viejas
  console.log('Paso 3: Eliminando permisos de módulos viejos...');
  const oldPermisos = await db.select().from(permisos).where(inArray(permisos.modulo, OLD_MODULES));
  let oldDeleted = 0;
  for (const oldP of oldPermisos) {
    await db.delete(rolesPermisos).where(eq(rolesPermisos.permisoId, oldP.id));
    oldDeleted++;
  }
  console.log(`  ${oldDeleted} asignaciones viejas eliminadas\n`);

  // Paso 4: Eliminar permisos viejos
  console.log('Paso 4: Eliminando entradas de módulos viejos...');
  const deleted = await db.delete(permisos).where(inArray(permisos.modulo, OLD_MODULES));
  console.log(`  Permisos eliminados\n`);

  console.log('✅ Migración completada');
  console.log(`   Nuevos permisos: ${ALL_MODULE_PERMISSIONS.length}`);
  console.log(`   Módulos activos: ${[...new Set(ALL_MODULE_PERMISSIONS.map(p => p.modulo))].join(', ')}`);
}

migrate().catch(console.error);
