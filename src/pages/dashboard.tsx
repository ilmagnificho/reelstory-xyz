import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VerticalVideoPlayer from "@/components/VerticalVideoPlayer";
import EpisodeCard from "@/components/EpisodeCard";
import PremiumModal from "@/components/PremiumModal";
import { Heart, Home, Search, User } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import prisma from '@/lib/prisma';
import { GetServerSideProps } from "next";

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

interface DashboardProps {
  initialEpisodes: Episode[];
}

function Dashboard({ initialEpisodes }: DashboardProps) {
  const { user, signOut } = useAuth();
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  useEffect(() => {
    if (initialEpisodes.length > 0 && !currentEpisode) {
      setCurrentEpisode(initialEpisodes[0]);
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
    // This would be connected to a payment processor in a real app
    alert("Subscription feature would be implemented here");
    setIsPremiumModalOpen(false);
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <header className="border-b p-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            ReelStory
          </h1>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-md mx-auto p-4">
            {/* Video Player */}
            {currentEpisode && (
              <div className="mb-6">
                <VerticalVideoPlayer
                  videoUrl={currentEpisode.videoUrl}
                  thumbnailUrl={currentEpisode.thumbnailUrl}
                  title={`${currentEpisode.drama.title} - ${currentEpisode.title}`}
                  isPremium={currentEpisode.isPremium}
                  onPremiumClick={handlePremiumClick}
                />
              </div>
            )}

            {/* Episodes List */}
            <Tabs defaultValue="trending" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="trending">Trending</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
              </TabsList>
              
              <TabsContent value="trending" className="mt-0">
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Your favorites will appear here</p>
                  <Button variant="outline">Browse Episodes</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Bottom Navigation */}
        <div className="border-t">
          <nav className="flex justify-around p-3">
            <Button variant="ghost" size="icon" className="flex flex-col items-center text-xs">
              <Home size={20} className="mb-1" />
              <span>Home</span>
            </Button>
            <Button variant="ghost" size="icon" className="flex flex-col items-center text-xs">
              <Search size={20} className="mb-1" />
              <span>Search</span>
            </Button>
            <Button variant="ghost" size="icon" className="flex flex-col items-center text-xs">
              <Heart size={20} className="mb-1" />
              <span>Favorites</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="flex flex-col items-center text-xs"
              onClick={() => signOut()}
            >
              <User size={20} className="mb-1" />
              <span>Profile</span>
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
    </ProtectedRoute>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  // This is a placeholder for real data
  // In a real app, you would fetch this from your database
  const mockEpisodes = [
    {
      id: "1",
      title: "First Meeting",
      description: "The main characters meet for the first time",
      videoUrl: "https://example.com/video1.mp4",
      thumbnailUrl: "/images/rect.png",
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
      videoUrl: "https://example.com/video2.mp4",
      thumbnailUrl: "/images/rect.png",
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
      videoUrl: "https://example.com/video3.mp4",
      thumbnailUrl: "/images/rect.png",
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
      videoUrl: "https://example.com/video4.mp4",
      thumbnailUrl: "/images/rect.png",
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
  };
};

export default Dashboard;