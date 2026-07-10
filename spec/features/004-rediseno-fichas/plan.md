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
  className="grid gap-1 overflow-x-auto select-none"
  style={{ gridTemplateColumns: `60px repeat(6, 1fr)` }}
  onMouseUp={handleCellMouseUp}
  onMouseLeave={handleCellMouseUp}
>
  <div />
  {DIAS_VISIBLES.map(d => (
    <div key={d} className="text-center text-[10px] font-semibold text-gray-600 py-1.5">
      {d.slice(0, 3)}
    </div>
  ))}

  {HORAS.map(hora => (
    <div key={hora} className="contents">
      <div className="text-[10px] text-gray-500 font-mono pr-1 text-right flex items-center justify-end h-6">
        {hora.split('-')[0]}
      </div>
      {DIAS_VISIBLES.map(dia => {
        const selected = horario[dia]?.includes(hora);
        return (
          <div
            key={`${dia}-${hora}`}
            onMouseDown={() => handleCellMouseDown(dia, hora)}
            onMouseEnter={() => handleCellMouseEnter(dia, hora)}
            className={`rounded-md border transition-all duration-100 cursor-pointer h-6
              ${selected
                ? 'bg-purple-500/20 border-purple-400'
                : 'bg-gray-50/80 border-gray-200 hover:bg-purple-50 hover:border-purple-300'
              }`}
          />
        );
      })}
    </div>
  ))}
</div>
```

**Click-and-drag rectangular (rango días × horas):**

```typescript
const isDragging = useRef(false);
const dragStart = useRef<{ dia: string; hora: string } | null>(null);
const dragEnd = useRef<{ dia: string; hora: string } | null>(null);

function handleCellMouseDown(dia: string, hora: string) {
  isDragging.current = true;
  dragStart.current = { dia, hora };
  dragEnd.current = { dia, hora };
}

function handleCellMouseEnter(dia: string, hora: string) {
  if (!isDragging.current) return;
  dragEnd.current = { dia, hora };
}

function handleCellMouseUp() {
  if (!isDragging.current) return;
  isDragging.current = false;
  const start = dragStart.current;
  const end = dragEnd.current;
  if (!start || !end) return;

  const [minD, maxD] = [DIAS_VISIBLES.indexOf(start.dia), DIAS_VISIBLES.indexOf(end.dia)].sort();
  const [minH, maxH] = [HORAS.indexOf(start.hora), HORAS.indexOf(end.hora)].sort();

  // Click simple → toggle individual
  if (start.dia === end.dia && start.hora === end.hora) {
    toggleHour(start.dia, start.hora);
    return;
  }

  // Rango rectangular
  const action = horario[start.dia]?.includes(start.hora) ? 'deselect' : 'select';
  setHorario(prev => {
    const clone = { ...prev };
    for (let d = minD; d <= maxD; d++) {
      const dia = DIAS_VISIBLES[d];
      if (!clone[dia]) clone[dia] = [];
      for (let hh = minH; hh <= maxH; hh++) {
        const hora = HORAS[hh];
        if (action === 'select' && !clone[dia].includes(hora)) clone[dia].push(hora);
        if (action === 'deselect') clone[dia] = clone[dia].filter(x => x !== hora);
      }
    }
    return clone;
  });
}
```

**Estados visuales de las celdas:**

| Estado | Fondo | Borde |
|---|---|---|
| No seleccionada | `bg-gray-50/80` | `border-gray-200` |
| Hover (no selec.) | `hover:bg-purple-50` | `hover:border-purple-300` |
| Seleccionada | `bg-purple-500/20` | `border-purple-400` |

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
