import http from 'http';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import {Server as SocketIoServer} from 'socket.io';
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import 'dotenv/config';

const app = express();
const server = http.createServer(app);
const io = new SocketIoServer(server,  {
    cors: {
      origin: "http://localhost:5173",  // Allow frontend origin
      methods: ["GET", "POST"]
    }
});

const allowedOrigins = [
    "http://localhost:5173", // ✅ Local development
    "https://yourdomain.com", // ✅ Future cloud deployment
];

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

const twitchAccounts = [
    { username: process.env.TWITCH_USER_1, apiKey: process.env.API_KEY_TWITCH_1, id: "twitch_1", available: true },
    { username: process.env.TWITCH_USER_2, apiKey: process.env.API_KEY_TWITCH_2, id: "twitch_2", available: true },
    { username: process.env.TWITCH_USER_3, apiKey: process.env.API_KEY_TWITCH_3, id: "twitch_3", available: true }
  ];

const authenticateUser = (req, res, next) => {
    const token = req.cookies.jwt;
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: "Invalid session" });
    }
};
  
//  API to get available accounts
app.get('/available-accounts', (req, res) => {
    res.json(twitchAccounts.filter(acc => acc.available));
});

// ✅ Login: Reserve an Account & Issue JWT
app.post("/login", (req, res) => {
    const { accountId } = req.body;
    const account = twitchAccounts.find(acc => acc.id === accountId);

    if (account && account.available) {
        account.available = false; // Lock the account
        const token = jwt.sign({ accountId: account.id, username: account.username }, JWT_SECRET, { expiresIn: "1h" });

        res.cookie("jwt", token, {
            httpOnly: true, // ✅ More secure, can't be accessed by JavaScript
            secure: false, // Change to `true` if using HTTPS
            maxAge: 60 * 60 * 1000 // 1 hours
        });

        return res.json({ success: true, message: "Login successful", username: account.username });
    } else {
        return res.status(400).json({ success: false, message: "Account not available" });
    }
});
  
app.post("/logout", authenticateUser, (req, res) => {
    const { accountId } = req.user;
    const account = twitchAccounts.find(acc => acc.id === accountId);

    if (account) {
        account.available = true; // Release the account
    }

    res.clearCookie("jwt"); // ✅ Remove session token
    return res.json({ success: true, message: "Logged out successfully" });
});

// ✅ Protect App Route (Ensures Only Logged-In Users Can Access)
app.get("/verify-session", authenticateUser, (req, res) => {
    return res.json({ success: true, username: req.user.username });
});

const twitchApiKey = process.env.API_KEY_TWITCH_1;
const twitchChannel = process.env.CHANNEL_NAME;

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
        const twitchUrl = `https://www.twitch.tv/${twitchChannel}`;

        console.log(`🚀 Streaming started! Watch live at: ${twitchUrl}`);

        // Send the Twitch URL to the frontend
        socket.emit("twitchUrl", twitchUrl);
    });

    socket.on("stopStream", () => {
        console.log("Stopping Stream");

        if(ffmpegProcess) {
            ffmpegProcess.stdin.end();
            ffmpegProcess.kill('SIGTERM');
            ffmpegProcess = null;
        }
    });
});

server.listen(3000, () => console.log('Server running on port 3000'));