# Plan: CRUD Completo de Usuarios desde la Interfaz Web

**Estado:** Pendiente de implementación  
**Fecha del plan:** 2 de julio de 2026  
**Estimación total:** ~4.5h  

---

## Objetivo

Implementar gestión completa de usuarios desde el panel de administración web (`/admin`), incluyendo crear, editar, eliminar, asignar roles y resetear contraseñas, con permisos granulares.

---

## Estado actual

**Ya existe:**
- Tab `Usuarios` en `AdminPanel.tsx` con tabla de solo lectura
- `GET /api/admin/usuarios` — lista usuarios con roles
- `PUT /api/admin/usuarios/:id` — edita nombre, activo, debeCambiarPassword
- `POST /api/admin/usuarios/:id/roles` — asigna roles
- `DELETE /api/admin/usuarios/:id/roles/:rol` — quita un rol

**No existe:**
- Crear usuario (endpoint + UI)
- Eliminar usuario (endpoint + UI)
- Resetear contraseña desde admin (endpoint + UI)
- UI de edición (endpoint existe pero la tabla no lo llama)
- UI de asignación de roles (endpoint existe pero la tabla no lo llama)
- Módulo de permisos `admin` en `src/modules/`

---

## Cambios detallados

### 1. Nuevo módulo de permisos: `src/modules/admin/permissions.ts`

Crear archivo con los siguientes permisos:

```ts
export const ADMIN_PERMISSIONS = [
  { codigo: 'admin.ver',      nombre: 'Ver Admin',      modulo: 'admin', accion: 'ver',      descripcion: 'Acceder al panel de administración' },
  { codigo: 'admin.crear',    nombre: 'Crear Usuario',  modulo: 'admin', accion: 'crear',    descripcion: 'Crear nuevos usuarios' },
  { codigo: 'admin.editar',   nombre: 'Editar Usuario', modulo: 'admin', accion: 'editar',   descripcion: 'Editar usuarios y resetear contraseñas' },
  { codigo: 'admin.eliminar', nombre: 'Eliminar Usuario', modulo: 'admin', accion: 'eliminar', descripcion: 'Eliminar usuarios del sistema' },
  { codigo: 'admin.roles',    nombre: 'Gestionar Roles', modulo: 'admin', accion: 'roles',    descripcion: 'Gestionar roles y permisos' },
] as const;
```

Registrar en `src/modules/index.ts`:
```ts
import { ADMIN_PERMISSIONS } from './admin/permissions';

// Agregar al ALL_MODULE_PERMISSIONS
...ADMIN_PERMISSIONS,

// Agregar al PERMISSIONS_BY_MODULE
admin: ADMIN_PERMISSIONS,
```

### 2. Schema y migración

**`src/db/schema.ts`** — Sin cambios de schema, solo se agregan permisos via script.

**Script `scripts/migrate-admin-permissions.ts`:**
- Insertar los 5 permisos nuevos en tabla `permisos`
- Asignar todos los permisos `admin.*` al rol `admin`
- Asignar `admin.ver`, `admin.crear`, `admin.editar` al rol `editor`
- Asignar `admin.ver` al rol `instructor` y `lector`

### 3. Backend — Nuevos endpoints en `src/routes/admin.ts`

#### 3.1 POST /api/admin/usuarios — Crear usuario

```ts
router.post('/usuarios', requireAuth, requirePermission('admin.crear'), async (req, res) => {
  // Body: { username: string, password: string, nombre: string, roles: string[] }
  // Validaciones:
  //   - username y password son strings no vacíos
  //   - password tiene al menos 8 caracteres
  //   - roles es un array no vacío
  // Lógica:
  //   1. Hashear password con bcryptjs (10 rounds)
  //   2. Insertar en tabla usuarios (rol legacy = primer rol del array)
  //   3. Insertar en tabla usuarios_roles para cada rol
  //   4. Retornar usuario creado sin passwordHash
  // Errores:
  //   - 400 si datos inválidos
  //   - 409 si username ya existe (UNIQUE constraint)
});
```

#### 3.2 DELETE /api/admin/usuarios/:id — Eliminar usuario

```ts
router.delete('/usuarios/:id', requireAuth, requirePermission('admin.eliminar'), async (req, res) => {
  // Validaciones:
  //   - No permitir eliminarse a uno mismo (req.user.id !== usuarioId)
  //   - Verificar que el usuario existe
  // Lógica:
  //   1. Eliminar de usuarios_roles (cascade)
  //   2. Eliminar de usuarios
  //   3. Retornar { ok: true }
  // Errores:
  //   - 400 si intenta eliminarse a sí mismo
  //   - 404 si usuario no encontrado
});
```

