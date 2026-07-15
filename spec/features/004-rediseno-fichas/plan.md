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

**Layout side-by-side simétrico:**

El modal usa `max-w-4xl` con `grid grid-cols-1 lg:grid-cols-2 gap-8`. Ambas columnas
tienen un encabezado de sección `text-sm font-semibold border-b pb-2` para simetría visual.

- Columna izquierda: "Datos de la Ficha" — todos los labels a `text-xs font-medium`,
  todos los inputs a `text-sm px-3 py-2` con `focus:ring-2 focus:ring-purple-500/30`.
- Columna derecha: "Horario de Formación" — cuadrícula envuelta en `border rounded-lg p-2 bg-gray-50/50`.

**Layout CSS Grid del horario:**

```tsx
<div
  className="grid gap-1 select-none border rounded-lg p-2 bg-gray-50/50"
  style={{ gridTemplateColumns: `40px repeat(6, 1fr)` }}
  onMouseUp={handleCellMouseUp}
  onMouseLeave={handleCellMouseUp}
>
  <div />
  {DIAS_VISIBLES.map(d => (
    <div key={d} className="text-center text-[10px] font-semibold text-gray-600 leading-none pb-1">
      {d.slice(0, 3)}
    </div>
  ))}

  {HORAS.map(hora => (
    <div key={hora} className="contents">
      <div className="text-[10px] text-gray-500 font-mono text-right flex items-center justify-end pr-1 leading-none">
        {hora.split('-')[0]}
      </div>
      {DIAS_VISIBLES.map(dia => {
        const selected = horario[dia]?.includes(hora);
        const inRange = inPreview && dayIdx >= dragPreview.minDay && dayIdx <= dragPreview.maxDay;
        return (
          <div
            key={`${dia}-${hora}`}
            onMouseDown={() => handleCellMouseDown(dia, hora)}
            onMouseEnter={() => handleCellMouseEnter(dia, hora)}
            className={`rounded border transition-all duration-75 cursor-pointer h-6
              ${inRange
                ? 'bg-purple-500/35 border-purple-500'
                : selected
                  ? 'bg-purple-500/20 border-purple-400'
                  : 'bg-white border-gray-200 hover:bg-purple-50 hover:border-purple-300'
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
| No seleccionada | `bg-white` | `border-gray-200` |
| Hover (no selec.) | `hover:bg-purple-50` | `hover:border-purple-300` |
| Seleccionada | `bg-purple-500/20` | `border-purple-400` |
| Preview (arrastre) | `bg-purple-500/35` | `border-purple-500` |

### 3. Filtro por programa

```typescript
const [filtroProgramaId, setFiltroProgramaId] = useState("");

const fichasFiltradas = fichas.filter(f =>
  !filtroProgramaId || f.programaId === Number(filtroProgramaId)
);
```

Select ubicado entre el header y la grilla de fichas, alineado a la izquierda con label "Programa:".
Se actualiza en tiempo real (sin botón de aplicar).

### 4. Rediseño de card de resumen

Reemplazar la card de `fichasFiltradas.map()` con una nueva estructura:

```tsx
<div key={ficha.id} className="...group">
  {/* Botones de acción hover (Editar / Eliminar) */}
  
  {/* Fila superior: "Ficha XXXXXX" + badge de modalidad coloreado */}
  {/* Modalidad: PRESENCIAL → purple, VIRTUAL → blue, MIXTA → amber */}

  {/* Label "PROGRAMA DE FORMACIÓN" + denominación del programa */}

  {/* Fechas: dos filas Calendar */}
  {/* Lectivo: formatDate(inicio) → formatDate(finLectiva) */}
  {/* Ficha: formatDate(inicio) → formatDate(fin) */}

  {/* Centro (MapPin) y Ambiente (Clock) */}

  {/* Botón "Ver Horario" (Eye) si tiene horario asignado */}
</div>
```

**Helper `formatDate`:**

```typescript
function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
```

Muestra las fechas en formato DD/MM/AAAA en vez de ISO YYYY-MM-DD.

### 5. Modal read-only de horario

Nuevo modal que se abre desde el botón "Ver Horario" de cada card:

```tsx
const [showHorarioModal, setShowHorarioModal] = useState(false);
const [horarioFichaSeleccionada, setHorarioFichaSeleccionada] = useState<Ficha | null>(null);

function handleVerHorario(ficha: Ficha) {
  setHorarioFichaSeleccionada({ ...ficha, horario: parseado });
  setShowHorarioModal(true);
}
```

- Mismo backdrop `backdrop-blur-sm bg-white/30`.
- Ancho: `max-w-lg` (solo la cuadrícula, angosto).
- Título: "Horario — Ficha XXXXXX".
- Info complementaria: programa y ambiente en texto.
- Cuadrícula idéntica a la del modal de creación (grid `32px repeat(6, 1fr)`, `gap-0.5`, `h-4`).
- Celdas sin interacción: sin `onMouseDown/onMouseEnter`, `cursor-default`.
- Footer con botón "Cerrar".

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/FichasView.tsx` | Card + modal read-only + helper formatDate + estado horarioModal |

### Lo que NO cambia

- Modelo de datos / API / esquema BD
- Permisos (`fichas.*`)
- ConfirmDialog para eliminaciones
- Ruteo / Sidebar / App.tsx
- Modal de creación existente (se mantiene intacto)
- Lógica de click-and-drag (se mantiene en modal de edición)
