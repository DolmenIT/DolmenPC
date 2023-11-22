const screenshot = require('screenshot-desktop');
const { PNG } = require('pngjs');
const fs = require('fs');

let previousMiniature = null;

function miniCapture(current, tileX, tileY, tileSize) {
    x = tileX * tileSize;
    y = tileY * tileSize;
    // Implémentez votre logique ici
    console.log(`Différence détectée à la position (${x}, ${y})`);
}

function createMiniature(imgBuffer, tileSize) {
    const fullImg = PNG.sync.read(imgBuffer);
    const miniature = new PNG({ width: 240, height: 135 });

    for (let y = 0; y < fullImg.height; y += tileSize) {
        for (let x = 0; x < fullImg.width; x += tileSize) {
            let idx = (fullImg.width * y + x) << 2;
            let miniIdx = (240 * Math.floor(y / tileSize) + Math.floor(x / tileSize)) << 2;

            miniature.data[miniIdx] = fullImg.data[idx];     // R
            miniature.data[miniIdx + 1] = fullImg.data[idx + 1]; // G
            miniature.data[miniIdx + 2] = fullImg.data[idx + 2]; // B
            miniature.data[miniIdx + 3] = 255;               // A
        }
    }

    return miniature;
}

function createDifferenceImage(current, previous, tileSize) {
    const diffImg = new PNG({ width: 240, height: 135 });

    for (let y = 0; y < 135; y++) {
        for (let x = 0; x < 240; x++) {
            let idx = (y * 240 + x) << 2;

            // Calcul de la différence en RGB
            const diffR = Math.abs(current.data[idx] - previous.data[idx]);
            const diffG = Math.abs(current.data[idx + 1] - previous.data[idx + 1]);
            const diffB = Math.abs(current.data[idx + 2] - previous.data[idx + 2]);

            const isDifferent = diffR > 0 || diffG > 0 || diffB > 0;
            if (isDifferent) {
                diffImg.data[idx] = diffImg.data[idx + 1] = diffImg.data[idx + 2] = 255;
                miniCapture(current, x, y, tileSize);
            } else {
                diffImg.data[idx] = diffImg.data[idx + 1] = diffImg.data[idx + 2] = 0;
            }
            diffImg.data[idx + 3] = 255; // Alpha
        }
    }

    return diffImg;
}


function captureAndProcess() {
    screenshot({ format: 'png' }).then((imgBuffer) => {
        const now = Math.floor(Date.now() / 1000);
        const diffName = `difference_${now}.png`;

        const tileSize = 8;
        const currentMiniature = createMiniature(imgBuffer, tileSize);
        let diffImg;

        if (previousMiniature) {
            diffImg = createDifferenceImage(currentMiniature, previousMiniature, tileSize);
            fs.writeFileSync(diffName, PNG.sync.write(diffImg));
        }

        previousMiniature = currentMiniature;
    });
}

setInterval(captureAndProcess, 1000);
