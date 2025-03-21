import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
};

// 필수 환경 변수 확인
const validateConfig = () => {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'
  ];
  
  const missingVars = requiredVars.filter(
    varName => !process.env[varName]
  );
  
  if (missingVars.length > 0) {
    console.error(`필수 Firebase 환경 변수가 없습니다: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
};

let app: FirebaseApp;
let storage: FirebaseStorage;

try {
  const isConfigValid = validateConfig();
  
  if (!isConfigValid) {
    throw new Error('Firebase 설정이 유효하지 않습니다. 환경 변수를 확인하세요.');
  }
  
  if (!getApps().length) {
    console.log('Firebase 앱 초기화 중...');
    app = initializeApp(firebaseConfig);
    console.log('Firebase 앱 초기화 완료');
  } else {
    app = getApps()[0];
    console.log('기존 Firebase 앱 사용');
  }

  // Firebase Storage 초기화
  storage = getStorage(app);
  console.log(`Firebase Storage 초기화 완료. 버킷: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}`);
  
} catch (error) {
  console.error('Firebase 초기화 오류:', error);
  // 개발 환경에서 폴백 객체 생성
  if (process.env.NODE_ENV === 'development') {
    console.warn('개발 환경에서 임시 Firebase 객체를 생성합니다.');
    // @ts-ignore - 개발 목적으로만 사용
    app = { name: 'fallback-app' } as FirebaseApp;
    // @ts-ignore - 개발 목적으로만 사용
    storage = {
      ref: () => ({
        put: () => Promise.reject(new Error('Firebase Storage가 초기화되지 않았습니다')),
        getDownloadURL: () => Promise.reject(new Error('Firebase Storage가 초기화되지 않았습니다')),
      }),
    } as FirebaseStorage;
  } else {
    // 프로덕션에서는 실제 객체 필요
    throw error;
  }
}

export { storage, app };