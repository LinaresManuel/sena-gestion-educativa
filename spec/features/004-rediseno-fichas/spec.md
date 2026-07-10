# Rediseño UI/UX del Módulo de Fichas

## Qué

Rediseñar completamente el módulo de fichas con tres mejoras:

1. **Formulario modal** con backdrop-blur para crear/editar fichas (patrón existente en los otros módulos CRUD).
2. **Selector de horario tipo cuadrícula semanal** con celdas seleccionables por click y click-and-drag, inspirado en el diseño visual del proyecto de referencia `diseno-cronograma` (componente `weekly-time-matrix.tsx`).
3. **Filtro por programa** en la vista principal.

## Para qué

- **Modal**: La lista de fichas ocupa el ancho completo disponible, sin robar espacio con un formulario inline permanente.
- **Cuadrícula semanal**: La selección de horario es más rápida e intuitiva — un solo clic por celda o arrastre horizontal/vertical para seleccionar múltiples celdas. La representación visual tipo grilla permite ver de un vistazo los días y horas ocupados.
- **Fondo semitransparente**: Las celdas seleccionadas muestran `bg-purple-500/20` con `border-purple-400`, manteniendo la trazabilidad de colores del proyecto (púrpura como color principal).
- **Filtro por programa**: Facilita la búsqueda cuando hay muchas fichas.

## Criterios de aceptación

- [ ] Modal para crear/editar fichas con `backdrop-blur-sm bg-white/30` (sin overlay oscuro).
- [ ] Modal con header sticky, cuerpo scrolleable (`max-h-[85vh] overflow-y-auto`) y footer con botones Cancelar/Guardar.
- [ ] Cuadrícula semanal de horario usando CSS Grid (`grid-template-columns: 28px repeat(6, minmax(24px, 1fr))`) con `gap-0.5`.
- [ ] Columnas: LUN, MAR, MIE, JUE, VIE, SAB. Filas: 06:00–21:00 en bloques de 1 hora.
- [ ] Celdas compactas: `h-4` (16px), `rounded-sm border`, texto hora en `text-[7px]`, ancho de celda `minmax(24px, 1fr)`.
- [ ] Retorno visual durante arrastre: el rango rectangular preview se muestra con `bg-purple-500/35 border-purple-500` (más intenso que seleccionado).
- [ ] Layout side-by-side: formulario a la izquierda, cuadrícula horaria a la derecha en `lg:grid-cols-2`, eliminando necesidad de scroll vertical.
- [ ] Celda no seleccionada: `bg-gray-50/80 border-gray-200`.
- [ ] Celda seleccionada: `bg-purple-500/20 border-purple-400` (semitransparente, sin shadow).
- [ ] Hover en celda no seleccionada: `hover:bg-purple-50 hover:border-purple-300`.
- [ ] Click en celda: togglea selección individual.
- [ ] Click-and-drag rectangular: `onMouseDown` registra celda inicial, `onMouseEnter` actualiza celda final y la previsualización (`dragPreview` state) mientras se arrastra, `onMouseUp` calcula el rango y aplica la acción.
- [ ] Drag determina acción según estado de la celda inicial: seleccionada → deselecciona el rango; no seleccionada → lo selecciona.
- [ ] Filtro por programa: dropdown que filtra la lista de fichas en tiempo real.
- [ ] `npm run lint` sin errores nuevos.
- [ ] Commit + deploy sync + push.
