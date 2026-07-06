# Guía de Operaciones

Esta guía cubre la operación diaria del sistema **SENA Gestión Educativa** una vez instalado y configurado según [DEPLOYMENT.md](DEPLOYMENT.md).

---

## Gestión de Usuarios

Para información sobre credenciales, roles, y procedimientos para crear/modificar usuarios, consulta:

👉 **[USERS.md](USERS.md)** - Guía completa de gestión de usuarios

---

## 1. Control del servicio

El servidor corre como servicio de Windows llamado `SenaSchedule`.

### Estado actual

```powershell
Get-Service -Name SenaSchedule
```

O con el script de control:
```powershell
.\scripts\service-control.ps1 -Action status
```

### Iniciar, detener, reiniciar

```powershell
# Con cmdlets de Windows
Start-Service -Name SenaSchedule
Stop-Service -Name SenaSchedule
Restart-Service -Name SenaSchedule

# Con el script de control
.\scripts\service-control.ps1 -Action start
.\scripts\service-control.ps1 -Action stop
.\scripts\service-control.ps1 -Action restart
```

---

## 2. Logs

### Ubicaciones

| Archivo | Contenido |
|---|---|
| `C:\sena-data\logs\app.log` | Log estructurado JSON (peticiones, auditoría, errores) |
| `C:\sena-data\logs\service.out.log` | Salida estándar del proceso Node |
| `C:\sena-data\logs\service.err.log` | Errores y crashes del proceso Node |

### Consultar logs en tiempo real

```powershell
# Log de la aplicación
Get-Content C:\sena-data\logs\app.log -Wait -Tail 20

# Errores del servicio
Get-Content C:\sena-data\logs\service.err.log -Wait
```

### Buscar eventos específicos

```powershell
# Errores en el log de la app
Select-String -Path C:\sena-data\logs\app.log -Pattern "error" -SimpleMatch

# Logins exitosos
Select-String -Path C:\sena-data\logs\app.log -Pattern "POST.*\/api\/auth\/login" | Select-Object -Last 20

# Auditoría de cambios (POST/PUT/DELETE)
Select-String -Path C:\sena-data\logs\app.log -Pattern "mutation_audit" | Select-Object -Last 50

# Peticiones de un usuario específico
Select-String -Path C:\sena-data\logs\app.log -Pattern "username.*admin" | Select-Object -Last 20
```

### Rotación de logs

El servicio rota automáticamente cuando los archivos superan 10 MB. Para forzar limpieza manual:

```powershell
# Eliminar logs antiguos (mayores a 30 días)
Get-ChildItem C:\sena-data\logs\*.log | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item
```

---

## 3. Respaldos

### Respaldo manual

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

Salida esperada:
```
[2026-07-01 02:00:00] Iniciando respaldo de la base de datos...
  Origen:  C:\sena-data\db\data.db
  Destino: C:\sena-data\backups\data-20260701-020000.db
[OK] Respaldo completado (94.2 KB)
[OK] Retención aplicada (últimos 7 días)
```

### Listar respaldos disponibles

```powershell
Get-ChildItem C:\sena-data\backups\*.db | Sort-Object LastWriteTime -Descending | Select-Object Name, Length, LastWriteTime
```

### Restaurar un respaldo

⚠️ **El servicio debe estar detenido durante la restauración.**

```powershell
# 1. Detener el servicio
Stop-Service -Name SenaSchedule

# 2. Hacer copia de seguridad del estado actual
Copy-Item C:\sena-data\db\data.db C:\sena-data\backups\pre-restore-$(Get-Date -Format yyyyMMdd-HHmmss).db -Force

# 3. Restaurar el respaldo elegido
Copy-Item C:\sena-data\backups\data-20260630-020000.db C:\sena-data\db\data.db -Force

# 4. Iniciar el servicio
Start-Service -Name SenaSchedule

# 5. Verificar
Invoke-WebRequest http://localhost:3000/api/health
```

### Verificar la tarea programada de backup

```powershell
# Ver la tarea
Get-ScheduledTask -TaskName "SenaSchedule-Backup"

# Ejecutar la tarea manualmente
Start-ScheduledTask -TaskName "SenaSchedule-Backup"

# Ver el historial
Get-ScheduledTaskInfo -TaskName "SenaSchedule-Backup"
```

---

## 4. Gestión de usuarios

### Panel de Administración (recomendado)

La gestión de usuarios, roles y permisos se realiza desde el panel de administración:

1. Navegar a `/admin` (solo usuarios con rol `admin`)
2. Pestaña **Usuarios**: crear, editar, eliminar usuarios, asignar roles, resetear contraseñas
3. Pestaña **Roles y Permisos**: crear roles, asignar permisos por módulo
4. Pestaña **Estadísticas**: métricas del sistema

### Crear un usuario nuevo (consola de sqlite — solo si AdminPanel no está disponible)

```powershell
# Generar hash bcrypt de la contraseña
$password = "NuevaPass123"
$hash = node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" $password

# Insertar en la BD
sqlite3 C:\sena-data\db\data.db "INSERT INTO usuarios (username, password_hash, nombre, debe_cambiar_password, activo) VALUES ('jperez', '$hash', 'Juan Pérez', 1, 1);"

# Asignar un rol (ejemplo: editor)
sqlite3 C:\sena-data\db\data.db "INSERT INTO usuarios_roles (usuario_id, rol) VALUES ((SELECT id FROM usuarios WHERE username='jperez'), 'editor');"
```

### Cambiar la contraseña de un usuario

Desde AdminPanel: pestaña Usuarios → botón de reset de contraseña.

