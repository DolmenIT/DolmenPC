const desktopCapture = require('node-desktop-capture');
const PNG = require('pngjs').PNG;
const fs = require('fs');
const moment = require('moment');

const captureInterval = 1000; // 1 seconde
const captureWidth = 1920;
const captureHeight = 1080;
const portionWidth = 8;
const portionHeight = 8;

let previousScreenshot = null;

function captureScreen() {
  desktopCapture.captureScreen((error, img) => {
    if (error) {
      console.error('Erreur de capture d\'écran :', error);
      return;
    }

    if (!previousScreenshot) {
      previousScreenshot = img;
      saveImage(img, 'capture');
      return;
    }

    const diffImage = createDifferenceImage(previousScreenshot, img);
    saveImage(img, 'capture');
    saveImage(diffImage, 'difference');
    previousScreenshot = img;
  }, {
    crop: {
      x: 0,
      y: 0,
      width: captureWidth,
      height: captureHeight
    }
  });
}

function createDifferenceImage(img1, img2) {
  const diffImage = new PNG({ width: captureWidth, height: captureHeight });

  for (let y = 0; y < captureHeight; y++) {
    for (let x = 0; x < captureWidth; x++) {
      const idx = (y * captureWidth + x) << 2;
      const r1 = img1.data[idx];
      const g1 = img1.data[idx + 1];
      const b1 = img1.data[idx + 2];
      const r2 = img2.data[idx];
      const g2 = img2.data[idx + 1];
      const b2 = img2.data[idx + 2];

      const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      if (diff > 0) {
        // Si la différence est détectée, la pixel est mis en blanc (255, 255, 255)
        diffImage.data[idx] = 255;
        diffImage.data[idx + 1] = 255;
        diffImage.data[idx + 2] = 255;
        diffImage.data[idx + 3] = 255;
      }
    }
  }

  return diffImage;
}

function saveImage(img, prefix) {
  const date = moment().unix();
  const filename = `${prefix}_${date}.png`;
  const writableStream = fs.createWriteStream(filename);

  img.pack().pipe(writableStream);

  writableStream.on('finish', () => {
    console.log(`Image sauvegardée sous le nom : ${filename}`);
  });
}

setInterval(captureScreen, captureInterval);
