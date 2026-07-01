# Guía de Despliegue Local

Esta guía describe cómo instalar y configurar **SENA Gestión Educativa** en un PC Windows que funcionará como servidor LAN, accesible desde cualquier dispositivo en la red local.

---

## 1. Requisitos

### Hardware mínimo
- PC con Windows 10/11 o Windows Server 2019+
- 2 GB RAM, 1 GB de disco libre
- Conexión a la red local (Wi-Fi o Ethernet)

### Software
- **Node.js 18+** (recomendado 20 LTS): https://nodejs.org
- **Git** (opcional, para clonar el repo)
- **NSSM** (gestor de servicios): https://nssm.cc/download
- **sqlite3 CLI** (para backups): https://www.sqlite.org/download.html (opcional, pero recomendado)

---

## 2. Instalación inicial

### 2.1 Clonar o copiar el proyecto

```powershell
cd C:\
git clone <url-del-repo> sena-gestion-educativa
cd sena-gestion-educativa
```

O bien, copiar la carpeta del proyecto a `C:\sena-gestion-educativa\`.

### 2.2 Instalar dependencias

```powershell
npm install
```

### 2.3 Descargar NSSM

1. Descargar de https://nssm.cc/download
2. Extraer `nssm.exe` (versión 64-bit) a `C:\tools\nssm\`
3. Verificar:
   ```powershell
   C:\tools\nssm\nssm.exe version
   ```

### 2.4 Crear la estructura de datos

Ejecutar el script de PowerShell como **Administrador**:

```powershell
.\scripts\init-sena-data.ps1
```

Esto crea:
```
C:\sena-data\
├── db\           # Base de datos SQLite
├── backups\      # Respaldos automáticos
├── logs\         # Logs de la aplicación
└── uploads\      # Archivos subidos
```

### 2.5 Configurar variables de entorno

Crear `.env.local` en la raíz del proyecto:

```env
APP_URL=http://localhost:3000
DATABASE_URL=C:\sena-data\db\data.db
JWT_SECRET=<genera-una-cadena-aleatoria-de-al-menos-32-caracteres>
```

**Generar un JWT_SECRET seguro** (PowerShell):
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
```

### 2.6 Inicializar la base de datos

```powershell
npm run db:push     # Aplica el esquema
npm run seed        # Puebla con datos iniciales
```

### 2.7 Compilar el frontend

```powershell
npm run build
```

---

## 3. Instalar como servicio de Windows

Ejecutar PowerShell como **Administrador**:

```powershell
.\scripts\install-service.ps1
```

Esto registra el servicio `SenaSchedule` con:
- Inicio automático al arrancar Windows
- Reinicio automático si falla
- Logs en `C:\sena-data\logs\`
- Rotación automática de logs a 10 MB

### Iniciar el servicio

```powershell
Start-Service -Name SenaSchedule
```

O usando el script de control:
```powershell
.\scripts\service-control.ps1 -Action start
.\scripts\service-control.ps1 -Action status
```

---

## 4. Abrir el puerto en el firewall

Para que otros dispositivos de la red puedan acceder, abrir el puerto 3000:

```powershell
# Ejecutar PowerShell como Administrador
.\scripts\open-firewall.ps1
```

Si quieres restringir solo a la red privada:
```powershell
Set-NetFirewallRule -DisplayName "SENA Gestion Educativa (Puerto 3000)" -Profile Private
```

---

## 5. Configurar IP estática (recomendado)

Para que la URL no cambie cada vez que el router asigne una IP distinta:

1. Panel de control → Redes e Internet → Centro de redes
2. Clic en tu adaptador (Wi-Fi o Ethernet) → Propiedades
3. Seleccionar "Protocolo de Internet versión 4 (TCP/IPv4)" → Propiedades
4. Elegir "Usar la siguiente dirección IP" y completar:
   - **Dirección IP**: `192.168.1.100` (ejemplo, fuera del rango DHCP del router)
   - **Máscara de subred**: `255.255.255.0`
   - **Puerta de enlace**: `192.168.1.1` (la IP de tu router)
   - **DNS preferido**: `8.8.8.8` (Google)
   - **DNS alternativo**: `8.8.4.4`

Ver la IP actual y todas las interfaces:
```powershell
.\scripts\show-network.ps1
```

---

## 6. Acceder desde otros dispositivos

Una vez configurado, desde cualquier dispositivo en la misma red (PC, tablet, móvil):

| URL | Cuándo usarla |
|---|---|
| `http://192.168.1.100:3000` | Si configuraste IP estática |
| `http://<nombre-pc>:3000` | Si el descubrimiento de nombres funciona |
| `http://localhost:3000` | Solo desde el PC servidor |

