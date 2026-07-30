# Plan — Informe Innovación Administrativa

## Estrategia

Documento Markdown autocontenido en la raíz del proyecto. No requiere cambios en código fuente, solo creación de un archivo `.md` y los artefactos de especificación.

## Fuentes de datos por sección

| Sección | Fuente principal | Datos extraídos |
|---|---|---|
| 1. Encabezado y Resumen Ejecutivo | `spec/constitution/mission.md`, `roadmap.md` | Misión del proyecto, propuesta de valor, fases completadas |
| 2. Introducción y Alcance | `mission.md`, sidebar de `App.tsx` | 11 módulos del sistema, roles de usuario |
| 3. Requisitos Funcionales | Specs 001-009, endpoints de `server.ts` | 92 endpoints, 43 permisos, 11 módulos |
| 4. Requisitos No Funcionales | `tech-stack.md`, `config.ts`, middlewares | JWT, Helmet, Rate Limit, SQLite WAL |
| 5. Arquitectura y Diseño Técnico | `package.json`, `schema.ts`, `App.tsx`, `modules/index.ts` | 22 tablas, stack completo, 17 rutas |
| 6. Pruebas y QA | `AGENTS.md`, scripts de verificación | Estrategia manual, scripts `verify-permissions.ts`, `test-permissions.ts` |
| 7. Despliegue | `DEPLOYMENT.md`, scripts PowerShell | NSSM, deploy automatizado, backup programado |
| 8. Manuales | Referencia externa | Nota sobre manual de usuario independiente |
| 9. Conclusiones y Trabajo Futuro | `roadmap.md` Fase 3 | Tema oscuro, vista calendario, reportes exportables |

## Archivos a crear/modify

| Archivo | Acción |
|---|---|
| `spec/features/010-informe-innovacion/spec.md` | Crear |
| `spec/features/010-informe-innovacion/plan.md` | Crear |
| `spec/features/010-informe-innovacion/tasks.md` | Crear |
| `INFORME_INNOVACION_ADMINISTRATIVA.md` | Crear (raíz del proyecto) |

## Lo que NO cambia

- Código fuente TypeScript (ningún archivo en `src/`)
- Schema de base de datos
- Configuración de build o dependencias
- Scripts existentes
- Documentación existente en `docs/`
