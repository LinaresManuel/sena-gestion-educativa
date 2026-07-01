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
    # Buscar nssm.exe bajo C:\tools
    $found = Get-ChildItem -Path "C:\tools" -Filter "nssm.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { return $found.FullName }
    return $null
}

function Find-ProjectPath {
    param([string]$StartDir)
    $current = Resolve-Path $StartDir
    while ($true) {
        if (Test-Path -LiteralPath (Join-Path $current "package.json")) { return $current }
        $parent = Split-Path -Parent $current
        if ($parent -eq $current) { return $null }
        $current = $parent
    }
}

if (-not (Test-Administrator)) {
    Write-Error "Este script debe ejecutarse como Administrador."
    exit 1
}

# Detectar ruta del proyecto
if (-not $ProjectPath) {
    $detected = Find-ProjectPath -StartDir (Get-Location).Path
    if ($detected) {
        $ProjectPath = $detected
        Write-Host "[INFO] Proyecto detectado en: $ProjectPath"
    } else {
        Write-Error "No se encontro package.json. Especifica -ProjectPath 'C:\ruta\al\proyecto'."
        exit 1
    }
}

if (-not (Test-Path -LiteralPath (Join-Path $ProjectPath "package.json"))) {
    Write-Error "No se encontro package.json en: $ProjectPath"
    exit 1
}

# Detectar NSSM
if (-not $NssmPath) {
    $NssmPath = Find-Nssm
}
if (-not $NssmPath) {
    Write-Error "NSSM no encontrado. Descargalo de https://nssm.cc/download y extrae nssm.exe (ej: C:\tools\nssm\win64\nssm.exe)"
    exit 1
}
Write-Host "[INFO] NSSM: $NssmPath"

if (-not (Test-Path -LiteralPath (Join-Path $ProjectPath "dist\server.cjs"))) {
    Write-Host "[WARN] No se encontro dist\server.cjs. Se compilara ahora..."
    Push-Location $ProjectPath
    try {
        & npm run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build fallo" }
    } finally {
        Pop-Location
    }
}
if (-not (Test-Path -LiteralPath (Join-Path $ProjectPath "dist\server.cjs"))) {
    Write-Error "Sigue sin existir dist\server.cjs tras el build."
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
