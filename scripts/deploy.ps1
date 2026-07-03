<#
.SYNOPSIS
    Script para automatizar la actualización del despliegue local de SENA Gestión Educativa.
    Requiere ser ejecutado como Administrador.
#>

# Asegurar que el script se detenga si ocurre un error crítico
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " INICIANDO ACTUALIZACIÓN DEL DESPLIEGUE  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Detener el servicio
Write-Host "`n[1/4] Deteniendo el servicio SenaSchedule..." -ForegroundColor Yellow
Stop-Service -Name SenaSchedule
Write-Host "Servicio detenido correctamente." -ForegroundColor Green

# 2. Compilar el frontend
Write-Host "`n[2/4] Ejecutando compilación (npm run build)..." -ForegroundColor Yellow
& npm run build

# 3. Iniciar el servicio
Write-Host "`n[3/4] Reiniciando el servicio SenaSchedule..." -ForegroundColor Yellow
Start-Service -Name SenaSchedule
Write-Host "Servicio iniciado." -ForegroundColor Green

# 4. Verificar el estado del servicio
Write-Host "`n[4/4] Verificando estado final..." -ForegroundColor Yellow
Write-Host "-----------------------------------------"
Get-Service -Name SenaSchedule | Select-Object Name, Status, DisplayName | Format-Table
Write-Host "=========================================" -ForegroundColor Green
Write-Host " ¡Proceso completado con éxito!          " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

Write-Host ""
Read-Host "Presiona Enter para salir"
