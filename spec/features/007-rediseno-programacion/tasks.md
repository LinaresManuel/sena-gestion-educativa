# Tasks — Rediseño del Módulo de Programación de Instructores

## Fase 1: Schema de base de datos

- [x] 1.1 Añadir `centroFormacionId: integer('centro_formacion_id').notNull().references(() => centrosFormacion.id)` a tabla `instructores` en `src/db/schema.ts`
- [x] 1.2 Refactorizar `programacionInstructores`: eliminar campo `eventos`, añadir `estado` (default 'PLANIFICADO'), `createdAt`, `updatedAt`, y constraint `unique().on(t.fichaId, t.competenciaId, t.instructorId)`
- [x] 1.3 Crear tabla `programacionEventos` con campos: id, programacionId (FK CASCADE), fecha, horaInicio, resultadoId (FK), instructorId (FK), ambienteId (FK), estado, createdAt, updatedAt
- [x] 1.4 Añadir constraints UNIQUE en `programacionEventos`: `unique().on(t.fecha, t.horaInicio, t.instructorId)` y `unique().on(t.fecha, t.horaInicio, t.ambienteId)`
- [x] 1.5 Actualizar `src/db/index.ts` exports para incluir `programacionEventos`

## Fase 2: Migración de datos existentes

- [x] 2.1 Crear `scripts/migrate-programacion-eventos.ts` que lea `programacion_instructores.eventos` JSON y cree filas en `programacion_eventos`
- [x] 2.2 El script debe ser safe no-op si no hay datos (fresh install)
- [x] 2.3 El script debe asignar `instructorId` y `ambienteId` desde la ficha/programacion asociada
- [x] 2.4 El script asigna `centroFormacionId=1` (primer centro) a instructores existentes como default
- [x] 2.5 Documentar secuencia de ejecución: script migración → `npm run db:push` → `npm run seed`

## Fase 3: API — Programación Instructores (cabecera)

- [x] 3.1 Refactorizar `GET /api/programacion-instructores` para soportar filtros `?fichaId=&instructorId=` e incluir conteo de eventos
- [x] 3.2 Implementar upsert en `POST /api/programacion-instructores`: si existe (ficha+competencia+instructor) actualiza `resultados_ids` y `estado`, si no crea
- [x] 3.3 Implementar `PUT /api/programacion-instructores/:id` para actualizar `resultados_ids` o `estado`
- [x] 3.4 Refactorizar `DELETE /api/programacion-instructores/:id` (cascadea eventos por FK)
- [x] 3.5 Refactorizar `DELETE /api/programacion-instructores/ficha/:fichaId` (cascadea cabeceras y eventos)
- [ ] 3.6 Eliminar el endpoint `POST /api/programacion-instructores/limpiar-celda` (reemplazado por DELETE de evento individual)
- [x] 3.7 Añadir `requirePermission('programacion.ver|crear|editar|eliminar')` a todos los endpoints

## Fase 4: API — Programación Eventos (detalle)

- [x] 4.1 Implementar `GET /api/programacion-eventos` con filtros `?fichaId=&fecha=&instructorId=&programacionId=` y JOIN con resultados, instructores, ambientes
- [x] 4.2 Implementar `GET /api/programacion-eventos/ficha/:fichaId` que retorna eventos agrupados por fecha → hora (optimiza render del calendario)
- [x] 4.3 Implementar `POST /api/programacion-eventos` bulk: body `{ programacionId, eventos: [...] }`. Transacción atómica con rollback si cualquier evento falla
- [x] 4.4 Validación server-side en POST bulk: fecha dentro de rango lectivo de ficha
- [x] 4.5 Validación server-side: horaInicio en horario definido de ficha para ese día de la semana
- [x] 4.6 Validación server-side: resultadoId pertenece a la competencia de la programacion
- [x] 4.7 Validación server-side: instructorId pertenece al centro de la ficha (`instructores.centroFormacionId === fichas.centroFormacionId`)
- [x] 4.8 Validación server-side: no conflicto UNIQUE(fecha, hora_inicio, instructor_id) — devolver lista de conflictos
- [x] 4.9 Validación server-side: no conflicto UNIQUE(fecha, hora_inicio, ambiente_id)
- [x] 4.10 Implementar `PUT /api/programacion-eventos/:id` (cambiar estado, resultadoId o instructorId con re-validación de conflictos)
- [x] 4.11 Implementar `DELETE /api/programacion-eventos/:id` (elimina evento individual)
- [x] 4.12 Añadir `requirePermission('programacion.ver|crear|editar|eliminar')` a todos los endpoints de eventos

## Fase 5: API — Disponibilidad

- [x] 5.1 Implementar `GET /api/disponibilidad/instructor/:id?fecha=&hora=&fichaId=` → `{ disponible: bool, conflictos: [{ eventoId, fichaNumero, programaNombre, estado }] }` (excluye eventos de fichaId para no auto-bloquear)
- [x] 5.2 Implementar `GET /api/disponibilidad/ambiente/:id?fecha=&hora=&fichaId=` → misma interfaz para ambiente

## Fase 6: API — Instructores (módulo afectado)

