# Tasks — Gestión de Proyecto Formativo por Ficha

## Schema BD
- [ ] Eliminar `porcentajeHorasDirectas` de `competencias`.
- [ ] Crear `proyectosFormativos` (id, fichaId UNIQUE, porcentajeEjecucionDirecta, createdAt, updatedAt).
- [ ] Crear `proyectoEtapasRaps` (id, proyectoFormativoId, etapa, resultadoId, UNIQUE proyecto+etapa+resultado).

## API
- [ ] GET `/api/fichas/:id/proyecto-formativo` — obtener proyecto de ficha.
- [ ] POST `/api/fichas/:id/proyecto-formativo` — crear/actualizar proyecto.
- [ ] PUT `/api/proyectos-formativos/:id/porcentaje` — actualizar solo %.
- [ ] GET `/api/proyectos-formativos/:id/etapas` — obtener asignaciones.
- [ ] POST `/api/proyectos-formativos/:id/etapas` — guardar asignaciones de una etapa.

## Ruteo
- [ ] Agregar ruta `/fichas/:fichaId/proyecto-formativo` en App.tsx (fuera del sidebar).
- [ ] Importar `ProyectoFormativoView` lazy o directo.

## ProyectoFormativoView
- [ ] Crear componente con header contextual (ficha + programa).
- [ ] Selector de % ejecución directa con guardado.
- [ ] Pestañas de etapas (Analisis, Planeación, Ejecución, Evaluación, Complementario).
- [ ] Matriz de RAPs: competencias → RAPs con checkbox por etapa activa.
- [ ] Botón "Guardar Asignación" que envía RAPs seleccionados para la etapa.

## FichasView
- [ ] Botón "Proyecto" con icono FileText en el footer de cada card.
- [ ] Botón "Proyecto" en la columna de acciones de la tabla.

## CurriculoModal
- [ ] Eliminar el `<select>` de % ejecución directa del formulario de crear competencia.
- [ ] Eliminar el `<select>` del inline edit form.
- [ ] Eliminar el estado `compPorcentajeDirectas`.
- [ ] Eliminar `porcentajeHorasDirectas` del body de los fetch PUT/POST.
- [ ] Eliminar el span de horas directas en la fila de resultado.

## ProgramacionView
- [ ] Cargar proyecto formativo al seleccionar ficha.
- [ ] Leer `porcentajeEjecucionDirecta` del proyecto en vez de `selectedComp.porcentajeHorasDirectas`.

## Seed
- [ ] Eliminar `porcentajeHorasDirectas` de inserción de competencias.
- [ ] Insertar `proyectos_formativos` para cada ficha.
- [ ] Insertar `proyecto_etapas_raps` según fase de cada RA.

## Verificación
- [ ] `npm run lint` sin errores nuevos.
- [ ] `npm run db:push` aplica cambios.
- [ ] Commit + deploy sync + push.
