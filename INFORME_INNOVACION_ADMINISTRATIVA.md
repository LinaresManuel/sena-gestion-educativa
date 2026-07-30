# Evidencia de Innovación Administrativa

**Liderada por el Subdirector Fernando Gonzales Torres**
**Área de Gestión Administrativa**

---

**Sistema:** SENA Gestión Educativa (SenaSchedule)
**Versión en producción:** 1.0
**Fecha del informe:** Julio 2026
**Plataforma tecnológica:** Aplicación Web SPA (Single Page Application)

---

## 1. Resumen Ejecutivo

La plataforma **SENA Gestión Educativa**, denominada técnicamente **SenaSchedule**, representa un hito de innovación tecnológica y administrativa en la gestión operativa del Centro de Formación. Desarrollada bajo la dirección del Subdirector Fernando Gonzales Torres en el Área de Gestión Administrativa, esta solución integral reemplaza los procesos manuales basados en hojas de cálculo aisladas, correos electrónicos dispersos y herramientas sin trazabilidad, por una plataforma web centralizada que administra la infraestructura educativa, el talento humano y la programación académica en un solo entorno accesible desde cualquier dispositivo en la red local.

El sistema cubre la gestión completa de once módulos funcionales: Regionales, Centros de Formación, Ambientes, Tipos de Ambiente, Instructores, Perfiles Académicos, Programas de Formación, Fichas, Programación de Instructores, Proyecto Formativo y Administración del Sistema. Con una arquitectura técnica basada en React 19, Node.js 20, Express y SQLite — gestionada mediante Drizzle ORM — la plataforma opera como una aplicación monolítica desplegada como servicio de Windows, sin necesidad de servidores de base de datos externos, lo que la hace ideal para entornos de red local con recursos limitados. El sistema incluye un mecanismo de autenticación JWT con cookies `httpOnly`, un sistema de permisos granular con 43 permisos distribuidos en 11 módulos, y una API REST con 92 endpoints que garantizan la integridad y seguridad de cada operación.

---

## 2. Introducción y Alcance

### 2.1 Introducción

En el contexto de la gestión administrativa liderada por el Subdirector Fernando Gonzales Torres, se identificó la necesidad de implementar una herramienta tecnológica que centralizara las operaciones académicas y administrativas del Centro de Formación. La gestión fragmentada de la infraestructura, del talento humano y de la programación horaria generaba ineficiencias operativas, pérdida de trazabilidad y riesgos de error en la asignación de recursos.

Como respuesta a esta problemática, se diseñó y desarrolló la plataforma SENA Gestión Educativa (SenaSchedule), una solución de software web que integra todas las dimensiones de la gestión académica en una única plataforma accesible por navegador web. El proyecto se ejecutó siguiendo un enfoque iterativo con especificación previa de cada funcionalidad, desarrollo continuo y despliegue directo en el entorno productivo del centro de formación.

### 2.2 Problema a Resolver

| Problemática identificada | Impacto |
|---|---|
| Hojas de cálculo aisladas para la programación horaria | Sin trazabilidad de cambios, versiones conflictivas, imposibilidad de detectar doble-reservas de ambientes o instructores |
| Correos electrónicos para solicitudes de asignación | Pérdida de información, demoras en la respuesta, ausencia de registro centralizado |
| Falta de control de acceso por función | Cualquier usuario con acceso podía modificar datos críticos sin restricción |
| Ausencia de validación en asignaciones | Errores de programación (instructor en dos lugares simultáneamente, ambiente ocupado en el mismo horario) |
| Procesos manuales de seguimiento académico | Dificultad para evaluar el avance de las fichas y la ejecución del proyecto formativo |

### 2.3 Alcance del Sistema

La plataforma abarca **11 módulos funcionales** organizados en tres categorías:

**Infraestructura (4 módulos):**

| Módulo | Función |
|---|---|
| Regionales | Gestión de las regionales del SENA |
| Centros de Formación | Administración de centros por regional |
| Ambientes | Gestión de ambientes físicos (aulas, talleres, laboratorios) con capacidad, estado y ubicación |
| Tipos de Ambiente | Catálogo de tipos de ambiente (taller, aula, laboratorio, etc.) |

**Oferta Académica y Talento Humano (5 módulos):**

| Módulo | Función |
|---|---|
| Programas de Formación | CRUD de programas con código, versión, horas lectivas y productivas |
| Competencias y Currículo | Gestión de competencias, resultados de aprendizaje y perfiles académicos por programa |
| Instructores | Gestión de instructorado con perfil de competencias, vínculo laboral y horario configurado |
| Perfiles Académicos | Catálogo independiente de perfiles académicos referenciados por competencias e instructores |
| Fichas | Gestión de grupos de aprendices con programa, fechas lectivas, horario y ambiente asignado |