#### 3.3 POST /api/admin/usuarios/:id/reset-password — Resetear contraseña

```ts
router.post('/usuarios/:id/reset-password', requireAuth, requirePermission('admin.editar'), async (req, res) => {
  // Lógica:
  //   1. Generar contraseña aleatoria (12 chars: mayúsculas, minúsculas, números)
  //   2. Hashear con bcryptjs (10 rounds)
  //   3. Actualizar usuarios.password_hash y usuarios.debe_cambiar_password = true
  //   4. Retornar { ok: true, temporaryPassword: "..." }
  //   ⚠️ La contraseña se retorna UNA SOLA VEZ, no se almacena en texto plano
});
```

**Helper `generateRandomPassword()`:**
```ts
import crypto from 'crypto';

function generateRandomPassword(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}
```

#### 3.4 Actualización de endpoints existentes

**PUT /api/admin/usuarios/:id** — Agregar campo `roles` al body:
- Si `roles` está presente, actualizar `usuarios_roles`
- Sincronizar `usuarios.rol` (legacy) con el primer rol del array
- Mantener compatibilidad con código existente

### 4. Frontend — Refactor de `src/components/AdminPanel.tsx`

#### 4.1 Interfaces nuevas

```ts
interface Usuario {
  id: number;
  username: string;
  nombre: string;
  activo: boolean;
  roles: string[];
  debeCambiarPassword: boolean;
  ultimoLoginAt: string | null;
}

interface UserFormData {
  username: string;
  password: string;
  nombre: string;
  roles: string[];
}
```

#### 4.2 Componentes a crear (dentro de AdminPanel.tsx)

**`<UserFormModal>`** — Modal para crear/editar usuarios:
- Props: `isOpen`, `onClose`, `onSave`, `usuario?: Usuario` (null = crear)
- Campos:
  - Username (input, solo habilitado en modo crear)
  - Contraseña (input, solo en modo crear, con botón mostrar/ocultar)
  - Nombre completo (input, requerido)
  - Roles (multi-select con checkboxes: admin, editor, instructor, lector, aprendiz)
  - Activo (checkbox, solo en modo editar)
- Botones: Cancelar, Guardar

**`<ConfirmDialog>`** — Confirmación reutilizable:
- Props: `isOpen`, `onClose`, `onConfirm`, `title`, `message`, `confirmText?`
- Botones: Cancelar, Confirmar (rojo)

**`<PasswordDisplayModal>`** — Muestra contraseña generada:
- Props: `isOpen`, `onClose`, `password: string`
- Texto: "La nueva contraseña es: [copiar]"
- Botón "Copiar al portapapeles"
- Nota: "Esta contraseña solo se muestra una vez"

#### 4.3 Tab Usuarios mejorado

**Botón principal:**
```tsx
<button onClick={() => openUserForm(null)}>
  <Plus className="w-4 h-4" /> Nuevo Usuario
</button>
```

**Tabla con columna de acciones:**
```tsx
| Usuario | Nombre | Roles | Estado | Último login | Acciones |
|---------|--------|-------|--------|-------------|----------|
| admin   | Admin  | [admin] | [Activo] | 2026-07-02 | ✏️ 🔑 🗑️ |
```

**Acciones por fila (iconos):**
- ✏️ Editar → abre `UserFormModal` con datos del usuario
- 🔑 Reset → abre `ConfirmDialog`, luego llama API, abre `PasswordDisplayModal`
- 🗑️ Eliminar → abre `ConfirmDialog`, luego llama DELETE

**Estados del componente:**
- `showUserForm: boolean` — controla apertura del modal
- `editingUser: Usuario | null` — usuario seleccionado para editar (null = crear)
- `showDeleteConfirm: boolean` — controla confirmación de eliminar
- `deletingUser: Usuario | null` — usuario a eliminar
- `showPasswordModal: boolean` — controla modal de contraseña
- `generatedPassword: string` — contraseña generada para mostrar
- `saving: boolean` — estado de carga al guardar

#### 4.4 Funciones del componente

