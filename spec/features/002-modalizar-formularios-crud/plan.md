# Plan — Modalizar Formularios CRUD

## Estrategia técnica

Para cada uno de los 6 módulos, se aplica el mismo patrón de refactorización:

1. Agregar estado `showForm: boolean` para controlar visibilidad del modal.
2. Reemplazar el grid partido (`md:grid-cols-3`) por ancho completo.
3. Extraer el formulario inline a un modal con `backdrop-blur-sm` (sin overlay oscuro).
4. El modal tiene header sticky, cuerpo scrolleable y footer fijo con botones.
5. La tabla pasa a ocupar siempre `col-span-3` (ancho completo).

## Patrón de modal (consistente)

```tsx
{showForm && (
  <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50"
    onClick={handleClose}>
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
      onClick={e => e.stopPropagation()}>
      {/* Header sticky */}
      <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
        <h3 className="text-lg font-semibold">
          {editingId ? 'Editar' : 'Nuevo'} {nombreEntidad}
        </h3>
        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* campos específicos del módulo */}
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <button type="button" onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
            Cancelar
          </button>
          <button type="submit" disabled={saving || !isValid}
            className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50">
            {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

## Archivos a modificar

| Archivo | Líneas form inline | Complejidad | Campos |
|---|---|---|---|
| `src/components/RegionalesView.tsx` | ~39 | Baja | codigo, nombre |
| `src/components/TiposAmbienteView.tsx` | ~39 | Baja | nombre, descripcion |
| `src/components/CentrosView.tsx` | ~54 | Baja | codigo, nombre, regionalId (select) |
| `src/components/AmbientesView.tsx` | ~63 | Media | centroId, codigo, nombre, capacidad, tipoAmbienteId, ubicacion, estado |
| `src/components/ProgramasView.tsx` | ~57 | Media | denominacion, codigo, version, horasLectiva, horasProductiva, tipoPrograma, pdfDocument |
| `src/components/InstructoresView.tsx` | ~65 | Media | documento, nombres, apellidos, tipoVinculacion, estado, perfiles (checkbox) |

## Lo que NO cambia

- Permisos (`useHasPermission`, `mayCrear`/`mayEditar`/`mayEliminar`/`hayAcciones`)
- Validaciones de negocio (unicidad de código, etc.)
- ConfirmDialog para eliminaciones con verificación de dependencias
- Notificaciones toast/success/error
- Ruteo (`App.tsx` no se toca)
- Sidebar

## Diseño del backdrop

A diferencia del modal tradicional con `bg-black bg-opacity-50`, se usará `backdrop-blur-sm bg-white/30` que:
- Desenfoca suavemente el fondo (efecto vidrio)
- No oscurece la interfaz
- Mantiene el foco visual en el modal
