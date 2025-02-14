import http from "http";
import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import { Server as SocketIoServer } from "socket.io";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import "dotenv/config";

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://liveoverlay-frontend.onrender.com",
];
const io = new SocketIoServer(server, {
  cors: {
    origin: allowedOrigins, // Allow frontend origin
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());
app.use(cookieParser());

// TODO: add appropriate
const JWT_SECRET = process.env.JWT_SECRET || "temp_secret_key";
const activeStreams = {};

const twitchAccounts = [
  {
    username: process.env.TWITCH_USER_1,
    apiKey: process.env.API_KEY_TWITCH_1,
    id: "twitch_1",
    available: true,
  },
  {
    username: process.env.TWITCH_USER_2,
    apiKey: process.env.API_KEY_TWITCH_2,
    id: "twitch_2",
    available: true,
  },
  {
    username: process.env.TWITCH_USER_3,
    apiKey: process.env.API_KEY_TWITCH_3,
    id: "twitch_3",
    available: true,
  },
];

const authenticateUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid session" });
  }
};

//  API to get available accounts
app.get("/available-accounts", (req, res) => {
  res.json(twitchAccounts.filter((acc) => acc.available));
});

// ✅ Login: Reserve an Account & Issue JWT
app.post("/login", (req, res) => {
  const { accountId } = req.body;
  const account = twitchAccounts.find((acc) => acc.id === accountId);

  if (account && account.available) {
    account.available = false; // Lock the account
    const token = jwt.sign(
      { accountId: account.id, username: account.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("jwt", token, {
      httpOnly: true, // ✅ More secure, can't be accessed by JavaScript
      secure: true, // Change to `true` if using HTTPS
      maxAge: 60 * 60 * 1000, // 1 hours
    });

    return res.json({
      success: true,
      message: "Login successful",
      username: account.username,
    });
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Account not available" });
  }
});

app.post("/logout", authenticateUser, (req, res) => {
  const { accountId } = req.user;
  const account = twitchAccounts.find((acc) => acc.id === accountId);

  if (account) {
    account.available = true; // Release the account
  }

  if (activeStreams[accountId]) {
    stopStream(accountId);
  }

  res.clearCookie("jwt"); // ✅ Remove session token
  return res.json({ success: true, message: "Logged out successfully" });
});

// ✅ Protect App Route (Ensures Only Logged-In Users Can Access)
app.get("/verify-session", (req, res) => {
  // return res.json({ success: true, username: req.user.username });

  console.log("Cookies received:", req.cookies); // ✅ Log cookies
  console.log("JWT Token:", req.cookies.jwt); // ✅ Check if token exists

  if (!req.cookies.jwt) {
    return res.status(401).json({ success: false, message: "No token found" });
  }

  try {
    const decoded = jwt.verify(req.cookies.jwt, JWT_SECRET);
    console.log("Decoded User:", decoded);
    return res.json({ success: true, username: decoded.username });
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return res.status(403).json({ success: false, message: "Invalid session" });
  }
});

app.get("/keep-alive", (req, res) => {
  res.status(200).send("Server is active");
});

// OLD FOR SINGLE STREAM & USER
// const twitchApiKey = process.env.API_KEY_TWITCH_1;
// const twitchChannel = process.env.CHANNEL_NAME;

// const options = [
//     '-i',
//     '-',
//     '-c:v', 'libx264',
//     '-preset', 'ultrafast',
//     '-tune', 'zerolatency',
//     '-r', `${25}`,
//     '-g', `${25 * 2}`,
//     '-keyint_min', 25,
//     '-crf', '25',
//     '-pix_fmt', 'yuv420p',
//     '-sc_threshold', '0',
//     '-profile:v', 'main',
//     '-level', '3.1',
//     '-c:a', 'aac',
//     '-b:a', '128k',
//     '-ar', 128000 / 4,
//     '-f', 'flv',
//     // `rtmp://a.rtmp.youtube.com/live2/`,
//     `rtmp://live.twitch.tv/app/${twitchApiKey}`
// ];

// const ffmpegProcess = spawn('ffmpeg', options);

// ffmpegProcess.stdout.on("data", (data) => {
//     console.log(`ffmpeg stdout : ${data}`);
// });

// ffmpegProcess.stderr.on('data', (data) => {
//     console.log(`ffmpeg stderr: ${data}`);
// });

// ffmpegProcess.on('close', (code)=>{
//     console.log(`ffmpeg process exited with code: ${code}`);
// });

const studios = {};
const startStream = (accountId) => {
  const account = twitchAccounts.find((acc) => acc.id === accountId);
  if (!account) return null;

  const containerName = `stream_${accountId}`;

  // ✅ Spawn a separate `ffmpeg` process for each user
  const ffmpegProcess = spawn(
    "ffmpeg",
    [
      "-i",
      "-",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-tune",
      "zerolatency",
      "-r",
      "25",
      "-g",
      "50",
      "-keyint_min",
      "25",
      "-crf",
      "30",
      "-pix_fmt",
      "yuv420p",
      "-sc_threshold",
      "0",
      "-profile:v",
      "main",
      "-level",
      "3.1",
      "-vf",
      "scale=854:480",
      "-b:v",
      "1M",
      "-maxrate",
      "1M",
      "-bufsize",
      "2M",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ar",
      "44100",
      "-f",
      "flv",
      `rtmp://live.twitch.tv/app/${account.apiKey}`,
    ],
    { stdio: ["pipe", "ignore", "ignore"] }
  );

  activeStreams[accountId] = ffmpegProcess; // ✅ Track process per user

  // ✅ Auto-stop after 10 minutes
  setTimeout(() => {
    console.log(
      `⏳ Auto-stopping stream for ${account.username} after 10 minutes.`
    );
    stopStream(accountId);
  }, 10 * 60 * 1000);

  return `https://www.twitch.tv/${account.username}`;
};

// ✅ Stop Streaming & Remove Container
const stopStream = (accountId) => {
  if (!activeStreams[accountId]) return;

  console.log(`🛑 Stopping ffmpeg process for ${accountId}...`);
  activeStreams[accountId].stdin.end();
  activeStreams[accountId].kill("SIGTERM");
  delete activeStreams[accountId];
};

io.on("connection", (socket) => {
  console.log("Socket connection with frontend established!");

  socket.on("binaryStream", (accountId, streamData) => {
    if (activeStreams[accountId]) {
      try {
        activeStreams[accountId].stdin.write(streamData);
      } catch (error) {
        console.error("❌ Failed to write to ffmpeg process:", error);
      }
    }
  });

  socket.on("startStream", (accountId) => {
    const twitchUrl = startStream(accountId);

    console.log(`🎥 Starting stream for ${accountId}`);

    // Send the Twitch URL to the frontend
    socket.emit("twitchUrl", twitchUrl);
  });

  socket.on("stopStream", (accountId) => {
    console.log("Stopping Stream");

    stopStream(accountId);
    // if(ffmpegProcess) {
    //     ffmpegProcess.stdin.end();
    //     ffmpegProcess.kill('SIGTERM');
    //     ffmpegProcess = null;
    // }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
