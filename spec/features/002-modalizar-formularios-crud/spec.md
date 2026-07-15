# Modalizar Formularios CRUD

## Qué

Convertir los formularios inline (panel lateral persistente) de los 6 módulos CRUD restantes —Regionales, Centros, Ambientes, TiposAmbiente, Programas e Instructores— a modales emergentes, siguiendo el mismo patrón ya implementado en `PerfilesAcademicosView`.

Queda excluido de esta tarea el módulo FichasView, que será abordado en un plan de feature aparte.

## Para qué

- **Espacio en pantalla:** El formulario lateral ocupa permanentemente ~1/3 del ancho en `md:grid-cols-3`, comprimiendo la tabla de datos y obligando a scroll horizontal en pantallas de 14".
- **Visibilidad de datos:** Con el modal, la tabla siempre ocupa el ancho completo. El formulario solo aparece cuando el usuario explícitamente crea o edita un registro.
- **Experiencia moderna:** El modal con `backdrop-blur-sm` (sin overlay oscuro) se siente más ligero y contemporáneo que el panel lateral fijo.

## Criterios de aceptación (Definition of Done)

- [ ] Los 6 módulos usan modal para creación y edición, no panel lateral.
- [ ] El modal usa `backdrop-blur-sm bg-white/30` como fondo (sin `bg-black bg-opacity-50`).
- [ ] La tabla de datos siempre ocupa el ancho completo disponible (sin grid partido).
- [ ] El botón "Nuevo" / "Agregar" está visible en la cabecera (sujeto a `mayCrear`).
- [ ] Los botones de editar (Pencil) abren el mismo modal en modo edición.
- [ ] El modal tiene header sticky, cuerpo scrolleable y footer con botones.
- [ ] La lógica de negocio (validaciones, dependencias, notificaciones, ConfirmDialog) se preserva intacta.
- [ ] `npm run lint` sin errores nuevos.
- [ ] Commit + deploy sync + push.
