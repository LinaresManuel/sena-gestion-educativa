# Tasks — Rediseño Fichas

## Preparación

- [ ] Agregar estados: `showForm`, `error`, `saving`
- [ ] Agregar refs: `isDragging`, `dragStart`, `dragEnd` para click-and-drag rectangular
- [ ] Eliminar grid partido `lg:grid-cols-3` → tabla full-width

## Modal de formulario

- [ ] Crear `handleClose()` que resetea todos los campos
- [ ] Mover el formulario inline (líneas 239–371) a un modal con `backdrop-blur-sm bg-white/30`
- [ ] Modal con header sticky, `max-w-lg max-h-[85vh] overflow-y-auto`
- [ ] Actualizar `handleSubmit` para usar `setSaving`, `setError`, `handleClose()`
- [ ] Actualizar `handleEdit` para abrir el modal (`setShowForm(true)`)
- [ ] Botón "Nueva Ficha" en el header principal

## Cuadrícula semanal de horario

- [ ] Reemplazar `toggleDay` + checkboxes por cuadrícula CSS Grid `60px repeat(6, 1fr)` con `gap-1`
- [ ] Celdas compactas: `h-6` (24px), `rounded-md border`, texto hora en `text-[10px]`
- [ ] Implementar `handleCellMouseDown` que registra celda inicial (`dragStart`, `dragEnd`)
- [ ] Implementar `handleCellMouseEnter` que actualiza `dragEnd` durante arrastre
- [ ] Implementar `handleCellMouseUp` que calcula rango rectangular (min/max días × horas)
- [ ] Click simple (start === end) togglea celda individual
- [ ] Drag rectangular aplica misma acción (select/deselect) a todo el rango
- [ ] Agregar `onMouseUp={handleCellMouseUp}` y `onMouseLeave={handleCellMouseUp}` en contenedor
- [ ] Estados visuales: `bg-purple-500/20 border-purple-400` sin shadow
- [ ] Eliminar `toggleDay` y `DIAS_SEMANA` (ya no se usan)

## Filtro por programa

- [ ] Agregar estado `filtroProgramaId`
- [ ] Agregar `<select>` entre header y grilla de fichas
- [ ] Aplicar filtro: `fichasFiltradas` derivado
- [ ] Renderizar `fichasFiltradas` en vez de `fichas`

## Verificación

- [ ] `npm run lint` — sin errores nuevos
- [ ] Probar: crear ficha con horario vía cuadrícula, editar, filtrar
- [ ] Commit + deploy sync + push
