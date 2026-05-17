@echo off
echo.
echo  SalesTrack - Phone access setup
echo  ==============================
echo.
echo  [1] Allow firewall port 5174...
powershell -Command "Start-Process cmd -ArgumentList '/c netsh advfirewall firewall add rule name=\"SalesTrack Vite 5174\" dir=in action=allow protocol=TCP localport=5174 2>nul & echo Firewall rule added. & pause' -Verb RunAs"
echo.
echo  [2] Regenerate HTTPS certificate for your LAN IP...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\setup-dev-https.ps1"
echo.
pause