**Programación y Administración (2 módulos):**

| Módulo | Función |
|---|---|
| Programación | Asignación de instructores a ambientes en franjas horarias con validación de conflictos en tiempo real |
| Administración | Gestión de usuarios, roles, permisos y estadísticas del sistema |

---

## 3. Especificación de Requisitos

### 3.1 Requisitos Funcionales (RF)

#### RF-01: Autenticación y Gestión de Sesiones

| RF | Descripción |
|---|---|
| RF-01.1 | El sistema debe permitir el inicio de sesión con nombre de usuario y contraseña |
| RF-01.2 | La contraseña debe ser verificada mediante hash bcrypt |
| RF-01.3 | Al autenticarse, el sistema debe generar un token JWT con TTL configurable |
| RF-01.4 | El token debe almacenarse en una cookie `httpOnly`, `sameSite: 'lax'` |
| RF-01.5 | El sistema debe forzar el cambio de contraseña en el primer inicio de sesión |
| RF-01.6 | El endpoint `/api/auth/me` debe recalcular los permisos del usuario desde la base de datos |
| RF-01.7 | Debe existir un endpoint de cierre de sesión que invalide la cookie |

#### RF-02: Sistema de Permisos Granular

| RF | Descripción |
|---|---|
| RF-02.1 | El sistema debe soportar 43 permisos distribuidos en 11 módulos |
| RF-02.2 | Cada módulo debe tener permisos de acción: ver, crear, editar, eliminar (y roles para admin) |
| RF-02.3 | Los roles deben ser dinámicos, creados desde el panel de administración |
| RF-02.4 | El JWT debe incluir el array de permisos del usuario |
| RF-02.5 | El sidebar debe filtrarse dinámicamente según los permisos del usuario |
| RF-02.6 | La funcionalidad `resolveEffectivePermissions()` debe heredar automáticamente el permiso `ver` cuando el usuario tiene cualquier acción CRUD en un módulo |
| RF-02.7 | Deben existir middlewares backend: `requirePermission`, `requireAnyPermission`, `requireAllPermissions` |
| RF-02.8 | Deben existir hooks React: `useHasPermission`, `useHasAnyPermission`, `useIsAdmin` |

#### RF-03: Gestión de Infraestructura

| RF | Descripción |
|---|---|
| RF-03.1 | CRUD completo de Regionales con código único y nombre |
| RF-03.2 | CRUD completo de Centros de Formación con código único y dependencia de regional |
| RF-03.3 | CRUD completo de Tipos de Ambiente con nombre único |
| RF-03.4 | CRUD completo de Ambientes con código, nombre, capacidad, tipo, estado, ubicación y centro |
| RF-03.5 | CRUD de Elementos de Ambiente (inventario) con placa, nombre, estado y relación con ambiente |
| RF-03.6 | Verificación de dependencias antes de eliminar una entidad (evita eliminación con datos dependientes) |

#### RF-04: Gestión de Programas y Currículo

| RF | Descripción |
|---|---|
| RF-04.1 | CRUD de Programas de Formación con código, versión, horas lectivas/productivas y tipo |
| RF-04.2 | Constraint UNIQUE en combinación `(código, versión)` |
| RF-04.3 | CRUD de Competencias por programa con código, nombre, duración en horas y norma |
| RF-04.4 | Al crear una competencia con código existente, se copian automáticamente sus resultados y perfiles como plantilla |
| RF-04.5 | CRUD de Resultados de Aprendizaje por competencia con código, nombre, duración y fase |
| RF-04.6 | Asignación de Perfiles Académicos a competencias mediante tabla junction |

#### RF-05: Gestión de Instructores

| RF | Descripción |
|---|---|
| RF-05.1 | CRUD de Instructores con documento único, nombres, apellidos, tipo de vínculo y estado |
| RF-05.2 | Asignación de Centro de Formación al instructor (campo `centroFormacionId`) |
| RF-05.3 | Asignación de Perfiles Académicos mediante tabla junction `instructores_perfiles` |
| RF-05.4 | Configuración de horario semanal del instructor (JSON por día de la semana) |
| RF-05.5 | Filtro de instructores por centro de formación |
| RF-05.6 | Botón "Ver Agenda" con visualización semanal de eventos programados |

#### RF-06: Gestión de Fichas

