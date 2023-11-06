const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const screenshot = require('screenshot-desktop');
const sharp = require('sharp');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Middleware pour parser les paramètres d'URL
app.use(express.urlencoded({ extended: true }));

// Route pour le streaming et le contrôle
app.get('/dolmenpc/', async (req, res) => {
    try {
        const screen = req.query.screen;

        // Obtenez la liste des écrans disponibles
        const displays = await screenshot.listDisplays();

        // Choisissez un écran.
        const screenId = displays[screen].id; // Utilisez le numéro de l'écran passé en paramètre de requête

        // Prenez une capture d'écran de l'écran spécifié
        const img = await screenshot({ screen: screenId });

        // Utilisez sharp pour redimensionner l'image
        sharp(img)
            .metadata()
            .then(metadata => {
                const lpgcd = fpgcd(metadata.width, metadata.height);
                return sharp(img)
                    .resize(Math.round(metadata.width / lpgcd), Math.round(metadata.height / lpgcd))
                    .greyscale()
                    .toBuffer();
            })
            .then(resizedImg => {
                res.setHeader('Content-Type', 'image/png');
                res.end(resizedImg);
            })
            .catch(err => {
                console.error(err);
                res.status(500).send('Erreur lors du traitement de l\'image');
            });

    } catch (e) {
        console.error(e);
        res.status(500).send('Erreur lors de la capture d\'écran');
    }
});

function fpgcd(a, b) {
    if (!b) { return a; }
    return fpgcd(b, a % b);
}

function fppcm(a, b) {
    return Math.abs(a * b) / fpgcd(a, b);
}

server.listen(8080, () => {
    console.log('Server listening on port 8080');
});
