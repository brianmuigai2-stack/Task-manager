import React, { useState, useRef, useEffect } from 'react';

const VideoBackground = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef(null);
  
  const videos = [
    { src: '/videos/task-background.mp4', title: 'Abstract' },
    { src: '/videos/background-2.mp4', title: 'Nature' },
    { src: '/videos/background-3.mp4', title: 'City' },
    { src: '/videos/backgorund-1.mp4', title: 'Ocean' }
  ];

  const currentVideo = videos[currentVideoIndex];

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length);
  };

  const prevVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [currentVideoIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      nextVideo();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="video-background">
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          playsInline 
          loop 
          preload="metadata"
        >
          <source src={currentVideo.src} type="video/mp4" />
        </video>
      </div>
      <div className="video-overlay"></div>
      <div className="bg-controls">
        <button onClick={prevVideo}>
          <i className="fas fa-chevron-left"></i>
        </button>
        <span>{currentVideo.title}</span>
        <button onClick={nextVideo}>
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </>
  );
};

export default VideoBackground;