| RF | Descripción |
|---|---|
| RF-06.1 | CRUD de Fichas con número de ficha único, centro, programa, ambiente y fechas |
| RF-06.2 | Configuración de horario semanal mediante cuadrícula visual con selección por click y arrastre |
| RF-06.3 | Validación de disponibilidad de ambiente al crear/editar ficha (fechas + franjas horarias) |
| RF-06.4 | Vista dual: tarjetas (cards) y tabla con toggle |
| RF-06.5 | Filtros combinados por programa, regional, centro y ambiente |
| RF-06.6 | Modal de detalles read-only con visualización del horario |

#### RF-07: Programación de Instructores

| RF | Descripción |
|---|---|
| RF-07.1 | Tabla normalizada `programacion_eventos` con una fila por hora programada |
| RF-07.2 | Constraints UNIQUE que impiden doble-reserva de instructor y ambiente en la misma fecha/hora |
| RF-07.3 | Flujo de selección ficha-first: Regional → Centro → Ficha → Competencia → Instructor |
| RF-07.4 | Calendario con selección rectangular por arrastre (mismo patrón que el editor de horario de fichas) |
| RF-07.5 | Validación server-side de conflictos antes de guardar (rango lectivo, horario, pertenencia a centro) |
| RF-07.6 | Creación masiva (bulk) de eventos en una transacción atómica |
| RF-07.7 | Endpoint de disponibilidad para verificar conflictos en tiempo real |
| RF-07.8 | Panel lateral de RAs con progreso de horas asignadas vs. requeridas |
| RF-07.9 | Ciclo de estado por evento: PLANIFICADO → EJECUTADO → CANCELADO |

#### RF-08: Proyecto Formativo

| RF | Descripción |
|---|---|
| RF-08.1 | Tabla `proyectos_formativos` con relación 1:1 con fichas |
| RF-08.2 | Porcentaje de ejecución directa definido a nivel de ficha (no de competencia) |
| RF-08.3 | Tabla `proyecto_etapas_raps` con asignación de resultados de aprendizaje por etapa |
| RF-08.4 | Vista dedicada `ProyectoFormativoView` con pestañas por etapa (Análisis, Planeación, Ejecución, Evaluación, Complementario) |
| RF-08.5 | Navegación desde la card y tabla de fichas hacia la vista de proyecto formativo |

#### RF-09: Administración del Sistema

| RF | Descripción |
|---|---|
| RF-09.1 | Panel de administración con pestañas: Estadísticas, Roles y Permisos, Usuarios |
| RF-09.2 | CRUD de usuarios con asignación de roles |
| RF-09.3 | CRUD de roles personalizados con asignación de permisos por módulo |
| RF-09.4 | Reset de contraseñas desde el panel de administración |
| RF-09.5 | Endpoint de estadísticas del sistema (`/api/admin/stats`) |
| RF-09.6 | Notificaciones en tiempo real vía SSE para cambios de permisos |

### 3.2 Requisitos No Funcionales (RNF)

| RNF | Categoría | Descripción | Implementación |
|---|---|---|---|
| RNF-01 | Seguridad | Autenticación con tokens JWT en cookie `httpOnly` | `jsonwebtoken` + `cookie-parser`, TTL configurable |
| RNF-02 | Seguridad | Cabeceras HTTP de seguridad | `helmet` con configuración por defecto |
| RNF-03 | Seguridad | Protección contra fuerza bruta en login | `express-rate-limit`: 10 req/min por IP en `/api/auth` |
| RNF-04 | Seguridad | Cambio obligatorio de contraseña en primer login | Campo `debe_cambiarPassword` en tabla `usuarios` |
| RNF-05 | Rendimiento | Base de datos embebida sin latencia de red | SQLite con `better-sqlite3` (driver síncrono) |
| RNF-06 | Rendimiento | Modo WAL para concurrencia de lectura | `PRAGMA journal_mode = WAL`, `foreign_keys = ON`, `synchronous = NORMAL` |
| RNF-07 | Rendimiento | Logger de baja latencia | Pino (`pino`) con `pino-pretty` en desarrollo |
| RNF-08 | Disponibilidad | Auto-restart ante fallo del servicio | NSSM con `AppRestartDelay` configurado |
| RNF-09 | Disponibilidad | Backups automáticos diarios | Tarea programada vía `scripts/install-backup-task.ps1` a las 02:00 |
| RNF-10 | Portabilidad | Despliegue en Windows sin dependencias externas | Binario Node.js (`dist/server.cjs`) + SQLite embebido |
| RNF-11 | Mantenibilidad | Tipado estático en frontend y backend | TypeScript 5.8 con `tsc --noEmit` como verificación |
| RNF-12 | Usabilidad | Diseño responsivo para pantallas 14" y menores | TailwindCSS 4 con breakpoints `lg:`, `md:`, `sm:` |
| RNF-13 | Escalabilidad | Arquitectura monolítica apta para LAN | Un solo proceso Node.js sirve frontend + API en el mismo puerto |

