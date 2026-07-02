# Plan: Mejoras al CRUD — Roles, Auto-Generación de Contraseña, Change-Password y Confirmaciones

**Estado:** Pendiente de implementación  
**Fecha del plan:** 2 de julio de 2026  
**Estimación total:** ~5h  

---

## Resumen de cambios

| # | Tarea | Descripción |
|---|-------|-------------|
| 1 | CRUD completo de roles | Crear, editar permisos, eliminar con validaciones |
| 2 | Auto-generar password al crear usuario | Quitar input, generar 12 chars, mostrar una vez |
| 3 | Forzar cambio de contraseña al primer login | Redirect automático + detección automática |
| 4 | Confirmación al resetear contraseña | Modal simple antes de ejecutar |

---

## 1. Backend — Cambios en `src/routes/auth.ts`

### 1.1 POST /api/auth/change-password (modificar)

**Problema actual:** Siempre pide `currentPassword`. Si el usuario tiene contraseña temporal, no la sabe.

**Solución:** Detectar automáticamente si es primer cambio:

```ts
router.post('/change-password', requireAuth, async (req: AuthRequest, res) => {
  // ... validaciones iniciales ...
  
  const [u] = await db.select().from(usuarios).where(eq(usuarios.id, req.user.id)).limit(1);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });

  const isFirstChange = u.debeCambiarPassword;

  // Si NO es primer cambio, validar contraseña actual
  if (!isFirstChange) {
    const ok = await bcrypt.compare(currentPassword, u.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.update(usuarios)
    .set({ passwordHash: newHash, debeCambiarPassword: false })
    .where(eq(usuarios.id, u.id));

  res.json({ ok: true });
});
```

**Cambios en el body:**
- `currentPassword` se hace opcional
- Se infiere `isFirstChange` desde `u.debeCambiarPassword`

---

## 2. Backend — Cambios en `src/routes/admin.ts`

### 2.1 POST /api/admin/usuarios (modificar)

**Cambio:** Generar contraseña automáticamente, no pedirla en el body.

```ts
router.post('/usuarios', requireAuth, requirePermission('admin.crear'), async (req, res) => {
  const { username, nombre, roles } = req.body; // SIN password

  // Validaciones de username, nombre, roles (sin cambios)
  
  const temporaryPassword = generateRandomPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const [newUser] = await db.insert(usuarios).values({
    username: username.trim(),
    passwordHash,
    nombre: nombre.trim(),
    rol: roles[0],
    debeCambiarPassword: true,
    activo: true,
  }).returning();

  for (const rol of roles) {
    await db.insert(usuariosRoles).values({ usuarioId: newUser.id, rol });
  }

  // Retornar temporaryPassword (UNA SOLA VEZ)
  res.json({ ...newUser, passwordHash: undefined, roles, temporaryPassword });
});
```

### 2.2 POST /api/admin/roles (nuevo)

```ts
router.post('/roles', requireAuth, requirePermission('admin.roles'), async (req, res) => {
  const { nombre, permisos } = req.body;

  // Validar nombre no existe en roles_permisos
  const existing = await db.selectDistinct({ rol: rolesPermisos.rol })
    .from(rolesPermisos)
    .where(eq(rolesPermisos.rol, nombre));
  
  if (existing.length > 0) {
    return res.status(409).json({ error: 'Ya existe un rol con ese nombre' });
  }

  // Validar que cada permiso existe
  for (const codigo of permisos) {
    const [p] = await db.select().from(permisos).where(eq(permisos.codigo, codigo));
    if (!p) {
      return res.status(400).json({ error: `Permiso ${codigo} no existe` });
    }
  }

  // Insertar permisos del rol
  for (const codigo of permisos) {
    const [p] = await db.select().from(permisos).where(eq(permisos.codigo, codigo));
    if (p) {
      await db.insert(rolesPermisos).values({ rol: nombre, permisoId: p.id });
    }
  }

  res.json({ ok: true, rol: nombre, totalPermisos: permisos.length });
});
```