- [x] 6.1 Modificar `GET /api/instructores` para incluir `centroFormacionId` y `centroNombre` en la respuesta
- [x] 6.2 Añadir filtro `?centroId=` al `GET /api/instructores`
- [x] 6.3 Modificar `POST /api/instructores` para aceptar `centroFormacionId` en el body
- [x] 6.4 Modificar `PUT /api/instructores/:id` para permitir actualizar `centroFormacionId`
- [x] 6.5 Actualizar `POST/PUT` de instructores con `requirePermission('instructores.crear|editar')`

## Fase 7: Seed actualizado

- [x] 7.1 Actualizar `seed.ts`: instructores con `centroFormacionId` válido
- [x] 7.2 Verificar `npm run seed` idempotente con el nuevo schema

## Fase 8: Frontend — InstructoresView

- [x] 8.1 Añadir `centroFormacionId` al estado y tipo `Instructor` en `InstructoresView.tsx`
- [x] 8.2 Añadir `SearchableSelect` para centro de formación en el formulario de crear/editar instructor
- [ ] 8.3 Filtrar el selector de centro por regional (cascada) si se añade selector de regional
- [x] 8.4 Persistir `centroFormacionId` en POST/PUT de instructor
- [x] 8.5 Mostrar nombre del centro en la tabla/lista de instructores

## Fase 9: Frontend — ProgramacionInstructoresView (rediseño completo)

- [ ] 9.1 Definir tipos TypeScript: `ProgramacionEvento`, `ConflictInfo`, `PanelRAState`
- [ ] 9.2 Implementar wizard de selección ficha-first: `SearchableSelect` Regional → Centro → Ficha con cascada
- [ ] 9.3 Al seleccionar ficha: cargar programa, centro, ambiente, horario, competencias del programa y eventos existentes
- [ ] 9.4 Implementar `SearchableSelect` Competencia (de las del programa de la ficha)
- [ ] 9.5 Implementar `SearchableSelect` Instructor (filtrado por centro de la ficha y perfiles compatibles con la competencia; badge de disponibilidad)
- [ ] 9.6 Implementar selector de RAs (checkbox/multi-select de las RAs de la competencia seleccionada)
- [ ] 9.7 Implementar calendario con drag-select rectangular (patrón de FichasView): mousedown inicia, mouseenter extiende, mouseup confirma
- [ ] 9.8 Renderizar celdas vacías seleccionables dentro del horario de la ficha
- [ ] 9.9 Renderizar celdas ocupadas con color por estado: azul=PLANIFICADO, verde=EJECUTADO, rojo translúcido=CANCELADO
- [ ] 9.10 Mostrar en cada celda ocupada: código RA o iniciales instructor (texto compacto)
- [ ] 9.11 Implementar tooltip/hover en celda ocupada: instructor nombre, competencia, RA, ambiente, estado
- [ ] 9.12 Implementar click en celda ocupada → modal de detalle con opciones: editar estado, cambiar RA, eliminar evento
- [ ] 9.13 Implementar panel lateral de RAs: lista de RAs con progreso `asignadas / requeridas` (filtrado por ficha)
- [ ] 9.14 Click en RA del panel → lo activa como RA actual para el próximo drag-select
- [ ] 9.15 Al soltar selección drag: validar conflictos de instructor/ambiente (batch de `GET /api/disponibilidad/instructor/:id` o validación client-side con eventosCache)
- [ ] 9.16 Marcar celdas con conflicto en ámbar y mostrar banner "N conflictos"
- [ ] 9.17 Marcar celdas sin conflicto en indigo (borrador) con RA seleccionado
- [ ] 9.18 Implementar botón "Guardar" → POST bulk a `/api/programacion-eventos`. Cabecera se crea con upsert automático
- [ ] 9.19 ConfirmDialog antes de guardar cambios que afecten eventos existentes
- [ ] 9.20 Implementar botón "Limpiar Todo" → ConfirmDialog con conteo → DELETE `/api/programacion-instructores/ficha/:fichaId`
- [ ] 9.21 Implementar navegación de mes: botones anterior/siguiente + `<input type="month">`
- [ ] 9.22 Al cambiar de mes, recargar eventos de la ficha para ese rango de fechas
- [ ] 9.23 Implementar permisos UI: `mayCrear` (guardar/asignar), `mayEditar` (editar evento existente), `mayEliminar` (eliminar evento/limpiar)
- [ ] 9.24 Eliminar código muerto: `editMode` state, `mayVer` sin uso, `externoPId`

## Fase 10: Verificación y cleanup

- [x] 10.1 `npm run lint` — sin errores nuevos (ignorar errores pre-existentes en `src/components/*`)
- [ ] 10.2 Verificar que el endpoint `/api/dependencias` reporta eventos al intentar eliminar ficha/instructor/programa
- [ ] 10.3 Verificar que la migración de datos existentes funciona (si hay datos) o es safe no-op
- [ ] 10.4 Probar flujo completo: crear ficha → crear programa + competencias + RAs → crear instructor con centro → programar instructor en ficha → validar conflictos → cambiar estado → limpiar
- [ ] 10.5 Commit + deploy sync + push