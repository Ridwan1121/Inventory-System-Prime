@echo off
title Install Dependencies - Inventory System Prime
color 0E

echo.
echo ==================================================
echo    INSTALL DEPENDENCIES
echo ==================================================
echo.

cd /d "%~dp0"

echo  Installing npm packages...
echo.

npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==================================================
    echo    SUCCESS: Dependencies installed!
    echo ==================================================
    echo.
    echo  You can now run start.bat to start the server.
    echo.
) else (
    echo.
    echo ==================================================
    echo    ERROR: Installation failed!
    echo ==================================================
    echo.
    echo  Check the errors above.
    echo.
)

pause
