@echo off
setlocal
title Orphy Launcher

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [Orphy] Node.js is required to run Orphy from source.
    echo [Orphy] Opening nodejs.org in your default browser...
    start https://nodejs.org/
    echo [Orphy] Please install Node.js and run start.bat again.
    pause
    exit /b 1
)

:: Check if node_modules exists; if not, install dependencies automatically
if not exist "%~dp0node_modules\" (
    echo [Orphy] First run detected. Installing dependencies...
    cd /d "%~dp0"
    call npm install
    if %errorlevel% neq 0 (
        echo [Orphy] Error: Failed to install npm dependencies.
        pause
        exit /b 1
    )
)

:: Launch Orphy and exit launcher console
cd /d "%~dp0"
start "" /b npx electron .
exit
