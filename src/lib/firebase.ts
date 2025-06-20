import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase設定の検証
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBf57p5TjItSLUJjj_wLIghJYkj5kiE8Bs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "shift-app-982e5.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "shift-app-982e5",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "shift-app-982e5.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "205405548382",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:205405548382:web:d41755dc074714c7efe9cf"
};

// Firebase アプリの初期化（重複初期化を防ぐ）
let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error('Firebase initialization error:', error);
  // フォールバック: デフォルト設定で再試行
  app = initializeApp(firebaseConfig);
}

// Firestore データベースの初期化
export const db = getFirestore(app);

// Firebase Auth の初期化
export const auth = getAuth(app);

// Google認証プロバイダーの設定
export const googleProvider = new GoogleAuthProvider();

export default app; 