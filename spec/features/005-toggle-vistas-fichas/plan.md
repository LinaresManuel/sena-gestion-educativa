# Plan — Toggle Cards/Tabla + Modal Ver Detalles

## Estrategia técnica

Un solo archivo a modificar: `src/components/FichasView.tsx`.

### 1. Nuevos estados

```typescript
const [vista, setVista] = useState<'cards' | 'tabla'>('cards');
const [showDetallesModal, setShowDetallesModal] = useState(false);
const [detallesFicha, setDetallesFicha] = useState<Ficha | null>(null);
```

### 2. Toggle en toolbar

Dos botones inline con fondo `bg-gray-100 rounded-lg p-0.5`:

```
[ ⊞ Cards ] [ ⊟ Tabla ]
```

El botón activo tiene `bg-white text-gray-900 shadow-sm`, el inactivo `text-gray-500 hover:text-gray-700`.

Se insertan entre el filtro de programa y el botón "Nueva Ficha".

### 3. Vista tabla

Render condicional dentro del contenedor de fichas:

```tsx
{vista === 'cards' ? (
  // ... grid actual de cards ...
) : (
  <div className="overflow-x-auto bg-white rounded-xl border">
    <table className="w-full text-sm">
      <thead>
        <tr>N° Ficha | Programa | Modalidad | Acciones</tr>
      </thead>
      <tbody>
        fichasFiltradas.map(ficha => <tr>...</tr>)
      </tbody>
    </table>
  </div>
)}
```

La fila de tabla:

```tsx
<tr key={ficha.id} className="border-b last:border-0 hover:bg-gray-50 transition">
  <td className="px-4 py-3 font-medium">ficha.numeroFicha</td>
  <td className="px-4 py-3 max-w-[300px] truncate">programa.denominacion</td>
  <td className="px-4 py-3">badge modalidad</td>
  <td className="px-4 py-3">iconos ✏️ 🗑️ 👁️ siempre visibles</td>
</tr>
```

### 4. Modal "Ver Detalles"

Mismo patrón que el modal de creación (`max-w-5xl`, `lg:grid-cols-2 gap-6`), read-only:

- **Header**: título "Detalles — Ficha XXXXXX", botón X.
- **Lado izquierdo**: cada campo se renderiza como `<label>` + `<span>` con `bg-gray-50/50 rounded-lg border`.
- **Lado derecho**: cuadrícula de horario idéntica a la de creación (grid `32px repeat(6, 1fr)`, `gap-0.5`, `h-4`), sin handlers de mouse.
- **Footer**: botón "Cerrar".

Funciones:

```typescript
function handleVerDetalles(ficha: Ficha) {
  setDetallesFicha({
    ...ficha,
    horario: typeof ficha.horario === 'string' ? JSON.parse(ficha.horario) : ficha.horario,
  });
  setShowDetallesModal(true);
}

function handleCloseDetallesModal() {
  setShowDetallesModal(false);
  setDetallesFicha(null);
}
```

### 5. Vista cards

No se modifica. Solo se envuelve el grid existente en `{vista === 'cards' && (...)}` para que no se renderice cuando la vista es tabla. El botón "Ver Horario" y su modal read-only angosto (`max-w-lg`) se mantienen intactos.

### 6. Filtros combinados regional / centro / ambiente

Nuevos estados:

```typescript
const [filtroRegionalId, setFiltroRegionalId] = useState("");
const [filtroCentroId, setFiltroCentroId] = useState("");
const [filtroAmbienteId, setFiltroAmbienteId] = useState("");
```

Fetch de regionales en useEffect + función `fetchRegionales()`.

**Cascada:**

```typescript
function handleRegionalChange(val: string) {
  setFiltroRegionalId(val);
  setFiltroCentroId("");
  setFiltroAmbienteId("");
}
function handleCentroChange(val: string) {
  setFiltroCentroId(val);
  setFiltroAmbienteId("");
}
```

**Listas derivadas:**

```typescript
const centrosFiltrados = centros.filter(c => !filtroRegionalId || c.regionalId === Number(filtroRegionalId));
const ambientesFiltrados = ambientes.filter(a => !filtroCentroId || a.centroId === Number(filtroCentroId));
```

**Filtrado combinado (AND):**

```typescript
const fichasFiltradas = fichas.filter(f => {
  if (filtroProgramaId && f.programaId !== Number(filtroProgramaId)) return false;
  if (filtroRegionalId) {
    const c = centros.find(c => c.id === f.centroFormacionId);
    if (!c || c.regionalId !== Number(filtroRegionalId)) return false;
  }
  if (filtroCentroId && f.centroFormacionId !== Number(filtroCentroId)) return false;
  if (filtroAmbienteId && f.ambienteId !== Number(filtroAmbienteId)) return false;
  return true;
});
```

**Toolbar reorganizado (dos filas):**

```tsx
// Fila 1
<div className="flex justify-between ...">
  <h1> + <p>
  <button>Nueva Ficha</button>
</div>

// Fila 2
<div className="flex items-center flex-wrap gap-2">
  <select>Programa</select>
  <select>Regional</select>
  <select>Centro</select>
  <select>Ambiente</select>
  <div class="ml-auto">Toggle cards/tabla</div>
</div>
```

### 7. SearchableSelect — filtros escribibles

Crear `src/components/SearchableSelect.tsx`:

```tsx
interface Props {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}
```

Comportamiento:
- Trigger con icono Search + texto de opción seleccionada (o placeholder).
- Al hacer clic: dropdown con input de búsqueda que filtra opciones.
- `useEffect` con `mousedown` para cerrar al hacer clic fuera.
- Opción activa (value === props.value) con `bg-purple-100 text-purple-700`.
- "Sin resultados" cuando el filtro no encuentra coincidencias.

Reemplazar los 4 `<select>` del toolbar:

```tsx
<SearchableSelect
  value={filtroProgramaId}
  onChange={v => setFiltroProgramaId(v)}
  options={[
    { value: "", label: "Programa: Todos" },
    ...programas.map(p => ({ value: String(p.id), label: p.denominacion })),
  ]}
/>
```

### 8. Modalidad badge

- En cards: `justify-between` (ficha a la izquierda, modalidad a la derecha).
- Badge con `rounded-lg` para consistencia con el badge de ficha.
- También aplicado en la vista tabla.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/SearchableSelect.tsx` | **Crear** — componente select con búsqueda |
| `src/components/FichasView.tsx` | Reemplazar 4 `<select>` por `<SearchableSelect>`, importar componente |

### Lo que NO cambia

- API / BD / backend
- Permisos (`fichas.*`)
- Modal de creación existente
- Modal read-only de horario (el angosto de la vista cards)
- Drag preview
- ConfirmDialog para eliminaciones
