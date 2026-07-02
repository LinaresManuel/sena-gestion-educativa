# Plan: Sistema Granular de Permisos con UI Completa (Tarea Y)

**Fecha de creación:** 2026-07-02
**Estado:** Pendiente de ejecución
**Estimación total:** 20-27 horas

---

## 1. Resumen Ejecutivo

Implementar un sistema completo de **permisos granulares** donde:
- Cada módulo declara sus permisos en un archivo dedicado (`permissions.ts`)
- Los administradores pueden crear **roles personalizados** y asignar permisos específicos
- Los **usuarios pueden tener múltiples roles** (relación N:M)
- La **UI se adapta dinámicamente**: módulos y acciones se ocultan según permisos
- **Auto-registro**: nuevos módulos aparecen automáticamente en la configuración sin tocar código del sistema

---

## 2. Decisiones de Diseño Confirmadas

| Decisión | Valor |
|----------|-------|
| Relación usuario-rol | **N:M** (un usuario puede tener múltiples roles) |
| Cache de permisos | **En el JWT** (incluidos en el payload) |
| UI de matriz de permisos | **Tabla con checkboxes** (módulos × acciones) |
| Alcance Fase 5 | **3 vistas completas**: usuarios, roles, permisos |

---

## 3. Modelo de Datos

### 3.1 Nuevas tablas

```sql
-- Roles personalizables
CREATE TABLE roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  es_sistema INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Catálogo de permisos (auto-poblado por descubrimiento)
CREATE TABLE permisos (
  key TEXT PRIMARY KEY,          -- 'regionales:create'
  modulo TEXT NOT NULL,          -- 'regionales'
  accion TEXT NOT NULL,          -- 'create'
  label TEXT NOT NULL,           -- 'Crear regional'
  descripcion TEXT
);

CREATE INDEX idx_permisos_modulo ON permisos(modulo);

-- Relación roles <-> permisos
CREATE TABLE role_permisos (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES permisos(key) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_key)
);

-- Relación usuarios <-> roles
CREATE TABLE usuario_roles (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, role_id)
);
```

### 3.2 Modificación de tabla `usuarios`

La columna `rol` se mantiene como `deprecated` (no se elimina todavía) para compatibilidad temporal. Se ignora en la lógica nueva.

---

## 4. Estructura de Archivos

```
src/
├── modules/                              ← NUEVO
│   ├── regionales/
│   │   └── permissions.ts
│   ├── centros/
│   │   └── permissions.ts
│   ├── ambientes/
│   │   └── permissions.ts
│   ├── tipos-ambiente/
│   │   └── permissions.ts
│   ├── programas/
│   │   └── permissions.ts
│   ├── instructores/
│   │   └── permissions.ts
│   ├── fichas/
│   │   └── permissions.ts
│   └── programacion/
│       └── permissions.ts
├── lib/
│   ├── auth-context.ts                   ← MODIFICAR
│   ├── use-permissions.ts                ← NUEVO
│   └── permissions-discovery.ts          ← NUEVO
├── middleware/
│   ├── auth.ts                           ← MODIFICAR
│   └── permissions.ts                    ← NUEVO
├── routes/
│   ├── auth.ts                           ← MODIFICAR
│   ├── permisos.ts                       ← NUEVO
│   ├── roles.ts                          ← NUEVO
│   └── usuarios-admin.ts                 ← NUEVO
├── components/
│   ├── Can.tsx                           ← NUEVO
│   ├── RequirePermission.tsx             ← NUEVO
│   ├── admin/                            ← NUEVO
│   │   ├── UsuariosView.tsx
│   │   ├── RolesView.tsx
│   │   ├── PermisosView.tsx
│   │   ├── UsuarioFormModal.tsx
│   │   └── RolFormModal.tsx
│   └── ... (existentes, todos modificados)
├── db/
│   └── schema.ts                         ← MODIFICAR (nuevas tablas)
├── App.tsx                               ← MODIFICAR
├── server.ts                             ← MODIFICAR
└── ...
scripts/
└── migrate-to-permissions.ts             ← NUEVO
```

