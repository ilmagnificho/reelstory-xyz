import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

// Firebase 기능을 비활성화하는 옵션
const disableFirebase = process.env.NEXT_PUBLIC_DISABLE_FIREBASE === 'true';

// Firebase 모의 객체
const mockStorage = {
  ref: () => ({
    put: () => Promise.resolve({
      ref: {
        getDownloadURL: () => Promise.resolve('https://mock-firebase-url.com/example.jpg')
      }
    }),
    putString: () => Promise.resolve({
      ref: {
        getDownloadURL: () => Promise.resolve('https://mock-firebase-url.com/example.jpg')
      }
    }),
    getDownloadURL: () => Promise.resolve('https://mock-firebase-url.com/example.jpg')
  })
};

let app;
let storage;

if (disableFirebase) {
  console.log('Firebase 비활성화 모드로 실행 중');
  // @ts-ignore
  storage = mockStorage;
} else {
  // Firebase 설정
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  console.log('Firebase 설정:', {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '설정됨' : '없음',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  });

  try {
    // Firebase 초기화
    app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    console.log('Firebase 초기화 성공');
  } catch (error) {
    console.error('Firebase 초기화 오류:', error);
    // @ts-ignore
    storage = mockStorage;
  }
}

export { storage, app };