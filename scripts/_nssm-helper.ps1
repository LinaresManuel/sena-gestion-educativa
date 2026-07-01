function Find-Nssm {
    $candidates = @(
        "C:\tools\nssm\nssm.exe",
        "C:\tools\nssm\win64\nssm.exe",
        "C:\tools\nssm\win32\nssm.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path -LiteralPath $c) { return $c }
    }
    $found = Get-ChildItem -Path "C:\tools" -Filter "nssm.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { return $found.FullName }
    return $null
}

function Resolve-Nssm {
    param([string]$GivenPath = "")
    if ($GivenPath -and (Test-Path -LiteralPath $GivenPath)) { return $GivenPath }
    $detected = Find-Nssm
    if ($detected) { return $detected }
    Write-Error "NSSM no encontrado. Descargalo de https://nssm.cc/download (ej: C:\tools\nssm\win64\nssm.exe)"
    exit 1
}