---

## 4. Arquitectura y Diseño Técnico

### 4.1 Stack Tecnológico

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| **Frontend** | React | 19.0.1 | Framework de UI con concurrent features, componentes funcionales y hooks |
| **Build Tool** | Vite | 6.2.3 | Hot Module Replacement ultrarrápido, tree-shaking nativo |
| **Estilos** | TailwindCSS | 4.1.14 | Utility-first CSS, cero runtime, builds pequeños |
| **Ruteo** | React Router DOM | 7.15.0 | Enrutador declarativo con loaders y navegación SPA |
| **Animaciones** | Motion (Framer Motion) | 12.23.24 | Animaciones declarativas para transiciones de componentes |
| **Iconografía** | Lucide React | 0.546.0 | Iconos tree-shakeable, licencia MIT |
| **Backend** | Node.js + Express | 4.21.2 | Servidor HTTP minimalista, middleware chain configurable |
| **Base de datos** | SQLite 3 | — | Motor embebido, cero configuración, ideal para LAN |
| **Driver BD** | better-sqlite3 | 12.10.0 | Driver síncrono de alta performance para Node.js |
| **ORM** | Drizzle ORM | 0.45.2 | Tipado fuerte, consultas SQL-like, migraciones con `drizzle-kit` |
| **Auth** | JWT + bcryptjs | 9.0.3 / 3.0.3 | Tokens firmados con hash bcrypt para contraseñas |
| **Logger** | Pino | 10.3.1 | Logger estructurado JSON de baja latencia |
| **TypeScript** | TypeScript | 5.8.2 | Tipado estático en frontend y backend |
| **Empaquetado backend** | esbuild | 0.25.0 | Bundling del server para producción (`dist/server.cjs`) |

### 4.2 Modelo de Datos — 22 Tablas

La base de datos SQLite contiene 22 tablas organizadas en cuatro categorías:

#### Infraestructura (5 tablas)

| Tabla | Descripción | Relaciones |
|---|---|---|
| `regionales` | Regiones del SENA con código y nombre únicos | — |
| `centros_formacion` | Centros de formación por regional | FK → `regionales` |
| `tipos_ambiente` | Catálogo de tipos (taller, aula, laboratorio) | — |
| `ambientes` | Ambientes físicos con capacidad y estado | FK → `centros_formacion`, `tipos_ambiente` |
| `elementos_ambiente` | Inventario de elementos por ambiente | FK → `ambientes` (CASCADE) |

#### Programas y Currículo (8 tablas)

| Tabla | Descripción | Relaciones |
|---|---|---|
| `programas` | Programas de formación con código+versión único | — |
| `competencias` | Competencias por programa | FK → `programas` (CASCADE) |
| `resultados_aprendizaje` | RAPs por competencia con fase y duración | FK → `competencias` (CASCADE) |
| `perfiles_instructor` | Perfiles requeridos por competencia (legacy) | FK → `competencias` (CASCADE) |
| `perfiles_academicos` | Catálogo independiente de perfiles | — |
| `competencias_perfiles` | Relación competencia ↔ perfil | FK → `competencias`, `perfiles_academicos` |
| `instructores_perfiles` | Relación instructor ↔ perfil | FK → `instructores`, `perfiles_academicos` |
| `instructores` | Personal instructorado con horario y centro | FK → `centros_formacion` |

#### Programación (4 tablas)

| Tabla | Descripción | Relaciones |
|---|---|---|
| `fichas` | Grupos de aprendices con fechas y horario | FK → `centros_formacion`, `programas`, `ambientes` |
| `programacion_instructores` | Cabecera de asignación instructor–ficha | FK → `fichas`, `competencias`, `instructores`, `programas` |
| `programacion_eventos` | Eventos individuales (una fila por hora) | FK → `programacion_instructores` (CASCADE), `resultados_aprendizaje`, `instructores`, `ambientes` |
| `proyectos_formativos` | Proyecto formativo por ficha (1:1) | FK → `fichas` (CASCADE) |
| `proyecto_etapas_raps` | Asignación de RAPs por etapa del proyecto | FK → `proyectos_formativos` (CASCADE), `resultados_aprendizaje` |

#### Autenticación y Permisos (4 tablas)

