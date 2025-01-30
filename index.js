import http from 'http';
import path from 'path';
import express from 'express';
import { spawn } from 'child_process';
import {Server as SocketIoServer} from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new SocketIoServer(server);

const options = [
    '-i',
    '-',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-r', `${25}`,
    '-g', `${25 * 2}`,
    '-keyint_min', 25,
    '-crf', '25',
    '-pix_fmt', 'yuv420p',
    '-sc_threshold', '0',
    '-profile:v', 'main',
    '-level', '3.1',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', 128000 / 4,
    '-f', 'flv',
    `rtmp://a.rtmp.youtube.com/live2/`,
];

const ffmpegProcess = spawn('ffmpeg', options);

io.on('connection', socket => {
    console.log("Socket connection with frontend established!");

    socket.on("binaryStream", stream => {
        console.log("Binary Stream incoming....");
    });
});

app.use(express.static(path.resolve('./public')));

server.listen(3000, () => console.log('Server running on port 3000'));