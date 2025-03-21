import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Upload, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import prisma from '@/lib/prisma';

interface Drama {
  id: string;
  title: string;
}

interface FileUploadProps {
  label: string;
  accept: string;
  onChange: (url: string) => void;
  fileType: 'video' | 'image';
}

const FileUpload: React.FC<FileUploadProps> = ({ label, accept, onChange, fileType }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('파일을 선택해주세요');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Firebase 연결 확인
      if (!storage) {
        throw new Error('Firebase Storage가 초기화되지 않았습니다. 환경 변수를 확인하세요.');
      }

      // 파일 크기 검증 (100MB 이하)
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다. (현재: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      }

      // Firebase Storage에 파일 업로드
      const timestamp = Date.now();
      const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_'); // 파일명 안전하게 변경
      const storageRef = ref(storage, `${fileType}s/${timestamp}-${fileName}`);
      
      console.log(`Firebase Storage에 ${fileType} 업로드 중:`, storageRef.fullPath);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // 업로드 진행 상황 업데이트
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`업로드 진행: ${progress.toFixed(2)}%`);
          setProgress(progress);
        },
        (error: any) => {
          // 업로드 에러 처리
          console.error('업로드 오류:', error);
          
          // Firebase 오류 코드에 따른 상세 메시지
          let errorMessage = '파일 업로드 중 오류가 발생했습니다';
          
          if (error.code) {
            switch (error.code) {
              case 'storage/unauthorized':
                errorMessage = '권한이 없습니다. 관리자 권한을 확인해주세요.';
                break;
              case 'storage/canceled':
                errorMessage = '업로드가 취소되었습니다.';
                break;
              case 'storage/unknown':
                errorMessage = '알 수 없는 오류가 발생했습니다.';
                break;
              default:
                errorMessage = `업로드 오류: ${error.code}`;
            }
          }
          
          setError(errorMessage);
          setUploading(false);
        },
        async () => {
          // 업로드 완료 후 다운로드 URL 가져오기
          try {
            console.log('업로드 완료, 다운로드 URL 가져오는 중...');
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('다운로드 URL:', downloadUrl);
            setUrl(downloadUrl);
            onChange(downloadUrl);
          } catch (urlError) {
            console.error('다운로드 URL 가져오기 오류:', urlError);
            setError('파일 URL을 가져오는 중 오류가 발생했습니다');
          } finally {
            setUploading(false);
          }
        }
      );
    } catch (error) {
      console.error('업로드 초기화 오류:', error);
      setError(error instanceof Error ? error.message : '파일 업로드를 시작할 수 없습니다. Firebase 설정을 확인해주세요.');
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={handleUpload} 
            disabled={!file || uploading}
            variant="outline"
          >
            <Upload className="mr-2 h-4 w-4" />
            업로드
          </Button>
        </div>
        
        {uploading && (
          <div className="space-y-1">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">{Math.round(progress)}% 완료</p>
          </div>
        )}
        
        {url && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>업로드 완료</AlertTitle>
            <AlertDescription className="text-xs break-all">
              {url}
            </AlertDescription>
          </Alert>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>오류</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

const SyncFirebaseContent: React.FC = () => {
  const { user } = useAuth();
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleSyncFirebase = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    setSyncError(null);
    setShowDetails(false);

    try {
      // Check if user is logged in
      if (!user) {
        throw new Error('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
      }

      console.log('Starting Firebase sync process...');
      
      const response = await fetch('/api/admin/sync-firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Firebase sync API returned error:', data);
        throw new Error(data.error || '동기화 중 오류가 발생했습니다');
      }

      console.log('Firebase sync completed successfully:', data);
      setSyncResult(data);
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
      setSyncError((error as Error).message || '동기화 중 오류가 발생했습니다');
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Firebase Storage 동기화</CardTitle>
        <CardDescription>
          Firebase Storage에 업로드된 비디오를 자동으로 서비스에 추가합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            이 기능은 Firebase Storage의 <code>videos</code> 폴더에 있는 모든 비디오 파일을 검색하고, 
            아직 데이터베이스에 등록되지 않은 비디오를 자동으로 추가합니다.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
            <h4 className="font-semibold mb-1">Firebase Storage 폴더 구조 안내:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>videos/</code> - 비디오 파일을 이 폴더에 직접 업로드하세요.</li>
              <li><code>images/</code> - 썸네일 이미지를 이 폴더에 업로드하세요. 비디오 파일과 같은 이름(확장자만 다름)으로 업로드하면 자동으로 연결됩니다.</li>
              <li>예시: <code>videos/my-video.mp4</code>와 <code>images/my-video.jpg</code></li>
            </ul>
            <p className="mt-2">Firebase Storage에 직접 파일을 업로드한 후 아래 버튼을 클릭하여 동기화하세요.</p>
          </div>
        </div>
        
        <Button 
          onClick={handleSyncFirebase} 
          disabled={syncLoading}
          className="w-full"
        >
          {syncLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              동기화 중...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Firebase Storage 동기화
            </>
          )}
        </Button>
        
        {syncResult && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>동기화 완료</AlertTitle>
            <AlertDescription>
              <p>{syncResult.message}</p>
              
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-green-800 border-green-300 hover:bg-green-100"
                >
                  {showDetails ? '상세 정보 숨기기' : '상세 정보 보기'}
                </Button>
              </div>
              
              {showDetails && (
                <div className="mt-4 space-y-4">
                  {syncResult.results.added.length > 0 && (
                    <div>
                      <p className="font-semibold">추가된 비디오 ({syncResult.results.added.length}개):</p>
                      <ul className="list-disc pl-5 text-sm">
                        {syncResult.results.added.map((item: any, index: number) => (
                          <li key={index}>{item.title} <span className="text-xs text-green-600">(파일명: {item.fileName})</span></li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {syncResult.results.existing.length > 0 && (
                    <div>
                      <p className="font-semibold">이미 등록된 비디오 ({syncResult.results.existing.length}개):</p>
                      <ul className="list-disc pl-5 text-sm">
                        {syncResult.results.existing.map((fileName: string, index: number) => (
                          <li key={index}>{fileName}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {syncResult.results.errors.length > 0 && (
                    <div>
                      <p className="font-semibold text-red-600">오류 발생 ({syncResult.results.errors.length}개):</p>
                      <ul className="list-disc pl-5 text-sm">
                        {syncResult.results.errors.map((error: any, index: number) => (
                          <li key={index}>
                            {error.fileName}: <span className="text-red-600">{error.error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {syncError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>오류</AlertTitle>
            <AlertDescription>{syncError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

const UploadPage: React.FC = () => {
  const { user, initializing } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Track if the component is still mounted
    let isMounted = true;
    
    const checkAdminStatus = async () => {
      // Don't do anything while authentication is initializing
      if (initializing) {
        return;
      }
      
      // If user is not logged in, redirect to admin login
      if (!user) {
        console.log('No user found, redirecting to admin login');
        router.push('/admin/login');
        return;
      }

      try {
        console.log('Checking admin status for user:', user.id);
        
        // For development purposes, you can uncomment this to bypass admin check
        // if (process.env.NODE_ENV === 'development') {
        //   setIsAdmin(true);
        //   setLoading(false);
        //   return;
        // }
        
        const response = await fetch('/api/admin/check-admin', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!isMounted) return;

        const data = await response.json();

        if (response.ok) {
          console.log('User is admin, allowing access');
          setIsAdmin(true);
          setAuthError(null);
        } else {
          console.log('User is not admin, redirecting to admin login page');
          // Redirect to admin login page instead of showing error
          router.push('/admin/login');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        if (isMounted) {
          setAuthError('Failed to verify admin status. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAdminStatus();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [user, initializing, router]);
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    duration: 60,
    isPremium: false,
    dramaId: '',
  });

  // Fetch dramas for the dropdown
  useEffect(() => {
    const fetchDramas = async () => {
      try {
        // 실제 API에서 드라마 목록 가져오기
        const response = await fetch('/api/dramas');
        if (response.ok) {
          const data = await response.json();
          setDramas(data);
        } else {
          // 개발용 목업 데이터
          setDramas([
            { id: '1', title: 'Crash Landing on You' },
            { id: '2', title: 'Goblin' },
            { id: '3', title: 'Itaewon Class' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching dramas:', error);
        // 개발용 목업 데이터
        setDramas([
          { id: '1', title: 'Crash Landing on You' },
          { id: '2', title: 'Goblin' },
          { id: '3', title: 'Itaewon Class' },
        ]);
      }
    };

    fetchDramas();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isPremium: checked }));
  };

  const handleDramaChange = (value: string) => {
    setFormData(prev => ({ ...prev, dramaId: value }));
  };

  const handleVideoUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, videoUrl: url }));
  };

  const handleThumbnailUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, thumbnailUrl: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);
    setError(null);

    try {
      // 서버에 에피소드 데이터 전송
      const response = await fetch('/api/episodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('에피소드 추가 실패');
      }

      setSuccess(true);
      
      // 폼 초기화
      setFormData({
        title: '',
        description: '',
        videoUrl: '',
        thumbnailUrl: '',
        duration: 60,
        isPremium: false,
        dramaId: '',
      });
    } catch (error) {
      console.error('Error adding episode:', error);
      setError('에피소드 추가 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (initializing || loading) {
    return (
      <>
        <Head>
          <title>관리자 - 비디오 업로드</title>
        </Head>
        <div className="container max-w-2xl py-10">
          <h1 className="text-3xl font-bold mb-6">관리자 페이지</h1>
          <div className="flex flex-col items-center justify-center p-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-muted-foreground">인증 확인 중...</p>
          </div>
        </div>
      </>
    );
  }

  // Show error if user is not an admin
  if (authError) {
    const [requestingAdmin, setRequestingAdmin] = useState(false);
    const [requestResult, setRequestResult] = useState<{success?: boolean; message?: string; error?: string} | null>(null);

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
          
          // Refresh the page after a short delay to reflect the new admin status
          setTimeout(() => {
            window.location.reload();
          }, 2000);
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
    
    return (
      <>
        <Head>
          <title>관리자 - 접근 거부</title>
        </Head>
        <div className="container max-w-2xl py-10">
          <h1 className="text-3xl font-bold mb-6">관리자 페이지</h1>
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">접근 거부</CardTitle>
              <CardDescription>
                이 페이지에 접근할 권한이 없습니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>인증 오류</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
              
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
              
              <div className="flex flex-col gap-2 mt-4">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Admin page content
  return (
    <>
      <Head>
        <title>관리자 - 비디오 업로드</title>
      </Head>
      <div className="container max-w-2xl py-10">
        <h1 className="text-3xl font-bold mb-6">관리자 페이지</h1>
        
        <Tabs defaultValue="upload" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">수동 업로드</TabsTrigger>
            <TabsTrigger value="sync">Firebase 동기화</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>새 에피소드 업로드</CardTitle>
                <CardDescription>
                  새로운 K-드라마 에피소드를 플랫폼에 추가합니다
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">에피소드 제목</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">설명</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <FileUpload
                    label="비디오 파일"
                    accept="video/*"
                    onChange={handleVideoUrlChange}
                    fileType="video"
                  />
                  
                  <FileUpload
                    label="썸네일 이미지"
                    accept="image/*"
                    onChange={handleThumbnailUrlChange}
                    fileType="image"
                  />
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration">재생 시간 (초)</Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      min="1"
                      value={formData.duration}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="drama">드라마</Label>
                    <Select
                      value={formData.dramaId}
                      onValueChange={handleDramaChange}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="드라마 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {dramas.map(drama => (
                          <SelectItem key={drama.id} value={drama.id}>
                            {drama.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPremium"
                      checked={formData.isPremium}
                      onCheckedChange={handleSwitchChange}
                    />
                    <Label htmlFor="isPremium">프리미엄 콘텐츠</Label>
                  </div>
                  
                  {success && (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertTitle>성공</AlertTitle>
                      <AlertDescription>에피소드가 성공적으로 추가되었습니다!</AlertDescription>
                    </Alert>
                  )}
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>오류</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? '업로드 중...' : '에피소드 업로드'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="sync">
            <SyncFirebaseContent />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default UploadPage;