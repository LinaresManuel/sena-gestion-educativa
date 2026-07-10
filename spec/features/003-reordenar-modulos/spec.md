# Reordenar Módulos por Relación

## Qué

Reorganizar el orden de presentación de los módulos en el sidebar, el dashboard y el registro central de permisos (`PERMISSIONS_BY_MODULE`) para agruparlos por afinidad y relación de datos: Infraestructura, Talento Humano, Oferta Académica y Administración.

## Para qué

- **Navegación intuitiva:** Módulos relacionados aparecen juntos (ej. Instructores y Perfiles Académicos), facilitando la ubicación visual.
- **Coherencia semántica:** El orden refleja la relación padre-hijo y el flujo de trabajo real (primero la infraestructura, luego el talento, luego la oferta académica).
- **Sin cambios funcionales:** Es puramente reordenamiento de bloques JSX y un objeto; no afecta rutas, permisos ni lógica de negocio.

## Criterios de aceptación (Definition of Done)

- [ ] Sidebar ordenado: Regionales → Centros → Ambientes → Tipos Ambiente → Instructores → Perfiles Académicos → Programas → Fichas → Programación → Administración.
- [ ] Dashboard (grid de tarjetas) en el mismo orden que el sidebar.
- [ ] `PERMISSIONS_BY_MODULE` en `src/modules/index.ts` en el mismo orden.
- [ ] `npm run lint` sin errores.
- [ ] Commit + deploy sync + push.