| Tabla | Descripción | Relaciones |
|---|---|---|
| `usuarios` | Usuarios del sistema con hash de contraseña | — |
| `permisos` | Catálogo de 43 permisos en 11 módulos | — |
| `roles_permisos` | Relación rol ↔ permiso | FK → `permisos` (CASCADE) |
| `usuarios_roles` | Relación usuario ↔ rol | FK → `usuarios` (CASCADE) |

### 4.3 API REST — 92 Endpoints

El servidor (`server.ts`, 1,391 líneas) expone una API REST completa:

| Dominio | Endpoints | Métodos |
|---|---|---|
| Autenticación (`/api/auth`) | 5 | POST login, POST logout, GET me, POST change-password, GET SSE |
| Administración (`/api/admin`) | 16 | GET/POST/DELETE usuarios, roles, permisos, stats |
| Regionales (`/api/regionales`) | 4 | GET, POST, PUT, DELETE |
| Centros (`/api/centros`) | 4 | GET, POST, PUT, DELETE |
| Tipos de Ambiente (`/api/tipos-ambiente`) | 4 | GET, POST, PUT, DELETE |
| Ambientes (`/api/ambientes`) | 4 | GET, POST, PUT, DELETE |
| Elementos (`/api/ambientes/:id/elementos`) | 4 | GET, POST, PUT, DELETE |
| Instructores (`/api/instructores`) | 4 | GET, POST, PUT, DELETE |
| Programas (`/api/programas`) | 4 | GET, POST, PUT, DELETE |
| Competencias (`/api/programas/:id/competencias`) | 4 | GET, POST, PUT, DELETE |
| Resultados (`/api/resultados`) | 4 | GET, POST, PUT, DELETE |
| Perfiles Académicos (`/api/perfiles-academicos`) | 4 | GET, POST, PUT, DELETE |
| Competencia-Perfil (`/api/competencias/:id/perfiles`) | 4 | GET, POST, PUT, DELETE |
| Fichas (`/api/fichas`) | 4 | GET, POST, PUT, DELETE |
| Proyecto Formativo (`/api/fichas/:id/proyecto-formativo`) | 5 | GET, POST, PUT porcentaje, GET etapas, POST etapas |
| Programación Instructores (`/api/programacion-instructores`) | 5 | GET, POST, PUT, DELETE, DELETE por ficha |
| Programación Eventos (`/api/programacion-eventos`) | 4 | GET, GET ficha, POST bulk, PUT, DELETE |
| Disponibilidad (`/api/disponibilidad`) | 2 | GET instructor, GET ambiente |
| Dependencias (`/api/dependencias`) | 1 | GET verificación de dependencias |
| Salud (`/api/health`) | 1 | GET health check |
| **Total** | **92** | |

### 4.4 Rutas Frontend — 17 Rutas

| Ruta | Componente | Protección |
|---|---|---|
| `/login` | Login | Público |
| `/cambiar-password` | ChangePassword | Requiere auth + `debeCambiarPassword` |
| `/` | Dashboard | Requiere auth |
| `/regionales` | RegionalesView | Requiere auth |
| `/centros` | CentrosView | Requiere auth |
| `/ambientes` | AmbientesView | Requiere auth |
| `/tipos-ambiente` | TiposAmbienteView | Requiere auth |
| `/programas` | ProgramasView | `RequirePermission: programas.ver` |
| `/instructores` | InstructoresView | Requiere auth |
| `/fichas` | FichasView | Requiere auth |
| `/fichas/:fichaId/proyecto-formativo` | ProyectoFormativoView | Requiere auth |
| `/perfiles-academicos` | PerfilesAcademicosView | `RequirePermission: perfiles_academicos.ver` |
| `/programacion` | ProgramacionInstructoresView | `RequirePermission: programacion.ver` |
| `/admin` | AdminPanel | `RequirePermission: admin.ver` |

### 4.5 Sistema de Permisos — 43 Permisos en 11 Módulos

| Módulo | Permisos | Total |
|---|---|---|
| `inicio` | ver, reportes | 2 |
| `regionales` | ver, crear, editar, eliminar | 4 |
| `centros` | ver, crear, editar, eliminar | 4 |
| `ambientes` | ver, crear, editar, eliminar | 4 |
| `tipos_ambiente` | ver, crear, editar, eliminar | 4 |
| `instructores` | ver, crear, editar, eliminar | 4 |
| `perfiles_academicos` | ver, crear, editar, eliminar | 4 |
| `programas` | ver, crear, editar, eliminar | 4 |
| `fichas` | ver, crear, editar, eliminar | 4 |
| `programacion` | ver, crear, editar, eliminar | 4 |
| `admin` | ver, crear, editar, eliminar, roles | 5 |
| **Total** | | **43** |

### 4.6 Estructura del Repositorio

