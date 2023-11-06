const express = require('express');
const screenshot = require('screenshot-desktop');
const sharp = require('sharp');

const app = express();
const server = require('http').createServer(app);

// Variable pour stocker la capture d'écran mise à jour périodiquement
let cachedScreenshots = {};
let isCapturing = {}; // Pour éviter les captures simultanées
let displays = {};

// Fonction pour mettre à jour la capture d'écran
async function updateScreenshot(displayID) {
    //console.log("updateScreenshot");
    if (isCapturing[displayID]) return; // Si une capture est déjà en cours, ne faites rien
    isCapturing[displayID] = true; // Définir l'état de capture

    try {
        // Prenez une capture d'écran et mettez à jour la variable
        const img = await screenshot({ screen: displayID });
        sharp(img)
            .metadata()
            .then(metadata => {
                const lpgcd = fpgcd(metadata.width, metadata.height);
                sharp(img)
                    .resize(Math.round(metadata.width / lpgcd), Math.round(metadata.height / lpgcd))
                    .greyscale()
                    .toBuffer()
                    .then(buffer => {
                        cachedScreenshots[displayID] = buffer;
                        isCapturing[displayID] = false; // Réinitialiser l'état de capture
                        setTimeout(() => updateScreenshot(displayID), 1); // Lancez la mise à jour pour chaque écran
                    });
            })
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la capture d\'écran:', error);
        isCapturing[displayID] = false; // Assurez-vous de réinitialiser l'état même en cas d'erreur
    }
}

// Fonction pour démarrer le processus de mise à jour pour tous les écrans
async function startCapturingScreens() {
    try {
        displays = await screenshot.listDisplays();
        displays.forEach(display => {
            isCapturing[display.id] = isCapturing[display.id] || false; // Initialiser l'état de capture pour chaque écran
            setTimeout(() => updateScreenshot(display.id), 1); // Lancez la mise à jour pour chaque écran
        });
    } catch (error) {
        console.error('Erreur lors de l\'obtention de la liste des écrans:', error);
    }
}

// Appel initial pour démarrer le processus de capture
startCapturingScreens();

function fpgcd(a, b) {
    if (!b) { return a; }
    return fpgcd(b, a % b);
}

function fppcm(a, b) {
    return Math.abs(a * b) / fpgcd(a, b);
}

// Middleware pour parser les paramètres d'URL
app.use(express.urlencoded({ extended: true }));

// Route pour le streaming et le contrôle
app.get('/dolmenpc/', (req, res) => {
    const screen = req.query.screen;
    const screenID = displays[screen].id
    if (cachedScreenshots[screenID]) {
        res.setHeader('Content-Type', 'image/png');
        res.end(cachedScreenshots[screenID]);
    } else {
        res.status(503).send('La capture d\'écran n\'est pas encore prête ou l\'ID d\'écran est incorrect.');
    }
});

server.listen(8080, () => {
    console.log('Server listening on port 8080');
});
