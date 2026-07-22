# Plan — Rediseño del Módulo de Programación de Instructores

## Estrategia técnica

Backend-first. Se modifica el schema, luego los endpoints, y finalmente se rediseña la UI. La migración de datos existentes se ejecuta una sola vez al aplicar el schema nuevo.

## Fase 1: Schema de base de datos

### 1.1 Tabla `instructores` — añadir centro

```diff
export const instructores = sqliteTable('instructores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  documento: text('documento').notNull().unique(),
  nombres: text('nombres').notNull(),
  apellidos: text('apellidos').notNull(),
  tipoVinculacion: text('tipo_vinculacion').notNull(),
  requisitosAcademicos: text('requisitos_academicos', { mode: 'json' }),
+ centroFormacionId: integer('centro_formacion_id').notNull().references(() => centrosFormacion.id),
  estado: text('estado').notNull().default('ACTIVO'),
});
```

> Si la tabla ya tiene datos, `npm run db:push` pedirá un valor default para la columna nueva. Se usará `1` (primer centro de la tabla) o se hace un script de migración si hay datos.

### 1.2 Refactor `programacion_instructores` (cabecera)

```diff
export const programacionInstructores = sqliteTable('programacion_instructores', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  programaId: integer('programa_id').notNull().references(() => programas.id),
  fichaId: integer('ficha_id').notNull().references(() => fichas.id),
  competenciaId: integer('competencia_id').notNull().references(() => competencias.id),
  instructorId: integer('instructor_id').notNull().references(() => instructores.id),
  resultadosIds: text('resultados_ids', { mode: 'json' }).notNull(),
- eventos: text('eventos', { mode: 'json' }),
+ estado: text('estado').notNull().default('PLANIFICADO'), // PLANIFICADO | EJECUTADO | CANCELADO
+ createdAt: text('created_at').notNull().default("datetime('now')"),
+ updatedAt: text('updated_at').notNull().default("datetime('now')"),
}, (t) => ({
+ unq: unique().on(t.fichaId, t.competenciaId, t.instructorId),
}));
```

### 1.3 Nueva tabla `programacion_eventos` (detalle)

```typescript
export const programacionEventos = sqliteTable('programacion_eventos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  programacionId: integer('programacion_id').notNull().references(() => programacionInstructores.id, { onDelete: 'cascade' }),
  fecha: text('fecha').notNull(),              // YYYY-MM-DD
  horaInicio: integer('hora_inicio').notNull(), // Entero 6-22 (hora de inicio del slot)
  resultadoId: integer('resultado_id').notNull().references(() => resultadosAprendizaje.id),
  instructorId: integer('instructor_id').notNull().references(() => instructores.id),
  ambienteId: integer('ambiente_id').notNull().references(() => ambientes.id),
  estado: text('estado').notNull().default('PLANIFICADO'), // PLANIFICADO | EJECUTADO | CANCELADO
  createdAt: text('created_at').notNull().default("datetime('now')"),
  updatedAt: text('updated_at').notNull().default("datetime('now')"),
}, (t) => ({
  unqInstructor: unique().on(t.fecha, t.horaInicio, t.instructorId),  // Evita doble asignación de instructor
  unqAmbiente: unique().on(t.fecha, t.horaInicio, t.ambienteId),      // Evita doble reserva de ambiente
}));
```

### 1.4 Migración de datos existentes

Script `scripts/migrate-programacion-eventos.ts` que:
1. Lee todas las filas de `programacion_instructores` que tengan `eventos` no nulo (antes de aplicar el push que elimina la columna).
2. Parsea el JSON `{ [date]: { [hora]: resultadoId } }`.
3. Para cada celda, crea una fila en `programacion_eventos` con instructor/ambiente de la ficha asociada.
4. Si no hay datos existentes (fresh install), el script no hace nada — safe no-op.
5. El script debe correr ANTES de `db:push` para preservar datos.

> **Secuencia**: 1. Ejecutar script de migración → 2. `npm run db:push` (aplica schema nuevo) → 3. `npm run seed` (idempotente).

## Fase 2: API (server.ts)

### 2.1 Programación Instructores (cabecera)

Remplazar los endpoints actuales:

