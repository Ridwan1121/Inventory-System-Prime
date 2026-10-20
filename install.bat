@echo off
title Install Dependencies
color 0E
cd /d "%~dp0"
echo Installing dependencies...
npm install
echo.
echo Done! Run start.bat to start the server.
pause
