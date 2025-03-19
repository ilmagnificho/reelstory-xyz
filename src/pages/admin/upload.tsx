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
      // Firebase Storage에 파일 업로드
      const storageRef = ref(storage, `${fileType}s/${Date.now()}-${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // 업로드 진행 상황 업데이트
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          // 업로드 에러 처리
          console.error('Upload error:', error);
          setError('파일 업로드 중 오류가 발생했습니다');
          setUploading(false);
        },
        async () => {
          // 업로드 완료 후 다운로드 URL 가져오기
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setUrl(downloadUrl);
          onChange(downloadUrl);
          setUploading(false);
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      setError('파일 업로드 중 오류가 발생했습니다');
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
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSyncFirebase = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    setSyncError(null);

    try {
      const response = await fetch('/api/admin/sync-firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '동기화 중 오류가 발생했습니다');
      }

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
        <p className="text-sm text-muted-foreground">
          이 기능은 Firebase Storage의 <code>videos</code> 폴더에 있는 모든 비디오 파일을 검색하고, 
          아직 데이터베이스에 등록되지 않은 비디오를 자동으로 추가합니다.
        </p>
        
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
              {syncResult.results.added.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">추가된 비디오:</p>
                  <ul className="list-disc pl-5 text-sm">
                    {syncResult.results.added.map((item: any, index: number) => (
                      <li key={index}>{item.title}</li>
                    ))}
                  </ul>
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
  const { user } = useAuth();
  const router = useRouter();
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

  // 관리자 전용 페이지
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