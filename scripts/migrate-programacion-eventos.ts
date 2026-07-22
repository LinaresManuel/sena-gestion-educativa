/**
 * Migración: programacion_instructores.eventos (JSON blob) → programacion_eventos (filas individuales)
 *
 * Debe ejecutarse ANTES de `npm run db:push` en el deploy (donde aún existe la columna `eventos`).
 * En una instalación limpia (sin datos), es un no-op seguro.
 *
 * Secuencia de despliegue:
 *   1. npm run tsx scripts/migrate-programacion-eventos.ts   ← este script
 *   2. npm run db:push                                         ← aplica schema nuevo (elimina `eventos`)
 *   3. npm run seed                                            ← idempotente
 */
import Database from 'better-sqlite3';
import { config } from '../src/config.ts';

const sqlite = new Database(config.DATABASE_URL);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

function columnExists(table: string, column: string): boolean {
  const rows = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return rows.some(r => r.name === column);
}

function tableExists(table: string): boolean {
  const row = sqlite.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table) as { name: string } | undefined;
  return !!row;
}

function main() {
  console.log('=== Migración programacion_eventos ===');

  // ── Paso 1: Asegurar columna centro_formacion_id en instructores ──
  if (!columnExists('instructores', 'centro_formacion_id')) {
    console.log('  Añadiendo columna centro_formacion_id a instructores (default 1)...');
    sqlite.exec(`ALTER TABLE instructores ADD COLUMN centro_formacion_id INTEGER NOT NULL DEFAULT 1 REFERENCES centros_formacion(id);`);
    console.log('  → Columna añadida. Los instructores existentes quedan con centro 1.');
    console.log('  → Revisa y actualiza manualmente los centros desde el módulo de instructores.');
  } else {
    console.log('  ✓ La columna centro_formacion_id ya existe en instructores.');
  }

  // ── Paso 2: Asegurar columnas nuevas en programacion_instructores ──
  const colsProgramacion: string[] = [];
  if (!columnExists('programacion_instructores', 'estado')) {
    colsProgramacion.push(`ALTER TABLE programacion_instructores ADD COLUMN estado TEXT NOT NULL DEFAULT 'PLANIFICADO';`);
  }
  if (!columnExists('programacion_instructores', 'created_at')) {
    colsProgramacion.push(`ALTER TABLE programacion_instructores ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'));`);
  }
  if (!columnExists('programacion_instructores', 'updated_at')) {
    colsProgramacion.push(`ALTER TABLE programacion_instructores ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));`);
  }
  if (colsProgramacion.length > 0) {
    console.log('  Añadiendo columnas nuevas a programacion_instructores...');
    for (const stmt of colsProgramacion) sqlite.exec(stmt);
  } else {
    console.log('  ✓ Las columnas nuevas ya existen en programacion_instructores.');
  }

  // ── Paso 3: Crear tabla programacion_eventos si no existe ──
  if (!tableExists('programacion_eventos')) {
    console.log('  Creando tabla programacion_eventos...');
    sqlite.exec(`
      CREATE TABLE programacion_eventos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        programacion_id INTEGER NOT NULL REFERENCES programacion_instructores(id) ON DELETE CASCADE,
        fecha TEXT NOT NULL,
        hora_inicio INTEGER NOT NULL,
        resultado_id INTEGER NOT NULL REFERENCES resultados_aprendizaje(id),
        instructor_id INTEGER NOT NULL REFERENCES instructores(id),
        ambiente_id INTEGER NOT NULL REFERENCES ambientes(id),
        estado TEXT NOT NULL DEFAULT 'PLANIFICADO',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(fecha, hora_inicio, instructor_id),
        UNIQUE(fecha, hora_inicio, ambiente_id)
      );
    `);
    console.log('  → Tabla creada.');
  } else {
    console.log('  ✓ La tabla programacion_eventos ya existe.');
  }

  // ── Paso 4: Migrar datos de eventos JSON a filas individuales ──
  if (!columnExists('programacion_instructores', 'eventos')) {
    console.log('  ✓ La columna eventos ya no existe. No hay datos que migrar.');
    console.log('=== Migración completada (no-op) ===');
    sqlite.close();
    return;
  }

  console.log('  Migrando datos desde eventos JSON...');

  type ProgramacionRow = {
    id: number;
    instructor_id: number;
    ficha_id: number;
    eventos: string | null;
  };

  const rows = sqlite.prepare(`SELECT id, instructor_id, ficha_id, eventos FROM programacion_instructores WHERE eventos IS NOT NULL`)
    .all() as ProgramacionRow[];

  if (rows.length === 0) {
    console.log('  ✓ No hay programaciones con eventos. Nada que migrar.');
    console.log('=== Migración completada (no-op) ===');
    sqlite.close();
    return;
  }

  type FichaRow = { ambiente_id: number };
  const fichaCache = new Map<number, number>();
  function getAmbienteId(fichaId: number): number {
    if (fichaCache.has(fichaId)) return fichaCache.get(fichaId)!;
    const ficha = sqlite.prepare(`SELECT ambiente_id FROM fichas WHERE id = ?`).get(fichaId) as FichaRow | undefined;
    const ambienteId = ficha?.ambiente_id ?? 0;
    fichaCache.set(fichaId, ambienteId);
    return ambienteId;
  }

  const insertEvento = sqlite.prepare(`
    INSERT OR IGNORE INTO programacion_eventos (programacion_id, fecha, hora_inicio, resultado_id, instructor_id, ambiente_id, estado)
    VALUES (?, ?, ?, ?, ?, ?, 'PLANIFICADO')
  `);

  let totalMigrated = 0;
  let totalSkipped = 0;

  const migrateTx = sqlite.transaction(() => {
    for (const p of rows) {
      let eventos: Record<string, Record<string, number>>;
      try {
        eventos = typeof p.eventos === 'string' ? JSON.parse(p.eventos) : (p.eventos as any);
      } catch {
        console.log(`  ⚠ No se pudo parsear eventos de programacion ${p.id}, saltando...`);
        totalSkipped++;
        continue;
      }

      if (!eventos || typeof eventos !== 'object') {
        totalSkipped++;
        continue;
      }

      const ambienteId = getAmbienteId(p.ficha_id);
      if (ambienteId === 0) {
        console.log(`  ⚠ Ficha ${p.ficha_id} no tiene ambiente, saltando programacion ${p.id}...`);
        totalSkipped++;
        continue;
      }

      for (const [dateStr, hours] of Object.entries(eventos)) {
        if (!hours || typeof hours !== 'object') continue;
        for (const [hr, resultadoId] of Object.entries(hours)) {
          const horaInicio = parseInt(hr.split('-')[0], 10);
          if (isNaN(horaInicio)) {
            console.log(`  ⚠ Hora inválida '${hr}' en programacion ${p.id}, saltando...`);
            continue;
          }
          const result = insertEvento.run(p.id, dateStr, horaInicio, Number(resultadoId), p.instructor_id, ambienteId);
          totalMigrated += result.changes;
        }
      }
    }
  });

  migrateTx();

  console.log(`  → ${totalMigrated} eventos migrados, ${totalSkipped} programaciones saltadas.`);
  console.log('  → Ahora ejecuta: npm run db:push  (eliminará la columna eventos y sincronizará constraints)');
  console.log('=== Migración completada ===');
  sqlite.close();
}

main();