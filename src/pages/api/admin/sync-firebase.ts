import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';
import { storage } from '@/lib/firebase';
import { ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API: /api/admin/sync-firebase - Method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 관리자 권한 확인
    const supabase = createClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('Unauthorized: No user found in session');
      return res.status(401).json({ error: 'Unauthorized: Please log in to access this feature' });
    }
    
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    console.log(`Environment: ${process.env.NODE_ENV}, isDev: ${isDev}`);
    
    // Check if the user has admin role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    
    if (!dbUser || !dbUser.isAdmin) {
      console.log('Unauthorized: User does not have admin privileges');
      return res.status(403).json({ error: 'Forbidden: Admin privileges required' });
    }
    
    // 여기서 관리자 권한 확인 로직을 추가할 수 있습니다
    // 예: 사용자의 role이 'admin'인지 확인
    
    // Firebase Storage에서 videos 폴더의 모든 파일 목록 가져오기
    const videosRef = ref(storage, 'videos');
    const videosList = await listAll(videosRef);
    
    console.log(`Found ${videosList.items.length} videos in Firebase Storage`);
    
    // 이미 데이터베이스에 있는 videoUrl 목록 가져오기
    const existingVideos = await prisma.episode.findMany({
      select: { videoUrl: true }
    });
    const existingUrls = new Set(existingVideos.map(v => v.videoUrl));
    
    // 처리 결과를 저장할 배열
    const results = {
      added: [] as any[],
      existing: [] as string[],
      errors: [] as any[]
    };
    
    // 드라마 ID 가져오기 (첫 번째 드라마 사용)
    const firstDrama = await prisma.drama.findFirst();
    if (!firstDrama) {
      return res.status(400).json({ error: 'No drama found in database. Please create a drama first.' });
    }
    
    // 각 비디오 파일에 대해 처리
    for (const item of videosList.items) {
      try {
        // 파일 URL 가져오기
        const url = await getDownloadURL(item);
        
        // 이미 데이터베이스에 있는지 확인
        if (existingUrls.has(url)) {
          results.existing.push(item.name);
          continue;
        }
        
        // 메타데이터 가져오기
        const metadata = await getMetadata(item);
        
        // 썸네일 URL 생성 (같은 이름의 이미지 파일이 있다고 가정)
        const thumbnailName = item.name.replace(/\.[^/.]+$/, '.jpg'); // 확장자를 jpg로 변경
        const thumbnailRef = ref(storage, `images/${thumbnailName}`);
        let thumbnailUrl = '';
        
        try {
          thumbnailUrl = await getDownloadURL(thumbnailRef);
        } catch (error) {
          console.log(`Thumbnail not found for ${item.name}, using default`);
          // 기본 썸네일 URL 사용 (필요에 따라 수정)
          thumbnailUrl = 'https://via.placeholder.com/640x360?text=No+Thumbnail';
        }
        
        // 파일명에서 제목 추출 (확장자 제거)
        const title = item.name.replace(/\.[^/.]+$/, '').replace(/-/g, ' ');
        
        // 데이터베이스에 에피소드 추가
        const newEpisode = await prisma.episode.create({
          data: {
            title,
            description: `Automatically imported from Firebase Storage: ${item.name}`,
            videoUrl: url,
            thumbnailUrl,
            duration: 60, // 기본값, 실제 영상 길이를 알 수 없음
            isPremium: false,
            dramaId: firstDrama.id,
          },
        });
        
        results.added.push({
          id: newEpisode.id,
          title: newEpisode.title,
          fileName: item.name
        });
        
      } catch (error) {
        console.error(`Error processing video ${item.name}:`, error);
        results.errors.push({
          fileName: item.name,
          error: (error as Error).message
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Sync completed. Added: ${results.added.length}, Already existing: ${results.existing.length}, Errors: ${results.errors.length}`,
      results
    });
    
  } catch (error) {
    console.error('Error syncing with Firebase:', error);
    return res.status(500).json({ error: 'Failed to sync with Firebase Storage' });
  }
}