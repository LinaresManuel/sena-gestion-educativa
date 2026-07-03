# Arquitectura de Datos — SENA Gestión Educativa

## 1. Resumen

SPA React 19 + Express + SQLite (Drizzle ORM). 15 tablas, sistema de permisos granulares (35 permisos en 9 módulos), auth con JWT en cookie httpOnly.

---

## 2. Stack de Base de Datos

| Componente | Tecnología |
|---|---|
| Motor | SQLite 3 (better-sqlite3) |
| ORM | Drizzle ORM |
| Conexión | `src/db/index.ts` — WAL mode, foreign_keys ON, synchronous NORMAL |
| Path | `config.DATABASE_URL` (prod: `C:\sena-data\db\data.db`) |

---

## 3. Esquema de Tablas (15 tablas)

### 3.1 Infraestructura (7 tablas)

```
regionales
  id (PK, autoIncrement)
  codigo (UNIQUE)
  nombre

centros_formacion
  id (PK, autoIncrement)
  codigo (UNIQUE)
  nombre
  regional_id → regionales.id

tipos_ambiente
  id (PK, autoIncrement)
  nombre (UNIQUE)
  descripcion

ambientes
  id (PK, autoIncrement)
  codigo (UNIQUE)
  nombre
  capacidad
  tipo_ambiente_id → tipos_ambiente.id
  ubicacion
  estado (default: 'ACTIVO')
  centro_id → centros_formacion.id

elementos_ambiente
  id (PK, autoIncrement)
  placa
  nombre
  detalle
  estado (default: 'BUENO')
  imagen
  ambiente_id → ambientes.id (ON DELETE CASCADE)

instructores
  id (PK, autoIncrement)
  documento (UNIQUE)
  nombres
  apellidos
  tipo_vinculacion
  requisitos_academicos (JSON)
  estado (default: 'ACTIVO')
```

### 3.2 Programas y Currículo (4 tablas)

```
programas
  id (PK, autoIncrement)
  denominacion
  codigo
  version
  horas_lectiva
  horas_productiva
  tipo_programa
  pdf_document
  UNIQUE(codigo, version)

competencias
  id (PK, autoIncrement)
  programa_id → programas.id (ON DELETE CASCADE)
  codigo
  nombre
  duracion_horas
  porcentaje_horas_directas (default: 80)

resultados_aprendizaje
  id (PK, autoIncrement)
  competencia_id → competencias.id (ON DELETE CASCADE)
  codigo
  nombre
  duracion_horas
  fase

perfiles_instructor
  id (PK, autoIncrement)
  competencia_id → competencias.id (ON DELETE CASCADE)
  codigo
  nombre

fichas
  id (PK, autoIncrement)
  numero_ficha (UNIQUE)
  centro_formacion_id → centros_formacion.id
  fecha_inicio (ISO date)
  fecha_fin_lectiva (ISO date)
  fecha_fin (ISO date)
  modalidad (VIRTUAL|PRESENCIAL|MIXTA)
  horario (JSON: { [dia]: string[] })
  programa_id → programas.id
  ambiente_id → ambientes.id
```

### 3.3 Programación (1 tabla)

```
programacion_instructores
  id (PK, autoIncrement)
  programa_id → programas.id
  ficha_id → fichas.id
  competencia_id → competencias.id
  instructor_id → instructores.id
  resultados_ids (JSON)
  eventos (JSON: { [isoDate]: { [hora]: resultadoId } })
```

### 3.4 Auth y Permisos (3 tablas)

```
usuarios
  id (PK, autoIncrement)
  username (UNIQUE)
  password_hash
  nombre
  rol — DEPRECATED (usar usuarios_roles)
  debe_cambiar_password (boolean)
  activo (boolean)
  ultimo_login_at (ISO date)
  created_at

permisos — Catálogo de permisos disponibles
  id (PK, autoIncrement)
  codigo (UNIQUE) — ej: 'programacion.editar'
  nombre
  descripcion
  modulo — ej: 'programacion', 'inventario'
  accion — ej: 'ver', 'crear', 'editar'

roles_permisos — N:M entre permisos y roles
  id (PK, autoIncrement)
  rol (string) — nombre del rol
  permiso_id → permisos.id (ON DELETE CASCADE)
  UNIQUE(rol, permiso_id)

usuarios_roles — N:M entre usuarios y roles
  id (PK, autoIncrement)
  usuario_id → usuarios.id (ON DELETE CASCADE)
  rol (string)
  UNIQUE(usuario_id, rol)
```

