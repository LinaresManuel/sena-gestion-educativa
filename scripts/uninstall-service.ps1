param(
    [string]$ServiceName = "SenaSchedule",
    [string]$NssmPath = ""
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

. (Join-Path $PSScriptRoot "_nssm-helper.ps1")
$NssmPath = Resolve-Nssm -GivenPath $NssmPath

$existing = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $existing) {
    Write-Host "[INFO] El servicio '$ServiceName' no esta instalado."
    exit 0
}

Write-Host "Deteniendo servicio '$ServiceName'..."
& $NssmPath stop $ServiceName 2>$null | Out-Null
Start-Sleep -Seconds 3

Write-Host "Eliminando servicio '$ServiceName'..."
& $NssmPath remove $ServiceName confirm 2>$null | Out-Null

Write-Host "[OK] Servicio desinstalado."