---

## 5. Backend Detallado

### 5.1 Auto-descubrimiento de permisos

```typescript
// src/lib/permissions-discovery.ts
import { db } from '../db/index.ts';
import { permisos } from '../db/schema.ts';

export interface PermissionDef {
  key: string;
  modulo: string;
  accion: string;
  label: string;
  descripcion?: string;
}

export async function discoverAndSyncPermissions() {
  const modules = import.meta.glob<{ permissions: PermissionDef[] }>(
    '../modules/*/permissions.ts',
    { eager: true }
  );

  const allPerms: PermissionDef[] = [];
  for (const path in modules) {
    const mod = modules[path];
    if (mod.permissions) {
      allPerms.push(...mod.permissions);
    }
  }

  for (const perm of allPerms) {
    await db.insert(permisos)
      .values(perm)
      .onConflictDoUpdate({
        target: permisos.key,
        set: { label: perm.label, descripcion: perm.descripcion }
      });
  }

  console.log(`[permissions] Sincronizados ${allPerms.length} permisos`);
  return allPerms;
}
```

### 5.2 JWT con permisos

```typescript
// src/middleware/auth.ts (modificación)
interface JwtPayload {
  sub: number;
  username: string;
  permisos: string[];  // NUEVO
}

export function signToken(user: AuthUser, permisos: string[]): string {
  return jwt.sign(
    { sub: user.id, username: user.username, permisos },
    config.JWT_SECRET,
    { expiresIn: `${config.SESSION_TTL_HOURS}h`, algorithm: 'HS256' }
  );
}

export function verifyToken(token: string): { user: AuthUser; permisos: string[] } | null {
  // ... retorna usuario + permisos
}
```

### 5.3 Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/permisos` | Lista todos los permisos registrados |
| `GET` | `/api/permisos/agrupados` | Permisos agrupados por módulo (para UI) |
| `GET` | `/api/roles` | Lista todos los roles con sus permisos |
| `POST` | `/api/roles` | Crear un nuevo rol personalizado |
| `GET` | `/api/roles/:id` | Detalle de un rol con sus permisos |
| `PUT` | `/api/roles/:id` | Actualizar nombre/descripción de un rol |
| `PUT` | `/api/roles/:id/permisos` | Asignar permisos a un rol (reemplazo completo) |
| `DELETE` | `/api/roles/:id` | Eliminar un rol (solo si no es del sistema) |
| `GET` | `/api/usuarios` | Lista usuarios con sus roles asignados (solo admin) |
| `POST` | `/api/usuarios` | Crear nuevo usuario con roles asignados (solo admin) |
| `GET` | `/api/usuarios/:id` | Detalle de un usuario con sus roles |
| `PUT` | `/api/usuarios/:id` | Actualizar usuario (nombre, activo, roles) |
| `PUT` | `/api/usuarios/:id/roles` | Asignar roles a un usuario |
| `DELETE` | `/api/usuarios/:id` | Eliminar usuario (no auto-eliminación) |

### 5.4 Middleware `requirePermission`

```typescript
// src/middleware/permissions.ts
export function requirePermission(...requiredPerms: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    const userPerms = req.permisos ?? [];
    const hasAll = requiredPerms.every(p => userPerms.includes(p));
    if (!hasAll) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }
    next();
  };
}
```

### 5.5 Script de migración

