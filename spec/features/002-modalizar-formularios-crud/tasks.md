# Tasks — Modalizar Formularios CRUD

## Orden de implementacion

### 1. RegionalesView (plantilla reusable)

- [ ] Agregar estado `showForm` y `error`
- [ ] Reemplazar grid `md:grid-cols-3` por ancho completo
- [ ] Extraer formulario inline a modal con `backdrop-blur-sm bg-white/30`
- [ ] Implementar `handleClose()` que oculta modal y resetea estado
- [ ] Boton "Agregar" en cabecera que abre modal (sujeto a `mayCrear`)
- [ ] Boton de editar (Pencil) abre modal en modo edicion
- [ ] Preservar validaciones y notificaciones

### 2. TiposAmbienteView

- [ ] Repetir el mismo patron que RegionalesView
- [ ] Modal con campos: nombre, descripcion

### 3. CentrosView

- [ ] Repetir el mismo patron que RegionalesView
- [ ] Modal con campos: codigo, nombre, regional (select)
- [ ] Select de regionales carga desde state existente

### 4. AmbientesView

- [ ] Repetir el mismo patron que RegionalesView
- [ ] Modal con campos: centroId, codigo, nombre, capacidad, tipoAmbienteId, ubicacion, estado
- [ ] Selects anidados (centro depende de regional)

### 5. ProgramasView

- [ ] Repetir el mismo patron que RegionalesView
- [ ] Modal con scroll interno (max-h-[85vh] overflow-y-auto)
- [ ] Campos: denominacion, codigo, version, horasLectiva, horasProductiva, tipoPrograma
- [ ] Soporte para subida de PDF (pdfDocument)

### 6. InstructoresView

- [ ] Repetir el mismo patron que RegionalesView
- [ ] Modal con campos: documento, nombres, apellidos, tipoVinculacion, estado
- [ ] Checkbox de perfiles academicos dentro del modal

### Verificacion final

- [ ] `npm run lint` sin errores nuevos
- [ ] Commit + deploy sync + push
