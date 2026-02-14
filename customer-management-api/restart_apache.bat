@echo off
REM Restart Apache via XAMPP
REM This script stops and starts Apache to apply configuration changes

echo ================================================================
echo   Restarting Apache Server
echo ================================================================
echo.

echo Stopping Apache...
"C:\xampp\apache\bin\httpd.exe" -k stop

timeout /t 3 /nobreak >nul

echo Starting Apache...
"C:\xampp\apache\bin\httpd.exe" -k start

timeout /t 2 /nobreak >nul

echo.
echo ================================================================
echo   Apache Restarted
echo ================================================================
echo.
echo Please check XAMPP Control Panel to verify Apache is running.
echo If Apache shows errors, check the Apache error log.
echo.
pause
