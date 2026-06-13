import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getMessaging, Messaging } from 'firebase/messaging';

// Helper to sanitize variables from env (remove trailing spaces, newlines, or carriage returns)
const sanitizeConfigValue = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\r\n]/g, '');
};

const firebaseConfig = {
  apiKey: sanitizeConfigValue((import.meta as any).env.VITE_FIREBASE_API_KEY),
  authDomain: sanitizeConfigValue((import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: sanitizeConfigValue((import.meta as any).env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: sanitizeConfigValue((import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: sanitizeConfigValue((import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: sanitizeConfigValue((import.meta as any).env.VITE_FIREBASE_APP_ID),
  measurementId: sanitizeConfigValue((import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID),
};

// Initialize Firebase App
console.log('Firebase Config Initialized:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 6)}... (length: ${firebaseConfig.apiKey.length})` : 'undefined'
});
const app = initializeApp(firebaseConfig);

// Initialize Firestore with Persistent Offline Cache (v10+ SDK syntax)
const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Initialize Auth
const auth: Auth = getAuth(app);

// Initialize Cloud Messaging (safe fallback if unsupported by browser)
let messaging: Messaging | null = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase Cloud Messaging is not supported in this browser:', error);
}

export { app, db, auth, messaging };
