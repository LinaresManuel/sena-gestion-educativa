import { db } from '../src/db/index.ts';
import { permisos } from '../src/db/schema.ts';
import { PERFILES_ACADEMICOS_PERMISSIONS } from '../src/modules/perfiles_academicos/permissions.ts';

async function main() {
  const existing = await db.select().from(permisos);
  let count = 0;
  for (const p of PERFILES_ACADEMICOS_PERMISSIONS) {
    const found = existing.find(e => e.codigo === p.codigo);
    if (!found) {
      await db.insert(permisos).values({
        codigo: p.codigo,
        nombre: p.nombre,
        modulo: p.modulo,
        accion: p.accion,
        descripcion: p.descripcion ?? '',
      });
      count++;
    }
  }
  console.log(`${count} permisos de perfiles_academicos insertados.`);
}

main().catch(console.error);
