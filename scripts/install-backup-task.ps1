param(
    [string]$TaskName = "SenaSchedule-Backup",
    [string]$ScriptPath = "",
    [string]$Time = "02:00"
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

if (-not $ScriptPath) {
    $ScriptPath = Join-Path (Get-Location) "scripts\backup.ps1"
}

if (-not (Test-Path -LiteralPath $ScriptPath)) {
    Write-Error "No se encontro el script: $ScriptPath"
    exit 1
}

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[INFO] La tarea '$TaskName' ya existe. Reemplazandola..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false | Out-Null
}

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ScriptPath`""

$trigger = New-ScheduledTaskTrigger -Daily -At $Time

$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Minutes 30)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "Respaldo diario de la base de datos de SENA Gestion Educativa" -User "SYSTEM" -RunLevel Highest | Out-Null

Write-Host "[OK] Tarea programada instalada: $TaskName (diaria a las $Time)"
Write-Host "Ver con: Get-ScheduledTask -TaskName $TaskName"
