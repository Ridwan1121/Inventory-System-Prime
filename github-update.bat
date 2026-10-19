@echo off
title Update GitHub - Inventory System Prime
color 0B

echo.
echo ==================================================
echo    UPDATE GITHUB
echo ==================================================
echo.

cd /d "%~dp0"

echo  Adding files...
git add .
echo.

set /p msg="Enter commit message (or press Enter for default): "

if "%msg%"=="" (
    set msg=Update: %date% %time%
)

echo.
echo  Committing: %msg%
git commit -m "%msg%"
echo.

echo  Pushing to GitHub...
git push -u origin main
echo.

if %ERRORLEVEL% EQU 0 (
    echo ==================================================
    echo    SUCCESS: Pushed to GitHub!
    echo ==================================================
    echo.
    echo  Repository: https://github.com/Ridwan1121/Inventory-System-Prime
    echo.
) else (
    echo ==================================================
    echo    ERROR: Push failed!
    echo ==================================================
    echo.
)

pause
