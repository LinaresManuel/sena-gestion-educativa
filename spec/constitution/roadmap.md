# Roadmap de Features

> **Estado actual del proyecto**: El sistema se encuentra en producción activa. Las fases 1 y 2 están completadas. La Fase 3 representa el trabajo continuo de estabilización y evolución.

---

## Fase 1 — Fundaciones y Configuración Inicial ✅ *(Completada)*

| Sprint | Artefacto | Descripción |
|---|---|---|
| 1.1 | Infraestructura base | Proyecto React + Vite + Express + SQLite + Drizzle. Schema de 15 tablas. Migraciones con `drizzle-kit`. |
| 1.2 | Autenticación | JWT en cookie httpOnly. Login/logout, rate limiting, seed de admin con contraseña temporal. |
| 1.3 | Sistema de permisos | 39 permisos en 10 módulos. Tablas `permisos`, `roles_permisos`, `usuarios_roles`. 5 roles por defecto. |
| 1.4 | Layout y shell | Sidebar con navegación condicional por permisos. Ruteo con `RequireAuth` / `RequirePermission`. Sesión vía `/api/auth/me`. |
| 1.5 | Despliegue Windows | Scripts PowerShell (NSSM, firewall, backup, deploy). Servicio `SenaSchedule` con auto-restart. |

**Entregables**: App funcionando en localhost:3000 con login, seed de datos demo, y despliegue como servicio de Windows.

---

## Fase 2 — Core Features ✅ *(Completada)*

| Sprint | Módulo | Descripción |
|---|---|---|
| 2.1 | Regionales | CRUD completo con permisos `regionales.*`. |
| 2.2 | Centros de Formación | CRUD con dependencia de regional (FK). Permisos `centros.*`. |
| 2.3 | Ambientes y Tipos de Ambiente | CRUD de ambientes con capacidad, estado, tipo. FK a centro. Tipos de ambiente CRUD separado. |
| 2.4 | Programas y Competencias | CRUD de programas de formación. Currículo con competencias y elementos de ambiente. |
| 2.5 | Instructores | CRUD con perfil de competencias. Asignación programa-instructor. |
| 2.6 | Fichas | CRUD de grupos de aprendices con programa, fecha inicio-fin, instructor asociado. |
| 2.7 | Programación | Asignación de instructores a ambientes en franjas horarias. Vista de horarios. |
| 2.8 | Administración | Panel admin con 3 tabs: estadísticas, roles y permisos, usuarios. CRUD de usuarios. |

**Entregables**: 10 módulos funcionales con CRUD completo, permisos granulares y panel de administración.

---

## Fase 3 — Estabilización, UX y Evolución *(En curso)*

### 3.1 — Mejoras UX/UI (Prioridad alta)

| Item | Descripción | Estado |
|---|---|---|
| Buscador de permisos | Filtro en vivo en editor de roles y permisos | ✅ |
| Presets rápidos | Botones "Solo lectura" y "CRUD completo" | ✅ |
| Badges de conteo | Indicador X/Y seleccionados por módulo | ✅ |
| Layout responsivo | Adaptación a pantallas de 14" y menor resolución | ✅ |
| Compactación UI | Eliminación de redundancias visuales (badges de acción) | ✅ |
| Tema oscuro | Alternativa de esquema de colores oscuro | ⬜ Pendiente |
| Vista calendario | Vista semanal/mensual de programación | ⬜ Pendiente |

### 3.2 — Calidad y Testing

| Item | Descripción | Prioridad |
|---|---|---|
| Pruebas manuales | Checklist de regresión por módulo | Alta |
| Pruebas de integración | Flujo crítico: login → cambio password → CRUD | Media |
| Validación de datos | Mejorar feedback visual en formularios (errores inline) | Media |
| Logs estructurados | Auditoría de operaciones CRUD en base de datos | Baja |

### 3.3 — Operaciones y Mantenimiento

| Item | Descripción | Prioridad |
|---|---|---|
| Respaldo automático | Tarea programada diaria vía `scripts/backup.ps1` | ✅ |
| Monitoreo de logs | Rotación automática de logs (10 MB) | ✅ |
| Health check | Endpoint `/api/health` con uptime y versión | ✅ |
| Script de migración | Actualización de esquema entre versiones | Media |
| Documentación de DR | Procedimiento de recuperación ante falla del nodo | Baja |

### 3.4 — Features futuros (Propuestos)

| Feature | Descripción | Dependencia |
|---|---|---|
| Reportes exportables | Exportar programación a PDF/Excel | — |
| Notificaciones | Alertas por email o notificación in-app para cambios de horario | Servidor SMTP |
| Múltiples centros | Soporte multi-sede con datos aislados | — |
| API REST documentada | Endpoints públicos con OpenAPI/Swagger | — |
| App móvil | Consulta de horarios desde dispositivo móvil | API REST previa |

---

## Criterios de priorización

1. **Estabilidad sobre features** — No introducir nuevas funcionalidades mientras haya bugs conocidos en producción.
2. **UX sobre estética** — Preferir mejoras de usabilidad y eficiencia sobre cambios cosméticos.
3. **Compatibilidad hacia atrás** — Los cambios de esquema BD deben ser aditivos (nuevas columnas/tablas, nunca renombrar o eliminar sin migración).
4. **Seguridad por defecto** — Toda nueva feature debe implementar verificación de permisos y validación de entrada.
