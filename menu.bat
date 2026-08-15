@echo off
title uTrain - Control Panel
color 0F

:MENU
cls
echo =======================================================
echo    uTrain - AI Workout Tracker & Progressive Overload
echo =======================================================
echo.
echo   [1] Avvia Web App (Avvio rapido + Apertura Browser)
echo   [2] Salva e Push su GitHub (Crea repository auto)
echo   [3] Compila Build di Produzione (npm run build)
echo   [4] Installa / Aggiorna Dipendenze (npm install)
echo   [5] Esci
echo.
echo =======================================================
set /p "choice=Seleziona un'opzione [1-5]: "

if "%choice%"=="1" (
    call "%~dp0start.bat"
    goto MENU
)
if "%choice%"=="2" (
    call "%~dp0push.bat"
    goto MENU
)
if "%choice%"=="3" (
    cls
    echo [INFO] Compilazione in corso...
    call npm run build
    echo.
    pause
    goto MENU
)
if "%choice%"=="4" (
    cls
    echo [INFO] Installazione dipendenze in corso...
    call npm install
    echo.
    pause
    goto MENU
)
if "%choice%"=="5" (
    exit /b 0
)

echo [ERRORE] Opzione non valida. Riprova.
timeout /t 2 >nul
goto MENU