| Endpoint | Método | Comportamiento |
|---|---|---|
| `/api/programacion-instructores` | GET | Lista todas, con filtros opcionales `?fichaId=&instructorId=`. Incluye `_count` de eventos. |
| `/api/programacion-instructores` | POST | **Upsert**: si existe (ficha+competencia+instructor) actualiza `resultados_ids` y `estado`; si no, crea. Retorna la fila. |
| `/api/programacion-instructores/:id` | PUT | Actualiza `resultados_ids` o `estado`. |
| `/api/programacion-instructores/:id` | DELETE | Elimina la cabecera; eventos cascade-delete por FK. |
| `/api/programacion-instructores/ficha/:fichaId` | DELETE | Elimina todas las cabeceras de la ficha (cascadea eventos). Reemplaza el endpoint actual. |

Todos con `requirePermission('programacion.editar')` o `('programacion.crear')` según corresponda.

### 2.2 Programación Eventos (detalle)

| Endpoint | Método | Comportamiento |
|---|---|---|
| `/api/programacion-eventos` | GET | Filtros: `?fichaId=&fecha=&instructorId=&programacionId=`. Join con resultados, instructores, ambientes para entregar datos completos. |
| `/api/programacion-eventos` | POST | **Bulk**: body `{ programacionId, eventos: [{fecha, horaInicio, resultadoId, instructorId, ambienteId}] }`. Valida cada evento (conflictos, rango ficha, horario ficha) en una transacción atómica. Si cualquier evento falla, rollback. |
| `/api/programacion-eventos/:id` | PUT | Actualiza `estado`, `resultadoId` o `instructorId` de un evento individual. |
| `/api/programacion-eventos/:id` | DELETE | Elimina un evento individual. |
| `/api/programacion-eventos/ficha/:fichaId` | GET | Lista todos los eventos de una ficha agrupados por fecha → hora. Optimiza el renderizado del calendario. |

Validaciones server-side en POST bulk:
- `fecha` dentro de `[ficha.fechaInicio, ficha.fechaFinLectiva]`.
- `horaInicio` en el horario de la ficha para ese día de la semana (`fichas.horario[dia][]`).
- `resultadoId` pertenece a la `competenciaId` de la programación.
- `instructorId` pertenece al centro de la ficha (`instructores.centroFormacionId === fichas.centroFormacionId`).
- No existe conflicto UNIQUE(fecha, hora_inicio, instructor_id) — devuelve lista de conflictos.
- No existe conflicto UNIQUE(fecha, hora_inicio, ambiente_id).
- Si hay conflicto con eventos existentes, se incluye el detalle en el error 409.

### 2.3 Endpoint de disponibilidad

| Endpoint | Método | Comportamiento |
|---|---|---|
| `/api/disponibilidad/instructor/:id` | GET | Query: `?fecha=&hora=&fichaId=` (excluir eventos de esta ficha). Retorna `{ disponible: bool, conflictos: [{ eventoId, fichaNumero, programaNombre, estado }] }` |
| `/api/disponibilidad/ambiente/:id` | GET | Misma interfaz para ambiente. |

### 2.4 Instructores — modificar endpoints existentes

- `GET /api/instructores` — añadir filtro `?centroId=` y siempre incluir `centroFormacionId` en la respuesta.
- `POST /api/instructores` — aceptar `centroFormacionId` en el body.
- `PUT /api/instructores/:id` — permitir actualizar `centroFormacionId`.

## Fase 3: Frontend — Instructores (módulo afectado)

### 3.1 `InstructoresView.tsx`

Añadir selector de centro de formación al formulario de creación/edición:
- Un `SearchableSelect` para regional (opcional, solo filtro).
- Un `SearchableSelect` para centro de formación (obligatorio, FK).
- Si se selecciona regional, el selector de centro se filtra en cascada.

### 3.2 `ProgramacionInstructoresView.tsx` — rediseño completo

Reemplazar el componente actual (~586 líneas) por uno nuevo con mejor arquitectura:

**Estado del componente:**
```
selectedFichaId, selectedCompetenciaId, selectedInstructorId,
selectedResultadosIds: number[],
calendarioMes: "YYYY-MM" o semana actual,
eventosCache: ProgramacionEvento[],       // eventos cargados para la ficha
conflictosCache: ConflictInfo[],           // conflictos detectados al seleccionar celdas
panelRAstate: { resultadoId, asignadas, requeridas }[]
```