---

## 4. Sistema de Módulos y Permisos

### 4.1 Los 9 módulos (35 permisos)

| Módulo | Permisos | Total |
|---|---|---|
| inicio | ver, reportes | 2 |
| programacion | ver, crear, editar, eliminar | 4 |
| comunicacion | ver, enviar, responder, eliminar | 4 |
| inventario | ver, crear, editar, eliminar | 4 |
| cursos | ver, crear, editar, eliminar | 4 |
| salones | ver, crear, editar, eliminar | 4 |
| notas | ver, registrar, editar, eliminar | 4 |
| asistencia | ver, registrar, editar, eliminar | 4 |
| admin | ver, crear, editar, eliminar, roles | 5 |

Total: 35 permisos

### 4.2 Roles del sistema (5)

| Rol | Permisos | Descripción |
|---|---|---|
| admin | 35 (todos) | Acceso completo |
| editor | 25 | CRUD en programación, inventario, cursos, salones |
| instructor | 10 | Ver + registrar notas/asistencia |
| lector | 9 | Solo lectura en todos los módulos |
| aprendiz | 5 | Dashboard, comunicaciones, notas, asistencia |

Los roles se definen en `scripts/migrate-to-permissions.ts` (`ROLE_PERMISSIONS`).

---

## 5. Flujo de Datos

### 5.1 Autenticación

```
Login (POST /api/auth/login)
  1. Buscar usuario por username en usuarios
  2. Verificar bcrypt(password, password_hash)
  3. Obtener roles del usuario desde usuarios_roles
  4. Si no tiene roles, usar usuarios.rol (legacy)
  5. Acumular permisos de todos los roles desde roles_permisos + permisos
  6. Generar JWT { sub, username, rol, permisos[] }
  7. Setear cookie httpOnly 'sena_session'
  8. Responder { user: { id, username, nombre, rol, permisos[], debeCambiarPassword } }

Re-autenticación (GET /api/auth/me)
  1. Leer cookie → verifyToken → req.user
  2. Buscar usuario en DB para debeCambiarPassword
  3. Responder datos del usuario (permisos desde JWT)
```

### 5.2 Autorización

```
Backend: Middleware chain
  requireAuth → verifica JWT en cookie → req.user
  requirePermission('codigo') → verifica req.user.permisos
  requireAnyPermission(...) → verifica al menos uno
  requireAllPermissions(...) → verifica todos

Frontend: Hooks (vía AuthContext)
  useHasPermission('codigo') → admin=true, sino incluye('codigo')
  useHasAnyPermission(...) → admin=true, sino some(incluye)
  useCanEdit() → admin=true, sino some(p.includes('.editar')||'.crear')
  useIsAdmin() → user.rol === 'admin'
```

### 5.3 JWT

```typescript
Payload: { sub: user.id, username, rol, permisos: string[] }
Algoritmo: HS256
TTL: config.SESSION_TTL_HOURS (default 12h)
Cookie: sena_session, httpOnly, sameSite='lax', secure=config.COOKIE_SECURE
```

### 5.4 Fetch wrapper (main.tsx)

`window.fetch` parcheado globalmente para inyectar `credentials: 'include'`. Todos los fetch automáticamente envían cookies.

---

## 6. Mapeo UI → Módulos

### Sidebar y Dashboard

| Ruta | Componente | Permiso (sidebar) | Permiso (edición) |
|---|---|---|---|
| / | Dashboard | — | — |
| /regionales | RegionalesView | config.ver | config.editar/crear |
| /centros | CentrosView | config.ver | config.editar/crear |
| /ambientes | AmbientesView | salones.ver | salones.editar/crear |
| /tipos-ambiente | TiposAmbienteView | config.ver | config.editar/crear |
| /programas | ProgramasView | cursos.ver | cursos.editar/crear |
| /instructores | InstructoresView | cursos.ver | cursos.editar/crear |
| /fichas | FichasView | cursos.ver | cursos.editar/crear |
| /programacion | ProgramacionInstructoresView | programacion.ver | (backend valida) |
| /admin | AdminPanel | admin.ver | (backend valida) |

