# Tasks — Rediseño Fichas

## Preparación

- [ ] Agregar estados: `showForm`, `error`, `saving`
- [ ] Agregar refs: `isDragging`, `dragStart`, `dragEnd` para click-and-drag rectangular
- [ ] Eliminar grid partido `lg:grid-cols-3` → tabla full-width

## Modal de formulario

- [ ] Crear `handleClose()` que resetea todos los campos
- [ ] Mover el formulario inline a un modal con `backdrop-blur-sm bg-white/30`
- [ ] Modal con header sticky (`p-5 border-b`), ancho `max-w-4xl`, cuerpo `p-6 max-h-[75vh] overflow-y-auto`
- [ ] Layout side-by-side: `grid grid-cols-1 lg:grid-cols-2 gap-8`
- [ ] Encabezados de sección simétricos: "Datos de la Ficha" / "Horario de Formación" (`text-sm font-semibold border-b pb-2`)
- [ ] Labels uniformes: `text-xs font-medium` en todos los campos
- [ ] Inputs uniformes: `text-sm px-3 py-2` con `focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400`
- [ ] Actualizar `handleSubmit` para usar `setSaving`, `setError`, `handleClose()`
- [ ] Actualizar `handleEdit` para abrir el modal (`setShowForm(true)`)
- [ ] Botón "Nueva Ficha" en el header principal

## Cuadrícula semanal de horario

- [ ] Cuadrícula CSS Grid `40px repeat(6, 1fr)` con `gap-1`
- [ ] Contenedor de cuadrícula con `border rounded-lg p-2 bg-gray-50/50` (simetría con formulario)
- [ ] Celdas: `h-6` (24px), `rounded border`
- [ ] Encabezados de día: `text-[10px] font-semibold`
- [ ] Etiquetas de hora: `text-[10px] font-mono`
- [ ] Implementar `handleCellMouseDown` que registra celda inicial + actualiza `dragPreview`
- [ ] Implementar `handleCellMouseEnter` que actualiza `dragEnd` y `dragPreview` durante arrastre
- [ ] Implementar `handleCellMouseUp` que calcula rango rectangular (min/max días × horas)
- [ ] Click simple (start === end) togglea celda individual
- [ ] Drag rectangular aplica misma acción (select/deselect) a todo el rango
- [ ] `dragPreview` state: retorno visual con `bg-purple-500/35 border-purple-500` durante arrastre
- [ ] Estados visuales: no seleccionada `bg-white border-gray-200`, seleccionada `bg-purple-500/20 border-purple-400`
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
