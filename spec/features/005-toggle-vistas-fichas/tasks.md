# Tasks — Toggle Cards/Tabla + Modal Ver Detalles

## Estados y handlers

- [ ] Agregar estado `vista: 'cards' | 'tabla'`
- [ ] Agregar estados `showDetallesModal`, `detallesFicha`
- [ ] Agregar `handleVerDetalles()` que parsea horario y abre modal
- [ ] Agregar `handleCloseDetallesModal()` que resetea estados

## Toggle en toolbar

- [ ] Agregar contenedor `bg-gray-100 rounded-lg p-0.5` con dos botones
- [ ] Botón "⊞ Cards" activo con `bg-white shadow-sm`
- [ ] Botón "⊟ Tabla" activo con `bg-white shadow-sm`
- [ ] `setVista('cards')` / `setVista('tabla')` en cada click

## Vista tabla

- [ ] Render condicional: `vista === 'cards' ? cards : tabla`
- [ ] Tabla dentro de `overflow-x-auto bg-white rounded-xl border`
- [ ] Cabecera: N° Ficha, Programa, Modalidad, Acciones
- [ ] Badge de modalidad coloreado (mismos colores que cards)
- [ ] Programa truncado con `max-w-[300px] truncate` y `title`
- [ ] Columna Acciones: ✏️ 🗑️ 👁️ siempre visibles
- [ ] 👁️ llama a `handleVerDetalles(ficha)`
- [ ] Estado vacío en tabla con icono y mensaje

## Modal Ver Detalles

- [ ] Modal con `backdrop-blur-sm bg-white/30`, `max-w-5xl`
- [ ] Header sticky: título "Detalles — Ficha XXXXXX" + botón X
- [ ] Side-by-side `lg:grid-cols-2 gap-6`
- [ ] Lado izquierdo: todos los campos como `<label>` + `<span>` con fondo `bg-gray-50/50 rounded-lg border`
- [ ] Lado derecho: cuadrícula de horario read-only (sin handlers)
- [ ] Cuadrícula con mismas dimensiones que creación (`32px repeat(6, 1fr)`, `gap-0.5`, `h-4`)
- [ ] Footer con botón "Cerrar"

## Verificación

- [ ] `npm run lint` — sin errores nuevos
- [ ] Probar: toggle entre vistas, tabla muestra datos correctos, modal detalles con horario
- [ ] Commit + deploy sync + push
