@echo off
title Omochairo Monster Zukan

echo =========================================
echo   Starting Omochairo Monster Zukan...
echo =========================================

cd /d "%~dp0"

start "" powershell -Command "Start-Sleep -Seconds 3; Start-Process http://localhost:5173"
call npm run dev

pause
