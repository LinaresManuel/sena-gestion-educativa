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

El sistema implementa tres roles con diferentes niveles de permisos:

| Rol | Permisos |
|-----|----------|
| **admin** | Acceso completo: crear, editar, eliminar y ver todos los módulos |
| **editor** | Puede crear, editar y ver, pero no eliminar recursos críticos |
| **lector** | Solo puede ver información, no puede crear ni modificar |

### Módulos Protegidos

Los siguientes módulos requieren rol `admin` o `editor`:
- Programación de instructores
- Todos los formularios de creación/edición
- Botones de eliminar en tablas

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

1. Verifica el rol del usuario:
   ```bash
   sqlite3 C:\sena-data\db\data.db "SELECT username, rol FROM usuarios WHERE username = 'tu_usuario';"
   ```
2. Si el rol es `lector`, cámbialo a `editor` o `admin`

### El servicio no inicia después de modificar la BD

1. Verifica la integridad de la base de datos:
   ```bash
   sqlite3 C:\sena-data\db\data.db "PRAGMA integrity_check;"
   ```
2. Revisa los logs de error
3. Restaura desde un backup si es necesario

---

## Próximas Mejoras

- [ ] Interfaz web para gestión de usuarios (requiere tarea Y)
- [ ] Sistema de permisos granulares por módulo
- [ ] Autenticación de dos factores (2FA)
- [ ] Política de expiración de contraseñas
- [ ] Registro de auditoría de cambios en usuarios
