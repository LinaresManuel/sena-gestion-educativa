/**
 * Script de verificación del sistema de permisos
 * Ejecutar con: npx tsx scripts/verify-permissions.ts
 * 
 * Verifica:
 * 1. Que los permisos se crearon correctamente
 * 2. Que los roles tienen permisos asignados
 * 3. Que los usuarios tienen roles asignados
 */

import { db } from '../src/db';
import { permisos, rolesPermisos, usuariosRoles, usuarios } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function verify() {
  console.log('🔍 Verificando sistema de permisos...\n');

  // Verificar permisos
  const allPermisos = await db.select().from(permisos);
  console.log(`📋 Permisos en BD: ${allPermisos.length}`);
  
  if (allPermisos.length === 0) {
    console.log('  ❌ No hay permisos en la base de datos');
    return;
  }
  
  // Verificar permisos por módulo
  const permisosByModule = allPermisos.reduce((acc, p) => {
    acc[p.modulo] = (acc[p.modulo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('  Permisos por módulo:');
  Object.entries(permisosByModule).forEach(([modulo, count]) => {
    console.log(`    ${modulo}: ${count}`);
  });

  // Verificar roles
  const uniqueRoles = await db.selectDistinct({ rol: rolesPermisos.rol }).from(rolesPermisos);
  console.log(`\n👥 Roles con permisos: ${uniqueRoles.length}`);
  
  for (const { rol } of uniqueRoles) {
    const rolPermisos = await db.select().from(rolesPermisos).where(eq(rolesPermisos.rol, rol));
    console.log(`  ${rol}: ${rolPermisos.length} permisos`);
  }

  // Verificar usuarios
  const allUsuarios = await db.select().from(usuarios);
  console.log(`\n🧑‍💼 Usuarios: ${allUsuarios.length}`);
  
  for (const usuario of allUsuarios) {
    const userRoles = await db.select().from(usuariosRoles).where(eq(usuariosRoles.usuarioId, usuario.id));
    const roles = userRoles.map(r => r.rol);
    console.log(`  ${usuario.username}: roles = [${roles.join(', ')}]`);
    
    // Verificar que admin tiene todos los permisos
    if (roles.includes('admin')) {
      const adminPermisos = await db.select().from(rolesPermisos).where(eq(rolesPermisos.rol, 'admin'));
      if (adminPermisos.length === allPermisos.length) {
        console.log(`    ✅ Admin tiene todos los permisos (${adminPermisos.length}/${allPermisos.length})`);
      } else {
        console.log(`    ❌ Admin tiene ${adminPermisos.length}/${allPermisos.length} permisos`);
      }
    }
  }

  console.log('\n✅ Verificación completada');
}

verify().catch(console.error);
