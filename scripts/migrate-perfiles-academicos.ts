import { db } from '../src/db/index.ts';
import { perfilesInstructor, perfilesAcademicos, competenciasPerfiles, instructoresPerfiles, instructores } from '../src/db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';

async function migrate() {
  console.log('=== Migración: Perfiles Académicos ===\n');

  // 1. Extraer todos los nombres de perfil desde perfiles_instructor E instructores.requisitosAcademicos
  console.log('1. Colectando perfiles desde perfiles_instructor e instructores...');
  const oldPerfiles = await db.select().from(perfilesInstructor);
  const allInstructors = await db.select().from(instructores);
  console.log(`   → ${oldPerfiles.length} registros en perfiles_instructor`);
  console.log(`   → ${allInstructors.length} instructores`);

  // Extraer codigo+nombre únicos desde perfiles_instructor
  const uniqueMap = new Map<string, { codigo: string; nombre: string }>();
  for (const p of oldPerfiles) {
    const key = p.codigo;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, { codigo: p.codigo, nombre: p.nombre });
    }
  }

  // Extraer nombres desde instructores.requisitosAcademicos (usar codigo=nombre si no existe en perfiles)
  for (const inst of allInstructors) {
    const reqs = inst.requisitosAcademicos as string[] | null;
    if (!reqs || !Array.isArray(reqs)) continue;
    for (const perfilNombre of reqs) {
      const key = perfilNombre; // usamos nombre como codigo si no hay match
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, { codigo: perfilNombre.substring(0, 10), nombre: perfilNombre });
      }
    }
  }

  let insertedCount = 0;
  for (const [, perfil] of uniqueMap) {
    // Verificar si ya existe (idempotente)
    const existing = await db.select().from(perfilesAcademicos)
      .where(eq(perfilesAcademicos.codigo, perfil.codigo))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(perfilesAcademicos).values({
        codigo: perfil.codigo,
        nombre: perfil.nombre,
      });
      insertedCount++;
    }
  }
  console.log(`   → ${insertedCount} nuevos perfiles académicos insertados`);

  // 2. Migrar relaciones competencia ↔ perfil
  console.log('\n2. Migrando relaciones competencia ↔ perfil...');
  let vinculados = 0;
  for (const p of oldPerfiles) {
    const pa = await db.select().from(perfilesAcademicos)
      .where(eq(perfilesAcademicos.codigo, p.codigo))
      .limit(1);

    if (pa.length === 0) continue;

    // Verificar si ya existe la relación
    const existing = await db.select().from(competenciasPerfiles)
      .where(and(
        eq(competenciasPerfiles.competenciaId, p.competenciaId),
        eq(competenciasPerfiles.perfilAcademicoId, pa[0].id),
      ))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(competenciasPerfiles).values({
        competenciaId: p.competenciaId,
        perfilAcademicoId: pa[0].id,
      });
      vinculados++;
    }
  }
  console.log(`   → ${vinculados} relaciones competencia ↔ perfil creadas`);

  // 3. Migrar instructores.requisitosAcademicos → instructores_perfiles
  console.log('\n3. Migrando requisitos académicos de instructores...');
  let asignados = 0;

  for (const inst of allInstructors) {
    const reqs = inst.requisitosAcademicos as string[] | null;
    if (!reqs || !Array.isArray(reqs) || reqs.length === 0) continue;

    for (const perfilNombre of reqs) {
      // Buscar perfil académico por nombre (o codigo si es el mismo)
      const pa = await db.select().from(perfilesAcademicos)
        .where(eq(perfilesAcademicos.nombre, perfilNombre))
        .limit(1);

      if (pa.length === 0) {
        console.log(`   ⚠ Perfil "${perfilNombre}" no encontrado en perfiles_academicos (instructor ${inst.documento})`);
        continue;
      }

      // Verificar si ya existe la relación
      const existing = await db.select().from(instructoresPerfiles)
        .where(and(
          eq(instructoresPerfiles.instructorId, inst.id),
          eq(instructoresPerfiles.perfilAcademicoId, pa[0].id),
        ))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(instructoresPerfiles).values({
          instructorId: inst.id,
          perfilAcademicoId: pa[0].id,
        });
        asignados++;
      }
    }
  }
  console.log(`   → ${asignados} asignaciones instructor ↔ perfil creadas`);

  const totalPa = (await db.select().from(perfilesAcademicos)).length;
  const totalCp = (await db.select().from(competenciasPerfiles)).length;
  const totalIp = (await db.select().from(instructoresPerfiles)).length;

  console.log('\n=== Resumen ===');
  console.log(`  perfiles_academicos:    ${totalPa}`);
  console.log(`  competencias_perfiles:   ${totalCp}`);
  console.log(`  instructores_perfiles:   ${totalIp}`);
  console.log('\n✅ Migración completada.');
}

migrate().catch(console.error);
