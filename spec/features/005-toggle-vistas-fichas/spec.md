# Toggle Cards / Tabla + Modal Ver Detalles en Fichas

## Qué

Agregar un toggle de vista (cards ↔ tabla) en el módulo de fichas, más un modal read-only "Ver Detalles" accesible desde la vista tabla.

1. **Toggle cards/tabla** en el toolbar.
2. **Vista tabla** con columnas N° Ficha, Programa, Modalidad y Acciones (editar, eliminar, ver detalles).
3. **Modal "Ver Detalles"** que muestra toda la información de la ficha (campos + horario en cuadrícula) en diseño side-by-side, solo lectura.
4. **Filtros combinados**: programa, regional, centro y ambiente. La selección de regional y centro filtran los dropdowns siguientes en cascada.
5. **Toolbar reorganizado**: fila superior con título + botón Nueva Ficha; fila inferior con filtros + toggle.
6. **Modalidad badge** movida a la derecha en las cards, con `rounded-lg` para consistencia visual con el badge de ficha.

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
- [ ] Toolbar en dos filas: título + Nueva Ficha arriba; filtros + toggle abajo.
- [ ] Filtro por Regional: al seleccionar, filtra centros disponibles y resetea centro/ambiente.
- [ ] Filtro por Centro: al seleccionar, filtra ambientes disponibles y resetea ambiente.
- [ ] Filtro por Ambiente: selección directa sin cascada posterior.
- [ ] Filtros combinados: los 4 filtros se aplican en AND a la lista de fichas.
- [ ] Cada filtro usa el componente `SearchableSelect` con input de búsqueda que filtra opciones mientras se escribe.
- [ ] Trigger rediseñado: label uppercase, chevron indicator, borde púrpura con fondo sutil cuando activo, botón X para limpiar.
- [ ] Dropdown del SearchableSelect: `w-72`, `max-h-48`, input con icono Search dentro, opción "Todos" separada con border-b.
- [ ] Opciones en dropdown con `truncate` + `title` para nombres largos, opción activa con indicador púrpura.
- [ ] Los 4 filtros agrupados en contenedor `bg-gray-50/60 border border-gray-100 rounded-lg p-2`.
- [ ] Modalidad badge en cards: alineado a la derecha (`justify-between`), con `rounded-lg`.
- [ ] Modalidad badge en tabla: también con `rounded-lg`.
- [ ] `npm run lint` sin errores nuevos.
- [ ] Commit + deploy sync + push.