```typescript
// scripts/migrate-to-permissions.ts
async function migrate() {
  // 1. Crear roles por defecto
  const adminRole = await db.insert(roles).values({
    nombre: 'admin', descripcion: 'Acceso completo', es_sistema: true
  }).returning();

  const editorRole = await db.insert(roles).values({
    nombre: 'editor', descripcion: 'Crear y editar', es_sistema: true
  }).returning();

  const lectorRole = await db.insert(roles).values({
    nombre: 'lector', descripcion: 'Solo lectura', es_sistema: true
  }).returning();

  // 2. Obtener todos los permisos
  const allPerms = await db.select().from(permisos);

  // 3. Asignar permisos según rol
  for (const perm of allPerms) {
    // admin: todos los permisos
    await db.insert(rolePermisos).values({
      role_id: adminRole[0].id, permission_key: perm.key
    });

    // editor: read, create, update (no delete)
    if (['read', 'create', 'update'].includes(perm.accion)) {
      await db.insert(rolePermisos).values({
        role_id: editorRole[0].id, permission_key: perm.key
      });
    }

    // lector: solo read
    if (perm.accion === 'read') {
      await db.insert(rolePermisos).values({
        role_id: lectorRole[0].id, permission_key: perm.key
      });
    }
  }

  // 4. Migrar usuarios existentes
  const users = await db.select().from(usuarios);
  for (const user of users) {
    const roleId = user.rol === 'admin' ? adminRole[0].id :
                   user.rol === 'editor' ? editorRole[0].id :
                   lectorRole[0].id;
    await db.insert(usuarioRoles).values({
      usuario_id: user.id, role_id: roleId
    });
  }
}
```

---

## 6. Frontend Detallado

### 6.1 Hook `usePermissions()`

```typescript
// src/lib/use-permissions.ts
export function usePermissions() {
  const { permisos } = useAuth();

  return {
    permisos,
    hasPermission: (perm: string) => permisos.includes(perm),
    hasAnyPermission: (perms: string[]) => perms.some(p => permisos.includes(p)),
    hasAllPermissions: (perms: string[]) => perms.every(p => permisos.includes(p)),
    canRead: (modulo: string) => permisos.includes(`${modulo}:read`),
    canCreate: (modulo: string) => permisos.includes(`${modulo}:create`),
    canUpdate: (modulo: string) => permisos.includes(`${modulo}:update`),
    canDelete: (modulo: string) => permisos.includes(`${modulo}:delete`),
    visibleModules: VISIBLE_MODULES.filter(m => permisos.includes(`${m}:read`))
  };
}
```

### 6.2 Componente `<Can>`

```typescript
// src/components/Can.tsx
interface CanProps {
  permission?: string;
  anyPermission?: string[];
  allPermissions?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Can({ permission, anyPermission, allPermissions, fallback = null, children }: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let allowed = false;
  if (permission) allowed = hasPermission(permission);
  else if (anyPermission) allowed = hasAnyPermission(anyPermission);
  else if (allPermissions) allowed = hasAllPermissions(allPermissions);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
```

### 6.3 Componente `<RequirePermission>`

```typescript
// src/components/RequirePermission.tsx
interface RequirePermissionProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RequirePermission({ permission, fallback, children }: RequirePermissionProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return fallback ? <>{fallback}</> : <Navigate to="/sin-permiso" replace />;
  }

  return <>{children}</>;
}
```

### 6.4 Sidebar Dinámico

```typescript
// En App.tsx
const moduleConfig = [
  { path: '/regionales',     label: 'Regionales',    icon: MapPin,   permission: 'regionales:read' },
  { path: '/centros',        label: 'Centros',       icon: Building, permission: 'centros:read' },
  { path: '/ambientes',      label: 'Ambientes',     icon: Home,     permission: 'ambientes:read' },
  { path: '/tipos-ambiente', label: 'Tipos Amb.',    icon: Home,     permission: 'tipos-ambiente:read' },
  { path: '/programas',      label: 'Programas',     icon: BookOpen, permission: 'programas:read' },
  { path: '/instructores',   label: 'Instructores',  icon: Users,    permission: 'instructores:read' },
  { path: '/fichas',         label: 'Fichas',        icon: BookOpen, permission: 'fichas:read' },
  { path: '/programacion',   label: 'Programación',  icon: Calendar, permission: 'programacion:read' },
  { path: '/admin/usuarios', label: 'Usuarios',      icon: UserCog,  permission: 'admin:usuarios' },
  { path: '/admin/roles',    label: 'Roles',         icon: Shield,   permission: 'admin:roles' },
  { path: '/admin/permisos', label: 'Permisos',      icon: Key,      permission: 'admin:permisos' },
];

// Filtrar según permisos del usuario
{moduleConfig
  .filter(m => hasPermission(m.permission))
  .map(m => <NavLink key={m.path} to={m.path} icon={m.icon}>{m.label}</NavLink>)}
```

