import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API: /api/favorites - Method:', req.method);
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the user from the session
    const supabase = createClient({ req, res });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('Unauthorized: No user found in session');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`Fetching favorites for user: ${user.id}`);
    
    // Get all favorites for the user with episode and drama information
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: user.id,
      },
      include: {
        episode: {
          include: {
            drama: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`Found ${favorites.length} favorites`);
    
    // Transform the data to match the Episode interface
    const episodes = favorites.map(favorite => ({
      ...favorite.episode,
      isFavorite: true
    }));
    
    return res.status(200).json(episodes);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return res.status(500).json({ error: 'Failed to fetch favorites' });
  }
}