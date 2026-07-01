param(
    [string]$DataDir = "C:\sena-data",
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$ruleName = "SENA Gestion Educativa (Puerto $Port)"

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "[OK] La regla '$ruleName' ya existe"
    exit 0
}

try {
    New-NetFirewallRule -DisplayName $ruleName `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort $Port `
        -Profile Any `
        -Description "Permite el acceso LAN al servidor SENA Gestion Educativa"
    Write-Host "[OK] Regla de firewall creada: $ruleName (puerto $Port)"
} catch {
    Write-Error "No se pudo crear la regla de firewall. ¿Tienes permisos de administrador? Error: $_"
    exit 1
}

Write-Host ""
Write-Host "Si quieres que solo la red local tenga acceso, limita el perfil a 'Private':"
Write-Host "  Set-NetFirewallRule -DisplayName '$ruleName' -Profile Private"
