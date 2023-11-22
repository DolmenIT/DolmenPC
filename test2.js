const screenshot = require('screenshot-desktop');
const { createCanvas, Image } = require('canvas');
const fs = require('fs');
const moment = require('moment');

const captureInterval = 1000; // 1 seconde
const captureWidth = 1920;
const captureHeight = 1080;

let previousScreenshot = null;

function captureAndSaveScreen() {
  screenshot({ width: captureWidth, height: captureHeight }).then((img) => {
    if (!previousScreenshot) {
      previousScreenshot = img;
      saveImage(img, 'capture');
      return;
    }

    const diffImage = createDifferenceImage(previousScreenshot, img);
    saveImage(img, 'capture');
    saveImage(diffImage, 'difference');
    previousScreenshot = img;
  }).catch((error) => {
    console.error('Erreur de capture d\'écran :', error);
  });
}

function createDifferenceImage(img1, img2) {
  const canvas = createCanvas(captureWidth, captureHeight);
  const ctx = canvas.getContext('2d');

  const diffImage = ctx.createImageData(captureWidth, captureHeight);

  for (let y = 0; y < captureHeight; y++) {
    for (let x = 0; x < captureWidth; x++) {
      const idx = (y * captureWidth + x) * 4;
      const r1 = img1[idx];
      const g1 = img1[idx + 1];
      const b1 = img1[idx + 2];
      const r2 = img2[idx];
      const g2 = img2[idx + 1];
      const b2 = img2[idx + 2];

      const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
      if (diff > 0) {
        // Si la différence est détectée, le pixel est mis en blanc (255, 255, 255)
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
  const canvas = createCanvas(captureWidth, captureHeight);
  const ctx = canvas.getContext('2d');
  const imageData = new ImageData(new Uint8ClampedArray(img), captureWidth, captureHeight);
  ctx.putImageData(imageData, 0, 0);

  const stream = fs.createWriteStream(filename);
  const pngStream = canvas.createPNGStream();

  pngStream.pipe(stream);

  stream.on('finish', () => {
    console.log(`Image sauvegardée sous le nom : ${filename}`);
  });
}

captureAndSaveScreen();
