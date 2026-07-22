# Rediseño del Módulo de Programación de Instructores

## Qué

Refactor completo del módulo de programación que reemplaza el modelo actual de JSON blob por una tabla normalizada de eventos (una fila por hora), añade vinculación de instructores a centros de formación, valida disponibilidad de instructor y ambiente en backend, e introduce una interfaz de calendario ágil con selección por arrastre.

### Cambios de modelo de datos

1. **Instructores vinculados a centros**: Campo `centroFormacionId` en `instructores` para saber a qué centro pertenece cada instructor y filtrarlos según la ficha seleccionada.
2. **Tabla normalizada `programacion_eventos`**: Una fila por cada hora programada, con FK a `programacion_instructores` (cabecera), `resultados_aprendizaje`, `instructores`, `ambientes`. Reemplaza el campo JSON `eventos`.
3. **Cabecera `programacion_instructores` refactorizada**: Elimina `eventos` JSON, conserva `resultados_ids`, añade `estado`, `created_at`, `updated_at`, con constraint UNIQUE(ficha_id, competencia_id, instructor_id).
4. **Estado por evento**: Campo `estado` con ciclo PLANIFICADO → EJECUTADO → CANCELADO.
5. **Constraints UNIQUE** en `programacion_eventos`:
   - `UNIQUE(fecha, hora_inicio, instructor_id)` — un instructor no puede estar en dos eventos a la misma hora.
   - `UNIQUE(fecha, hora_inicio, ambiente_id)` — un ambiente no puede tener dos eventos a la misma hora.

### Cambios de API

6. **CRUD completo de eventos**: GET/POST/PUT/DELETE con upsert, validación server-side y `requirePermission` en todos los endpoints.
7. **Endpoint de disponibilidad de instructor**: `GET /api/disponibilidad/instructor/:id` que verifica conflictos para una fecha/hora dada.
8. **Validación server-side** en todos los endpoints del módulo (rango de fechas válido, evento dentro del rango lectivo de la ficha, horas dentro del horario definido de la ficha).
9. **Assignación bulk**: POST de múltiples eventos en una sola transacción con validación atómica.

### Cambios de interfaz

10. **Flujo ficha-first**: Selector de ficha con filtros por regional/centro (reutilizando el patrón `SearchableSelect` de FichasView). Al seleccionar ficha, se cargan automáticamente el programa, centro, ambiente y horario.
11. **Selector de competencia e instructor filtrado**: Competencias del programa de la ficha; instructores del centro de la ficha y con perfil compatible con la competencia seleccionada.
12. **Calendario con selección por arrastre**: Cuadrícula semanal/mensual con drag-select rectangular idéntico al editor de horario de FichasView. Celdas vacías se asignan arrastrando; celdas ocupadas muestran color por estado e información del evento al hacer hover.
13. **Información visible en celdas ocupadas**: Cada celda ocupada muestra código de RA o iniciales del instructor y un color según estado (azul=planificado, verde=ejecutado, rojo=cancelado). Click abre modal de detalle con opción editar/eliminar.
14. **Indicadores de conflicto en tiempo real**: Al seleccionar celdas para asignar, el frontend consulta disponibilidad y marca en ámbar si el instructor o ambiente tienen conflictos.
15. **Panel de RAs pendientes**: Lista lateral con los RAs seleccionados y sus horas asignadas vs. requeridas (presupuesto de horas directas filtrado por ficha, no global).

## Para qué

El módulo actual es confuso y propenso a errores: los eventos se guardan como JSON blob sin validación de unicidad, no se puede verificar si un instructor está disponible, no hay trazabilidad de quién/hay en cada celda, y el flujo de selección no contextualiza geográficamente. El rediseño busca:

- **Eliminiar doble-reservas** de instructores y ambientes mediante constraints UNIQUE en BD y validación server-side.
- **Trazabilidad completa**: cada hora programada es una fila auditable con estado, fechas de creación/modificación e identificación de instructor/ambiente/RA.
- **UX ágil**: asignación por arrastre como ya existe en el editor de horarios de fichas, eliminando los `<select>` por celda.
- **Contexto geográfico**: filtrar instructores por el centro de la ficha seleccionada, evitando asignar instructores de otros centros.

## Criterios de aceptación (Definition of Done)

### Modelo de datos
- [ ] `instructores` tiene campo `centroFormacionId` con FK a `centros_formacion`.
- [ ] `programacion_eventos` existe con campos: id, programacion_id, fecha, hora_inicio, resultado_id, instructor_id, ambiente_id, estado, created_at, updated_at.
- [ ] `programacion_instructores` tiene `estado`, `created_at`, `updated_at`. Campo `eventos` eliminado. Constraint UNIQUE(ficha_id, competencia_id, instructor_id).
- [ ] Constraints UNIQUE en `programacion_eventos`: UNIQUE(fecha, hora_inicio, instructor_id) y UNIQUE(fecha, hora_inicio, ambiente_id).
- [ ] Migración de datos existentes: si hay programaciones con `eventos` JSON, se parsean y migran a filas individuales en `programacion_eventos`.

### Backend
- [ ] `POST /api/programacion-instructores` hace upsert (si ya existe ficha+competencia+instructor, actualiza resultados_ids en vez de duplicar).
- [ ] `PUT /api/programacion-instructores/:id` implementado.
- [ ] `CRUD /api/programacion-eventos` completo: GET (con filtros fichaId/fecha), POST (bulk), PUT (cambiar estado/RA/instructor), DELETE.
- [ ] `GET /api/disponibilidad/instructor/:id?fecha=&hora=&fichaId=` retorna `{ disponible: bool, conflictos: [{evento, ficha}] }`.
- [ ] `DELETE /api/programacion-instructores/ficha/:fichaId` elimina en cascada los eventos asociados.
- [ ] Todos los endpoints de programación usan `requirePermission`.
- [ ] Validación server-side: evento dentro de rango lectivo de ficha, hora dentro del horario definido, RA pertenece a la competencia, instructor pertenece al centro de la ficha.

### Instructores (módulo afectado)
- [ ] `InstructoresView.tsx` permite seleccionar centro de formación al crear/editar.
- [ ] `GET /api/instructores` soporta filtro `?centroId=`.
- [ ] `POST/PUT /api/instructores` persiste `centroFormacionId`.

### Frontend — Programación
- [ ] Selector de ficha con cascada regional → centro (reutiliza `SearchableSelect`).
- [ ] Selector de competencia filtrado por programa de la ficha.
- [ ] Selector de instructor filtrado por centro de la ficha y perfiles compatibles con la competencia.
- [ ] Calendario con selección rectangular por arrastre (mismo patrón que FichasView horario editor).
- [ ] Celdas ocupadas muestran color por estado e información al hover.
- [ ] Click en celda ocupada abre modal de detalle (ver/editar/eliminar/cambiar estado).
- [ ] Indicador de conflicto ámbar al seleccionar celdas si instructor/ambiente no disponibles.
- [ ] Panel lateral de RAs con progreso de horas (asignadas vs. requeridas, filtrado por ficha).
- [ ] Botón "Limpiar Todo" elimina TODOS los eventos de la ficha con ConfirmDialog.
- [ ] Cambio de estado de evento accesible desde el modal de detalle.

### Verificación
- [ ] `npm run lint` sin errores nuevos.
- [ ] Migración de datos existentes probada.
- [ ] Commit + deploy sync + push.