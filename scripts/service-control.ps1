param(
    [string]$ServiceName = "SenaSchedule",
    [string]$Action = "status",
    [string]$NssmPath = ""
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "_nssm-helper.ps1")
$NssmPath = Resolve-Nssm -GivenPath $NssmPath

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "[ERROR] El servicio '$ServiceName' no esta instalado."
    Write-Host "Ejecuta primero: .\scripts\install-service.ps1"
    exit 1
}

switch ($Action.ToLower()) {
    "start" {
        Write-Host "Iniciando '$ServiceName'..."
        & $NssmPath start $ServiceName
        Start-Sleep -Seconds 3
    }
    "stop" {
        Write-Host "Deteniendo '$ServiceName'..."
        & $NssmPath stop $ServiceName
        Start-Sleep -Seconds 3
    }
    "restart" {
        Write-Host "Reiniciando '$ServiceName'..."
        & $NssmPath stop $ServiceName
        Start-Sleep -Seconds 3
        & $NssmPath start $ServiceName
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
