import React, { useState, useEffect } from "react";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VerticalVideoPlayer from "@/components/VerticalVideoPlayer";
import EpisodeCard from "@/components/EpisodeCard";
import PremiumModal from "@/components/PremiumModal";
import { Heart, Home, Search, User, LogIn } from "lucide-react";
import { useRouter } from "next/router";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { GetStaticProps } from "next";
import prisma from '@/lib/prisma';

// Types
interface Episode {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  isPremium: boolean;
  duration: number;
  dramaId: string;
  drama: {
    title: string;
  };
}

interface VideosPageProps {
  initialEpisodes: Episode[];
}

export default function VideosPage({ initialEpisodes }: VideosPageProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  useEffect(() => {
    if (initialEpisodes.length > 0 && !currentEpisode) {
      // Start with a free episode by default
      const freeEpisode = initialEpisodes.find(ep => !ep.isPremium) || initialEpisodes[0];
      setCurrentEpisode(freeEpisode);
    }
  }, [initialEpisodes, currentEpisode]);

  const handleEpisodeClick = (episode: Episode) => {
    setCurrentEpisode(episode);
    if (episode.isPremium) {
      setIsPremiumModalOpen(true);
    }
  };

  const handlePremiumClick = () => {
    setIsPremiumModalOpen(true);
  };

  const handleSubscribe = () => {
    router.push('/signup');
  };

  return (
    <>
      <Head>
        <title>ReelStory - K-drama Short Videos</title>
        <meta name="description" content="Watch short K-drama videos on ReelStory. Perfect for Japanese K-drama fans." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Video Player - Takes full screen initially */}
        <div className="relative flex-1 w-full">
          {currentEpisode && (
            <div className="h-full">
              <VerticalVideoPlayer
                videoUrl={currentEpisode.videoUrl}
                thumbnailUrl={currentEpisode.thumbnailUrl}
                title={`${currentEpisode.drama.title} - ${currentEpisode.title}`}
                isPremium={currentEpisode.isPremium}
                onPremiumClick={handlePremiumClick}
              />
              
              {/* Floating Controls */}
              <div className="absolute top-4 right-4 flex space-x-2 z-20">
                <LanguageSelector />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20"
                  onClick={() => router.push('/login')}
                >
                  <LogIn size={20} />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Sheet with Episodes */}
        <div className="bg-background rounded-t-3xl -mt-16 pt-4 z-10 shadow-lg">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
          
          <Tabs defaultValue="trending" className="w-full px-4">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="trending">{t('trending')}</TabsTrigger>
              <TabsTrigger value="new">{t('new')}</TabsTrigger>
              <TabsTrigger value="favorites">{t('favorites')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="trending" className="mt-0">
              <div className="grid grid-cols-2 gap-4 pb-20">
                {episodes.map((episode) => (
                  <EpisodeCard
                    key={episode.id}
                    id={episode.id}
                    title={`${episode.drama.title} - ${episode.title}`}
                    thumbnailUrl={episode.thumbnailUrl}
                    duration={episode.duration}
                    isPremium={episode.isPremium}
                    onClick={() => handleEpisodeClick(episode)}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="new" className="mt-0">
              <div className="grid grid-cols-2 gap-4 pb-20">
                {episodes
                  .sort((a, b) => (a.id > b.id ? -1 : 1))
                  .map((episode) => (
                    <EpisodeCard
                      key={episode.id}
                      id={episode.id}
                      title={`${episode.drama.title} - ${episode.title}`}
                      thumbnailUrl={episode.thumbnailUrl}
                      duration={episode.duration}
                      isPremium={episode.isPremium}
                      onClick={() => handleEpisodeClick(episode)}
                    />
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="favorites" className="mt-0">
              <div className="text-center py-8 pb-20">
                <p className="text-muted-foreground mb-4">{t('login')} to save favorites</p>
                <Button onClick={() => router.push('/login')}>
                  {t('login')}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
          <nav className="flex justify-around p-3">
            <Button variant="ghost" size="icon" className="flex flex-col items-center text-xs">
              <Home size={20} className="mb-1" />
              <span>{t('home')}</span>
            </Button>
            <Button variant="ghost" size="icon" className="flex flex-col items-center text-xs">
              <Search size={20} className="mb-1" />
              <span>{t('search')}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="flex flex-col items-center text-xs"
              onClick={() => router.push('/login')}
            >
              <Heart size={20} className="mb-1" />
              <span>{t('favorites')}</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="flex flex-col items-center text-xs"
              onClick={() => router.push('/login')}
            >
              <User size={20} className="mb-1" />
              <span>{t('profile')}</span>
            </Button>
          </nav>
        </div>

        {/* Premium Modal */}
        <PremiumModal
          isOpen={isPremiumModalOpen}
          onClose={() => setIsPremiumModalOpen(false)}
          onSubscribe={handleSubscribe}
        />
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // This is a placeholder for real data
  // In a real app, you would fetch this from your database
  const mockEpisodes = [
    {
      id: "1",
      title: "First Meeting",
      description: "The main characters meet for the first time",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-waving-her-hand-1228-large.mp4",
      thumbnailUrl: "https://assets.co.dev/95da6205-c8dc-42ac-a273-7db27ca3519d/image-f513fef.png",
      isPremium: false,
      duration: 180,
      dramaId: "1",
      drama: {
        title: "Crash Landing on You"
      }
    },
    {
      id: "2",
      title: "The Confession",
      description: "An emotional confession scene",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-couple-holding-hands-on-the-beach-1544-large.mp4",
      thumbnailUrl: "https://assets.co.dev/95da6205-c8dc-42ac-a273-7db27ca3519d/image-f513fef.png",
      isPremium: true,
      duration: 240,
      dramaId: "1",
      drama: {
        title: "Crash Landing on You"
      }
    },
    {
      id: "3",
      title: "The Kiss",
      description: "The first kiss scene",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-under-multicolored-lights-1237-large.mp4",
      thumbnailUrl: "https://assets.co.dev/95da6205-c8dc-42ac-a273-7db27ca3519d/image-f513fef.png",
      isPremium: false,
      duration: 120,
      dramaId: "2",
      drama: {
        title: "Goblin"
      }
    },
    {
      id: "4",
      title: "The Breakup",
      description: "A heartbreaking scene",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-walking-under-a-bridge-2919-large.mp4",
      thumbnailUrl: "https://assets.co.dev/95da6205-c8dc-42ac-a273-7db27ca3519d/image-f513fef.png",
      isPremium: true,
      duration: 300,
      dramaId: "2",
      drama: {
        title: "Goblin"
      }
    }
  ];

  return {
    props: {
      initialEpisodes: mockEpisodes,
    },
    revalidate: 3600, // Revalidate every hour
  };
};