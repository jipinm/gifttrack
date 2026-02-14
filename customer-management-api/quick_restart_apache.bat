@echo off
REM Quick Apache Restart Script
echo Restarting Apache...

REM Stop Apache
echo Stopping Apache...
taskkill /F /IM httpd.exe >nul 2>&1

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start Apache
echo Starting Apache...
start "" "C:\xampp\apache\bin\httpd.exe"

timeout /t 3 /nobreak >nul

REM Check if running
tasklist | find /I "httpd.exe" >nul
if %errorLevel% equ 0 (
    echo.
    echo ================================================================
    echo   Apache Restarted Successfully!
    echo ================================================================
    echo.
    echo Test your API:
    echo   http://192.168.1.4/gifttrack/customer-management-api/api/health
    echo.
) else (
    echo.
    echo ================================================================
    echo   Warning: Apache may not be running
    echo ================================================================
    echo.
    echo Please check XAMPP Control Panel and start Apache manually.
    echo.
)

pause
