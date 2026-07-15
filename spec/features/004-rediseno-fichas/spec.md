# Rediseño UI/UX del Módulo de Fichas

## Qué

Rediseñar el módulo de fichas con cinco mejoras:

1. **Formulario modal** con backdrop-blur para crear/editar fichas (patrón existente en los otros módulos CRUD).
2. **Selector de horario tipo cuadrícula semanal** con celdas seleccionables por click y click-and-drag, inspirado en el diseño visual del proyecto de referencia `diseno-cronograma` (componente `weekly-time-matrix.tsx`).
3. **Filtro por programa** en la vista principal.
4. **Rediseño de la card de resumen** con badge de modalidad, fechas formateadas DD/MM/AAAA, info de centro y ambiente, y botón "Ver Horario" para evitar saturación textual del horario.
5. **Modal read-only de horario** que muestra la cuadrícula semanal completa sin interacción, accesible desde el botón "Ver Horario" de cada card.

## Para qué

- **Modal**: La lista de fichas ocupa el ancho completo disponible, sin robar espacio con un formulario inline permanente.
- **Cuadrícula semanal**: La selección de horario es más rápida e intuitiva — un solo clic por celda o arrastre horizontal/vertical para seleccionar múltiples celdas. La representación visual tipo grilla permite ver de un vistazo los días y horas ocupados.
- **Fondo semitransparente**: Las celdas seleccionadas muestran `bg-purple-500/20` con `border-purple-400`, manteniendo la trazabilidad de colores del proyecto (púrpura como color principal).
- **Filtro por programa**: Facilita la búsqueda cuando hay muchas fichas.

## Criterios de aceptación

- [ ] Modal para crear/editar fichas con `backdrop-blur-sm bg-white/30` (sin overlay oscuro). Ancho `max-w-5xl`.
- [ ] Modal con header sticky (`p-5 border-b`), cuerpo scrolleable (`p-5 max-h-[78vh] overflow-y-auto`) y footer con border-t.
- [ ] Layout side-by-side simétrico: `grid grid-cols-1 lg:grid-cols-2 gap-6`. Columna izquierda = formulario, columna derecha = horario.
- [ ] Cada columna tiene un encabezado de sección con `border-b pb-2`: "Datos de la Ficha" / "Horario de Formación".
- [ ] Consistencia tipográfica: todos los labels a `text-xs font-medium`, todos los inputs a `text-sm px-3 py-2`, encabezados de sección a `text-sm font-semibold`.
- [ ] Inputs con feedback visual: `focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 outline-none transition`.
- [ ] Cuadrícula semanal usando CSS Grid (`grid-template-columns: 32px repeat(6, 1fr)`) con `gap-0.5`, envuelta en contenedor `border rounded-lg p-1.5 bg-gray-50/50`.
- [ ] Columnas: LUN, MAR, MIE, JUE, VIE, SAB (`text-[9px] font-semibold`). Filas: 06:00–22:00 (16 bloques), etiquetas hora en `text-[8px] font-mono`.
- [ ] Celdas: `h-4` (16px), `rounded-sm border`. No seleccionada: `bg-white border-gray-200`. Seleccionada: `bg-purple-500/20 border-purple-400`.
- [ ] Hover: `hover:bg-purple-50 hover:border-purple-300`.
- [ ] Retorno visual durante arrastre: el rango preview se muestra con `bg-purple-500/35 border-purple-500` (más intenso que seleccionado).
- [ ] Click en celda: togglea selección individual.
- [ ] Click-and-drag rectangular: `onMouseDown` registra celda inicial, `onMouseEnter` actualiza celda final y la previsualización (`dragPreview` state), `onMouseUp` calcula el rango y aplica la acción.
- [ ] Drag determina acción según estado de la celda inicial: seleccionada → deselecciona el rango; no seleccionada → lo selecciona.
- [ ] Filtro por programa: dropdown que filtra la lista de fichas en tiempo real.
- [ ] Card de resumen de ficha rediseñada:
  - Badge de modalidad con colores (Presencial=purple, Virtual=blue, Mixta=amber).
  - Label "Programa de Formación" sobre el nombre del programa.
  - Fechas formateadas como `DD/MM/AAAA → DD/MM/AAAA` con labels "Lectivo:" y "Ficha:".
  - Centro y Ambiente en filas separadas con iconos (MapPin, Clock).
  - Botón "Ver Horario" con icono Eye en lugar del listado textual de horas.
- [ ] Modal read-only de horario:
  - Mismo patrón `backdrop-blur-sm bg-white/30`, ancho `max-w-lg`.
  - Muestra programa y ambiente como info complementaria.
  - Cuadrícula semanal idéntica al modal de creación (grid `32px repeat(6, 1fr)`, `gap-0.5`, `h-4`).
  - Celdas sin interacción: `cursor-default`, sin click/drag.
  - Título: "Horario — Ficha XXXXXX".
  - Botón "Cerrar" en footer.
- [ ] `npm run lint` sin errores nuevos.
- [ ] Commit + deploy sync + push.
