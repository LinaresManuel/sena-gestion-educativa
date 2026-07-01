param(
    [string]$DataDir = "C:\sena-data"
)

$ErrorActionPreference = "Stop"

Write-Host "Creando estructura de carpetas en $DataDir ..."

$subdirs = @("db", "backups", "logs", "uploads")
foreach ($sub in $subdirs) {
    $path = Join-Path $DataDir $sub
    if (-not (Test-Path -LiteralPath $path)) {
        New-Item -ItemType Directory -Path $path -Force | Out-Null
        Write-Host "  [+] $path"
    } else {
        Write-Host "  [=] $path (ya existe)"
    }
}

Write-Host ""
Write-Host "[OK] Estructura creada en $DataDir"
Write-Host ""
Write-Host "Próximos pasos:"
Write-Host "  1. Configura la variable de entorno DATABASE_URL=$DataDir\db\data.db en .env.local"
Write-Host "  2. Si ya tienes una base de datos, muévela a $DataDir\db\data.db"
Write-Host "  3. Ejecuta 'npm run db:push' para inicializar el esquema"
Write-Host "  4. Ejecuta 'npm run seed' para cargar datos iniciales"