```
/
├── server.ts                          # Backend Express + API (1,391 líneas)
├── seed.ts                            # Poblado de datos iniciales
├── drizzle.config.ts                  # Configuración de Drizzle Kit
├── .env.local                         # Variables de entorno (no versionado)
├── package.json                       # Dependencias y scripts
│
├── src/
│   ├── main.tsx                       # Entry point React + fetch wrapper
│   ├── App.tsx                        # Router + layout + sidebar (17 rutas)
│   ├── config.ts                      # Carga de .env.local
│   ├── db/
│   │   ├── index.ts                   # Conexión SQLite (WAL mode)
│   │   └── schema.ts                  # 22 tablas Drizzle ORM
│   ├── lib/
│   │   ├── auth-context.ts            # Hooks de permisos + AuthContext
│   │   ├── logger.ts                  # Pino logger
│   │   ├── api.ts                     # Utilidades API
│   │   └── sse.ts                     # Server-Sent Events
│   ├── middleware/
│   │   ├── auth.ts                    # JWT + cookie middleware
│   │   ├── permissions.ts             # requirePermission, requireAny, requireAll
│   │   ├── audit.ts                   # Auditoría de mutaciones
│   │   ├── request-logger.ts          # Logger de peticiones
│   │   └── error-handler.ts           # Manejo centralizado de errores
│   ├── modules/
│   │   ├── index.ts                   # Registro central de 11 módulos
│   │   └── <modulo>/permissions.ts    # Permisos por módulo (11 carpetas)
│   ├── routes/
│   │   ├── auth.ts                    # Login, logout, me, change-password, SSE
│   │   └── admin.ts                   # CRUD usuarios, roles, permisos
│   └── components/                    # 16 componentes de vista
│       ├── AdminPanel.tsx
│       ├── AmbientesView.tsx
│       ├── CentrosView.tsx
│       ├── ConfirmDialog.tsx          # Diálogo de confirmación reutilizable
│       ├── CurriculoModal.tsx
│       ├── ElementosAmbienteGrid.tsx
│       ├── FichasView.tsx
│       ├── InstructoresView.tsx
│       ├── PerfilesAcademicosView.tsx
│       ├── ProgramacionInstructoresView.tsx
│       ├── ProgramasView.tsx
│       ├── ProyectoFormativoView.tsx
│       ├── RegionalesView.tsx
│       ├── RequirePermission.tsx      # Guard de permisos UI
│       ├── SearchableSelect.tsx       # Select con búsqueda
│       └── TiposAmbienteView.tsx
│
├── scripts/                           # 21 scripts de operación
│   ├── *.ps1                          # PowerShell (servicio, backup, deploy)
│   ├── *.ts                           # TypeScript (migraciones, verificación)
│   └── *.py                           # Python (extracción curricular)
│
├── spec/
│   ├── constitution/                  # Misión, roadmap, tech-stack
│   └── features/                      # 10 features especificadas (001-010)
│
└── docs/                              # Documentación técnica
    ├── analisis-proyecto.md
    ├── ARQUITECTURA-DATOS.md
    ├── DEPLOYMENT.md
    ├── OPERATIONS.md
    ├── USERS.md
    └── ONBOARDING-WORKSPACE.md
```

---

## 5. Pruebas y Control de Calidad (QA)

### 5.1 Estrategia de Verificación

El proyecto actualmente no dispone de un framework de pruebas automatizadas (tests unitarios o de integración). La estrategia de control de calidad se basa en los siguientes mecanismos:

| Mecanismo | Descripción |
|---|---|
| **TypeScript strict-check** | El comando `npm run lint` ejecuta `tsc --noEmit` para verificar la correcta tipificación de todo el código fuente |
| **Scripts de verificación de permisos** | `scripts/verify-permissions.ts` valida la integridad de permisos, roles y asignaciones en la base de datos |
| **Scripts de prueba de endpoints** | `scripts/test-permissions.ts` realiza pruebas HTTP contra los endpoints de autenticación y administración |
| **Validación server-side** | Cada endpoint de programación valida: rango de fechas, horario de la ficha, pertenencia del instructor al centro, y conflictos de unicidad |
| **Constraints UNIQUE en BD** | La base de datos previene duplicidades a nivel de esquema: `(fecha, hora_inicio, instructor_id)` y `(fecha, hora_inicio, ambiente_id)` |
| **Pruebas manuales de regresión** | Cada feature se verifica manualmente mediante un checklist de aceptación definido en los archivos `spec.md` de cada feature |

### 5.2 Herramientas de QA Configuradas

