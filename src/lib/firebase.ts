import { initializeApp, getApps } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Firebase 설정
// 참고: 실제 값은 환경 변수에서 가져옵니다
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase 초기화 (중복 초기화 방지)
let app;
if (!getApps().length) {
  console.log('Initializing Firebase app with config:', {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  });
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Firebase Storage 초기화
const storage = getStorage(app);

// 환경 변수 확인 로그
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 
    !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
  console.warn('Firebase environment variables are missing or incomplete');
}

export { storage, app };