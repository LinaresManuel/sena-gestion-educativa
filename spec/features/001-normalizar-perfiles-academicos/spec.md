# Normalizar Gestión de Perfiles Académicos

## Qué

Promover `perfiles_academicos` de un registro efímero atado a competencias (vía `perfiles_instructor` con `ON DELETE CASCADE`) a una entidad independiente con CRUD propio, referenciada por FK tanto desde competencias como desde instructores.

## Para qué

- **Persistencia:** Un perfil académico no debe desaparecer cuando se elimina un programa o competencia.
- **Integridad referencial:** La asignación de perfiles a instructores debe ser por ID, no por nombre textual, para evitar datos huérfanos al renombrar/eliminar perfiles.
- **Gobernanza:** Los perfiles deben poder crearse, editarse y eliminarse desde una interfaz dedicada, no solo desde el currículo de un programa.

## Comportamiento esperado

1. Existe una tabla independiente `perfiles_academicos` que almacena la lista maestra de perfiles.
2. Las competencias se asocian a perfiles mediante una tabla junction `competencias_perfiles`.
3. Los instructores se asocian a perfiles mediante una tabla junction `instructores_perfiles`.
4. Existe un sub-módulo "Perfiles Académicos" (dentro de Instructores o como apartado propio) con CRUD completo.
5. Al crear/editar una competencia en un programa, los perfiles se seleccionan de la lista maestra existente, no se crean inline.
6. Al crear/editar un instructor, los perfiles se seleccionan de la lista maestra existente.
7. La programación (`ProgramacionInstructoresView`) filtra instructores por perfil usando IDs, no nombres.
8. Eliminar un programa o competencia **no** elimina los perfiles académicos — solo las relaciones en `competencias_perfiles`.
9. Existe un script de migración que traslada los datos existentes de `perfiles_instructor` a las nuevas tablas.

## Criterios de aceptación (Definition of Done)

- [ ] Tablas `perfiles_academicos`, `competencias_perfiles` e `instructores_perfiles` creadas en `schema.ts` con migración Drizzle.
- [ ] Script de migración implementado y ejecutable que traslada datos existentes sin pérdida.
- [ ] API REST endpoints para CRUD de perfiles académicos (`/api/perfiles-academicos`).
- [ ] API endpoints actualizados para que competencias e instructores referencien perfiles por ID.
- [ ] Sub-módulo "Perfiles Académicos" con listado, creación, edición y eliminación.
- [ ] `CurriculoModal` actualizado: asigna perfiles existentes a competencias (no crea inline).
- [ ] `InstructoresView` actualizado: selecciona perfiles por ID con checkboxes.
- [ ] `ProgramacionInstructoresView` actualizado: filtro por IDs de perfil.
- [ ] Permisos `perfiles_academicos.{ver,crear,editar,eliminar}` registrados en BD y asignados a roles existentes.
- [ ] Sidebar actualizado si el módulo tiene acceso directo.
- [ ] `npm run lint` sin errores nuevos.
- [ ] Commit + deploy sync + push completados.
