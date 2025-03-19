import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API: /api/public/episodes - Method:', req.method);
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Fetching public episodes');
    
    // Get all episodes with their drama information
    const episodes = await prisma.episode.findMany({
      include: {
        drama: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log(`Found ${episodes.length} episodes`);
    
    return res.status(200).json(episodes);
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return res.status(500).json({ error: 'Failed to fetch episodes' });
  }
}