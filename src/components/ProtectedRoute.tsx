import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '@/contexts/AuthContext';

// 공개 경로 정의
const publicRoutes = [
  '/', 
  '/login', 
  '/signup', 
  '/forgot-password', 
  '/magic-link-login',
  '/videos', 
  '/dashboard', 
  '/auth/callback', 
  '/error'
];

// 개발 모드 플래그
const DEV_MODE = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_CO_DEV_ENV === 'preview';

// 관리자 경로인지 확인
const isAdminRoute = (path: string) => {
  return path.startsWith('/admin');
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initializing } = useContext(AuthContext);
  const router = useRouter();
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);

  // 관리자 경로 권한 확인
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (initializing || !isAdminRoute(router.pathname) || !user) return;
      
      setIsCheckingAdmin(true);
      try {
        console.log('관리자 권한 확인 중...');
        const response = await fetch('/api/admin/check-admin', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          console.log('관리자 권한 확인됨');
          setIsAuthorized(true);
        } else {
          console.log('관리자 권한 없음, 관리자 로그인 페이지로 리디렉션');
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('관리자 권한 확인 오류:', error);
        router.push('/error');
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    if (isAdminRoute(router.pathname) && user && !isCheckingAdmin && !isAuthorized) {
      checkAdminAccess();
    }
  }, [user, initializing, router, isAuthorized, isCheckingAdmin]);

  // 일반 인증 확인 및 리디렉션
  useEffect(() => {
    if (initializing) return;
    
    if (redirectAttempted) return;
    
    // 로그인하지 않은 사용자가 보호된 경로에 접근할 경우
    if (!user && !publicRoutes.includes(router.pathname) && !router.pathname.includes('/auth/')) {
      console.log('인증되지 않은 사용자, 로그인으로 리디렉션');
      
      const redirectPath = encodeURIComponent(router.asPath);
      setRedirectAttempted(true);
      
      router.push(`/login?redirect=${redirectPath}`);
    }
  }, [user, initializing, router, redirectAttempted]);

  // 경로 변경 시 리디렉션 플래그 초기화
  useEffect(() => {
    setRedirectAttempted(false);
    if (!isAdminRoute(router.pathname)) {
      setIsAuthorized(false);
    }
  }, [router.pathname]);

  // 초기화 중 로딩 상태 표시
  if (initializing || (isAdminRoute(router.pathname) && isCheckingAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 공개 경로, 인증된 사용자, 개발 모드는 컨텐츠 표시
  if (
    DEV_MODE || 
    user || 
    publicRoutes.includes(router.pathname) || 
    router.pathname.includes('/auth/') ||
    (isAdminRoute(router.pathname) && isAuthorized)
  ) {
    return <>{children}</>;
  }

  // 리디렉션 중 로딩 표시
  if (redirectAttempted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return null;
};

export default ProtectedRoute;