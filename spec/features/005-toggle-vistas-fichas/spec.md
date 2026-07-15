# Toggle Cards / Tabla + Modal Ver Detalles en Fichas

## Qué

Agregar un toggle de vista (cards ↔ tabla) en el módulo de fichas, más un modal read-only "Ver Detalles" accesible desde la vista tabla.

1. **Toggle cards/tabla** en el toolbar, junto al filtro de programa.
2. **Vista tabla** con columnas N° Ficha, Programa, Modalidad y Acciones (editar, eliminar, ver detalles).
3. **Modal "Ver Detalles"** que muestra toda la información de la ficha (campos + horario en cuadrícula) en diseño side-by-side, solo lectura.

## Para qué

- El usuario puede elegir la vista que prefiera según su flujo de trabajo.
- La tabla permite escanear muchas fichas rápidamente sin ocupar tanto espacio vertical.
- El modal "Ver Detalles" evita tener que abrir el formulario de edición solo para ver la información completa (incluido el horario).

## Criterios de aceptación

- [ ] Toggle en toolbar con dos botones: `⊞ Cards` / `⊟ Tabla`. El activo se resalta con `bg-white shadow-sm`.
- [ ] Vista cards: sin cambios respecto a la implementación actual (grid `lg:grid-cols-3 gap-4`, `flex-col h-full`, botones de acción en footer siempre visibles, botón "Ver Horario" existente).
- [ ] Vista tabla: `<table>` dentro de `overflow-x-auto`, con `thead` y `tbody`.
- [ ] Columnas de tabla: N° Ficha (negrita), Programa (truncado con `max-w-[300px]` y `title`), Modalidad (badge coloreado), Acciones (iconos siempre visibles: ✏️ 🗑️ 👁️).
- [ ] Tabla con `hover:bg-gray-50` en filas y borde inferior entre filas.
- [ ] Modal "Ver Detalles": mismo diseño que el modal de creación (`max-w-5xl`, `lg:grid-cols-2 gap-6`).
- [ ] Lado izquierdo del modal: todos los campos como etiquetas + spans (sin inputs), con fondo `bg-gray-50/50 rounded-lg border`.
- [ ] Lado derecho del modal: cuadrícula de horario idéntica a la de creación (grid `32px repeat(6, 1fr)`, `gap-0.5`, `h-4`), sin handlers de mouse.
- [ ] Título del modal: "Detalles — Ficha XXXXXX". Footer con botón "Cerrar".
- [ ] El modal "Ver Detalles" solo aparece en la vista tabla (el botón 👁️ no existe en la vista cards).
- [ ] Vista cards mantiene su botón "Ver Horario" existente (modal read-only angosto, solo grid).
- [ ] Filtro por programa funciona en ambas vistas.
- [ ] `npm run lint` sin errores nuevos.
- [ ] Commit + deploy sync + push.
