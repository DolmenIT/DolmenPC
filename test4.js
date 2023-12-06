const screenshot = require('screenshot-desktop');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

let oldMiniature = null;
const tileSize = 8;
const diffImg = new PNG({ width: 240, height: 135 });
const newImg = new PNG({ width: diffImg.width * tileSize, height: diffImg.height * tileSize });

function miniCapture(fullImg, tileX, tileY, tileSize) {
    let startTileX = tileX * tileSize;
    let startTileY = tileY * tileSize;

    for (let y = 0; y < tileSize; y++) {
        fullImg.data.copy(newImg.data, ((startTileY + y) * newImg.width + startTileX) * 4, ((startTileY + y) * fullImg.width + startTileX) * 4, ((startTileY + y) * fullImg.width + startTileX + tileSize) * 4);
    }
}

function createMiniature(fullImg) {
    const miniatureWidth = Math.ceil(fullImg.width / tileSize);
    const miniatureHeight = Math.ceil(fullImg.height / tileSize);
    const miniature = new PNG({ width: miniatureWidth, height: miniatureHeight });

    for (let y = 0; y < fullImg.height; y += tileSize) {
        for (let x = 0; x < fullImg.width; x += tileSize) {
            let sumR = 0, sumG = 0, sumB = 0;
            let count = 0;

            for (let dy = 0; dy < tileSize; dy++) {
                for (let dx = 0; dx < tileSize; dx++) {
                    if (x + dx < fullImg.width && y + dy < fullImg.height) {
                        let idx = ((y + dy) * fullImg.width + (x + dx)) << 2;
                        sumR += fullImg.data[idx];
                        sumG += fullImg.data[idx + 1];
                        sumB += fullImg.data[idx + 2];
                        count++;
                    }
                }
            }

            let miniIdx = (Math.floor(y / tileSize) * miniatureWidth + Math.floor(x / tileSize)) << 2;
            miniature.data[miniIdx] = Math.round(sumR / count);     // R
            miniature.data[miniIdx + 1] = Math.round(sumG / count); // G
            miniature.data[miniIdx + 2] = Math.round(sumB / count); // B
            miniature.data[miniIdx + 3] = 255;                      // A
        }
    }

    return miniature;
}

function createDifferenceImage(fullImg, currentMiniature, previousMiniature) {
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
                miniCapture(fullImg, x, y);
                haveDifference = true;
            }
        }
    }

    if (haveDifference) {
        const newName = `new_${Date.now()}.png`;
        const savePath = path.join('captures', newName);
        fs.writeFileSync(savePath, PNG.sync.write(newImg));
        console.log("isdifferent");
    }
}

function captureAndProcess() {
    screenshot({ format: 'png' }).then((imgBuffer) => {
        const fullImg = PNG.sync.read(imgBuffer);

        const currentMiniature = createMiniature(fullImg);

        if (oldMiniature) {
            createDifferenceImage(fullImg, currentMiniature, oldMiniature, tileSize);
        }

        oldMiniature = currentMiniature;

        setInterval(() => { captureAndProcess() }, 100);
    }).catch(console.error);
}

if (!fs.existsSync('captures')){
    fs.mkdirSync('captures');
}

//setInterval(captureAndProcess, 100);
captureAndProcess();