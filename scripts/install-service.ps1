param(
    [string]$ServiceName = "SenaSchedule",
    [string]$DisplayName = "SENA Gestion Educativa",
    [string]$Description = "Sistema de gestion educativa SENA - servidor LAN",
    [string]$ProjectPath = (Get-Location).Path,
    [string]$NssmPath = "C:\tools\nssm\nssm.exe",
    [string]$NodeExe = "node"
)

$ErrorActionPreference = "Stop"

function Test-Administrator {
    $current = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $current.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Error "Este script debe ejecutarse como Administrador."
    exit 1
}

if (-not (Test-Path -LiteralPath $NssmPath)) {
    Write-Error "NSSM no encontrado en: $NssmPath`nDescarga desde https://nssm.cc/download y extrae nssm.exe a esa ruta."
    exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $ProjectPath "package.json"))) {
    Write-Error "No se encontro package.json en: $ProjectPath"
    exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $ProjectPath "dist\server.cjs"))) {
    Write-Error "No se encontro dist\server.cjs. Ejecuta primero 'npm run build'."
    exit 1
}

# Stop if already installed
$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[INFO] El servicio '$ServiceName' ya existe. Reinstalando..."
    & $NssmPath stop $ServiceName 2>$null | Out-Null
    Start-Sleep -Seconds 2
    & $NssmPath remove $ServiceName confirm 2>$null | Out-Null
    Start-Sleep -Seconds 1
}

$logsDir = "C:\sena-data\logs"
if (-not (Test-Path -LiteralPath $logsDir)) {
    New-Item -ItemType Directory -Path $logsDir -Force | Out-Null
}

Write-Host "Instalando servicio '$ServiceName'..."
Write-Host "  Proyecto:  $ProjectPath"
Write-Host "  Node:      $NodeExe"
Write-Host "  Logs:      $logsDir\service.out.log"

& $NssmPath install $ServiceName $NodeExe "dist\server.cjs" | Out-Null
& $NssmPath set $ServiceName AppDirectory $ProjectPath | Out-Null
& $NssmPath set $ServiceName DisplayName $DisplayName | Out-Null
& $NssmPath set $ServiceName Description $Description | Out-Null
& $NssmPath set $ServiceName Start SERVICE_AUTO_START | Out-Null
& $NssmPath set $ServiceName AppEnvironmentExtra "NODE_ENV=production" | Out-Null
& $NssmPath set $ServiceName AppStdout "$logsDir\service.out.log" | Out-Null
& $NssmPath set $ServiceName AppStderr "$logsDir\service.err.log" | Out-Null
& $NssmPath set $ServiceName AppRotateFiles 1 | Out-Null
& $NssmPath set $ServiceName AppRotateOnline 1 | Out-Null
& $NssmPath set $ServiceName AppRotateBytes 10485760 | Out-Null
& $NssmPath set $ServiceName AppRotateSeconds 0 | Out-Null
& $NssmPath set $ServiceName AppExit Default Restart | Out-Null
& $NssmPath set $ServiceName AppRestartDelay 5000 | Out-Null
& $NssmPath set $ServiceName AppThrottle 10000 | Out-Null
& $NssmPath set $ServiceName AppStdoutCreationDisposition 4 | Out-Null
& $NssmPath set $ServiceName AppStderrCreationDisposition 4 | Out-Null

Write-Host ""
Write-Host "[OK] Servicio instalado."
Write-Host ""
Write-Host "Para iniciar:"
Write-Host "  Start-Service -Name $ServiceName"
Write-Host "  O:    & '$NssmPath' start $ServiceName"
Write-Host ""
Write-Host "Para desinstalar:"
Write-Host "  .\scripts\uninstall-service.ps1"
