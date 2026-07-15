# Plan — Normalizar Gestión de Perfiles Académicos

## Estrategia técnica

Refactorizar el modelo de datos promoviendo `perfiles_academicos` a entidad independiente, migrando datos existentes y actualizando todos los consumidores (API, componentes, permisos, sidebar).

## Archivos a modificar

### Base de datos

| Archivo | Cambio |
|---|---|
| `src/db/schema.ts` | Agregar `perfilesAcademicos`, `competenciasPerfiles`, `instructoresPerfiles` |
| `src/db/index.ts` | Exportar nuevas tablas (si es necesario; ya exporta todo) |

### Backend (API endpoints)

| Archivo | Cambio |
|---|---|
| `server.ts` | Nuevos endpoints CRUD `/api/perfiles-academicos`; modificar `GET/POST /api/competencias/:id/perfiles` para usar junction; modificar instructores endpoints para `perfilIds` |

### Frontend

| Archivo | Cambio |
|---|---|
| `src/components/CurriculoModal.tsx` | Perfiles se seleccionan de lista maestra (`/api/perfiles-academicos`), no se crean inline. Eliminar formulario inline de perfil. |
| `src/components/InstructoresView.tsx` | Selector de perfiles usa `perfilIds` (checkboxes con IDs), no nombres string. Enviar `perfilIds` en payload. |
| `src/components/ProgramacionInstructoresView.tsx` | Filtro de instructores por `perfilIds` en vez de string match. |
| `src/components/PerfilesAcademicosView.tsx` | **Nuevo**: componente CRUD para la lista maestra. |
| `src/App.tsx` | Agregar ruta `/perfiles-academicos` y enlace en sidebar (si aplica como módulo independiente) o integrar como sub-vista de Instructores. |

### Permisos

| Archivo | Cambio |
|---|---|
| `src/modules/perfiles_academicos/permissions.ts` | **Nuevo**: permisos CRUD para el módulo. |
| `src/modules/index.ts` | Importar y registrar `PERFILES_ACADEMICOS_PERMISSIONS`. |

### Migración

| Archivo | Cambio |
|---|---|
| `scripts/migrate-perfiles-academicos.ts` | **Nuevo**: script de migración de datos existentes. |
| `seed.ts` | Actualizar seed para usar nuevas tablas. |

## Estructura de datos nueva

```
perfiles_academicos
├── id (PK)
├── codigo (UNIQUE)
├── nombre
├── descripcion (opcional)
└── created_at

competencias_perfiles
├── id (PK)
├── competencia_id → competencias.id (CASCADE)
└── perfil_academico_id → perfiles_academicos.id (RESTRICT)

instructores_perfiles
├── id (PK)
├── instructor_id → instructores.id (CASCADE)
└── perfil_academico_id → perfiles_academicos.id (RESTRICT)
```

## Flujo de migración de datos

1. Extraer `(codigo, nombre)` distintos de `perfiles_instructor` → insertar en `perfiles_academicos`
2. Para cada registro en `perfiles_instructor`, crear registro en `competencias_perfiles` vinculando `competencia_id` al `perfil_academico_id` correspondiente (por match de `codigo`)
3. Para cada instructor con `requisitosAcademicos` poblado, matchear cada string con `perfiles_academicos.nombre` y crear registro en `instructores_perfiles`
4. Eliminar tabla `perfiles_instructor` (opcional, dejar caer en migración final)

## Diseño UI/UX del sub-módulo

El sub-módulo "Perfiles Académicos" se integrará como una nueva vista accesible desde el sidebar (módulo independiente, similar a "Instructores" o "Programas"). Alternativamente, puede ser un botón/tab dentro de la vista de Instructores.

**Decisión:** Crear como módulo independiente con entrada en el sidebar, ya que perfiles académicos son un concepto transversal usado tanto por programas como por instructores. La ruta será `/perfiles-academicos`.

### Layout de la vista

- Tabla con columnas: Código, Nombre, Descripción, Programas asociados (cantidad), Instructores asociados (cantidad), Acciones (Editar, Eliminar).
- Botón "Nuevo Perfil" arriba a la derecha.
- Modal de creación/edición con campos: Código, Nombre, Descripción.
- ConfirmDialog para eliminación con verificación de dependencias.

### Integración en CurriculoModal

- Reemplazar formulario inline de perfil por un selector multiselect con búsqueda (datalist o checkboxes) que trae perfiles de `/api/perfiles-academicos`.
- Al guardar la competencia, enviar `perfilIds: number[]`.

### Integración en InstructoresView

- Los checkboxes de perfil ahora muestran perfiles de `/api/perfiles-academicos` con `value={perfil.id}`.
- Al guardar, enviar `perfilIds: number[]`.
- Backend guarda/actualiza `instructores_perfiles`.

### Integración en ProgramacionInstructoresView

- Al cargar perfiles de una competencia, se obtienen los `perfilAcademicoId` desde `competencias_perfiles`.
- El filtrado de instructores usa `instructores_perfiles` (match por ID) en vez de string match.
