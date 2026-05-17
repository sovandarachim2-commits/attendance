# SalesTrack - one-command startup
# Usage: .\start.ps1

$root     = $PSScriptRoot
$php      = "C:\xampp\php\php.exe"
$backend  = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

function Get-LanIp {
    $cfg = Get-NetIPConfiguration -ErrorAction SilentlyContinue |
        Where-Object {
            $_.NetAdapter.Status -eq 'Up' -and
            $_.IPv4DefaultGateway -and
            $_.IPv4Address.IPAddress -match '^(192\.168\.|10\.\d+\.)'
        } |
        Select-Object -First 1
    if ($cfg) { return $cfg.IPv4Address.IPAddress }
    return $null
}

$lanIp = Get-LanIp

Write-Host ""
Write-Host "  SalesTrack - starting..." -ForegroundColor Cyan

# Warn if HTTPS cert may not work on phone
$certFile = Join-Path $frontend "cert.pem"
if (-not (Test-Path $certFile)) {
    Write-Host "  [!] No cert.pem — run:  .\scripts\setup-dev-https.ps1" -ForegroundColor Yellow
} elseif ($lanIp) {
    $certText = Get-Content $certFile -Raw
    if ($certText -notmatch [regex]::Escape($lanIp)) {
        Write-Host "  [!] Certificate missing LAN IP $lanIp" -ForegroundColor Yellow
        Write-Host "      Some phones will show blank page. Run:  .\scripts\setup-dev-https.ps1" -ForegroundColor Yellow
    }
}

# 1. Kill anything already on our ports
foreach ($port in @(5174, 8000)) {
    $pids = (netstat -ano 2>$null |
             Select-String ":$port\s" |
             Where-Object { $_ -match 'LISTENING' } |
             ForEach-Object { ($_ -split '\s+')[-1] }) |
             Select-Object -Unique
    foreach ($p in $pids) {
        if ($p -match '^\d+$') {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
}
Write-Host "  [1/3] Cleared old processes on :5174 and :8000" -ForegroundColor Green

# 2. Start Laravel backend (localhost only — phone uses Vite /api proxy)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$php' -f '$backend\artisan' serve --host=127.0.0.1 --port=8000" -WindowStyle Minimized
Write-Host "  [2/3] Laravel API started  ->  http://127.0.0.1:8000" -ForegroundColor Green

# 3. Start Vite frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontend'; npm run dev" -WindowStyle Minimized
Write-Host "  [3/3] Vite frontend started ->  https://localhost:5174" -ForegroundColor Green

# 4. Wait for Vite then open browser
Write-Host ""
Write-Host "  Waiting for Vite to be ready..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    $listening = netstat -ano 2>$null | Select-String ":5174" | Select-String "LISTENING"
    if ($listening) { $ready = $true; break }
}

if ($ready) {
    Start-Process "https://localhost:5174"
    Write-Host "  Browser opened." -ForegroundColor Green
} else {
    Write-Host "  Vite took too long - open https://localhost:5174 manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Computer : https://localhost:5174" -ForegroundColor Cyan
if ($lanIp) {
    Write-Host "  Phone    : https://${lanIp}:5174  (must use https, same Wi-Fi)" -ForegroundColor Cyan
} else {
    Write-Host "  Phone    : connect PC to Wi-Fi, then run setup-dev-https.ps1" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  Phone not loading?" -ForegroundColor DarkGray
Write-Host "    1. Run Allow Phone Access.bat (firewall)" -ForegroundColor DarkGray
Write-Host "    2. Run .\scripts\setup-dev-https.ps1 (certificate)" -ForegroundColor DarkGray
Write-Host "    3. Leave VITE_API_URL empty in .env (use proxy)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Both server windows are minimized." -ForegroundColor DarkGray
Write-Host "  Press Ctrl+C or close this window to stop." -ForegroundColor DarkGray
Write-Host ""

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
