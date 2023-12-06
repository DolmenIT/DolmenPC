const screenshot = require('screenshot-desktop');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');


let oldMiniature = null;

function miniCapture(fullImg, newImg, tileX, tileY, tileSize) {
    let startTileX = (tileX * tileSize);
    let startTileY = (tileY * tileSize);
    for (let y = 0; y < tileSize; y++) {
        let copyY = ((startTileY + y) * fullImg.width);
        for (let x = 0; x < tileSize; x++) {
            let copyX = (startTileX + x);
            let idxCopy = (copyY + copyX) * 4;

            newImg.data[idxCopy] = fullImg.data[idxCopy];       // R
            newImg.data[idxCopy + 1] = fullImg.data[idxCopy + 1]; // G
            newImg.data[idxCopy + 2] = fullImg.data[idxCopy + 2]; // B
            newImg.data[idxCopy + 3] = 255;                           // A
        }
    }

    return newImg;
}

function createMiniature(fullImg, tileSize) {
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

function createDifferenceImage(fullImg, currentMiniature, previousMiniature, tileSize) {
    const diffImg = new PNG({ width: 240, height: 135 });

    let newImg = new PNG({ width: fullImg.width, height: fullImg.height });
    let haveDifference = false;

    for (let y = 0; y < 135; y++) {
        for (let x = 0; x < 240; x++) {
            let idx = (y * 240 + x) << 2;

            // Calcul de la différence en RGB
            const diffR = Math.abs(currentMiniature.data[idx] - previousMiniature.data[idx]);
            const diffG = Math.abs(currentMiniature.data[idx + 1] - previousMiniature.data[idx + 1]);
            const diffB = Math.abs(currentMiniature.data[idx + 2] - previousMiniature.data[idx + 2]);

            const isDifferent = diffR > 0 || diffG > 0 || diffB > 0;
            if (isDifferent) {
                newImg = miniCapture(fullImg, newImg, x, y, tileSize);
                haveDifference = true;
            }
        }
    }

    if (haveDifference) {
        const newName = `new_${Date.now()}.png`;
        const savePath = path.join('captures', newName); // Chemin complet du fichier
        fs.writeFileSync(savePath, PNG.sync.write(newImg));
        console.log("isdifferent");
    }

    return diffImg;
}


function captureAndProcess() {
    screenshot({ format: 'png' }).then((imgBuffer) => {
        //const diffName = `difference_${Date.now()}.png`;
        //const savePath = path.join('captures', diffName); // Chemin complet du fichier

        const tileSize = 8;
        const fullImg = PNG.sync.read(imgBuffer);

        const currentMiniature = createMiniature(fullImg, tileSize);
        let diffImg;

        if (oldMiniature) {
            diffImg = createDifferenceImage(fullImg, currentMiniature, oldMiniature, tileSize);
            //fs.writeFileSync(savePath, PNG.sync.write(diffImg)); // Utilisez savePath ici
        }

        oldMiniature = currentMiniature;

        setInterval(() => { captureAndProcess() }, 100);
    });
}

if (!fs.existsSync('captures')){
    fs.mkdirSync('captures');
}
captureAndProcess();