### 2.3 PUT /api/admin/roles/:rol (modificar)

**Nota:** Solo permite editar permisos (no nombre ni descripción en esta versión).

```ts
router.put('/roles/:rol', requireAuth, requirePermission('admin.roles'), async (req, res) => {
  const { rol } = req.params;
  const { permisos } = req.body;

  // Verificar que el rol existe
  const existing = await db.selectDistinct({ rol: rolesPermisos.rol })
    .from(rolesPermisos)
    .where(eq(rolesPermisos.rol, rol));

  if (existing.length === 0) {
    return res.status(404).json({ error: 'Rol no encontrado' });
  }

  // No permitir editar roles del sistema (solo permisos)
  // Los roles del sistema se detectan por estar en la lista
  const rolesSistema = ['admin', 'editor', 'instructor', 'lector', 'aprendiz'];
  if (rolesSistema.includes(rol)) {
    // Solo permitir cambiar permisos de roles del sistema
  }

  // Reemplazar permisos
  await db.delete(rolesPermisos).where(eq(rolesPermisos.rol, rol));
  for (const codigo of permisos) {
    const [p] = await db.select().from(permisos).where(eq(permisos.codigo, codigo));
    if (p) {
      await db.insert(rolesPermisos).values({ rol, permisoId: p.id });
    }
  }

  res.json({ ok: true, rol, totalPermisos: permisos.length });
});
```

### 2.4 DELETE /api/admin/roles/:rol (mejorar)

**Cambio:** Validar que no tenga usuarios asignados.

```ts
router.delete('/roles/:rol', requireAuth, requirePermission('admin.roles'), async (req, res) => {
  const { rol } = req.params;

  // No eliminar roles del sistema
  const rolesSistema = ['admin', 'editor', 'instructor', 'lector', 'aprendiz'];
  if (rolesSistema.includes(rol)) {
    return res.status(400).json({ error: 'No se pueden eliminar roles del sistema' });
  }

  // Verificar que no tenga usuarios asignados
  const usuariosConRol = await db.select()
    .from(usuariosRoles)
    .where(eq(usuariosRoles.rol, rol))
    .limit(1);

  if (usuariosConRol.length > 0) {
    return res.status(400).json({ error: 'No se puede eliminar un rol que tiene usuarios asignados' });
  }

  // Eliminar permisos y asignaciones
  await db.delete(rolesPermisos).where(eq(rolesPermisos.rol, rol));
  await db.delete(usuariosRoles).where(eq(usuariosRoles.rol, rol));

  res.json({ ok: true, message: `Rol ${rol} eliminado` });
});
```

---

## 3. Frontend — Cambios en `src/Login.tsx`

### 3.1 Redirección automática después de login

```ts
async function handleLogin(username: string, password: string) {
  const res = await fetch('/api/auth/login', { ... });
  const data = await res.json();
  
  if (data.user.debeCambiarPassword) {
    // Redirigir a cambio de contraseña
    navigate('/cambiar-password', { replace: true });
  } else {
    // Ir al dashboard normal
    onLogin(data.user);
    navigate('/', { replace: true });
  }
}
```

---

## 4. Frontend — Cambios en `src/ChangePassword.tsx`

### 4.1 Detección automática de primer cambio

```ts
const [isFirstChange, setIsFirstChange] = useState(false);

useEffect(() => {
  fetch('/api/auth/me', { credentials: 'include' })
    .then(r => r.json())
    .then(data => {
      if (data.debeCambiarPassword) {
        setIsFirstChange(true);
      }
    });
}, []);
```

### 4.2 Renderizado condicional del formulario

```tsx
{!isFirstChange && (
  <div>
    <label>Contraseña actual</label>
    <input type="password" value={current} onChange={...} required />
  </div>
)}

<div>
  <label>Nueva contraseña</label>
  <input type="password" value={next} onChange={...} required minLength={8} />
</div>

<div>
  <label>Confirmar nueva contraseña</label>
  <input type="password" value={confirm} onChange={...} required minLength={8} />
</div>
```

