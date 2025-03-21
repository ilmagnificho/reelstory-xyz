import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import GoogleButton from '@/components/GoogleButton';

const AdminLoginPage: React.FC = () => {
  const { user, signIn, initializing } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);
  const [requestingAdmin, setRequestingAdmin] = useState(false);
  const [requestResult, setRequestResult] = useState<{success?: boolean; message?: string; error?: string} | null>(null);

  // Check if user is already logged in and is admin
  useEffect(() => {
    if (initializing) return;
    
    if (user) {
      checkAdminStatus();
    }
  }, [user, initializing]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    setCheckingAdmin(true);
    try {
      const response = await fetch('/api/admin/check-admin', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setIsAdmin(true);
        // Redirect to admin upload page
        router.push('/admin/upload');
      } else {
        setIsAdmin(false);
        setError(data.message || 'You do not have admin privileges');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setError('Failed to verify admin status. Please try again.');
    } finally {
      setCheckingAdmin(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      // Admin status will be checked in the useEffect after login
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestAdminPrivileges = async () => {
    setRequestingAdmin(true);
    setRequestResult(null);
    
    try {
      const response = await fetch('/api/admin/check-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setRequestResult({
          success: true,
          message: data.message || 'Admin privileges granted successfully!'
        });
        
        // Refresh admin status after a short delay
        setTimeout(() => {
          checkAdminStatus();
        }, 1000);
      } else {
        setRequestResult({
          success: false,
          error: data.message || 'Failed to grant admin privileges'
        });
      }
    } catch (error) {
      console.error('Error requesting admin privileges:', error);
      setRequestResult({
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setRequestingAdmin(false);
    }
  };

  // Show loading state while checking authentication
  if (initializing || checkingAdmin) {
    return (
      <>
        <Head>
          <title>관리자 로그인</title>
        </Head>
        <div className="container max-w-md py-10">
          <h1 className="text-3xl font-bold mb-6 text-center">관리자 로그인</h1>
          <div className="flex flex-col items-center justify-center p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-muted-foreground">인증 확인 중...</p>
          </div>
        </div>
      </>
    );
  }

  // If user is logged in but not admin, show admin request option
  if (user && !isAdmin) {
    return (
      <>
        <Head>
          <title>관리자 권한 요청</title>
        </Head>
        <div className="container max-w-md py-10">
          <h1 className="text-3xl font-bold mb-6 text-center">관리자 권한 요청</h1>
          <Card>
            <CardHeader>
              <CardTitle>관리자 권한 필요</CardTitle>
              <CardDescription>
                이 페이지에 접근하려면 관리자 권한이 필요합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>접근 거부</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {requestResult && requestResult.success && (
                <Alert className="bg-green-50 border-green-200 text-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>성공</AlertTitle>
                  <AlertDescription>{requestResult.message}</AlertDescription>
                </Alert>
              )}
              
              {requestResult && !requestResult.success && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>오류</AlertTitle>
                  <AlertDescription>{requestResult.error}</AlertDescription>
                </Alert>
              )}
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                <p>
                  시스템에 아직 관리자가 없는 경우, 첫 번째 사용자가 관리자 권한을 요청할 수 있습니다.
                  이미 관리자가 있는 경우, 기존 관리자에게 권한 부여를 요청해야 합니다.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button 
                onClick={requestAdminPrivileges} 
                disabled={requestingAdmin || (requestResult?.success === true)}
                className="w-full"
              >
                {requestingAdmin ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    관리자 권한 요청 중...
                  </>
                ) : (
                  '관리자 권한 요청하기'
                )}
              </Button>
              
              <Button 
                onClick={() => router.push('/')} 
                variant="outline"
                className="w-full"
              >
                홈으로 돌아가기
              </Button>
            </CardFooter>
          </Card>
        </div>
      </>
    );
  }

  // Login form for non-authenticated users
  return (
    <>
      <Head>
        <title>관리자 로그인</title>
      </Head>
      <div className="container max-w-md py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">관리자 로그인</h1>
        <Card>
          <CardHeader>
            <CardTitle>관리자 계정으로 로그인</CardTitle>
            <CardDescription>
              관리자 기능을 사용하려면 로그인하세요
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>오류</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? '로그인 중...' : '로그인'}
              </Button>
              
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    또는
                  </span>
                </div>
              </div>
              
              <GoogleButton />
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/')}
                className="w-full"
              >
                홈으로 돌아가기
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
};

export default AdminLoginPage;