```ts
// CRUD
async function createUser(data: UserFormData): Promise<void>
async function updateUser(id: number, data: Partial<Usuario>): Promise<void>
async function deleteUser(id: number): Promise<void>
async function resetPassword(id: number): Promise<void>

// Helpers
function openUserForm(usuario?: Usuario): void
function closeUserForm(): void
function handleDelete(usuario: Usuario): void
function handleResetPassword(usuario: Usuario): void
```

### 5. Tabla de permisos actualizada

El endpoint `GET /api/admin/permisos` debe retornar también los permisos del módulo `admin`. Actualmente solo retorna permisos que existen en la tabla `permisos`. Después de ejecutar la migración, los 5 permisos nuevos aparecerán automáticamente.

### 6. Sincronización de `usuarios.rol` (legacy)

Para mantener compatibilidad con código existente que lee `usuarios.rol`:
- Al **crear** usuario: `usuarios.rol` = primer rol del array
- Al **editar** usuario: `usuarios.rol` = primer rol del array actualizado
- El campo queda marcado como `@deprecated` en el schema

---

## Archivos a crear/modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/modules/admin/permissions.ts` | **Crear** | 5 permisos del módulo admin |
| `src/modules/index.ts` | Modificar | Agregar import y registro de ADMIN_PERMISSIONS |
| `scripts/migrate-admin-permissions.ts` | **Crear** | Script de migración de permisos admin |
| `src/routes/admin.ts` | Modificar | 3 endpoints nuevos + actualizar PUT existente |
| `src/components/AdminPanel.tsx` | Modificar | Modales, botones, acciones CRUD |
| `docs/USERS.md` | Modificar | Documentar nuevo flujo de gestión de usuarios |

---

## Orden de implementación

1. Crear `src/modules/admin/permissions.ts`
2. Actualizar `src/modules/index.ts`
3. Ejecutar `npm run db:push`
4. Crear y ejecutar `scripts/migrate-admin-permissions.ts` en deploy
5. Actualizar `src/routes/admin.ts` (3 endpoints nuevos)
6. Refactorizar `src/components/AdminPanel.tsx` (modales + acciones)
7. Build: `npm run build`
8. Sync: `git pull workspace main` (en deploy)
9. Reiniciar servicio: `Restart-Service -Name SenaSchedule`
10. Probar con `scripts/test-permissions.ts` y manualmente

---

## Criterios de aceptación

- [ ] Un admin puede crear un usuario nuevo desde la UI
- [ ] Un admin puede asignar múltiples roles al crear usuario
- [ ] Un admin puede editar nombre, estado activo y roles de un usuario
- [ ] Un admin puede eliminar un usuario (con confirmación)
- [ ] Un admin no puede eliminarse a sí mismo
- [ ] Un admin puede resetear la contraseña de otro usuario
- [ ] La contraseña reseteada se muestra UNA SOLA VEZ al admin
- [ ] El usuario con contraseña reseteada DEBE cambiarla en el próximo login
- [ ] El sidebar de admin solo aparece para usuarios con permiso `admin.ver`
- [ ] Los botones de acción aparecen/desaparecen según permisos
- [ ] El endpoint `/api/admin/usuarios` retorna usuarios con sus roles
- [ ] No se envía `passwordHash` en ninguna respuesta API

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Admin se elimina a sí mismo | Validar en backend: `req.user.id !== usuarioId` |
| Contraseña en logs | Nunca loguear la contraseña generada, solo retornarla en la respuesta |
| Username duplicado | Manejar error UNIQUE de SQLite y retornar 409 |
| Roles inválidos | Validar que cada rol del array existe en el sistema |
| `usuarios.rol` desincronizado | Siempre sincronizar con el primer rol de `usuarios_roles` |
| Permisos no actualizados en JWT | El usuario debe cerrar sesión y volver a iniciar tras cambios de permisos |

---

## Dependencias

- bcryptjs (ya instalado)
- crypto (Node.js built-in)
- lucide-react (ya instalado: Plus, Pencil, Trash2, Key, RefreshCw, Copy)

---

## Notas para la implementación

- Seguir el patrón de código existente en `AdminPanel.tsx` (useState, useEffect, fetch)
- Usar Tailwind classes consistentes con el resto de la UI
- Los modales deben cerrarse con ESC y click fuera
- El formulario debe tener validación básica en cliente (campos requeridos, longitud mínima)
- Usar `alert()` o toasts para mensajes de éxito/error (seguir patrón existente en otros componentes)
- No agregar comments innecesarios en el código
