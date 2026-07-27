# Plan — Agenda del Instructor + Disponibilidad Visual

## Estrategia técnica

Dos archivos a modificar: `InstructoresView.tsx` y `ProgramacionInstructoresView.tsx`.

### 1. InstructoresView — Botón "Ver Agenda" + modal

**Nuevo estado:**
```typescript
const [showAgendaModal, setShowAgendaModal] = useState(false);
const [agendaInstructor, setAgendaInstructor] = useState<Instructor | null>(null);
const [agendaEvents, setAgendaEvents] = useState<any[]>([]);
const [agendaWeekStart, setAgendaWeekStart] = useState(() => getMonday(new Date()));
```

**Nuevas funciones:**
```typescript
function handleVerAgenda(inst: Instructor) { ... }
function handleCloseAgenda() { ... }
function moveAgendaWeek(delta: number) { ... }
```

**Nuevo botón en la tabla** (columna acciones, junto a editar/eliminar):
```tsx
<button onClick={() => handleVerAgenda(a)} title="Ver Agenda">
  <Calendar className="w-4 h-4" />
</button>
```

**Modal de agenda** con:
- Header: "Agenda — [Nombre Instructor]" + navegación de semanas.
- Grid read-only con `gap-0.5 select-none border rounded-lg p-1.5 bg-gray-50/50`.
- Columnas: LUN, MAR, MIE, JUE, VIE, SAB.
- Filas: 06:00-22:00 (16 bloques).
- Celdas ocupadas: muestran código de ficha + código RA + estado coloreado.
- Footer con botón "Cerrar".

**Reutiliza constantes** `DIAS_VISIBLES` y `HORAS` (ya existen en el archivo).

### 2. ProgramacionView — Disponibilidad visual del instructor

**Nuevo valor derivado:**
```typescript
const instructorSeleccionado = useMemo(
  () => instructores.find(i => i.id === Number(instructorId)),
  [instructores, instructorId]
);
const instructorHorario = instructorSeleccionado?.horario ?? {};
```

**Nuevo estado visual en el render de celdas:**

Agregar un caso antes del render de "slot vacío disponible":

```tsx
const isInFichaHorario = fichaHorario[dia]?.includes(hora) ?? false;
const isInstructorDisponible = !instructorId || instructorHorario[dia]?.includes(hora) ?? true;
```

Cuando `isInFichaHorario && !isInstructorDisponible` → mostrar celda con patrón "no disponible" (ej: `bg-gray-100 border-gray-200 bg-striped`).

Usar CSS pseudo-element o clase utilitaria para el patrón rayado.

### 3. ProgramacionView — Filtro por perfiles

Modificar `instructoresFiltrados` para incluir el filtro por `perfilesCompatibles`:

```typescript
const instructoresFiltrados = useMemo(() => {
  let list = instructores;
  if (currentFicha) {
    list = list.filter(i => i.centroFormacionId === currentFicha.centroFormacionId);
  }
  if (competenciaId && perfilesCompatibles.length > 0) {
    list = list.filter(i => {
      const ids = i.perfiles?.map((p: any) => p.id) ?? [];
      return perfilesCompatibles.some((pc: number) => ids.includes(pc));
    });
  }
  return list;
}, [instructores, currentFicha, competenciaId, perfilesCompatibles]);
```

### Archivos a modificar/crear

| Archivo | Cambio |
|---|---|
| `src/components/InstructoresView.tsx` | + Botón "Ver Agenda", + modal con grid semanal, + fetch eventos |
| `src/components/ProgramacionInstructoresView.tsx` | + Disponibilidad visual del instructor, + filtro por perfiles, + leyenda actualizada |
| `spec/features/008-agenda-instructor/spec.md` | Crear |
| `spec/features/008-agenda-instructor/plan.md` | Crear |
| `spec/features/008-agenda-instructor/tasks.md` | Crear |

### Lo que NO cambia

- Schema BD
- API endpoints
- Lógica de guardado/conflictos
- Permisos
- Drag-select / draft cells
- SearchableSelect
- ConfirmDialog