### 4.3 Ajuste del submit

```ts
async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  
  if (next.length < 8) { setError('...'); return; }
  if (next !== confirm) { setError('...'); return; }

  const body: any = { newPassword: next };
  if (!isFirstChange) {
    body.currentPassword = current;
  }

  const resp = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  
  // Si ok, redirigir al dashboard
  if (resp.ok) {
    navigate('/', { replace: true });
  }
}
```

---

## 5. Frontend — Cambios en `src/components/AdminPanel.tsx`

### 5.1 UserFormModal — Quitar input de contraseña

**Modo crear:**
- Quitar el input de "Contraseña"
- Agregar texto: "Se generará una contraseña temporal al crear el usuario"

**Después de crear:**
- Recibir `temporaryPassword` de la respuesta
- Abrir `PasswordDisplayModal` con la contraseña

### 5.2 Nuevo componente RoleFormModal

```tsx
function RoleFormModal({ isOpen, onClose, onSave, rol }: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { nombre: string; permisos: string[] }) => Promise<void>;
  rol?: { nombre: string; permisos: string[] } | null;
}) {
  const [nombre, setNombre] = useState('');
  const [permisos, setPermisos] = useState<string[]>([]);
  const isEdit = !!rol;

  // ... lógica similar a UserFormModal ...
}
```

### 5.3 Nuevo componente ConfirmDialog (ya existe, verificar)

- Verificar que `ConfirmDialog` ya existe en AdminPanel
- Reutilizar para: eliminar usuario, eliminar rol, reset password

### 5.4 handleResetPassword — Agregar confirmación

```ts
const [showResetConfirm, setShowResetConfirm] = useState(false);
const [resettingUser, setResettingUser] = useState<Usuario | null>(null);

function handleResetPassword(usuario: Usuario) {
  setResettingUser(usuario);
  setShowResetConfirm(true);
}

async function confirmResetPassword() {
  if (!resettingUser) return;
  
  const res = await fetch(`/api/admin/usuarios/${resettingUser.id}/reset-password`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (res.ok) {
    const data = await res.json();
    setGeneratedPassword(data.temporaryPassword);
    setResetUsername(resettingUser.username);
    setShowPasswordModal(true);
    setShowResetConfirm(false);
    setResettingUser(null);
    await loadData();
  }
}
```

### 5.5 Tab Roles — Funciones CRUD

```ts
// Crear rol
async function createRole(data: { nombre: string; permisos: string[] }) {
  const res = await fetch('/api/admin/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  await loadData();
}

// Editar rol (permisos)
async function updateRolePermisos(rol: string, permisos: string[]) {
  const res = await fetch(`/api/admin/roles/${rol}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ permisos }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  await loadData();
}

