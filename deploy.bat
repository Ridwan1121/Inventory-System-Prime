@echo off
title Deploy - Inventory System Prime
color 0C

echo.
echo ==================================================
echo    DEPLOY - INVENTORY SYSTEM PRIME
echo ==================================================
echo.

cd /d "%~dp0"

echo  Step 1: Install dependencies...
call npm install
echo.

echo  Step 2: Update GitHub...
call github-update.bat
echo.

echo  Step 3: Start server...
call start.bat

pause
