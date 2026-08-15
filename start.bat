@echo off
title uTrain - Avvio Web App
color 0A

echo =======================================================
echo    uTrain - AI Workout Tracker & Progressive Overload
echo =======================================================
echo.

cd /d "%~dp0"

:: Controlla se le dipendenze sono installate
if not exist "node_modules\" (
    echo [INFO] Installazione dipendenze in corso...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERRORE] Installazione fallita. Verifica che Node.js sia installato.
        pause
        exit /b %errorlevel%
    )
)

echo [INFO] Avvio del server locale uTrain...
echo [INFO] Apertura automatica del browser su http://localhost:5173...

:: Apre il browser automaticamente dopo 2 secondi
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5173"

:: Avvia il dev server di Vite
call npm run dev

pause
