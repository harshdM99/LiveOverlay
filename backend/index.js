import http from 'http';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import {Server as SocketIoServer} from 'socket.io';
import 'dotenv/config';

const app = express();
const server = http.createServer(app);
const io = new SocketIoServer(server,  {
    cors: {
      origin: "http://localhost:5173",  // Allow frontend origin
      methods: ["GET", "POST"]
    }
});

const twitchApiKey = process.env.API_KEY_TWITCH_1

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
    // `rtmp://a.rtmp.youtube.com/live2/`,
    `rtmp://live.twitch.tv/app/${twitchApiKey}`
];

const ffmpegProcess = spawn('ffmpeg', options);

ffmpegProcess.stdout.on("data", (data) => {
    console.log(`ffmpeg stdout : ${data}`);
});

ffmpegProcess.stderr.on('data', (data) => {
    console.log(`ffmpeg stderr: ${data}`);
});

ffmpegProcess.on('close', (code)=>{
    console.log(`ffmpeg process exited with code: ${code}`);
});

io.on('connection', socket => {
    console.log("Socket connection with frontend established!");

    socket.on("binaryStream", stream => {
        // console.log("Binary Stream incoming....");
        ffmpegProcess.stdin.write(stream, (err)=> {
            // console.log("Error : ", err);
        });
    });

    socket.on("startStream", () => {
        const twitchChannel = "ladladme"; // Replace with actual Twitch username
        const twitchUrl = `https://www.twitch.tv/${twitchChannel}`;

        console.log(`🚀 Streaming started! Watch live at: ${twitchUrl}`);

        // Send the Twitch URL to the frontend
        socket.emit("twitchUrl", twitchUrl);
    });

    socket.on("stopStream", () => {
        console.log("Stopping Stream");

        if(ffmpegProcess) {
            ffmpegProcess.stdin.end();
            ffmpegProcess.kill('SIGINT');
            ffmpegProcess = null;
        }
    });
});

server.listen(3000, () => console.log('Server running on port 3000'));