param(
    [string]$ServiceName = "SenaSchedule",
    [string]$DisplayName = "SENA Gestion Educativa",
    [string]$Description = "Sistema de gestion educativa SENA - servidor LAN",
    [string]$ProjectPath = "",
    [string]$NssmPath = "",
    [string]$NodeExe = "node"
)

$ErrorActionPreference = "Stop"

function Test-Administrator {
    $current = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $current.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Find-Nssm {
    $candidates = @(
        "C:\tools\nssm\nssm.exe",
        "C:\tools\nssm\win64\nssm.exe",
        "C:\tools\nssm\win32\nssm.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path -LiteralPath $c) { return $c }
    }
    $found = Get-ChildItem -Path "C:\tools" -Filter "nssm.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { return $found.FullName }
    return $null
}

if (-not (Test-Administrator)) {
    Write-Error "Este script debe ejecutarse como Administrador."
    exit 1
}

# Detectar ruta del proyecto.
# Prioridad: parametro explicito > carpeta padre del script > busqueda desde CWD.
if (-not $ProjectPath) {
    $scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
    $candidate = Split-Path -Parent $scriptDir
    if (Test-Path -LiteralPath (Join-Path $candidate "package.json")) {
        $ProjectPath = $candidate
        Write-Host "[INFO] Proyecto detectado (carpeta del script): $ProjectPath"
    } else {
        $current = (Get-Location).Path
        while ($true) {
            if (Test-Path -LiteralPath (Join-Path $current "package.json")) {
                $ProjectPath = $current
                Write-Host "[INFO] Proyecto detectado (desde cwd): $ProjectPath"
                break
            }
            $parent = Split-Path -Parent $current
            if ($parent -eq $current) { break }
            $current = $parent
        }
    }
}

if (-not $ProjectPath) {
    Write-Error "No se detecto el proyecto. Especifica -ProjectPath 'C:\ruta\al\proyecto'."
    exit 1
}

if (-not (Test-Path -LiteralPath (Join-Path $ProjectPath "package.json"))) {
    Write-Error "No se encontro package.json en: $ProjectPath"
    Write-Error "  Pwd actual: $(Get-Location)"
    Write-Error "  Script dir: $PSScriptRoot"
    exit 1
}

Write-Host "[OK] Proyecto: $ProjectPath"

# Detectar NSSM
if (-not $NssmPath) {
    $NssmPath = Find-Nssm
}
if (-not $NssmPath) {
    Write-Error "NSSM no encontrado. Descargalo de https://nssm.cc/download (ej: C:\tools\nssm\win64\nssm.exe)"
    exit 1
}
Write-Host "[OK] NSSM: $NssmPath"

# Verificar build
$serverPath = Join-Path $ProjectPath "dist\server.cjs"
if (-not (Test-Path -LiteralPath $serverPath)) {
    Write-Host "[INFO] dist\server.cjs no existe. Compilando..."
    Push-Location $ProjectPath
    try {
        & npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build fallo con codigo $LASTEXITCODE" }
    } finally {
        Pop-Location
    }
}
if (-not (Test-Path -LiteralPath $serverPath)) {
    Write-Error "Sigue sin existir dist\server.cjs tras el build."
    exit 1
}

# Verificar .env.local
$envPath = Join-Path $ProjectPath ".env.local"
if (-not (Test-Path -LiteralPath $envPath)) {
    Write-Warning "No existe .env.local en el proyecto. Crealo antes de iniciar el servicio."
}

# Detener si ya existe
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

Write-Host ""
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
Write-Host "[OK] Servicio instalado correctamente."
Write-Host ""
Write-Host "Comandos utiles:"
Write-Host "  Iniciar:    Start-Service -Name $ServiceName"
Write-Host "  Detener:    Stop-Service -Name $ServiceName"
Write-Host "  Estado:     Get-Service -Name $ServiceName"
Write-Host "  Desinstalar: .\scripts\uninstall-service.ps1"
