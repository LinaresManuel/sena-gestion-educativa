param(
    [string]$DataDir = "C:\sena-data",
    [int]$RetentionDays = 7
)

$ErrorActionPreference = "Stop"

$dbPath = Join-Path $DataDir "db\data.db"
$backupDir = Join-Path $DataDir "backups"

if (-not (Test-Path -LiteralPath $dbPath)) {
    Write-Error "No se encontró la base de datos en: $dbPath"
    exit 1
}

if (-not (Test-Path -LiteralPath $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $backupDir "data-$timestamp.db"

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Iniciando respaldo de la base de datos..."
Write-Host "  Origen:  $dbPath"
Write-Host "  Destino: $backupFile"

try {
    & sqlite3.exe $dbPath ".backup '$backupFile'"
    if ($LASTEXITCODE -ne 0) {
        throw "sqlite3 .backup falló con código $LASTEXITCODE"
    }
} catch {
    Write-Error "Error durante el respaldo: $_"
    exit 1
}

if (-not (Test-Path -LiteralPath $backupFile)) {
    Write-Error "El archivo de respaldo no se creó"
    exit 1
}

$size = (Get-Item -LiteralPath $backupFile).Length
Write-Host "[OK] Respaldo completado ($([math]::Round($size / 1KB, 1)) KB)"

$cutoff = (Get-Date).AddDays(-$RetentionDays)
Get-ChildItem -LiteralPath $backupDir -Filter "data-*.db" -File |
    Where-Object { $_.LastWriteTime -lt $cutoff } |
    ForEach-Object {
        Write-Host "  [LIMPIEZA] Eliminando respaldo antiguo: $($_.Name)"
        Remove-Item -LiteralPath $_.FullName -Force
    }

Write-Host "[OK] Retención aplicada (últimos $RetentionDays días)"
