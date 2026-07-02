import { db } from './src/db/index.ts';
import { usuarios } from './src/db/schema.ts';

async function listUsers() {
  const users = await db.select().from(usuarios);
  console.log('\n=== USUARIOS EN EL SISTEMA ===\n');
  console.log('ID | Username | Nombre | Rol | Activo | Debe cambiar password');
  console.log('-'.repeat(70));
  users.forEach(u => {
    console.log(`${u.id} | ${u.username} | ${u.nombre} | ${u.rol} | ${u.activo ? 'Sí' : 'No'} | ${u.debeCambiarPassword ? 'Sí' : 'No'}`);
  });
  console.log(`\nTotal: ${users.length} usuario(s)\n`);
}

listUsers().catch(console.error);
