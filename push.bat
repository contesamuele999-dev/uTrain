@echo off
setlocal enabledelayedexpansion
title uTrain - Auto Push GitHub
color 0B

echo =======================================================
echo    uTrain - Backup e Push Automatico su GitHub
echo =======================================================
echo.

cd /d "%~dp0"

:: 1. Verifica che Git sia installato
where git >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERRORE] Git non e' installato o non e' presente nel PATH di sistema.
    echo Scarica Git da: https://git-scm.com/
    pause
    exit /b 1
)

:: 2. Inizializza Git se non presente
if not exist ".git\" (
    echo [INFO] Inizializzazione repository Git locale...
    git init
    git branch -M main
)

:: 3. Aggiungi tutti i file
echo [INFO] Aggiunta file modificati in corso...
git add .

:: 4. Chiedi il messaggio di commit (oppure usa quello predefinito)
set "default_msg=Update uTrain: %date% %time%"
set /p "commit_msg=Inserisci messaggio di commit [Premi INVIO per default: %default_msg%]: "
if "!commit_msg!"=="" set "commit_msg=%default_msg%"

:: 5. Effettua il commit
git commit -m "!commit_msg!" >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Commit eseguito con successo: "!commit_msg!"
) else (
    echo [INFO] Nessuna nuova modifica da committare.
)

:: 6. Controlla se il remote 'origin' esiste
git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [INFO] Nessun repository remoto configurato.
    
    :: Verifica se GitHub CLI (gh) e' disponibile
    where gh >nul 2>&1
    if !errorlevel! equ 0 (
        echo [INFO] Rilevato GitHub CLI ^(gh^).
        echo [INFO] Creazione automatica del repository GitHub 'uTrain'...
        
        gh repo create uTrain --public --source=. --remote=origin --push
        if !errorlevel! equ 0 (
            color 0A
            echo.
            echo =======================================================
            echo [SUCCESSO] Repository creato e caricato su GitHub!
            echo =======================================================
            gh repo view --web
            pause
            exit /b 0
        ) else (
            echo [AVVISO] Creazione automatica con gh non riuscita o repository gia' esistente.
        )
    )

    :: Se gh non e' disponibile o fallisce, chiedi l'URL del remote
    echo.
    set /p "remote_url=Inserisci l'URL del tuo repository GitHub (es. https://github.com/username/uTrain.git): "
    if "!remote_url!" neq "" (
        git remote add origin !remote_url!
        echo [INFO] Remote 'origin' impostato a: !remote_url!
    ) else (
        color 0C
        echo [ERRORE] Nessun remote specificato. Operazione annullata.
        pause
        exit /b 1
    )
)

:: 7. Push su GitHub
echo.
echo [INFO] Push delle modifiche su GitHub ^(branch main^)...
git push -u origin main

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo =======================================================
    echo    [SUCCESSO] Push completato con successo su GitHub!
    echo =======================================================
) else (
    color 0C
    echo.
    echo =======================================================
    echo    [ERRORE] Si e' verificato un problema durante il push.
    echo    Verifica la connessione internet e i permessi Git.
    echo =======================================================
)

echo.
pause
