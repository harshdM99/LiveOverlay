const userVideo = document.getElementById("user-video");
const streamButton = document.getElementById("start-stream-button");
const stopButton = document.getElementById("stop-stream-button");

const state = {media: null};
const socket = io();
let mediaBinaryData;

window.addEventListener("load", async e => {
    try {
        const media = await navigator
            .mediaDevices
            .getUserMedia({video: true, audio: true});
        userVideo.srcObject = media;
        state.media = media;
    } catch (error) {
        console.error("Error accessing media devices:", error);
        alert("Could not access your camera/microphone. Please grant permission.");
    }
});

streamButton.addEventListener("click", () => {
    mediaBinaryData = new MediaRecorder(state.media, {
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000,
        frameRate: 25
    })

    mediaBinaryData.ondataavailable = event => {
        // console.log("Binary stream available", event.data);
        socket.emit("binaryStream", event.data);
    }

    mediaBinaryData.start(25);
    console.log("Streaming started..");
});

stopButton.addEventListener("click", ()=> {
    if(mediaBinaryData) mediaBinaryData.stop();
    console.log("Streaming stopped..");
});