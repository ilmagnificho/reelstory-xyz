import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Lock } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const showControls = () => {
    setIsControlsVisible(true);
    
    // Clear any existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Set a new timeout to hide controls after 3 seconds
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setIsControlsVisible(false);
      }
    }, 3000);
  };

  // Auto-play when component mounts
  useEffect(() => {
    if (!isPremium && videoRef.current) {
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            // Hide controls after a delay
            setTimeout(() => {
              setIsControlsVisible(false);
            }, 3000);
          })
          .catch(error => {
            // Auto-play was prevented, show controls
            setIsPlaying(false);
            setIsControlsVisible(true);
          });
      }
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPremium]);

  useEffect(() => {
    const handleEnded = () => {
      setIsPlaying(false);
      setIsControlsVisible(true);
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
    <div 
      className="relative w-full h-full bg-black overflow-hidden"
      onClick={showControls}
      onTouchStart={showControls}
    >
      {isPremium && (
        <div className="absolute inset-0 bg-black/70 z-10 flex flex-col items-center justify-center text-white p-4">
          <div className="bg-gradient-to-r from-amber-500 to-amber-300 text-black font-bold py-1 px-3 rounded-full mb-4">
            {t('premium')}
          </div>
          <Lock size={48} className="mb-4 text-amber-400" />
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-center mb-4">This is premium content</p>
          <Button 
            onClick={onPremiumClick}
            className="bg-primary hover:bg-primary/90"
          >
            {t('unlock')}
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
        loop
        onClick={togglePlay}
      />
      
      {/* Minimal floating controls that fade out */}
      <div 
        className={`absolute bottom-4 right-4 p-2 bg-black/40 backdrop-blur-sm rounded-full transition-opacity duration-300 ${
          isControlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 h-10 w-10"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 h-10 w-10"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </Button>
        </div>
      </div>
      
      {/* Minimal title overlay that fades out */}
      <div 
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent transition-opacity duration-300 ${
          isControlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h3 className="text-white font-bold text-sm">{title}</h3>
      </div>
    </div>
  );
};

export default VerticalVideoPlayer;