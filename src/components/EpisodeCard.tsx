import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from 'next/image';

interface EpisodeCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: number;
  isPremium: boolean;
  onClick: () => void;
}

const EpisodeCard: React.FC<EpisodeCardProps> = ({
  id,
  title,
  thumbnailUrl,
  duration,
  isPremium,
  onClick
}) => {
  // Format duration from seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-0 relative">
        <div className="relative aspect-video w-full">
          <Image 
            src={thumbnailUrl} 
            alt={title}
            fill
            className="object-cover"
          />
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(duration)}
          </div>
          {isPremium && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-gradient-to-r from-amber-500 to-amber-300 text-black">
                PREMIUM
              </Badge>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-medium line-clamp-2">{title}</h3>
        </div>
      </CardContent>
    </Card>
  );
};

export default EpisodeCard;