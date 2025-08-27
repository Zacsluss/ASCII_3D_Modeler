@echo off
setlocal enabledelayedexpansion

echo Starting local web server...

:: Try to find an available port starting from 8000
set /a port=8000
set found=0

:findport
netstat -an | find ":!port!" >nul
if errorlevel 1 (
    set found=1
    goto startserver
)
set /a port+=1
if !port! gtr 8100 (
    echo No available ports found between 8000-8100
    pause
    exit /b 1
)
goto findport

:startserver
echo Using port !port!

:: Start Python HTTP server in background
echo Starting server on http://localhost:!port!
start /min python -m http.server !port!

:: Wait a moment for server to start
timeout /t 2 /nobreak >nul

:: Open browser
echo Opening browser...
start http://localhost:!port!/index.html

echo Server is running on port !port!
echo Press any key to stop the server...
pause >nul

:: Kill the Python server
taskkill /f /im python.exe >nul 2>&1
echo Server stopped.