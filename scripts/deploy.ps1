<#
.SYNOPSIS
    Script para automatizar la actualizacion del despliegue local de SENA Gestion Educativa.
    Requiere ser ejecutado como Administrador.
#>

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " INICIANDO ACTUALIZACION DEL DESPLIEGUE  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Detener el servicio
Write-Host ""
Write-Host "[1/4] Deteniendo el servicio SenaSchedule..." -ForegroundColor Yellow
try {
    Stop-Service -Name SenaSchedule -ErrorAction Stop
    Write-Host "Servicio detenido correctamente." -ForegroundColor Green
} catch {
    Write-Host "ERROR: No se pudo detener el servicio - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Asegurese de ejecutar como Administrador." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# 2. Compilar el frontend
Write-Host ""
Write-Host "[2/4] Ejecutando compilacion (npm run build)..." -ForegroundColor Yellow
try {
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build fallo con codigo $LASTEXITCODE" }
} catch {
    Write-Host "ERROR: Compilacion fallida - $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# 3. Iniciar el servicio
Write-Host ""
Write-Host "[3/4] Iniciando el servicio SenaSchedule..." -ForegroundColor Yellow
try {
    Start-Service -Name SenaSchedule -ErrorAction Stop
    Write-Host "Servicio iniciado correctamente." -ForegroundColor Green
} catch {
    Write-Host "ERROR: No se pudo iniciar el servicio - $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

# 4. Verificar el estado del servicio
Write-Host ""
Write-Host "[4/4] Verificando estado final..." -ForegroundColor Yellow
Write-Host "-----------------------------------------"
Get-Service -Name SenaSchedule | Select-Object Name, Status, DisplayName | Format-Table
Write-Host "=========================================" -ForegroundColor Green
Write-Host " !Proceso completado con exito!          " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host ""
Read-Host "Presiona Enter para salir"
