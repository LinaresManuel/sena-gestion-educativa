param(
    [string]$Port = "3000"
)

Write-Host "=== Informacion de red para acceso LAN ===" -ForegroundColor Cyan
Write-Host ""

# Get all non-loopback IPv4 addresses
$adapters = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -ne "127.0.0.1" -and -not $_.IPAddress.StartsWith("169.254.") }

if ($adapters.Count -eq 0) {
    Write-Host "No se detectaron adaptadores de red activos." -ForegroundColor Yellow
} else {
    Write-Host "Direcciones IP locales detectadas:" -ForegroundColor Green
    foreach ($a in $adapters) {
        Write-Host "  http://$($a.IPAddress):$Port  ($($a.InterfaceAlias))" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Nombre del equipo: $env:COMPUTERNAME"
Write-Host "URL por nombre:    http://$($env:COMPUTERNAME.ToLower()):$Port"
Write-Host ""
Write-Host "Los dispositivos en la misma red pueden acceder usando cualquiera de esas URLs." -ForegroundColor Gray
