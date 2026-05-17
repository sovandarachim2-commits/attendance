# Regenerate HTTPS certs for local + phone access (mkcert required)
# Usage: .\scripts\setup-dev-https.ps1

$root = Split-Path $PSScriptRoot -Parent
$frontend = Join-Path $root 'frontend'

function Get-LanIp {
    $cfg = Get-NetIPConfiguration -ErrorAction SilentlyContinue |
        Where-Object {
            $_.NetAdapter.Status -eq 'Up' -and
            $_.IPv4DefaultGateway -and
            $_.IPv4Address.IPAddress -match '^(192\.168\.|10\.\d+\.)'
        } |
        Select-Object -First 1

    if ($cfg) {
        return $cfg.IPv4Address.IPAddress
    }

    return (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -match '^192\.168\.\d{1,3}\.\d{1,3}$' -and $_.IPAddress -notmatch '\.1$' } |
        Select-Object -First 1 -ExpandProperty IPAddress)
}

if (-not (Get-Command mkcert -ErrorAction SilentlyContinue)) {
    Write-Host ''
    Write-Host '  mkcert is not installed.' -ForegroundColor Red
    Write-Host '  Install:  choco install mkcert   OR   scoop install mkcert' -ForegroundColor Yellow
    Write-Host '  Then run:  mkcert -install' -ForegroundColor Yellow
    Write-Host ''
    exit 1
}

$lanIp = Get-LanIp
if (-not $lanIp) {
    Write-Host '  Could not detect LAN IP. Connect to Wi-Fi and try again.' -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host '  Generating dev certificate...' -ForegroundColor Cyan
Write-Host "  LAN IP: $lanIp" -ForegroundColor Gray

Push-Location $frontend
try {
    & mkcert -install 2>&1 | Out-Null
    & mkcert -cert-file cert.pem -key-file key.pem localhost 127.0.0.1 $lanIp ::1
    if ($LASTEXITCODE -ne 0) { throw 'mkcert failed' }
} finally {
    Pop-Location
}

# Save LAN IP for Vite HMR
$envFile = Join-Path $root '.env'
$line = "DEV_LAN_IP=$lanIp"
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    if ($content -match '(?m)^DEV_LAN_IP=') {
        $content = $content -replace '(?m)^DEV_LAN_IP=.*$', $line
    } else {
        $content = $content.TrimEnd() + "`r`n`r`n# Dev server LAN IP for phone HTTPS + Vite HMR`r`n$line`r`n"
    }
    Set-Content -Path $envFile -Value $content -NoNewline
} else {
    Set-Content -Path $envFile -Value "# Dev server`r`n$line`r`n"
}

Write-Host ''
Write-Host '  Done. Certificate includes:' -ForegroundColor Green
Write-Host '    localhost, 127.0.0.1, ::1,' $lanIp -ForegroundColor Gray
Write-Host ''
Write-Host "  Phone URL:  https://${lanIp}:5174" -ForegroundColor Cyan
Write-Host ''
Write-Host '  iPhone: install mkcert root CA from folder shown by:  mkcert -CAROOT' -ForegroundColor Yellow
Write-Host '    Then Settings - General - About - Certificate Trust Settings - enable.' -ForegroundColor Yellow
Write-Host ''
Write-Host '  Restart:  .\start.ps1' -ForegroundColor Yellow
Write-Host ''