```
# Verificación de tipos
npm run lint

# Verificación de integridad de permisos
npx tsx scripts/verify-permissions.ts

# Prueba de endpoints de permisos
npx tsx scripts/test-permissions.ts

# Verificación de esquema de BD
npm run db:push
```

### 5.3 Features Especificadas y Verificadas

Cada una de las 9 features del sistema cuenta con especificación formal (`spec.md`), plan técnico (`plan.md`) y checklist de verificación (`tasks.md`):

| # | Feature | Estado |
|---|---|---|
| 001 | Normalización de Perfiles Académicos | Completada |
| 002 | Modalización de Formularios CRUD | Completada |
| 003 | Reordenamiento de Módulos | Completada |
| 004 | Rediseño de Fichas | Completada |
| 005 | Toggle de Vistas (Cards / Tabla) | Completada |
| 006 | Extracción de Diseños Curriculares desde PDF | Completada |
| 007 | Rediseño del Módulo de Programación | En proceso |
| 008 | Agenda del Instructor + Disponibilidad Visual | Pendiente |
| 009 | Gestión de Proyecto Formativo por Ficha | Pendiente |

---

## 6. Despliegue e Instalación

### 6.1 Arquitectura de Despliegue

La plataforma se despliega como una **aplicación monolítica** en un único proceso Node.js que sirve tanto el frontend (SPA compilado) como la API REST en el mismo puerto (3000 por defecto). Esta arquitectura elimina la necesidad de servidores web separados, balancesadores de carga o bases de datos externas.

### 6.2 Requisitos del Servidor

| Componente | Requisito |
|---|---|
| Sistema operativo | Windows 10/11 o Windows Server 2019+ |
| RAM | Mínimo 2 GB |
| Disco | 1 GB libre |
| Node.js | Versión 18+ (recomendado 20 LTS) |
| NSSM | Gestor de servicios Windows (versión 64-bit) |
| Red | Conexión a LAN con puerto 3000 abierto |

### 6.3 Proceso de Despliegue

```powershell
# 1. Clonar o copiar el proyecto
cd C:\
git clone <url-del-repo> sena-gestion-educativa
cd sena-gestion-educativa

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear .env.local con JWT_SECRET, DATABASE_URL, COOKIE_SECURE

# 4. Crear estructura de datos
.\scripts\init-sena-data.ps1

# 5. Aplicar esquema y datos iniciales
npm run db:push
npm run seed

# 6. Compilar para producción
npm run build

# 7. Instalar como servicio de Windows
.\scripts\install-service.ps1    # Requiere Administrador

# 8. Abrir puerto en firewall
.\scripts\open-firewall.ps1      # Requiere Administrador

# 9. Programar respaldos automáticos
.\scripts\install-backup-task.ps1  # Requiere Administrador
```

### 6.4 Scripts de Operación

| Script | Función | Requiere Admin |
|---|---|---|
| `install-service.ps1` | Registra el servicio `SenaSchedule` vía NSSM | Sí |
| `uninstall-service.ps1` | Detiene y desinstala el servicio | Sí |
| `service-control.ps1` | Iniciar, detener, reiniciar o consultar estado | Sí (excepto status) |
| `deploy.ps1` | Build + restart automatizado | Sí |
| `backup.ps1` | Respaldo manual de la BD con retención de 7 días | No |
| `install-backup-task.ps1` | Tarea programada diaria a las 02:00 | Sí |
| `init-sena-data.ps1` | Crea la estructura `C:\sena-data\` | No |
| `open-firewall.ps1` | Abre puerto 3000 en Firewall de Windows | Sí |
| `show-network.ps1` | Muestra IPs LAN y URLs de acceso | No |

### 6.5 Estructura de Datos en Producción

```
C:\sena-gestion-educativa\          # Proyecto (código fuente)
├── dist\                            # Build de producción
│   └── server.cjs                   # Backend empaquetado (esbuild)
├── .env.local                       # Configuración local
└── scripts\                         # Scripts de operación

C:\sena-data\                        # Datos (fuera del repositorio)
├── db\data.db                       # Base de datos SQLite activa
├── backups\                         # Respaldos con timestamp
├── logs\
│   ├── app.log                      # Log estructurado JSON
│   ├── service.out.log              # Salida estándar del servicio
│   └── service.err.log              # Errores del servicio
└── uploads\                         # Archivos subidos
```

### 6.6 Verificación Post-Despliegue

```powershell
# Estado del servicio
Get-Service -Name SenaSchedule

# Health check
Invoke-WebRequest http://localhost:3000/api/health

