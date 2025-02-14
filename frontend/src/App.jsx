import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "./App.css"; // Future CSS file
import { API_BASE_URL } from "./config";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  // const selectedAccount = localStorage.getItem("selectedTwitchAccount");
  const navigate = useNavigate();
  
  const [selectedSource, setSelectedSource] = useState("/welcome.jpg"); // Default Image
  const [screenStream, setScreenStream] = useState(null); // Store screen stream
  const [stream, setStream] = useState(null);
  const [twitchUrl, setTwitchUrl] = useState(null);
  const [isOverlayEnabled, setIsOverlayEnabled] = useState(false); // Overlay toggle
  const [overlayText, setOverlayText] = useState(""); // ✅ Default text
  const [isTextOverlayEnabled, setIsTextOverlayEnabled] = useState(false); // ✅ Toggle for text overlay
  const [cameraDenied, setCameraDenied] = useState(false); // ✅ Track camera access

  const accountId = localStorage.getItem("selectedTwitchAccount");

  const socket = io(API_BASE_URL);

  useEffect(() => {
    fetch(API_BASE_URL+"/verify-session", { 
      method: "GET",
      credentials: "include", // ✅ Ensures cookies are sent
      headers: { "Content-Type": "application/json" } 
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          navigate("/login");
        }
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  const handleLogout = () => {
    fetch(API_BASE_URL+"/logout", { 
      method: "POST",
      credentials: "include"
    })
      .then(res => res.json())
      .then(() => {
        window.location.href = "/login"; // ✅ Redirect after logout
      })
      .catch(error => console.error("Logout failed:", error));
  };

  // useEffect(() => {
  //   const handleTabClose = (event) => {
  //     if (document.visibilityState === "hidden") {
  //       fetch("http://localhost:3000/logout", {
  //         method: "POST",
  //         credentials: "include"
  //       });
  //     }
  //   };
  
  //   document.addEventListener("visibilitychange", handleTabClose);
  
  //   return () => {
  //     document.removeEventListener("visibilitychange", handleTabClose);
  //   };
  // }, []);
  
  useEffect(() => {
    async function getUserMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setCameraDenied(false); // ✅ Reset if access is granted
      } catch (error) {
        console.error("Error accessing media devices:", error);
        setCameraDenied(true); // ✅ Detect when permission is denied
      }
    }

    getUserMedia();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let img = null;
    let screenVideo = null;
    let overlayImage = null;
    overlayImage = new Image();

    const drawFrame = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      if (selectedSource === "webcam" && stream) {
        const videoElement = videoRef.current;
        
        if (videoElement && videoElement.readyState === 4) {
          // Maintain aspect ratio (16:9)
          const videoAspect = videoElement.videoWidth / videoElement.videoHeight;
          const canvasAspect = canvas.width / canvas.height;
  
          let drawWidth, drawHeight, offsetX, offsetY;
  
          if (videoAspect > canvasAspect) {
            // Video is wider, fit to width
            drawWidth = canvas.width;
            drawHeight = canvas.width / videoAspect;
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2; // Center vertically
          } else {
            // Video is taller, fit to height
            drawHeight = canvas.height;
            drawWidth = canvas.height * videoAspect;
            offsetX = (canvas.width - drawWidth) / 2; // Center horizontally
            offsetY = 0;
          }
  
          ctx.fillStyle = "black"; // Add black background
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(videoElement, offsetX, offsetY, drawWidth, drawHeight);
        }
      } else if (selectedSource === "screen" && screenStream) {
        if (!screenVideo) {
          screenVideo = document.createElement("video");
          screenVideo.srcObject = screenStream;
          screenVideo.play();
        }
        ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
        
        // SHOW WEBCAM TOO IF EXISTS
        const webcamWidth = 160;
        const webcamHeight = 120;
        const webcamX = 20; // Left margin
        const webcamY = canvas.height - webcamHeight - 20; // Bottom margin

        const screenPreview = document.getElementById("screen-preview");
        if (screenPreview && screenPreview.readyState === 4) {
          ctx.drawImage(screenPreview, 0, 0, canvas.width, canvas.height);
          // Draw the webcam overlay on top of preview 
          if (videoRef.current)
            ctx.drawImage(videoRef.current, webcamX, webcamY, webcamWidth, webcamHeight);
        }

        // ✅ Ensure webcam is available before drawing
        if (videoRef.current)
          ctx.drawImage(videoRef.current, webcamX, webcamY, webcamWidth, webcamHeight);

      } else if (selectedSource == "/welcome.jpg" || selectedSource == "/thank_you.jpg" ) {
        if (!img) {
          console.log(`TRYING TO LOAD WELCOME OR THANK YOU IMAGE`);
          img = new Image();
          img.src = selectedSource;
          img.onload = () => {
            console.log(`✅ Image loaded successfully: ${selectedSource}`);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
          img.onerror = (err) => {
            console.error(`❌ Error loading image: ${selectedSource}`, err);
          };
        } else {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      }
      
      if (isOverlayEnabled) {
        // console.log("isOverlayEnabled : ", isOverlayEnabled);
        overlayImage.src = "/overlay-without-background.png";
    
        // overlayImage.onload = () => {
        //   console.log("✅ Overlay image loaded successfully.");
        // };
        ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);
      } 

      if (isTextOverlayEnabled && overlayText.trim() !== "") {
        // console.log("Drawing text overlay...");
        const textX = 20; // Left margin
        const textY = canvas.height - 30; // Bottom margin
      
        // Draw background rectangle
        const textWidth = ctx.measureText(overlayText).width + 20;
        ctx.fillStyle = "rgba(0, 0, 255, 0.7)"; // Semi-transparent blue
        ctx.fillRect(textX - 10, textY - 20, textWidth, 40); // Background box
      
        // Draw text
        ctx.fillStyle = "white"; // Text color
        ctx.font = "bold 20px Arial";
        ctx.fillText(overlayText, textX, textY);
      }
      
      requestAnimationFrame(drawFrame);
    };
  
    drawFrame();
  }, [selectedSource, isOverlayEnabled, isTextOverlayEnabled, overlayText]);

  const startScreenSharing = async () => {
    try {
      if (!screenStream) { // Start screen share only if it's not already active
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        setScreenStream(stream);
        
        stream.getVideoTracks()[0].onended = () => {
          console.log("Screen sharing stopped.");
          setScreenStream(null); // Reset screen stream
          setSelectedSource("/welcome.jpg"); // Reset source
        };

        // Assign stream to preview element
        const screenPreview = document.getElementById("screen-preview");
        if (screenPreview) {
          screenPreview.srcObject = stream;
          screenPreview.play();
        }
      }
      setSelectedSource("screen"); // Switch to screen share
    } catch (err) {
      console.error("❌ Error accessing screen sharing:", err);
    }
  };
  
  const startStreaming = () => {
    if (!canvasRef.current) return;
    const stream = canvasRef.current.captureStream(25);

    const recorder = new MediaRecorder(stream, {
      audioBitsPerSecond: 128000,
      videoBitsPerSecond: 2500000,
      frameRate: 25,
    });

    recorder.ondataavailable = (event) => {
      socket.emit("binaryStream", accountId, event.data);
    };

    recorder.start(25);
    mediaRecorderRef.current = recorder;

    console.log("Streaming started...");

    // Request Twitch URL from backend
    socket.emit("startStream", accountId);

    // Listen for the Twitch URL
    socket.on("twitchUrl", (url) => {
      setTwitchUrl(url);
    });
  };

  const stopStreaming = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setTwitchUrl(null); // ✅ Hide the Twitch URL after stopping
      socket.emit("stopStream", accountId);
      console.log("Streaming stopped...");
    }
  };

  return (
    // <div className="flex justify-around h-screen bg-gray-900 text-white ">
    <div className="flex items-center justify-around h-screen bg-gray-900 text-white overflow-y-auto">

      {/* Left Section - Main Canvas Display */}
      <div className="flex flex-col items-center justify-center ">
        {/* Title */}
        <h1 className="top-4 text-3xl mb-6 font-bold w-full h-full text-center">Streaming Studio</h1>

        {/* Main Canvas - Reduced Size & Shifted Left */}
        <canvas ref={canvasRef} width={680} height={360} className="border border-gray-500 w-[680px] h-[360px]"></canvas>

        <div className="mt-4">  
          <button onClick={startStreaming} className="bg-green-500 px-4 py-2 mr-2">
            Start Stream
          </button>
          <button onClick={stopStreaming} className="bg-red-500 px-4 py-2">
            Stop Stream
          </button>
        </div>
        
        {/* {twitchUrl && (
          <div className="mt-4">
            <p className="text-lg">🔴 Streaming Live on twitch:</p>
            <a href={twitchUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
              {twitchUrl}
            </a>
          </div>
        )} */}

        {twitchUrl && (
          <div className="mt-12 p-3 bg-gray-800 rounded text-center w-[90%] max-w-3xl">
            <p className="text-lg">🔴 Streaming Live on Twitch:</p>
            <a href={twitchUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline break-all">
              {twitchUrl}
            </a>
          </div>
)}
      </div>

{/* Right Panel - Side-by-Side Source & Overlay Sections */}
<div className="w-1/3 p-4 bg-gray-800 flex flex-row justify-between min-h-screen gap-4 overflow-y-auto">

  {/* 🎥 Source Selection Section */}
  <div className="w-1/2 flex flex-col items-center space-y-4">
    <h2 className="text-lg font-bold mb-10">Select Source</h2>

    <div className="relative w-36 h-20 border border-gray-500 mb-4 cursor-pointer">
      {/* Show video if access is granted */}
      {!cameraDenied ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          className={`w-full h-full ${selectedSource === "webcam" ? "ring-2 ring-blue-500" : ""}`}
          onClick={() => setSelectedSource("webcam")}
        ></video>
      ) : (
        // Show message if camera is denied
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-sm font-bold">
          No Camera 
        </div>
      )}
    </div>

    <div className="relative w-36 h-20 border border-gray-500 cursor-pointer" onClick={startScreenSharing}>
      {/* Screen Preview */}
      <video id="screen-preview" autoPlay muted className="w-full h-full"></video>

      {!screenStream && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white text-sm font-bold">
          Click to Share Screen
        </div>
      )}
    </div>

    {/* Image Previews */}
    <img
      src="/welcome.jpg"
      alt="Welcome"
      className={`w-36 h-20 border border-gray-500 cursor-pointer ${
        selectedSource === "/welcome.jpg" ? "ring-2 ring-blue-500" : ""
      }`}
      onClick={() => setSelectedSource("/welcome.jpg")}
    />
    <img
      src="/thank_you.jpg"
      alt="Thank You"
      className={`w-36 h-20 border border-gray-500 cursor-pointer ${
        selectedSource === "/thank_you.jpg" ? "ring-2 ring-blue-500" : ""
      }`}
      onClick={() => setSelectedSource("/thank_you.jpg")}
    />
  </div>

  {/* 📌 Overlay Selection Section */}
  <div className="w-1/2 flex flex-col items-center space-y-4">
    <h2 className="text-lg font-bold mb-10">Select Overlay</h2>

    {/* Image Overlay Toggle */}
    <img
      src="/overlay-without-background.png"
      alt="Overlay"
      className={`w-36 h-20 border border-gray-500 cursor-pointer ${
        isOverlayEnabled ? "ring-2 ring-blue-500" : ""
      }`}
      onClick={() => {
        console.log("Toggled isOverlayEnabled:", !isOverlayEnabled);
        setIsOverlayEnabled((prev) => !prev)} } 
    />

    {/* Text Overlay Input */}
    <input
      type="text"
      value={overlayText}
      onChange={(e) => setOverlayText(e.target.value)}
      placeholder="Enter overlay text..."
      className="p-2 w-full border border-gray-500 bg-gray-700 text-white text-center rounded mb-2"
    />

    {/* Text Overlay Toggle */}
    <button
      className={`p-2 w-full text-center rounded ${
        isTextOverlayEnabled ? "bg-blue-500" : "bg-gray-600"
      }`}
      onClick={() => setIsTextOverlayEnabled((prev) => !prev)}
    >
      {isTextOverlayEnabled ? "Disable Text Overlay" : "Enable Text Overlay"}
    </button>

    <button 
      onClick={handleLogout} 
      className="mt-4 px-6 py-2 bg-red-500 text-white rounded">
      Logout
    </button>

  </div>

</div>
    </div>
  );
}

export default App;