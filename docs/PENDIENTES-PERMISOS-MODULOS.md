# Pendientes: Correccion de permisos CRUD por modulo

## Objetivo

Reemplazar el unico boolean `canEdit` que combina `crear` + `editar` por tres permisos individuales (`mayCrear`, `mayEditar`, `mayEliminar`) en cada componente, de modo que cada accion se muestre solo si el usuario tiene el permiso exacto.

## Modulos completados (10/10)

| Modulo | Archivo | Estado |
|---|---|---|
| Regionales | `RegionesView.tsx` | ✅ `mayCrear`, `mayEditar`, `mayEliminar`, `hayAcciones` |
| Centros | `CentrosView.tsx` | ✅ Mismo patron. |
| Ambientes | `AmbientesView.tsx` | ✅ Mismo patron. Incluye boton "Elementos" y estado. |
| Tipos Ambiente | `TiposAmbienteView.tsx` | ✅ Mismo patron. |
| Programas | `ProgramasView.tsx` | ✅ Mismo patron. Incluye boton "Curriculo" y descarga PDF. |
| Instructores | `InstructoresView.tsx` | ✅ Reemplazado. Form: `mayCrear \|\| mayEditar`, tabla: `hayAcciones`, botones: `mayEditar`/`mayEliminar`. |
| Fichas | `FichasView.tsx` | ✅ Reemplazado + edicion agregada. `editingId` state, boton Pencil, `PUT /api/fichas/:id`, form cambia entre crear/editar. |
| Elementos Ambiente | `ElementosAmbienteGrid.tsx` | ✅ Reemplazado. Mismo patron. |
| Curriculo | `CurriculoModal.tsx` | ✅ Usado. Botones RA/Perfil/Pencil/Trash gateados. |
| Programacion | `ProgramacionInstructoresView.tsx` | ✅ Permisos desde cero. `mayVer`, `mayCrear`, `mayEditar`, `mayEliminar`. |

## Modulos pendientes (0)

Ninguno. Todos los 10 modulos CRUD tienen permisos individuales por accion.
