@echo off
REM Configure Windows Firewall for Apache HTTP Server
REM Run this script as Administrator

echo ================================================================
echo   Apache HTTP Server - Firewall Configuration
echo ================================================================
echo.

echo Checking administrator privileges...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo.
    echo Right-click this file and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo.
echo Adding Windows Firewall rule for Apache HTTP Server...
echo.

netsh advfirewall firewall add rule name="Apache HTTP Server (Port 80)" dir=in action=allow protocol=TCP localport=80

if %errorLevel% equ 0 (
    echo.
    echo ================================================================
    echo   SUCCESS: Firewall rule added!
    echo ================================================================
    echo.
    echo Apache HTTP Server is now allowed through Windows Firewall.
    echo Port 80 (HTTP) is open for incoming connections.
    echo.
    echo Your API should now be accessible from other devices on the network:
    echo   http://192.168.1.4/customer-management-api/api
    echo.
) else (
    echo.
    echo ================================================================
    echo   ERROR: Failed to add firewall rule
    echo ================================================================
    echo.
    echo Please check if the rule already exists or add it manually:
    echo   1. Open Windows Defender Firewall
    echo   2. Click "Advanced settings"
    echo   3. Click "Inbound Rules" - "New Rule"
    echo   4. Select "Port" - TCP - Port 80
    echo   5. Allow the connection
    echo.
)

echo.
echo Press any key to exit...
pause >nul
