import { initializeApp, getApps } from "firebase/app";
import { initializeFirestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// 서버(Node.js) 환경: gRPC WebChannel 대신 HTTP Long-polling 사용 → GRPC stream 오류 방지
// 클라이언트(브라우저) 환경: 기본 WebChannel 사용
function createFirestore() {
  if (typeof window === 'undefined') {
    try {
      return initializeFirestore(app, { experimentalForceLongPolling: true });
    } catch {
      // 이미 초기화된 경우 (HMR 등)
      return getFirestore(app);
    }
  }
  return getFirestore(app);
}

export const db = createFirestore();