# Acceso desde otro dispositivo
# Abrir http://<IP-servidor>:3000
# Credenciales: admin / Admin123!
```

---

## 7. Manuales del Sistema

La documentación técnica de la plataforma se complementa con un **Manual de Usuario independiente**, enfocado operativamente en los perfiles de usuario del sistema. Este manual cubre los procedimientos de uso diario para:

- **Coordinadores Académicos:** Creación y gestión de fichas, programación de instructores, asignación de ambientes y seguimiento del proyecto formativo.
- **Instructores:** Consulta de su programación horaria, visualización de agenda semanal y gestión de disponibilidad.
- **Administradores del Sistema:** Gestión de usuarios, roles, permisos, configuración de la infraestructura (regionales, centros, ambientes) y monitoreo del sistema.
- **Personal de Dirección:** Supervisión de la ocupación de ambientes, carga académica de instructores y reportes de gestión.

El Manual de Usuario opera como documento complementario a la documentación técnica incluida en el repositorio (`docs/`), la cual está orientada al desarrollo y mantenimiento del software.

---

## 8. Conclusiones y Trabajo Futuro

### 8.1 Conclusiones

Bajo el liderazgo del Subdirector Fernando Gonzales Torres en el Área de Gestión Administrativa, la plataforma SENA Gestión Educativa ha demostrado ser una herramienta de alto impacto para la modernización de los procesos administrativos del Centro de Formación. Los logros alcanzados incluyen:

- **Centralización operativa:** Once módulos funcionales integran la gestión de infraestructura, talento humano, programación académica y administración del sistema en una única plataforma web accesible desde cualquier dispositivo en la red local.
- **Control de acceso granular:** Un sistema de 43 permisos en 11 módulos garantiza que cada usuario acceda exclusivamente a las funcionalidades autorizadas según su rol institucional.
- **Integridad de datos:** Constraints UNIQUE en base de datos y validación server-side en la API previenen errores críticos como doble-reserva de instructores y ambientes en la misma franja horaria.
- **Simplicidad operativa:** La arquitectura monolítica — frontend React + backend Express + base de datos SQLite en un único proceso Node.js — eliminó la dependencia de servidores de bases de datos externos y redujo los costos de infraestructura.
- **Trazabilidad:** Cada evento de programación es una fila auditable con estado, fechas de creación/modificación e identificación de instructor, ambiente y resultado de aprendizaje.
- **Automatización de respaldos:** Tareas programadas diarias garantizan la integridad de los datos con retención automática de 7 días.

El desarrollo de esta plataforma representa un ejemplo de cómo la innovación tecnológica aplicada a la gestión administrativa puede transformar procesos operativos manuales en soluciones digitales eficientes, seguras y sostenibles.

### 8.2 Trabajo Futuro

De acuerdo con el roadmap del proyecto (Fase 3 — Estabilización, UX y Evolución), las mejoras planificadas incluyen:

| Área | Mejora | Estado |
|---|---|---|
| UX/UI | Implementación de tema oscuro como alternativa de esquema de colores | Pendiente |
| UX/UI | Vista de calendario semanal/mensual para la programación | Pendiente |
| Calidad | Pruebas manuales de regresión con checklist por módulo | Pendiente |
| Calidad | Pruebas de integración para flujos críticos | Pendiente |
| Calidad | Validación de datos con feedback visual en formularios | Pendiente |
| Funcionalidad | Reportes exportables a PDF y Excel | Pendiente |
| Funcionalidad | Notificaciones in-app para cambios de horario | Pendiente |
| Funcionalidad | Soporte multi-sede con datos aislados | Pendiente |
| Funcionalidad | API REST documentada con OpenAPI/Swagger | Pendiente |
| Funcionalidad | Aplicación móvil para consulta de horarios | Pendiente |
| Seguridad | Validación de entrada con schemas Zod | Pendiente |
| Seguridad | Implementación de Content Security Policy (CSP) | Pendiente |
| Seguridad | Middleware CORS configurable | Pendiente |
| Mantenibilidad | Habilitación de `strict: true` en TypeScript | Pendiente |
| Mantenibilidad | Adopción de ESLint + Prettier | Pendiente |
| Mantenibilidad | Framework de pruebas automatizadas (Vitest) | Pendiente |
| Mantenibilidad | Migraciones de Drizzle versionadas | Pendiente |

Estas mejoras se ejecutarán de forma iterativa, priorizando la estabilidad sobre nuevas funcionalidades y la usabilidad sobre la estética, conforme a los criterios de priorización establecidos en el roadmap del proyecto.

---

**Elaborado por:** Equipo Técnico de Desarrollo de Software
**Supervisado por:** Subdirector Fernando Gonzales Torres — Área de Gestión Administrativa
**Fecha:** Julio 2026
