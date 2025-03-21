import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase 설정
// 참고: 실제 값은 환경 변수에서 가져옵니다
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
};

// 환경 변수 확인 로그
const missingVars: string[] = [];
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) missingVars.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
if (!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) missingVars.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
if (!process.env.NEXT_PUBLIC_FIREBASE_APP_ID) missingVars.push('NEXT_PUBLIC_FIREBASE_APP_ID');

if (missingVars.length > 0) {
  console.warn(`Firebase environment variables are missing: ${missingVars.join(', ')}`);
}

// Firebase 초기화 (중복 초기화 방지)
let app: FirebaseApp;
let storage: FirebaseStorage;

try {
  if (!getApps().length) {
    console.log('Initializing Firebase app with config:', {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
    
    // Validate required config
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.storageBucket) {
      throw new Error('Missing required Firebase configuration');
    }
    
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // Firebase Storage 초기화
  storage = getStorage(app);
  
  // 스토리지 버킷 정보 로깅
  const bucket = storage.bucket || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  console.log(`Firebase initialized successfully. Storage bucket: ${bucket}`);
  
  // 환경 변수 확인
  if (typeof window === 'undefined') {
    // 서버 사이드에서만 실행
    console.log('Firebase Storage configuration check:');
    console.log(`- API Key: ${firebaseConfig.apiKey ? 'Set' : 'Missing'}`);
    console.log(`- Auth Domain: ${firebaseConfig.authDomain ? 'Set' : 'Missing'}`);
    console.log(`- Project ID: ${firebaseConfig.projectId}`);
    console.log(`- Storage Bucket: ${firebaseConfig.storageBucket}`);
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Create fallback objects to prevent app from crashing
  // These will throw appropriate errors when used
  app = {} as FirebaseApp;
  storage = {} as FirebaseStorage;
}

export { storage, app };