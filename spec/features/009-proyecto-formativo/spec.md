# Gestión de Proyecto Formativo por Ficha

## Qué

Reestructurar la lógica de creación y asignación del Proyecto Formativo, desvinculando el `% de ejecución directa` de la Competencia y asociándolo a la Ficha. Implementar una interfaz dedicada para mapear RAPs por Etapa para cada Proyecto Formativo.

1. **Nuevas tablas**: `proyectos_formativos` y `proyecto_etapas_raps`.
2. **Vista dedicada** (pantalla completa) para gestionar el proyecto formativo de cada ficha.
3. **Reubicación del % ejecución directa** de competencias → proyecto formativo.

## Para qué

- Cada ficha tiene un único proyecto formativo con etapas.
- Un RAP de una misma competencia puede pertenecer a diferentes etapas.
- El cálculo de horas directas en la programación debe usar el % definido a nivel de ficha.

## Criterios de aceptación

- [ ] `porcentajeHorasDirectas` eliminado de la tabla `competencias`.
- [ ] Nueva tabla `proyectos_formativos` con FK a `fichas` (1:1) y `porcentajeEjecucionDirecta`.
- [ ] Nueva tabla `proyecto_etapas_raps` con FK a `proyectos_formativos`, `etapa` y `resultadoId`.
- [ ] Endpoints CRUD para proyecto formativo y asignación de RAPs por etapa.
- [ ] Ruta `/fichas/:fichaId/proyecto-formativo` que NO aparece en el sidebar.
- [ ] Botón "Proyecto" en la card y tabla de fichas que navega a la nueva ruta.
- [ ] Vista `ProyectoFormativoView` con info de ficha, % ejecución directa, pestañas por etapa y checkboxes de RAPs.
- [ ] Modal de competencias (CurriculoModal) sin el campo % ejecución directa.
- [ ] Programación lee el % desde el proyecto formativo de la ficha.
- [ ] Seed actualizado: proyectos formativos con RAPs distribuidos por etapa según su `fase`.
- [ ] `npm run lint` sin errores nuevos.
- [ ] Commit + deploy sync + push.
