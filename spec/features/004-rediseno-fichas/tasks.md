# Tasks — Rediseño Fichas

## Preparación

- [ ] Agregar estados: `showForm`, `error`, `saving`
- [ ] Agregar refs: `isDragging`, `dragAction` para click-and-drag
- [ ] Eliminar grid partido `lg:grid-cols-3` → tabla full-width

## Modal de formulario

- [ ] Crear `handleClose()` que resetea todos los campos
- [ ] Mover el formulario inline (líneas 239–371) a un modal con `backdrop-blur-sm bg-white/30`
- [ ] Modal con header sticky, `max-w-lg max-h-[85vh] overflow-y-auto`
- [ ] Actualizar `handleSubmit` para usar `setSaving`, `setError`, `handleClose()`
- [ ] Actualizar `handleEdit` para abrir el modal (`setShowForm(true)`)
- [ ] Botón "Nueva Ficha" en el header principal

## Cuadrícula semanal de horario

- [ ] Reemplazar `toggleDay` + checkboxes por cuadrícula CSS Grid `70px repeat(6, 1fr)`
- [ ] Implementar `handleCellMouseDown` con detección de acción (select/deselect)
- [ ] Implementar `handleCellMouseEnter` para arrastre
- [ ] Agregar `onMouseUp` y `onMouseLeave` en el contenedor del grid
- [ ] Estados visuales para seleccionada, no seleccionada, hover, arrastre
- [ ] Colores: `bg-purple-500/20 border-purple-400` para seleccionadas
- [ ] Eliminar las variables `toggleDay` y `DIAS_SEMANA` (ya no se usan igual)

## Filtro por programa

- [ ] Agregar estado `filtroProgramaId`
- [ ] Agregar `<select>` entre header y grilla de fichas
- [ ] Aplicar filtro: `fichasFiltradas` derivado
- [ ] Renderizar `fichasFiltradas` en vez de `fichas`

## Verificación

- [ ] `npm run lint` — sin errores nuevos
- [ ] Probar: crear ficha con horario vía cuadrícula, editar, filtrar
- [ ] Commit + deploy sync + push