### Primer acceso

1. Usuario por defecto: `admin`
2. Contraseña por defecto: `Admin123!`
3. El sistema forzará el cambio de contraseña en el primer login.

---

## 7. Programar respaldos automáticos

Ejecutar PowerShell como **Administrador**:

```powershell
.\scripts\install-backup-task.ps1
```

Esto crea una tarea programada que respalda la base de datos cada noche a las 02:00, conservando los últimos 7 días.

### Ejecutar un respaldo manual

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\backup.ps1
```

### Restaurar un respaldo

1. Detener el servicio: `Stop-Service -Name SenaSchedule`
2. Copiar el archivo de respaldo: `Copy-Item C:\sena-data\backups\data-YYYYMMDD.db C:\sena-data\db\data.db -Force`
3. Iniciar el servicio: `Start-Service -Name SenaSchedule`

---

## 8. Verificar la instalación

1. **Servicio corriendo**:
   ```powershell
   Get-Service -Name SenaSchedule
   ```
   Estado esperado: `Running`

2. **Endpoint de salud**:
   ```powershell
   Invoke-WebRequest http://localhost:3000/api/health
   ```
   Respuesta esperada: `{"status":"ok",...}`

3. **Acceso desde otro dispositivo**: Abrir `http://<IP>:3000` desde un móvil o PC en la red.

---

## 9. Estructura final

```
C:\sena-gestion-educativa\          # Proyecto (no se modifica en runtime)
├── dist\                            # Build de producción
├── node_modules\
├── .env.local                       # Configuración local
├── package.json
└── scripts\                         # Scripts de operación

C:\sena-data\                        # Datos (separado del proyecto)
├── db\data.db                       # Base de datos activa
├── backups\data-YYYYMMDD.db         # Respaldos
├── logs\
│   ├── app.log                      # Log de la aplicación (pino)
│   ├── service.out.log              # Salida estándar del servicio
│   └── service.err.log              # Errores del servicio
└── uploads\                         # Archivos subidos
```

---

## 10. Solución de problemas

### El servicio no arranca

Revisar los logs:
```powershell
Get-Content C:\sena-data\logs\service.err.log -Tail 30
```

### Otros dispositivos no se pueden conectar

1. Verificar firewall:
   ```powershell
   Get-NetFirewallRule -DisplayName "SENA Gestion Educativa*"
   ```
2. Verificar que el servicio está escuchando en 0.0.0.0:
   ```powershell
   netstat -an | Select-String ":3000.*LISTENING"
   ```
   Debe mostrar `0.0.0.0:3000`, no `127.0.0.1:3000`.
3. Verificar que el dispositivo cliente está en la misma red.

### Olvidé la contraseña del admin

1. Detener el servicio: `Stop-Service -Name SenaSchedule`
2. Abrir la BD con sqlite3:
   ```powershell
   sqlite3 C:\sena-data\db\data.db
   ```
3. Generar nuevo hash bcrypt (o usar el script de reset si existe).
4. Actualizar el registro manualmente.

### La base de datos está corrupta

1. Detener el servicio.
2. Restaurar el último respaldo:
   ```powershell
   Copy-Item C:\sena-data\backups\data-<fecha>.db C:\sena-data\db\data.db -Force
   ```
3. Iniciar el servicio.

---

## Próximos pasos

Ver [OPERATIONS.md](OPERATIONS.md) para la operación diaria del sistema.