### 6.5 Integración con Componentes Existentes

Reemplazar `useCanEdit()` con `usePermissions()` en cada componente:

```tsx
// Antes:
const canEdit = useCanEdit();

// Después:
const { canCreate, canUpdate, canDelete } = usePermissions();
const modulo = 'regionales';

// En el JSX:
{canCreate(modulo) && <Button onClick={handleCreate}>Crear</Button>}
{canUpdate(modulo) && <Button onClick={() => handleEdit(r)}>Editar</Button>}
{canDelete(modulo) && <Button onClick={() => handleDelete(r.id)}>Eliminar</Button>}
```

---

## 7. UI de Administración

### 7.1 Vista de Roles (Matriz de Permisos)

```
┌─────────────────────────────────────────────────────────────┐
│  Gestión de Roles                                            │
├─────────────────────────────────────────────────────────────┤
│  [+ Nuevo Rol]                                              │
│                                                              │
│  ┌──────────────┬─────────┬───────────┬──────┬────────┐    │
│  │ Rol          │ Usuarios│ Permisos  │ Sist.│ Acc.   │    │
│  ├──────────────┼─────────┼───────────┼──────┼────────┤    │
│  │ admin        │ 1       │ 32        │ Sí   │ ✏️ 🗑️ │    │
│  │ editor       │ 0       │ 24        │ Sí   │ ✏️ 🗑️ │    │
│  │ lector       │ 0       │ 8         │ Sí   │ ✏️ 🗑️ │    │
│  │ Coord. Amb.  │ 2       │ 6         │ No   │ ✏️ 🗑️ │    │
│  └──────────────┴─────────┴───────────┴──────┴────────┘    │
│                                                              │
│  Modal de Edición:                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Nombre: [Coord. Ambientes                          ]  │ │
│  │  Descripción: [Acceso a módulo de ambientes        ]  │ │
│  │                                                        │ │
│  │  Permisos:                                             │ │
│  │  ┌──────────┬──────┬────────┬────────┬─────────┐      │ │
│  │  │ Módulo   │ Ver  │ Crear  │ Editar │ Eliminar│      │ │
│  │  ├──────────┼──────┼────────┼────────┼─────────┤      │ │
│  │  │ Ambients │  ☑   │   ☑    │   ☑    │    ☐    │      │ │
│  │  │ Centros  │  ☑   │   ☐    │   ☐    │    ☐    │      │ │
│  │  │ Regiones │  ☐   │   ☐    │   ☐    │    ☐    │      │ │
│  │  │ ...      │      │        │        │         │      │ │
│  │  └──────────┴──────┴────────┴────────┴─────────┘      │ │
│  │                                                        │ │
│  │                              [Cancelar] [Guardar]      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Vista de Usuarios

```
┌─────────────────────────────────────────────────────────────┐
│  Gestión de Usuarios                                        │
├─────────────────────────────────────────────────────────────┤
│  [+ Nuevo Usuario]                                          │
│                                                              │
│  Buscar: [________________]  Estado: [Todos ▼]            │
│                                                              │
│  ┌──────────┬─────────────┬──────────────┬───────┬────────┐ │
│  │ Username │ Nombre      │ Roles        │Estado │ Acc.   │ │
│  ├──────────┼─────────────┼──────────────┼───────┼────────┤ │
│  │ admin    │ Administr.  │ [admin]      │ Activo│ ✏️ 🗑️ │ │
│  │ jperez   │ Juan Pérez  │ [editor]     │ Activo│ ✏️ 🗑️ │ │
│  │ mgarcia  │ M. García   │ [lector]     │Inact.│ ✏️ 🗑️ │ │
│  └──────────┴─────────────┴──────────────┴───────┴────────┘ │
│                                                              │
│  Modal de Edición:                                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Username: [admin              ] (solo lectura)         │ │
│  │  Nombre:   [Administrador      ]                       │ │
│  │  Activo:   [☑]                                        │ │
│  │  Roles:                                               │ │
│  │    ☑ admin                                            │ │
│  │    ☐ editor                                           │ │
│  │    ☐ lector                                           │ │
│  │    ☑ Coord. Amb.                                      │ │
│  │                                                        │ │
│  │                              [Cancelar] [Guardar]      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Vista de Permisos (Read-only)

