import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Overlay from "./components/Overlay";

function App() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const socket = io('http://localhost:3000'); // Connect to backend WebSocket server
  
  useEffect(() => {
    async function getUserMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    }
    getUserMedia();
  }, []);

  const [mediaRecorder, setMediaRecorder] = useState(null);

  const startStreaming = () => {
    if (!stream) return;

    const recorder = new MediaRecorder(stream, {
      audioBitsPerSecond: 128000,
      videoBitsPerSecond: 2500000,
      frameRate: 25,
    });

    recorder.ondataavailable = (event) => {
      socket.emit("binaryStream", event.data);
    };

    recorder.start(25);
    setMediaRecorder(recorder);
    console.log("Streaming started...");
  };

  const stopStreaming = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      console.log("Streaming stopped...");
    }
  };

  const [overlayText, setOverlayText] = useState("");

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-4">Live Overlay Streaming</h1>
      <Overlay text={overlayText} />
      <video ref={videoRef} autoPlay muted className="border border-gray-500 w-1/2" />
      <div className="mt-4">
        <button onClick={startStreaming} className="bg-green-500 px-4 py-2 mr-2">
          Start Stream
        </button>
        <button onClick={stopStreaming} className="bg-red-500 px-4 py-2">
          Stop Stream
        </button>
      </div>
    </div>
  );
}

export default App;