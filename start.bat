@echo off
title Inventory System Prime - Server
color 0A

echo.
echo ==================================================
echo    INVENTORY SYSTEM PRIME - SERVER
echo ==================================================
echo.
echo  Folder: %~dp0
echo.

cd /d "%~dp0"

echo  Starting server...
echo.

npm start

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ==================================================
    echo    ERROR: Server failed to start!
    echo ==================================================
    echo.
    echo  Possible issues:
    echo    1. Node.js not installed
    echo    2. Dependencies not installed (run: npm install)
    echo    3. Port 5001 already in use
    echo.
    echo  Press any key to exit...
    pause >nul
)

pause
