# Tasks — Normalizar Gestión de Perfiles Académicos

## Fase 1: Base de datos

- [ ] Agregar tabla `perfiles_academicos` en `src/db/schema.ts`
- [ ] Agregar tabla `competencias_perfiles` en `src/db/schema.ts`
- [ ] Agregar tabla `instructores_perfiles` en `src/db/schema.ts`
- [ ] Exportar nuevas tablas desde `src/db/schema.ts` (agregar a exports)
- [ ] Ejecutar `npm run db:push` para aplicar migración

## Fase 2: Migración de datos

- [ ] Crear `scripts/migrate-perfiles-academicos.ts`
  - [ ] Leer registros únicos de `perfiles_instructor` → insertar en `perfiles_academicos`
  - [ ] Vincular `perfiles_instructor` → `competencias_perfiles`
  - [ ] Migrar `instructores.requisitosAcademicos` (string[]) → `instructores_perfiles` (IDs)
- [ ] Ejecutar script de migración en BD local
- [ ] Ejecutar script de migración en BD del deploy (en producción)

## Fase 3: API Backend

- [ ] Agregar endpoints CRUD para `/api/perfiles-academicos` en `server.ts`
  - [ ] `GET /api/perfiles-academicos` — listar todos
  - [ ] `POST /api/perfiles-academicos` — crear
  - [ ] `PUT /api/perfiles-academicos/:id` — editar
  - [ ] `DELETE /api/perfiles-academicos/:id` — eliminar con verificación de dependencias
- [ ] Modificar `GET /api/programas/:id/competencias` para incluir perfiles vía junction
- [ ] Modificar `GET /api/competencias/:id/perfiles` para leer desde `competencias_perfiles`
- [ ] Modificar `POST /api/competencias/:id/perfiles` para recibir `perfilAcademicoId`
- [ ] Modificar `DELETE /api/perfiles/:id` para eliminar registro de junction
- [ ] Modificar `POST /api/instructores` para recibir `perfilIds` y guardar en `instructores_perfiles`
- [ ] Modificar `PUT /api/instructores/:id` para actualizar `instructores_perfiles`
- [ ] Modificar `GET /api/instructores` para incluir `perfilIds` en respuesta
- [ ] Actualizar endpoint `/api/perfiles-unicos` o deprecarlo
- [ ] Actualizar `/api/dependencias/:tipo/:id` para nuevo modelo

## Fase 4: Permisos

- [ ] Crear `src/modules/perfiles_academicos/permissions.ts` con permisos CRUD
- [ ] Registrar en `src/modules/index.ts`
- [ ] Ejecutar seed/migración para insertar permisos en BD
- [ ] Asignar permisos `perfiles_academicos.*` a roles existentes (admin, editor, etc.)

## Fase 5: Frontend — Sub-módulo Perfiles Académicos

- [ ] Crear `src/components/PerfilesAcademicosView.tsx`
  - [ ] Tabla con columnas: Código, Nombre, Descripción, Acciones
  - [ ] Botón "Nuevo Perfil"
  - [ ] Modal de creación/edición
  - [ ] ConfirmDialog para eliminación
  - [ ] Permisos: `mayCrear`, `mayEditar`, `mayEliminar`, `hayAcciones`
- [ ] Agregar ruta `/perfiles-academicos` en `src/App.tsx`
- [ ] Agregar enlace en sidebar (condicional a `perfiles_academicos.ver`)

## Fase 6: Frontend — CurriculoModal

- [ ] Actualizar selector de perfiles en CurriculoModal
  - [ ] Cambiar de "crear inline" a "seleccionar de lista maestra"
  - [ ] Cargar perfiles desde `/api/perfiles-academicos`
  - [ ] Enviar `perfilIds` al guardar competencia
  - [ ] Eliminar formulario inline de perfil (código + nombre)

## Fase 7: Frontend — InstructoresView

- [ ] Actualizar selector de perfiles
  - [ ] Checkboxes con `value={perfil.id}` en vez de string
  - [ ] Enviar `perfilIds: number[]` en payload
  - [ ] Mostrar badges con nombre del perfil

## Fase 8: Frontend — ProgramacionInstructoresView

- [ ] Actualizar filtro de instructores
  - [ ] Obtener `perfilAcademicoIds` desde la competencia seleccionada
  - [ ] Filtrar instructores cotejando contra `instructores_perfiles` por ID

## Fase 9: Seed

- [ ] Actualizar `seed.ts` para insertar datos en nuevas tablas
- [ ] Mantener compatibilidad con seed existente

## Fase 10: Verificación y sincronización

- [ ] `npm run lint` — sin errores nuevos
- [ ] Probar flujo completo: crear perfil → asignar a competencia → asignar a instructor → programar
- [ ] Commit + deploy sync + push
