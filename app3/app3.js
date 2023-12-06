const express = require('express');
const { spawn } = require('child_process');
const app = express();
let ffmpegProcess;

app.get('/', (req, res) => {
    res.sendFile('public/index.html', { root: __dirname });
});

app.get('/start', (req, res) => {
    const screen = req.query.screen || '1';
    const inputOption = process.platform === 'win32' ? ['-f', 'gdigrab', '-i', 'desktop'] : ['-f', 'x11grab', `-i`, `:0.${screen}`];

    if (!ffmpegProcess) {
        ffmpegProcess = spawn('ffmpeg', [
            ...inputOption,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-tune', 'zerolatency',
            '-b:v', '3000k',
            '-f', 'dash',
            'public/manifest.mpd'
        ]);

        ffmpegProcess.stderr.on('data', (data) => console.error(`stderr: ${data}`));
        ffmpegProcess.on('close', (code) => {
            console.log(`FFmpeg exited with code ${code}`);
            ffmpegProcess = null;
        });

        res.send('Streaming started');
    } else {
        res.send('Streaming is already running');
    }
});

app.get('/end', (req, res) => {
    if (ffmpegProcess) {
        ffmpegProcess.kill('SIGINT');
        res.send('Streaming stopped');
    } else {
        res.send('No streaming is currently running');
    }
});

app.get('/config', (req, res) => {
    const { bv } = req.query;
    if (bv) {
        if (ffmpegProcess) {
            ffmpegProcess.kill('SIGINT');
        }
        ffmpegProcess = spawn('ffmpeg', [
            ...inputOption,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-tune', 'zerolatency',
            `-b:v`, `${bv}k`,
            '-f', 'dash',
            'public/manifest.mpd'
        ]);
        res.send(`Streaming bitrate set to ${bv} kbps and restarted`);
    } else {
        res.send('Bitrate not specified');
    }
});

app.use(express.static('public'));

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
