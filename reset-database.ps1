# Reset SalesTrack database and rebuild Laravel tables.
# Run from: C:\xampp\htdocs\Attadance

$mysql = "C:\xampp\mysql\bin\mysql.exe"
$php = "C:\xampp\php\php.exe"
$backend = Join-Path $PSScriptRoot "backend"
$database = "attendance_sales_app"

Write-Host ""
Write-Host "Resetting database: $database" -ForegroundColor Cyan

& $mysql -uroot -e "DROP DATABASE IF EXISTS $database; CREATE DATABASE $database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Database create failed. Make sure MySQL is running in XAMPP." -ForegroundColor Red
    Write-Host "If MySQL reports leftover tablespace files, stop MySQL and remove:" -ForegroundColor Yellow
    Write-Host "  C:\xampp\mysql\data\$database" -ForegroundColor Yellow
    Write-Host "Then start MySQL and run this script again." -ForegroundColor Yellow
    exit 1
}

Set-Location -LiteralPath $backend
& $php artisan migrate --seed

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Migration failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Database created and tables migrated successfully." -ForegroundColor Green
