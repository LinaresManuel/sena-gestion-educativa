# Agenda del Instructor + Disponibilidad Visual

## Qué

1. **Modal de agenda semanal** en InstructoresView — botón "Ver Agenda" por cada instructor que muestra su calendario de eventos programados (fichas, horas, RAs, estados).
2. **Disponibilidad visual del instructor** en ProgramacionView — al seleccionar un instructor, el grid muestra visualmente si cada franja horaria está disponible según su horario configurado.
3. **Filtro por perfiles académicos** en la selección de instructor dentro del wizard de programación.

## Para qué

- Un instructor debe poder ver en un solo vistazo qué fichas y horarios tiene asignados cada semana, sin salir del módulo de instructores.
- Al programar, el usuario debe ver inmediatamente si un instructor está disponible en una franja horaria según su disponibilidad semanal, no solo al momento de guardar.
- El filtro por perfiles evita asignar instructores que no tengan los perfiles académicos requeridos por la competencia.

## Criterios de aceptación

- [ ] Botón "📅 Ver Agenda" en la columna de acciones de cada instructor en InstructoresView.
- [ ] Modal de agenda con calendario semanal (lun-sáb, 06:00-22:00) en formato read-only.
- [ ] Modal carga eventos desde `GET /api/programacion-eventos?instructorId=X`.
- [ ] Celdas ocupadas muestran: número de ficha, código de RA, estado (PLANIFICADO=azul, EJECUTADO=verde, CANCELADO=rojo).
- [ ] Navegación entre semanas adelante/atrás en el modal de agenda.
- [ ] En ProgramacionView, al seleccionar un instructor, las franjas donde el instructor NO está disponible se muestran con patrón visual distintivo (gris rayado / `bg-striped`).
- [ ] La leyenda del grid incluye el nuevo estado "No disponible".
- [ ] El filtro por perfiles académicos aplica al dropdown de instructores cuando hay una competencia seleccionada.
- [ ] `npm run lint` sin errores nuevos.
- [ ] Commit + deploy sync + push.
