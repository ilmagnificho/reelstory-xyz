import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  console.log(`API: /api/episodes/${id} - Method:`, req.method);
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    console.log('Invalid episode ID:', id);
    return res.status(400).json({ error: 'Invalid episode ID' });
  }

  try {
    // Get the user from the session
    const supabase = createClient({ req, res });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('Unauthorized: No user found in session');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`Fetching episode ${id} for user:`, user.id);
    
    // Get the episode with its drama information
    const episode = await prisma.episode.findUnique({
      where: {
        id,
      },
      include: {
        drama: {
          select: {
            title: true,
            description: true,
          },
        },
      },
    });
    
    if (!episode) {
      console.log(`Episode ${id} not found`);
      return res.status(404).json({ error: 'Episode not found' });
    }
    
    console.log(`Found episode: ${episode.title}`);
    
    return res.status(200).json(episode);
  } catch (error) {
    console.error(`Error fetching episode ${id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch episode' });
  }
}