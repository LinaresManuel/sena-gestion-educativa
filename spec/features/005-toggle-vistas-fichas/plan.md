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

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/FichasView.tsx` | Toggle + tabla + modal detalles |

### Lo que NO cambia

- API / BD / backend
- Permisos (`fichas.*`)
- Modal de creación existente
- Modal read-only de horario (el angosto de la vista cards)
- Drag preview
- ConfirmDialog para eliminaciones
