import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API: /api/favorites/toggle - Method:', req.method);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user from the session
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('Unauthorized: No user found in session');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { episodeId } = req.body;
    
    if (!episodeId) {
      console.log('Missing episodeId in request body');
      return res.status(400).json({ error: 'Missing episodeId' });
    }

    console.log(`Toggling favorite for episode ${episodeId} and user ${user.id}`);
    
    // Check if the favorite already exists
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_episodeId: {
          userId: user.id,
          episodeId,
        },
      },
    });

    let result;
    
    if (existingFavorite) {
      // If it exists, delete it
      console.log(`Removing favorite for episode ${episodeId}`);
      result = await prisma.favorite.delete({
        where: {
          id: existingFavorite.id,
        },
      });
      
      return res.status(200).json({ 
        message: 'Removed from favorites',
        isFavorite: false
      });
    } else {
      // If it doesn't exist, create it
      console.log(`Adding favorite for episode ${episodeId}`);
      result = await prisma.favorite.create({
        data: {
          userId: user.id,
          episodeId,
        },
      });
      
      return res.status(200).json({ 
        message: 'Added to favorites',
        isFavorite: true
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return res.status(500).json({ error: 'Failed to toggle favorite' });
  }
}