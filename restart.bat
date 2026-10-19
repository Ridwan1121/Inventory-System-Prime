@echo off
title Restart Inventory System Prime

echo.
echo ==================================================
echo    RESTARTING INVENTORY SYSTEM PRIME
echo ==================================================
echo.

echo  Stopping server...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo  Starting server...
echo.

cd /d "%~dp0"
npm start

pause
