param(
    [string]$ServiceName = "SenaSchedule"
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

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "[INFO] El servicio '$ServiceName' no esta instalado."
    exit 0
}

$nssmPath = "C:\tools\nssm\nssm.exe"

Write-Host "Deteniendo servicio '$ServiceName'..."
& $nssmPath stop $ServiceName 2>$null | Out-Null
Start-Sleep -Seconds 3

Write-Host "Eliminando servicio '$ServiceName'..."
& $nssmPath remove $ServiceName confirm 2>$null | Out-Null

Write-Host "[OK] Servicio desinstalado."
