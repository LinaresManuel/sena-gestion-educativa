# Pendientes: Correccion de permisos CRUD por modulo

## Objetivo

Reemplazar el unico boolean `canEdit` que combina `crear` + `editar` por tres permisos individuales (`mayCrear`, `mayEditar`, `mayEliminar`) en cada componente, de modo que cada accion se muestre solo si el usuario tiene el permiso exacto.

## Modulos completados (6)

| Modulo | Archivo | Estado |
|---|---|---|
| Regionales | `RegionesView.tsx` | ✅ `canEdit` reemplazado por `mayCrear`, `mayEditar`, `mayEliminar`, `hayAcciones`. Cada boton gateado individualmente. |
| Centros | `CentrosView.tsx` | ✅ Mismo patron. |
| Ambientes | `AmbientesView.tsx` | ✅ Mismo patron. Incluye boton "Elementos" y estado. |
| Tipos Ambiente | `TiposAmbienteView.tsx` | ✅ Mismo patron. |
| Programas | `ProgramasView.tsx` | ✅ Mismo patron. Incluye boton "Curriculo" y descarga PDF. |

## Modulos pendientes (5)

### 1. InstructoresView

**Archivo:** `src/components/InstructoresView.tsx`

**Estado actual:**
- `const canEdit = useHasAnyPermission('instructores.editar', 'instructores.crear');` (linea 16)
- 7 referencias a `canEdit` en el JSX

**Cambios necesarios:**
```typescript
const mayCrear = useHasPermission('instructores.crear');
const mayEditar = useHasPermission('instructores.editar');
const mayEliminar = useHasPermission('instructores.eliminar');
const hayAcciones = mayCrear || mayEditar || mayEliminar;
```
- `{canEdit && (` crear formulario → `{hayAcciones && (`
- `{canEdit && <th>` columna acciones → `{hayAcciones && <th>`
- `{canEdit && (` botones accion → `{hayAcciones && (` con `{mayEditar && (` y `{mayEliminar && (` dentro
- `colSpan={canEdit ? 5 : 4}` → `hayAcciones`

---

### 2. FichasView

**Archivo:** `src/components/FichasView.tsx`

**Estado actual:**
- `const canEdit = useHasAnyPermission('fichas.editar', 'fichas.crear');` (linea 27)
- 4 referencias a `canEdit` en el JSX
- **No tiene funcionalidad de edicion** — no hay boton Pencil ni formulario de editar

**Cambios necesarios:**

a) Reemplazar `canEdit` por permisos individuales (igual patron).

b) **Agregar funcionalidad de edicion:**
- Agregar estado `editingId` para saber que ficha se esta editando
- Agregar boton Pencil por fila, visible solo con `mayEditar`
- Modificar el formulario de crear para que funcione tambien como edicion (precargar datos cuando `editingId` no es null)
- Agregar endpoint PUT (ya existe en `admin.ts`)

---

### 3. ElementosAmbienteGrid

**Archivo:** `src/components/ElementosAmbienteGrid.tsx`

**Estado actual:**
- `const canEdit = useHasAnyPermission('ambientes.editar', 'ambientes.crear');`
- 7 referencias a `canEdit` en el JSX

**Cambios necesarios:**
```typescript
const mayCrear = useHasPermission('ambientes.crear');
const mayEditar = useHasPermission('ambientes.editar');
const mayEliminar = useHasPermission('ambientes.eliminar');
const hayAcciones = mayCrear || mayEditar || mayEliminar;
```
Mismo patron que los modulos completados.

---

### 4. CurriculoModal

**Archivo:** `src/components/CurriculoModal.tsx`

**Estado actual:**
- `const canEdit = useHasAnyPermission('programas.editar', 'programas.crear');` (linea 37)
- `canEdit` esta definido pero **NUNCA usado en el JSX**
- Todos los botones CRUD (crear/editar/eliminar competencias, RA, perfiles) son visibles para cualquier usuario autenticado

**Cambios necesarios:**
```typescript
const mayCrear = useHasPermission('programas.crear');
const mayEditar = useHasPermission('programas.editar');
const mayEliminar = useHasPermission('programas.eliminar');
```
- Gatear cada boton con el permiso correspondiente
- Gatear formularios con `mayCrear`
- Gatear boton Pencil con `mayEditar`
- Gatear boton Trash2 con `mayEliminar`

---

### 5. ProgramacionInstructoresView

**Archivo:** `src/components/ProgramacionInstructoresView.tsx`

**Estado actual:**
- Sin ningun tipo de verificacion de permisos
- No importa nada de `auth-context`
- Cualquier usuario autenticado puede ver, crear, editar y eliminar programacion

**Cambios necesarios:**
```typescript
import { useHasPermission } from "../lib/auth-context";
// ...
const mayVer = useHasPermission('programacion.ver');
const mayCrear = useHasPermission('programacion.crear');
const mayEditar = useHasPermission('programacion.editar');
const mayEliminar = useHasPermission('programacion.eliminar');
```
- Vista completa → `mayVer`
- Parametros de filtro (programa, ficha, competencia) → `mayVer`
- Boton "Guardar Mes" → `mayCrear`
- Boton "Habilitar Edicion" → `mayEditar`
- Boton "Limpiar Celda" → `mayEliminar`
- Boton "Limpiar Todo" → `mayEliminar`

---

## Resumen

| # | Modulo | Archivo | Tipo de cambio | Prioridad |
|---|---|---|---|---|
| 1 | Instructores | `InstructoresView.tsx` | Reemplazar `canEdit` | Alta |
| 2 | Fichas | `FichasView.tsx` | Reemplazar `canEdit` + agregar edicion | Alta |
| 3 | Elementos Ambiente | `ElementosAmbienteGrid.tsx` | Reemplazar `canEdit` | Alta |
| 4 | Curriculo | `CurriculoModal.tsx` | Usar `canEdit` (esta definido pero no usado) | Alta |
| 5 | Programacion | `ProgramacionInstructoresView.tsx` | Agregar permisos desde cero | Alta |

**Tiempo estimado:** ~45 min los 5 modulos.
