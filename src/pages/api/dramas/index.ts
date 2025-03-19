import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API: /api/dramas - Method:', req.method);
  
  // GET 요청 처리 (드라마 목록 가져오기)
  if (req.method === 'GET') {
    try {
      // 사용자 인증 확인
      const supabase = createClient(req, res);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('Unauthorized: No user found in session');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('Fetching dramas for user:', user.id);
      
      // 모든 드라마 가져오기
      const dramas = await prisma.drama.findMany({
        orderBy: {
          title: 'asc',
        },
      });
      
      console.log(`Found ${dramas.length} dramas`);
      
      return res.status(200).json(dramas);
    } catch (error) {
      console.error('Error fetching dramas:', error);
      return res.status(500).json({ error: 'Failed to fetch dramas' });
    }
  }
  
  // POST 요청 처리 (새 드라마 생성)
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
      
      const { title, description, imageUrl } = req.body;
      
      console.log('Creating new drama:', { title });
      
      // 필수 필드 확인
      if (!title) {
        console.log('Missing required fields');
        return res.status(400).json({ error: 'Title is required' });
      }
      
      // 새 드라마 생성
      const newDrama = await prisma.drama.create({
        data: {
          title,
          description: description || '',
          imageUrl: imageUrl || '',
        },
      });
      
      console.log('Drama created successfully:', newDrama.id);
      return res.status(201).json(newDrama);
    } catch (error) {
      console.error('Error creating drama:', error);
      return res.status(500).json({ error: 'Failed to create drama' });
    }
  }
  
  // 다른 HTTP 메서드는 허용하지 않음
  else {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }
}