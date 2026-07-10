# Plan — Rediseño Fichas

## Estrategia técnica

Un solo archivo a modificar: `src/components/FichasView.tsx`.

### 1. Modal para crear/editar

Mismo patrón que RegionalesView, CentrosView, AmbientesView, etc.:

- Agregar estados: `showForm: boolean`, `error: string | null`, `saving: boolean`.
- Agregar función `handleClose()` que resetea todos los campos y cierra el modal.
- Reemplazar el grid partido `lg:grid-cols-3` por layout de ancho completo.
- El modal usa `backdrop-blur-sm bg-white/30` (sin `bg-black bg-opacity-50`).
- Header sticky con título dinámico y botón X.
- Cuerpo scrolleable (`max-h-[85vh] overflow-y-auto`).

### 2. Selector de horario: Cuadrícula semanal

Inspirado en `weekly-time-matrix.tsx` del proyecto de referencia `diseno-cronograma`.

**Layout CSS Grid:**

```tsx
<div
  className="grid gap-1.5 overflow-x-auto select-none"
  style={{ gridTemplateColumns: `70px repeat(6, 1fr)` }}
  onMouseUp={() => { isDragging.current = false; }}
  onMouseLeave={() => { isDragging.current = false; }}
>
  {/* Header: esquina vacía + días */}
  <div />
  {DIAS_VISIBLES.map(d => (
    <div key={d} className="text-center text-xs font-semibold text-gray-600 py-2">
      {d.slice(0, 3)}
    </div>
  ))}

  {/* Filas */}
  {HORAS.map(hora => (
    <>
      <div className="text-[11px] text-gray-500 font-mono pr-2 text-right flex items-center justify-end h-8">
        {hora.split('-')[0]}
      </div>
      {DIAS_VISIBLES.map(dia => {
        const selected = horario[dia]?.includes(hora);
        return (
          <div
            key={`${dia}-${hora}`}
            onMouseDown={() => handleCellMouseDown(dia, hora)}
            onMouseEnter={() => handleCellMouseEnter(dia, hora)}
            className={`rounded-lg border-2 transition-all duration-100 cursor-pointer h-8
              ${selected
                ? 'bg-purple-500/20 border-purple-400 shadow-sm'
                : 'bg-gray-50/80 border-gray-200 hover:bg-purple-50 hover:border-purple-300'
              }`}
          />
        );
      })}
    </>
  ))}
</div>
```

**Click-and-drag con refs:**

```typescript
const isDragging = useRef(false);
const dragAction = useRef<'select' | 'deselect' | null>(null);

function handleCellMouseDown(dia: string, hora: string) {
  const currentlySelected = horario[dia]?.includes(hora) ?? false;
  dragAction.current = currentlySelected ? 'deselect' : 'select';
  isDragging.current = true;
  toggleHour(dia, hora);
}

function handleCellMouseEnter(dia: string, hora: string) {
  if (!isDragging.current) return;
  const targetState = dragAction.current === 'select';
  const isCurrently = horario[dia]?.includes(hora) ?? false;
  if (isCurrently !== targetState) toggleHour(dia, hora);
}

// En el JSX del grid: onMouseUp y onMouseLeave en el contenedor limpian drag.
```

**Estados visuales de las celdas:**

| Estado | Fondo | Borde | Sombra |
|---|---|---|---|
| No seleccionada | `bg-gray-50/80` | `border-gray-200` | — |
| Hover (no selec.) | `hover:bg-purple-50` | `hover:border-purple-300` | — |
| Seleccionada | `bg-purple-500/20` | `border-purple-400` | `shadow-sm` |
| Arrastre sobre selec. | `bg-purple-500/30` | `border-purple-500` | `shadow-md` |

### 3. Filtro por programa

```typescript
const [filtroProgramaId, setFiltroProgramaId] = useState("");

const fichasFiltradas = fichas.filter(f =>
  !filtroProgramaId || f.programaId === Number(filtroProgramaId)
);
```

Select ubicado entre el header y la grilla de fichas, alineado a la izquierda con label "Programa:".
Se actualiza en tiempo real (sin botón de aplicar).

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/FichasView.tsx` | Modal + cuadrícula semanal + filtro (único archivo) |

### Lo que NO cambia

- Modelo de datos / API / esquema BD
- Permisos (`fichas.*`)
- ConfirmDialog para eliminaciones
- Ruteo / Sidebar / App.tsx
