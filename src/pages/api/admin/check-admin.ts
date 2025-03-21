import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { createClient } from '@/util/supabase/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('API: /api/admin/check-admin - Method:', req.method);
  
  if (req.method === 'GET') {
    try {
      // 세션에서 사용자 가져오기
      const supabase = createClient(req, res);
      console.log('사용자 인증 확인 중...');
      
      // 세션에서 사용자 가져오기
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('인증 오류:', authError);
        return res.status(401).json({ 
          error: '인증 오류', 
          message: authError.message,
          details: '세션이 만료되었을 수 있습니다. 다시 로그인해주세요.'
        });
      }
      
      if (!user) {
        console.log('인증되지 않음: 세션에서 사용자를 찾을 수 없음');
        return res.status(401).json({ 
          error: '인증되지 않음', 
          message: '이 기능에 접근하려면 로그인하세요',
          details: '현재 세션에서 사용자를 찾을 수 없습니다'
        });
      }
      
      console.log('사용자 인증됨:', user.id);
      
      // 개발 환경에서 모든 사용자에게 관리자 권한 부여 옵션
      if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ADMIN_BYPASS === 'true') {
        console.log('개발 환경에서 관리자 권한 우회 활성화');
        return res.status(200).json({ isAdmin: true });
      }
      
      try {
        // 사용자가 관리자 역할을 가지고 있는지 확인
        console.log('사용자 관리자 상태 확인 중:', user.id);
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        
        if (!dbUser) {
          console.log('데이터베이스에서 사용자를 찾을 수 없음:', user.id);
          
          // 사용자 레코드가 없으면 생성
          try {
            console.log('데이터베이스에 사용자 레코드 생성 시도 중');
            await prisma.user.create({
              data: {
                id: user.id,
                email: user.email || '',
                isAdmin: false, // 기본값은 관리자가 아님
              },
            });
            console.log('사용자 레코드 생성 성공');
            
            return res.status(403).json({ 
              error: '접근 금지', 
              message: '관리자 권한이 필요합니다',
              details: '계정이 생성되었지만 이 페이지에는 관리자 접근이 필요합니다'
            });
          } catch (createError) {
            console.error('사용자 레코드 생성 오류:', createError);
            return res.status(403).json({ 
              error: '접근 금지', 
              message: '데이터베이스에서 사용자를 찾을 수 없고 생성할 수 없습니다',
              details: '관리자에게 문의하세요'
            });
          }
        }
        
        console.log('데이터베이스에서 사용자 찾음, isAdmin:', dbUser.isAdmin);
        
        if (!dbUser.isAdmin) {
          console.log('인증되지 않음: 사용자에게 관리자 권한이 없음');
          return res.status(403).json({ 
            error: '접근 금지', 
            message: '관리자 권한이 필요합니다',
            details: '계정에 관리자 권한이 없습니다'
          });
        }
        
        // 사용자가 관리자임
        console.log('사용자 관리자 확인 성공:', user.id);
        return res.status(200).json({ isAdmin: true });
        
      } catch (dbError) {
        console.error('관리자 상태 확인 중 데이터베이스 오류:', dbError);
        return res.status(500).json({ 
          error: '데이터베이스 오류', 
          message: '데이터베이스에서 관리자 상태를 확인하지 못했습니다',
          details: '데이터베이스 연결 중 오류가 발생했습니다'
        });
      }
      
    } catch (error) {
      console.error('관리자 상태 확인 중 예상치 못한 오류:', error);
      return res.status(500).json({ 
        error: '서버 오류', 
        message: '예상치 못한 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    }
  } else if (req.method === 'POST') {
    // 관리자 권한 요청 처리
    try {
      const supabase = createClient(req, res);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return res.status(401).json({ 
          error: '인증되지 않음', 
          message: '인증이 필요합니다',
          details: authError?.message || '세션에서 사용자를 찾을 수 없습니다'
        });
      }
      
      // 관리자 권한이 있는 사용자가 있는지 확인
      const adminCount = await prisma.user.count({
        where: { isAdmin: true }
      });
      
      // 현재 사용자 가져오기
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      
      if (!dbUser) {
        return res.status(404).json({
          error: '찾을 수 없음',
          message: '데이터베이스에서 사용자를 찾을 수 없습니다',
          details: '계정이 시스템에 제대로 등록되지 않았습니다'
        });
      }
      
      // 관리자가 아직 없으면 이 사용자를 관리자로 설정
      if (adminCount === 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { isAdmin: true }
        });
        
        console.log(`사용자 ${user.id}에게 첫 번째 관리자로서 관리자 권한이 부여되었습니다`);
        
        return res.status(200).json({
          success: true,
          message: '관리자 권한이 부여되었습니다',
          details: '시스템의 첫 번째 사용자로서 이제 관리자입니다'
        });
      } else {
        // 이미 관리자가 있어 자동으로 관리자 권한을 부여할 수 없음
        return res.status(403).json({
          error: '접근 금지',
          message: '관리자 권한을 부여할 수 없습니다',
          details: '시스템에 이미 관리자 사용자가 있습니다. 기존 관리자에게 문의하세요.'
        });
      }
    } catch (error) {
      console.error('관리자 요청 오류:', error);
      return res.status(500).json({
        error: '서버 오류',
        message: '관리자 요청 처리 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    }
  } else {
    console.log('허용되지 않은 메서드:', req.method);
    return res.status(405).json({ error: '허용되지 않은 메서드' });
  }
}