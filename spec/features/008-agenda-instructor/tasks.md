# Tasks — Agenda del Instructor + Disponibilidad Visual

## InstructoresView — Botón "Ver Agenda"

- [ ] Agregar import de `Calendar` a los iconos de lucide-react.
- [ ] Agregar estados: `showAgendaModal`, `agendaInstructor`, `agendaEvents`, `agendaWeekStart`.
- [ ] Agregar función `handleVerAgenda(inst)` que setea el instructor y la semana actual.
- [ ] Agregar función `handleCloseAgenda()` que resetea estados.
- [ ] Agregar función `moveAgendaWeek(delta)` que desplaza la semana.
- [ ] Agregar botón "📅" con `title="Ver Agenda"` en la columna de acciones.
- [ ] useEffect que carga `GET /api/programacion-eventos?instructorId=X` al abrir el modal.

## InstructoresView — Modal de agenda

- [ ] Modal con `backdrop-blur-sm bg-white/30`, `max-w-5xl`.
- [ ] Header: "Agenda — [Nombre Instructor]" + navegación de semanas (◀ ▶) + botón X.
- [ ] Grid read-only: `gap-0.5`, `32px repeat(6, 1fr)`, `h-4`, Lun-Sáb, 06:00-22:00.
- [ ] Celdas ocupadas con color según estado (PLANIFICADO=azul, EJECUTADO=verde, CANCELADO=rojo).
- [ ] Celdas ocupadas muestran número de ficha y código RA.
- [ ] Footer con botón "Cerrar".
- [ ] Reutilizar constantes `DIAS_VISIBLES` y `HORAS` del mismo archivo.

## ProgramacionView — Disponibilidad visual del instructor

- [ ] Agregar `instructorSeleccionado` y `instructorHorario` como valores derivados.
- [ ] En el render de celdas, verificar si la hora está en el horario del instructor.
- [ ] Si la celda está en ficha horario pero NO en instructor horario → mostrar como "no disponible".
- [ ] Usar patrón visual como `bg-[repeating-linear-gradient(...)]` o clase distintiva.
- [ ] Actualizar la leyenda debajo del grid para incluir el estado "No disponible".
- [ ] Verificar que las celdas "no disponible" no sean seleccionables.

## ProgramacionView — Filtro por perfiles

- [ ] Modificar `instructoresFiltrados` para aplicar filtro por `perfilesCompatibles`.
- [ ] El filtro solo aplica cuando hay una competencia seleccionada.
- [ ] Un instructor debe tener al menos un perfil compatible para aparecer en el dropdown.

## Verificación

- [ ] `npm run lint` — sin errores nuevos.
- [ ] Probar: ver agenda de instructor, navegar semanas, colores de estado.
- [ ] Probar: seleccionar instructor en programación -> ver disponibilidad visual.
- [ ] Probar: filtro por perfiles funciona correctamente.
- [ ] Commit + deploy sync + push.
