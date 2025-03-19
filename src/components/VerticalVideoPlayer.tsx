import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface VerticalVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  isPremium: boolean;
  onPremiumClick?: () => void;
}

const VerticalVideoPlayer: React.FC<VerticalVideoPlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  title,
  isPremium,
  onPremiumClick
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (isPremium) {
      onPremiumClick?.();
      return;
    }
    
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    const handleEnded = () => {
      setIsPlaying(false);
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('ended', handleEnded);
    }

    return () => {
      if (video) {
        video.removeEventListener('ended', handleEnded);
      }
    };
  }, []);

  return (
    <div className="relative w-full max-w-[450px] mx-auto aspect-[9/16] bg-black rounded-lg overflow-hidden">
      {isPremium && (
        <div className="absolute inset-0 bg-black/70 z-10 flex flex-col items-center justify-center text-white p-4">
          <div className="bg-gradient-to-r from-amber-500 to-amber-300 text-black font-bold py-1 px-3 rounded-full mb-4">
            PREMIUM
          </div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-center mb-4">This is premium content. Subscribe to watch.</p>
          <Button 
            onClick={onPremiumClick}
            className="bg-primary hover:bg-primary/90"
          >
            Unlock Premium
          </Button>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl}
        className="w-full h-full object-cover"
        playsInline
        muted={isMuted}
      />
      
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <h3 className="text-white font-bold mb-2">{title}</h3>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VerticalVideoPlayer;