```
┌─────────────────────────────────────────────────────────────┐
│  Catálogo de Permisos                                       │
├─────────────────────────────────────────────────────────────┤
│  Filtro módulo: [Todos ▼]                                   │
│                                                              │
│  ┌────────────────────┬──────────┬────────┬────────────────┐│
│  │ Key                │ Módulo   │ Acción │ Label          ││
│  ├────────────────────┼──────────┼────────┼────────────────┤│
│  │ regionales:read    │ regionale│ read   │ Ver regionales ││
│  │ regionales:create  │ regionale│ create │ Crear regional ││
│  │ regionales:update  │ regionale│ update │ Editar region. ││
│  │ ...                │          │        │                ││
│  └────────────────────┴──────────┴────────┴────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Plan de Implementación por Fases

### Fase 1: Base de Datos y Descubrimiento (3-4 horas)

**Archivos a crear/modificar:**
- `src/db/schema.ts` — Agregar 4 tablas nuevas
- `src/modules/*/permissions.ts` — 8 archivos de permisos
- `src/lib/permissions-discovery.ts` — Auto-descubrimiento
- `scripts/migrate-to-permissions.ts` — Migración de datos

**Pasos:**
1. Crear las 4 tablas nuevas en el schema
2. Crear los 8 archivos `permissions.ts` para cada módulo existente
3. Crear `permissions-discovery.ts` con `import.meta.glob`
4. Crear script de migración
5. Ejecutar `npm run db:push` para aplicar schema
6. Ejecutar `npx tsx scripts/migrate-to-permissions.ts`
7. Verificar que el descubrimiento funciona

**Criterios de aceptación:**
- [ ] Las 4 tablas nuevas existen en la BD
- [ ] Los permisos se descubren automáticamente al arrancar
- [ ] Los roles por defecto (admin, editor, lector) existen
- [ ] El usuario admin tiene el rol admin asignado

---

### Fase 2: Backend API (4-5 horas)

**Archivos a crear/modificar:**
- `src/middleware/permissions.ts` — Middleware `requirePermission`
- `src/middleware/auth.ts` — Incluir permisos en JWT
- `src/routes/permisos.ts` — Endpoints de permisos
- `src/routes/roles.ts` — CRUD de roles
- `src/routes/usuarios-admin.ts` — CRUD de usuarios con roles
- `src/routes/auth.ts` — Incluir permisos al login
- `src/server.ts` — Registrar nuevas rutas

**Pasos:**
1. Crear middleware `requirePermission`
2. Modificar `auth.ts` para incluir permisos en el JWT
3. Crear endpoints de permisos (GET)
4. Crear endpoints de roles (CRUD completo)
5. Crear endpoints de usuarios-admin (CRUD con roles)
6. Registrar todas las rutas en `server.ts`
7. Proteger rutas existentes con `requirePermission` (gradual)

**Criterios de aceptación:**
- [ ] `GET /api/permisos` devuelve la lista de permisos
- [ ] `GET /api/roles` devuelve roles con sus permisos
- [ ] `POST /api/roles` crea un nuevo rol
- [ ] `PUT /api/roles/:id/permisos` asigna permisos
- [ ] `GET /api/usuarios` devuelve usuarios con roles
- [ ] `POST /api/usuarios` crea usuario con roles
- [ ] `requirePermission` bloquea rutas sin permisos

---

### Fase 3: Frontend - Hooks y Componentes Base (2-3 horas)

**Archivos a crear/modificar:**
- `src/lib/use-permissions.ts` — Hook de permisos
- `src/components/Can.tsx` — Componente condicional
- `src/components/RequirePermission.tsx` — Guard de rutas
- `src/lib/auth-context.ts` — Incluir permisos

**Pasos:**
1. Crear hook `usePermissions()`
2. Crear componente `<Can>`
3. Crear componente `<RequirePermission>`
4. Actualizar `auth-context.ts` para incluir permisos
5. Actualizar `App.tsx` para cargar permisos al login

**Criterios de aceptación:**
- [ ] `usePermissions()` retorna permisos y funciones helper
- [ ] `<Can>` oculta/muestra según permisos
- [ ] `<RequirePermission>` redirige si no hay permiso
- [ ] El contexto de auth incluye permisos

---

### Fase 4: Sidebar y Dashboard Dinámicos (1-2 horas)

**Archivos a modificar:**
- `src/App.tsx` — Filtrar navegación y dashboard

**Pasos:**
1. Modificar `App.tsx` para filtrar sidebar por permisos
2. Filtrar tarjetas del dashboard por permisos
3. Proteger rutas con `<RequirePermission>`
4. Agregar rutas `/admin/*` en el router

**Criterios de aceptación:**
- [ ] Solo se muestran módulos con permiso `:read`
- [ ] Dashboard solo muestra tarjetas de módulos visibles
- [ ] Rutas protegidas redirigen a `/sin-permiso`

---

### Fase 5: Vistas de Administración (5-6 horas)

**Archivos a crear:**
- `src/components/admin/UsuariosView.tsx`
- `src/components/admin/RolesView.tsx`
- `src/components/admin/PermisosView.tsx`
- `src/components/admin/UsuarioFormModal.tsx`
- `src/components/admin/RolFormModal.tsx`

**Pasos:**
1. Crear `UsuariosView.tsx` con tabla y CRUD
2. Crear `RolesView.tsx` con matriz de permisos
3. Crear `PermisosView.tsx` (read-only)
4. Crear modales de creación/edición
5. Agregar rutas en `App.tsx`
6. Agregar enlaces en sidebar (solo para admin)

**Criterios de aceptación:**
- [ ] `/admin/usuarios` muestra lista con roles
- [ ] Se pueden crear/editar/eliminar usuarios
- [ ] `/admin/roles` muestra matriz de permisos
- [ ] Se pueden crear roles personalizados
- [ ] Se pueden asignar permisos a roles
- [ ] `/admin/permisos` muestra catálogo read-only

---

### Fase 6: Integración con Componentes Existentes (3-4 horas)

**Archivos a modificar:**
- Todos los componentes en `src/components/`

**Pasos:**
1. Reemplazar `useCanEdit()` con `usePermissions()` en cada componente
2. Actualizar `RegionalesView`, `CentrosView`, etc. para usar `<Can>`
3. Actualizar `CurriculoModal.tsx` (pendiente de tarea A)
4. Ocultar botones de acción según permisos específicos
5. Proteger endpoints de mutación con `requirePermission`

**Criterios de aceptación:**
- [ ] Todos los componentes usan `usePermissions()` en lugar de `useCanEdit()`
- [ ] Botones de crear/editar/eliminar se ocultan según permisos
- [ ] Endpoints de mutación están protegidos

---

### Fase 7: Testing y Refinamiento (2-3 horas)

**Pasos:**
1. Crear usuario de prueba con rol `lector`
2. Verificar que módulos sin permiso se ocultan
3. Verificar que acciones se ocultan correctamente
4. Probar creación de roles personalizados
5. Verificar migración de datos
6. Actualizar documentación (USERS.md, OPERATIONS.md)
7. Actualizar TAREAS-PENDIENTES.md (marcar Y como completada)

**Criterios de aceptación:**
- [ ] Usuario con solo `regionales:read` ve solo ese módulo
- [ ] Admin puede crear roles personalizados
- [ ] Cambio de permisos se refleja tras re-login
- [ ] Documentación actualizada

---

## 9. Archivos a Crear/Modificar

### Nuevos (22 archivos)
- `src/modules/regionales/permissions.ts`
- `src/modules/centros/permissions.ts`
- `src/modules/ambientes/permissions.ts`
- `src/modules/tipos-ambiente/permissions.ts`
- `src/modules/programas/permissions.ts`
- `src/modules/instructores/permissions.ts`
- `src/modules/fichas/permissions.ts`
- `src/modules/programacion/permissions.ts`
- `src/lib/permissions-discovery.ts`
- `src/lib/use-permissions.ts`
- `src/middleware/permissions.ts`
- `src/routes/permisos.ts`
- `src/routes/roles.ts`
- `src/routes/usuarios-admin.ts`
- `src/components/Can.tsx`
- `src/components/RequirePermission.tsx`
- `src/components/admin/UsuariosView.tsx`
- `src/components/admin/RolesView.tsx`
- `src/components/admin/PermisosView.tsx`
- `src/components/admin/UsuarioFormModal.tsx`
- `src/components/admin/RolFormModal.tsx`
- `scripts/migrate-to-permissions.ts`

### Modificados (20 archivos)
- `src/db/schema.ts`
- `src/db/index.ts`
- `src/middleware/auth.ts`
- `src/routes/auth.ts`
- `src/lib/auth-context.ts`
- `src/App.tsx`
- `src/server.ts`
- `src/components/RegionalesView.tsx`
- `src/components/CentrosView.tsx`
- `src/components/AmbientesView.tsx`
- `src/components/TiposAmbienteView.tsx`
- `src/components/ProgramasView.tsx`
- `src/components/InstructoresView.tsx`
- `src/components/FichasView.tsx`
- `src/components/ElementosAmbienteGrid.tsx`
- `src/components/CurriculoModal.tsx`
- `package.json`
- `docs/USERS.md`
- `docs/OPERATIONS.md`
- `docs/TAREAS-PENDIENTES.md`

---

## 10. Criterios de Aceptación Generales

✅ **Escenario 1:** Usuario con solo permiso `regionales:read`
- Ve "Regionales" en sidebar, no ve otros módulos
- En `/regionales` ve la tabla pero no formularios ni botones de acción
- Intenta acceder a `/centros` por URL → redirige a `/sin-permiso`

✅ **Escenario 2:** Admin crea rol personalizado
- Va a `/admin/roles` → "Nuevo Rol"
- Llena nombre, descripción, marca permisos en la matriz
- Guarda → aparece en la lista
- Asigna el rol a un usuario desde `/admin/usuarios`

✅ **Escenario 3:** Cambio de permisos se refleja
- Admin cambia permisos de un rol
- Usuario afectado (si está logueado) debe logout/login para refrescar
- Mensaje claro en la UI sobre cuándo se aplican los cambios

✅ **Escenario 4:** Nuevo módulo se auto-registra
- Se crea `src/modules/nuevo-modulo/permissions.ts`
- Al reiniciar el servidor, aparece automáticamente en `/admin/permisos` y en la matriz de roles
- No requiere tocar código de roles ni del sidebar

---

## 11. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Migración de datos falla | Alto | Backup automático previo; script de rollback |
| Rendimiento con muchos permisos en JWT | Medio | Limitar tamaño de permisos; comprimir si es necesario |
| Usuarios sin permisos asignados | Alto | Asignar rol "lector" por defecto en migración |
| Sesión activa con permisos antiguos | Medio | Invalidar JWT al cambiar roles (forzar re-login) |
| Complejidad de la matriz de permisos | Medio | Empezar con checkboxes simples, mejorar después |
| Compatibilidad con `usuarios.rol` deprecated | Bajo | Mantener como fallback durante 1 release |

---

## 12. Sincronización con el Deploy

Después de completar cada fase (o al menos al finalizar la implementación completa), es **crítico** sincronizar los cambios con la copia de despliegue en `C:\sena-gestion-educativa\`.

### Procedimiento de Sincronización

```powershell
# 1. En el workspace (donde se trabaja), commitear todos los cambios
cd "C:\Users\Sena Empresa\Desktop\SENA Software\sena-gestion-educativa"
git add -A
git commit -m "feat: implementar sistema granular de permisos (tarea Y)"

# 2. En el deploy, hacer pull desde el workspace
cd "C:\sena-gestion-educativa"
git pull workspace main

# 3. Ejecutar la migración de base de datos en el deploy
cd "C:\sena-gestion-educativa"
npx tsx scripts/migrate-to-permissions.ts

# 4. Reconstruir el build
npm run build

# 5. Reiniciar el servicio (requiere privilegios de administrador)
Restart-Service -Name SenaSchedule

# 6. Verificar que el servicio está corriendo
Get-Service -Name SenaSchedule
```

### Consideraciones Importantes

1. **Backup de la BD antes de migrar:**
   ```powershell
   # En el deploy
   Copy-Item C:\sena-data\db\data.db C:\sena-data\backups\data-pre-permissions.db
   ```

2. **Si la migración falla, restaurar:**
   ```powershell
   Copy-Item C:\sena-data\backups\data-pre-permissions.db C:\sena-data\db\data.db -Force
   ```

3. **Verificar que el servicio arrancó correctamente:**
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing
   ```

4. **Si hay errores en el servicio, revisar logs:**
   ```powershell
   Get-Content C:\sena-data\logs\service.err.log -Tail 50
   ```

---

## 13. Orden de Ejecución Recomendado

1. **Fase 1** (DB + descubrimiento) — Base de todo lo demás
2. **Fase 2** (Backend) — API funcional
3. **Fase 3** (Frontend base) — Hooks y componentes reutilizables
4. **Fase 4** (Sidebar/Dashboard) — Feedback visual inmediato
5. **Fase 5** (Vistas admin) — Herramientas de configuración
6. **Fase 6** (Integración) — Reemplazar useCanEdit en componentes
7. **Fase 7** (Testing) — Verificar todo funciona
8. **Sincronización** — Pull en deploy + migración + restart

---

## 14. Checklist de Verificación Final

- [ ] Todas las fases completadas
- [ ] Tests manuales pasados (escenarios 1-4)
- [ ] Documentación actualizada (USERS.md, OPERATIONS.md)
- [ ] TAREAS-PENDIENTES.md actualizada (Y marcada como completada)
- [ ] Cambios commiteados en el workspace
- [ ] Deploy sincronizado via `git pull workspace main`
- [ ] Migración ejecutada en el deploy
- [ ] Build reconstruido en el deploy
- [ ] Servicio reiniciado en el deploy
- [ ] Health check pasa en el deploy
- [ ] Login funciona con usuario admin
- [ ] Sidebar muestra solo módulos con permisos
- [ ] Creación de roles funciona
- [ ] Asignación de roles a usuarios funciona

---

## 15. Notas Adicionales

### Convención de Commits

Para mantener trazabilidad, usar mensajes de commit con prefijo:

```
feat(permisos): agregar tabla de roles
feat(permisos): crear endpoint GET /api/roles
feat(permisos): implementar componente Can
feat(permisos): integrar permisos en sidebar
fix(permisos): corregir migración de usuarios
docs(permisos): actualizar USERS.md
```

### Rollback Plan

Si algo falla en producción:

1. Detener el servicio: `Stop-Service -Name SenaSchedule`
2. Restaurar BD desde backup
3. Revertir código: `git checkout <commit-anterior>`
4. Reconstruir: `npm run build`
5. Reiniciar servicio: `Start-Service -Name SenaSchedule`

### Soporte

Si surgen problemas durante la implementación:
- Revisar logs en `C:\sena-data\logs\`
- Consultar `docs/OPERATIONS.md` para troubleshooting
- Referencia: `AGENTS.md` para contexto del proyecto

---

**Fin del documento**
