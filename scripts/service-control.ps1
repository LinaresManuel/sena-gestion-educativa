param(
    [string]$ServiceName = "SenaSchedule",
    [string]$Action = "status"
)

$ErrorActionPreference = "Stop"
$nssmPath = "C:\tools\nssm\nssm.exe"

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "[ERROR] El servicio '$ServiceName' no esta instalado."
    Write-Host "Ejecuta primero: .\scripts\install-service.ps1"
    exit 1
}

switch ($Action.ToLower()) {
    "start" {
        Write-Host "Iniciando '$ServiceName'..."
        & $nssmPath start $ServiceName
        Start-Sleep -Seconds 3
    }
    "stop" {
        Write-Host "Deteniendo '$ServiceName'..."
        & $nssmPath stop $ServiceName
        Start-Sleep -Seconds 3
    }
    "restart" {
        Write-Host "Reiniciando '$ServiceName'..."
        & $nssmPath stop $ServiceName
        Start-Sleep -Seconds 3
        & $nssmPath start $ServiceName
        Start-Sleep -Seconds 3
    }
    "status" {
        $svc = Get-Service -Name $ServiceName
        Write-Host "Servicio:    $($svc.Name)"
        Write-Host "DisplayName: $($svc.DisplayName)"
        Write-Host "Estado:      $($svc.Status)"
        $pid = (Get-WmiObject Win32_Service -Filter "Name='$ServiceName'").ProcessId
        if ($pid -gt 0) {
            Write-Host "PID:         $pid"
        }
    }
    default {
        Write-Error "Accion no valida: $Action. Usa: start | stop | restart | status"
        exit 1
    }
}

if ($Action -ne "status") {
    $svc = Get-Service -Name $ServiceName
    Write-Host "Estado final: $($svc.Status)"
}
