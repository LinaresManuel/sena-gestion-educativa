# Gestión de Usuarios

## Credenciales Actuales

### Usuario Administrador (por defecto)

| Campo | Valor |
|-------|-------|
| **Username** | `admin` |
| **Password** | `Admin123!` |
| **Rol** | `admin` |
| **Nombre** | Administrador |
| **Estado** | Activo |
| **Debe cambiar password** | Sí |

⚠️ **IMPORTANTE:** La contraseña `Admin123!` es temporal. El sistema forzará el cambio en el primer inicio de sesión.

---

## Roles Disponibles

El sistema implementa cinco roles con diferentes niveles de permisos:

| Rol | Permisos | Descripción |
|-----|----------|-------------|
| **admin** | 30 permisos (todos) | Acceso completo a todo el sistema |
| **editor** | 22 permisos | Puede crear, editar y ver la mayoría de módulos |
| **instructor** | 9 permisos | Puede ver programación, registrar notas y asistencia |
| **lector** | 8 permisos | Solo puede ver información, no puede modificar |
| **aprendiz** | 5 permisos | Puede ver inicio, comunicación, notas y asistencia |

### Permisos por Módulo

| Módulo | Permisos Disponibles |
|--------|---------------------|
| **inicio** | ver, reportes |
| **programacion** | ver, crear, editar, eliminar |
| **comunicacion** | ver, enviar, responder, eliminar |
| **inventario** | ver, crear, editar, eliminar |
| **cursos** | ver, crear, editar, eliminar |
| **salones** | ver, crear, editar, eliminar |
| **notas** | ver, registrar, editar, eliminar |
| **asistencia** | ver, registrar, editar, eliminar |

### Gestión de Permisos

Los permisos se gestionan desde el panel de administración (`/admin`):
- **Roles:** Asignar permisos a roles específicos
- **Usuarios:** Asignar roles a usuarios
- **Estadísticas:** Ver resumen del sistema

---

## Procedimientos

### 1. Crear un Nuevo Usuario

#### Opción A: Desde la Interfaz Web (Recomendado)

1. Inicia sesión como `admin`
2. Navega a la sección de configuración (pendiente de implementar)
3. Completa el formulario con:
   - Username (único)
   - Password (mínimo 8 caracteres)
   - Nombre completo
   - Rol (admin/editor/lector)

#### Opción B: Directamente en la Base de Datos

```bash
# Detener el servicio
Stop-Service -Name SenaSchedule

# Abrir la base de datos con sqlite3
sqlite3 C:\sena-data\db\data.db
```

Ejecutar el siguiente SQL (reemplazar los valores):

```sql
-- Generar hash bcrypt para la contraseña
-- Usar: https://bcrypt-generator.com/ o similar
-- Ejemplo: "MiPassword123" -> "$2a$10$..."

INSERT INTO usuarios (username, password_hash, nombre, rol, activo, debe_cambiar_password)
VALUES (
  'nuevo_usuario',
  '$2a$10$HASH_BCRYPT_AQUI',
  'Nombre Completo',
  'editor',
  1,
  1
);
```

Reiniciar el servicio:
```bash
Start-Service -Name SenaSchedule
```

### 2. Cambiar el Rol de un Usuario

```bash
# Detener el servicio
Stop-Service -Name SenaSchedule

# Abrir la base de datos
sqlite3 C:\sena-data\db\data.db
```

Ejecutar:
```sql
-- Cambiar rol a 'admin'
UPDATE usuarios SET rol = 'admin' WHERE username = 'nombre_usuario';

-- Cambiar rol a 'editor'
UPDATE usuarios SET rol = 'editor' WHERE username = 'nombre_usuario';

-- Cambiar rol a 'lector'
UPDATE usuarios SET rol = 'lector' WHERE username = 'nombre_usuario';
```

Reiniciar el servicio:
```bash
Start-Service -Name SenaSchedule
```

### 3. Resetear la Contraseña de un Usuario

Si olvidaste la contraseña de un usuario:

