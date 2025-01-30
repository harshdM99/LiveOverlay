"use client";
import React, { useState, useRef, useEffect } from 'react';
import "../globals.css";

function main() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {

      if (videoRef.current) {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      }
    }).catch(err => {
      console.log("Stream error : ", err);
    })
  });

  return (
    <main>
      <h1>main Page</h1>
      <div className='App'>
        <video ref={videoRef} id="webcamVideo" autoPlay playsInline></video>

        {/* <video id="webcamVideo" autoPlay playsInline></video> */}
      </div>
    </main>
  )
}

export default main

function err(reason: any): PromiseLike<never> {
  throw new Error('Function not implemented.');
}
