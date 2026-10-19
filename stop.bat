@echo off
title Stop Inventory System Prime

echo.
echo ==================================================
echo    STOPPING INVENTORY SYSTEM PRIME
echo ==================================================
echo.

echo  Killing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo  OK: Node.js processes stopped.
) else (
    echo  INFO: No Node.js processes found.
)

echo.
echo  Done!
echo.
timeout /t 2 >nul
