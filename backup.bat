@echo off
title Backup Database - Inventory System Prime
color 0D

echo.
echo ==================================================
echo    BACKUP DATABASE
echo ==================================================
echo.

cd /d "%~dp0"

set timestamp=%date:~-4%-%date:~3,2%-%date:~0,2%_%time:~0,2%-%time:~3,2%
set timestamp=%timestamp: =0%
set backupDir=server\backups

if not exist %backupDir% mkdir %backupDir%

if exist server\database.sqlite (
    copy server\database.sqlite "%backupDir%\backup-%timestamp%.sqlite"
    echo  SUCCESS: Database backed up!
    echo  Location: %backupDir%\backup-%timestamp%.sqlite
    echo.
) else (
    echo  ERROR: Database file not found!
    echo.
)

pause
