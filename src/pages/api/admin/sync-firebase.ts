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
    
    // Firebase Storage 설정 확인
    console.log('Firebase Storage configuration:');
    console.log(`- Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
    console.log(`- Storage Bucket: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}`);
    
    // 먼저 루트 폴더 확인
    const rootRef = ref(storage, '');
    console.log('Checking root folder access...');
    try {
      const rootList = await listAll(rootRef);
      console.log(`Root folder contains ${rootList.prefixes.length} folders and ${rootList.items.length} files`);
      console.log('Root folders:', rootList.prefixes.map(p => p.name));
    } catch (rootError) {
      console.error('Error accessing root folder:', rootError);
      return res.status(500).json({ 
        error: 'Firebase Storage Access Error', 
        message: 'Could not access Firebase Storage root folder',
        details: (rootError as Error).message
      });
    }
    
    // Firebase Storage에서 videos 폴더의 모든 파일 목록 가져오기
    console.log('Attempting to access videos folder...');
    const videosRef = ref(storage, 'videos');
    const videosList = await listAll(videosRef);
    
    console.log(`Found ${videosList.items.length} videos in Firebase Storage`);
    
    // 디버깅을 위해 찾은 비디오 파일 이름 로깅
    if (videosList.items.length > 0) {
      console.log('Videos found in Firebase Storage:');
      videosList.items.forEach(item => {
        console.log(`- ${item.name} (${item.fullPath})`);
      });
    } else {
      console.log('No videos found in Firebase Storage. Please check the folder path and permissions.');
    }
    
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
        console.log(`Processing video file: ${item.name} (${item.fullPath})`);
        
        // 파일 URL 가져오기
        let url;
        try {
          url = await getDownloadURL(item);
          console.log(`Got download URL: ${url.substring(0, 100)}...`);
        } catch (urlError) {
          console.error(`Error getting download URL for ${item.name}:`, urlError);
          throw new Error(`Failed to get download URL: ${(urlError as Error).message}`);
        }
        
        // 이미 데이터베이스에 있는지 확인
        if (existingUrls.has(url)) {
          console.log(`Video already exists in database: ${item.name}`);
          results.existing.push(item.name);
          continue;
        }
        
        // 메타데이터 가져오기
        let metadata;
        try {
          metadata = await getMetadata(item);
          console.log(`Got metadata for ${item.name}:`, {
            contentType: metadata.contentType,
            size: metadata.size,
            updated: metadata.updated
          });
        } catch (metaError) {
          console.warn(`Could not get metadata for ${item.name}:`, metaError);
          // 메타데이터 없이도 계속 진행
        }
        
        // 썸네일 URL 생성 (여러 가능한 경로 시도)
        const fileNameWithoutExt = item.name.replace(/\.[^/.]+$/, '');
        let thumbnailUrl = '';
        const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        const possiblePaths = [
          ...possibleExtensions.map(ext => `images/${fileNameWithoutExt}${ext}`),
          ...possibleExtensions.map(ext => `thumbnails/${fileNameWithoutExt}${ext}`),
          ...possibleExtensions.map(ext => `videos/thumbnails/${fileNameWithoutExt}${ext}`)
        ];
        
        // 가능한 모든 썸네일 경로 시도
        for (const path of possiblePaths) {
          try {
            console.log(`Trying thumbnail path: ${path}`);
            const thumbnailRef = ref(storage, path);
            thumbnailUrl = await getDownloadURL(thumbnailRef);
            console.log(`Found thumbnail at: ${path}`);
            break; // 썸네일을 찾으면 루프 종료
          } catch (error) {
            // 이 경로에서 썸네일을 찾지 못함, 다음 경로 시도
          }
        }
        
        // 썸네일을 찾지 못한 경우 기본값 사용
        if (!thumbnailUrl) {
          console.log(`No thumbnail found for ${item.name}, using default`);
          thumbnailUrl = 'https://via.placeholder.com/640x360?text=No+Thumbnail';
        }
        
        // 파일명에서 제목 추출 (확장자 제거)
        const title = fileNameWithoutExt.replace(/-/g, ' ');
        
        console.log(`Creating new episode in database: ${title}`);
        
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
        
        console.log(`Successfully added episode: ${newEpisode.id} - ${title}`);
        
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
    
    // 더 자세한 오류 정보 제공
    let errorMessage = 'Failed to sync with Firebase Storage';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }
    
    return res.status(500).json({ 
      error: 'Failed to sync with Firebase Storage',
      message: errorMessage,
      details: errorDetails
    });
  }
}