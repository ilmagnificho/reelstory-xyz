import React, { useEffect, useState } from "react";
import Head from "next/head";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import VerticalVideoPlayer from "@/components/VerticalVideoPlayer";

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [showVideo, setShowVideo] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<null | {
    videoUrl: string;
    thumbnailUrl: string;
    title: string;
    isPremium: boolean;
  }>(null);

  // Sample videos for the homepage
  const featuredVideos = [
    {
      id: "1",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-waving-her-hand-1228-large.mp4",
      thumbnailUrl: "https://assets.co.dev/95da6205-c8dc-42ac-a273-7db27ca3519d/image-f513fef.png",
      title: "Crash Landing on You - First Meeting",
      isPremium: false
    },
    {
      id: "2",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-couple-holding-hands-on-the-beach-1544-large.mp4",
      thumbnailUrl: "https://assets.co.dev/95da6205-c8dc-42ac-a273-7db27ca3519d/image-f513fef.png",
      title: "Goblin - The Confession",
      isPremium: false
    },
    {
      id: "3",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-under-multicolored-lights-1237-large.mp4",
      thumbnailUrl: "https://assets.co.dev/95da6205-c8dc-42ac-a273-7db27ca3519d/image-f513fef.png",
      title: "Itaewon Class - The Kiss",
      isPremium: false
    }
  ];

  const handleVideoClick = (video: typeof featuredVideos[0]) => {
    setSelectedVideo(video);
    setShowVideo(true);
  };

  return (
    <>
      <Head>
        <title>ReelStory - K-drama Short Videos</title>
        <meta name="description" content="Watch short K-drama videos on ReelStory. Perfect for Japanese K-drama fans." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-background min-h-screen flex flex-col">
        <header className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            ReelStory
          </h1>
          <LanguageSelector />
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full mx-auto text-center">
            <div className="mb-6">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                ReelStory
              </h1>
              <p className="text-lg mt-2 text-muted-foreground">
                短編韓国ドラマビデオ
              </p>
            </div>
            
            {/* Featured Videos Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-left">{t('featuredVideos')}</h2>
              <div className="grid grid-cols-2 gap-4">
                {featuredVideos.map((video) => (
                  <div 
                    key={video.id} 
                    className="relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => handleVideoClick(video)}
                  >
                    <Image 
                      src={video.thumbnailUrl} 
                      alt={video.title} 
                      fill 
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                      <h3 className="text-white text-sm font-medium">{video.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <Button 
                className="w-full text-lg py-6" 
                size="lg"
                onClick={() => router.push('/videos')}
              >
                {t('watchNow')}
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-lg py-6" 
                size="lg"
                onClick={() => router.push('/login')}
              >
                {t('alreadyHaveAccount')}
              </Button>
            </div>
            
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <h3 className="font-bold text-xl">100+</h3>
                <p className="text-sm text-muted-foreground">K-drama clips</p>
              </div>
              <div>
                <h3 className="font-bold text-xl">Free</h3>
                <p className="text-sm text-muted-foreground">To start</p>
              </div>
              <div>
                <h3 className="font-bold text-xl">日本語</h3>
                <p className="text-sm text-muted-foreground">Subtitles</p>
              </div>
            </div>
          </div>
        </main>
        
        {/* Fullscreen Video Modal */}
        {showVideo && selectedVideo && (
          <div className="fixed inset-0 z-50 bg-black">
            <div className="absolute top-4 right-4 z-50">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20"
                onClick={() => setShowVideo(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </Button>
            </div>
            <div className="h-full w-full">
              <VerticalVideoPlayer
                videoUrl={selectedVideo.videoUrl}
                thumbnailUrl={selectedVideo.thumbnailUrl}
                title={selectedVideo.title}
                isPremium={selectedVideo.isPremium}
                onPremiumClick={() => router.push('/signup')}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}