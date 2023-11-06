@echo off
echo Installation des dépendances Node.js...
cd /d %~dp0

@echo off
SETLOCAL

npm install sharp
npm install express socket.io screenshot-desktop

echo Démarrage du serveur...
node app.js

pause
