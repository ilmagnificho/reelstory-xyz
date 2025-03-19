import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API: /api/episodes - Method:', req.method);
  
  // GET 요청 처리 (에피소드 목록 가져오기)
  if (req.method === 'GET') {
    try {
      // Get the user from the session
      const supabase = createClient(req, res);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('Unauthorized: No user found in session');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('Fetching episodes for user:', user.id);
      
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
  
  // POST 요청 처리 (새 에피소드 생성)
  else if (req.method === 'POST') {
    try {
      // 관리자 권한 확인
      const supabase = createClient(req, res);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('Unauthorized: No user found in session');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // 여기서 관리자 권한 확인 로직을 추가할 수 있습니다
      // 예: 사용자의 role이 'admin'인지 확인
      
      const { title, description, videoUrl, thumbnailUrl, duration, isPremium, dramaId } = req.body;
      
      console.log('Creating new episode:', { title, dramaId });
      
      // 필수 필드 확인
      if (!title || !videoUrl || !thumbnailUrl || !dramaId) {
        console.log('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // 새 에피소드 생성
      const newEpisode = await prisma.episode.create({
        data: {
          title,
          description,
          videoUrl,
          thumbnailUrl,
          duration: Number(duration),
          isPremium: Boolean(isPremium),
          dramaId,
        },
      });
      
      console.log('Episode created successfully:', newEpisode.id);
      return res.status(201).json(newEpisode);
    } catch (error) {
      console.error('Error creating episode:', error);
      return res.status(500).json({ error: 'Failed to create episode' });
    }
  }
  
  // 다른 HTTP 메서드는 허용하지 않음
  else {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}