```bash
# Detener el servicio
Stop-Service -Name SenaSchedule

# Abrir la base de datos
sqlite3 C:\sena-data\db\data.db
```

Generar un nuevo hash bcrypt para la nueva contraseña (ej: "NuevaPass123"):
- Usar: https://bcrypt-generator.com/
- Rounds: 10

Ejecutar:
```sql
UPDATE usuarios 
SET password_hash = '$2a$10$NUEVO_HASH_AQUI',
    debe_cambiar_password = 1
WHERE username = 'admin';
```

Reiniciar el servicio:
```bash
Start-Service -Name SenaSchedule
```

El usuario deberá cambiar la contraseña en el próximo inicio de sesión.

### 4. Desactivar un Usuario

```bash
Stop-Service -Name SenaSchedule
sqlite3 C:\sena-data\db\data.db
```

```sql
-- Desactivar usuario
UPDATE usuarios SET activo = 0 WHERE username = 'nombre_usuario';

-- Reactivar usuario
UPDATE usuarios SET activo = 1 WHERE username = 'nombre_usuario';
```

```bash
Start-Service -Name SenaSchedule
```

### 5. Eliminar un Usuario

⚠️ **ADVERTENCIA:** Esta acción es irreversible.

```bash
Stop-Service -Name SenaSchedule
sqlite3 C:\sena-data\db\data.db
```

```sql
DELETE FROM usuarios WHERE username = 'nombre_usuario';
```

```bash
Start-Service -Name SenaSchedule
```

---

## Listar Todos los Usuarios

```bash
sqlite3 C:\sena-data\db\data.db "SELECT id, username, nombre, rol, activo, debe_cambiar_password FROM usuarios;"
```

O usar el script incluido:
```bash
npx tsx list-users.ts
```

---

## Consideraciones de Seguridad

1. **Contraseñas fuertes:** Usa al menos 8 caracteres con mayúsculas, minúsculas, números y símbolos
2. **Cambio periódico:** Considera cambiar contraseñas cada 90 días
3. **Mínimo de admins:** Limita el número de usuarios con rol `admin`
4. **Usuarios inactivos:** Desactiva cuentas que no se usen
5. **Auditoría:** Revisa los logs en `C:\sena-data\logs\app.log` para monitorear accesos

---

## Troubleshooting

### No puedo iniciar sesión como admin

1. Verifica que el servicio esté corriendo: `Get-Service -Name SenaSchedule`
2. Revisa los logs: `Get-Content C:\sena-data\logs\service.err.log -Tail 50`
3. Resetear la contraseña siguiendo el procedimiento anterior

### El usuario no tiene permisos para editar

1. Verifica el rol del usuario en la BD:
   ```bash
   sqlite3 C:\sena-data\db\data.db "SELECT username, rol FROM usuarios WHERE username = 'tu_usuario';"
   ```
2. Verifica los permisos del rol en `roles_permisos`:
   ```bash
   sqlite3 C:\sena-data\db\data.db "SELECT rp.rol, p.codigo FROM roles_permisos rp JOIN permisos p ON rp.permiso_id = p.id WHERE rp.rol = 'rol_usuario';"
   ```
3. Si el rol no tiene los permisos necesarios, asígnalos desde el panel de administración (`/admin`)
4. El usuario debe cerrar sesión y volver a iniciar para que los cambios surtan efecto

### El servicio no inicia después de modificar la BD

1. Verifica la integridad de la base de datos:
   ```bash
   sqlite3 C:\sena-data\db\data.db "PRAGMA integrity_check;"
   ```
2. Revisa los logs de error
3. Restaura desde un backup si es necesario

---

## Próximas Mejoras

- [x] Sistema de permisos granulares por módulo ✅
- [x] Interfaz web para gestión de usuarios (panel de administración) ✅
- [ ] Autenticación de dos factores (2FA)
- [ ] Política de expiración de contraseñas
- [ ] Registro de auditoría de cambios en usuarios