---

## 7. Debilidades Identificadas

| # | Debilidad | Impacto | Archivo |
|---|---|---|---|
| 1 | `usuarios.rol` deprecated pero aún usado como fallback | Datos duplicados y posible inconsistencia | schema.ts:123, auth.ts:45-47 |
| 2 | No existe tabla `roles` — roles son strings sueltos | Sin metadatos, sin FK, sin protección de integridad referencial | schema.ts:145,154 |
| 3 | GET /api/admin/stats usa `usuarios_roles` para contar roles | Inconsistente con GET /api/admin/roles | admin.ts:432 |
| 4 | Permisos cacheados en JWT — no hay refresh sin re-login | Cambios de permisos no toman efecto hasta nuevo inicio de sesión | auth.ts:62-67 |
| 5 | **3 componentes sin módulo de permiso específico** (regionales, centros, tipos-ambiente) | `useCanEdit()` es muy permisivo | RegionalesView, CentrosView, TiposAmbienteView |
| 6 | Rate limit en `/api/auth` deshabilitado | Sin protección contra fuerza bruta | server.ts:50-58 |
| 7 | Sin auditoría de cambios de permisos | No se puede rastrear quién cambió qué rol | (no existe) |
| 8 | `UserRole` type fijo a 5 roles | Roles personalizados no encajan en el tipo TypeScript | auth.ts:5 |
| 9 | Sin validación Zod en request bodies | Errores de tipo llegan a Drizzle sin filtrar | server.ts (todo inline) |
| 10 | `DELETE usuarios/:id/roles/:rol` con `&&` mal usado en where clause | No filtra correctamente | admin.ts:267-268 |

---

## 8. Mejoras Propuestas

### Mejora 1 — Tabla `roles` (CRÍTICA)

Crear tabla dedicada para roles, migrar `rolesPermisos.rol` y `usuariosRoles.rol` a FK hacia `roles.id`.

**Beneficio:** Integridad referencial, metadatos, cascade en rename, protección de roles del sistema a nivel DB.

### Mejora 2 — Nuevo módulo `config` (ALTA)

Agregar módulo para regionales, centros, tipos-ambiente con 3 permisos: `config.ver`, `config.crear`, `config.editar`.

**Beneficio:** Cobertura completa de permisos en UI, eliminar uso de `useCanEdit()`.

### Mejora 3 — Refresh de permisos JWT (ALTA)

Endpoint `POST /api/auth/refresh-permisos` que recalcula permisos desde DB y actualiza JWT/cookie.

**Beneficio:** Cambios de permisos efectivos sin cerrar sesión.

### Mejora 4 — Auditoría de cambios (MEDIA)

Logging estructurado en todas las mutaciones de roles/permisos.

**Beneficio:** Trazabilidad completa de cambios.

### Mejora 5 — Validación Zod (MEDIA)

Schemas en `src/lib/schemas.ts` para login, create/update user, create/update role, change password.

**Beneficio:** Errores tempranos, tipos inferidos, documentación de contrato.

### Mejora 6 — Re-habilitar rate limit (BAJA)

Restaurar rate limit en `/api/auth` con configuración por entorno.

### Mejora 7 — Corregir `&&` en where clause (CRÍTICA)

Reemplazar `&&` por `and()` de drizzle-orm en `DELETE /api/admin/usuarios/:id/roles/:rol`.

---

## 9. Roadmap de Implementación

| Fase | Mejoras | Esfuerzo |
|---|---|---|
| **Fase 1** | Mejora 7 (fix &&), Mejora 2 (módulo config) | 1 h |
| **Fase 2** | Mejora 1 (tabla roles + migración) | 3 h |
| **Fase 3** | Mejora 3 (refresh permisos) | 2 h |
| **Fase 4** | Mejora 4 (auditoría), Mejora 5 (Zod) | 3 h |
| **Fase 5** | Mejora 6 (rate limit), limpieza `usuarios.rol` | 1 h |