**Flujo de selección (wizard ficha-first):**
1. `SearchableSelect` Regional (filtro opcional).
2. `SearchableSelect` Centro (filtrado por regional, en cascada).
3. `SearchableSelect` Ficha (filtrado por centro; muestra: numero_ficha + programa + modalidad badge).
4. Al seleccionar ficha: auto-carga programa, centro, ambiente y `horario` JSON.
5. `SearchableSelect` Competencia (de las del programa de la ficha).
6. `SearchableSelect` Instructor (filtrado por centro de la ficha y perfiles compatibles con la competencia; muestra nombres + disponibilidad badge).
7. Selector de RAs (checkbox o multi-select de las RAs de la competencia).

**Calendario:**
- Mismo patrón de drag-select rectangular que `FichasView.tsx` horario editor.
- Vista mensual: columnas = días del mes que coinciden con el día de la semana definido en `fichas.horario`; filas = horas definidas en `fichas.horario`.
- Celdas vacías (dentro del horario): seleccionables por arrastre.
- Celdas ocupadas: color por estado (azul=PLANIFICADO, verde=EJECUTADO, rojo=CANCELADO, gris-translúcido=CANCELADO). Muestra iniciales instructor + código RA. Hover → tooltip con detalle completo.
- Click en celda ocupada → modal de detalle (editar estado, cambiar RA, eliminar).

**Drag-select y asignación:**
- Mousedown en celda vacía → inicia selección. Mouseenter → extiende rectángulo. Mouseup → confirma.
- Al soltar, verifica disponibilidad del instructor y ambiente para cada celda seleccionada (batch de llamadas al endpoint de disponibilidad o validación client-side con `eventosCache`).
- Si hay conflictos: marca celdas en ámbar, muestra banner "N conflictos detectados" y no permite guardar hasta resolver.
- Si no hay conflictos: celdas marcadas en indigo (borrador), asigna RA seleccionado del panel lateral.

**Panel lateral de RAs:**
- Lista de RAs seleccionados con progreso horizontal: `asignadas / requeridas` horas directas.
- Click en un RA → lo selecciona como "RA activo" para el siguiente drag-select.
- El presupuesto de horas se calcula SOLO con eventos de esta ficha (no global).

**Guardar:**
- Botón "Guardar" → POST bulk a `/api/programacion-eventos` con todos los eventos del borrador.
- Si el instructor no tiene programación_instructores (cabecera), se crea con upsert automáticamente.
- ConfirmDialog antes de guardar cambios que afecten eventos existentes.

**Limpiar:**
- "Limpiar Todo" → ConfirmDialog con conteo → DELETE `/api/programacion-instructores/ficha/:fichaId`.
- "Limpiar celda" → click en ✕ de celda ocupada → DELETE `/api/programacion-eventos/:id` individual.

**Navegación de mes:**
- Botones anterior/siguiente + `<input type="month">`.
- Al cambiar de mes, recargar eventos de la ficha para ese rango de fechas.

### Archivos a modificar/crear

| Archivo | Cambio |
|---|---|
| `src/db/schema.ts` | Add `centroFormacionId` a instructores. Refactor `programacionInstructores`. Add `programacionEventos`. |
| `scripts/migrate-programacion-eventos.ts` | **Crear** — migrar JSON eventos a filas individuales. |
| `server.ts` | Refactor endpoints de programacion-instructores. Add endpoints de programacion-eventos. Add endpoints de disponibilidad. Add `centroId` a endpoints de instructores. |
| `src/components/InstructoresView.tsx` | Add selector centroFormacion al formulario. |
| `src/components/ProgramacionInstructoresView.tsx` | Rediseño completo. |
| `seed.ts` | Actualizar seed de instructores con `centroFormacionId`. |

### Lo que NO cambia

- Permisos de programación (`ver/crear/editar/eliminar`) — mismos 4, ya registrados.
- `FichasView.tsx` — no se modifica (solo se reutiliza su patrón de drag-select).
- `CurriculoModal.tsx` — no se modifica.
- Sistema de auth/permisos — no se modifica.
- Tablas de permisos, roles, usuarios — no se modifican.
- `src/modules/programacion/permissions.ts` — sin cambios.