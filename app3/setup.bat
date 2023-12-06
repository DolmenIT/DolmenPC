@echo off
SETLOCAL

echo Installation de Node.js et des packages nécessaires...
echo.

:: Vérifie si Node.js est installé
node -v > NUL 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Node.js n'est pas installé. Veuillez installer Node.js avant d'exécuter ce script.
    GOTO END
)

:: Installation des packages CHOCO
echo Installation des packages choco...
choco install ffmpeg

:: Installation des packages NPM
echo Installation des packages npm...
npm install express fluent-ffmpeg ffmpeg-static
IF %ERRORLEVEL% NEQ 0 (
    echo L'installation des packages npm a échoué.
    GOTO END
)

echo.
echo Les packages npm nécessaires ont été installés avec succès.
echo.

:END
ENDLOCAL