O manualmente:
```powershell
$newHash = node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" "NuevaPass123"
sqlite3 C:\sena-data\db\data.db "UPDATE usuarios SET password_hash = '$newHash', debe_cambiar_password = 0 WHERE username = 'admin';"
```

### Desactivar un usuario

Desde AdminPanel: pestaña Usuarios → editar → desactivar.

O manualmente:
```powershell
sqlite3 C:\sena-data\db\data.db "UPDATE usuarios SET activo = 0 WHERE username = 'jperez';"
```

### Listar usuarios

```powershell
sqlite3 C:\sena-data\db\data.db "SELECT u.id, u.username, u.nombre, u.activo, u.ultimo_login_at, GROUP_CONCAT(ur.rol) as roles FROM usuarios u LEFT JOIN usuarios_roles ur ON u.id = ur.usuario_id GROUP BY u.id;"
```

### Gestionar permisos de un rol

Desde AdminPanel: pestaña Roles y Permisos → seleccionar rol → marcar/desmarcar permisos.

Los permisos se organizan por módulo (10 módulos, 39 permisos totales). Cada módulo tiene: ver, crear, editar, eliminar.

**Permission Inheritance**: Si un usuario tiene cualquier permiso CRUD en un módulo (ej: `regionales.crear`), automáticamente puede ver ese módulo en el sidebar y dashboard. Esto es intencional.

---

## 5. Mantenimiento de la base de datos

### Estado y tamaño

```powershell
Get-Item C:\sena-data\db\data.db | Select-Object Name, Length, LastWriteTime
```

### Verificar integridad

```powershell
sqlite3 C:\sena-data\db\data.db "PRAGMA integrity_check;"
```

Debe devolver: `ok`.

### Optimizar (vacuum)

Reduce el tamaño del archivo tras muchos borrados:

```powershell
Stop-Service -Name SenaSchedule
sqlite3 C:\sena-data\db\data.db "VACUUM;"
Start-Service -Name SenaSchedule
```

### Listar tablas y conteo de registros

```powershell
sqlite3 C:\sena-data\db\data.db ".tables"
sqlite3 C:\sena-data\db\data.db "SELECT 'regionales' as tabla, COUNT(*) as registros FROM regionales UNION ALL SELECT 'centros', COUNT(*) FROM centros_formacion UNION ALL SELECT 'instructores', COUNT(*) FROM instructores UNION ALL SELECT 'fichas', COUNT(*) FROM fichas;"
```

---

## 6. Actualización del sistema

### Actualizar el código

```powershell
# Detener el servicio
Stop-Service -Name SenaSchedule

# Actualizar el código (git o copiar nueva versión)
cd C:\sena-gestion-educativa
git pull

# Actualizar dependencias
npm install

# Compilar
npm run build

# Aplicar migraciones de BD (si hay)
npm run db:push

# Iniciar el servicio
Start-Service -Name SenaSchedule
```

### Actualizar con deploy automatizado (recomendado)

```powershell
# Requiere PowerShell como Administrador
powershell -ExecutionPolicy Bypass -File scripts\deploy.ps1
```

Este script ejecuta: detener servicio → build → iniciar servicio → verificar health check.

### Actualizar Node.js

1. Descargar la nueva versión LTS de https://nodejs.org
2. Instalar (sobrescribe la versión anterior)
3. Verificar: `node --version`
4. Reiniciar el servicio: `Restart-Service -Name SenaSchedule`

---

## 7. Monitoreo rápido

### Health check

```powershell
Invoke-WebRequest http://localhost:3000/api/health | Select-Object -ExpandProperty Content
```

### Métricas rápidas (PowerShell)

```powershell
# Uso de memoria del proceso Node
Get-Process -Name node | Select-Object Name, Id, @{N="RAM_MB";E={[math]::Round($_.WorkingSet64/1MB,1)}}, CPU

# Tamaño de la BD
Get-Item C:\sena-data\db\data.db | Select-Object @{N="Size_MB";E={[math]::Round($_.Length/1MB,2)}}

# Tamaño total de respaldos
Get-ChildItem C:\sena-data\backups\*.db | Measure-Object -Property Length -Sum | Select-Object @{N="Total_MB";E={[math]::Round($_.Sum/1MB,2)}}
```

### Configurar alerta de salud (opcional)

Crear una tarea programada que revise `/api/health` cada 5 minutos y registre fallos.

---

## 8. Comandos de referencia rápida

```powershell
# Estado
Get-Service SenaSchedule

# Reiniciar
Restart-Service SenaSchedule

# Ver logs
Get-Content C:\sena-data\logs\app.log -Tail 30

# Respaldo manual
powershell -ExecutionPolicy Bypass -File .\scripts\backup.ps1

# Mostrar IPs de acceso
.\scripts\show-network.ps1

# Health check
curl http://localhost:3000/api/health

# Detener (emergencia)
Stop-Service SenaSchedule -Force

# Iniciar (post-mantenimiento)
Start-Service SenaSchedule

# Deploy automatizado (requiere admin)
powershell -ExecutionPolicy Bypass -File scripts\deploy.ps1
```

---

## 9. Contacto / soporte

Para reportar problemas o solicitar nuevas funcionalidades, documentar:

1. **Qué se intentó hacer**
2. **Qué error o comportamiento se obtuvo**
3. **Logs relevantes** (las últimas 30 líneas de `app.log` y `service.err.log`)
4. **Configuración del entorno** (versión de Node, sistema operativo)

Con esta información el diagnóstico es mucho más rápido.
