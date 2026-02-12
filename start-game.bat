@echo off
echo ==========================================
echo Starting Medieval Village Chronicle...
echo ==========================================

echo Starting Backend Server...
start "MVC Backend Server" cmd /k "npm run server"

echo Starting Frontend Dev Server...
start "MVC Frontend" cmd /k "npm run dev"

echo Waiting for services to initialize...
timeout /t 5 >nul

echo Opening Game in Browser...
start http://localhost:3000

echo ==========================================
echo Game started! Check the other windows for logs.
echo ==========================================
pause