// Eliminar rol
async function deleteRole(rol: string) {
  const res = await fetch(`/api/admin/roles/${rol}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }
  await loadData();
}
```

### 5.6 UI del tab Roles

- Botón "Nuevo Rol" al lado del listado
- Cada rol en la lista tiene:
  - Icono de edición (lápiz) → abre `RoleFormModal` con permisos actuales
  - Icono de papelera → abre `ConfirmDialog`
- `RoleFormModal` con:
  - Nombre del rol (input)
  - Multi-select de permisos agrupados por módulo
  - Botones: Cancelar, Guardar
- `ConfirmDialog` para eliminar rol

---

## Archivos a crear/modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `docs/PLAN-MEJORAS-CRUD.md` | **Crear** | Este documento |
| `src/routes/auth.ts` | Modificar | Lógica de primer cambio en `/change-password` |
| `src/routes/admin.ts` | Modificar | Auto-gen password, CRUD roles endpoints |
| `src/ChangePassword.tsx` | Modificar | Detección automática primer cambio |
| `src/Login.tsx` | Modificar | Redirección si debeCambiarPassword |
| `src/components/AdminPanel.tsx` | Modificar | CRUD roles, auto-gen, confirmación reset |

---

## Orden de implementación

1. Crear `docs/PLAN-MEJORAS-CRUD.md`
2. **Backend:** Modificar `src/routes/auth.ts` (lógica de primer cambio)
3. **Backend:** Modificar `src/routes/admin.ts` (auto-gen password + CRUD roles)
4. **Frontend:** Modificar `src/ChangePassword.tsx` (detección automática)
5. **Frontend:** Modificar `src/Login.tsx` (redirección)
6. **Frontend:** Refactorizar `src/components/AdminPanel.tsx` (CRUD roles, auto-gen, confirmación)
7. **Build:** `npm run build`
8. **Sync:** `git pull workspace main` en deploy
9. **Migración:** Ejecutar si es necesario
10. **Reiniciar:** `Restart-Service -Name SenaSchedule` (manual)

---

## Criterios de aceptación

### CRUD Roles
- [ ] Admin puede crear un rol nuevo con nombre y permisos
- [ ] Admin puede editar los permisos de un rol existente
- [ ] Admin puede eliminar un rol que no esté asignado a ningún usuario
- [ ] El sistema previene eliminar el rol `admin`
- [ ] El sistema previene eliminar roles que tengan usuarios asignados
- [ ] El sistema previene crear roles con nombres duplicados

### Auto-generar Password
- [ ] El formulario de "Nuevo Usuario" no pide contraseña
- [ ] Al crear un usuario, se genera una contraseña de 12 caracteres
- [ ] La contraseña se muestra UNA SOLA VEZ al admin en un modal
- [ ] El botón "Copiar" funciona correctamente
- [ ] El usuario creado tiene `debeCambiarPassword = true`

### Forzar Cambio de Password
- [ ] Al hacer login con usuario nuevo, se redirige a `/cambiar-password`
- [ ] El formulario NO pide "Contraseña actual" si es primer cambio
- [ ] Después de cambiar, se redirige al dashboard
- [ ] El usuario no puede acceder a otras rutas hasta cambiar la contraseña

### Confirmación Reset
- [ ] Al hacer clic en "Reset", aparece un modal de confirmación
- [ ] El modal muestra el nombre del usuario afectado
- [ ] Solo si confirma, se ejecuta el reset
- [ ] Después del reset, se muestra la nueva contraseña

---

## Estimación

| Tarea | Tiempo |
|-------|--------|
| Backend: auth.ts (primer cambio) | 30 min |
| Backend: admin.ts (auto-gen + CRUD roles) | 1.5h |
| Frontend: ChangePassword.tsx | 30 min |
| Frontend: Login.tsx | 15 min |
| Frontend: AdminPanel.tsx | 2.5h |
| Build + sync + pruebas | 30 min |
| **Total** | **~5h** |

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Eliminar rol con usuarios | Validar count en backend antes de eliminar |
| Renombrar rol rompe referencias | Solo permitir editar permisos, no nombre (en esta versión) |
| Usuario queda atrapado en /cambiar-password | Después de cambiar, redirigir siempre al dashboard |
| Confirmación accidental de reset | Modal claro con nombre visible, dos botones distintos |
| Auto-gen password no se muestra | Logging: el modal siempre se muestra después de crear |
| Login no redirige correctamente | Verificar lógica en Login.tsx después de cada cambio |

---

## Dependencias

- bcryptjs (ya instalado)
- crypto (Node.js built-in)
- lucide-react (ya instalado)

---

## Notas para la implementación

- Seguir el patrón de código existente en `AdminPanel.tsx`
- Usar Tailwind classes consistentes con el resto de la UI
- Los modales deben cerrarse con ESC y click fuera
- El formulario debe tener validación básica en cliente
- Usar `alert()` o toasts para mensajes de éxito/error
- No agregar comments innecesarios en el código
- Mantener el `ConfirmDialog` reutilizable para todas las acciones de confirmación
